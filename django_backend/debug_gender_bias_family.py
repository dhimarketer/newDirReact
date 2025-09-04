#!/usr/bin/env python3
"""
Debug script to investigate gender bias in family creation process
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

def debug_gender_bias_family():
    """Debug gender bias in family creation process"""
    print("🔍 DEBUGGING GENDER BIAS IN FAMILY CREATION")
    print("=" * 80)
    
    # Check the specific family group that was mentioned
    family_group_id = 1303  # gulalaage, b. thulhaadhoo
    
    print(f"\n🎯 Step 1: Analyzing Family Group {family_group_id}")
    
    try:
        family_group = FamilyGroup.objects.get(id=family_group_id)
        print(f"   Family Group: {family_group.name}")
        print(f"   Address: {family_group.address}")
        print(f"   Island: {family_group.island}")
        print(f"   Created: {family_group.created_at}")
        
        # Get all family members
        members = family_group.members.all()
        print(f"\n📋 ALL FAMILY MEMBERS ({members.count()}):")
        
        for i, member in enumerate(members, 1):
            entry = member.entry
            age = entry.get_age() if entry.DOB else "No DOB"
            gender = entry.gender or "No Gender"
            print(f"   {i:2d}. {entry.name} | Age: {age} | Gender: {gender} | DOB: {entry.DOB}")
        
        # Analyze gender distribution
        print(f"\n📊 GENDER ANALYSIS:")
        male_members = [m for m in members if m.entry.gender == 'M']
        female_members = [m for m in members if m.entry.gender == 'F']
        no_gender_members = [m for m in members if not m.entry.gender or m.entry.gender == 'None']
        
        print(f"   Male members: {len(male_members)}")
        for member in male_members:
            age = member.entry.get_age() if member.entry.DOB else "No DOB"
            print(f"      - {member.entry.name} (Age: {age})")
        
        print(f"   Female members: {len(female_members)}")
        for member in female_members:
            age = member.entry.get_age() if member.entry.DOB else "No DOB"
            print(f"      - {member.entry.name} (Age: {age})")
        
        print(f"   No gender data: {len(no_gender_members)}")
        for member in no_gender_members:
            age = member.entry.get_age() if member.entry.DOB else "No DOB"
            print(f"      - {member.entry.name} (Age: {age})")
        
        # Check relationships
        relationships = family_group.relationships.all()
        print(f"\n🔗 RELATIONSHIPS ({relationships.count()}):")
        
        for i, rel in enumerate(relationships, 1):
            person1_entry = rel.person1
            person2_entry = rel.person2
            print(f"   {i:2d}. {person1_entry.name} ({person1_entry.gender or 'No Gender'}) -> {person2_entry.name} ({person2_entry.gender or 'No Gender'}) ({rel.relationship_type})")
        
        # Check if there are any database entries at this address that are NOT in the family group
        print(f"\n🔍 Step 2: Checking for missing entries at this address")
        
        all_entries_at_address = PhoneBookEntry.objects.filter(
            address__iexact=family_group.address
        ).filter(
            island__name__iexact=family_group.island
        )
        
        print(f"   Total entries at address: {all_entries_at_address.count()}")
        print(f"   Entries in family group: {members.count()}")
        
        # Find entries not in family group
        family_member_pids = set(member.entry.pid for member in members)
        missing_entries = [entry for entry in all_entries_at_address if entry.pid not in family_member_pids]
        
        print(f"   Missing entries: {len(missing_entries)}")
        
        if missing_entries:
            print(f"\n📋 MISSING ENTRIES:")
            for i, entry in enumerate(missing_entries, 1):
                age = entry.get_age() if entry.DOB else "No DOB"
                gender = entry.gender or "No Gender"
                print(f"   {i:2d}. {entry.name} | Age: {age} | Gender: {gender} | DOB: {entry.DOB}")
                
                # Check if this entry has gender data
                if entry.gender:
                    print(f"       ✅ Has gender data: {entry.gender}")
                else:
                    print(f"       ❌ No gender data")
        
        # Check if the issue is in the family creation logic
        print(f"\n🔍 Step 3: Analyzing Family Creation Logic")
        
        # Check if entries with DOB are being prioritized
        entries_with_dob = [entry for entry in all_entries_at_address if entry.DOB and entry.DOB != 'None']
        entries_without_dob = [entry for entry in all_entries_at_address if not entry.DOB or entry.DOB == 'None']
        
        print(f"   Entries with DOB: {len(entries_with_dob)}")
        print(f"   Entries without DOB: {len(entries_without_dob)}")
        
        # Check gender distribution in entries with DOB vs without DOB
        male_with_dob = [e for e in entries_with_dob if e.gender == 'M']
        female_with_dob = [e for e in entries_with_dob if e.gender == 'F']
        male_without_dob = [e for e in entries_without_dob if e.gender == 'M']
        female_without_dob = [e for e in entries_without_dob if e.gender == 'F']
        
        print(f"\n📊 GENDER vs DOB ANALYSIS:")
        print(f"   Male with DOB: {len(male_with_dob)}")
        print(f"   Female with DOB: {len(female_with_dob)}")
        print(f"   Male without DOB: {len(male_without_dob)}")
        print(f"   Female without DOB: {len(female_without_dob)}")
        
        # Check if family creation is biased towards entries with DOB
        family_members_with_dob = [m for m in members if m.entry.DOB and m.entry.DOB != 'None']
        family_members_without_dob = [m for m in members if not m.entry.DOB or m.entry.DOB == 'None']
        
        print(f"\n📊 FAMILY GROUP DOB ANALYSIS:")
        print(f"   Family members with DOB: {len(family_members_with_dob)}")
        print(f"   Family members without DOB: {len(family_members_without_dob)}")
        
        # Check if there's a gender bias in DOB data
        print(f"\n🔍 Step 4: Checking for Gender Bias in DOB Data")
        
        if len(female_with_dob) < len(male_with_dob):
            print(f"   ⚠️ POTENTIAL GENDER BIAS: Fewer females have DOB data than males")
            print(f"      Males with DOB: {len(male_with_dob)}")
            print(f"      Females with DOB: {len(female_with_dob)}")
        elif len(female_with_dob) > len(male_with_dob):
            print(f"   ℹ️ More females have DOB data than males")
            print(f"      Males with DOB: {len(male_with_dob)}")
            print(f"      Females with DOB: {len(female_with_dob)}")
        else:
            print(f"   ✅ Equal gender distribution in DOB data")
        
        # Check if family creation logic is filtering out entries without DOB
        if len(family_members_without_dob) == 0 and len(entries_without_dob) > 0:
            print(f"   ❌ ISSUE FOUND: Family creation is excluding entries without DOB!")
            print(f"      Total entries without DOB: {len(entries_without_dob)}")
            print(f"      Family members without DOB: {len(family_members_without_dob)}")
        
    except FamilyGroup.DoesNotExist:
        print(f"   ❌ Family group {family_group_id} not found!")
    
    # Check other family groups for similar patterns
    print(f"\n🔍 Step 5: Checking Other Family Groups for Gender Bias")
    
    all_family_groups = FamilyGroup.objects.all()[:10]  # Check first 10 family groups
    
    for fg in all_family_groups:
        members = fg.members.all()
        if members.count() > 0:
            male_count = len([m for m in members if m.entry.gender == 'M'])
            female_count = len([m for m in members if m.entry.gender == 'F'])
            no_gender_count = len([m for m in members if not m.entry.gender or m.entry.gender == 'None'])
            
            print(f"   Family {fg.id} ({fg.address}): {male_count}M, {female_count}F, {no_gender_count}NoGender")

if __name__ == "__main__":
    debug_gender_bias_family()
