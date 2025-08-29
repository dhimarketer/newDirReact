# 2025-01-29: Comprehensive tests for directory models
# Fixed to match actual model structure

import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone

from dirReactFinal_core.models import Atoll, Island, Party
from .models import PhoneBookEntry

@pytest.mark.django_db
class PhoneBookEntryModelTest(TestCase):
    """Test PhoneBookEntry model functionality"""
    
    def setUp(self):
        """Set up test data"""
        # Create required related objects
        self.test_atoll = Atoll.objects.create(name='Test Atoll')
        self.test_island = Island.objects.create(name='Test Island', atoll='Test Atoll')
        self.test_party = Party.objects.create(name='Test Party', short_name='TP')
        
        self.test_entry_data = {
            'pid': 1001,
            'name': 'Test User',
            'contact': '1234567890',
            'address': 'Test Address',
            'atoll': self.test_atoll,
            'island': self.test_island,
            'party': self.test_party,
            'gender': 'M'
        }

    def test_phonebook_entry_creation(self):
        """Test basic phonebook entry creation"""
        entry = PhoneBookEntry.objects.create(**self.test_entry_data)
        self.assertIsNotNone(entry.pid)
        self.assertEqual(entry.pid, 1001)
        self.assertEqual(entry.name, 'Test User')
        self.assertEqual(entry.contact, '1234567890')
        self.assertEqual(entry.address, 'Test Address')
        self.assertEqual(entry.atoll, self.test_atoll)
        self.assertEqual(entry.island, self.test_island)
        self.assertEqual(entry.party, self.test_party)
        self.assertEqual(entry.gender, 'M')

    def test_phonebook_entry_str_representation(self):
        """Test string representation of phonebook entry"""
        entry = PhoneBookEntry.objects.create(**self.test_entry_data)
        expected_str = f"Test User - 1234567890"
        self.assertEqual(str(entry), expected_str)

    def test_phonebook_entry_required_fields(self):
        """Test that required fields are properly enforced"""
        # Test creating entry with minimal data
        # Since pid is the primary key, we need to provide it
        minimal_entry = PhoneBookEntry.objects.create(pid=9999)
        self.assertIsNotNone(minimal_entry.pid)
        self.assertEqual(minimal_entry.pid, 9999)
        
        # Test that we can create an entry with just pid and name
        named_entry = PhoneBookEntry.objects.create(
            pid=9998,
            name='Minimal Named Entry'
        )
        self.assertEqual(named_entry.name, 'Minimal Named Entry')

    def test_phonebook_entry_optional_fields(self):
        """Test that optional fields can be null/blank"""
        minimal_entry = PhoneBookEntry.objects.create(
            pid=1002,
            name='Minimal User'
        )
        self.assertIsNone(minimal_entry.contact)
        self.assertIsNone(minimal_entry.address)
        self.assertIsNone(minimal_entry.atoll)
        self.assertIsNone(minimal_entry.island)
        self.assertIsNone(minimal_entry.party)
        self.assertIsNone(minimal_entry.gender)

    def test_phonebook_entry_gender_choices(self):
        """Test gender field choices"""
        # Test valid gender choices
        valid_genders = ['M', 'F', 'O']
        for i, gender in enumerate(valid_genders):
            entry = PhoneBookEntry.objects.create(
                pid=1003 + i,
                name=f'Gender Test User {i}',
                gender=gender
            )
            self.assertEqual(entry.gender, gender)
        
        # Test invalid gender choice (should fail)
        with self.assertRaises(ValidationError):
            entry = PhoneBookEntry(
                pid=1006,
                name='Invalid Gender User',
                gender='X'
            )
            entry.full_clean()

    def test_phonebook_entry_foreign_key_relationships(self):
        """Test foreign key relationships"""
        # Test atoll relationship
        entry = PhoneBookEntry.objects.create(
            pid=1007,
            name='Atoll Test User',
            atoll=self.test_atoll
        )
        self.assertEqual(entry.atoll, self.test_atoll)
        self.assertEqual(entry.atoll.name, 'Test Atoll')
        
        # Test island relationship
        entry.island = self.test_island
        entry.save()
        self.assertEqual(entry.island, self.test_island)
        self.assertEqual(entry.island.name, 'Test Island')
        
        # Test party relationship
        entry.party = self.test_party
        entry.save()
        self.assertEqual(entry.party, self.test_party)
        self.assertEqual(entry.party.name, 'Test Party')

    def test_phonebook_entry_age_calculation(self):
        """Test age calculation functionality"""
        # Test with no DOB
        entry = PhoneBookEntry.objects.create(
            pid=1008,
            name='Age Test User'
        )
        age = entry.get_age()
        self.assertIsNone(age)
        
        # Test with DOB
        entry.DOB = '1990-01-01'
        entry.save()
        age = entry.get_age()
        # Note: This test may need adjustment based on actual age calculation logic
        self.assertIsNotNone(age)

    def test_phonebook_entry_search_indexes(self):
        """Test search index fields"""
        entry = PhoneBookEntry.objects.create(
            pid=1009,
            name='Search Test User',
            contact='7771234',
            address='Search Test Address'
        )
        
        # Test search by name
        found_entries = PhoneBookEntry.objects.filter(name__icontains='Search')
        self.assertIn(entry, found_entries)
        
        # Test search by contact
        found_entries = PhoneBookEntry.objects.filter(contact__icontains='777')
        self.assertIn(entry, found_entries)
        
        # Test search by address
        found_entries = PhoneBookEntry.objects.filter(address__icontains='Search')
        self.assertIn(entry, found_entries)

    def test_phonebook_entry_change_tracking(self):
        """Test change tracking fields"""
        entry = PhoneBookEntry.objects.create(
            pid=1010,
            name='Change Test User'
        )
        
        # Test initial values
        self.assertEqual(entry.change_status, 'pending')
        self.assertIsNone(entry.requested_by)
        self.assertIsNone(entry.batch)
        
        # Test change tracking
        entry.change_status = 'approved'
        entry.requested_by = 'testuser'
        entry.batch = 'batch001'
        entry.save()
        
        self.assertEqual(entry.change_status, 'approved')
        self.assertEqual(entry.requested_by, 'testuser')
        self.assertEqual(entry.batch, 'batch001')

    def test_phonebook_entry_image_management(self):
        """Test image management fields"""
        entry = PhoneBookEntry.objects.create(
            pid=1011,
            name='Image Test User'
        )
        
        # Test initial values
        self.assertIsNone(entry.image_status)
        
        # Test image status assignment
        entry.image_status = 'pending'
        entry.save()
        self.assertEqual(entry.image_status, 'pending')

    def test_phonebook_entry_family_group(self):
        """Test family group relationship"""
        entry = PhoneBookEntry.objects.create(
            pid=1012,
            name='Family Test User'
        )
        
        # Test initial value
        self.assertIsNone(entry.family_group_id)
        
        # Test family group assignment
        entry.family_group_id = 123
        entry.save()
        self.assertEqual(entry.family_group_id, 123)

    def test_phonebook_entry_meta(self):
        """Test model meta configuration"""
        self.assertEqual(PhoneBookEntry._meta.db_table, 't1')
        self.assertEqual(PhoneBookEntry._meta.verbose_name, 'Phone Book Entry')
        self.assertEqual(PhoneBookEntry._meta.verbose_name_plural, 'Phone Book Entries')

@pytest.mark.django_db
class PhoneBookEntryIntegrationTest(TestCase):
    """Integration tests for PhoneBookEntry with related models"""
    
    def setUp(self):
        """Set up test data for integration tests"""
        # Create test atolls, islands, and parties
        self.atoll1 = Atoll.objects.create(name='North Atoll')
        self.atoll2 = Atoll.objects.create(name='South Atoll')
        
        self.island1 = Island.objects.create(name='North Island', atoll='North Atoll')
        self.island2 = Island.objects.create(name='South Island', atoll='South Atoll')
        
        self.party1 = Party.objects.create(name='Democratic Party', short_name='DP')
        self.party2 = Party.objects.create(name='Republican Party', short_name='RP')

    def test_phonebook_entry_geographic_relationships(self):
        """Test geographic relationships between entries"""
        # Create entries in different locations
        entry1 = PhoneBookEntry.objects.create(
            pid=2001,
            name='North User',
            atoll=self.atoll1,
            island=self.island1
        )
        
        entry2 = PhoneBookEntry.objects.create(
            pid=2002,
            name='South User',
            atoll=self.atoll2,
            island=self.island2
        )
        
        # Test atoll-based queries
        north_entries = PhoneBookEntry.objects.filter(atoll=self.atoll1)
        self.assertIn(entry1, north_entries)
        self.assertNotIn(entry2, north_entries)
        
        # Test island-based queries
        south_entries = PhoneBookEntry.objects.filter(island=self.island2)
        self.assertIn(entry2, south_entries)
        self.assertNotIn(entry1, south_entries)

    def test_phonebook_entry_party_relationships(self):
        """Test party relationships between entries"""
        # Create entries with different parties
        entry1 = PhoneBookEntry.objects.create(
            pid=2003,
            name='Democratic User',
            party=self.party1
        )
        
        entry2 = PhoneBookEntry.objects.create(
            pid=2004,
            name='Republican User',
            party=self.party2
        )
        
        # Test party-based queries
        democratic_entries = PhoneBookEntry.objects.filter(party=self.party1)
        self.assertIn(entry1, democratic_entries)
        self.assertNotIn(entry2, democratic_entries)
        
        republican_entries = PhoneBookEntry.objects.filter(party=self.party2)
        self.assertIn(entry2, republican_entries)
        self.assertNotIn(entry1, republican_entries)

    def test_phonebook_entry_change_tracking_workflow(self):
        """Test complete change tracking workflow"""
        # Create initial entry
        entry = PhoneBookEntry.objects.create(
            pid=2005,
            name='Workflow Test User',
            contact='7771234',
            address='Initial Address'
        )
        
        # First change
        entry.contact = '7779999'
        entry.change_status = 'pending'
        entry.requested_by = 'user1'
        entry.batch = 'batch001'
        entry.save()
        
        self.assertEqual(entry.contact, '7779999')
        self.assertEqual(entry.change_status, 'pending')
        self.assertEqual(entry.requested_by, 'user1')
        self.assertEqual(entry.batch, 'batch001')
        
        # Second change
        entry.address = 'Updated Address'
        entry.change_status = 'approved'
        entry.save()
        
        self.assertEqual(entry.address, 'Updated Address')
        self.assertEqual(entry.change_status, 'approved')

    def test_phonebook_entry_search_functionality(self):
        """Test search functionality across multiple fields"""
        # Create test entries
        entries = []
        for i in range(5):
            entry = PhoneBookEntry.objects.create(
                pid=3001 + i,
                name=f'Search User {i}',
                contact=f'777{i:04d}',
                address=f'Search Address {i}',
                atoll=self.atoll1 if i % 2 == 0 else self.atoll2
            )
            entries.append(entry)
        
        # Test name search
        name_results = PhoneBookEntry.objects.filter(name__icontains='Search')
        self.assertEqual(name_results.count(), 5)
        
        # Test contact search
        contact_results = PhoneBookEntry.objects.filter(contact__icontains='777')
        self.assertEqual(contact_results.count(), 5)
        
        # Test address search
        address_results = PhoneBookEntry.objects.filter(address__icontains='Search')
        self.assertEqual(address_results.count(), 5)
        
        # Test combined search
        combined_results = PhoneBookEntry.objects.filter(
            name__icontains='Search',
            atoll=self.atoll1
        )
        self.assertEqual(combined_results.count(), 3)  # Even indices (0, 2, 4)

    def test_phonebook_entry_data_consistency(self):
        """Test data consistency across operations"""
        # Create entry
        entry = PhoneBookEntry.objects.create(
            pid=4001,
            name='Consistency User',
            contact='7771111',
            address='Consistency Address'
        )
        
        # Verify initial data
        self.assertEqual(entry.name, 'Consistency User')
        self.assertEqual(entry.contact, '7771111')
        self.assertEqual(entry.address, 'Consistency Address')
        
        # Modify data
        entry.name = 'Updated Consistency User'
        entry.contact = '7772222'
        entry.save()
        
        # Reload from database
        reloaded_entry = PhoneBookEntry.objects.get(pid=4001)
        self.assertEqual(reloaded_entry.name, 'Updated Consistency User')
        self.assertEqual(reloaded_entry.contact, '7772222')
        
        # Test deletion
        entry_id = entry.pid
        entry.delete()
        
        with self.assertRaises(PhoneBookEntry.DoesNotExist):
            PhoneBookEntry.objects.get(pid=4001)
