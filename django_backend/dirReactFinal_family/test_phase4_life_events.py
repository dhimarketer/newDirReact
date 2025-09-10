# 2024-12-28: Phase 4 Life Events Timeline Tests
# Tests for Life Events Creation, Timeline Ordering, Media Attachments, and Event Management

import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.db import transaction
from django.core.files.uploadedfile import SimpleUploadedFile
from datetime import date, datetime
from decimal import Decimal

from .models import FamilyGroup, FamilyMember, FamilyRelationship, FamilyMedia, FamilyEvent
from dirReactFinal_directory.models import PhoneBookEntry
from dirReactFinal_core.models import Island

User = get_user_model()

@pytest.mark.django_db
class LifeEventsTimelineTests(APITestCase):
    """Test Phase 4: Life Events Timeline functionality"""
    
    def setUp(self):
        """Set up test data for life events"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.island = Island.objects.create(name='Male', atoll='Male')
        
        # Create test persons
        self.person1 = PhoneBookEntry.objects.create(
            pid=5001,
            name='John Doe',
            contact='1234567890',
            address='123 Main St',
            island=self.island
        )
        
        self.person2 = PhoneBookEntry.objects.create(
            pid=5002,
            name='Jane Doe',
            contact='0987654321',
            address='123 Main St',
            island=self.island
        )
        
        self.person3 = PhoneBookEntry.objects.create(
            pid=5003,
            name='Bob Smith',
            contact='5555555555',
            address='456 Oak Ave',
            island=self.island
        )
        
        # Create family group
        self.family = FamilyGroup.objects.create(
            name='Test Family',
            description='Test family for life events',
            address='123 Main St',
            island=self.island,
            is_public=True,
        )
        
        # Create family members
        self.member1 = FamilyMember.objects.create(
            entry=self.person1,
            family_group=self.family,
            role_in_family='father'
        )
        
        self.member2 = FamilyMember.objects.create(
            entry=self.person2,
            family_group=self.family,
            role_in_family='mother'
        )
        
        self.member3 = FamilyMember.objects.create(
            entry=self.person3,
            family_group=self.family,
            role_in_family='son'
        )
        
        # Create relationship
        self.relationship = FamilyRelationship.objects.create(
            person1=self.person1,
            person2=self.person2,
            relationship_type='spouse',
            family_group=self.family
        )
        
        self.client.force_authenticate(user=self.user)

    def create_test_image(self, width=100, height=100, format='JPEG'):
        """Create a test image file"""
        from PIL import Image
        from io import BytesIO
        
        image = Image.new('RGB', (width, height), color='red')
        image_io = BytesIO()
        image.save(image_io, format=format)
        image_io.seek(0)
        return SimpleUploadedFile(
            f'test_image.{format.lower()}',
            image_io.getvalue(),
            content_type=f'image/{format.lower()}'
        )

    def test_event_creation(self):
        """Test creating life events (birth, death, marriage, etc.)"""
        # Create birth event
        birth_event = FamilyEvent.objects.create(
            person=self.person1,
            event_type='birth',
            title='Birth of John Doe',
            description='John Doe was born in Male, Maldives',
            event_date='1990-01-15',
            location='Male, Maldives',
            is_verified=True
        )
        
        # Create marriage event
        marriage_event = FamilyEvent.objects.create(
            person=self.person1,
            event_type='marriage',
            title='Marriage of John and Jane',
            description='John and Jane got married in Male',
            event_date='2015-06-20',
            location='Male, Maldives',
            is_verified=True,
        )
        
        # Create graduation event
        graduation_event = FamilyEvent.objects.create(
            person=self.person3,
            event_type='graduation',
            title='Bob Smith Graduation',
            description='Bob graduated from university',
            event_date='2020-05-15',
            location='Male, Maldives',
            is_verified=False,
        )
        
        # Test birth event
        self.assertEqual(birth_event.event_type, 'birth')
        self.assertEqual(birth_event.person, self.person1)
        self.assertEqual(birth_event.event_date, '1990-01-15')
        self.assertEqual(birth_event.location, 'Male, Maldives')
        self.assertEqual(birth_event.is_verified, True)
        
        # Test marriage event
        self.assertEqual(marriage_event.event_type, 'marriage')
        self.assertEqual(marriage_event.person, self.person1)
        self.assertEqual(marriage_event.event_date, '2015-06-20')
        
        # Test graduation event
        self.assertEqual(graduation_event.event_type, 'graduation')
        self.assertEqual(graduation_event.person, self.person3)
        self.assertEqual(graduation_event.is_verified, False)

    def test_event_date_validation(self):
        """Test event date validation and formatting"""
        # Create event with valid date
        valid_event = FamilyEvent.objects.create(
            person=self.person1,
            event_type='birth',
            title='Valid Event',
            event_date='1990-01-15',
        )
        
        # Test valid date
        self.assertEqual(valid_event.event_date, '1990-01-15')
        
        # Test date formatting
        self.assertIsInstance(valid_event.event_date, str)
        
        # Test future date validation (if implemented)
        future_event = FamilyEvent.objects.create(
            person=self.person1,
            event_type='birthday',
            title='Future Birthday',
            event_date='2030-01-15',
        )
        
        # Future dates should be allowed for birthdays, anniversaries, etc.
        self.assertEqual(future_event.event_date, '2030-01-15')

    def test_event_location_tracking(self):
        """Test event location storage and display"""
        # Create events with different locations
        local_event = FamilyEvent.objects.create(
            person=self.person1,
            event_type='birth',
            title='Local Birth',
            event_date='1990-01-15',
            location='Male, Maldives',
        )
        
        international_event = FamilyEvent.objects.create(
            person=self.person2,
            event_type='birth',
            title='International Birth',
            event_date='1992-03-20',
            location='Colombo, Sri Lanka',
        )
        
        # Test location storage
        self.assertEqual(local_event.location, 'Male, Maldives')
        self.assertEqual(international_event.location, 'Colombo, Sri Lanka')
        
        # Test location filtering
        local_events = FamilyEvent.objects.filter(location__icontains='Male')
        self.assertEqual(local_events.count(), 1)
        
        international_events = FamilyEvent.objects.filter(location__icontains='Colombo')
        self.assertEqual(international_events.count(), 1)

    def test_event_verification_system(self):
        """Test event verification status and sources"""
        # Create verified event
        verified_event = FamilyEvent.objects.create(
            person=self.person1,
            event_type='birth',
            title='Verified Birth',
            event_date='1990-01-15',
            is_verified=True,
            verification_source='Birth Certificate',
        )
        
        # Create pending event
        pending_event = FamilyEvent.objects.create(
            person=self.person2,
            event_type='birth',
            title='Pending Birth',
            event_date='1992-03-20',
            is_verified=False,
        )
        
        # Create disputed event
        disputed_event = FamilyEvent.objects.create(
            person=self.person3,
            event_type='birth',
            title='Disputed Birth',
            event_date='1995-07-10',
            is_verified=False,
        )
        
        # Test verification status
        self.assertEqual(verified_event.is_verified, True)
        self.assertEqual(verified_event.is_verified, True)
        self.assertEqual(verified_event.verification_source, 'Birth Certificate')
        
        self.assertEqual(pending_event.is_verified, False)
        self.assertEqual(pending_event.is_verified, False)
        
        self.assertEqual(disputed_event.is_verified, False)
        self.assertEqual(disputed_event.is_verified, False)
        
        # Test filtering by verification status
        verified_events = FamilyEvent.objects.filter(is_verified=True)
        self.assertEqual(verified_events.count(), 1)
        
        pending_events = FamilyEvent.objects.filter(is_verified=False)
        self.assertEqual(pending_events.count(), 2)
        
        disputed_events = FamilyEvent.objects.filter(title='Disputed Birth')
        self.assertEqual(disputed_events.count(), 1)

    def test_event_media_attachments(self):
        """Test attaching media to events"""
        # Create test image
        test_image = self.create_test_image()
        
        # Create media
        media = FamilyMedia.objects.create(
            person=self.person1,
            family_group=self.family,
            media_type='photo',
            title='Birth Photo',
            file_path='/test/path/birth_photo.jpg',
            uploaded_by=self.user.username
        )
        
        # Create event with media attachment
        event = FamilyEvent.objects.create(
            person=self.person1,
            event_type='birth',
            title='Birth with Photo',
            event_date='1990-01-15',
        )
        
        # Add media attachment using set() method
        event.media_attachments.set([media])
        
        # Test media attachment
        self.assertIn(media, event.media_attachments.all())
        
        # Test that media is linked to event
        self.assertEqual(media.family_group, self.family)
        self.assertEqual(media.person, self.person1)

    def test_event_timeline_ordering(self):
        """Test chronological ordering of events"""
        # Create events in random order
        event3 = FamilyEvent.objects.create(
            person=self.person1,
            event_type='graduation',
            title='Graduation',
            event_date='2010-05-15',
        )
        
        event1 = FamilyEvent.objects.create(
            person=self.person1,
            event_type='birth',
            title='Birth',
            event_date='1990-01-15',
        )
        
        event2 = FamilyEvent.objects.create(
            person=self.person1,
            event_type='marriage',
            title='Marriage',
            event_date='2015-06-20',
        )
        
        # Test chronological ordering
        ordered_events = FamilyEvent.objects.filter(person=self.person1).order_by('event_date')
        
        self.assertEqual(ordered_events[0], event1)  # Birth (1990)
        self.assertEqual(ordered_events[1], event3)  # Graduation (2010)
        self.assertEqual(ordered_events[2], event2)  # Marriage (2015)
        
        # Test reverse chronological ordering
        reverse_ordered_events = FamilyEvent.objects.filter(person=self.person1).order_by('-event_date')
        
        self.assertEqual(reverse_ordered_events[0], event2)  # Marriage (2015)
        self.assertEqual(reverse_ordered_events[1], event3)  # Graduation (2010)
        self.assertEqual(reverse_ordered_events[2], event1)  # Birth (1990)

    def test_event_types(self):
        """Test different event types and their properties"""
        event_types = [
            ('birth', 'Birth'),
            ('death', 'Death'),
            ('marriage', 'Marriage'),
            ('divorce', 'Divorce'),
            ('graduation', 'Graduation'),
            ('employment', 'Employment'),
            ('retirement', 'Retirement'),
            ('migration', 'Migration'),
            ('illness', 'Illness'),
            ('recovery', 'Recovery'),
        ]
        
        for event_type, display_name in event_types:
            event = FamilyEvent.objects.create(
                person=self.person1,
                event_type=event_type,
                title=f'{display_name} Event',
                event_date='2020-01-01',
            )
            
            self.assertEqual(event.event_type, event_type)
            self.assertEqual(event.get_event_type_display(), display_name)

    def test_event_api_endpoints(self):
        """Test API endpoints for event management"""
        # Create test event
        event = FamilyEvent.objects.create(
            person=self.person1,
            event_type='birth',
            title='Test Birth',
            event_date='1990-01-15',
        )
        
        # Test event list endpoint
        url = reverse('family:family-events-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test event detail endpoint
        url = reverse('family-events-detail', kwargs={'pk': event.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test event creation endpoint
        url = reverse('family:family-events-list')
        data = {
            'person': self.person1.pid,
            'event_type': 'marriage',
            'title': 'New Marriage',
            'event_date': '2020-06-15',
            'location': 'Male, Maldives',
            'is_verified': True,
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Test event update endpoint
        url = reverse('family-events-detail', kwargs={'pk': event.id})
        data = {
            'person': self.person1.pid,
            'event_type': 'birth',
            'title': 'Updated Birth',
            'event_date': '1990-01-15',
            'location': 'Male, Maldives',
            'is_verified': True,
        }
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test event deletion endpoint
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_event_filtering(self):
        """Test filtering events by type, person, date, verification status"""
        # Create various events
        FamilyEvent.objects.create(
            person=self.person1,
            event_type='birth',
            title='Birth 1',
            event_date='1990-01-15',
            is_verified=True,
        )
        
        FamilyEvent.objects.create(
            person=self.person2,
            event_type='birth',
            title='Birth 2',
            event_date='1992-03-20',
            is_verified=False,
        )
        
        FamilyEvent.objects.create(
            person=self.person1,
            event_type='marriage',
            title='Marriage',
            event_date='2015-06-20',
            is_verified=True,
        )
        
        # Test filtering by event type
        birth_events = FamilyEvent.objects.filter(event_type='birth')
        self.assertEqual(birth_events.count(), 2)
        
        marriage_events = FamilyEvent.objects.filter(event_type='marriage')
        self.assertEqual(marriage_events.count(), 1)
        
        # Test filtering by person
        person1_events = FamilyEvent.objects.filter(person=self.person1)
        self.assertEqual(person1_events.count(), 2)
        
        person2_events = FamilyEvent.objects.filter(person=self.person2)
        self.assertEqual(person2_events.count(), 1)
        
        # Test filtering by verification status
        verified_events = FamilyEvent.objects.filter(is_verified=True)
        self.assertEqual(verified_events.count(), 2)
        
        unverified_events = FamilyEvent.objects.filter(is_verified=False)
        self.assertEqual(unverified_events.count(), 1)
        
        # Test filtering by date range
        recent_events = FamilyEvent.objects.filter(event_date__gte='2010-01-01')
        self.assertEqual(recent_events.count(), 1)
        
        old_events = FamilyEvent.objects.filter(event_date__lt='2000-01-01')
        self.assertEqual(old_events.count(), 2)

    def test_event_search(self):
        """Test searching events by title, description, location"""
        # Create events with searchable content
        FamilyEvent.objects.create(
            person=self.person1,
            event_type='birth',
            title='Birth in Male',
            description='Born in Male, Maldives',
            location='Male, Maldives',
            event_date='1990-01-15',
        )
        
        FamilyEvent.objects.create(
            person=self.person2,
            event_type='marriage',
            title='Wedding Ceremony',
            description='Beautiful wedding in Male',
            location='Male, Maldives',
            event_date='2015-06-20',
        )
        
        FamilyEvent.objects.create(
            person=self.person3,
            event_type='graduation',
            title='University Graduation',
            description='Graduated from university in Colombo',
            location='Colombo, Sri Lanka',
            event_date='2020-05-15',
        )
        
        # Test search by title
        male_events = FamilyEvent.objects.filter(title__icontains='Male')
        self.assertEqual(male_events.count(), 1)
        
        # Test search by description
        wedding_events = FamilyEvent.objects.filter(description__icontains='wedding')
        self.assertEqual(wedding_events.count(), 1)
        
        # Test search by location
        colombo_events = FamilyEvent.objects.filter(location__icontains='Colombo')
        self.assertEqual(colombo_events.count(), 1)

    def test_event_statistics(self):
        """Test event statistics and analytics"""
        # Create various events
        FamilyEvent.objects.create(
            person=self.person1,
            event_type='birth',
            title='Birth 1',
            event_date='1990-01-15',
            is_verified=True,
        )
        
        FamilyEvent.objects.create(
            person=self.person2,
            event_type='birth',
            title='Birth 2',
            event_date='1992-03-20',
            is_verified=True,
        )
        
        FamilyEvent.objects.create(
            person=self.person1,
            event_type='marriage',
            title='Marriage',
            event_date='2015-06-20',
            is_verified=False,
        )
        
        # Test event count
        total_events = FamilyEvent.objects.count()
        self.assertEqual(total_events, 3)
        
        # Test event type distribution
        event_types = FamilyEvent.objects.values_list('event_type', flat=True)
        self.assertIn('birth', event_types)
        self.assertIn('marriage', event_types)
        
        # Test verification statistics
        verified_count = FamilyEvent.objects.filter(is_verified=True).count()
        self.assertEqual(verified_count, 2)
        
        unverified_count = FamilyEvent.objects.filter(is_verified=False).count()
        self.assertEqual(unverified_count, 1)

    def test_event_timeline_view(self):
        """Test timeline view functionality"""
        # Create events spanning multiple years
        FamilyEvent.objects.create(
            person=self.person1,
            event_type='birth',
            title='Birth',
            event_date='1990-01-15',
        )
        
        FamilyEvent.objects.create(
            person=self.person1,
            event_type='graduation',
            title='High School Graduation',
            event_date='2008-05-15',
        )
        
        FamilyEvent.objects.create(
            person=self.person1,
            event_type='marriage',
            title='Marriage',
            event_date='2015-06-20',
        )
        
        # Test timeline ordering
        timeline_events = FamilyEvent.objects.filter(person=self.person1).order_by('event_date')
        
        self.assertEqual(timeline_events[0].event_type, 'birth')
        self.assertEqual(timeline_events[1].event_type, 'graduation')
        self.assertEqual(timeline_events[2].event_type, 'marriage')
        
        # Test timeline filtering by year
        events_2000s = FamilyEvent.objects.filter(
            person=self.person1,
            event_date__year__gte=2000,
            event_date__year__lt=2010
        )
        self.assertEqual(events_2000s.count(), 1)
        self.assertEqual(events_2000s.first().event_type, 'graduation')

if __name__ == '__main__':
    pytest.main([__file__])
