#!/usr/bin/env python3
"""
Debug script to check why "happy night, male" search is not working
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_directory.models import PhoneBookEntry
from dirReactFinal_core.models import Island

def debug_happy_night_search():
    """Debug the happy night search issue"""
    print("🔍 Debugging 'happy night, male' search issue")
    print("=" * 50)
    
    # Check if "happy night" exists in addresses
    print("\n1. Checking for 'happy night' in addresses:")
    happy_night_addresses = PhoneBookEntry.objects.filter(address__icontains='happy night')
    print(f"   Found {happy_night_addresses.count()} entries with 'happy night' in address")
    
    if happy_night_addresses.count() > 0:
        print("   Sample entries:")
        for i, entry in enumerate(happy_night_addresses[:3]):
            print(f"     {i+1}. {entry.name} - Address: {entry.address} - Island: {entry.island}")
    else:
        print("   ❌ No entries found with 'happy night' in address")
        
        # Check for partial matches
        print("\n   Checking for partial matches:")
        happy_matches = PhoneBookEntry.objects.filter(address__icontains='happy')
        print(f"     'happy' in address: {happy_matches.count()} matches")
        
        night_matches = PhoneBookEntry.objects.filter(address__icontains='night')
        print(f"     'night' in address: {night_matches.count()} matches")
        
        if happy_matches.count() > 0:
            print("     Sample 'happy' entries:")
            for i, entry in enumerate(happy_matches[:2]):
                print(f"       {i+1}. {entry.name} - Address: {entry.address}")
        
        if night_matches.count() > 0:
            print("     Sample 'night' entries:")
            for i, entry in enumerate(night_matches[:2]):
                print(f"       {i+1}. {entry.name} - Address: {entry.address}")
    
    # Check if "male" exists as an island
    print("\n2. Checking for 'male' as island:")
    male_islands = Island.objects.filter(name__icontains='male')
    print(f"   Found {male_islands.count()} islands with 'male' in name")
    
    if male_islands.count() > 0:
        for island in male_islands:
            print(f"     Island: {island.name} (ID: {island.id})")
            
            # Check how many phonebook entries reference this island
            island_entries = PhoneBookEntry.objects.filter(island_id=island.id)
            print(f"     Phonebook entries: {island_entries.count()}")
            
            if island_entries.count() > 0:
                print("     Sample entries:")
                for i, entry in enumerate(island_entries[:2]):
                    print(f"       {i+1}. {entry.name} - Address: {entry.address}")
    else:
        print("   ❌ No islands found with 'male' in name")
    
    # Check for similar address patterns
    print("\n3. Checking for similar address patterns:")
    address_samples = PhoneBookEntry.objects.exclude(address__isnull=True).exclude(address='')[:10]
    print("   Sample addresses in database:")
    for i, entry in enumerate(address_samples):
        print(f"     {i+1}. {entry.address}")
    
    # Check if there are any addresses with "happy" or "night" in them
    print("\n4. Checking for addresses containing 'happy' or 'night':")
    addresses_with_happy = PhoneBookEntry.objects.filter(address__icontains='happy').values_list('address', flat=True).distinct()[:5]
    print(f"   Addresses with 'happy': {list(addresses_with_happy)}")
    
    addresses_with_night = PhoneBookEntry.objects.filter(address__icontains='night').values_list('address', flat=True).distinct()[:5]
    print(f"   Addresses with 'night': {list(addresses_with_night)}")

if __name__ == '__main__':
    debug_happy_night_search()
    print("\n🏁 Debug completed.")
