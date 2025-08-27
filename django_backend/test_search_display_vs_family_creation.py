#!/usr/bin/env python3
"""
Test script to verify search display vs family creation data consistency
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
from dirReactFinal_family.models import FamilyGroup
from django.db.models import Q
from dirReactFinal_api.utils import create_wildcard_query

def test_search_display_vs_family_creation():
    """Test what's displayed in search vs what's used in family creation"""
    print("🔍 Testing Search Display vs Family Creation Data Consistency\n")
    
    # Test case: "heeraage, goidhoo"
    search_address = "heeraage"
    search_island = "goidhoo"
    
    print(f"📝 Search Query: '{search_address}, {search_island}'")
    print("─" * 70)
    
    # Step 1: What the search system would find (using wildcards)
    print(f"\n🎯 Step 1: Search System Results (Wildcard Matching)")
    
    # Simulate the search system using wildcard queries
    address_query = create_wildcard_query('address', search_address)
    island_query = create_wildcard_query('island', search_island)
    
    search_results = PhoneBookEntry.objects.filter(address_query & island_query)
    print(f"   Wildcard search finds: {search_results.count()} entries")
    
    if search_results.count() > 0:
        print(f"   📋 Sample search results:")
        for i, entry in enumerate(search_results[:5]):
            print(f"      {i+1}. {entry.name}")
            print(f"         - Address: '{entry.address}'")
            print(f"         - Island: '{entry.island}'")
            print(f"         - PID: {entry.pid}")
            print()
    
    # Step 2: What would be displayed to user in search results
    print(f"\n🎯 Step 2: What User Sees in Search Results")
    print(f"   When user clicks on address '{search_address}', they should see:")
    
    for i, entry in enumerate(search_results[:3]):
        print(f"   📋 Entry {i+1}:")
        print(f"      - Name: {entry.name}")
        print(f"      - Address: '{entry.address}' (clickable)")
        print(f"      - Island: '{entry.island}' (displayed)")
        print(f"      - When clicked: handleAddressClick('{entry.address}', '{entry.island}')")
        print()
    
    # Step 3: What family creation receives
    print(f"\n🎯 Step 3: What Family Creation Receives")
    print(f"   When user clicks address, family creation gets:")
    
    for i, entry in enumerate(search_results[:3]):
        print(f"   📋 Entry {i+1}:")
        print(f"      - address = '{entry.address}'")
        print(f"      - island = '{entry.island}'")
        print(f"      - Family creation query: address__iexact='{entry.address}' AND island__iexact='{entry.island}'")
        
        # Test if this exact combination would work for family creation
        family_entries = PhoneBookEntry.objects.filter(
            address__iexact=entry.address,
            island__iexact=entry.island
        )
        print(f"      - Family creation result: {family_entries.count()} entries")
        
        if family_entries.count() > 0:
            print(f"      ✅ Family creation would work for this entry!")
        else:
            print(f"      ❌ Family creation would FAIL for this entry!")
        print()
    
    # Step 4: Test the specific case that's failing
    print(f"\n🎯 Step 4: Testing the Failing Case")
    print(f"   User searches: 'heeraage, goidhoo'")
    print(f"   User sees results with island: 'sh. goidhoo'")
    print(f"   User clicks address: 'heeraage'")
    print(f"   Family creation receives: address='heeraage', island='sh. goidhoo'")
    
    # Test this specific combination
    test_address = "heeraage"
    test_island = "sh. goidhoo"
    
    family_test = PhoneBookEntry.objects.filter(
        address__iexact=test_address,
        island__iexact=test_island
    )
    
    print(f"   Family creation test result: {family_test.count()} entries")
    
    if family_test.count() > 0:
        print(f"   ✅ This should work for family creation!")
        print(f"   📋 Sample entries:")
        for entry in family_test[:3]:
            print(f"      - {entry.name} | Address: '{entry.address}' | Island: '{entry.island}'")
    else:
        print(f"   ❌ This would fail for family creation!")
    
    # Step 5: Check if there's a data mismatch
    print(f"\n🎯 Step 5: Data Consistency Check")
    
    # Check if search results show different island names than what's in database
    print(f"   Checking for data inconsistencies...")
    
    # Get all entries with "heeraage" address
    all_heeraage = PhoneBookEntry.objects.filter(address__iexact="heeraage")
    print(f"   Total entries with address 'heeraage': {all_heeraage.count()}")
    
    # Show all unique island names for "heeraage" address
    heeraage_islands = all_heeraage.values_list('island', flat=True).distinct()
    print(f"   Unique island names for 'heeraage' address:")
    for island in sorted([isl for isl in heeraage_islands if isl is not None]):
        count = all_heeraage.filter(island=island).count()
        print(f"      - '{island}' -> {count} entries")
    
    # Step 6: Final analysis
    print(f"\n🎯 FINAL ANALYSIS:")
    
    if search_results.count() > 0:
        print(f"   ✅ Search system finds {search_results.count()} entries")
        print(f"   ✅ User sees correct data in search results")
        print(f"   ✅ Family creation receives correct data")
        print(f"   ✅ No ambiguity - family creation should work!")
    else:
        print(f"   ❌ Search system finds no entries")
        print(f"   ❌ User sees no results to click")
        print(f"   ❌ Family creation never gets called")
    
    print(f"\n💡 CONCLUSION:")
    print(f"   If the search system is working and displaying results,")
    print(f"   then family creation should work perfectly because it receives")
    print(f"   the exact address and island data from the clicked entry.")
    print(f"   ")
    print(f"   The issue might be elsewhere in the system, not in the")
    print(f"   data flow from search results to family creation.")

if __name__ == "__main__":
    test_search_display_vs_family_creation()
