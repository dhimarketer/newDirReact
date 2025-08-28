#!/usr/bin/env python3
"""
2025-01-28: Script to check the specific family group for 'kinbigasdhoshuge, f. feeali'

This script checks if there's a family group for the specific address mentioned in the user's image.
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
from dirReactFinal_directory.models import PhoneBookEntry

def check_specific_family_group():
    """Check the specific family group for 'kinbigasdhoshuge, f. feeali'"""
    print("=== CHECKING SPECIFIC FAMILY GROUP ===")
    
    address = "kinbigasdhoshuge"
    island = "f. feeali"
    
    print(f"Searching for family group at: {address}, {island}")
    
    # Check if family group exists
    family_group = FamilyGroup.objects.filter(
        address__iexact=address,
        island__iexact=island
    ).first()
    
    if family_group:
        print(f"✅ Found family group: {family_group.name} (ID: {family_group.id})")
        print(f"   Description: {family_group.description}")
        print(f"   Member count: {family_group.members.count()}")
        
        print(f"\n=== FAMILY GROUP MEMBERS ===")
        for member in family_group.members.all():
            entry = member.entry
            age = entry.get_age()
            print(f"  - {entry.name}: DOB={entry.DOB}, Age={age}")
            
    else:
        print(f"❌ No family group found for {address}, {island}")
        
        # Check if we can create one
        print(f"\n=== CHECKING IF WE CAN CREATE FAMILY GROUP ===")
        
        # Find all entries for this address/island
        entries = PhoneBookEntry.objects.filter(
            address__iexact=address,
            island__name__iexact=island
        )
        
        print(f"Found {entries.count()} entries for this address/island")
        
        if entries.exists():
            print(f"\nSample entries:")
            for entry in entries[:5]:
                age = entry.get_age()
                print(f"  - {entry.name}: DOB={entry.DOB}, Age={age}")
            
            # Try to create family group
            print(f"\n=== ATTEMPTING TO CREATE FAMILY GROUP ===")
            try:
                family_group = FamilyGroup.infer_family_from_address(address, island, None)
                if family_group:
                    print(f"✅ Successfully created family group: {family_group.name}")
                    print(f"   Member count: {family_group.members.count()}")
                    
                    print(f"\n=== NEW FAMILY GROUP MEMBERS ===")
                    for member in family_group.members.all():
                        entry = member.entry
                        age = entry.get_age()
                        print(f"  - {entry.name}: DOB={entry.DOB}, Age={age}")
                else:
                    print(f"❌ Failed to create family group")
            except Exception as e:
                print(f"❌ Error creating family group: {str(e)}")
                import traceback
                traceback.print_exc()

if __name__ == '__main__':
    check_specific_family_group()
