# 2024-12-28: Phase 4 comprehensive tests for enhanced family tree functionality
# Tests rich relationships, media integration, life events, and advanced features

import pytest
import json
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from datetime import date, timedelta

from .models import FamilyGroup, FamilyMember, FamilyRelationship, FamilyMedia, FamilyEvent
from .serializers import (
    FamilyMediaSerializer, FamilyEventSerializer, EnhancedFamilyRelationshipSerializer,
    FamilyGroupSerializer, PhoneBookEntryWithMediaSerializer
)
from dirReactFinal_directory.models import PhoneBookEntry
from dirReactFinal_core.models import Island

User = get_user_model()

@pytest.mark.django_db
class Phase4ModelTests(TestCase):
    """Test Phase 4 model functionality"""
    
    def setUp(self):
        """Set up test data"""
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create test island
        self.island = Island.objects.create(name='Male', atoll='Male')
        
        # Create test phonebook entries
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
        
        # Create test family group
        self.family_group = FamilyGroup.objects.create(
            name='Doe Family',
            description='Test family',
            address='123 Main St',
            island=self.island,
            is_public=True,
            created_by=self.user
        )
        
        # Create test family members
        self.member1 = FamilyMember.objects.create(
            entry=self.person1,
            family_group=self.family_group,
            role_in_family='father'
        )
        
        self.member2 = FamilyMember.objects.create(
            entry=self.person2,
            family_group=self.family_group,
            role_in_family='mother'
        )

    def test_enhanced_relationship_creation(self):
        """Test creating relationships with Phase 4 metadata"""
        relationship = FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person2,
            relationship_type='spouse',
            family_group=self.family_group,
            start_date=date(2020, 1, 1),
            end_date=None,
            relationship_status='active',
            is_biological=True,
            is_legal=True,
            confidence_level=100,
            notes='Married in 2020'
        )
        
        self.assertEqual(relationship.relationship_type, 'spouse')
        self.assertEqual(relationship.start_date, date(2020, 1, 1))
        self.assertEqual(relationship.relationship_status, 'active')
        self.assertTrue(relationship.is_biological)
        self.assertTrue(relationship.is_legal)
        self.assertEqual(relationship.confidence_level, 100)
        self.assertEqual(relationship.notes, 'Married in 2020')

    def test_rich_relationship_types(self):
        """Test all new relationship types"""
        relationship_types = [
            'step_parent', 'step_child', 'step_sibling', 'half_sibling',
            'father_in_law', 'mother_in_law', 'son_in_law', 'daughter_in_law',
            'brother_in_law', 'sister_in_law', 'adopted_parent', 'adopted_child',
            'legal_guardian', 'ward', 'foster_parent', 'foster_child',
            'godparent', 'godchild', 'sponsor'
        ]
        
        for rel_type in relationship_types:
            relationship = FamilyRelationship.objects.create(
                person1=self.person1,
                person2=self.person2,
                relationship_type=rel_type,
                family_group=self.family_group
            )
            self.assertEqual(relationship.relationship_type, rel_type)

    def test_reciprocal_relationships(self):
        """Test reciprocal relationship mapping"""
        # Test basic reciprocal relationships
        relationship = FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person2,
            relationship_type='parent',
            family_group=self.family_group
        )
        self.assertEqual(relationship.get_reciprocal_relationship(), 'child')
        
        # Test step relationships
        step_relationship = FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person2,
            relationship_type='step_parent',
            family_group=self.family_group
        )
        self.assertEqual(step_relationship.get_reciprocal_relationship(), 'step_child')
        
        # Test in-law relationships
        inlaw_relationship = FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person2,
            relationship_type='father_in_law',
            family_group=self.family_group
        )
        self.assertEqual(inlaw_relationship.get_reciprocal_relationship(), 'son_in_law')

    def test_family_media_creation(self):
        """Test family media model creation"""
        # Create a test file
        test_file = SimpleUploadedFile(
            "test_photo.jpg",
            b"file_content",
            content_type="image/jpeg"
        )
        
        media = FamilyMedia.objects.create(
            person=self.person1,
            media_type='photo',
            title='Test Photo',
            description='A test photo',
            file_path='/media/test_photo.jpg',
            file_size=1024,
            mime_type='image/jpeg',
            uploaded_by='test_user',
            is_public=True
        )
        
        self.assertEqual(media.person, self.person1)
        self.assertEqual(media.media_type, 'photo')
        self.assertEqual(media.title, 'Test Photo')
        self.assertEqual(media.file_size, 1024)
        self.assertTrue(media.is_public)

    def test_family_event_creation(self):
        """Test family event model creation"""
        event = FamilyEvent.objects.create(
            person=self.person1,
            event_type='birth',
            title='Birth',
            description='Born in Male',
            event_date=date(1980, 1, 1),
            location='Male Hospital',
            is_verified=True,
            source='Birth Certificate',
            notes='Verified birth record'
        )
        
        self.assertEqual(event.person, self.person1)
        self.assertEqual(event.event_type, 'birth')
        self.assertEqual(event.title, 'Birth')
        self.assertEqual(event.event_date, date(1980, 1, 1))
        self.assertEqual(event.location, 'Male Hospital')
        self.assertTrue(event.is_verified)
        self.assertEqual(event.source, 'Birth Certificate')

    def test_media_attachment_to_relationship(self):
        """Test attaching media to relationships"""
        relationship = FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person2,
            relationship_type='spouse',
            family_group=self.family_group
        )
        
        media = FamilyMedia.objects.create(
            relationship=relationship,
            media_type='certificate',
            title='Marriage Certificate',
            file_path='/media/marriage_cert.pdf',
            uploaded_by='test_user'
        )
        
        self.assertEqual(media.relationship, relationship)
        self.assertEqual(media.media_type, 'certificate')

    def test_event_media_attachment(self):
        """Test attaching media to events"""
        event = FamilyEvent.objects.create(
            person=self.person1,
            event_type='marriage',
            title='Wedding',
            event_date=date(2020, 1, 1),
            location='Male'
        )
        
        media = FamilyMedia.objects.create(
            person=self.person1,
            media_type='photo',
            title='Wedding Photo',
            file_path='/media/wedding.jpg',
            uploaded_by='test_user'
        )
        
        event.media_attachments.add(media)
        
        self.assertIn(media, event.media_attachments.all())

@pytest.mark.django_db
class Phase4APITests(APITestCase):
    """Test Phase 4 API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create test island
        self.island = Island.objects.create(name='Male', atoll='Male')
        
        # Create test phonebook entries
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
        
        # Create test family group
        self.family_group = FamilyGroup.objects.create(
            name='Doe Family',
            description='Test family',
            address='123 Main St',
            island=self.island,
            is_public=True,
            created_by=self.user
        )
        
        # Create test relationship
        self.relationship = FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person2,
            relationship_type='spouse',
            family_group=self.family_group,
            start_date=date(2020, 1, 1),
            relationship_status='active',
            is_biological=True,
            is_legal=True,
            confidence_level=100
        )
        
        # Authenticate
        self.client.force_authenticate(user=self.user)

    def test_enhanced_relationship_api(self):
        """Test enhanced relationship API endpoints"""
        url = reverse('family:enhanced-relationship-list')
        
        # Test GET request
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        
        # Test filtering by person
        response = self.client.get(url, {'person': self.person1.pid})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        
        # Test filtering by relationship type
        response = self.client.get(url, {'relationship_type': 'spouse'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        
        # Test filtering by status
        response = self.client.get(url, {'status': 'active'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_media_api(self):
        """Test media API endpoints"""
        url = reverse('family:family-media-list')
        
        # Test GET request
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test POST request (create media)
        media_data = {
            'person': self.person1.pid,
            'media_type': 'photo',
            'title': 'Test Photo',
            'description': 'A test photo',
            'file_path': '/media/test.jpg',
            'file_size': 1024,
            'mime_type': 'image/jpeg',
            'is_public': True
        }
        
        response = self.client.post(url, media_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Test Photo')
        
        # Test filtering by person
        response = self.client.get(url, {'person': self.person1.pid})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_events_api(self):
        """Test events API endpoints"""
        url = reverse('family:family-events-list')
        
        # Test GET request
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test POST request (create event)
        event_data = {
            'person': self.person1.pid,
            'event_type': 'birth',
            'title': 'Birth',
            'description': 'Born in Male',
            'event_date': '1980-01-01',
            'location': 'Male Hospital',
            'is_verified': True,
            'source': 'Birth Certificate'
        }
        
        response = self.client.post(url, event_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Birth')
        
        # Test filtering by person
        response = self.client.get(url, {'person': self.person1.pid})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test filtering by event type
        response = self.client.get(url, {'event_type': 'birth'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_enhanced_family_group_api(self):
        """Test enhanced family group API"""
        url = reverse('family:enhanced-group-complete-data', kwargs={'pk': self.family_group.id})
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that all data is included
        self.assertIn('family_group', response.data)
        self.assertIn('members', response.data)
        self.assertIn('relationships', response.data)
        self.assertIn('media', response.data)
        self.assertIn('events', response.data)

    def test_person_with_media_api(self):
        """Test person with media API"""
        # Create some test media and events
        FamilyMedia.objects.create(
            person=self.person1,
            media_type='photo',
            title='Profile Photo',
            file_path='/media/profile.jpg',
            uploaded_by='test_user'
        )
        
        FamilyEvent.objects.create(
            person=self.person1,
            event_type='birth',
            title='Birth',
            event_date=date(1980, 1, 1),
            location='Male'
        )
        
        url = reverse('family:phonebookentry-complete-profile', kwargs={'pk': self.person1.pid})
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that all data is included
        self.assertIn('person', response.data)
        self.assertIn('relationships', response.data)
        self.assertIn('media', response.data)
        self.assertIn('events', response.data)

@pytest.mark.django_db
class Phase4SerializerTests(TestCase):
    """Test Phase 4 serializers"""
    
    def setUp(self):
        """Set up test data"""
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.island = Island.objects.create(name='Male', atoll='Male')
        
        self.person1 = PhoneBookEntry.objects.create(
            pid=1001,
            name='John Doe',
            contact='1234567890',
            address='123 Main St',
            island=self.island
        )
        
        self.family_group = FamilyGroup.objects.create(
            name='Doe Family',
            description='Test family',
            address='123 Main St',
            island=self.island,
            is_public=True,
            created_by=self.user
        )
        
        # Create a second person for the relationship
        self.person2 = PhoneBookEntry.objects.create(
            pid=1002,
            name='Jane Doe',
            contact='9876543210',
            email='jane@example.com',
            address='456 Oak St',
            island=self.island
        )
        
        self.relationship = FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person2,
            relationship_type='spouse',
            family_group=self.family_group,
            start_date=date(2020, 1, 1),
            relationship_status='active',
            is_biological=True,
            is_legal=True,
            confidence_level=100
        )
        
        self.media = FamilyMedia.objects.create(
            person=self.person1,
            media_type='photo',
            title='Test Photo',
            file_path='/media/test.jpg',
            file_size=1024,
            is_public=True
        )
        
        self.event = FamilyEvent.objects.create(
            person=self.person1,
            event_type='birth',
            title='Birth',
            event_date=date(1980, 1, 1),
            location='Male',
            is_verified=True
        )

    def test_enhanced_relationship_serializer(self):
        """Test enhanced relationship serializer"""
        serializer = EnhancedFamilyRelationshipSerializer(self.relationship)
        data = serializer.data
        
        self.assertEqual(data['relationship_type'], 'spouse')
        self.assertEqual(data['start_date'], '2020-01-01')
        self.assertEqual(data['relationship_status'], 'active')
        self.assertTrue(data['is_biological'])
        self.assertTrue(data['is_legal'])
        self.assertEqual(data['confidence_level'], 100)

    def test_family_media_serializer(self):
        """Test family media serializer"""
        serializer = FamilyMediaSerializer(self.media)
        data = serializer.data
        
        self.assertEqual(data['media_type'], 'photo')
        self.assertEqual(data['title'], 'Test Photo')
        self.assertEqual(data['file_path'], '/media/test.jpg')
        self.assertEqual(data['file_size'], 1024)
        self.assertTrue(data['is_public'])

    def test_family_event_serializer(self):
        """Test family event serializer"""
        serializer = FamilyEventSerializer(self.event)
        data = serializer.data
        
        self.assertEqual(data['event_type'], 'birth')
        self.assertEqual(data['title'], 'Birth')
        self.assertEqual(data['event_date'], '1980-01-01')
        self.assertEqual(data['location'], 'Male')
        self.assertTrue(data['is_verified'])

@pytest.mark.django_db
class Phase4IntegrationTests(APITestCase):
    """Test Phase 4 integration scenarios"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.island = Island.objects.create(name='Male', atoll='Male')
        
        # Create family members
        self.father = PhoneBookEntry.objects.create(
            pid=1001,
            name='John Doe',
            contact='1234567890',
            address='123 Main St',
            island=self.island
        )
        
        self.mother = PhoneBookEntry.objects.create(
            pid=1002,
            name='Jane Doe',
            contact='0987654321',
            address='123 Main St',
            island=self.island
        )
        
        self.son = PhoneBookEntry.objects.create(
            pid=1003,
            name='Bob Doe',
            contact='5555555555',
            address='123 Main St',
            island=self.island
        )
        
        self.family_group = FamilyGroup.objects.create(
            name='Doe Family',
            description='Test family',
            address='123 Main St',
            island=self.island,
            is_public=True,
            created_by=self.user
        )
        
        # Create family members
        FamilyMember.objects.create(
            entry=self.father,
            family_group=self.family_group,
            role_in_family='father'
        )
        
        FamilyMember.objects.create(
            entry=self.mother,
            family_group=self.family_group,
            role_in_family='mother'
        )
        
        FamilyMember.objects.create(
            entry=self.son,
            family_group=self.family_group,
            role_in_family='son'
        )
        
        self.client.force_authenticate(user=self.user)

    def test_complete_family_workflow(self):
        """Test complete family management workflow"""
        # 1. Create relationships
        spouse_relationship = FamilyRelationship.objects.create(
            person1=self.father,
            person2=self.mother,
            relationship_type='spouse',
            family_group=self.family_group,
            start_date=date(2020, 1, 1),
            relationship_status='active',
            is_biological=True,
            is_legal=True,
            confidence_level=100
        )
        
        parent_relationship = FamilyRelationship.objects.create(
            person1=self.father,
            person2=self.son,
            relationship_type='parent',
            family_group=self.family_group,
            is_biological=True,
            is_legal=True,
            confidence_level=100
        )
        
        # 2. Add media
        wedding_photo = FamilyMedia.objects.create(
            relationship=spouse_relationship,
            family_group=self.family_group,
            media_type='photo',
            title='Wedding Photo',
            file_path='/media/wedding.jpg',
            uploaded_by=self.user.username,
            is_public=True
        )
        
        # 3. Add events
        birth_event = FamilyEvent.objects.create(
            person=self.son,
            event_type='birth',
            title='Birth',
            event_date=date(2022, 1, 1),
            location='Male Hospital',
            is_verified=True,
            source='Birth Certificate'
        )
        
        marriage_event = FamilyEvent.objects.create(
            person=self.father,
            event_type='marriage',
            title='Wedding',
            event_date=date(2020, 1, 1),
            location='Male',
            related_person=self.mother,
            is_verified=True
        )
        
        # 4. Test API endpoints
        # Get complete family data
        url = reverse('family:enhanced-group-complete-data', kwargs={'pk': self.family_group.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        self.assertEqual(len(data['relationships']), 2)
        self.assertEqual(len(data['media']), 1)
        self.assertEqual(len(data['events']), 2)
        
        # Test person profile
        url = reverse('family:phonebookentry-complete-profile', kwargs={'pk': self.father.pid})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        self.assertIn('person', data)
        self.assertIn('relationships', data)
        self.assertIn('media', data)
        self.assertIn('events', data)

    def test_relationship_metadata_validation(self):
        """Test relationship metadata validation"""
        # Test valid relationship
        relationship_data = {
            'person1': self.father.pid,
            'person2': self.mother.pid,
            'relationship_type': 'spouse',
            'family_group': self.family_group.id,
            'start_date': '2020-01-01',
            'end_date': None,
            'relationship_status': 'active',
            'is_biological': True,
            'is_legal': True,
            'confidence_level': 100,
            'notes': 'Married in 2020'
        }
        
        serializer = EnhancedFamilyRelationshipSerializer(data=relationship_data)
        self.assertTrue(serializer.is_valid())
        
        # Test invalid confidence level
        relationship_data['confidence_level'] = 150
        serializer = EnhancedFamilyRelationshipSerializer(data=relationship_data)
        self.assertFalse(serializer.is_valid())
        
        # Test invalid relationship status
        relationship_data['confidence_level'] = 100
        relationship_data['relationship_status'] = 'invalid'
        serializer = EnhancedFamilyRelationshipSerializer(data=relationship_data)
        self.assertFalse(serializer.is_valid())

if __name__ == '__main__':
    pytest.main([__file__])
