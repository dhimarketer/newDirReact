#!/usr/bin/env python3
# 2025-01-31: Standalone script to delete all family data for debugging and testing
# This script should be used with extreme caution as it permanently deletes all family data

import os
import sys
import django
from pathlib import Path

# Add the Django project directory to Python path
project_dir = Path(__file__).parent
sys.path.insert(0, str(project_dir))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from django.db import transaction
from django.conf import settings
import logging

from dirReactFinal_family.models import FamilyGroup, FamilyRelationship, FamilyMember

logger = logging.getLogger(__name__)


def delete_all_family_data(force=False, dry_run=False):
    """
    Delete all family data from the database.
    
    Args:
        force (bool): Skip confirmation prompt and force deletion
        dry_run (bool): Show what would be deleted without actually deleting anything
    """
    
    # Safety check - prevent accidental execution in production
    if not settings.DEBUG:
        print("ERROR: This script can only be run in DEBUG mode.")
        print("Set DEBUG=True in settings.py to enable this script.")
        return False

    # Get counts before deletion
    family_groups_count = FamilyGroup.objects.count()
    family_relationships_count = FamilyRelationship.objects.count()
    family_members_count = FamilyMember.objects.count()

    print(f'\n=== FAMILY DATA DELETION SCRIPT ===')
    print(f'This will delete ALL family data from the database:')
    print(f'- Family Groups: {family_groups_count}')
    print(f'- Family Relationships: {family_relationships_count}')
    print(f'- Family Members: {family_members_count}')
    print(f'=====================================\n')

    if dry_run:
        print(f'DRY RUN: Would delete {family_groups_count} family groups, '
              f'{family_relationships_count} relationships, and '
              f'{family_members_count} family members.')
        return True

    if not force:
        confirm = input(
            'Are you absolutely sure you want to delete ALL family data? '
            'This action cannot be undone! Type "DELETE ALL FAMILY DATA" to confirm: '
        )
        
        if confirm != "DELETE ALL FAMILY DATA":
            print('Operation cancelled. No data was deleted.')
            return False

    try:
        with transaction.atomic():
            # Delete in reverse order to respect foreign key constraints
            print('Deleting family relationships...')
            deleted_relationships = FamilyRelationship.objects.all().delete()
            print(f'Deleted {deleted_relationships[0]} family relationships')

            print('Deleting family members...')
            deleted_members = FamilyMember.objects.all().delete()
            print(f'Deleted {deleted_members[0]} family members')

            print('Deleting family groups...')
            deleted_groups = FamilyGroup.objects.all().delete()
            print(f'Deleted {deleted_groups[0]} family groups')

            # Log the deletion
            logger.warning(
                f'All family data deleted via script: '
                f'{deleted_groups[0]} groups, {deleted_members[0]} members, '
                f'{deleted_relationships[0]} relationships'
            )

            print(f'\n=== DELETION COMPLETE ===')
            print(f'Successfully deleted all family data:')
            print(f'- Family Groups: {deleted_groups[0]}')
            print(f'- Family Members: {deleted_members[0]}')
            print(f'- Family Relationships: {deleted_relationships[0]}')
            print(f'========================\n')

    except Exception as e:
        logger.error(f'Error deleting family data: {str(e)}')
        print(f'ERROR: Failed to delete family data: {str(e)}')
        return False

    # Verify deletion
    remaining_groups = FamilyGroup.objects.count()
    remaining_relationships = FamilyRelationship.objects.count()
    remaining_members = FamilyMember.objects.count()

    if remaining_groups == 0 and remaining_relationships == 0 and remaining_members == 0:
        print('Verification: All family data has been successfully deleted.')
        return True
    else:
        print(f'WARNING: Some data may remain - '
              f'Groups: {remaining_groups}, '
              f'Members: {remaining_members}, '
              f'Relationships: {remaining_relationships}')
        return False


def main():
    """Main function to handle command line arguments"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Delete all family data from the database. USE WITH EXTREME CAUTION!'
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='Skip confirmation prompt and force deletion',
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be deleted without actually deleting anything',
    )
    
    args = parser.parse_args()
    
    success = delete_all_family_data(force=args.force, dry_run=args.dry_run)
    
    if success:
        print('Script completed successfully.')
        sys.exit(0)
    else:
        print('Script failed or was cancelled.')
        sys.exit(1)


if __name__ == '__main__':
    main()
