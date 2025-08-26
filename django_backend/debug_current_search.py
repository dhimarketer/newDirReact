#!/usr/bin/env python3
"""
Debug script to understand current search system behavior
Why "ghalib, goidhoo" returns 34 results instead of 1
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

def debug_current_search_system():
    """Debug what the current search system is actually doing"""
    print("🔍 Debugging Current Search System Behavior\n")
    
    print("📝 User Query: 'ghalib, goidhoo'")
    print("📊 User Reports: 34 results")
    print("📊 Database Analysis: 1 result")
    print("🔍 Investigating the discrepancy...")
    print("─" * 70)
    
    # Let's check if there's a different interpretation of the search
    print(f"\n🎯 Possible Search Interpretations:")
    
    # Interpretation 1: Comma-separated with field detection
    print(f"\n📝 Interpretation 1: Comma-separated with field detection")
    print(f"   'ghalib' → name field")
    print(f"   'goidhoo' → island field")
    print(f"   Query: name='ghalib' AND island='goidhoo'")
    
    field_specific_query = Q(name__icontains='ghalib') & Q(island__icontains='goidhoo')
    field_specific_results = PhoneBookEntry.objects.filter(field_specific_query)
    field_specific_count = field_specific_results.count()
    
    print(f"   Results: {field_specific_count}")
    if field_specific_count > 0:
        for entry in field_specific_results:
            print(f"      - {entry.name} | Island: {entry.island}")
    
    # Interpretation 2: Both terms in same field (name)
    print(f"\n📝 Interpretation 2: Both terms in name field")
    print(f"   Query: name='ghalib' AND name='goidhoo'")
    
    both_in_name_query = Q(name__icontains='ghalib') & Q(name__icontains='goidhoo')
    both_in_name_results = PhoneBookEntry.objects.filter(both_in_name_query)
    both_in_name_count = both_in_name_results.count()
    
    print(f"   Results: {both_in_name_count}")
    if both_in_name_count > 0:
        for entry in both_in_name_results:
            print(f"      - {entry.name}")
    
    # Interpretation 3: OR logic instead of AND
    print(f"\n📝 Interpretation 3: OR logic instead of AND")
    print(f"   Query: name='ghalib' OR island='goidhoo'")
    
    or_logic_query = Q(name__icontains='ghalib') | Q(island__icontains='goidhoo')
    or_logic_results = PhoneBookEntry.objects.filter(or_logic_query)
    or_logic_count = or_logic_results.count()
    
    print(f"   Results: {or_logic_count}")
    if or_logic_count > 0:
        print(f"   📋 Sample results:")
        for i, entry in enumerate(or_logic_results[:5]):
            print(f"      {i+1}. {entry.name} | Island: {entry.island}")
    
    # Interpretation 4: Search all fields for each term
    print(f"\n📝 Interpretation 4: Search all fields for each term")
    print(f"   'ghalib' in any field AND 'goidhoo' in any field")
    
    all_fields_query = Q()
    
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
    
    all_fields_query = ghalib_any_field & goidhoo_any_field
    all_fields_results = PhoneBookEntry.objects.filter(all_fields_query)
    all_fields_count = all_fields_results.count()
    
    print(f"   Results: {all_fields_count}")
    if all_fields_count > 0:
        print(f"   📋 Sample results:")
        for i, entry in enumerate(all_fields_results[:5]):
            print(f"      {i+1}. {entry.name} | Address: {entry.address} | Island: {entry.island}")
    
    # Let's check if there are entries with "goidhoo" in the name field
    print(f"\n🔍 Checking for 'goidhoo' in name field:")
    
    goidhoo_in_name = PhoneBookEntry.objects.filter(name__icontains='goidhoo')
    print(f"   Entries with 'goidhoo' in name: {goidhoo_in_name.count()}")
    
    if goidhoo_in_name.count() > 0:
        print(f"   📋 These entries:")
        for entry in goidhoo_in_name:
            print(f"      - {entry.name}")
    
    # Now let's check if the current system might be doing something different
    print(f"\n🔍 Possible Current System Behavior:")
    
    # Maybe the current system is treating this as a general search, not comma-separated
    print(f"\n📝 General Search Interpretation:")
    print(f"   Query: 'ghalib goidhoo' (space-separated, not comma-separated)")
    
    # This would search for entries containing both terms anywhere
    general_search_query = Q()
    for term in ['ghalib', 'goidhoo']:
        general_search_query &= (
            Q(name__icontains=term) |
            Q(address__icontains=term) |
            Q(island__icontains=term) |
            Q(party__icontains=term) |
            Q(profession__icontains=term)
        )
    
    general_search_results = PhoneBookEntry.objects.filter(general_search_query)
    general_search_count = general_search_results.count()
    
    print(f"   Results: {general_search_count}")
    if general_search_count > 0:
        print(f"   📋 Sample results:")
        for i, entry in enumerate(general_search_results[:5]):
            print(f"      {i+1}. {entry.name} | Address: {entry.address} | Island: {entry.island}")
    
    # Let's also check if there might be some entries we missed
    print(f"\n🔍 Double-checking all possibilities:")
    
    # Check if there are entries with "ghalib" in name that also have "goidhoo" somewhere
    ghalib_name_entries = PhoneBookEntry.objects.filter(name__icontains='ghalib')
    print(f"   Entries with 'ghalib' in name: {ghalib_name_entries.count()}")
    
    # For each of these, check if they also contain "goidhoo" anywhere
    ghalib_with_goidhoo_anywhere = []
    for entry in ghalib_name_entries:
        entry_text = f"{entry.name} {entry.address} {entry.island} {entry.party} {entry.profession}".lower()
        if 'goidhoo' in entry_text:
            ghalib_with_goidhoo_anywhere.append(entry)
    
    print(f"   Entries with 'ghalib' in name AND 'goidhoo' anywhere: {len(ghalib_with_goidhoo_anywhere)}")
    
    if len(ghalib_with_goidhoo_anywhere) > 0:
        print(f"   📋 These entries:")
        for entry in ghalib_with_goidhoo_anywhere:
            print(f"      - {entry.name} | Address: {entry.address} | Island: {entry.island}")
    
    # Let's also check if there might be some pattern we're missing
    print(f"\n🔍 Checking for patterns we might have missed:")
    
    # Maybe there are entries with "ghalib" in address or island?
    ghalib_in_address = PhoneBookEntry.objects.filter(address__icontains='ghalib').count()
    ghalib_in_island = PhoneBookEntry.objects.filter(island__icontains='ghalib').count()
    
    print(f"   'ghalib' in address: {ghalib_in_address}")
    print(f"   'ghalib' in island: {ghalib_in_island}")
    
    # Maybe there are entries with "goidhoo" in address?
    goidhoo_in_address = PhoneBookEntry.objects.filter(address__icontains='goidhoo').count()
    print(f"   'goidhoo' in address: {goidhoo_in_address}")
    
    print(f"\n💡 Analysis:")
    print(f"   The discrepancy suggests the current search system is using")
    print(f"   a different interpretation than what we're testing.")
    print(f"   It might be treating 'ghalib, goidhoo' as a general search")
    print(f"   rather than comma-separated field-specific search.")

if __name__ == "__main__":
    print("🚀 Starting Current Search System Debug")
    print("=" * 70)
    
    try:
        debug_current_search_system()
        
        print(f"\n🎉 Debug completed!")
        print(f"✅ Now we understand the discrepancy between user results and database analysis")
        
    except Exception as e:
        print(f"\n❌ Error during debug: {e}")
        import traceback
        traceback.print_exc()
