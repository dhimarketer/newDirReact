#!/usr/bin/env python3
"""
Test script to analyze actual search results for "ghalib,heeraage, goidhoo"
Understanding why the search is working and finding results
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
from django.db.models import Q

def analyze_actual_results():
    """Analyze the actual search results that the user is seeing"""
    print("🔍 Analyzing Actual Search Results for 'ghalib,heeraage, goidhoo'\n")
    
    # The user's actual search terms
    search_terms = ['ghalib', 'heeraage', 'goidhoo']
    
    print("📝 Search Terms: ghalib, heeraage, goidhoo")
    print("📊 User Found: 2 entries")
    print("─" * 70)
    
    # Let's find the actual entries that match
    print("\n🎯 Finding Actual Matching Entries:")
    
    # Search for entries containing all three terms (anywhere)
    all_terms_query = Q()
    for term in search_terms:
        all_terms_query &= (
            Q(name__icontains=term) |
            Q(address__icontains=term) |
            Q(island__icontains=term) |
            Q(party__icontains=term) |
            Q(profession__icontains=term) |
            Q(remark__icontains=term)
        )
    
    matching_entries = PhoneBookEntry.objects.filter(all_terms_query)
    print(f"   Total entries with all 3 terms: {matching_entries.count()}")
    
    if matching_entries.count() > 0:
        print(f"   📋 Matching entries:")
        for i, entry in enumerate(matching_entries):
            print(f"      {i+1}. {entry.name}")
            print(f"         Contact: {entry.contact}")
            print(f"         NID: {entry.nid}")
            print(f"         Address: {entry.address}")
            print(f"         Atoll: {entry.atoll}")
            print(f"         Island: {entry.island}")
            print(f"         Party: {entry.party}")
            print(f"         Profession: {entry.profession}")
            print(f"         Gender: {entry.gender}")
            print(f"         Remark: {entry.remark}")
            print("")
    
    # Let's also check what the user might be seeing
    print("\n🔍 Checking for entries that might match the user's results:")
    
    # Look for entries with "ghalib" in name
    ghalib_entries = PhoneBookEntry.objects.filter(name__icontains='ghalib')
    print(f"   Entries with 'ghalib' in name: {ghalib_entries.count()}")
    
    if ghalib_entries.count() > 0:
        print(f"   📋 Sample ghalib entries:")
        for i, entry in enumerate(ghalib_entries[:3]):
            print(f"      {i+1}. {entry.name}")
            print(f"         Address: {entry.address}")
            print(f"         Island: {entry.island}")
            print(f"         Party: {entry.party}")
            print("")
    
    # Look for entries with "heeraage" in address
    heeraage_entries = PhoneBookEntry.objects.filter(address__icontains='heeraage')
    print(f"   Entries with 'heeraage' in address: {heeraage_entries.count()}")
    
    if heeraage_entries.count() > 0:
        print(f"   📋 Sample heeraage entries:")
        for i, entry in enumerate(heeraage_entries[:3]):
            print(f"         Name: {entry.name}")
            print(f"         Address: {entry.address}")
            print(f"         Island: {entry.island}")
            print("")
    
    # Look for entries with "goidhoo" in island
    goidhoo_entries = PhoneBookEntry.objects.filter(island__icontains='goidhoo')
    print(f"   Entries with 'goidhoo' in island: {goidhoo_entries.count()}")
    
    if goidhoo_entries.count() > 0:
        print(f"   📋 Sample goidhoo entries:")
        for i, entry in enumerate(goidhoo_entries[:3]):
            print(f"         Name: {entry.name}")
            print(f"         Address: {entry.address}")
            print(f"         Island: {entry.island}")
            print("")
    
    # Now let's understand why the search is working
    print("\n💡 Understanding Why Search Works:")
    
    # Check if there are entries that have multiple terms in different fields
    print("   Checking for entries with multiple terms in different fields:")
    
    # Look for entries with both "ghalib" in name AND "heeraage" in address
    ghalib_heeraage = PhoneBookEntry.objects.filter(
        Q(name__icontains='ghalib') & Q(address__icontains='heeraage')
    )
    print(f"      ghalib (name) + heeraage (address): {ghalib_heeraage.count()}")
    
    # Look for entries with both "ghalib" in name AND "goidhoo" in island
    ghalib_goidhoo = PhoneBookEntry.objects.filter(
        Q(name__icontains='ghalib') & Q(island__icontains='goidhoo')
    )
    print(f"      ghalib (name) + goidhoo (island): {ghalib_goidhoo.count()}")
    
    # Look for entries with both "heeraage" in address AND "goidhoo" in island
    heeraage_goidhoo = PhoneBookEntry.objects.filter(
        Q(address__icontains='heeraage') & Q(island__icontains='goidhoo')
    )
    print(f"      heeraage (address) + goidhoo (island): {heeraage_goidhoo.count()}")
    
    # Look for entries with all three in different fields
    all_three_different = PhoneBookEntry.objects.filter(
        Q(name__icontains='ghalib') & 
        Q(address__icontains='heeraage') & 
        Q(island__icontains='goidhoo')
    )
    print(f"      ghalib (name) + heeraage (address) + goidhoo (island): {all_three_different.count()}")
    
    if all_three_different.count() > 0:
        print(f"   🎯 Found entries with all 3 terms in different fields!")
        for entry in all_three_different:
            print(f"      📋 {entry.name}")
            print(f"         Name contains 'ghalib': {'ghalib' in entry.name.lower()}")
            print(f"         Address contains 'heeraage': {'heeraage' in (entry.address or '').lower()}")
            print(f"         Island contains 'goidhoo': {'goidhoo' in (entry.island or '').lower()}")
            print("")
    
    # Let's also check if there might be some entries with terms in the same field
    print("\n🔍 Checking for entries with multiple terms in the same field:")
    
    # Check if any entry has multiple terms in the name field
    name_multiple = PhoneBookEntry.objects.filter(
        Q(name__icontains='ghalib') & 
        Q(name__icontains='heeraage') & 
        Q(name__icontains='goidhoo')
    )
    print(f"   All 3 terms in name field: {name_multiple.count()}")
    
    # Check if any entry has multiple terms in the address field
    address_multiple = PhoneBookEntry.objects.filter(
        Q(address__icontains='ghalib') & 
        Q(address__icontains='heeraage') & 
        Q(address__icontains='goidhoo')
    )
    print(f"   All 3 terms in address field: {address_multiple.count()}")
    
    # Check if any entry has multiple terms in the island field
    island_multiple = PhoneBookEntry.objects.filter(
        Q(island__icontains='ghalib') & 
        Q(island__icontains='heeraage') & 
        Q(island__icontains='goidhoo')
    )
    print(f"   All 3 terms in island field: {island_multiple.count()}")
    
    print(f"\n✅ Analysis Complete!")
    print(f"💡 The search is working because it's finding entries with terms in different fields")

def test_current_search_behavior():
    """Test how the current search system is actually working"""
    print(f"\n🧪 Testing Current Search System Behavior\n")
    
    # Simulate what the current system might be doing
    print("📝 Simulating Current Search Behavior:")
    
    # Option 1: OR logic across all fields
    print("   Option 1: OR logic across all fields")
    or_query = Q()
    for term in ['ghalib', 'heeraage', 'goidhoo']:
        or_query |= (
            Q(name__icontains=term) |
            Q(address__icontains=term) |
            Q(island__icontains=term) |
            Q(party__icontains=term) |
            Q(profession__icontains=term)
        )
    
    or_results = PhoneBookEntry.objects.filter(or_query)
    print(f"      OR logic results: {or_results.count()} entries")
    
    # Option 2: AND logic across all fields (what we implemented)
    print("   Option 2: AND logic across all fields (enhanced parser)")
    and_query = Q()
    for term in ['ghalib', 'heeraage', 'goidhoo']:
        and_query &= (
            Q(name__icontains=term) |
            Q(address__icontains=term) |
            Q(island__icontains=term) |
            Q(party__icontains=term) |
            Q(profession__icontains=term)
        )
    
    and_results = PhoneBookEntry.objects.filter(and_query)
    print(f"      AND logic results: {and_results.count()} entries")
    
    # Option 3: Field-specific AND logic (what we want)
    print("   Option 3: Field-specific AND logic (optimal)")
    field_specific = Q(name__icontains='ghalib') & Q(address__icontains='heeraage') & Q(island__icontains='goidhoo')
    field_results = PhoneBookEntry.objects.filter(field_specific)
    print(f"      Field-specific results: {field_results.count()} entries")
    
    print(f"\n💡 Current system might be using Option 1 (OR logic) which gives more results")

if __name__ == "__main__":
    print("🚀 Starting Actual Results Analysis")
    print("=" * 70)
    
    try:
        analyze_actual_results()
        test_current_search_behavior()
        
        print(f"\n🎉 Analysis completed!")
        print(f"✅ Now we understand why the search is working and finding results")
        
    except Exception as e:
        print(f"\n❌ Error during analysis: {e}")
        import traceback
        traceback.print_exc()
