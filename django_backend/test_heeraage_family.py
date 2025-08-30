#!/usr/bin/env python3
"""
Test script to investigate heeraage family issue
"""

import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_directory.models import PhoneBookEntry
from dirReactFinal_core.models import Island
from dirReactFinal_family.models import FamilyGroup

def test_heeraage_family():
    """Test heeraage family creation and retrieval"""
    print("🔍 Testing Heeraage Family Issue\n")
    
    # Test 1: Check all entries with address "heeraage"
    print("📝 Test 1: All entries with address 'heeraage'")
    heeraage_entries = PhoneBookEntry.objects.filter(address__iexact='heeraage')
    print(f"   Total entries: {heeraage_entries.count()}")
    
    if heeraage_entries.count() > 0:
        print("   Sample entries:")
        for i, entry in enumerate(heeraage_entries[:5]):
            island_name = entry.island.name if entry.island else "None"
            print(f"     {i+1}. PID: {entry.pid}, Name: {entry.name}, Island: {island_name}")
    
    # Test 2: Check unique islands for heeraage address
    print("\n📝 Test 2: Unique islands for heeraage address")
    islands = heeraage_entries.values_list('island__name', flat=True).distinct()
    island_list = list(islands)
    print(f"   Islands: {island_list}")
    
    # Test 3: Check if family group exists for heeraage
    print("\n📝 Test 3: Existing family groups for heeraage")
    for island_name in island_list:
        if island_name:
            family_group = FamilyGroup.get_by_address("heeraage", island_name)
            if family_group:
                print(f"   ✅ Found family group for heeraage, {island_name}")
                print(f"      ID: {family_group.id}, Members: {family_group.members.count()}")
                print(f"      Relationships: {family_group.relationships.count()}")
                
                # Show member details
                print("      Members:")
                for member in family_group.members.all():
                    entry = member.entry
                    print(f"        - {entry.name} (PID: {entry.pid}, Role: {member.role_in_family})")
            else:
                print(f"   ❌ No family group for heeraage, {island_name}")
    
    # Test 4: Try to create family group for heeraage, goidhoo
    print("\n📝 Test 4: Attempting to create family for heeraage, goidhoo")
    try:
        # Find goidhoo island
        goidhoo_island = Island.objects.filter(name__icontains='goidhoo').first()
        if goidhoo_island:
            print(f"   Found goidhoo island: {goidhoo_island.name}")
            
            # Try to create family group
            family_group = FamilyGroup.infer_family_from_address("heeraage", goidhoo_island.name, None)
            if family_group:
                print(f"   ✅ Successfully created family group: {family_group.id}")
                print(f"      Members: {family_group.members.count()}")
                print(f"      Relationships: {family_group.relationships.count()}")
                
                # Show all members
                print("      All members:")
                for member in family_group.members.all():
                    entry = member.entry
                    print(f"        - {entry.name} (PID: {entry.pid}, Address: {entry.address}, Island: {entry.island.name if entry.island else 'None'})")
            else:
                print("   ❌ Failed to create family group")
        else:
            print("   ❌ Could not find goidhoo island")
    except Exception as e:
        print(f"   ❌ Error creating family group: {str(e)}")

if __name__ == "__main__":
    test_heeraage_family()
