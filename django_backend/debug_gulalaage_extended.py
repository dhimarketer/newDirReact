#!/usr/bin/env python3
"""
Extended debug script to find all variations of gulalaage address and check for family groups
"""

import os
import sys
import django

# Add the Django project to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')

# Setup Django
django.setup()

from dirReactFinal_directory.models import PhoneBookEntry
from dirReactFinal_family.models import FamilyGroup, FamilyMember, FamilyRelationship
from django.db.models import Q

def debug_gulalaage_extended():
    """Extended debug to find all gulalaage variations and family groups"""
    print("🔍 EXTENDED DEBUGGING FOR GULALAAGE FAMILY")
    print("=" * 80)
    
    # Step 1: Find all entries with "gulalaage" in address
    print(f"\n🎯 Step 1: Finding ALL entries with 'gulalaage' in address")
    
    all_gulalaage_entries = PhoneBookEntry.objects.filter(
        address__icontains="gulalaage"
    )
    
    print(f"   Total entries with 'gulalaage': {all_gulalaage_entries.count()}")
    
    # Group by address and island
    from collections import defaultdict
    address_groups = defaultdict(list)
    
    for entry in all_gulalaage_entries:
        key = f"{entry.address} | {entry.island.name if entry.island else 'No Island'}"
        address_groups[key].append(entry)
    
    print(f"\n📋 ADDRESS VARIATIONS FOUND:")
    for i, (address_key, entries) in enumerate(address_groups.items(), 1):
        print(f"\n   {i}. {address_key}")
        print(f"      Entries: {len(entries)}")
        for entry in entries:
            age = entry.get_age() if entry.DOB else "No DOB"
            print(f"         - {entry.name} | Age: {age} | DOB: {entry.DOB}")
    
    # Step 2: Check for family groups with gulalaage
    print(f"\n🎯 Step 2: Finding ALL family groups with 'gulalaage'")
    
    all_family_groups = FamilyGroup.objects.filter(
        address__icontains="gulalaage"
    )
    
    print(f"   Total family groups with 'gulalaage': {all_family_groups.count()}")
    
    for i, fg in enumerate(all_family_groups, 1):
        print(f"\n   Family Group {i}:")
        print(f"      ID: {fg.id}")
        print(f"      Name: {fg.name}")
        print(f"      Address: {fg.address}")
        print(f"      Island: {fg.island}")
        print(f"      Created: {fg.created_at}")
        
        # Check family members
        members = fg.members.all()
        print(f"      Members: {members.count()}")
        
        for j, member in enumerate(members, 1):
            entry = member.entry
            age = entry.get_age() if entry.DOB else "No DOB"
            print(f"         {j:2d}. {entry.name} | Age: {age} | Role: {member.role_in_family} | DOB: {entry.DOB}")
    
    # Step 3: Search for specific members mentioned by user
    print(f"\n🎯 Step 3: Searching for specific members mentioned by user")
    
    mentioned_members = ["mohamed umar", "ahmed afrah", "idrees umar"]
    
    for member_name in mentioned_members:
        print(f"\n   Searching for: '{member_name}'")
        
        # Search in all entries
        entries = PhoneBookEntry.objects.filter(
            name__icontains=member_name
        )
        
        print(f"   Found: {entries.count()} entries")
        
        for entry in entries:
            age = entry.get_age() if entry.DOB else "No DOB"
            print(f"      - {entry.name} | Age: {age} | DOB: {entry.DOB}")
            print(f"        Address: {entry.address} | Island: {entry.island.name if entry.island else 'No Island'}")
    
    # Step 4: Check if there are entries with similar names
    print(f"\n🎯 Step 4: Checking for similar names")
    
    similar_names = [
        "mohamed", "umar", "ahmed", "afrah", "idrees"
    ]
    
    for name_part in similar_names:
        entries = PhoneBookEntry.objects.filter(
            name__icontains=name_part
        ).filter(
            address__icontains="gulalaage"
        )
        
        if entries.count() > 0:
            print(f"\n   Found entries with '{name_part}' in gulalaage:")
            for entry in entries:
                age = entry.get_age() if entry.DOB else "No DOB"
                print(f"      - {entry.name} | Age: {age} | DOB: {entry.DOB}")
    
    # Step 5: Check if family group needs to be created
    print(f"\n🎯 Step 5: Recommendations")
    
    if all_family_groups.count() == 0:
        print(f"   ❌ No family groups found for gulalaage!")
        print(f"   💡 Solution: Create family group for the correct address")
        
        # Find the most common address format
        if address_groups:
            most_common = max(address_groups.items(), key=lambda x: len(x[1]))
            print(f"   📍 Most common address format: {most_common[0]}")
            print(f"   👥 Has {len(most_common[1])} members")
    else:
        print(f"   ✅ Found {all_family_groups.count()} family groups")
        print(f"   💡 Check if the correct family group is being used")

if __name__ == "__main__":
    debug_gulalaage_extended()
