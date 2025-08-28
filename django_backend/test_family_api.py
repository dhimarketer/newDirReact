#!/usr/bin/env python3
"""
2025-01-28: Script to test family API response for age field inclusion

This script tests if the family API is properly including the age field
in the response for the family at 'kinbigasdhoshuge, f. feeali'.
"""

import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_family.models import FamilyGroup
from dirReactFinal_family.serializers import FamilyGroupDetailSerializer
from dirReactFinal_directory.models import PhoneBookEntry
import json

def test_family_api_response():
    """Test family API response to see if age field is included"""
    print("=== FAMILY API RESPONSE TEST ===")
    
    # Find the specific family group
    try:
        family_group = FamilyGroup.objects.filter(
            address__icontains='kinbigasdhoshuge'
        ).first()
        
        if not family_group:
            print("❌ No family group found for 'kinbigasdhoshuge'")
            return
        
        print(f"✅ Found family group: {family_group.name}")
        print(f"   Address: {family_group.address}")
        print(f"   Island: {family_group.island}")
        print(f"   Member count: {family_group.members.count()}")
        
        # Test the serializer
        print(f"\n=== TESTING SERIALIZER ===")
        serializer = FamilyGroupDetailSerializer(family_group)
        serialized_data = serializer.data
        
        print(f"Serialized data keys: {list(serialized_data.keys())}")
        
        if 'members' in serialized_data:
            print(f"\n=== MEMBERS DATA ===")
            members = serialized_data['members']
            print(f"Number of members: {len(members)}")
            
            for i, member in enumerate(members):
                print(f"\nMember {i+1}:")
                if 'entry' in member:
                    entry = member['entry']
                    print(f"  Entry keys: {list(entry.keys())}")
                    print(f"  Name: {entry.get('name', 'N/A')}")
                    print(f"  DOB: {entry.get('DOB', 'N/A')}")
                    print(f"  Age: {entry.get('age', 'N/A')}")
                    
                    # Check if age is None or missing
                    if 'age' not in entry:
                        print(f"  ❌ Age field missing from entry")
                    elif entry['age'] is None:
                        print(f"  ❌ Age field is None")
                    else:
                        print(f"  ✅ Age field present: {entry['age']}")
                else:
                    print(f"  ❌ No entry data found")
        
        # Also test individual member serialization
        print(f"\n=== TESTING INDIVIDUAL MEMBER SERIALIZATION ===")
        for member in family_group.members.all()[:3]:  # Test first 3 members
            print(f"\nMember: {member.entry.name}")
            print(f"  DOB: {member.entry.DOB}")
            
            # Test direct age calculation
            direct_age = member.entry.get_age()
            print(f"  Direct get_age(): {direct_age}")
            
            # Test entry serializer
            from dirReactFinal_family.serializers import PhoneBookEntrySerializer
            entry_serializer = PhoneBookEntrySerializer(member.entry)
            entry_data = entry_serializer.data
            print(f"  Serialized entry keys: {list(entry_data.keys())}")
            print(f"  Serialized age: {entry_data.get('age', 'N/A')}")
            
    except Exception as e:
        print(f"❌ Error testing family API: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_family_api_response()
