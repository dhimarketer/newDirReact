#!/usr/bin/env python3
"""
Check family group 15 details
"""

import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_family.models import FamilyGroup

def check_family_group_15():
    """Check details of family group 15"""
    print("🔍 Checking Family Group 15\n")
    
    try:
        fg = FamilyGroup.objects.get(id=15)
        print(f"✅ Found Family Group 15")
        print(f"   Address: '{fg.address}'")
        print(f"   Island: '{fg.island}'")
        print(f"   Members: {fg.members.count()}")
        print(f"   Relationships: {fg.relationships.count()}")
        
        print("\n📝 All members:")
        for member in fg.members.all():
            entry = member.entry
            island_name = entry.island.name if entry.island else "None"
            print(f"   - {entry.name} (PID: {entry.pid}, Island: {island_name}, Role: {member.role_in_family})")
        
        print(f"\n🔗 Family group URL: /api/family/groups/by_address/?address={fg.address}&island={fg.island}")
        
    except FamilyGroup.DoesNotExist:
        print("❌ Family Group 15 not found")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    check_family_group_15()
