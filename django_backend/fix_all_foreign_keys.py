#!/usr/bin/env python
"""
2025-01-28: Fix all foreign key relationships before migration
Script to populate island/atoll tables and update references in t1 table
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
from dirReactFinal_core.models import Island, Atoll

def extract_atoll_from_island(island_name):
    """Extract atoll code from island name (e.g., 'r. kinolhas' -> 'r')"""
    if '.' in island_name:
        return island_name.split('.')[0].strip().upper()
    return None

def populate_atoll_table():
    """Populate atoll table with unique atoll codes from island names"""
    try:
        with connection.cursor() as cursor:
            # Get all unique atoll codes from island names
            cursor.execute("SELECT DISTINCT island FROM t1 WHERE island IS NOT NULL AND island != ''")
            island_names = cursor.fetchall()
            
            atoll_codes = set()
            for island_record in island_names:
                island_name = island_record[0]
                atoll_code = extract_atoll_from_island(island_name)
                if atoll_code:
                    atoll_codes.add(atoll_code)
            
            print(f"Found {len(atoll_codes)} unique atoll codes: {sorted(atoll_codes)}")
            
            # Create Atoll objects
            atoll_map = {}
            for atoll_code in atoll_codes:
                if not Atoll.objects.filter(code=atoll_code).exists():
                    atoll = Atoll.objects.create(
                        name=f"Atoll {atoll_code}",
                        code=atoll_code,
                        is_active=True
                    )
                    atoll_map[atoll_code] = atoll.id
                    print(f"  Created atoll: {atoll_code} (ID: {atoll.id})")
                else:
                    atoll = Atoll.objects.get(code=atoll_code)
                    atoll_map[atoll_code] = atoll.id
                    print(f"  Atoll {atoll_code} already exists (ID: {atoll.id})")
            
            return atoll_map
                
    except Exception as e:
        print(f"ERROR: Failed to populate atoll table: {e}")
        return None

def populate_island_table(atoll_map):
    """Populate island table with island names and atoll references"""
    try:
        with connection.cursor() as cursor:
            # Get all unique island names
            cursor.execute("SELECT DISTINCT island FROM t1 WHERE island IS NOT NULL AND island != ''")
            island_names = cursor.fetchall()
            
            print(f"Processing {len(island_names)} unique island names...")
            
            island_map = {}
            created_count = 0
            
            for island_record in island_names:
                island_name = island_record[0]
                
                # Skip if island already exists
                if Island.objects.filter(name=island_name).exists():
                    island = Island.objects.get(name=island_name)
                    island_map[island_name] = island.id
                    continue
                
                # Extract atoll code
                atoll_code = extract_atoll_from_island(island_name)
                atoll_id = atoll_map.get(atoll_code) if atoll_code else None
                
                # Create island
                try:
                    island = Island.objects.create(
                        name=island_name,
                        atoll=atoll_code if atoll_code else '',
                        island_type='inhabited',
                        is_active=True
                    )
                    island_map[island_name] = island.id
                    created_count += 1
                    
                    if created_count % 10 == 0:
                        print(f"  Created {created_count} islands...")
                        
                except Exception as e:
                    print(f"  ERROR creating island '{island_name}': {e}")
                    continue
            
            print(f"Total islands created: {created_count}")
            print(f"Total islands in table: {len(island_map)}")
            
            return island_map
                
    except Exception as e:
        print(f"ERROR: Failed to populate island table: {e}")
        return None

def update_foreign_key_references(island_map, atoll_map):
    """Update t1 table to use foreign key IDs instead of text values"""
    try:
        with connection.cursor() as cursor:
            # Update island references
            print("Updating island references...")
            island_updated = 0
            for island_name, island_id in island_map.items():
                cursor.execute("UPDATE t1 SET island_fk_id = %s WHERE island = %s", (island_id, island_name))
                row_count = cursor.rowcount
                if row_count > 0:
                    island_updated += row_count
            
            print(f"  Updated {island_updated} island references")
            
            # Update atoll references
            print("Updating atoll references...")
            atoll_updated = 0
            for atoll_code, atoll_id in atoll_map.items():
                cursor.execute("UPDATE t1 SET atoll_fk_id = %s WHERE atoll = %s", (atoll_id, atoll_code))
                row_count = cursor.rowcount
                if row_count > 0:
                    atoll_updated += row_count
            
            print(f"  Updated {atoll_updated} atoll references")
            
            # Update party references (already done)
            cursor.execute("SELECT COUNT(*) FROM t1 WHERE party_id IS NOT NULL")
            party_updated = cursor.fetchone()[0]
            print(f"  Party references already updated: {party_updated}")
            
            return True
                
    except Exception as e:
        print(f"ERROR: Failed to update foreign key references: {e}")
        return False

def main():
    """Main function to fix all foreign key relationships"""
    print("Starting foreign key relationship fixes...")
    
    # Step 1: Populate atoll table
    print("\n1. Populating atoll table...")
    atoll_map = populate_atoll_table()
    if not atoll_map:
        return False
    
    # Step 2: Populate island table
    print("\n2. Populating island table...")
    island_map = populate_island_table(atoll_map)
    if not island_map:
        return False
    
    # Step 3: Update foreign key references
    print("\n3. Updating foreign key references...")
    if not update_foreign_key_references(island_map, atoll_map):
        return False
    
    print("\n✅ All foreign key relationships fixed successfully!")
    return True

if __name__ == "__main__":
    success = main()
    if success:
        print("You can now run: python manage.py migrate")
    else:
        print("❌ Foreign key relationship fixes failed")
        sys.exit(1)
