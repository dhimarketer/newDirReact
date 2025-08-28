#!/usr/bin/env python3
"""
2025-01-28: Script to debug family group island values in database

This script checks what island values are actually stored in the family groups
to see why the search is not finding the correct family group.
"""

import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_family.models import FamilyGroup

def debug_family_group_islands():
    """Debug family group island values in database"""
    print("=== DEBUGGING FAMILY GROUP ISLAND VALUES ===")
    
    # Get all family groups with address containing 'kinbigasdhoshuge'
    family_groups = FamilyGroup.objects.filter(address__icontains='kinbigasdhoshuge')
    
    print(f"Found {family_groups.count()} family groups with address containing 'kinbigasdhoshuge':")
    
    for fg in family_groups:
        print(f"\n--- Family Group ID {fg.id} ---")
        print(f"  Name: {fg.name}")
        print(f"  Address: '{fg.address}'")
        print(f"  Island: '{fg.island}'")
        print(f"  Island type: {type(fg.island)}")
        print(f"  Island length: {len(fg.island) if fg.island else 'None'}")
        print(f"  Member count: {fg.members.count()}")
        
        # Show first few members
        for member in fg.members.all()[:3]:
            entry = member.entry
            print(f"    - {entry.name}: DOB={entry.DOB}")
    
    # Test the exact search that should work
    print(f"\n=== TESTING EXACT SEARCH ===")
    
    # Test case 1: What the frontend is sending
    address = "kinbigasdhoshuge"
    island = "f. feeali"
    
    print(f"Searching for: address='{address}', island='{island}'")
    
    # Check if any family groups match exactly
    exact_matches = FamilyGroup.objects.filter(address=address, island=island)
    print(f"Exact matches found: {exact_matches.count()}")
    
    for fg in exact_matches:
        print(f"  - ID {fg.id}: {fg.name}")
    
    # Check if any family groups match with different case
    case_insensitive_matches = FamilyGroup.objects.filter(
        address__iexact=address, 
        island__iexact=island
    )
    print(f"Case-insensitive matches found: {case_insensitive_matches.count()}")
    
    for fg in case_insensitive_matches:
        print(f"  - ID {fg.id}: {fg.name}")
    
    # Check what happens if we search just by address
    address_only_matches = FamilyGroup.objects.filter(address=address)
    print(f"Address-only matches found: {address_only_matches.count()}")
    
    for fg in address_only_matches:
        print(f"  - ID {fg.id}: {fg.name} (island: '{fg.island}')")

if __name__ == '__main__':
    debug_family_group_islands()
