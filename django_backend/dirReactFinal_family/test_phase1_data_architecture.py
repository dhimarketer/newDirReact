# 2024-12-28: Phase 1 Data Architecture Tests
# Tests for Global Person Registry, Cross-Family Relationships, and Flattened Storage

import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.db import transaction

from .models import FamilyGroup, FamilyMember, FamilyRelationship
from dirReactFinal_directory.models import PhoneBookEntry
from dirReactFinal_core.models import Island

User = get_user_model()

@pytest.mark.django_db
class GlobalPersonRegistryTests(APITestCase):
    """Test Phase 1: Global Person Registry functionality"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.island = Island.objects.create(name='Male', atoll='Male')
        
        # Create test persons with global PIDs
        self.person1 = PhoneBookEntry.objects.create(
            pid=1001,
            name='John Doe',
            contact='1234567890',
            address='123 Main St',
            island=self.island
        )
        
        self.person2 = PhoneBookEntry.objects.create(
            pid=1002,
            name='Jane Doe',
            contact='0987654321',
            address='123 Main St',
            island=self.island
        )
        
        self.person3 = PhoneBookEntry.objects.create(
            pid=1003,
            name='Bob Smith',
            contact='5555555555',
            address='456 Oak Ave',
            island=self.island
        )
        
        self.person4 = PhoneBookEntry.objects.create(
            pid=1004,
            name='Alice Johnson',
            contact='7777777777',
            address='789 Pine St',
            island=self.island
        )
        
        # Create two separate family groups
        self.family1 = FamilyGroup.objects.create(
            name='Doe Family',
            description='Main family',
            address='123 Main St',
            island=self.island,
            is_public=True,
            created_by=self.user
        )
        
        self.family2 = FamilyGroup.objects.create(
            name='Smith Family',
            description='Extended family',
            address='456 Oak Ave',
            island=self.island,
            is_public=True,
            created_by=self.user
        )
        
        self.client.force_authenticate(user=self.user)

    def test_pid_global_uniqueness(self):
        """Test that PID is globally unique across all family contexts"""
        # Verify PIDs are unique
        pids = PhoneBookEntry.objects.values_list('pid', flat=True)
        self.assertEqual(len(pids), len(set(pids)))
        
        # Test that same person can be in multiple families
        member1_family1 = FamilyMember.objects.create(
            entry=self.person1,
            family_group=self.family1,
            role_in_family='father'
        )
        
        member1_family2 = FamilyMember.objects.create(
            entry=self.person1,
            family_group=self.family2,
            role_in_family='son'
        )
        
        # Same person, different families, same PID
        self.assertEqual(member1_family1.entry.pid, member1_family2.entry.pid)
        self.assertEqual(member1_family1.entry.pid, 1001)

    def test_cross_family_relationships(self):
        """Test relationships between people in different nuclear families"""
        # Add members to different families
        FamilyMember.objects.create(
            entry=self.person1,
            family_group=self.family1,
            role_in_family='father'
        )
        
        FamilyMember.objects.create(
            entry=self.person3,
            family_group=self.family2,
            role_in_family='father'
        )
        
        # Create cross-family relationship (e.g., father-son across families)
        cross_family_relationship = FamilyRelationship.objects.create(
            person1=self.person1,  # Father in family1
            person2=self.person3,  # Father in family2 (but son of person1)
            relationship_type='parent',
            family_group=self.family1  # Store in one of the families
        )
        
        self.assertEqual(cross_family_relationship.relationship_type, 'parent')
        self.assertEqual(cross_family_relationship.person1, self.person1)
        self.assertEqual(cross_family_relationship.person2, self.person3)

    def test_flattened_relationship_storage(self):
        """Test that relationships are stored globally, not nested in family groups"""
        # Create relationships
        relationship1 = FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person2,
            relationship_type='spouse',
            family_group=self.family1
        )
        
        relationship2 = FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person3,
            relationship_type='parent',
            family_group=self.family1
        )
        
        # Test that relationships can be queried globally
        all_relationships = FamilyRelationship.objects.filter(person1=self.person1)
        self.assertEqual(all_relationships.count(), 2)
        
        # Test that relationships are not nested in family groups
        family1_relationships = self.family1.relationships.all()
        self.assertEqual(family1_relationships.count(), 2)
        
        # Test global relationship query
        global_relationships = FamilyRelationship.objects.all()
        self.assertGreaterEqual(global_relationships.count(), 2)

    def test_person_context_queries(self):
        """Test querying person data across multiple family contexts"""
        # Add person to multiple families
        FamilyMember.objects.create(
            entry=self.person1,
            family_group=self.family1,
            role_in_family='father'
        )
        
        FamilyMember.objects.create(
            entry=self.person1,
            family_group=self.family2,
            role_in_family='son'
        )
        
        # Query person's family memberships
        person1_memberships = FamilyMember.objects.filter(entry=self.person1)
        self.assertEqual(person1_memberships.count(), 2)
        
        # Query person's relationships across all families
        person1_relationships = FamilyRelationship.objects.filter(
            person1=self.person1
        )
        # This should work regardless of which family the relationship is stored in
        
        # Test that person data is consistent across contexts
        self.assertEqual(person1_memberships[0].entry.name, 'John Doe')
        self.assertEqual(person1_memberships[1].entry.name, 'John Doe')
        self.assertEqual(person1_memberships[0].entry.pid, 1001)
        self.assertEqual(person1_memberships[1].entry.pid, 1001)

    def test_global_person_registry_api(self):
        """Test API endpoints for global person registry"""
        # Test global person lookup
        url = reverse('family:global-person-contexts-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test person-specific context
        url = reverse('family:global-person-contexts-detail', kwargs={'pk': self.person1.pid})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify response includes person data
        self.assertEqual(response.data['person']['pid'], self.person1.pid)
        self.assertEqual(response.data['person']['name'], 'John Doe')

    def test_relationship_consistency_across_families(self):
        """Test that relationships maintain consistency across family contexts"""
        # Create family members
        FamilyMember.objects.create(
            entry=self.person1,
            family_group=self.family1,
            role_in_family='father'
        )
        
        FamilyMember.objects.create(
            entry=self.person2,
            family_group=self.family1,
            role_in_family='mother'
        )
        
        FamilyMember.objects.create(
            entry=self.person3,
            family_group=self.family2,
            role_in_family='father'
        )
        
        # Create relationships
        spouse_relationship = FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person2,
            relationship_type='spouse',
            family_group=self.family1
        )
        
        parent_relationship = FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person3,
            relationship_type='parent',
            family_group=self.family1
        )
        
        # Test reciprocal relationships
        self.assertEqual(spouse_relationship.get_reciprocal_relationship(), 'spouse')
        self.assertEqual(parent_relationship.get_reciprocal_relationship(), 'child')
        
        # Test that relationships are consistent
        self.assertEqual(spouse_relationship.person1.name, 'John Doe')
        self.assertEqual(spouse_relationship.person2.name, 'Jane Doe')
        self.assertEqual(parent_relationship.person1.name, 'John Doe')
        self.assertEqual(parent_relationship.person2.name, 'Bob Smith')

@pytest.mark.django_db
class CrossFamilyRelationshipTests(APITestCase):
    """Test Phase 1: Cross-Family Relationship functionality"""
    
    def setUp(self):
        """Set up test data for cross-family testing"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.island = Island.objects.create(name='Male', atoll='Male')
        
        # Create extended family structure
        self.grandfather = PhoneBookEntry.objects.create(
            pid=2001,
            name='Grandfather',
            contact='1111111111',
            address='123 Main St',
            island=self.island
        )
        
        self.father = PhoneBookEntry.objects.create(
            pid=2002,
            name='Father',
            contact='2222222222',
            address='123 Main St',
            island=self.island
        )
        
        self.son = PhoneBookEntry.objects.create(
            pid=2003,
            name='Son',
            contact='3333333333',
            address='456 Oak Ave',
            island=self.island
        )
        
        self.grandson = PhoneBookEntry.objects.create(
            pid=2004,
            name='Grandson',
            contact='4444444444',
            address='789 Pine St',
            island=self.island
        )
        
        # Create three nuclear families
        self.grandparents_family = FamilyGroup.objects.create(
            name='Grandparents Family',
            address='123 Main St',
            island=self.island,
            created_by=self.user
        )
        
        self.parents_family = FamilyGroup.objects.create(
            name='Parents Family',
            address='123 Main St',
            island=self.island,
            created_by=self.user
        )
        
        self.children_family = FamilyGroup.objects.create(
            name='Children Family',
            address='456 Oak Ave',
            island=self.island,
            created_by=self.user
        )
        
        self.client.force_authenticate(user=self.user)

    def test_parent_child_across_families(self):
        """Test parent-child relationships spanning different nuclear families"""
        # Add members to their respective families
        FamilyMember.objects.create(
            entry=self.grandfather,
            family_group=self.grandparents_family,
            role_in_family='father'
        )
        
        FamilyMember.objects.create(
            entry=self.father,
            family_group=self.parents_family,
            role_in_family='father'
        )
        
        FamilyMember.objects.create(
            entry=self.son,
            family_group=self.children_family,
            role_in_family='father'
        )
        
        # Create cross-family relationships
        grandparent_parent = FamilyRelationship.objects.create(
            person1=self.grandfather,
            person2=self.father,
            relationship_type='parent',
            family_group=self.grandparents_family
        )
        
        parent_child = FamilyRelationship.objects.create(
            person1=self.father,
            person2=self.son,
            relationship_type='parent',
            family_group=self.parents_family
        )
        
        # Test that relationships work across families
        self.assertEqual(grandparent_parent.relationship_type, 'parent')
        self.assertEqual(parent_child.relationship_type, 'parent')
        
        # Test that we can trace lineage across families
        grandfather_children = FamilyRelationship.objects.filter(
            person1=self.grandfather,
            relationship_type='parent'
        )
        self.assertEqual(grandfather_children.count(), 1)
        self.assertEqual(grandfather_children.first().person2, self.father)

    def test_spouse_relationships_across_families(self):
        """Test spouse relationships that connect different families"""
        # Create spouse
        spouse = PhoneBookEntry.objects.create(
            pid=2005,
            name='Spouse',
            contact='5555555555',
            address='456 Oak Ave',
            island=self.island
        )
        
        # Add to different families
        FamilyMember.objects.create(
            entry=self.father,
            family_group=self.parents_family,
            role_in_family='father'
        )
        
        FamilyMember.objects.create(
            entry=spouse,
            family_group=self.children_family,
            role_in_family='mother'
        )
        
        # Create cross-family spouse relationship
        spouse_relationship = FamilyRelationship.objects.create(
            person1=self.father,
            person2=spouse,
            relationship_type='spouse',
            family_group=self.parents_family
        )
        
        self.assertEqual(spouse_relationship.relationship_type, 'spouse')
        self.assertEqual(spouse_relationship.person1, self.father)
        self.assertEqual(spouse_relationship.person2, spouse)

    def test_relationship_consistency_validation(self):
        """Test validation of relationship consistency across families"""
        # Create family members
        FamilyMember.objects.create(
            entry=self.father,
            family_group=self.parents_family,
            role_in_family='father'
        )
        
        FamilyMember.objects.create(
            entry=self.son,
            family_group=self.children_family,
            role_in_family='father'
        )
        
        # Create valid parent-child relationship
        valid_relationship = FamilyRelationship.objects.create(
            person1=self.father,
            person2=self.son,
            relationship_type='parent',
            family_group=self.parents_family
        )
        
        # Test that relationship is valid
        self.assertEqual(valid_relationship.relationship_type, 'parent')
        
        # Test reciprocal relationship
        reciprocal_type = valid_relationship.get_reciprocal_relationship()
        self.assertEqual(reciprocal_type, 'child')
        
        # Test that we can query relationships consistently
        father_children = FamilyRelationship.objects.filter(
            person1=self.father,
            relationship_type='parent'
        )
        self.assertEqual(father_children.count(), 1)
        
        son_parents = FamilyRelationship.objects.filter(
            person1=self.son,
            relationship_type='child'
        )
        # Note: This would need the reciprocal relationship to be created
        # In a real implementation, you might want to auto-create reciprocals

    def test_multi_generational_family_queries(self):
        """Test querying multi-generational family structures"""
        # Set up three-generation family
        FamilyMember.objects.create(
            entry=self.grandfather,
            family_group=self.grandparents_family,
            role_in_family='father'
        )
        
        FamilyMember.objects.create(
            entry=self.father,
            family_group=self.parents_family,
            role_in_family='father'
        )
        
        FamilyMember.objects.create(
            entry=self.son,
            family_group=self.children_family,
            role_in_family='father'
        )
        
        FamilyMember.objects.create(
            entry=self.grandson,
            family_group=self.children_family,
            role_in_family='child'
        )
        
        # Create relationships
        FamilyRelationship.objects.create(
            person1=self.grandfather,
            person2=self.father,
            relationship_type='parent',
            family_group=self.grandparents_family
        )
        
        FamilyRelationship.objects.create(
            person1=self.father,
            person2=self.son,
            relationship_type='parent',
            family_group=self.parents_family
        )
        
        FamilyRelationship.objects.create(
            person1=self.son,
            person2=self.grandson,
            relationship_type='parent',
            family_group=self.children_family
        )
        
        # Test querying all descendants of grandfather
        grandfather_descendants = FamilyRelationship.objects.filter(
            person1=self.grandfather,
            relationship_type='parent'
        )
        self.assertEqual(grandfather_descendants.count(), 1)
        
        # Test querying all ancestors of grandson
        grandson_ancestors = FamilyRelationship.objects.filter(
            person2=self.grandson,
            relationship_type='parent'
        )
        self.assertEqual(grandson_ancestors.count(), 1)

if __name__ == '__main__':
    pytest.main([__file__])
