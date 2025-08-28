#!/usr/bin/env python
"""
Script to populate the new foreign key fields with existing data
from the TextField values in PhoneBookEntry.

Run with: python manage.py shell < populate_foreign_keys.py
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from django.db import transaction
from dirReactFinal_core.models import Atoll, Island, Party
from dirReactFinal_directory.models import PhoneBookEntry

def populate_foreign_keys():
    """Populate the new foreign key fields with existing data"""
    print("Starting to populate foreign key fields...")
    
    try:
        with transaction.atomic():
            # Step 1: Create Atoll records from existing data
            print("Creating Atoll records...")
            atoll_values = PhoneBookEntry.objects.exclude(
                atoll__isnull=True
            ).exclude(
                atoll__exact=''
            ).values_list('atoll', flat=True).distinct()
            
            atoll_map = {}
            atolls_to_create = []
            for atoll_name in atoll_values:
                if atoll_name and atoll_name.strip():
                    atolls_to_create.append(Atoll(
                        name=atoll_name.strip(),
                        code=atoll_name.strip()[:10].upper()
                    ))
            
            # Bulk create atolls
            if atolls_to_create:
                Atoll.objects.bulk_create(atolls_to_create, ignore_conflicts=True)
                # Refresh the map
                for atoll in Atoll.objects.all():
                    atoll_map[atoll.name] = atoll
            
            print(f"Created {len(atoll_map)} Atoll records")
            
            # Step 2: Create Island records from existing data
            print("Creating Island records...")
            island_values = PhoneBookEntry.objects.exclude(
                island__isnull=True
            ).exclude(
                island__exact=''
            ).values_list('island', flat=True).distinct()
            
            island_map = {}
            islands_to_create = []
            for island_name in island_values:
                if island_name and island_name.strip():
                    islands_to_create.append(Island(
                        name=island_name.strip(),
                        atoll='',
                        island_type='inhabited'
                    ))
            
            # Bulk create islands
            if islands_to_create:
                Island.objects.bulk_create(islands_to_create, ignore_conflicts=True)
                # Refresh the map
                for island in Island.objects.all():
                    island_map[island.name] = island
            
            print(f"Created {len(island_map)} Island records")
            
            # Step 3: Create Party records from existing data
            print("Creating Party records...")
            party_values = PhoneBookEntry.objects.exclude(
                party__isnull=True
            ).exclude(
                party__exact=''
            ).values_list('party', flat=True).distinct()
            
            party_map = {}
            parties_to_create = []
            for party_name in party_values:
                if party_name and party_name.strip():
                    parties_to_create.append(Party(
                        name=party_name.strip(),
                        short_name=party_name.strip()[:50]
                    ))
            
            # Bulk create parties
            if parties_to_create:
                Party.objects.bulk_create(parties_to_create, ignore_conflicts=True)
                # Refresh the map
                for party in Party.objects.all():
                    party_map[party.name] = party
            
            print(f"Created {len(party_map)} Party records")
            
            # Step 4: Update PhoneBookEntry records in batches
            print("Updating PhoneBookEntry records...")
            batch_size = 1000
            total_updated = 0
            
            # Process in batches
            for offset in range(0, PhoneBookEntry.objects.count(), batch_size):
                batch = PhoneBookEntry.objects.all()[offset:offset + batch_size]
                
                for entry in batch:
                    updated = False
                    
                    # Update atoll_fk field
                    if entry.atoll and str(entry.atoll) in atoll_map:
                        entry.atoll_fk = atoll_map[str(entry.atoll)]
                        updated = True
                    
                    # Update island_fk field
                    if entry.island and str(entry.island) in island_map:
                        entry.island_fk = island_map[str(entry.island)]
                        updated = True
                    
                    # Update party_fk field
                    if entry.party and str(entry.party) in party_map:
                        entry.party_fk = party_map[str(entry.party)]
                        updated = True
                    
                    # Update gender_choice field
                    if entry.gender:
                        gender_str = str(entry.gender).strip().lower()
                        if gender_str in ['m', 'male', 'k.', 'k.male']:
                            entry.gender_choice = 'M'
                            updated = True
                        elif gender_str in ['f', 'female', 'd.', 'd.female']:
                            entry.gender_choice = 'F'
                            updated = True
                        else:
                            entry.gender_choice = 'O'
                            updated = True
                    
                    if updated:
                        entry.save()
                        total_updated += 1
                
                print(f"Processed batch {offset//batch_size + 1}, total updated: {total_updated}")
            
            print(f"Population completed! Updated {total_updated} records")
            
    except Exception as e:
        print(f"Population failed: {e}")
        raise

if __name__ == '__main__':
    populate_foreign_keys()
