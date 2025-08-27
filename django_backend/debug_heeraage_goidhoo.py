#!/usr/bin/env python3
"""
Debug script to investigate why default family cannot be created for "heeraage, goidhoo"
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

def debug_heeraage_goidhoo_family():
    """Debug why family cannot be created for heeraage, goidhoo"""
    print("🔍 Debugging Family Creation for 'heeraage, goidhoo'\n")
    
    address = "heeraage"
    island = "goidhoo"
    
    print(f"📝 Target Address: {address}")
    print(f"📝 Target Island: {island}")
    print("─" * 70)
    
    # Step 1: Check if entries exist for this address/island
    print(f"\n🎯 Step 1: Checking Database Entries")
    
    entries = PhoneBookEntry.objects.filter(
        address__iexact=address,
        island__iexact=island
    )
    
    print(f"   Total entries found: {entries.count()}")
    
    if entries.count() == 0:
        print(f"   ❌ No entries found - this explains why family creation fails!")
        print(f"   🔍 Let's check for similar entries...")
        
        # Check for entries with similar address
        similar_address = PhoneBookEntry.objects.filter(address__icontains=address)
        print(f"   Entries with address containing '{address}': {similar_address.count()}")
        
        # Check for entries with similar island
        similar_island = PhoneBookEntry.objects.filter(island__icontains=island)
        print(f"   Entries with island containing '{island}': {similar_island.count()}")
        
        # Show some examples
        if similar_address.count() > 0:
            print(f"   📋 Sample entries with similar address:")
            for entry in similar_address[:5]:
                print(f"      - {entry.name} | Address: {entry.address} | Island: {entry.island}")
        
        if similar_island.count() > 0:
            print(f"   📋 Sample entries with similar island:")
            for entry in similar_island[:5]:
                print(f"      - {entry.name} | Address: {entry.address} | Island: {entry.island}")
        
        return
    
    # Step 2: Check entries with DOB (required for family inference)
    print(f"\n🎯 Step 2: Checking Entries with DOB")
    
    entries_with_dob = entries.exclude(DOB__isnull=True).exclude(DOB__exact='')
    print(f"   Entries with DOB: {entries_with_dob.count()}")
    
    if entries_with_dob.count() == 0:
        print(f"   ❌ No entries with DOB found - family inference requires DOB for age calculation!")
        print(f"   📋 Sample entries without DOB:")
        for entry in entries[:5]:
            print(f"      - {entry.name} | DOB: {entry.DOB} | Gender: {entry.gender}")
        return
    
    # Step 3: Check age calculation
    print(f"\n🎯 Step 3: Checking Age Calculation")
    
    entries_with_age = []
    for entry in entries_with_dob:
        age = entry.get_age()
        if age is not None:
            entries_with_age.append((entry, age))
    
    print(f"   Entries with valid age: {len(entries_with_age)}")
    
    if len(entries_with_age) == 0:
        print(f"   ❌ No entries with valid age calculation!")
        print(f"   📋 Sample entries with DOB but invalid age:")
        for entry in entries_with_dob[:5]:
            print(f"      - {entry.name} | DOB: {entry.DOB} | Age: {entry.get_age()}")
        return
    
    # Step 4: Check gender information
    print(f"\n🎯 Step 4: Checking Gender Information")
    
    entries_with_gender = [entry for entry, age in entries_with_age if entry.gender]
    print(f"   Entries with gender: {len(entries_with_gender)}")
    
    if len(entries_with_gender) == 0:
        print(f"   ❌ No entries with gender information!")
        print(f"   📋 Sample entries without gender:")
        for entry, age in entries_with_age[:5]:
            print(f"      - {entry.name} | Gender: {entry.gender} | Age: {age}")
        return
    
    # Step 5: Check if family group already exists
    print(f"\n🎯 Step 5: Checking Existing Family Group")
    
    existing_family = FamilyGroup.objects.filter(address=address, island=island).first()
    if existing_family:
        print(f"   ✅ Family group already exists: {existing_family.name}")
        print(f"   📊 Family details:")
        print(f"      - ID: {existing_family.id}")
        print(f"      - Members: {existing_family.members.count()}")
        print(f"      - Relationships: {existing_family.relationships.count()}")
        print(f"      - Created: {existing_family.created_at}")
        return
    else:
        print(f"   ❌ No existing family group found")
    
    # Step 6: Test family inference manually
    print(f"\n🎯 Step 6: Testing Family Inference Manually")
    
    try:
        # Create a test user for family creation
        from dirReactFinal_core.models import User
        test_user = User.objects.filter(is_staff=True).first()
        
        if not test_user:
            print(f"   ❌ No staff user found for testing family creation")
            return
        
        print(f"   Using test user: {test_user.username}")
        
        # Test the family inference
        family_group = FamilyGroup.infer_family_from_address(address, island, test_user)
        
        if family_group:
            print(f"   ✅ Family inference successful!")
            print(f"   📊 Created family:")
            print(f"      - ID: {family_group.id}")
            print(f"      - Name: {family_group.name}")
            print(f"      - Members: {family_group.members.count()}")
            print(f"      - Relationships: {family_group.relationships.count()}")
        else:
            print(f"   ❌ Family inference failed - returned None")
            
    except Exception as e:
        print(f"   ❌ Family inference failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # Step 7: Show detailed entry information
    print(f"\n🎯 Step 7: Detailed Entry Information")
    
    print(f"   📋 All entries for {address}, {island}:")
    for i, (entry, age) in enumerate(entries_with_age):
        print(f"      {i+1}. {entry.name}")
        print(f"         - PID: {entry.pid}")
        print(f"         - Contact: {entry.contact}")
        print(f"         - Address: {entry.address}")
        print(f"         - Island: {entry.island}")
        print(f"         - DOB: {entry.DOB}")
        print(f"         - Age: {age}")
        print(f"         - Gender: {entry.gender}")
        print(f"         - Party: {entry.party}")
        print(f"         - Profession: {entry.profession}")
        print("")

if __name__ == "__main__":
    debug_heeraage_goidhoo_family()
