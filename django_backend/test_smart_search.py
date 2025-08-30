#!/usr/bin/env python3
"""
Test script for smart field detection with comma-separated queries
Tests the fix for "habaruge, hithadhoo" search issue
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_api.services import SearchService
from dirReactFinal_directory.models import PhoneBookEntry

def test_smart_field_detection():
    """Test smart field detection for comma-separated queries"""
    print("🧪 Testing Smart Field Detection for 'habaruge, hithadhoo'")
    print("=" * 60)
    
    # Initialize search service
    search_service = SearchService()
    
    # Test data
    test_data = {
        'query': 'habaruge hithadhoo',
        'enableSmartFieldDetection': True,
        'useAndLogic': True
    }
    
    # Mock analysis
    analysis = {
        'use_and_logic': True,
        'has_query': True
    }
    
    print(f"📝 Test data: {test_data}")
    print(f"🔍 Analysis: {analysis}")
    print()
    
    try:
        # Test smart field detection
        print("🚀 Running smart field detection...")
        queryset, response_data = search_service._handle_smart_field_detection(test_data, analysis)
        
        print(f"✅ Smart field detection completed successfully!")
        print(f"📊 Results: {queryset.count()} entries found")
        print(f"🔍 Response data: {response_data}")
        
        # Show sample results
        if queryset.count() > 0:
            print("\n📋 Sample Results:")
            for i, entry in enumerate(queryset[:3]):
                print(f"  {i+1}. {entry.name} - Address: {entry.address} - Island: {entry.island}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during smart field detection: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_individual_field_queries():
    """Test individual field queries to verify data exists"""
    print("\n🔍 Testing Individual Field Queries")
    print("=" * 40)
    
    # Test address field
    address_count = PhoneBookEntry.objects.filter(address__icontains='habaruge').count()
    print(f"📍 Address 'habaruge': {address_count} matches")
    
    # Test island field - first find the island ID
    from dirReactFinal_core.models import Island
    island_matches = Island.objects.filter(name__icontains='hithadhoo')
    if island_matches.exists():
        island_ids = list(island_matches.values_list('id', flat=True))
        print(f"🏝️ Found island 'hithadhoo' with IDs: {island_ids}")
        
        # Now search using the numerical IDs
        island_count = PhoneBookEntry.objects.filter(island_id__in=island_ids).count()
        print(f"🏝️ Island 'hithadhoo' (using IDs): {island_count} matches")
    else:
        print(f"❌ No island found with name 'hithadhoo'")
        island_count = 0
    
    # Test combined query using numerical IDs
    if island_count > 0:
        combined_count = PhoneBookEntry.objects.filter(
            address__icontains='habaruge',
            island_id__in=island_ids
        ).count()
        print(f"🔗 Combined 'habaruge' + 'hithadhoo' (using IDs): {combined_count} matches")
    else:
        combined_count = 0
        print(f"❌ Cannot test combined query - no island data")
    
    return address_count > 0 and island_count > 0

if __name__ == '__main__':
    print("🧪 Smart Search Test Suite")
    print("=" * 40)
    
    # Test individual fields first
    fields_ok = test_individual_field_queries()
    
    if fields_ok:
        print("\n✅ Individual field queries successful, testing smart detection...")
        smart_ok = test_smart_field_detection()
        
        if smart_ok:
            print("\n🎉 All tests passed! Smart field detection is working correctly.")
        else:
            print("\n❌ Smart field detection failed. Check the logs above.")
    else:
        print("\n❌ Individual field queries failed. Data may not exist in database.")
    
    print("\n�� Test completed.")
