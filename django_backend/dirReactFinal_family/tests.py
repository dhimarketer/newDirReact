# 2025-01-28: Tests for family functionality including delete_updated_families

import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import FamilyGroup, FamilyMember, FamilyRelationship, FamilyMedia, FamilyEvent
from dirReactFinal_directory.models import PhoneBookEntry
from dirReactFinal_core.models import Island

User = get_user_model()

@pytest.mark.django_db
class DeleteUpdatedFamiliesTestCase(APITestCase):
    """
    Test cases for the delete_updated_families functionality
    """
    
    def setUp(self):
        """Set up test data"""
        # Create test users
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            is_staff=True,
            is_superuser=True
        )
        
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@test.com',
            password='testpass123',
            is_staff=False,
            is_superuser=False
        )
        
        # Create test island first
        self.male_island = Island.objects.create(name='Male', atoll='Male')
        
        # Create test phonebook entries
        self.entry1 = PhoneBookEntry.objects.create(
            pid=1001,
            name='John Doe',
            contact='1234567890',
            address='123 Main St',
            island=self.male_island
        )
        
        self.entry2 = PhoneBookEntry.objects.create(
            pid=1002,
            name='Jane Doe',
            contact='0987654321',
            address='123 Main St',
            island=self.male_island
        )
        
        self.entry3 = PhoneBookEntry.objects.create(
            pid=1003,
            name='Baby Doe',
            contact='5555555555',
            address='123 Main St',
            island=self.male_island
        )
        
        # Create test family group
        self.family_group = FamilyGroup.objects.create(
            name='Doe Family',
            description='Test family at 123 Main St',
            address='123 Main St',
            island='Male',
            created_by=self.regular_user
        )
        
        # Create family members
        self.member1 = FamilyMember.objects.create(
            entry=self.entry1,
            family_group=self.family_group,
            role_in_family='parent'
        )
        
        self.member2 = FamilyMember.objects.create(
            entry=self.entry2,
            family_group=self.family_group,
            role_in_family='parent'
        )
        
        self.member3 = FamilyMember.objects.create(
            entry=self.entry3,
            family_group=self.family_group,
            role_in_family='child'
        )
        
        # Create family relationships
        self.relationship1 = FamilyRelationship.objects.create(
            person1=self.entry1,
            person2=self.entry3,
            relationship_type='parent',
            family_group=self.family_group
        )
        
        self.relationship2 = FamilyRelationship.objects.create(
            person1=self.entry2,
            person2=self.entry3,
            relationship_type='parent',
            family_group=self.family_group
        )
        
        # Set up API client
        self.client = APIClient()
    
    def test_delete_updated_families_by_id_admin_success(self):
        """Test successful deletion of family by ID by admin user"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Verify family exists before deletion
        self.assertTrue(FamilyGroup.objects.filter(id=self.family_group.id).exists())
        self.assertEqual(FamilyMember.objects.filter(family_group=self.family_group).count(), 3)
        self.assertEqual(FamilyRelationship.objects.filter(family_group=self.family_group).count(), 2)
        
        # Delete family
        url = reverse('family:family-delete-updated')
        data = {'family_group_id': self.family_group.id}
        response = self.client.post(url, data, format='json')
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertIn('success', response.data)
        
        # Verify family is deleted
        self.assertFalse(FamilyGroup.objects.filter(id=self.family_group.id).exists())
        self.assertEqual(FamilyMember.objects.filter(family_group=self.family_group).count(), 0)
        self.assertEqual(FamilyRelationship.objects.filter(family_group=self.family_group).count(), 0)
        
        # Verify phonebook entries are preserved
        self.assertTrue(PhoneBookEntry.objects.filter(pid=1001).exists())
        self.assertTrue(PhoneBookEntry.objects.filter(pid=1002).exists())
        self.assertTrue(PhoneBookEntry.objects.filter(pid=1003).exists())
    
    def test_delete_updated_families_by_address_admin_success(self):
        """Test successful deletion of family by address by admin user"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Delete family by address
        url = reverse('family:family-delete-updated')
        data = {
            'address': '123 Main St',
            'island': 'Male'
        }
        response = self.client.post(url, data, format='json')
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify family is deleted
        self.assertFalse(FamilyGroup.objects.filter(address='123 Main St', island='Male').exists())
        
        # Verify phonebook entries are preserved
        self.assertTrue(PhoneBookEntry.objects.filter(pid=1001).exists())
        self.assertTrue(PhoneBookEntry.objects.filter(pid=1002).exists())
        self.assertTrue(PhoneBookEntry.objects.filter(pid=1003).exists())
    
    def test_delete_updated_families_regular_user_forbidden(self):
        """Test that regular users cannot delete families"""
        self.client.force_authenticate(user=self.regular_user)
        
        url = reverse('family:family-delete-updated')
        data = {'family_group_id': self.family_group.id}
        response = self.client.post(url, data, format='json')
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('error', response.data)
        
        # Verify family still exists
        self.assertTrue(FamilyGroup.objects.filter(id=self.family_group.id).exists())
    
    def test_delete_updated_families_unauthenticated_forbidden(self):
        """Test that unauthenticated users cannot delete families"""
        url = reverse('family:family-delete-updated')
        data = {'family_group_id': self.family_group.id}
        response = self.client.post(url, data, format='json')
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Verify family still exists
        self.assertTrue(FamilyGroup.objects.filter(id=self.family_group.id).exists())
    
    def test_delete_updated_families_missing_parameters(self):
        """Test deletion with missing required parameters"""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('family:family-delete-updated')
        
        # Test with no parameters
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test with only address
        response = self.client.post(url, {'address': '123 Main St'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test with only island
        response = self.client.post(url, {'island': 'Male'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_delete_updated_families_nonexistent_family(self):
        """Test deletion of non-existent family"""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('family:family-delete-updated')
        data = {'family_group_id': 99999}
        response = self.client.post(url, data, format='json')
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_delete_updated_families_nonexistent_address(self):
        """Test deletion of family by non-existent address"""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('family:family-delete-updated')
        data = {
            'address': 'Nonexistent Address',
            'island': 'Nonexistent Island'
        }
        response = self.client.post(url, data, format='json')
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_delete_updated_families_preserves_phonebook_entries(self):
        """Test that phonebook entries are completely preserved after family deletion"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Store original entry data
        original_entry1 = PhoneBookEntry.objects.get(pid=1001)
        original_entry2 = PhoneBookEntry.objects.get(pid=1002)
        original_entry3 = PhoneBookEntry.objects.get(pid=1003)
        
        # Delete family
        url = reverse('family:family-delete-updated')
        data = {'family_group_id': self.family_group.id}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify entries still exist with all original data
        entry1_after = PhoneBookEntry.objects.get(pid=1001)
        entry2_after = PhoneBookEntry.objects.get(pid=1002)
        entry3_after = PhoneBookEntry.objects.get(pid=1003)
        
        self.assertEqual(entry1_after.name, original_entry1.name)
        self.assertEqual(entry1_after.contact, original_entry1.contact)
        self.assertEqual(entry1_after.address, original_entry1.address)
        self.assertEqual(entry1_after.island, original_entry1.island)
        
        self.assertEqual(entry2_after.name, original_entry2.name)
        self.assertEqual(entry2_after.contact, original_entry2.contact)
        self.assertEqual(entry2_after.address, original_entry2.address)
        self.assertEqual(entry2_after.island, original_entry2.island)
        
        self.assertEqual(entry3_after.name, original_entry3.name)
        self.assertEqual(entry3_after.contact, original_entry3.contact)
        self.assertEqual(entry3_after.address, original_entry3.address)
        self.assertEqual(entry3_after.island, original_entry3.island)
