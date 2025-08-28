#!/usr/bin/env python3
"""
2025-01-28: Script to find the specific family members mentioned in the user's image

This script searches for the specific family members like "ahmed nadeem", "mohamed nadeem"
to find the correct family group.
"""

import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_directory.models import PhoneBookEntry
from dirReactFinal_family.models import FamilyGroup
import json

def find_specific_family():
    """Find the specific family members mentioned in the user's image"""
    print("=== FINDING SPECIFIC FAMILY MEMBERS ===")
    
    # Search for the specific names mentioned in the user's image
    target_names = [
        "ahmed nadeem",
        "mohamed nadeem", 
        "jaleela ibrahim",
        "ageela ibrahim",
        "aishath nazeela",
        "aminath zameela",
        "rafhan ibrahim"
    ]
    
    print(f"Searching for {len(target_names)} specific family members...")
    
    found_entries = []
    for name in target_names:
        entries = PhoneBookEntry.objects.filter(name__icontains=name)
        if entries.exists():
            for entry in entries:
                found_entries.append(entry)
                print(f"✅ Found: {entry.name} (PID: {entry.pid})")
                print(f"   Address: {entry.address}")
                print(f"   Island: {entry.island}")
                print(f"   DOB: {entry.DOB}")
                age = entry.get_age()
                print(f"   Age: {age}")
        else:
            print(f"❌ Not found: {name}")
    
    if found_entries:
        print(f"\n=== ANALYZING FOUND ENTRIES ===")
        
        # Group by address and island
        address_groups = {}
        for entry in found_entries:
            key = (entry.address, str(entry.island))
            if key not in address_groups:
                address_groups[key] = []
            address_groups[key].append(entry)
        
        print(f"Found {len(address_groups)} unique address/island combinations:")
        
        for (address, island), entries in address_groups.items():
            print(f"\n📍 Address: {address}, Island: {island}")
            print(f"   Members: {len(entries)}")
            
            # Check if there's a family group for this address
            family_group = FamilyGroup.objects.filter(
                address__iexact=address,
                island__iexact=island
            ).first()
            
            if family_group:
                print(f"   ✅ Family group exists: {family_group.name} (ID: {family_group.id})")
                print(f"   Family members: {family_group.members.count()}")
                
                # Show family group members
                for member in family_group.members.all():
                    entry = member.entry
                    age = entry.get_age()
                    print(f"     - {entry.name}: DOB={entry.DOB}, Age={age}")
            else:
                print(f"   ❌ No family group found for this address")
                
                # Try to create one
                print(f"   🔧 Attempting to create family group...")
                try:
                    from dirReactFinal_family.models import FamilyGroup
                    family_group = FamilyGroup.infer_family_from_address(address, island, None)
                    if family_group:
                        print(f"   ✅ Successfully created family group: {family_group.name}")
                    else:
                        print(f"   ❌ Failed to create family group")
                except Exception as e:
                    print(f"   ❌ Error creating family group: {str(e)}")

if __name__ == '__main__':
    find_specific_family()
