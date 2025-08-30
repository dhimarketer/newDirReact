#!/usr/bin/env python3
"""
Check relationships in heeraage family group
"""

import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_family.models import FamilyGroup, FamilyRelationship

def check_heeraage_relationships():
    """Check relationships in heeraage family group"""
    print("🔍 Checking Relationships in Heeraage Family Group\n")
    
    try:
        fg = FamilyGroup.objects.get(id=15)
        print(f"✅ Found Family Group 15: {fg.address}, {fg.island}")
        print(f"   Members: {fg.members.count()}")
        print(f"   Relationships: {fg.relationships.count()}")
        
        print("\n📝 All relationships:")
        relationships = fg.relationships.filter(is_active=True)
        
        # Group relationships by type
        relationship_types = {}
        for rel in relationships:
            rel_type = rel.relationship_type
            if rel_type not in relationship_types:
                relationship_types[rel_type] = []
            relationship_types[rel_type].append(rel)
        
        for rel_type, rels in relationship_types.items():
            print(f"\n🔗 {rel_type.upper()} relationships ({len(rels)}):")
            for rel in rels:
                person1_name = rel.person1.name if rel.person1 else f"PID:{rel.person1_id}"
                person2_name = rel.person2.name if rel.person2 else f"PID:{rel.person2_id}"
                print(f"   - {person1_name} -> {person2_name}")
        
        # Check for any inactive relationships
        inactive_rels = fg.relationships.filter(is_active=False)
        if inactive_rels.exists():
            print(f"\n⚠️ Inactive relationships ({inactive_rels.count()}):")
            for rel in inactive_rels:
                person1_name = rel.person1.name if rel.person1 else f"PID:{rel.person1_id}"
                person2_name = rel.person2.name if rel.person2 else f"PID:{rel.person2_id}"
                print(f"   - {person1_name} -> {person2_name} ({rel.relationship_type})")
        
        # Check member roles
        print(f"\n👥 Member roles:")
        for member in fg.members.all():
            entry = member.entry
            print(f"   - {entry.name} (PID: {entry.pid}): {member.role_in_family}")
        
    except FamilyGroup.DoesNotExist:
        print("❌ Family Group 15 not found")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    check_heeraage_relationships()
