# 2024-12-28: Phase 4 Rich Relationships Tests
# Tests for Extended Family Relationships, In-Laws, Legal, Religious Relationships, and Metadata

import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.db import transaction, models
from django.core.files.uploadedfile import SimpleUploadedFile
from datetime import date, datetime

from .models import FamilyGroup, FamilyMember, FamilyRelationship, FamilyMedia, FamilyEvent
from dirReactFinal_directory.models import PhoneBookEntry
from dirReactFinal_core.models import Island

User = get_user_model()

@pytest.mark.django_db
class RichRelationshipTypesTests(APITestCase):
    """Test Phase 4: Rich Relationship Types functionality"""
    
    def setUp(self):
        """Set up test data for rich relationships"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.island = Island.objects.create(name='Male', atoll='Male')
        
        # Create test persons
        self.person1 = PhoneBookEntry.objects.create(
            pid=3001,
            name='John Doe',
            contact='1234567890',
            address='123 Main St',
            island=self.island
        )
        
        self.person2 = PhoneBookEntry.objects.create(
            pid=3002,
            name='Jane Doe',
            contact='0987654321',
            address='123 Main St',
            island=self.island
        )
        
        self.person3 = PhoneBookEntry.objects.create(
            pid=3003,
            name='Alice Johnson',
            contact='5555555555',
            address='456 Oak Ave',
            island=self.island
        )
        
        self.person4 = PhoneBookEntry.objects.create(
            pid=3004,
            name='Charlie Brown',
            contact='7777777777',
            address='789 Pine St',
            island=self.island
        )
        
        self.person5 = PhoneBookEntry.objects.create(
            pid=3005,
            name='Charlie Brown',
            contact='9999999999',
            address='321 Elm St',
            island=self.island
        )
        
        # Create family group
        self.family = FamilyGroup.objects.create(
            name='Test Family',
            description='Test family for rich relationships',
            address='123 Main St',
            island=self.island,
            is_public=True,
            created_by=self.user
        )
        
        self.client.force_authenticate(user=self.user)

    def test_extended_family_relationships(self):
        """Test step-parent, step-child, half-sibling relationships"""
        # Create step-parent relationship
        step_parent_rel = FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person3,
            relationship_type='step_parent',
            family_group=self.family,
            notes='Step-father relationship',
            is_active=True,
            start_date='2020-01-01',
            relationship_status='active',
            is_biological=False,
            is_legal=True,
            confidence_level=90
        )
        
        # Create step-child relationship
        step_child_rel = FamilyRelationship.objects.create(
            person1=self.person3,
            person2=self.person4,
            relationship_type='step_child',
            family_group=self.family,
            notes='Step-daughter relationship',
            is_active=True,
            start_date='2020-01-01',
            relationship_status='active',
            is_biological=False,
            is_legal=True,
            confidence_level=90
        )
        
        # Create half-sibling relationship
        half_sibling_rel = FamilyRelationship.objects.create(
            person1=self.person2,
            person2=self.person4,
            relationship_type='half_sibling',
            family_group=self.family,
            notes='Half-sister relationship',
            is_active=True,
            start_date='1995-01-01',
            relationship_status='active',
            is_biological=True,
            is_legal=True,
            confidence_level=85
        )
        
        # Test step-parent relationship
        self.assertEqual(step_parent_rel.relationship_type, 'step_parent')
        self.assertEqual(step_parent_rel.is_biological, False)
        self.assertEqual(step_parent_rel.is_legal, True)
        self.assertEqual(step_parent_rel.confidence_level, 90)
        
        # Test step-child relationship
        self.assertEqual(step_child_rel.relationship_type, 'step_child')
        self.assertEqual(step_child_rel.is_biological, False)
        self.assertEqual(step_child_rel.is_legal, True)
        
        # Test half-sibling relationship
        self.assertEqual(half_sibling_rel.relationship_type, 'half_sibling')
        self.assertEqual(half_sibling_rel.is_biological, True)
        self.assertEqual(half_sibling_rel.is_legal, True)

    def test_in_law_relationships(self):
        """Test father-in-law, mother-in-law, son-in-law, daughter-in-law"""
        # Create father-in-law relationship
        father_in_law_rel = FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person3,
            relationship_type='father_in_law',
            family_group=self.family,
            notes='Father-in-law relationship',
            is_active=True,
            start_date='2018-06-15',
            relationship_status='active',
            is_biological=False,
            is_legal=True,
            confidence_level=100
        )
        
        # Create mother-in-law relationship
        mother_in_law_rel = FamilyRelationship.objects.create(
            person1=self.person2,
            person2=self.person4,
            relationship_type='mother_in_law',
            family_group=self.family,
            notes='Mother-in-law relationship',
            is_active=True,
            start_date='2018-06-15',
            relationship_status='active',
            is_biological=False,
            is_legal=True,
            confidence_level=100
        )
        
        # Create son-in-law relationship
        son_in_law_rel = FamilyRelationship.objects.create(
            person1=self.person3,
            person2=self.person5,
            relationship_type='son_in_law',
            family_group=self.family,
            notes='Son-in-law relationship',
            is_active=True,
            start_date='2020-03-20',
            relationship_status='active',
            is_biological=False,
            is_legal=True,
            confidence_level=100
        )
        
        # Test father-in-law relationship
        self.assertEqual(father_in_law_rel.relationship_type, 'father_in_law')
        self.assertEqual(father_in_law_rel.is_biological, False)
        self.assertEqual(father_in_law_rel.is_legal, True)
        
        # Test mother-in-law relationship
        self.assertEqual(mother_in_law_rel.relationship_type, 'mother_in_law')
        self.assertEqual(mother_in_law_rel.is_biological, False)
        self.assertEqual(mother_in_law_rel.is_legal, True)
        
        # Test son-in-law relationship
        self.assertEqual(son_in_law_rel.relationship_type, 'son_in_law')
        self.assertEqual(son_in_law_rel.is_biological, False)
        self.assertEqual(son_in_law_rel.is_legal, True)

    def test_legal_relationships(self):
        """Test adopted-parent, adopted-child, legal-guardian, ward"""
        # Create adopted-parent relationship
        adopted_parent_rel = FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person3,
            relationship_type='adopted_parent',
            family_group=self.family,
            notes='Adopted father relationship',
            is_active=True,
            start_date='2010-05-10',
            relationship_status='active',
            is_biological=False,
            is_legal=True,
            confidence_level=100
        )
        
        # Create adopted-child relationship
        adopted_child_rel = FamilyRelationship.objects.create(
            person1=self.person3,
            person2=self.person4,
            relationship_type='adopted_child',
            family_group=self.family,
            notes='Adopted daughter relationship',
            is_active=True,
            start_date='2010-05-10',
            relationship_status='active',
            is_biological=False,
            is_legal=True,
            confidence_level=100
        )
        
        # Create legal-guardian relationship
        legal_guardian_rel = FamilyRelationship.objects.create(
            person1=self.person2,
            person2=self.person5,
            relationship_type='legal_guardian',
            family_group=self.family,
            notes='Legal guardian relationship',
            is_active=True,
            start_date='2015-08-15',
            relationship_status='active',
            is_biological=False,
            is_legal=True,
            confidence_level=100
        )
        
        # Test adopted-parent relationship
        self.assertEqual(adopted_parent_rel.relationship_type, 'adopted_parent')
        self.assertEqual(adopted_parent_rel.is_biological, False)
        self.assertEqual(adopted_parent_rel.is_legal, True)
        
        # Test adopted-child relationship
        self.assertEqual(adopted_child_rel.relationship_type, 'adopted_child')
        self.assertEqual(adopted_child_rel.is_biological, False)
        self.assertEqual(adopted_child_rel.is_legal, True)
        
        # Test legal-guardian relationship
        self.assertEqual(legal_guardian_rel.relationship_type, 'legal_guardian')
        self.assertEqual(legal_guardian_rel.is_biological, False)
        self.assertEqual(legal_guardian_rel.is_legal, True)

    def test_religious_relationships(self):
        """Test godparent, godchild, sponsor relationships"""
        # Create godparent relationship
        godparent_rel = FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person3,
            relationship_type='godparent',
            family_group=self.family,
            notes='Godfather relationship',
            is_active=True,
            start_date='2005-12-25',
            relationship_status='active',
            is_biological=False,
            is_legal=False,
            confidence_level=95
        )
        
        # Create godchild relationship
        godchild_rel = FamilyRelationship.objects.create(
            person1=self.person3,
            person2=self.person4,
            relationship_type='godchild',
            family_group=self.family,
            notes='Goddaughter relationship',
            is_active=True,
            start_date='2005-12-25',
            relationship_status='active',
            is_biological=False,
            is_legal=False,
            confidence_level=95
        )
        
        # Create sponsor relationship
        sponsor_rel = FamilyRelationship.objects.create(
            person1=self.person2,
            person2=self.person5,
            relationship_type='sponsor',
            family_group=self.family,
            notes='Sponsor relationship',
            is_active=True,
            start_date='2012-06-01',
            relationship_status='active',
            is_biological=False,
            is_legal=False,
            confidence_level=90
        )
        
        # Test godparent relationship
        self.assertEqual(godparent_rel.relationship_type, 'godparent')
        self.assertEqual(godparent_rel.is_biological, False)
        self.assertEqual(godparent_rel.is_legal, False)
        
        # Test godchild relationship
        self.assertEqual(godchild_rel.relationship_type, 'godchild')
        self.assertEqual(godchild_rel.is_biological, False)
        self.assertEqual(godchild_rel.is_legal, False)
        
        # Test sponsor relationship
        self.assertEqual(sponsor_rel.relationship_type, 'sponsor')
        self.assertEqual(sponsor_rel.is_biological, False)
        self.assertEqual(sponsor_rel.is_legal, False)

    def test_relationship_metadata(self):
        """Test start/end dates, status, biological/legal flags"""
        # Create relationship with full metadata
        relationship = FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person2,
            relationship_type='spouse',
            family_group=self.family,
            notes='Married couple',
            is_active=True,
            start_date='2010-06-15',
            end_date='2020-12-31',  # Divorced
            relationship_status='divorced',
            is_biological=False,
            is_legal=True,
            confidence_level=100
        )
        
        # Test metadata
        self.assertEqual(str(relationship.start_date), '2010-06-15')
        self.assertEqual(str(relationship.end_date), '2020-12-31')
        self.assertEqual(relationship.relationship_status, 'divorced')
        self.assertEqual(relationship.is_biological, False)
        self.assertEqual(relationship.is_legal, True)
        self.assertEqual(relationship.confidence_level, 100)
        self.assertEqual(relationship.is_active, True)

    def test_confidence_levels(self):
        """Test confidence level validation and display"""
        # Create relationship with high confidence
        high_confidence_rel = FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person2,
            relationship_type='spouse',
            family_group=self.family,
            confidence_level=100
        )
        
        # Create relationship with medium confidence
        medium_confidence_rel = FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person3,
            relationship_type='parent',
            family_group=self.family,
            confidence_level=75
        )
        
        # Create relationship with low confidence
        low_confidence_rel = FamilyRelationship.objects.create(
            person1=self.person2,
            person2=self.person4,
            relationship_type='sibling',
            family_group=self.family,
            confidence_level=50
        )
        
        # Test confidence levels
        self.assertEqual(high_confidence_rel.confidence_level, 100)
        self.assertEqual(medium_confidence_rel.confidence_level, 75)
        self.assertEqual(low_confidence_rel.confidence_level, 50)
        
        # Test confidence level validation (should be between 0-100)
        with self.assertRaises(Exception):
            FamilyRelationship.objects.create(
                person1=self.person1,
                person2=self.person2,
                relationship_type='spouse',
                family_group=self.family,
                confidence_level=150  # Invalid confidence level
            )

    def test_relationship_categories(self):
        """Test relationship type categories and organization"""
        # Test that all relationship types are properly categorized
        relationship_categories = {
            'immediate_family': ['parent', 'child', 'spouse', 'sibling'],
            'extended_family': ['step_parent', 'step_child', 'half_sibling'],
            'in_laws': ['father_in_law', 'mother_in_law', 'son_in_law', 'daughter_in_law'],
            'legal': ['adopted_parent', 'adopted_child', 'legal_guardian', 'ward'],
            'religious': ['godparent', 'godchild', 'sponsor'],
        }
        
        # Test that we can create relationships in each category
        for category, types in relationship_categories.items():
            for rel_type in types:
                relationship = FamilyRelationship.objects.create(
                    person1=self.person1,
                    person2=self.person2,
                    relationship_type=rel_type,
                    family_group=self.family,
                    confidence_level=80
                )
                self.assertEqual(relationship.relationship_type, rel_type)

    def test_relationship_validation(self):
        """Test relationship validation rules"""
        # Test that relationships cannot be created with invalid types using serializer
        from .serializers import EnhancedFamilyRelationshipSerializer
        relationship_data = {
            'person1': self.person1.pid,
            'person2': self.person2.pid,
            'relationship_type': 'invalid_type',
            'family_group': self.family.id
        }
        serializer = EnhancedFamilyRelationshipSerializer(data=relationship_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('relationship_type', serializer.errors)
        
        # Test that relationships cannot be created with same person
        with self.assertRaises(Exception):
            FamilyRelationship.objects.create(
                person1=self.person1,
                person2=self.person1,
                relationship_type='spouse',
                family_group=self.family
            )

    def test_relationship_api_endpoints(self):
        """Test API endpoints for rich relationships"""
        # Create a relationship
        relationship = FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person2,
            relationship_type='spouse',
            family_group=self.family,
            confidence_level=100
        )
        
        # Test relationship list endpoint
        url = reverse('family:family-relationships-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test relationship detail endpoint
        url = reverse('family-relationships-detail', kwargs={'pk': relationship.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test relationship creation endpoint
        url = reverse('family:family-relationships-list')
        data = {
            'person1': self.person1.pid,
            'person2': self.person3.pid,
            'relationship_type': 'parent',
            'family_group': self.family.id,
            'confidence_level': 90
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Test relationship update endpoint
        url = reverse('family-relationships-detail', kwargs={'pk': relationship.id})
        data = {
            'person1': self.person1.pid,
            'person2': self.person2.pid,
            'relationship_type': 'spouse',
            'family_group': self.family.id,
            'confidence_level': 95
        }
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test relationship deletion endpoint
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_relationship_filtering(self):
        """Test filtering relationships by type, status, and metadata"""
        # Create relationships with different types and statuses
        FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person2,
            relationship_type='spouse',
            family_group=self.family,
            relationship_status='active',
            is_biological=False,
            is_legal=True,
            confidence_level=100
        )
        
        FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person3,
            relationship_type='parent',
            family_group=self.family,
            relationship_status='active',
            is_biological=True,
            is_legal=True,
            confidence_level=90
        )
        
        FamilyRelationship.objects.create(
            person1=self.person2,
            person2=self.person4,
            relationship_type='sibling',
            family_group=self.family,
            relationship_status='active',
            is_biological=True,
            is_legal=True,
            confidence_level=85
        )
        
        # Test filtering by relationship type
        spouse_relationships = FamilyRelationship.objects.filter(relationship_type='spouse')
        self.assertEqual(spouse_relationships.count(), 1)
        
        # Test filtering by biological status
        biological_relationships = FamilyRelationship.objects.filter(is_biological=True)
        self.assertEqual(biological_relationships.count(), 2)
        
        # Test filtering by legal status
        legal_relationships = FamilyRelationship.objects.filter(is_legal=True)
        self.assertEqual(legal_relationships.count(), 3)
        
        # Test filtering by confidence level
        high_confidence_relationships = FamilyRelationship.objects.filter(confidence_level__gte=90)
        self.assertEqual(high_confidence_relationships.count(), 2)
        
        # Test filtering by status
        active_relationships = FamilyRelationship.objects.filter(relationship_status='active')
        self.assertEqual(active_relationships.count(), 3)

    def test_relationship_statistics(self):
        """Test relationship statistics and analytics"""
        # Create various relationships
        FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person2,
            relationship_type='spouse',
            family_group=self.family,
            confidence_level=100
        )
        
        FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person3,
            relationship_type='parent',
            family_group=self.family,
            confidence_level=90
        )
        
        FamilyRelationship.objects.create(
            person1=self.person2,
            person2=self.person4,
            relationship_type='sibling',
            family_group=self.family,
            confidence_level=85
        )
        
        # Test relationship count
        total_relationships = FamilyRelationship.objects.count()
        self.assertEqual(total_relationships, 3)
        
        # Test relationship type distribution
        relationship_types = FamilyRelationship.objects.values_list('relationship_type', flat=True)
        self.assertIn('spouse', relationship_types)
        self.assertIn('parent', relationship_types)
        self.assertIn('sibling', relationship_types)
        
        # Test average confidence level
        avg_confidence = FamilyRelationship.objects.aggregate(
            avg_confidence=models.Avg('confidence_level')
        )['avg_confidence']
        self.assertAlmostEqual(avg_confidence, 91.67, places=2)

if __name__ == '__main__':
    pytest.main([__file__])
