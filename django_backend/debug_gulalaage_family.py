#!/usr/bin/env python3
"""
Debug script to investigate why only 3 members are visible in Gulalaage family tree
when there are more members in the database
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

def debug_gulalaage_family():
    """Debug the Gulalaage family to understand why only 3 members show"""
    print("🔍 DEBUGGING GULALAAGE FAMILY TREE ISSUE")
    print("=" * 80)
    
    address = "gulalaage"
    island = "sh. maroshi"
    
    print(f"📝 Target Address: {address}")
    print(f"📝 Target Island: {island}")
    print("─" * 70)
    
    # Step 1: Check all database entries for this address
    print(f"\n🎯 Step 1: Checking ALL Database Entries")
    
    all_entries = PhoneBookEntry.objects.filter(
        Q(address__iexact=address) | Q(address__icontains=address)
    ).filter(
        Q(island__name__iexact=island) | Q(island__name__icontains="maroshi")
    )
    
    print(f"   Total entries found: {all_entries.count()}")
    
    if all_entries.count() == 0:
        print(f"   ❌ No entries found!")
        return
    
    # Show all entries
    print(f"\n📋 ALL ENTRIES FOUND:")
    for i, entry in enumerate(all_entries, 1):
        age = entry.get_age() if entry.DOB else "No DOB"
        print(f"   {i:2d}. {entry.name} | Age: {age} | DOB: {entry.DOB} | Gender: {entry.gender} | Address: {entry.address} | Island: {entry.island}")
    
    # Step 2: Check entries with DOB (required for family inference)
    print(f"\n🎯 Step 2: Checking Entries with DOB")
    
    entries_with_dob = all_entries.exclude(DOB__isnull=True).exclude(DOB__exact='')
    print(f"   Entries with DOB: {entries_with_dob.count()}")
    
    if entries_with_dob.count() == 0:
        print(f"   ❌ No entries with DOB found - this explains the issue!")
        return
    
    # Show entries with DOB
    print(f"\n📋 ENTRIES WITH DOB:")
    for i, entry in enumerate(entries_with_dob, 1):
        age = entry.get_age()
        print(f"   {i:2d}. {entry.name} | Age: {age} | DOB: {entry.DOB} | Gender: {entry.gender}")
    
    # Step 3: Check if family group exists
    print(f"\n🎯 Step 3: Checking Family Group")
    
    family_groups = FamilyGroup.objects.filter(
        Q(address__iexact=address) | Q(address__icontains=address)
    ).filter(
        Q(island__iexact=island) | Q(island__icontains="maroshi")
    )
    
    print(f"   Family groups found: {family_groups.count()}")
    
    if family_groups.count() == 0:
        print(f"   ❌ No family group found - this explains why family tree is empty!")
        print(f"   💡 Solution: Create family group using FamilyGroup.infer_family_from_address()")
        return
    
    # Show family groups
    for i, fg in enumerate(family_groups, 1):
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
        
        # Check relationships
        relationships = fg.relationships.all()
        print(f"      Relationships: {relationships.count()}")
        
        for j, rel in enumerate(relationships, 1):
            person1_entry = PhoneBookEntry.objects.get(pid=rel.person1)
            person2_entry = PhoneBookEntry.objects.get(pid=rel.person2)
            print(f"         {j:2d}. {person1_entry.name} -> {person2_entry.name} ({rel.relationship_type})")
    
    # Step 4: Check specific members mentioned by user
    print(f"\n🎯 Step 4: Checking Specific Members Mentioned")
    
    mentioned_members = ["mohamed umar", "ahmed afrah", "idrees umar"]
    
    for member_name in mentioned_members:
        entries = all_entries.filter(name__icontains=member_name)
        print(f"\n   Looking for: {member_name}")
        print(f"   Found: {entries.count()} entries")
        
        for entry in entries:
            age = entry.get_age() if entry.DOB else "No DOB"
            print(f"      - {entry.name} | Age: {age} | DOB: {entry.DOB} | Address: {entry.address} | Island: {entry.island}")
    
    # Step 5: Check if family group needs to be recreated
    print(f"\n🎯 Step 5: Analysis and Recommendations")
    
    if family_groups.count() > 0:
        fg = family_groups.first()
        members_count = fg.members.count()
        entries_with_dob_count = entries_with_dob.count()
        
        print(f"   Family group has {members_count} members")
        print(f"   Database has {entries_with_dob_count} entries with DOB")
        
        if members_count < entries_with_dob_count:
            print(f"   ❌ ISSUE FOUND: Family group is missing {entries_with_dob_count - members_count} members!")
            print(f"   💡 Solution: Recreate family group to include all members")
        else:
            print(f"   ✅ Family group has all expected members")
    else:
        print(f"   ❌ ISSUE FOUND: No family group exists!")
        print(f"   💡 Solution: Create family group using FamilyGroup.infer_family_from_address()")

if __name__ == "__main__":
    debug_gulalaage_family()
