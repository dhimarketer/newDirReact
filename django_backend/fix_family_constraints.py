#!/usr/bin/env python3
"""
2025-01-31: Script to fix family group constraints
Removes the unique constraint on address+island to allow multiple families at same address
"""

import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from django.db import connection
from django.db import transaction

def fix_family_constraints():
    """Remove unique constraint on address+island for family groups"""
    
    print("=== Fixing Family Group Constraints ===")
    
    try:
        with connection.cursor() as cursor:
            # Check if the constraint exists
            cursor.execute("""
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'family_groups' 
                AND constraint_type = 'UNIQUE'
                AND constraint_name LIKE '%address%'
            """)
            
            constraints = cursor.fetchall()
            print(f"Found {len(constraints)} unique constraints on address fields")
            
            for constraint in constraints:
                constraint_name = constraint[0]
                print(f"Removing constraint: {constraint_name}")
                
                # Drop the constraint
                cursor.execute(f"ALTER TABLE family_groups DROP CONSTRAINT {constraint_name}")
                print(f"✓ Dropped constraint: {constraint_name}")
            
            # Verify the constraint is gone
            cursor.execute("""
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'family_groups' 
                AND constraint_type = 'UNIQUE'
                AND constraint_name LIKE '%address%'
            """)
            
            remaining_constraints = cursor.fetchall()
            if not remaining_constraints:
                print("✓ All address-related unique constraints have been removed")
            else:
                print(f"⚠ Warning: {len(remaining_constraints)} constraints still remain")
                for constraint in remaining_constraints:
                    print(f"  - {constraint[0]}")
            
            # Check if parent_family field exists
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'family_groups' 
                AND column_name = 'parent_family'
            """)
            
            parent_field = cursor.fetchone()
            if parent_field:
                print("✓ parent_family field exists")
            else:
                print("⚠ parent_family field does not exist - you may need to run migrations")
            
            print("\n=== Constraint Fix Complete ===")
            print("You can now create multiple families at the same address")
            
    except Exception as e:
        print(f"❌ Error fixing constraints: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("Starting family constraint fix...")
    success = fix_family_constraints()
    
    if success:
        print("\n✅ Family constraints fixed successfully!")
        print("You can now test creating multiple families at the same address")
    else:
        print("\n❌ Failed to fix family constraints")
        sys.exit(1)
