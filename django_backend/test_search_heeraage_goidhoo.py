#!/usr/bin/env python3
"""
Test script to check heeraage, goidhoo search
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

def test_heeraage_goidhoo_search():
    """Test what happens when searching for heeraage, goidhoo"""
    print("🔍 Testing Search for 'heeraage, goidhoo'\n")
    
    # Test 1: Search for entries with address "heeraage" and island containing "goidhoo"
    print("📝 Test 1: Search for heeraage + goidhoo")
    entries = PhoneBookEntry.objects.filter(
        address__iexact='heeraage',
        island__name__icontains='goidhoo'
    )
    print(f"   Found {entries.count()} entries")
    
    if entries.count() > 0:
        print("   Sample entries:")
        for i, entry in enumerate(entries[:5]):
            island_name = entry.island.name if entry.island else "None"
            print(f"     {i+1}. PID: {entry.pid}, Name: {entry.name}, Island: {island_name}")
    
    # Test 2: Check what islands contain "goidhoo"
    print("\n📝 Test 2: All islands containing 'goidhoo'")
    goidhoo_islands = Island.objects.filter(name__icontains='goidhoo')
    print(f"   Found {goidhoo_islands.count()} islands")
    
    for island in goidhoo_islands:
        print(f"     - {island.name}")
    
    # Test 3: Check entries for each goidhoo island
    print("\n📝 Test 3: Entries for each goidhoo island")
    for island in goidhoo_islands:
        island_entries = PhoneBookEntry.objects.filter(
            address__iexact='heeraage',
            island=island
        )
        print(f"   {island.name}: {island_entries.count()} entries")
        
        if island_entries.count() > 0:
            print("     Sample entries:")
            for entry in island_entries[:3]:
                print(f"       - {entry.name} (PID: {entry.pid})")
    
    # Test 4: Check the specific family group that exists
    print("\n📝 Test 4: Existing family group for heeraage, sh. goidhoo")
    from dirReactFinal_family.models import FamilyGroup
    
    family_group = FamilyGroup.objects.filter(
        address__iexact='heeraage',
        island__name__icontains='goidhoo'
    ).first()
    
    if family_group:
        print(f"   ✅ Found family group: {family_group.id}")
        print(f"      Address: {family_group.address}")
        print(f"      Island: {family_group.island.name}")
        print(f"      Members: {family_group.members.count()}")
        print(f"      Relationships: {family_group.relationships.count()}")
        
        # Show all members
        print("      All members:")
        for member in family_group.members.all():
            entry = member.entry
            print(f"        - {entry.name} (PID: {entry.pid}, Role: {member.role_in_family})")
    else:
        print("   ❌ No family group found")

if __name__ == "__main__":
    test_heeraage_goidhoo_search()
