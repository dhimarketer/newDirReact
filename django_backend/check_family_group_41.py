#!/usr/bin/env python3
"""
2025-01-28: Script to check family group ID 41 that the frontend is actually displaying

This script checks what family group ID 41 contains to verify the mismatch with ID 44.
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

def check_family_group_41():
    """Check what family group ID 41 contains"""
    print("=== CHECKING FAMILY GROUP ID 41 ===")
    
    try:
        family_group = FamilyGroup.objects.get(id=41)
        
        print(f"✅ Found family group ID 41: {family_group.name}")
        print(f"   Address: {family_group.address}")
        print(f"   Island: {family_group.island}")
        print(f"   Description: {family_group.description}")
        print(f"   Member count: {family_group.members.count()}")
        
        print(f"\n=== FAMILY GROUP 41 MEMBERS ===")
        for member in family_group.members.all():
            entry = member.entry
            age = entry.get_age()
            print(f"  - {entry.name}: DOB={entry.DOB}, Age={age}")
            
        # Also check family group ID 44 for comparison
        print(f"\n=== COMPARING WITH FAMILY GROUP ID 44 ===")
        try:
            family_group_44 = FamilyGroup.objects.get(id=44)
            print(f"✅ Found family group ID 44: {family_group_44.name}")
            print(f"   Address: {family_group_44.address}")
            print(f"   Island: {family_group_44.island}")
            print(f"   Member count: {family_group_44.members.count()}")
            
            print(f"\n=== FAMILY GROUP 44 MEMBERS ===")
            for member in family_group_44.members.all():
                entry = member.entry
                age = entry.get_age()
                print(f"  - {entry.name}: DOB={entry.DOB}, Age={age}")
                
        except FamilyGroup.DoesNotExist:
            print(f"❌ Family group ID 44 not found")
            
    except FamilyGroup.DoesNotExist:
        print(f"❌ Family group ID 41 not found")

if __name__ == '__main__':
    check_family_group_41()
