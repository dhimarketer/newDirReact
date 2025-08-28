#!/usr/bin/env python
"""
Migration script to convert TextField fields to ForeignKey relationships
for atoll, island, and party fields in PhoneBookEntry model.

This script:
1. Populates the new Atoll, Party, and Island models with existing data
2. Updates existing PhoneBookEntry records to use foreign key relationships
3. Handles data inconsistencies and normalization

Run with: python manage.py shell < migrate_to_foreign_keys.py
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

def normalize_gender(gender_value):
    """Normalize gender values to consistent format"""
    if not gender_value:
        return None
    
    gender_str = str(gender_value).strip().lower()
    
    if gender_str in ['m', 'male', 'k.', 'k.male']:
        return 'M'
    elif gender_str in ['f', 'female', 'd.', 'd.female']:
        return 'F'
    else:
        return 'O'

def migrate_data():
    """Main migration function"""
    print("Starting migration to foreign key relationships...")
    
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
            for atoll_name in atoll_values:
                if atoll_name and atoll_name.strip():
                    atoll, created = Atoll.objects.get_or_create(
                        name=atoll_name.strip(),
                        defaults={'code': atoll_name.strip()[:10].upper()}
                    )
                    atoll_map[atoll_name] = atoll
                    if created:
                        print(f"Created Atoll: {atoll.name}")
            
            # Step 2: Create Island records from existing data
            print("Creating Island records...")
            island_values = PhoneBookEntry.objects.exclude(
                island__isnull=True
            ).exclude(
                island__exact=''
            ).values_list('island', flat=True).distinct()
            
            island_map = {}
            for island_name in island_values:
                if island_name and island_name.strip():
                    # Try to find associated atoll
                    associated_atoll = None
                    if island_name in atoll_map:
                        associated_atoll = atoll_map[island_name]
                    
                    island, created = Island.objects.get_or_create(
                        name=island_name.strip(),
                        defaults={
                            'atoll': associated_atoll.name if associated_atoll else '',
                            'island_type': 'inhabited'
                        }
                    )
                    island_map[island_name] = island
                    if created:
                        print(f"Created Island: {island.name}")
            
            # Step 3: Create Party records from existing data
            print("Creating Party records...")
            party_values = PhoneBookEntry.objects.exclude(
                party__isnull=True
            ).exclude(
                party__exact=''
            ).values_list('party', flat=True).distinct()
            
            party_map = {}
            for party_name in party_values:
                if party_name and party_name.strip():
                    party, created = Party.objects.get_or_create(
                        name=party_name.strip(),
                        defaults={'short_name': party_name.strip()[:50]}
                    )
                    party_map[party_name] = party
                    if created:
                        print(f"Created Party: {party.name}")
            
            # Step 4: Update PhoneBookEntry records to use foreign keys
            print("Updating PhoneBookEntry records...")
            updated_count = 0
            
            for entry in PhoneBookEntry.objects.all():
                updated = False
                
                # Update atoll field
                if entry.atoll and str(entry.atoll) in atoll_map:
                    entry.atoll = atoll_map[str(entry.atoll)]
                    updated = True
                else:
                    entry.atoll = None
                
                # Update island field
                if entry.island and str(entry.island) in island_map:
                    entry.island = island_map[str(entry.island)]
                    updated = True
                else:
                    entry.island = None
                
                # Update party field
                if entry.party and str(entry.party) in party_map:
                    entry.party = party_map[str(entry.party)]
                    updated = True
                else:
                    entry.party = None
                
                # Update gender field
                normalized_gender = normalize_gender(entry.gender)
                if normalized_gender != entry.gender:
                    entry.gender = normalized_gender
                    updated = True
                
                if updated:
                    entry.save()
                    updated_count += 1
            
            print(f"Migration completed successfully!")
            print(f"Created {len(atoll_map)} Atoll records")
            print(f"Created {len(island_map)} Island records")
            print(f"Created {len(party_map)} Party records")
            print(f"Updated {updated_count} PhoneBookEntry records")
            
    except Exception as e:
        print(f"Migration failed: {e}")
        raise

if __name__ == '__main__':
    migrate_data()
