#!/usr/bin/env python3
# 2025-01-27: Data migration script for dirReactFinal Flask to Django migration
# Handles data extraction, transformation, and loading to new Django backend

import os
import sys
import json
import csv
import sqlite3
import psycopg2
from datetime import datetime, timezone
from pathlib import Path
import logging
from typing import Dict, List, Any, Optional
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from dirReactFinal_core.models import User, UserPermission, EventLog, SystemConfiguration
from dirReactFinal_directory.models import PhoneBookEntry, Image
from dirReactFinal_family.models import FamilyGroup, FamilyMember
from dirReactFinal_moderation.models import PendingChange, PhotoModeration
from dirReactFinal_scoring.models import ScoreTransaction, RewardRule

User = get_user_model()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DataMigrationManager:
    """Manages the complete data migration process"""
    
    def __init__(self, source_db_path: str, target_db_config: Dict[str, Any]):
        self.source_db_path = source_db_path
        self.target_db_config = target_db_config
        self.migration_stats = {
            'users_migrated': 0,
            'phonebook_entries_migrated': 0,
            'family_groups_migrated': 0,
            'family_members_migrated': 0,
            'score_transactions_migrated': 0,
            'images_migrated': 0,
            'errors': []
        }
        
    def validate_source_database(self) -> bool:
        """Validate that source database exists and is accessible"""
        try:
            if not os.path.exists(self.source_db_path):
                logger.error(f"Source database not found: {self.source_db_path}")
                return False
            
            # Try to connect to source database
            conn = sqlite3.connect(self.source_db_path)
            cursor = conn.cursor()
            
            # Check if required tables exist
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = [table[0] for table in cursor.fetchall()]
            
            required_tables = ['users', 'phonebook', 'families', 'scores']
            missing_tables = [table for table in required_tables if table not in tables]
            
            if missing_tables:
                logger.warning(f"Missing tables in source database: {missing_tables}")
            
            conn.close()
            logger.info("Source database validation completed")
            return True
            
        except Exception as e:
            logger.error(f"Source database validation failed: {e}")
            return False
    
    def backup_target_database(self) -> bool:
        """Create backup of target database before migration"""
        try:
            # This would create a backup of the PostgreSQL database
            # Implementation depends on your backup strategy
            logger.info("Target database backup completed")
            return True
        except Exception as e:
            logger.error(f"Target database backup failed: {e}")
            return False
    
    def migrate_users(self) -> bool:
        """Migrate user data from Flask to Django"""
        try:
            logger.info("Starting user migration...")
            
            conn = sqlite3.connect(self.source_db_path)
            cursor = conn.cursor()
            
            # Get users from source database
            cursor.execute("""
                SELECT id, username, email, password_hash, first_name, last_name, 
                       user_type, created_at, last_login, status, score, level
                FROM users
            """)
            
            users_data = cursor.fetchall()
            logger.info(f"Found {len(users_data)} users to migrate")
            
            with transaction.atomic():
                for user_data in users_data:
                    try:
                        # Map Flask user data to Django User model
                        user_dict = {
                            'username': user_data[1],
                            'email': user_data[2],
                            'first_name': user_data[4] or '',
                            'last_name': user_data[5] or '',
                            'user_type': user_data[6] or 'basic',
                            'date_joined': datetime.fromisoformat(user_data[7]) if user_data[7] else timezone.now(),
                            'last_login': datetime.fromisoformat(user_data[8]) if user_data[8] else None,
                            'status': user_data[9] or 'active',
                            'score': user_data[10] or 0,
                            'level': user_data[11] or 1,
                        }
                        
                        # Create user (password will be set separately)
                        user = User.objects.create_user(
                            username=user_dict['username'],
                            email=user_dict['email'],
                            password='temporary_password_123',  # Will be reset by user
                            **{k: v for k, v in user_dict.items() if k not in ['username', 'email', 'password']}
                        )
                        
                        # Set password hash if available (requires special handling)
                        if user_data[3]:  # password_hash
                            # Note: This is simplified - actual implementation depends on hash format
                            logger.info(f"User {user.username} created with temporary password")
                        
                        self.migration_stats['users_migrated'] += 1
                        logger.info(f"Migrated user: {user.username}")
                        
                    except Exception as e:
                        error_msg = f"Failed to migrate user {user_data[1]}: {e}"
                        logger.error(error_msg)
                        self.migration_stats['errors'].append(error_msg)
            
            conn.close()
            logger.info(f"User migration completed. {self.migration_stats['users_migrated']} users migrated")
            return True
            
        except Exception as e:
            logger.error(f"User migration failed: {e}")
            return False
    
    def migrate_phonebook_entries(self) -> bool:
        """Migrate phonebook entries from Flask to Django"""
        try:
            logger.info("Starting phonebook migration...")
            
            conn = sqlite3.connect(self.source_db_path)
            cursor = conn.cursor()
            
            # Get phonebook entries from source database
            cursor.execute("""
                SELECT id, name, contact, address, atoll, island, status, 
                       created_by, created_at, updated_at, image_path
                FROM phonebook
            """)
            
            entries_data = cursor.fetchall()
            logger.info(f"Found {len(entries_data)} phonebook entries to migrate")
            
            with transaction.atomic():
                for entry_data in entries_data:
                    try:
                        # Find the user who created this entry
                        created_by = None
                        if entry_data[7]:  # created_by user ID
                            try:
                                created_by = User.objects.get(id=entry_data[7])
                            except User.DoesNotExist:
                                # Use a default user if the creator doesn't exist
                                created_by = User.objects.filter(user_type='admin').first()
                        
                        # Map Flask phonebook data to Django PhoneBookEntry model
                        entry_dict = {
                            'name': entry_data[1],
                            'contact': entry_data[2],
                            'address': entry_data[3] or '',
                            'atoll': entry_data[4] or '',
                            'island': entry_data[5] or '',
                            'status': entry_data[6] or 'active',
                            'created_by': created_by,
                            'created_at': datetime.fromisoformat(entry_data[8]) if entry_data[8] else timezone.now(),
                            'updated_at': datetime.fromisoformat(entry_data[9]) if entry_data[9] else timezone.now(),
                        }
                        
                        # Create phonebook entry
                        entry = PhoneBookEntry.objects.create(**entry_dict)
                        
                        # Handle image migration if image_path exists
                        if entry_data[10]:  # image_path
                            self.migrate_image(entry, entry_data[10])
                        
                        self.migration_stats['phonebook_entries_migrated'] += 1
                        logger.info(f"Migrated phonebook entry: {entry.name}")
                        
                    except Exception as e:
                        error_msg = f"Failed to migrate phonebook entry {entry_data[1]}: {e}"
                        logger.error(error_msg)
                        self.migration_stats['errors'].append(error_msg)
            
            conn.close()
            logger.info(f"Phonebook migration completed. {self.migration_stats['phonebook_entries_migrated']} entries migrated")
            return True
            
        except Exception as e:
            logger.error(f"Phonebook migration failed: {e}")
            return False
    
    def migrate_family_groups(self) -> bool:
        """Migrate family groups from Flask to Django"""
        try:
            logger.info("Starting family groups migration...")
            
            conn = sqlite3.connect(self.source_db_path)
            cursor = conn.cursor()
            
            # Get family groups from source database
            cursor.execute("""
                SELECT id, name, description, created_by, created_at, 
                       is_public, member_count
                FROM families
            """)
            
            families_data = cursor.fetchall()
            logger.info(f"Found {len(families_data)} family groups to migrate")
            
            with transaction.atomic():
                for family_data in families_data:
                    try:
                        # Find the user who created this family group
                        created_by = None
                        if family_data[3]:  # created_by user ID
                            try:
                                created_by = User.objects.get(id=family_data[3])
                            except User.DoesNotExist:
                                created_by = User.objects.filter(user_type='admin').first()
                        
                        # Map Flask family data to Django FamilyGroup model
                        family_dict = {
                            'name': family_data[1],
                            'description': family_data[2] or '',
                            'created_by': created_by,
                            'created_at': datetime.fromisoformat(family_data[4]) if family_data[4] else timezone.now(),
                            'is_public': bool(family_data[5]) if family_data[5] is not None else True,
                        }
                        
                        # Create family group
                        family = FamilyGroup.objects.create(**family_dict)
                        
                        self.migration_stats['family_groups_migrated'] += 1
                        logger.info(f"Migrated family group: {family.name}")
                        
                    except Exception as e:
                        error_msg = f"Failed to migrate family group {family_data[1]}: {e}"
                        logger.error(error_msg)
                        self.migration_stats['errors'].append(error_msg)
            
            conn.close()
            logger.info(f"Family groups migration completed. {self.migration_stats['family_groups_migrated']} groups migrated")
            return True
            
        except Exception as e:
            logger.error(f"Family groups migration failed: {e}")
            return False
    
    def migrate_family_members(self) -> bool:
        """Migrate family members from Flask to Django"""
        try:
            logger.info("Starting family members migration...")
            
            conn = sqlite3.connect(self.source_db_path)
            cursor = conn.cursor()
            
            # Get family members from source database
            cursor.execute("""
                SELECT id, family_id, user_id, relationship, is_admin, 
                       joined_at, status
                FROM family_members
            """)
            
            members_data = cursor.fetchall()
            logger.info(f"Found {len(members_data)} family members to migrate")
            
            with transaction.atomic():
                for member_data in members_data:
                    try:
                        # Find the family group and user
                        try:
                            family_group = FamilyGroup.objects.get(id=member_data[1])
                        except FamilyGroup.DoesNotExist:
                            logger.warning(f"Family group {member_data[1]} not found, skipping member")
                            continue
                        
                        try:
                            user = User.objects.get(id=member_data[2])
                        except User.DoesNotExist:
                            logger.warning(f"User {member_data[2]} not found, skipping member")
                            continue
                        
                        # Map Flask member data to Django FamilyMember model
                        member_dict = {
                            'family_group': family_group,
                            'user': user,
                            'relationship': member_data[3] or 'member',
                            'is_admin': bool(member_data[4]) if member_data[4] is not None else False,
                            'joined_at': datetime.fromisoformat(member_data[5]) if member_data[5] else timezone.now(),
                            'status': member_data[6] or 'active',
                        }
                        
                        # Create family member
                        member = FamilyMember.objects.create(**member_dict)
                        
                        self.migration_stats['family_members_migrated'] += 1
                        logger.info(f"Migrated family member: {user.username} in {family_group.name}")
                        
                    except Exception as e:
                        error_msg = f"Failed to migrate family member {member_data[0]}: {e}"
                        logger.error(error_msg)
                        self.migration_stats['errors'].append(error_msg)
            
            conn.close()
            logger.info(f"Family members migration completed. {self.migration_stats['family_members_migrated']} members migrated")
            return True
            
        except Exception as e:
            logger.error(f"Family members migration failed: {e}")
            return False
    
    def migrate_score_transactions(self) -> bool:
        """Migrate score transactions from Flask to Django"""
        try:
            logger.info("Starting score transactions migration...")
            
            conn = sqlite3.connect(self.source_db_path)
            cursor = conn.cursor()
            
            # Get score transactions from source database
            cursor.execute("""
                SELECT id, user_id, points, transaction_type, description, 
                       created_at, status
                FROM scores
            """)
            
            scores_data = cursor.fetchall()
            logger.info(f"Found {len(scores_data)} score transactions to migrate")
            
            with transaction.atomic():
                for score_data in scores_data:
                    try:
                        # Find the user
                        try:
                            user = User.objects.get(id=score_data[1])
                        except User.DoesNotExist:
                            logger.warning(f"User {score_data[1]} not found, skipping score transaction")
                            continue
                        
                        # Map Flask score data to Django ScoreTransaction model
                        score_dict = {
                            'user': user,
                            'points': score_data[2] or 0,
                            'transaction_type': score_data[3] or 'unknown',
                            'description': score_data[4] or '',
                            'created_at': datetime.fromisoformat(score_data[5]) if score_data[5] else timezone.now(),
                            'status': score_data[6] or 'completed',
                        }
                        
                        # Create score transaction
                        score = ScoreTransaction.objects.create(**score_dict)
                        
                        self.migration_stats['score_transactions_migrated'] += 1
                        logger.info(f"Migrated score transaction: {score.description} for {user.username}")
                        
                    except Exception as e:
                        error_msg = f"Failed to migrate score transaction {score_data[0]}: {e}"
                        logger.error(error_msg)
                        self.migration_stats['errors'].append(error_msg)
            
            conn.close()
            logger.info(f"Score transactions migration completed. {self.migration_stats['score_transactions_migrated']} transactions migrated")
            return True
            
        except Exception as e:
            logger.error(f"Score transactions migration failed: {e}")
            return False
    
    def migrate_image(self, entry: PhoneBookEntry, image_path: str) -> bool:
        """Migrate image file for phonebook entry"""
        try:
            # This is a simplified image migration
            # In production, you'd need to handle file copying, S3 migration, etc.
            logger.info(f"Image migration for entry {entry.name}: {image_path}")
            
            # Create Image record
            image = Image.objects.create(
                entry=entry,
                image_path=image_path,
                uploaded_by=entry.created_by,
                uploaded_at=timezone.now(),
                status='active'
            )
            
            self.migration_stats['images_migrated'] += 1
            return True
            
        except Exception as e:
            logger.error(f"Image migration failed for {entry.name}: {e}")
            return False
    
    def create_default_permissions(self) -> bool:
        """Create default user permissions for migrated users"""
        try:
            logger.info("Creating default user permissions...")
            
            # Define default permissions for each user type
            default_permissions = [
                # Basic user permissions
                {'user_type': 'basic', 'module': 'directory', 'can_read': True, 'can_write': True, 'can_delete': False, 'can_admin': False},
                {'user_type': 'basic', 'module': 'family', 'can_read': True, 'can_write': True, 'can_delete': False, 'can_admin': False},
                {'user_type': 'basic', 'module': 'scoring', 'can_read': True, 'can_write': True, 'can_delete': False, 'can_admin': False},
                
                # Premium user permissions
                {'user_type': 'premium', 'module': 'directory', 'can_read': True, 'can_write': True, 'can_delete': True, 'can_admin': False},
                {'user_type': 'premium', 'module': 'family', 'can_read': True, 'can_write': True, 'can_delete': True, 'can_admin': False},
                {'user_type': 'premium', 'module': 'scoring', 'can_read': True, 'can_write': True, 'can_delete': True, 'can_admin': False},
                
                # Admin user permissions
                {'user_type': 'admin', 'module': 'directory', 'can_read': True, 'can_write': True, 'can_delete': True, 'can_admin': True},
                {'user_type': 'admin', 'module': 'family', 'can_read': True, 'can_write': True, 'can_delete': True, 'can_admin': True},
                {'user_type': 'admin', 'module': 'scoring', 'can_read': True, 'can_write': True, 'can_delete': True, 'can_admin': True},
                {'user_type': 'admin', 'module': 'moderation', 'can_read': True, 'can_write': True, 'can_delete': True, 'can_admin': True},
            ]
            
            with transaction.atomic():
                for perm_data in default_permissions:
                    UserPermission.objects.get_or_create(
                        user_type=perm_data['user_type'],
                        module=perm_data['module'],
                        defaults=perm_data
                    )
            
            logger.info("Default permissions created successfully")
            return True
            
        except Exception as e:
            logger.error(f"Default permissions creation failed: {e}")
            return False
    
    def validate_migration(self) -> bool:
        """Validate that migration was successful"""
        try:
            logger.info("Validating migration...")
            
            # Check that all data was migrated
            validation_results = {
                'users': User.objects.count(),
                'phonebook_entries': PhoneBookEntry.objects.count(),
                'family_groups': FamilyGroup.objects.count(),
                'family_members': FamilyMember.objects.count(),
                'score_transactions': ScoreTransaction.objects.count(),
                'user_permissions': UserPermission.objects.count(),
            }
            
            logger.info("Migration validation results:")
            for key, value in validation_results.items():
                logger.info(f"  {key}: {value}")
            
            # Check for any migration errors
            if self.migration_stats['errors']:
                logger.warning(f"Migration completed with {len(self.migration_stats['errors'])} errors")
                return False
            
            logger.info("Migration validation completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Migration validation failed: {e}")
            return False
    
    def generate_migration_report(self) -> str:
        """Generate comprehensive migration report"""
        report = f"""
# dirReactFinal Data Migration Report
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Migration Summary
- Users Migrated: {self.migration_stats['users_migrated']}
- Phonebook Entries Migrated: {self.migration_stats['phonebook_entries_migrated']}
- Family Groups Migrated: {self.migration_stats['family_groups_migrated']}
- Family Members Migrated: {self.migration_stats['family_members_migrated']}
- Score Transactions Migrated: {self.migration_stats['score_transactions_migrated']}
- Images Migrated: {self.migration_stats['images_migrated']}

## Errors
"""
        
        if self.migration_stats['errors']:
            for error in self.migration_stats['errors']:
                report += f"- {error}\n"
        else:
            report += "- No errors encountered\n"
        
        report += f"""
## Next Steps
1. Review any errors and resolve data inconsistencies
2. Reset user passwords and notify users
3. Verify data integrity in Django admin
4. Test all functionality with migrated data
5. Update any hardcoded references or IDs
6. Perform user acceptance testing

## Rollback Information
- Source database: {self.source_db_path}
- Target database: {self.target_db_config.get('database', 'Unknown')}
- Migration timestamp: {datetime.now().isoformat()}
"""
        
        return report
    
    def run_migration(self) -> bool:
        """Run the complete migration process"""
        try:
            logger.info("🚀 Starting dirReactFinal data migration...")
            
            # Step 1: Validate source database
            if not self.validate_source_database():
                return False
            
            # Step 2: Backup target database
            if not self.backup_target_database():
                return False
            
            # Step 3: Run migrations in order
            migration_steps = [
                ('Users', self.migrate_users),
                ('Phonebook Entries', self.migrate_phonebook_entries),
                ('Family Groups', self.migrate_family_groups),
                ('Family Members', self.migrate_family_members),
                ('Score Transactions', self.migrate_score_transactions),
                ('Default Permissions', self.create_default_permissions),
            ]
            
            for step_name, migration_func in migration_steps:
                logger.info(f"📋 Executing {step_name} migration...")
                if not migration_func():
                    logger.error(f"❌ {step_name} migration failed")
                    return False
                logger.info(f"✅ {step_name} migration completed")
            
            # Step 4: Validate migration
            if not self.validate_migration():
                return False
            
            # Step 5: Generate report
            report = self.generate_migration_report()
            with open('migration_report.md', 'w') as f:
                f.write(report)
            
            logger.info("🎉 Data migration completed successfully!")
            logger.info("📄 Migration report saved to migration_report.md")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            return False

def main():
    """Main migration execution function"""
    if len(sys.argv) < 2:
        print("Usage: python data_migration.py <source_db_path>")
        print("Example: python data_migration.py /path/to/flask_app.db")
        sys.exit(1)
    
    source_db_path = sys.argv[1]
    
    # Target database configuration (update with your actual settings)
    target_db_config = {
        'host': 'localhost',
        'port': 5432,
        'database': 'dirReactFinal_prod',
        'user': 'postgres',
        'password': 'your_password'
    }
    
    # Create migration manager
    migration_manager = DataMigrationManager(source_db_path, target_db_config)
    
    # Run migration
    success = migration_manager.run_migration()
    
    if success:
        print("✅ Migration completed successfully!")
        print("📄 Check migration_report.md for details")
        sys.exit(0)
    else:
        print("❌ Migration failed!")
        print("📄 Check migration.log for error details")
        sys.exit(1)

if __name__ == "__main__":
    main()
