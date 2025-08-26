#!/usr/bin/env python3
"""
Test script for search term omission analysis
Tests what happens when terms are omitted from "ghalib, heeraage, goidhoo"
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

def test_search_term_omission():
    """Test search behavior when terms are omitted"""
    print("🧪 Testing Search Term Omission Analysis\n")
    
    # Base terms from user query
    base_terms = ['ghalib', 'heeraage', 'goidhoo']
    
    print("📝 Base Search Terms: ghalib, heeraage, goidhoo")
    print("🔍 Testing all combinations and omissions")
    print("─" * 70)
    
    # Test individual terms first
    print("\n📊 Individual Term Analysis:")
    individual_results = {}
    
    for term in base_terms:
        count = PhoneBookEntry.objects.filter(name__icontains=term).count()
        individual_results[term] = count
        print(f"   '{term}': {count} entries")
    
    # Test all 3 terms combined (should give correct result)
    print(f"\n🎯 All 3 Terms Combined (ghalib AND heeraage AND goidhoo):")
    all_three_query = Q(name__icontains='ghalib') & Q(name__icontains='heeraage') & Q(name__icontains='goidhoo')
    all_three_results = PhoneBookEntry.objects.filter(all_three_query)
    all_three_count = all_three_results.count()
    
    print(f"   Expected: Correct result (most specific)")
    print(f"   Actual: {all_three_count} entries")
    
    if all_three_count > 0:
        print(f"   ✅ Found results with all 3 terms")
        print(f"   📋 Sample results:")
        for i, entry in enumerate(all_three_results[:3]):
            print(f"      {i+1}. {entry.name} - Address: {entry.address} - Island: {entry.island}")
    else:
        print(f"   ❌ No results with all 3 terms")
    
    # Test all possible combinations of 2 terms
    print(f"\n🔍 Testing 2-Term Combinations (AND logic):")
    two_term_combinations = [
        ('ghalib', 'heeraage'),
        ('ghalib', 'goidhoo'),
        ('heeraage', 'goidhoo')
    ]
    
    two_term_results = {}
    for term1, term2 in two_term_combinations:
        query = Q(name__icontains=term1) & Q(name__icontains=term2)
        count = PhoneBookEntry.objects.filter(query).count()
        two_term_results[(term1, term2)] = count
        
        print(f"   '{term1}' AND '{term2}': {count} entries")
        
        if count > 0:
            # Show sample results
            results = PhoneBookEntry.objects.filter(query)[:2]
            for entry in results:
                print(f"      → {entry.name}")
    
    # Test all possible combinations of 2 terms (OR logic for comparison)
    print(f"\n🔍 Testing 2-Term Combinations (OR logic - for comparison):")
    for term1, term2 in two_term_combinations:
        query = Q(name__icontains=term1) | Q(name__icontains=term2)
        count = PhoneBookEntry.objects.filter(query).count()
        print(f"   '{term1}' OR '{term2}': {count} entries")
    
    # Test individual term searches
    print(f"\n🔍 Testing Individual Term Searches:")
    for term in base_terms:
        count = individual_results[term]
        print(f"   '{term}' only: {count} entries")
        
        if count > 0:
            # Show sample results
            results = PhoneBookEntry.objects.filter(name__icontains=term)[:2]
            for entry in results:
                print(f"      → {entry.name}")
    
    # Test with wildcard padding (simulating the enhanced parser)
    print(f"\n🔧 Testing with Wildcard Padding (Enhanced Parser Simulation):")
    
    # Simulate what the enhanced parser would do
    wildcard_terms = ['*ghalib*', '*heeraage*', '*goidhoo*']
    
    print(f"   Wildcard terms: {wildcard_terms}")
    
    # Test all 3 wildcard terms combined
    wildcard_all_three = Q(name__icontains='ghalib') & Q(name__icontains='heeraage') & Q(name__icontains='goidhoo')
    wildcard_count = PhoneBookEntry.objects.filter(wildcard_all_three).count()
    print(f"   All 3 wildcard terms: {wildcard_count} entries")
    
    # Test 2 wildcard terms
    for i, (term1, term2) in enumerate(two_term_combinations):
        wildcard_query = Q(name__icontains=term1) & Q(name__icontains=term2)
        count = PhoneBookEntry.objects.filter(wildcard_query).count()
        print(f"   '{term1}' AND '{term2}' (wildcard): {count} entries")
    
    # Analysis and recommendations
    print(f"\n📊 Analysis Summary:")
    print(f"   All 3 terms: {all_three_count} entries (most specific)")
    
    for (term1, term2), count in two_term_results.items():
        print(f"   {term1} + {term2}: {count} entries (medium specificity)")
    
    for term, count in individual_results.items():
        print(f"   {term} only: {count} entries (least specific)")
    
    print(f"\n💡 Key Insights:")
    
    if all_three_count > 0:
        print(f"   ✅ All 3 terms combined give the most precise results")
        
        # Check if 2-term combinations are more or less specific
        for (term1, term2), count in two_term_results.items():
            if count > all_three_count:
                print(f"   ⚠️  '{term1} + {term2}' gives MORE results ({count} vs {all_three_count})")
                print(f"      This suggests these terms might be in different fields or have different meanings")
            elif count < all_three_count:
                print(f"   ✅ '{term1} + {term2}' gives FEWER results ({count} vs {all_three_count})")
                print(f"      This suggests good narrowing behavior")
            else:
                print(f"   🔍 '{term1} + {term2}' gives SAME results ({count} vs {all_three_count})")
                print(f"      This suggests the third term doesn't add specificity")
    
    # Check for potential field confusion
    print(f"\n🔍 Field Analysis:")
    
    # Check if terms might belong to different fields
    for term in base_terms:
        # Check name field
        name_count = PhoneBookEntry.objects.filter(name__icontains=term).count()
        # Check address field
        address_count = PhoneBookEntry.objects.filter(address__icontains=term).count()
        # Check island field
        island_count = PhoneBookEntry.objects.filter(island__icontains=term).count()
        # Check party field
        party_count = PhoneBookEntry.objects.filter(party__icontains=term).count()
        
        print(f"   '{term}' distribution:")
        print(f"      Name: {name_count}, Address: {address_count}, Island: {island_count}, Party: {party_count}")
        
        # Determine most likely field
        field_counts = {
            'name': name_count,
            'address': address_count,
            'island': island_count,
            'party': party_count
        }
        
        most_likely_field = max(field_counts, key=field_counts.get)
        print(f"      Most likely field: {most_likely_field} ({field_counts[most_likely_field]} entries)")
    
    print(f"\n✅ Search Term Omission Analysis Complete!")

def test_field_specific_search():
    """Test search with proper field assignment"""
    print(f"\n🎯 Testing Field-Specific Search (Enhanced Parser Simulation)\n")
    
    # Simulate what the enhanced parser would do with field detection
    print("📝 Simulating Enhanced Parser Field Detection:")
    
    # Based on the analysis, assign terms to most likely fields
    field_assignments = {
        'ghalib': 'name',      # Assuming this is a name
        'heeraage': 'island',  # Assuming this is an island
        'goidhoo': 'address'   # Assuming this is an address
    }
    
    print("   Field assignments:")
    for term, field in field_assignments.items():
        print(f"      '{term}' → {field}")
    
    # Test field-specific AND logic
    print(f"\n🔍 Testing Field-Specific AND Logic:")
    
    field_query = Q()
    for term, field in field_assignments.items():
        if field == 'name':
            field_query &= Q(name__icontains=term)
        elif field == 'address':
            field_query &= Q(address__icontains=term)
        elif field == 'island':
            field_query &= Q(island__icontains=term)
        elif field == 'party':
            field_query &= Q(party__icontains=term)
    
    field_results = PhoneBookEntry.objects.filter(field_query)
    field_count = field_results.count()
    
    print(f"   Field-specific search: {field_count} entries")
    
    if field_count > 0:
        print(f"   📋 Sample results:")
        for i, entry in enumerate(field_results[:3]):
            print(f"      {i+1}. {entry.name} - Address: {entry.address} - Island: {entry.island}")
    else:
        print(f"   ❌ No results with field-specific search")
    
    # Compare with name-only search
    name_only_count = PhoneBookEntry.objects.filter(
        Q(name__icontains='ghalib') & 
        Q(name__icontains='heeraage') & 
        Q(name__icontains='goidhoo')
    ).count()
    
    print(f"\n📊 Comparison:")
    print(f"   All terms in name field: {name_only_count} entries")
    print(f"   Field-specific search: {field_count} entries")
    
    if field_count > name_only_count:
        print(f"   ✅ Field-specific search gives MORE results - better field detection!")
    elif field_count < name_only_count:
        print(f"   ⚠️  Field-specific search gives FEWER results - may be too restrictive")
    else:
        print(f"   🔍 Both approaches give same results")

if __name__ == "__main__":
    print("🚀 Starting Search Term Omission Analysis")
    print("=" * 70)
    
    try:
        test_search_term_omission()
        test_field_specific_search()
        
        print(f"\n🎉 All tests completed successfully!")
        print(f"✅ Analysis shows how term omission affects search results")
        
    except Exception as e:
        print(f"\n❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
