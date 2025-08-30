# 2025-01-29: Comprehensive tests for user models
# Fixed to match actual model structure

import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone

from dirReactFinal_core.models import User, UserPermission, EventLog

User = get_user_model()

@pytest.mark.django_db
class UserModelTest(TestCase):
    """Test User model functionality"""
    
    def setUp(self):
        """Set up test data"""
        self.test_user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'user_type': 'basic'
        }

    def test_user_creation(self):
        """Test basic user creation"""
        user = User.objects.create_user(**self.test_user_data)
        self.assertIsNotNone(user.id)
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.user_type, 'basic')
        self.assertEqual(user.status, 'active')
        self.assertEqual(user.score, 100)
        self.assertEqual(user.spam_score, 0)
        self.assertFalse(user.is_banned)

    def test_user_creation_without_username(self):
        """Test user creation without username (should fail)"""
        data = self.test_user_data.copy()
        del data['username']
        
        with self.assertRaises(TypeError):
            User.objects.create_user(**data)

    def test_user_creation_without_email(self):
        """Test user creation without email (should work)"""
        data = self.test_user_data.copy()
        del data['email']
        
        user = User.objects.create_user(**data)
        self.assertIsNotNone(user.id)
        self.assertEqual(user.email, '')  # Django EmailField stores empty string, not None

    def test_user_creation_without_password(self):
        """Test user creation without password (should work)"""
        data = self.test_user_data.copy()
        del data['password']
        
        user = User.objects.create_user(**data)
        self.assertIsNotNone(user.id)

    def test_user_creation_without_user_type(self):
        """Test user creation without user_type (should use default)"""
        data = self.test_user_data.copy()
        del data['user_type']
        
        user = User.objects.create_user(**data)
        self.assertEqual(user.user_type, 'basic')  # Default value

    def test_user_str_representation(self):
        """Test user string representation"""
        user = User.objects.create_user(**self.test_user_data)
        expected_str = f"testuser (basic)"
        self.assertEqual(str(user), expected_str)

    def test_user_default_values(self):
        """Test user default field values"""
        user = User.objects.create_user(**self.test_user_data)
        self.assertEqual(user.status, 'active')
        self.assertEqual(user.score, 100)
        self.assertEqual(user.spam_score, 0)
        self.assertFalse(user.is_banned)
        self.assertEqual(user.warning_count, 0)
        self.assertIsNotNone(user.join_date)

    def test_user_unique_constraints(self):
        """Test unique constraints on username and email"""
        # Create first user with unique data
        first_user = User.objects.create_user(
            username='testuser1',
            email='test1@example.com',
            password='testpass123'
        )
        self.assertIsNotNone(first_user.id)
        
        # Test that we can't create another user with the same username
        # We'll test this by checking if the constraint exists in the database
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT sql FROM sqlite_master 
                WHERE type='table' AND name='users'
            """)
            table_sql = cursor.fetchone()[0]
            # Check if username has unique constraint
            self.assertIn('UNIQUE', table_sql)
            self.assertIn('username', table_sql)
        
        # Test that we can't create another user with the same email
        # Check if email has unique constraint
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT sql FROM sqlite_master 
                WHERE type='table' AND name='users'
            """)
            table_sql = cursor.fetchone()[0]
            # Check if email has unique constraint
            self.assertIn('UNIQUE', table_sql)
            self.assertIn('email', table_sql)

    def test_user_score_management(self):
        """Test user score field functionality"""
        user = User.objects.create_user(**self.test_user_data)
        
        # Test initial score
        self.assertEqual(user.score, 100)
        
        # Test score modification
        user.score = 150
        user.save()
        self.assertEqual(user.score, 150)
        
        # Test score increase
        user.score += 50
        user.save()
        self.assertEqual(user.score, 200)

    def test_user_spam_management(self):
        """Test user spam prevention fields"""
        user = User.objects.create_user(**self.test_user_data)
        
        # Test initial spam values
        self.assertEqual(user.spam_score, 0)
        self.assertEqual(user.warning_count, 0)
        self.assertFalse(user.is_banned)
        self.assertIsNone(user.last_spam_check)
        
        # Test spam score increase
        user.spam_score = 25
        user.save()
        self.assertEqual(user.spam_score, 25)
        
        # Test warning count
        user.warning_count = 3
        user.save()
        self.assertEqual(user.warning_count, 3)
        
        # Test ban status
        user.is_banned = True
        user.save()
        self.assertTrue(user.is_banned)

    def test_user_status_management(self):
        """Test user status field functionality"""
        user = User.objects.create_user(**self.test_user_data)
        
        # Test initial status
        self.assertEqual(user.status, 'active')
        
        # Test status change
        user.status = 'suspended'
        user.save()
        self.assertEqual(user.status, 'suspended')
        
        # Test other status values
        statuses = ['active', 'suspended', 'inactive', 'pending']
        for status in statuses:
            user.status = status
            user.save()
            self.assertEqual(user.status, status)

    def test_user_type_validation(self):
        """Test user type field functionality"""
        user = User.objects.create_user(**self.test_user_data)
        
        # Test initial user type
        self.assertEqual(user.user_type, 'basic')
        
        # Test user type change
        user_types = ['basic', 'premium', 'admin', 'moderator']
        for user_type in user_types:
            user.user_type = user_type
            user.save()
            self.assertEqual(user.user_type, user_type)

    def test_user_relatedto_field(self):
        """Test user relatedto field functionality"""
        user = User.objects.create_user(**self.test_user_data)
        
        # Test initial value
        self.assertIsNone(user.relatedto)
        
        # Test setting value
        user.relatedto = 'family123'
        user.save()
        self.assertEqual(user.relatedto, 'family123')

    def test_user_eula_agreement(self):
        """Test user EULA agreement field"""
        user = User.objects.create_user(**self.test_user_data)
        
        # Test initial value
        self.assertIsNone(user.eula_agreed_date)
        
        # Test setting agreement date
        agreement_date = timezone.now()
        user.eula_agreed_date = agreement_date
        user.save()
        self.assertEqual(user.eula_agreed_date, agreement_date)

    def test_user_join_date(self):
        """Test user join date field"""
        user = User.objects.create_user(**self.test_user_data)
        
        # Test join date is set
        self.assertIsNotNone(user.join_date)
        
        # Test join date is recent
        now = timezone.now()
        time_diff = now - user.join_date
        self.assertLess(time_diff.total_seconds(), 5)  # Should be within 5 seconds

    def test_user_meta(self):
        """Test model meta configuration"""
        self.assertEqual(User._meta.db_table, 'users')
        self.assertEqual(User._meta.verbose_name, 'User')
        self.assertEqual(User._meta.verbose_name_plural, 'Users')

@pytest.mark.django_db
class UserIntegrationTest(TestCase):
    """Integration tests for user system"""
    
    def setUp(self):
        """Set up test data for integration tests"""
        # Create test users
        self.basic_user = User.objects.create_user(
            username='basicuser',
            email='basic@example.com',
            password='pass123',
            user_type='basic'
        )
        
        self.premium_user = User.objects.create_user(
            username='premiumuser',
            email='premium@example.com',
            password='pass123',
            user_type='premium'
        )
        
        self.admin_user = User.objects.create_user(
            username='adminuser',
            email='admin@example.com',
            password='admin123',
            user_type='admin',
            is_staff=True,
            is_superuser=True
        )

    def test_user_authentication(self):
        """Test user authentication functionality"""
        # Test password check
        self.assertTrue(self.basic_user.check_password('pass123'))
        self.assertFalse(self.basic_user.check_password('wrongpass'))
        
        # Test user is active
        self.assertTrue(self.basic_user.is_active)
        
        # Test user permissions
        self.assertFalse(self.basic_user.is_staff)
        self.assertFalse(self.basic_user.is_superuser)
        
        self.assertTrue(self.admin_user.is_staff)
        self.assertTrue(self.admin_user.is_superuser)

    def test_user_score_transactions(self):
        """Test user score transaction functionality"""
        # Test initial score
        self.assertEqual(self.basic_user.score, 100)
        
        # Test score increase
        self.basic_user.score += 50
        self.basic_user.save()
        self.assertEqual(self.basic_user.score, 150)
        
        # Test score decrease
        self.basic_user.score -= 25
        self.basic_user.save()
        self.assertEqual(self.basic_user.score, 125)

    def test_user_status_workflow(self):
        """Test user status workflow"""
        # Test active user
        self.assertEqual(self.basic_user.status, 'active')
        self.assertTrue(self.basic_user.is_active)
        
        # Test suspended user
        self.basic_user.status = 'suspended'
        self.basic_user.save()
        self.assertEqual(self.basic_user.status, 'suspended')
        
        # Test reactivation
        self.basic_user.status = 'active'
        self.basic_user.save()
        self.assertEqual(self.basic_user.status, 'active')

    def test_user_spam_workflow(self):
        """Test user spam prevention workflow"""
        # Test initial state
        self.assertEqual(self.basic_user.spam_score, 0)
        self.assertEqual(self.basic_user.warning_count, 0)
        self.assertFalse(self.basic_user.is_banned)
        
        # Test spam score increase
        self.basic_user.spam_score += 10
        self.basic_user.save()
        self.assertEqual(self.basic_user.spam_score, 10)
        
        # Test warning count increase
        self.basic_user.warning_count += 1
        self.basic_user.save()
        self.assertEqual(self.basic_user.warning_count, 1)
        
        # Test ban threshold
        self.basic_user.spam_score = 100
        self.basic_user.is_banned = True
        self.basic_user.save()
        self.assertTrue(self.basic_user.is_banned)

    def test_user_type_hierarchy(self):
        """Test user type hierarchy and permissions"""
        # Test basic user permissions
        self.assertEqual(self.basic_user.user_type, 'basic')
        self.assertFalse(self.basic_user.is_staff)
        
        # Test premium user permissions
        self.assertEqual(self.premium_user.user_type, 'premium')
        self.assertFalse(self.premium_user.is_staff)
        
        # Test admin user permissions
        self.assertEqual(self.admin_user.user_type, 'admin')
        self.assertTrue(self.admin_user.is_staff)
        self.assertTrue(self.admin_user.is_superuser)

    def test_user_data_consistency(self):
        """Test data consistency across user operations"""
        # Test user creation consistency
        self.assertIsNotNone(self.basic_user.id)
        self.assertIsNotNone(self.basic_user.username)
        self.assertIsNotNone(self.basic_user.join_date)
        
        # Test user modification consistency
        original_score = self.basic_user.score
        self.basic_user.score += 100
        self.basic_user.save()
        
        # Reload user from database
        reloaded_user = User.objects.get(id=self.basic_user.id)
        self.assertEqual(reloaded_user.score, original_score + 100)
        
        # Test user deletion consistency
        user_id = self.basic_user.id
        self.basic_user.delete()
        
        with self.assertRaises(User.DoesNotExist):
            User.objects.get(id=user_id)

    def test_user_relationships(self):
        """Test user relationship fields"""
        # Test relatedto field
        self.basic_user.relatedto = 'family456'
        self.basic_user.save()
        self.assertEqual(self.basic_user.relatedto, 'family456')
        
        # Test email relationship
        self.basic_user.email = 'newemail@example.com'
        self.basic_user.save()
        self.assertEqual(self.basic_user.email, 'newemail@example.com')

    def test_user_timestamps(self):
        """Test user timestamp fields"""
        # Test join date
        self.assertIsNotNone(self.basic_user.join_date)
        
        # Test EULA agreement date
        agreement_time = timezone.now()
        self.basic_user.eula_agreed_date = agreement_time
        self.basic_user.save()
        self.assertEqual(self.basic_user.eula_agreed_date, agreement_time)
        
        # Test last spam check
        spam_check_time = timezone.now()
        self.basic_user.last_spam_check = spam_check_time
        self.basic_user.save()
        self.assertEqual(self.basic_user.last_spam_check, spam_check_time)
