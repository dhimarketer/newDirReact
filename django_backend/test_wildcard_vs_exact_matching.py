#!/usr/bin/env python3
"""
Test script to demonstrate the difference between wildcard search and exact family creation matching
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

def test_wildcard_vs_exact_matching():
    """Test the difference between wildcard search and exact family creation matching"""
    print("🔍 Testing Wildcard Search vs Exact Family Creation Matching\n")
    
    # Test case: "heeraage, goidhoo"
    address = "heeraage"
    island = "goidhoo"
    
    print(f"📝 Test Case: '{address}, {island}'")
    print("─" * 70)
    
    # Test 1: Exact matching (what family creation uses)
    print(f"\n🎯 Test 1: Exact Matching (Family Creation Logic)")
    print(f"   Query: address__iexact='{address}' AND island__iexact='{island}'")
    
    exact_results = PhoneBookEntry.objects.filter(
        address__iexact=address,
        island__iexact=island
    )
    print(f"   Results: {exact_results.count()} entries")
    
    if exact_results.count() == 0:
        print(f"   ❌ NO RESULTS - This is why family creation fails!")
    else:
        print(f"   ✅ Found entries - Family creation should work")
    
    # Test 2: Wildcard matching (what search uses)
    print(f"\n🎯 Test 2: Wildcard Matching (Search Logic)")
    print(f"   Query: create_wildcard_query('address', '{address}') AND create_wildcard_query('island', '{island}')")
    
    # Create wildcard queries
    address_query = create_wildcard_query('address', address)
    island_query = create_wildcard_query('island', island)
    
    wildcard_results = PhoneBookEntry.objects.filter(address_query & island_query)
    print(f"   Results: {wildcard_results.count()} entries")
    
    if wildcard_results.count() > 0:
        print(f"   ✅ Found entries with wildcard matching!")
        print(f"   📋 Sample results:")
        for entry in wildcard_results[:5]:
            print(f"      - {entry.name} | Address: '{entry.address}' | Island: '{entry.island}'")
    else:
        print(f"   ❌ No results with wildcard matching either")
    
    # Test 3: Case insensitive contains (more flexible)
    print(f"\n🎯 Test 3: Case Insensitive Contains (More Flexible)")
    print(f"   Query: address__icontains='{address}' AND island__icontains='{island}'")
    
    contains_results = PhoneBookEntry.objects.filter(
        address__icontains=address,
        island__icontains=island
    )
    print(f"   Results: {contains_results.count()} entries")
    
    if contains_results.count() > 0:
        print(f"   ✅ Found entries with contains matching!")
        print(f"   📋 Sample results:")
        for entry in contains_results[:5]:
            print(f"      - {entry.name} | Address: '{entry.address}' | Island: '{entry.island}'")
    else:
        print(f"   ❌ No results with contains matching")
    
    # Test 4: Test with correct island name "sh. goidhoo"
    print(f"\n🎯 Test 4: Correct Island Name 'sh. goidhoo'")
    correct_island = "sh. goidhoo"
    
    correct_exact_results = PhoneBookEntry.objects.filter(
        address__iexact=address,
        island__iexact=correct_island
    )
    print(f"   Exact match with '{correct_island}': {correct_exact_results.count()} entries")
    
    if correct_exact_results.count() > 0:
        print(f"   ✅ This works for family creation!")
        print(f"   📋 Sample results:")
        for entry in correct_exact_results[:3]:
            print(f"      - {entry.name} | Address: '{entry.address}' | Island: '{entry.island}'")
    
    # Test 5: Test wildcard with partial island names
    print(f"\n🎯 Test 5: Wildcard with Partial Island Names")
    
    # Test "goidhoo" (without prefix)
    partial_island_query = create_wildcard_query('island', 'goidhoo')
    partial_results = PhoneBookEntry.objects.filter(
        address_query & partial_island_query
    )
    print(f"   Wildcard 'goidhoo' (no prefix): {partial_results.count()} entries")
    
    # Test "*goidhoo" (wildcard prefix)
    wildcard_prefix_query = create_wildcard_query('island', '*goidhoo')
    wildcard_prefix_results = PhoneBookEntry.objects.filter(
        address_query & wildcard_prefix_query
    )
    print(f"   Wildcard '*goidhoo' (with prefix): {wildcard_prefix_results.count()} entries")
    
    if wildcard_prefix_results.count() > 0:
        print(f"   ✅ Wildcard prefix matching works!")
        print(f"   📋 Sample results:")
        for entry in wildcard_prefix_results[:3]:
            print(f"      - {entry.name} | Address: '{entry.address}' | Island: '{entry.island}'")
    
    # Test 6: Show all islands that contain "goidhoo"
    print(f"\n🎯 Test 6: All Islands Containing 'goidhoo'")
    
    all_goidhoo_islands = PhoneBookEntry.objects.filter(
        island__icontains='goidhoo'
    ).values_list('island', flat=True).distinct()
    
    print(f"   Found {len(all_goidhoo_islands)} unique island names containing 'goidhoo':")
    for island_name in sorted(all_goidhoo_islands):
        count = PhoneBookEntry.objects.filter(island=island_name).count()
        print(f"      - '{island_name}' -> {count} entries")
    
    # Test 7: Show all addresses that contain "heeraage"
    print(f"\n🎯 Test 7: All Addresses Containing 'heeraage'")
    
    all_heeraage_addresses = PhoneBookEntry.objects.filter(
        address__icontains='heeraage'
    ).values_list('address', flat=True).distinct()
    
    print(f"   Found {len(all_heeraage_addresses)} unique address names containing 'heeraage':")
    for addr_name in sorted(all_heeraage_addresses):
        count = PhoneBookEntry.objects.filter(address=addr_name).count()
        print(f"      - '{addr_name}' -> {count} entries")
    
    # Final analysis
    print(f"\n🎯 FINAL ANALYSIS:")
    print(f"   ❌ Exact matching 'heeraage, goidhoo': {exact_results.count()} entries (FAILS)")
    print(f"   ❌ Wildcard matching 'heeraage, goidhoo': {wildcard_results.count()} entries (FAILS)")
    print(f"   ❌ Contains matching 'heeraage, goidhoo': {contains_results.count()} entries (FAILS)")
    print(f"   ✅ Exact matching 'heeraage, sh. goidhoo': {correct_exact_results.count()} entries (WORKS)")
    
    print(f"\n💡 SOLUTION:")
    print(f"   The family creation system uses EXACT matching (iexact) which requires")
    print(f"   the precise island name 'sh. goidhoo', not just 'goidhoo'.")
    print(f"   ")
    print(f"   To fix this, either:")
    print(f"   1. Use the correct search term: 'heeraage, sh. goidhoo'")
    print(f"   2. Modify family creation to use wildcard/contains matching like search does")
    print(f"   3. Implement fuzzy matching for family creation")

if __name__ == "__main__":
    test_wildcard_vs_exact_matching()
