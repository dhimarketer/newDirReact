#!/usr/bin/env python
"""
2025-01-28: Fix all constraint issues before migration
Script to update existing NULL values to appropriate defaults for all fields
"""

import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from django.db import connection

def fix_all_constraints():
    """Fix all constraint issues by updating NULL values to appropriate defaults"""
    fixes = [
        {
            'field': 'contact',
            'default': "''",
            'description': 'contact field (empty string)'
        },
        {
            'field': 'change_status',
            'default': "'pending'",
            'description': 'change_status field (pending)'
        },
        {
            'field': 'name',
            'default': "'Unknown'",
            'description': 'name field (Unknown)'
        }
    ]
    
    try:
        with connection.cursor() as cursor:
            for fix in fixes:
                field = fix['field']
                default = fix['default']
                description = fix['description']
                
                print(f"\nFixing {description}...")
                
                # Count records with NULL values
                cursor.execute(f"SELECT COUNT(*) FROM t1 WHERE {field} IS NULL")
                null_count = cursor.fetchone()[0]
                print(f"  Found {null_count} records with NULL {field} values")
                
                if null_count > 0:
                    # Update NULL values to default
                    cursor.execute(f"UPDATE t1 SET {field} = {default} WHERE {field} IS NULL")
                    updated_count = cursor.rowcount
                    print(f"  Updated {updated_count} records with default value for {field}")
                    
                    # Verify the update
                    cursor.execute(f"SELECT COUNT(*) FROM t1 WHERE {field} IS NULL")
                    remaining_null = cursor.fetchone()[0]
                    print(f"  Remaining NULL {field} values: {remaining_null}")
                    
                    if remaining_null > 0:
                        print(f"  ERROR: Some NULL {field} values still exist")
                        return False
                    else:
                        print(f"  SUCCESS: All NULL {field} values have been fixed")
                else:
                    print(f"  No NULL {field} values found - no action needed")
            
            print("\nAll constraint fixes completed successfully!")
            return True
                
    except Exception as e:
        print(f"ERROR: Failed to fix constraints: {e}")
        return False

if __name__ == "__main__":
    print("Starting constraint fixes...")
    success = fix_all_constraints()
    if success:
        print("\n✅ All constraint fixes completed successfully")
        print("You can now run: python manage.py migrate")
    else:
        print("\n❌ Constraint fixes failed")
        sys.exit(1)
