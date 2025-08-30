#!/usr/bin/env python3
"""
Test script for multi-word term preservation in smart field detection
Tests the fix for "happy night, male" search issue
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_api.services import SearchService
from dirReactFinal_directory.models import PhoneBookEntry

def test_multiword_term_preservation():
    """Test that multi-word terms are preserved as complete phrases"""
    print("🧪 Testing Multi-Word Term Preservation for 'happy night, male'")
    print("=" * 70)
    
    # Initialize search service
    search_service = SearchService()
    
    # Test data - "happy night, male" should become ["happy night", "male"]
    test_data = {
        'query': 'happy night, male',
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
        
        # Check if terms were preserved correctly
        terms_analyzed = response_data.get('terms_analyzed', [])
        print(f"\n🔍 Terms analyzed: {terms_analyzed}")
        
        # Verify multi-word term preservation
        expected_terms = ['happy night', 'male']
        if terms_analyzed == expected_terms:
            print(f"✅ Multi-word terms preserved correctly: {terms_analyzed}")
        else:
            print(f"❌ Multi-word terms not preserved correctly!")
            print(f"   Expected: {expected_terms}")
            print(f"   Got: {terms_analyzed}")
        
        # Check field assignments
        field_assignments = response_data.get('field_assignments', [])
        print(f"\n🔍 Field assignments:")
        for assignment in field_assignments:
            print(f"   {assignment['term']} → {assignment['field']} (confidence: {assignment['confidence']}%)")
        
        # Show sample results
        if queryset.count() > 0:
            print(f"\n📋 Sample Results:")
            for i, entry in enumerate(queryset[:3]):
                print(f"  {i+1}. {entry.name} - Address: {entry.address} - Island: {entry.island}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during smart field detection: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_individual_multiword_queries():
    """Test individual multi-word queries to verify data exists"""
    print("\n🔍 Testing Individual Multi-Word Queries")
    print("=" * 50)
    
    # Test "happy night" as complete phrase
    address_count = PhoneBookEntry.objects.filter(address__icontains='happy night').count()
    print(f"📍 Address 'happy night' (complete phrase): {address_count} matches")
    
    # Test "male" as island
    from dirReactFinal_core.models import Island
    island_matches = Island.objects.filter(name__icontains='male')
    if island_matches.exists():
        island_ids = list(island_matches.values_list('id', flat=True))
        print(f"🏝️ Found island 'male' with IDs: {island_ids}")
        
        island_count = PhoneBookEntry.objects.filter(island_id__in=island_ids).count()
        print(f"🏝️ Island 'male' (using IDs): {island_count} matches")
    else:
        print(f"❌ No island found with name 'male'")
        island_count = 0
    
    # Test combined query
    if address_count > 0 and island_count > 0:
        combined_count = PhoneBookEntry.objects.filter(
            address__icontains='happy night',
            island_id__in=island_ids
        ).count()
        print(f"🔗 Combined 'happy night' + 'male': {combined_count} matches")
    else:
        combined_count = 0
        print(f"❌ Cannot test combined query - missing data")
    
    return address_count > 0 and island_count > 0

if __name__ == '__main__':
    print("🧪 Multi-Word Term Preservation Test Suite")
    print("=" * 50)
    
    # Test individual queries first
    fields_ok = test_individual_multiword_queries()
    
    if fields_ok:
        print("\n✅ Individual queries successful, testing multi-word preservation...")
        smart_ok = test_multiword_term_preservation()
        
        if smart_ok:
            print("\n🎉 All tests passed! Multi-word terms are preserved correctly.")
        else:
            print("\n❌ Multi-word term preservation failed. Check the logs above.")
    else:
        print("\n❌ Individual queries failed. Data may not exist in database.")
    
    print("\n�� Test completed.")
