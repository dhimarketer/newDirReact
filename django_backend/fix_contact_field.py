#!/usr/bin/env python
"""
2025-01-28: Fix contact field NULL constraint issue
Script to update existing NULL contact values to default value before migration
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

def fix_contact_field():
    """Update NULL contact values to default value to resolve migration constraint issue"""
    try:
        with connection.cursor() as cursor:
            # Count records with NULL contact
            cursor.execute("SELECT COUNT(*) FROM t1 WHERE contact IS NULL")
            null_count = cursor.fetchone()[0]
            print(f"Found {null_count} records with NULL contact values")
            
            if null_count > 0:
                # Update NULL contact values to empty string (default)
                cursor.execute("UPDATE t1 SET contact = '' WHERE contact IS NULL")
                updated_count = cursor.rowcount
                print(f"Updated {updated_count} records with empty string for contact field")
                
                # Verify the update
                cursor.execute("SELECT COUNT(*) FROM t1 WHERE contact IS NULL")
                remaining_null = cursor.fetchone()[0]
                print(f"Remaining NULL contact values: {remaining_null}")
                
                if remaining_null == 0:
                    print("SUCCESS: All NULL contact values have been fixed")
                    return True
                else:
                    print("ERROR: Some NULL contact values still exist")
                    return False
            else:
                print("No NULL contact values found - no action needed")
                return True
                
    except Exception as e:
        print(f"ERROR: Failed to fix contact field: {e}")
        return False

if __name__ == "__main__":
    print("Starting contact field fix...")
    success = fix_contact_field()
    if success:
        print("Contact field fix completed successfully")
        print("You can now run: python manage.py migrate")
    else:
        print("Contact field fix failed")
        sys.exit(1)
