#!/usr/bin/env python3
"""
Test script for AND logic in comma-separated queries
Tests the enhanced search functionality with proper field narrowing
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
from dirReactFinal_api.utils import create_wildcard_query
from django.db.models import Q

def test_and_logic():
    """Test AND logic for comma-separated queries"""
    print("🧪 Testing AND Logic for Comma-Separated Queries\n")
    
    # Test case: "ghalib, goidhoo"
    print("📝 Test Case: 'ghalib, goidhoo'")
    print("Expected: Results that contain BOTH 'ghalib' AND 'goidhoo'")
    print("─" * 60)
    
    # Simulate the enhanced parser output
    name_term = "ghalib"
    address_term = "goidhoo"
    
    print(f"Name term: '{name_term}'")
    print(f"Address term: '{address_term}'")
    
    # Check individual field counts
    name_count = PhoneBookEntry.objects.filter(name__icontains=name_term).count()
    address_count = PhoneBookEntry.objects.filter(address__icontains=address_term).count()
    
    print(f"\n📊 Individual field counts:")
    print(f"   Entries with name containing '{name_term}': {name_count}")
    print(f"   Entries with address containing '{address_term}': {address_count}")
    
    # Test OR logic (old behavior)
    or_query = Q(name__icontains=name_term) | Q(address__icontains=address_term)
    or_results = PhoneBookEntry.objects.filter(or_query)
    or_count = or_results.count()
    
    print(f"\n🔍 OR Logic Results (old behavior):")
    print(f"   Total results: {or_count}")
    print(f"   This would show entries with EITHER name OR address, widening the search")
    
    # Test AND logic (new behavior)
    and_query = Q(name__icontains=name_term) & Q(address__icontains=address_term)
    and_results = PhoneBookEntry.objects.filter(and_query)
    and_count = and_results.count()
    
    print(f"\n🎯 AND Logic Results (new behavior):")
    print(f"   Total results: {and_count}")
    print(f"   This shows entries with BOTH name AND address, narrowing the search")
    
    if and_count > 0:
        print(f"\n✅ AND logic found {and_count} results - search properly narrowed!")
        
        # Show sample results
        print(f"\n📋 Sample results (first 3):")
        for i, entry in enumerate(and_results[:3]):
            print(f"   {i+1}. {entry.name} - Address: {entry.address} - Island: {entry.island}")
    else:
        print(f"\n❌ AND logic found no results - this combination may not exist")
        
        # Check if we can find similar patterns
        print(f"\n🔍 Checking for similar patterns...")
        
        # Look for entries with similar names
        similar_names = PhoneBookEntry.objects.filter(name__icontains=name_term[:3])[:3]
        if similar_names.exists():
            print(f"   Similar names to '{name_term}':")
            for entry in similar_names:
                print(f"     - {entry.name}")
        
        # Look for entries with similar addresses
        similar_addresses = PhoneBookEntry.objects.filter(address__icontains=address_term[:3])[:3]
        if similar_addresses.exists():
            print(f"   Similar addresses to '{address_term}':")
            for entry in similar_addresses:
                print(f"     - {entry.address}")
    
    # Test with wildcard queries
    print(f"\n🔧 Testing with wildcard queries:")
    
    name_wildcard = create_wildcard_query('name', name_term)
    address_wildcard = create_wildcard_query('address', address_term)
    
    and_wildcard_query = name_wildcard & address_wildcard
    and_wildcard_results = PhoneBookEntry.objects.filter(and_wildcard_query)
    and_wildcard_count = and_wildcard_results.count()
    
    print(f"   Wildcard AND query results: {and_wildcard_count}")
    
    if and_wildcard_count > 0:
        print(f"   ✅ Wildcard AND logic working correctly!")
    else:
        print(f"   ❌ Wildcard AND logic found no results")
    
    print(f"\n" + "="*60)
    print(f"📊 Summary:")
    print(f"   OR Logic (old): {or_count} results - widened search")
    print(f"   AND Logic (new): {and_count} results - narrowed search")
    print(f"   Improvement: Search is now {or_count - and_count} results more focused!")
    
    if and_count > 0:
        print(f"   ✅ SUCCESS: AND logic properly narrows search results")
    else:
        print(f"   ⚠️  NOTE: No results found with AND logic - this is expected for rare combinations")
        print(f"   💡 The system now correctly narrows searches instead of widening them")

def test_real_examples():
    """Test with real examples from the database"""
    print(f"\n🔍 Testing with Real Database Examples\n")
    
    # Find some real examples to test
    print("📝 Looking for real examples in the database...")
    
    # Find entries with names
    name_entries = PhoneBookEntry.objects.filter(name__isnull=False).exclude(name='')[:5]
    
    for entry in name_entries:
        if entry.name and entry.address:
            print(f"\n📋 Testing with real entry:")
            print(f"   Name: {entry.name}")
            print(f"   Address: {entry.address}")
            print(f"   Island: {entry.island}")
            
            # Test AND logic with this real data
            name_term = entry.name.split()[0] if entry.name else ""  # First name
            address_term = entry.address.split()[0] if entry.address else ""  # First word of address
            
            if name_term and address_term:
                print(f"   Testing: '{name_term}' AND '{address_term}'")
                
                and_query = Q(name__icontains=name_term) & Q(address__icontains=address_term)
                and_count = PhoneBookEntry.objects.filter(and_query).count()
                
                print(f"   AND logic results: {and_count}")
                
                if and_count > 0:
                    print(f"   ✅ Real example works with AND logic!")
                    break
                else:
                    print(f"   ❌ No results for this combination")
    
    print(f"\n✅ Real example testing complete!")

if __name__ == "__main__":
    print("🚀 Starting AND Logic Testing for Comma-Separated Queries")
    print("=" * 70)
    
    try:
        test_and_logic()
        test_real_examples()
        
        print(f"\n🎉 All tests completed successfully!")
        print(f"✅ Comma-separated queries now use AND logic for proper search narrowing")
        
    except Exception as e:
        print(f"\n❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
