#!/usr/bin/env python3
"""
Check ages of heeraage family members
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

def check_heeraage_ages():
    """Check ages of heeraage family members"""
    print("🔍 Checking Ages of Heeraage Family Members\n")
    
    try:
        fg = FamilyGroup.objects.get(id=15)
        print(f"✅ Found Family Group 15: {fg.address}, {fg.island}")
        print(f"   Members: {fg.members.count()}")
        print(f"   Relationships: {fg.relationships.count()}")
        
        print("\n📝 All members with ages:")
        members_with_ages = []
        
        for member in fg.members.all():
            entry = member.entry
            age = entry.get_age() if hasattr(entry, 'get_age') else None
            dob = entry.DOB if hasattr(entry, 'DOB') else None
            
            members_with_ages.append({
                'name': entry.name,
                'pid': entry.pid,
                'age': age,
                'dob': dob,
                'gender': entry.gender,
                'role': member.role_in_family
            })
            
            print(f"   - {entry.name} (PID: {entry.pid}, Age: {age}, DOB: {dob}, Gender: {entry.gender}, Role: {member.role_in_family})")
        
        # Sort by age
        members_with_ages.sort(key=lambda x: x['age'] or 0, reverse=True)
        
        print(f"\n📊 Members sorted by age (eldest first):")
        for i, member in enumerate(members_with_ages):
            print(f"   {i+1}. {member['name']}: {member['age']} years (DOB: {member['dob']}, Gender: {member['gender']})")
        
        # Check parent detection logic
        print(f"\n🔍 Parent Detection Analysis:")
        if len(members_with_ages) >= 2:
            eldest = members_with_ages[0]
            second_eldest = members_with_ages[1]
            
            print(f"   Eldest: {eldest['name']} ({eldest['age']} years)")
            print(f"   Second eldest: {second_eldest['name']} ({second_eldest['age']} years)")
            
            if eldest['age'] and second_eldest['age']:
                age_diff = eldest['age'] - second_eldest['age']
                print(f"   Age difference: {age_diff} years")
                
                if age_diff >= 12:
                    print(f"   ✅ {eldest['name']} can be parent to {second_eldest['name']}")
                else:
                    print(f"   ❌ {eldest['name']} cannot be parent to {second_eldest['name']} (age gap too small)")
                
                # Check if they can be parents to others
                potential_children = [m for m in members_with_ages[2:] if m['age'] and (eldest['age'] - m['age']) >= 12]
                print(f"   Potential children for {eldest['name']}: {len(potential_children)} members")
                
                if second_eldest['age']:
                    potential_children_2 = [m for m in members_with_ages[2:] if m['age'] and (second_eldest['age'] - m['age']) >= 12]
                    print(f"   Potential children for {second_eldest['name']}: {len(potential_children_2)} members")
        
    except FamilyGroup.DoesNotExist:
        print("❌ Family Group 15 not found")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    check_heeraage_ages()
