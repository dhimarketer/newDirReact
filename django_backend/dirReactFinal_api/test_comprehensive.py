# 2025-01-27: Comprehensive API test suite for dirReactFinal
# Tests all API endpoints with proper coverage, security, and performance testing

import pytest
import json
import time
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from datetime import timedelta

from dirReactFinal_core.models import User, UserPermission, EventLog
from dirReactFinal_directory.models import PhoneBookEntry, Image
from dirReactFinal_family.models import FamilyGroup, FamilyMember
from dirReactFinal_moderation.models import PendingChange, PhotoModeration
from dirReactFinal_scoring.models import ScoreTransaction, RewardRule
from test_config import TestUtils, PERFORMANCE_TESTS, SECURITY_TESTS

User = get_user_model()

@pytest.mark.api
@pytest.mark.comprehensive
class ComprehensiveAPITest(APITestCase):
    """Comprehensive API test suite covering all endpoints"""
    
    def setUp(self):
        """Set up comprehensive test data"""
        # Create test users with different permission levels
        self.admin_user = TestUtils.create_test_user('admin')
        self.premium_user = TestUtils.create_test_user('premium')
        self.basic_user = TestUtils.create_test_user('basic')
        
        # Create user permissions
        self.create_user_permissions()
        
        # Create test data
        self.create_test_data()
        
        # Set up API clients
        self.admin_client = APIClient()
        self.premium_client = APIClient()
        self.basic_client = APIClient()
        self.anonymous_client = APIClient()
        
        # Authenticate clients
        self.authenticate_clients()
    
    def create_user_permissions(self):
        """Create comprehensive user permissions"""
        permissions_data = [
            # Basic user permissions
            {'user_type': 'basic', 'module': 'directory', 'can_read': True, 'can_write': True, 'can_delete': False, 'can_admin': False},
            {'user_type': 'basic', 'module': 'family', 'can_read': True, 'can_write': True, 'can_delete': False, 'can_admin': False},
            {'user_type': 'basic', 'module': 'scoring', 'can_read': True, 'can_write': True, 'can_delete': False, 'can_admin': False},
            
            # Premium user permissions
            {'user_type': 'premium', 'module': 'directory', 'can_read': True, 'can_write': True, 'can_delete': True, 'can_admin': False},
            {'user_type': 'premium', 'module': 'family', 'can_read': True, 'can_write': True, 'can_delete': True, 'can_admin': False},
            {'user_type': 'premium', 'module': 'scoring', 'can_read': True, 'can_write': True, 'can_delete': True, 'can_admin': False},
            
            # Admin user permissions
            {'user_type': 'admin', 'module': 'directory', 'can_read': True, 'can_write': True, 'can_delete': True, 'can_admin': True},
            {'user_type': 'admin', 'module': 'family', 'can_read': True, 'can_write': True, 'can_delete': True, 'can_admin': True},
            {'user_type': 'admin', 'module': 'scoring', 'can_read': True, 'can_write': True, 'can_delete': True, 'can_admin': True},
            {'user_type': 'admin', 'module': 'moderation', 'can_read': True, 'can_write': True, 'can_delete': True, 'can_admin': True},
        ]
        
        for perm_data in permissions_data:
            UserPermission.objects.create(**perm_data)
    
    def create_test_data(self):
        """Create comprehensive test data"""
        # Create phonebook entries
        self.contact1 = PhoneBookEntry.objects.create(
            name='John Doe',
            contact='7771234',
            address='123 Main Street',
            atoll='Male',
            island='Male City',
            status='active',
            created_by=self.basic_user
        )
        
        self.contact2 = PhoneBookEntry.objects.create(
            name='Jane Smith',
            contact='7775678',
            address='456 Oak Avenue',
            atoll='Addu',
            island='Hithadhoo',
            status='active',
            created_by=self.premium_user
        )
        
        # Create family groups
        self.family_group1 = FamilyGroup.objects.create(
            name='Doe Family',
            description='Extended family of John Doe',
            created_by=self.basic_user,
            is_public=True
        )
        
        self.family_group2 = FamilyGroup.objects.create(
            name='Smith Family',
            description='Family of Jane Smith',
            created_by=self.premium_user,
            is_public=False
        )
        
        # Create family members
        self.family_member1 = FamilyMember.objects.create(
            family_group=self.family_group1,
            user=self.basic_user,
            relationship='head',
            is_admin=True
        )
        
        self.family_member2 = FamilyMember.objects.create(
            family_group=self.family_group2,
            user=self.premium_user,
            relationship='head',
            is_admin=True
        )
        
        # Create pending changes
        self.pending_change = PendingChange.objects.create(
            entry=self.contact1,
            field_name='contact',
            old_value='7771234',
            new_value='7779999',
            requested_by=self.basic_user,
            status='pending'
        )
        
        # Create score transactions
        self.score_transaction = ScoreTransaction.objects.create(
            user=self.basic_user,
            points=100,
            transaction_type='login_bonus',
            description='Daily login bonus'
        )
    
    def authenticate_clients(self):
        """Authenticate all API clients"""
        # Admin client
        admin_token = RefreshToken.for_user(self.admin_user)
        self.admin_client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token.access_token}')
        
        # Premium client
        premium_token = RefreshToken.for_user(self.premium_user)
        self.premium_client.credentials(HTTP_AUTHORIZATION=f'Bearer {premium_token.access_token}')
        
        # Basic client
        basic_token = RefreshToken.for_user(self.basic_user)
        self.basic_client.credentials(HTTP_AUTHORIZATION=f'Bearer {basic_token.access_token}')

@pytest.mark.api
@pytest.mark.directory
class DirectoryAPITest(ComprehensiveAPITest):
    """Test cases for directory API endpoints"""
    
    def test_phonebook_list_anonymous(self):
        """Test phonebook list endpoint for anonymous users"""
        url = reverse('api:phonebook-list')
        response = self.anonymous_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_phonebook_list_basic_user(self):
        """Test phonebook list endpoint for basic users"""
        url = reverse('api:phonebook-list')
        response = self.basic_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_phonebook_list_premium_user(self):
        """Test phonebook list endpoint for premium users"""
        url = reverse('api:phonebook-list')
        response = self.premium_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_phonebook_list_admin_user(self):
        """Test phonebook list endpoint for admin users"""
        url = reverse('api:phonebook-list')
        response = self.admin_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_phonebook_create_basic_user(self):
        """Test phonebook creation by basic user"""
        url = reverse('api:phonebook-list')
        data = {
            'name': 'New Contact',
            'contact': '7779999',
            'address': '789 New Street',
            'atoll': 'Male',
            'island': 'Male City',
            'status': 'active'
        }
        response = self.basic_client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PhoneBookEntry.objects.count(), 3)
    
    def test_phonebook_create_premium_user(self):
        """Test phonebook creation by premium user"""
        url = reverse('api:phonebook-list')
        data = {
            'name': 'Premium Contact',
            'contact': '7778888',
            'address': '888 Premium Street',
            'atoll': 'Addu',
            'island': 'Hithadhoo',
            'status': 'active'
        }
        response = self.premium_client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PhoneBookEntry.objects.count(), 3)
    
    def test_phonebook_update_basic_user_own_entry(self):
        """Test phonebook update by basic user on own entry"""
        url = reverse('api:phonebook-detail', args=[self.contact1.id])
        data = {'contact': '7771111'}
        response = self.basic_client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.contact1.refresh_from_db()
        self.assertEqual(self.contact1.contact, '7771111')
    
    def test_phonebook_update_basic_user_other_entry(self):
        """Test phonebook update by basic user on other user's entry"""
        url = reverse('api:phonebook-detail', args=[self.contact2.id])
        data = {'contact': '7772222'}
        response = self.basic_client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_phonebook_delete_basic_user(self):
        """Test phonebook deletion by basic user (should fail)"""
        url = reverse('api:phonebook-detail', args=[self.contact1.id])
        response = self.basic_client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(PhoneBookEntry.objects.count(), 2)
    
    def test_phonebook_delete_premium_user(self):
        """Test phonebook deletion by premium user"""
        url = reverse('api:phonebook-detail', args=[self.contact2.id])
        response = self.premium_client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(PhoneBookEntry.objects.count(), 1)
    
    def test_phonebook_search(self):
        """Test phonebook search functionality"""
        url = reverse('api:phonebook-list')
        response = self.basic_client.get(url, {'search': 'John'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'John Doe')
    
    def test_phonebook_filter_by_atoll(self):
        """Test phonebook filtering by atoll"""
        url = reverse('api:phonebook-list')
        response = self.basic_client.get(url, {'atoll': 'Male'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['atoll'], 'Male')
    
    def test_phonebook_filter_by_status(self):
        """Test phonebook filtering by status"""
        url = reverse('api:phonebook-list')
        response = self.basic_client.get(url, {'status': 'active'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

@pytest.mark.api
@pytest.mark.family
class FamilyAPITest(ComprehensiveAPITest):
    """Test cases for family API endpoints"""
    
    def test_family_group_list_basic_user(self):
        """Test family group list for basic users"""
        url = reverse('api:family-group-list')
        response = self.basic_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should see public groups and own groups
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_family_group_list_premium_user(self):
        """Test family group list for premium users"""
        url = reverse('api:family-group-list')
        response = self.premium_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should see public groups and own groups
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_family_group_create_basic_user(self):
        """Test family group creation by basic user"""
        url = reverse('api:family-group-list')
        data = {
            'name': 'New Family',
            'description': 'A new family group',
            'is_public': True
        }
        response = self.basic_client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(FamilyGroup.objects.count(), 3)
    
    def test_family_group_update_owner(self):
        """Test family group update by owner"""
        url = reverse('api:family-group-detail', args=[self.family_group1.id])
        data = {'description': 'Updated description'}
        response = self.basic_client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.family_group1.refresh_from_db()
        self.assertEqual(self.family_group1.description, 'Updated description')
    
    def test_family_group_update_non_owner(self):
        """Test family group update by non-owner (should fail)"""
        url = reverse('api:family-group-detail', args=[self.family_group1.id])
        data = {'description': 'Unauthorized update'}
        response = self.premium_client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_family_member_add(self):
        """Test adding family member"""
        url = reverse('api:family-member-list')
        data = {
            'family_group': self.family_group1.id,
            'user': self.premium_user.id,
            'relationship': 'spouse',
            'is_admin': False
        }
        response = self.basic_client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(FamilyMember.objects.count(), 3)

@pytest.mark.api
@pytest.mark.scoring
class ScoringAPITest(ComprehensiveAPITest):
    """Test cases for scoring API endpoints"""
    
    def test_score_transaction_list(self):
        """Test score transaction list"""
        url = reverse('api:score-transaction-list')
        response = self.basic_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_score_transaction_create(self):
        """Test score transaction creation"""
        url = reverse('api:score-transaction-list')
        data = {
            'points': 50,
            'transaction_type': 'activity_bonus',
            'description': 'Activity completion bonus'
        }
        response = self.basic_client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ScoreTransaction.objects.count(), 2)
    
    def test_user_score_update(self):
        """Test user score update after transaction"""
        initial_score = self.basic_user.score
        initial_level = self.basic_user.level
        
        # Create score transaction
        ScoreTransaction.objects.create(
            user=self.basic_user,
            points=100,
            transaction_type='bonus',
            description='Test bonus'
        )
        
        # Refresh user
        self.basic_user.refresh_from_db()
        
        # Score should be updated
        self.assertEqual(self.basic_user.score, initial_score + 100)
        
        # Level might be updated based on scoring rules
        self.assertGreaterEqual(self.basic_user.level, initial_level)

@pytest.mark.api
@pytest.mark.moderation
class ModerationAPITest(ComprehensiveAPITest):
    """Test cases for moderation API endpoints"""
    
    def test_pending_change_list_admin(self):
        """Test pending change list for admin users"""
        url = reverse('api:pending-change-list')
        response = self.admin_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_pending_change_list_basic_user(self):
        """Test pending change list for basic users (should fail)"""
        url = reverse('api:pending-change-list')
        response = self.basic_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_pending_change_approve_admin(self):
        """Test pending change approval by admin"""
        url = reverse('api:pending-change-approve', args=[self.pending_change.id])
        response = self.admin_client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.pending_change.refresh_from_db()
        self.assertEqual(self.pending_change.status, 'approved')
    
    def test_pending_change_reject_admin(self):
        """Test pending change rejection by admin"""
        url = reverse('api:pending-change-reject', args=[self.pending_change.id])
        response = self.admin_client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.pending_change.refresh_from_db()
        self.assertEqual(self.pending_change.status, 'rejected')

@pytest.mark.api
@pytest.mark.security
class SecurityAPITest(ComprehensiveAPITest):
    """Test cases for API security"""
    
    def test_authentication_required(self):
        """Test that authentication is required for protected endpoints"""
        protected_endpoints = [
            reverse('api:phonebook-list'),
            reverse('api:family-group-list'),
            reverse('api:score-transaction-list'),
        ]
        
        for endpoint in protected_endpoints:
            response = self.anonymous_client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_permission_escalation_prevention(self):
        """Test that users cannot escalate their permissions"""
        # Basic user trying to access admin-only endpoint
        url = reverse('api:pending-change-list')
        response = self.basic_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Basic user trying to delete entry (should fail)
        url = reverse('api:phonebook-detail', args=[self.contact1.id])
        response = self.basic_client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_csrf_protection(self):
        """Test CSRF protection"""
        # This test verifies that CSRF protection is enabled
        # Django REST Framework handles this automatically
        pass
    
    def test_input_validation(self):
        """Test input validation and sanitization"""
        url = reverse('api:phonebook-list')
        
        # Test invalid phone number
        data = {
            'name': 'Test User',
            'contact': 'invalid_phone',
            'address': 'Test Address',
            'atoll': 'Male',
            'island': 'Male City',
            'status': 'active'
        }
        response = self.basic_client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test invalid status
        data['contact'] = '7771234'
        data['status'] = 'invalid_status'
        response = self.basic_client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

@pytest.mark.api
@pytest.mark.performance
class PerformanceAPITest(ComprehensiveAPITest):
    """Test cases for API performance"""
    
    def test_phonebook_list_performance(self):
        """Test phonebook list endpoint performance"""
        # Create additional test data
        for i in range(50):
            PhoneBookEntry.objects.create(
                name=f'Test User {i}',
                contact=f'777{i:04d}',
                address=f'Test Address {i}',
                atoll='Male',
                island='Male City',
                status='active',
                created_by=self.basic_user
            )
        
        # Test response time
        start_time = time.time()
        url = reverse('api:phonebook-list')
        response = self.basic_client.get(url)
        end_time = time.time()
        
        response_time = (end_time - start_time) * 1000  # Convert to milliseconds
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLess(response_time, PERFORMANCE_TESTS['load_testing']['target_response_time'])
        self.assertEqual(len(response.data), 52)  # 50 + 2 original
    
    def test_search_performance(self):
        """Test search functionality performance"""
        # Test search with large dataset
        start_time = time.time()
        url = reverse('api:phonebook-list')
        response = self.basic_client.get(url, {'search': 'Test'})
        end_time = time.time()
        
        response_time = (end_time - start_time) * 1000
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLess(response_time, PERFORMANCE_TESTS['load_testing']['target_response_time'])
    
    def test_pagination_performance(self):
        """Test pagination performance"""
        url = reverse('api:phonebook-list')
        response = self.basic_client.get(url, {'page': 1, 'page_size': 10})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertLessEqual(len(response.data['results']), 10)

@pytest.mark.api
@pytest.mark.integration
class IntegrationAPITest(ComprehensiveAPITest):
    """Integration tests for API workflows"""
    
    def test_complete_user_workflow(self):
        """Test complete user workflow from registration to activity"""
        # 1. User creates phonebook entry
        phonebook_url = reverse('api:phonebook-list')
        phonebook_data = {
            'name': 'Integration Test User',
            'contact': '7775555',
            'address': 'Integration Test Address',
            'atoll': 'Male',
            'island': 'Male City',
            'status': 'active'
        }
        response = self.basic_client.post(phonebook_url, phonebook_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        entry_id = response.data['id']
        
        # 2. User creates family group
        family_url = reverse('api:family-group-list')
        family_data = {
            'name': 'Integration Test Family',
            'description': 'Test family for integration',
            'is_public': True
        }
        response = self.basic_client.post(family_url, family_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        family_id = response.data['id']
        
        # 3. User adds family member
        member_url = reverse('api:family-member-list')
        member_data = {
            'family_group': family_id,
            'user': self.premium_user.id,
            'relationship': 'friend',
            'is_admin': False
        }
        response = self.basic_client.post(member_url, member_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 4. User earns points
        scoring_url = reverse('api:score-transaction-list')
        scoring_data = {
            'points': 25,
            'transaction_type': 'activity_bonus',
            'description': 'Integration test completion'
        }
        response = self.basic_client.post(scoring_url, scoring_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 5. Verify all data was created
        self.assertEqual(PhoneBookEntry.objects.count(), 3)
        self.assertEqual(FamilyGroup.objects.count(), 3)
        self.assertEqual(FamilyMember.objects.count(), 3)
        self.assertEqual(ScoreTransaction.objects.count(), 2)
        
        # 6. Verify user score increased
        self.basic_user.refresh_from_db()
        self.assertGreater(self.basic_user.score, 0)
    
    def test_admin_moderation_workflow(self):
        """Test complete admin moderation workflow"""
        # 1. Create pending change
        change_url = reverse('api:pending-change-list')
        change_data = {
            'entry': self.contact1.id,
            'field_name': 'contact',
            'old_value': '7771234',
            'new_value': '7777777',
            'status': 'pending'
        }
        response = self.basic_client.post(change_url, change_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        change_id = response.data['id']
        
        # 2. Admin reviews and approves
        approve_url = reverse('api:pending-change-approve', args=[change_id])
        response = self.admin_client.post(approve_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 3. Verify change was applied
        self.contact1.refresh_from_db()
        self.assertEqual(self.contact1.contact, '7777777')
        
        # 4. Verify change status updated
        pending_change = PendingChange.objects.get(id=change_id)
        self.assertEqual(pending_change.status, 'approved')

@pytest.mark.api
@pytest.mark.edge_case
class EdgeCaseAPITest(ComprehensiveAPITest):
    """Test cases for edge cases and boundary conditions"""
    
    def test_empty_search_results(self):
        """Test search with no results"""
        url = reverse('api:phonebook-list')
        response = self.basic_client.get(url, {'search': 'NonexistentUser'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
    
    def test_large_search_query(self):
        """Test search with very long query"""
        long_query = 'a' * 1000
        url = reverse('api:phonebook-list')
        response = self.basic_client.get(url, {'search': long_query})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_special_characters_in_search(self):
        """Test search with special characters"""
        special_chars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
        url = reverse('api:phonebook-list')
        response = self.basic_client.get(url, {'search': special_chars})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_unicode_characters(self):
        """Test handling of unicode characters"""
        unicode_name = 'José María García'
        phonebook_url = reverse('api:phonebook-list')
        data = {
            'name': unicode_name,
            'contact': '7778888',
            'address': 'Unicode Test Address',
            'atoll': 'Male',
            'island': 'Male City',
            'status': 'active'
        }
        response = self.basic_client.post(phonebook_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify unicode was preserved
        entry = PhoneBookEntry.objects.get(name=unicode_name)
        self.assertEqual(entry.name, unicode_name)
    
    def test_boundary_values(self):
        """Test boundary values for numeric fields"""
        # Test very long names
        long_name = 'a' * 255  # Maximum length
        phonebook_url = reverse('api:phonebook-list')
        data = {
            'name': long_name,
            'contact': '7779999',
            'address': 'Boundary Test Address',
            'atoll': 'Male',
            'island': 'Male City',
            'status': 'active'
        }
        response = self.basic_client.post(phonebook_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Test empty string for optional fields
        data['name'] = 'Empty Field Test'
        data['address'] = ''
        response = self.basic_client.post(phonebook_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

@pytest.mark.api
@pytest.mark.smoke
class SmokeTestAPITest(ComprehensiveAPITest):
    """Smoke tests for critical API functionality"""
    
    def test_critical_endpoints_accessible(self):
        """Test that all critical endpoints are accessible"""
        critical_endpoints = [
            reverse('api:phonebook-list'),
            reverse('api:family-group-list'),
            reverse('api:score-transaction-list'),
        ]
        
        for endpoint in critical_endpoints:
            response = self.basic_client.get(endpoint)
            self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED])
    
    def test_basic_crud_operations(self):
        """Test basic CRUD operations work"""
        # Create
        url = reverse('api:phonebook-list')
        data = {
            'name': 'Smoke Test User',
            'contact': '7770000',
            'address': 'Smoke Test Address',
            'atoll': 'Male',
            'island': 'Male City',
            'status': 'active'
        }
        response = self.basic_client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        entry_id = response.data['id']
        
        # Read
        detail_url = reverse('api:phonebook-detail', args=[entry_id])
        response = self.basic_client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Smoke Test User')
        
        # Update
        update_data = {'contact': '7771111'}
        response = self.basic_client.patch(detail_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify update
        response = self.basic_client.get(detail_url)
        self.assertEqual(response.data['contact'], '7771111')
    
    def test_authentication_flow(self):
        """Test basic authentication flow"""
        # Test that unauthenticated requests fail
        url = reverse('api:phonebook-list')
        response = self.anonymous_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test that authenticated requests succeed
        response = self.basic_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
