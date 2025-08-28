#!/usr/bin/env python3
"""
2025-01-28: Script to debug what age data the frontend is actually receiving

This script tests the family API response to see exactly what data structure
is being sent to the frontend, particularly focusing on the age field.
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
import json

def debug_frontend_age_data():
    """Debug what age data the frontend is actually receiving"""
    print("=== DEBUGGING FRONTEND AGE DATA ===")
    
    # Test the specific family group that the user is looking at
    address = "kinbigasdhoshuge"
    island = "f. feeali"
    
    print(f"Testing family group at: {address}, {island}")
    
    try:
        # Find the family group
        family_group = FamilyGroup.objects.filter(
            address=address,
            island=island
        ).first()
        
        if not family_group:
            print(f"❌ No family group found for {address}, {island}")
            return
        
        print(f"✅ Found family group ID {family_group.id}: {family_group.name}")
        
        # Test the serializer that the API uses
        print(f"\n=== TESTING API SERIALIZER ===")
        serializer = FamilyGroupDetailSerializer(family_group)
        serialized_data = serializer.data
        
        print(f"Serialized data keys: {list(serialized_data.keys())}")
        
        if 'members' in serialized_data:
            members = serialized_data['members']
            print(f"\nNumber of members: {len(members)}")
            
            for i, member in enumerate(members):
                print(f"\n--- Member {i+1} ---")
                if 'entry' in member:
                    entry = member['entry']
                    print(f"  Entry keys: {list(entry.keys())}")
                    print(f"  Name: {entry.get('name', 'N/A')}")
                    print(f"  DOB: {entry.get('DOB', 'N/A')}")
                    print(f"  Age: {entry.get('age', 'N/A')}")
                    print(f"  Age type: {type(entry.get('age'))}")
                    
                    # Check if age is None, undefined, or has a value
                    age_value = entry.get('age')
                    if age_value is None:
                        print(f"  ❌ Age field is None")
                    elif age_value == '':
                        print(f"  ❌ Age field is empty string")
                    elif age_value == 'undefined':
                        print(f"  ❌ Age field is 'undefined' string")
                    else:
                        print(f"  ✅ Age field has value: {age_value}")
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
            print(f"  Serialized age type: {type(entry_data.get('age'))}")
            
    except Exception as e:
        print(f"❌ Error testing family API: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    debug_frontend_age_data()
