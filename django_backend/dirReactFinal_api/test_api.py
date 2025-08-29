# 2025-01-27: API tests for dirReactFinal migration project
# Comprehensive testing of all API endpoints

import json
import pytest
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from dirReactFinal_core.models import User, UserPermission, EventLog, Atoll, Island, Party
from dirReactFinal_directory.models import PhoneBookEntry, Image
from dirReactFinal_family.models import FamilyGroup, FamilyMember
from dirReactFinal_moderation.models import PendingChange, PhotoModeration
from dirReactFinal_scoring.models import ScoreTransaction, RewardRule

User = get_user_model()

@pytest.mark.django_db
class BaseTestCase(APITestCase):
    """Base test case with common setup"""
    
    def setUp(self):
        """Set up test data"""
        # Create test users
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            user_type='admin',
            is_staff=True,
            is_superuser=True
        )
        
        self.basic_user = User.objects.create_user(
            username='basicuser',
            email='basic@example.com',
            password='basicpass123',
            user_type='basic'
        )
        
        self.premium_user = User.objects.create_user(
            username='premiumuser',
            email='premium@example.com',
            password='premiumpass123',
            user_type='premium'
        )
        
        # Create user permissions
        UserPermission.objects.create(
            user_type='basic',
            module='directory',
            can_read=True,
            can_write=True,
            can_delete=True,
            can_admin=False
        )
        
        UserPermission.objects.create(
            user_type='premium',
            module='directory',
            can_read=True,
            can_write=True,
            can_delete=True,
            can_admin=False
        )
        
        UserPermission.objects.create(
            user_type='admin',
            module='directory',
            can_read=True,
            can_write=True,
            can_delete=True,
            can_admin=True
        )
        
        # Create family management permissions
        UserPermission.objects.create(
            user_type='basic',
            module='family',
            can_read=True,
            can_write=True,
            can_delete=True,
            can_admin=False
        )
        
        UserPermission.objects.create(
            user_type='premium',
            module='family',
            can_write=True,
            can_delete=True,
            can_admin=False
        )
        
        UserPermission.objects.create(
            user_type='admin',
            module='family',
            can_read=True,
            can_write=True,
            can_delete=True,
            can_admin=True
        )
        
        # Create Atoll, Island, and Party objects first
        self.male_atoll = Atoll.objects.create(name='Male')
        self.addu_atoll = Atoll.objects.create(name='Addu')
        
        self.male_island = Island.objects.create(name='Male City', atoll='Male')
        self.hithadhoo_island = Island.objects.create(name='Hithadhoo', atoll='Addu')
        
        self.test_party = Party.objects.create(name='Test Party', short_name='TP')
        
        # Create test phonebook entries
        self.contact1 = PhoneBookEntry.objects.create(
            name='John Doe',
            contact='7771234',
            address='123 Main Street',
            atoll=self.male_atoll,
            island=self.male_island,
            party=self.test_party,
            status='active'
        )
        
        self.contact2 = PhoneBookEntry.objects.create(
            name='Jane Smith',
            contact='7775678',
            address='456 Oak Avenue',
            atoll=self.addu_atoll,
            island=self.hithadhoo_island,
            party=self.test_party,
            status='active'
        )
        
        # Create test family group
        self.family_group = FamilyGroup.objects.create(
            name='Doe Family',
            description='Extended family of John Doe',
            created_by=self.basic_user
        )
        
        # Create test pending change
        self.pending_change = PendingChange.objects.create(
            entry=self.contact1,
            change_type='edit',
            new_data={'name': 'John Smith'},
            requested_by=self.basic_user,
            status='pending'
        )
        
        # Set up API client
        self.client = APIClient()

@pytest.mark.django_db
class AuthenticationTestCase(BaseTestCase):
    """Test authentication endpoints"""
    
    def test_user_login_success(self):
        """Test successful user login"""
        url = reverse('auth-login')
        data = {
            'username': 'basicuser',
            'password': 'basicpass123'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.data)
        self.assertIn('refresh_token', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'basicuser')
    
    def test_user_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        url = reverse('auth-login')
        data = {
            'username': 'basicuser',
            'password': 'wrongpassword'
        }
        
        response = self.client.post(url, data, format='json')
        
        # Accept either 400 or 401 as both are valid for invalid credentials
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])
    
    def test_user_registration_success(self):
        """Test successful user registration"""
        url = reverse('auth-register')
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'password_confirm': 'newpass123',
            'user_type': 'basic'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access_token', response.data)
        self.assertIn('refresh_token', response.data)
        self.assertIn('user', response.data)
        
        # Check if user was created
        user = User.objects.get(username='newuser')
        self.assertEqual(user.email, 'newuser@example.com')
        self.assertEqual(user.user_type, 'basic')
    
    def test_user_registration_password_mismatch(self):
        """Test registration with password mismatch"""
        url = reverse('auth-register')
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'password_confirm': 'differentpass',
            'user_type': 'basic'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Password mismatch can be returned as either field-specific or non-field error
        has_password_error = 'password_confirm' in response.data or 'non_field_errors' in response.data
        self.assertTrue(has_password_error, f"Expected password mismatch error, got: {response.data}")

@pytest.mark.django_db
class PhoneBookEntryTestCase(BaseTestCase):
    """Test phonebook entry endpoints"""
    
    def setUp(self):
        super().setUp()
        # Get authentication token for basic user
        refresh = RefreshToken.for_user(self.basic_user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
    
    def test_list_phonebook_entries(self):
        """Test listing phonebook entries"""
        url = reverse('phonebook-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_create_phonebook_entry(self):
        """Test creating a new phonebook entry"""
        url = reverse('phonebook-list')
        data = {
            'name': 'New Contact',
            'contact': '7779999',
            'address': '789 New Street',
            'atoll': 'Male',
            'island': 'Male City',
            'status': 'active'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PhoneBookEntry.objects.count(), 3)
        
        # Check if event log was created
        event_log = EventLog.objects.filter(
            user=self.basic_user,
            event_type='add_contact'
        ).first()
        self.assertIsNotNone(event_log)
    
    def test_get_phonebook_entry(self):
        """Test getting a single phonebook entry"""
        url = reverse('phonebook-detail', args=[self.contact1.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'John Doe')
        self.assertEqual(response.data['contact'], '7771234')
    
    def test_update_phonebook_entry(self):
        """Test updating a phonebook entry"""
        url = reverse('phonebook-detail', args=[self.contact1.id])
        data = {
            'name': 'John Smith',
            'contact': '7771234',
            'address': '123 Main Street',
            'atoll': 'Male',
            'island': 'Male City',
            'status': 'active'
        }
        
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.contact1.refresh_from_db()
        self.assertEqual(self.contact1.name, 'John Smith')
    
    def test_delete_phonebook_entry(self):
        """Test deleting a phonebook entry"""
        url = reverse('phonebook-detail', args=[self.contact1.id])
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(PhoneBookEntry.objects.count(), 1)
    
    def test_advanced_search(self):
        """Test advanced search functionality"""
        url = reverse('phonebook-advanced-search')
        data = {
            'query': 'John',
            'atoll': 'Male'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'John Doe')
    
    def test_bulk_operation(self):
        """Test bulk operations"""
        url = reverse('phonebook-bulk-operation')
        data = {
            'operation': 'update_status',
            'entry_ids': [self.contact1.id, self.contact2.id],
            'update_data': {'status': 'inactive'}
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.contact1.refresh_from_db()
        self.contact2.refresh_from_db()
        self.assertEqual(self.contact1.status, 'inactive')
        self.assertEqual(self.contact2.status, 'inactive')

@pytest.mark.django_db
class UserManagementTestCase(BaseTestCase):
    """Test user management endpoints"""
    
    def setUp(self):
        super().setUp()
        # Get authentication token for admin user
        refresh = RefreshToken.for_user(self.admin_user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
    
    def test_list_users(self):
        """Test listing users"""
        url = reverse('user-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)
    
    def test_get_user_profile(self):
        """Test getting user profile"""
        url = reverse('user-detail', args=[self.basic_user.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'basicuser')
        self.assertEqual(response.data['user_type'], 'basic')
    
    def test_update_user_score(self):
        """Test updating user score"""
        url = reverse('user-update-score', args=[self.basic_user.id])
        data = {
            'points': 25,
            'reason': 'Test score update'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.basic_user.refresh_from_db()
        self.assertEqual(self.basic_user.score, 125)  # 100 + 25
        
        # Check if event log was created
        event_log = EventLog.objects.filter(
            user=self.basic_user,
            event_type='score_change'
        ).first()
        self.assertIsNotNone(event_log)

@pytest.mark.django_db
class FamilyManagementTestCase(BaseTestCase):
    """Test family management endpoints"""
    
    def setUp(self):
        super().setUp()
        # Get authentication token for basic user
        refresh = RefreshToken.for_user(self.basic_user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
    
    def test_list_family_groups(self):
        """Test listing family groups"""
        url = reverse('family-group-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_create_family_group(self):
        """Test creating a family group"""
        url = reverse('family-group-list')
        data = {
            'name': 'Smith Family',
            'description': 'Extended family of Jane Smith'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(FamilyGroup.objects.count(), 2)
        
        # Check if created_by was set correctly
        family_group = FamilyGroup.objects.get(name='Smith Family')
        self.assertEqual(family_group.created_by, self.basic_user)
    
    def test_get_family_group(self):
        """Test getting a family group"""
        url = reverse('family-group-detail', args=[self.family_group.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Doe Family')
        self.assertEqual(response.data['member_count'], 0)

@pytest.mark.django_db
class ModerationTestCase(BaseTestCase):
    """Test moderation endpoints"""
    
    def setUp(self):
        super().setUp()
        # Get authentication token for admin user
        refresh = RefreshToken.for_user(self.admin_user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
    
    def test_list_pending_changes(self):
        """Test listing pending changes"""
        url = reverse('pending-change-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_approve_pending_change(self):
        """Test approving a pending change"""
        url = reverse('pending-change-approve', args=[self.pending_change.id])
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.pending_change.refresh_from_db()
        self.assertEqual(self.pending_change.status, 'approved')
        self.assertEqual(self.pending_change.reviewed_by, self.admin_user)
    
    def test_reject_pending_change(self):
        """Test rejecting a pending change"""
        url = reverse('pending-change-reject', args=[self.pending_change.id])
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.pending_change.refresh_from_db()
        self.assertEqual(self.pending_change.status, 'rejected')
        self.assertEqual(self.pending_change.reviewed_by, self.admin_user)

@pytest.mark.django_db
class AnalyticsTestCase(BaseTestCase):
    """Test analytics endpoints"""
    
    def setUp(self):
        super().setUp()
        # Get authentication token for admin user
        refresh = RefreshToken.for_user(self.admin_user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
    
    def test_get_analytics(self):
        """Test getting analytics data"""
        url = reverse('analytics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('overview', response.data)
        self.assertIn('users', response.data)
        self.assertIn('contacts_by_atoll', response.data)
        self.assertIn('recent_activity', response.data)
        
        # Check specific values
        self.assertEqual(response.data['overview']['total_users'], 3)
        self.assertEqual(response.data['overview']['total_contacts'], 2)
        self.assertEqual(response.data['overview']['total_families'], 1)
        self.assertEqual(response.data['overview']['pending_changes'], 1)

@pytest.mark.django_db
class HealthCheckTestCase(BaseTestCase):
    """Test health check endpoint"""
    
    def test_health_check(self):
        """Test health check endpoint"""
        url = reverse('health-check')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'healthy')
        self.assertIn('timestamp', response.data)
        self.assertEqual(response.data['database'], 'connected')
        self.assertEqual(response.data['version'], '1.0.0')

@pytest.mark.django_db
class PermissionTestCase(BaseTestCase):
    """Test permission system"""
    
    def test_basic_user_directory_permissions(self):
        """Test basic user permissions for directory operations"""
        # Login as basic user
        refresh = RefreshToken.for_user(self.basic_user)
        access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Should be able to read
        url = reverse('phonebook-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should be able to create
        data = {
            'name': 'Test Contact',
            'contact': '7770000',
            'address': 'Test Address',
            'atoll': 'Male',
            'island': 'Male City'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Should be able to delete (basic users have delete permission)
        contact = PhoneBookEntry.objects.get(name='Test Contact')
        url = reverse('phonebook-detail', args=[contact.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    
    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        # No authentication
        self.client.credentials()
        
        url = reverse('phonebook-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        url = reverse('analytics')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

@pytest.mark.django_db
class FilterTestCase(BaseTestCase):
    """Test filtering and search functionality"""
    
    def setUp(self):
        super().setUp()
        # Get authentication token for basic user
        refresh = RefreshToken.for_user(self.basic_user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
    
    def test_search_filter(self):
        """Test search functionality"""
        url = reverse('phonebook-list')
        response = self.client.get(url, {'search': 'John'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'John Doe')
    
    def test_location_filter(self):
        """Test location-based filtering"""
        url = reverse('phonebook-list')
        response = self.client.get(url, {'atoll': 'Male'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['atoll'], 'Male')
    
    def test_ordering(self):
        """Test ordering functionality"""
        url = reverse('phonebook-list')
        response = self.client.get(url, {'ordering': 'name'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'][0]['name'], 'Jane Smith')
        self.assertEqual(response.data['results'][1]['name'], 'John Doe')

if __name__ == '__main__':
    # Run tests
    import django
    django.setup()
    
    # Run specific test cases
    test_cases = [
        AuthenticationTestCase,
        PhoneBookEntryTestCase,
        UserManagementTestCase,
        FamilyManagementTestCase,
        ModerationTestCase,
        AnalyticsTestCase,
        HealthCheckTestCase,
        PermissionTestCase,
        FilterTestCase
    ]
    
    for test_case in test_cases:
        print(f"\nRunning {test_case.__name__}...")
        import unittest
        suite = unittest.TestLoader().loadTestsFromTestCase(test_case)
        runner = unittest.TextTestRunner(verbosity=2)
        runner.run(suite)
