#!/usr/bin/env python3
# 2025-01-29: Test script specifically for happy night family to debug co-parent detection

import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_directory.models import PhoneBookEntry

def organize_members_by_generation(members):
    """
    2025-01-29: ENHANCED - Implement the exact same logic as SimpleFamilyTree.tsx
    with 10-year age gap threshold for parent detection
    """
    organized = {
        'parents': [],
        'children': []
    }

    # Filter members with age data
    valid_members = [member for member in members if member.get_age() is not None]
    
    if not valid_members:
        # If no age data, all members go to children
        organized['children'] = members
        return organized

    # Sort by age (oldest first)
    sorted_by_age = sorted(valid_members, key=lambda m: m.get_age() or 0, reverse=True)
    
    print(f"🎯 Processing {len(sorted_by_age)} members with age data")
    print("Age distribution:", [(m.name, m.get_age()) for m in sorted_by_age])

    potential_parents = []
    children = []

    # First pass: identify true parents based on significant age gaps to ALL potential children
    if sorted_by_age:
        # Start with the assumption that the eldest might be a parent
        eldest = sorted_by_age[0]
        eldest_age = eldest.get_age() or 0
        
        # Check if eldest can be a parent to ALL other members
        eldest_can_be_parent = True
        for i in range(1, len(sorted_by_age)):
            member = sorted_by_age[i]
            member_age = member.get_age() or 0
            age_difference = eldest_age - member_age
            
            # If age difference is less than 10 years, eldest cannot be a parent
            if age_difference < 10:
                eldest_can_be_parent = False
                break
        
        if eldest_can_be_parent:
            potential_parents.append(eldest)
            # Add all other members as children
            for i in range(1, len(sorted_by_age)):
                children.append(sorted_by_age[i])
            print(f"✅ {eldest.name} ({eldest_age}) identified as parent to all children")
        else:
            # Eldest cannot be a parent, add to children
            children.append(eldest)
            print(f"⚠️ {eldest.name} ({eldest_age}) cannot be parent - age gap too small")

    # Second pass: look for additional parents among remaining members
    if potential_parents and children:
        remaining_members = [member for member in sorted_by_age 
                           if member not in potential_parents and member not in children]
        
        for member in remaining_members:
            member_age = member.get_age() or 0
            can_be_parent = True
            
            # Check if this member can be a parent to ALL children
            for child in children:
                child_age = child.get_age() or 0
                age_difference = member_age - child_age
                
                # If age difference is less than 10 years, can't be a parent
                if age_difference < 10:
                    can_be_parent = False
                    print(f"❌ {member.name} ({member_age}) cannot be parent to {child.name} ({child_age}) - age gap: {age_difference} years")
                    break
            
            if can_be_parent and len(potential_parents) < 2:
                potential_parents.append(member)
                print(f"✅ {member.name} ({member_age}) identified as additional parent")
            else:
                children.append(member)
                print(f"👶 {member.name} ({member_age}) classified as child")

    # Third pass: look for second parent among children based on age gap to remaining children
    # 2025-01-29: FIXED - Second parent should have 10+ year gap to children, not to first parent
    if len(potential_parents) == 1 and children:
        first_parent = potential_parents[0]
        first_parent_gender = first_parent.gender
        
        print(f"🔍 Third pass: Looking for second parent among {len(children)} children")
        print(f"   First parent: {first_parent.name} ({first_parent.get_age()}) - gender: {first_parent_gender or 'unknown'}")
        
        # Look for second parent among children
        # Second parent should have 10+ year age gap to the remaining children
        best_second_parent = None
        max_valid_children = 0
        
        for child in children:
            child_age = child.get_age() or 0
            child_gender = child.gender
            
            print(f"   Checking {child.name} ({child_age}) - gender: {child_gender or 'unknown'}")
            
            # Check if this person could be a parent to the remaining children
            remaining_children = [c for c in children if c != child]
            valid_children_count = 0
            
            for other_child in remaining_children:
                other_child_age = other_child.get_age() or 0
                gap_to_other_child = child_age - other_child_age
                
                if gap_to_other_child >= 10:
                    valid_children_count += 1
                    print(f"     ✅ Can be parent to {other_child.name} ({other_child_age}) - gap: {gap_to_other_child} years")
                else:
                    print(f"     ❌ Cannot be parent to {other_child.name} ({other_child_age}) - gap: {gap_to_other_child} years")
            
            print(f"   📊 {child.name} can be parent to {valid_children_count}/{len(remaining_children)} remaining children")
            
            # Prefer different gender from first parent, but accept same gender if no better option
            is_different_gender = first_parent_gender and child_gender and first_parent_gender != child_gender
            gender_bonus = 1 if is_different_gender else 0
            total_score = valid_children_count + gender_bonus
            
            if valid_children_count > 0 and total_score > max_valid_children:
                max_valid_children = total_score
                best_second_parent = child
                print(f"   🎯 New best second parent: {child.name} (score: {total_score})")
        
        if best_second_parent:
            potential_parents.append(best_second_parent)
            children.remove(best_second_parent)
            print(f"💑 {best_second_parent.name} promoted to second parent (can parent {max_valid_children} children)")
        else:
            print(f"   ❌ No suitable second parent found")

    # If we still don't have any parents identified, all members go to children
    if not potential_parents:
        children.extend(sorted_by_age)
        print(f"⚠️ No parents identified, all {len(sorted_by_age)} members moved to children")
    
    # Assign to appropriate generation
    organized['parents'] = potential_parents[:4]  # Max 4 parents
    organized['children'] = children[:12]  # Max 12 children

    print(f"🎯 Final organization: {len(organized['parents'])} parents, {len(organized['children'])} children")
    print("Final parents:", [(p.name, p.get_age()) for p in organized['parents']])
    print("Final children:", [(c.name, c.get_age()) for c in organized['children']])

    return organized

def test_happy_night_family():
    """Test the 10-year rule specifically for the happy night family"""
    
    print("=" * 80)
    print("🧪 TESTING 10-YEAR AGE GAP RULE FOR HAPPY NIGHT FAMILY")
    print("=" * 80)
    
    # Get phonebook entries for happy night, K. Male
    entries = PhoneBookEntry.objects.filter(
        address__icontains='happy night',
        island__name__icontains='male'
    )
    
    print(f"📋 Found {entries.count()} phonebook entries for happy night")
    
    if not entries.exists():
        print("❌ No entries found. Please check the database.")
        return
    
    # Print all members with their ages
    print("\n👥 Family Members:")
    for entry in entries:
        age = entry.get_age()
        print(f"  - {entry.name}: {age} years old" + (" (no DOB)" if age is None else ""))
    
    # Test our parent detection logic
    print("\n🔍 APPLYING 10-YEAR AGE GAP RULE:")
    organized = organize_members_by_generation(list(entries))
    
    print(f"\n🎯 ANALYSIS COMPLETE!")
    print(f"Expected result: ashiyath adam (65) should be identified as co-parent/spouse to ali naseer (78)")
    print(f"Age difference: {abs(78-65)} = 13 years (within 15-year spouse threshold)")

if __name__ == "__main__":
    test_happy_night_family()
