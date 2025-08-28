#!/usr/bin/env python
"""
2025-01-28: Update party references from text to foreign key IDs
Script to update the party field in t1 table before migration
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
from dirReactFinal_core.models import Party

def update_party_references():
    """Update party field in t1 table from text values to foreign key IDs"""
    try:
        with connection.cursor() as cursor:
            # Get all parties for mapping
            parties = Party.objects.all()
            party_map = {party.name: party.id for party in parties}
            
            print(f"Found {len(party_map)} parties for mapping")
            
            # Update the existing party_id column with foreign key IDs
            print("Updating party_id column with foreign key references...")
            updated_count = 0
            
            for party_name, party_id in party_map.items():
                cursor.execute("UPDATE t1 SET party_id = %s WHERE party = %s", (party_id, party_name))
                row_count = cursor.rowcount
                if row_count > 0:
                    print(f"  Updated {row_count} records for party '{party_name}' -> ID {party_id}")
                    updated_count += row_count
            
            print(f"\nTotal records updated: {updated_count}")
            
            # Verify the update
            cursor.execute("SELECT COUNT(*) FROM t1 WHERE party_id IS NOT NULL")
            with_party_id = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM t1")
            total_records = cursor.fetchone()[0]
            
            print(f"Records with party_id: {with_party_id}/{total_records}")
            
            if with_party_id > 0:
                print("SUCCESS: Party references updated successfully")
                return True
            else:
                print("ERROR: No party references were updated")
                return False
                
    except Exception as e:
        print(f"ERROR: Failed to update party references: {e}")
        return False

if __name__ == "__main__":
    print("Starting party reference update...")
    success = update_party_references()
    if success:
        print("\n✅ Party references updated successfully")
        print("You can now run: python manage.py migrate")
    else:
        print("\n❌ Party reference update failed")
        sys.exit(1)
