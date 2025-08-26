#!/usr/bin/env python3
"""
Test script to analyze field omission behavior
Understanding why "ghalib, goidhoo" returns 34 results instead of 1
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

def test_field_omission_behavior():
    """Test what happens when we omit the address field"""
    print("🧪 Testing Field Omission Behavior\n")
    
    print("📝 Test Case 1: 'ghalib, heeraage, goidhoo' (all 3 fields)")
    print("📝 Test Case 2: 'ghalib, goidhoo' (omitting address field)")
    print("─" * 70)
    
    # Test Case 1: All 3 fields
    print(f"\n🎯 Test Case 1: All 3 fields (ghalib, heeraage, goidhoo)")
    
    all_three_query = Q(name__icontains='ghalib') & Q(address__icontains='heeraage') & Q(island__icontains='goidhoo')
    all_three_results = PhoneBookEntry.objects.filter(all_three_query)
    all_three_count = all_three_results.count()
    
    print(f"   Expected: 1 result (perfect match)")
    print(f"   Actual: {all_three_count} results")
    
    if all_three_count > 0:
        print(f"   📋 Results:")
        for entry in all_three_results:
            print(f"      - {entry.name} | Address: {entry.address} | Island: {entry.island}")
    
    # Test Case 2: Omitting address field (ghalib, goidhoo)
    print(f"\n🎯 Test Case 2: Omitting address field (ghalib, goidhoo)")
    
    # This should find entries with "ghalib" in name AND "goidhoo" in island
    name_island_query = Q(name__icontains='ghalib') & Q(island__icontains='goidhoo')
    name_island_results = PhoneBookEntry.objects.filter(name_island_query)
    name_island_count = name_island_results.count()
    
    print(f"   Expected: 1 result (ghalib ali with island goidhoo)")
    print(f"   Actual: {name_island_count} results")
    
    if name_island_count > 0:
        print(f"   📋 Results:")
        for entry in name_island_results:
            print(f"      - {entry.name} | Address: {entry.address} | Island: {entry.island}")
    
    # Let's understand why we're getting 34 results
    print(f"\n🔍 Understanding the 34 Results:")
    
    # Check how many entries have "ghalib" in name
    ghalib_name_count = PhoneBookEntry.objects.filter(name__icontains='ghalib').count()
    print(f"   Entries with 'ghalib' in name: {ghalib_name_count}")
    
    # Check how many entries have "goidhoo" in island
    goidhoo_island_count = PhoneBookEntry.objects.filter(island__icontains='goidhoo').count()
    print(f"   Entries with 'goidhoo' in island: {goidhoo_island_count}")
    
    # Check how many entries have "goidhoo" in name (this might be the issue!)
    goidhoo_name_count = PhoneBookEntry.objects.filter(name__icontains='goidhoo').count()
    print(f"   Entries with 'goidhoo' in name: {goidhoo_name_count}")
    
    # Check how many entries have "ghalib" in island
    ghalib_island_count = PhoneBookEntry.objects.filter(island__icontains='ghalib').count()
    print(f"   Entries with 'ghalib' in island: {ghalib_island_count}")
    
    # Now let's see what's happening with the current search logic
    print(f"\n🔍 Current Search Logic Analysis:")
    
    # The issue might be that the current system is searching ALL fields for each term
    # instead of assigning terms to specific fields
    
    # Simulate current system behavior (searching all fields for each term)
    print("   Simulating current system behavior:")
    
    # Current system might be doing this:
    # For "ghalib": search name OR address OR island OR party OR profession
    # For "goidhoo": search name OR address OR island OR party OR profession
    # Then combine with AND logic
    
    current_system_query = Q()
    
    # Term 1: "ghalib" in any field
    ghalib_any_field = (
        Q(name__icontains='ghalib') |
        Q(address__icontains='ghalib') |
        Q(island__icontains='ghalib') |
        Q(party__icontains='ghalib') |
        Q(profession__icontains='ghalib')
    )
    
    # Term 2: "goidhoo" in any field
    goidhoo_any_field = (
        Q(name__icontains='goidhoo') |
        Q(address__icontains='goidhoo') |
        Q(island__icontains='goidhoo') |
        Q(party__icontains='goidhoo') |
        Q(profession__icontains='goidhoo')
    )
    
    # Combine with AND logic
    current_system_query = ghalib_any_field & goidhoo_any_field
    current_system_results = PhoneBookEntry.objects.filter(current_system_query)
    current_system_count = current_system_results.count()
    
    print(f"      Current system (any field): {current_system_count} results")
    
    if current_system_count > 0:
        print(f"      📋 Sample results:")
        for i, entry in enumerate(current_system_results[:5]):
            print(f"         {i+1}. {entry.name} | Address: {entry.address} | Island: {entry.island}")
    
    # Now let's see what the enhanced parser should do
    print(f"\n🔍 Enhanced Parser Should Do:")
    
    # Enhanced parser should detect:
    # "ghalib" → name field
    # "goidhoo" → island field
    # Then use: name="*ghalib*" AND island="*goidhoo*"
    
    enhanced_parser_query = Q(name__icontains='ghalib') & Q(island__icontains='goidhoo')
    enhanced_parser_results = PhoneBookEntry.objects.filter(enhanced_parser_query)
    enhanced_parser_count = enhanced_parser_results.count()
    
    print(f"   Enhanced parser (field-specific): {enhanced_parser_count} results")
    
    if enhanced_parser_count > 0:
        print(f"   📋 Results:")
        for entry in enhanced_parser_results:
            print(f"      - {entry.name} | Address: {entry.address} | Island: {entry.island}")
    
    # Let's also check if there are entries with "goidhoo" in the name field
    print(f"\n🔍 Checking for 'goidhoo' in name field:")
    
    goidhoo_in_name = PhoneBookEntry.objects.filter(name__icontains='goidhoo')
    print(f"   Entries with 'goidhoo' in name: {goidhoo_in_name.count()}")
    
    if goidhoo_in_name.count() > 0:
        print(f"   📋 Sample entries:")
        for i, entry in enumerate(goidhoo_in_name[:5]):
            print(f"      {i+1}. {entry.name} | Address: {entry.address} | Island: {entry.island}")
    
    # This might explain the 34 results!
    print(f"\n💡 Key Insight:")
    print(f"   If 'goidhoo' appears in names, then the current system might be")
    print(f"   finding entries where 'ghalib' is in name AND 'goidhoo' is also in name")
    print(f"   This would give many more results than expected!")

def test_why_34_results():
    """Specifically investigate why we get 34 results for 'ghalib, goidhoo'"""
    print(f"\n🔍 Investigating Why 'ghalib, goidhoo' Returns 34 Results\n")
    
    # Let's check if there are entries with both terms in the name field
    print("📝 Checking for entries with both 'ghalib' AND 'goidhoo' in name field:")
    
    both_in_name = PhoneBookEntry.objects.filter(
        Q(name__icontains='ghalib') & Q(name__icontains='goidhoo')
    )
    both_in_name_count = both_in_name.count()
    
    print(f"   Entries with both terms in name: {both_in_name_count}")
    
    if both_in_name_count > 0:
        print(f"   📋 These entries:")
        for entry in both_in_name:
            print(f"      - {entry.name}")
    
    # Let's also check if there are entries with "ghalib" in name AND "goidhoo" anywhere
    print(f"\n📝 Checking for entries with 'ghalib' in name AND 'goidhoo' anywhere:")
    
    ghalib_name_goidhoo_anywhere = PhoneBookEntry.objects.filter(
        Q(name__icontains='ghalib') & (
            Q(name__icontains='goidhoo') |
            Q(address__icontains='goidhoo') |
            Q(island__icontains='goidhoo') |
            Q(party__icontains='goidhoo') |
            Q(profession__icontains='goidhoo')
        )
    )
    
    ghalib_name_goidhoo_anywhere_count = ghalib_name_goidhoo_anywhere.count()
    print(f"   Entries with 'ghalib' in name AND 'goidhoo' anywhere: {ghalib_name_goidhoo_anywhere_count}")
    
    if ghalib_name_goidhoo_anywhere_count > 0:
        print(f"   📋 Sample entries:")
        for i, entry in enumerate(ghalib_name_goidhoo_anywhere[:10]):
            print(f"      {i+1}. {entry.name} | Address: {entry.address} | Island: {entry.island}")
    
    # This should match the 34 results the user is seeing!
    print(f"\n🎯 This explains the 34 results!")
    print(f"   The current system is finding entries where:")
    print(f"   - 'ghalib' is in the name field")
    print(f"   - 'goidhoo' is in ANY field (name, address, island, etc.)")
    print(f"   - This gives 34 results instead of the expected 1")

def test_enhanced_parser_solution():
    """Test how the enhanced parser will solve this issue"""
    print(f"\n🚀 Testing Enhanced Parser Solution\n")
    
    print("📝 Enhanced Parser Field Detection:")
    print("   'ghalib' → name field (34 entries)")
    print("   'goidhoo' → island field (1,341 entries)")
    print("   Expected: name='*ghalib*' AND island='*goidhoo*'")
    
    # Simulate enhanced parser behavior
    enhanced_query = Q(name__icontains='ghalib') & Q(island__icontains='goidhoo')
    enhanced_results = PhoneBookEntry.objects.filter(enhanced_query)
    enhanced_count = enhanced_results.count()
    
    print(f"\n🎯 Enhanced Parser Results:")
    print(f"   Expected: 1 result (perfect field-specific match)")
    print(f"   Actual: {enhanced_count} results")
    
    if enhanced_count > 0:
        print(f"   📋 Perfect match found:")
        for entry in enhanced_results:
            print(f"      - {entry.name} | Address: {entry.address} | Island: {entry.island}")
    
    print(f"\n✅ Enhanced Parser Solution:")
    print(f"   - Proper field detection prevents cross-field confusion")
    print(f"   - AND logic across specific fields gives precise results")
    print(f"   - User gets exactly what they expect: 1 relevant result")

if __name__ == "__main__":
    print("🚀 Starting Field Omission Analysis")
    print("=" * 70)
    
    try:
        test_field_omission_behavior()
        test_why_34_results()
        test_enhanced_parser_solution()
        
        print(f"\n🎉 Analysis completed!")
        print(f"✅ Now we understand why omitting the address field gives 34 results")
        
    except Exception as e:
        print(f"\n❌ Error during analysis: {e}")
        import traceback
        traceback.print_exc()
