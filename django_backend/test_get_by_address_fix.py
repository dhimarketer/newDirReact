#!/usr/bin/env python3
"""
2025-01-28: Script to test the fixed get_by_address method

This script tests if the get_by_address method can now properly find
family groups by address and island string parameters.
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
from dirReactFinal_core.models import Island

def test_get_by_address_fix():
    """Test the fixed get_by_address method"""
    print("=== TESTING FIXED GET_BY_ADDRESS METHOD ===")
    
    # Test case 1: The specific case from the user's issue
    address = "kinbigasdhoshuge"
    island = "f. feeali"
    
    print(f"\n--- Test Case 1: {address}, {island} ---")
    
    # Test the fixed method
    family_group = FamilyGroup.get_by_address(address, island)
    
    if family_group:
        print(f"✅ SUCCESS: Found family group ID {family_group.id}")
        print(f"   Name: {family_group.name}")
        print(f"   Address: {family_group.address}")
        print(f"   Island: {family_group.island}")
        print(f"   Member count: {family_group.members.count()}")
        
        print(f"\n   Members:")
        for member in family_group.members.all():
            entry = member.entry
            age = entry.get_age()
            print(f"     - {entry.name}: DOB={entry.DOB}, Age={age}")
    else:
        print(f"❌ FAILED: No family group found")
    
    # Test case 2: The other family group that was being returned incorrectly
    island2 = "hdh. makunudhoo"
    
    print(f"\n--- Test Case 2: {address}, {island2} ---")
    
    family_group2 = FamilyGroup.get_by_address(address, island2)
    
    if family_group2:
        print(f"✅ SUCCESS: Found family group ID {family_group2.id}")
        print(f"   Name: {family_group2.name}")
        print(f"   Address: {family_group2.address}")
        print(f"   Island: {family_group2.island}")
        print(f"   Member count: {family_group2.members.count()}")
    else:
        print(f"❌ FAILED: No family group found")
    
    # Test case 3: Verify island lookup works
    print(f"\n--- Test Case 3: Island Lookup Verification ---")
    
    # Check what islands exist in the database
    islands = Island.objects.filter(name__icontains="feeali")
    print(f"Islands containing 'feeali':")
    for island_obj in islands:
        print(f"  - {island_obj.name} (ID: {island_obj.id})")
    
    islands2 = Island.objects.filter(name__icontains="makunudhoo")
    print(f"Islands containing 'makunudhoo':")
    for island_obj in islands2:
        print(f"  - {island_obj.name} (ID: {island_obj.id})")

if __name__ == '__main__':
    test_get_by_address_fix()
