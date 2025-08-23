# 2025-01-27: Comprehensive unit tests for dirReactFinal core models
# Tests all core functionality with proper coverage and test markers

import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone
from datetime import timedelta

from .models import User, UserPermission, EventLog, SystemConfiguration
from test_config import TestUtils

User = get_user_model()

@pytest.mark.unit
@pytest.mark.core
class UserModelTest(TestCase):
    """Test cases for User model"""
    
    def setUp(self):
        """Set up test data"""
        self.test_user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'user_type': 'basic',
            'first_name': 'Test',
            'last_name': 'User'
        }
    
    def test_user_creation(self):
        """Test basic user creation"""
        user = User.objects.create_user(**self.test_user_data)
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.user_type, 'basic')
        self.assertTrue(user.check_password('testpass123'))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
    
    def test_user_creation_without_username(self):
        """Test user creation without username (should fail)"""
        data = self.test_user_data.copy()
        del data['username']
        with self.assertRaises(ValueError):
            User.objects.create_user(**data)
    
    def test_user_creation_without_email(self):
        """Test user creation without email (should fail)"""
        data = self.test_user_data.copy()
        del data['email']
        with self.assertRaises(ValueError):
            User.objects.create_user(**data)
    
    def test_user_creation_without_password(self):
        """Test user creation without password (should fail)"""
        data = self.test_user_data.copy()
        del data['password']
        with self.assertRaises(ValueError):
            User.objects.create_user(**data)
    
    def test_user_creation_without_user_type(self):
        """Test user creation without user_type (should fail)"""
        data = self.test_user_data.copy()
        del data['user_type']
        with self.assertRaises(ValueError):
            User.objects.create_user(**data)
    
    def test_superuser_creation(self):
        """Test superuser creation"""
        user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            user_type='admin'
        )
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertEqual(user.user_type, 'admin')
    
    def test_user_str_representation(self):
        """Test user string representation"""
        user = User.objects.create_user(**self.test_user_data)
        expected_str = f"{user.first_name} {user.last_name} ({user.username})"
        self.assertEqual(str(user), expected_str)
    
    def test_user_full_name(self):
        """Test user full name property"""
        user = User.objects.create_user(**self.test_user_data)
        expected_full_name = f"{user.first_name} {user.last_name}"
        self.assertEqual(user.full_name, expected_full_name)
    
    def test_user_permissions_inheritance(self):
        """Test that user permissions are properly inherited"""
        user = User.objects.create_user(**self.test_user_data)
        # This should create default permissions for basic user
        permissions = UserPermission.objects.filter(user_type=user.user_type)
        self.assertGreater(permissions.count(), 0)
    
    def test_user_score_initialization(self):
        """Test that user score is properly initialized"""
        user = User.objects.create_user(**self.test_user_data)
        self.assertEqual(user.score, 0)
        self.assertEqual(user.level, 1)
    
    def test_user_status_default(self):
        """Test that user status defaults to active"""
        user = User.objects.create_user(**self.test_user_data)
        self.assertEqual(user.status, 'active')
    
    def test_user_last_login_tracking(self):
        """Test that last login is properly tracked"""
        user = User.objects.create_user(**self.test_user_data)
        initial_login = user.last_login
        
        # Simulate login
        user.last_login = timezone.now()
        user.save()
        
        self.assertNotEqual(user.last_login, initial_login)
    
    def test_user_type_validation(self):
        """Test that invalid user types are rejected"""
        data = self.test_user_data.copy()
        data['user_type'] = 'invalid_type'
        
        with self.assertRaises(ValidationError):
            user = User.objects.create_user(**data)
            user.full_clean()
    
    def test_user_email_uniqueness(self):
        """Test that email addresses must be unique"""
        User.objects.create_user(**self.test_user_data)
        
        # Try to create another user with same email
        data2 = self.test_user_data.copy()
        data2['username'] = 'testuser2'
        
        with self.assertRaises(IntegrityError):
            User.objects.create_user(**data2)
    
    def test_user_username_uniqueness(self):
        """Test that usernames must be unique"""
        User.objects.create_user(**self.test_user_data)
        
        # Try to create another user with same username
        data2 = self.test_user_data.copy()
        data2['email'] = 'test2@example.com'
        
        with self.assertRaises(IntegrityError):
            User.objects.create_user(**data2)

@pytest.mark.unit
@pytest.mark.core
class UserPermissionModelTest(TestCase):
    """Test cases for UserPermission model"""
    
    def setUp(self):
        """Set up test data"""
        self.permission_data = {
            'user_type': 'basic',
            'module': 'directory',
            'can_read': True,
            'can_write': True,
            'can_delete': False,
            'can_admin': False
        }
    
    def test_permission_creation(self):
        """Test basic permission creation"""
        permission = UserPermission.objects.create(**self.permission_data)
        self.assertEqual(permission.user_type, 'basic')
        self.assertEqual(permission.module, 'directory')
        self.assertTrue(permission.can_read)
        self.assertTrue(permission.can_write)
        self.assertFalse(permission.can_delete)
        self.assertFalse(permission.can_admin)
    
    def test_permission_str_representation(self):
        """Test permission string representation"""
        permission = UserPermission.objects.create(**self.permission_data)
        expected_str = f"{permission.user_type} - {permission.module}"
        self.assertEqual(str(permission), expected_str)
    
    def test_permission_unique_constraint(self):
        """Test that user_type + module combination must be unique"""
        UserPermission.objects.create(**self.permission_data)
        
        # Try to create duplicate permission
        with self.assertRaises(IntegrityError):
            UserPermission.objects.create(**self.permission_data)
    
    def test_permission_default_values(self):
        """Test permission default values"""
        permission = UserPermission.objects.create(
            user_type='premium',
            module='family'
        )
        self.assertFalse(permission.can_read)
        self.assertFalse(permission.can_write)
        self.assertFalse(permission.can_delete)
        self.assertFalse(permission.can_admin)
    
    def test_permission_validation(self):
        """Test permission validation"""
        # Test invalid user type
        with self.assertRaises(ValidationError):
            permission = UserPermission(
                user_type='invalid',
                module='directory'
            )
            permission.full_clean()
        
        # Test invalid module
        with self.assertRaises(ValidationError):
            permission = UserPermission(
                user_type='basic',
                module='invalid_module'
            )
            permission.full_clean()

@pytest.mark.unit
@pytest.mark.core
class EventLogModelTest(TestCase):
    """Test cases for EventLog model"""
    
    def setUp(self):
        """Set up test data"""
        self.user = TestUtils.create_test_user()
        self.log_data = {
            'user': self.user,
            'event_type': 'user_login',
            'description': 'User logged in successfully',
            'ip_address': '127.0.0.1',
            'user_agent': 'Mozilla/5.0 Test Browser'
        }
    
    def test_event_log_creation(self):
        """Test basic event log creation"""
        log = EventLog.objects.create(**self.log_data)
        self.assertEqual(log.user, self.user)
        self.assertEqual(log.event_type, 'user_login')
        self.assertEqual(log.description, 'User logged in successfully')
        self.assertEqual(log.ip_address, '127.0.0.1')
        self.assertIsNotNone(log.timestamp)
    
    def test_event_log_str_representation(self):
        """Test event log string representation"""
        log = EventLog.objects.create(**self.log_data)
        expected_str = f"{log.timestamp} - {log.user.username} - {log.event_type}"
        self.assertEqual(str(log), expected_str)
    
    def test_event_log_timestamp_auto(self):
        """Test that timestamp is automatically set"""
        log = EventLog.objects.create(**self.log_data)
        self.assertIsNotNone(log.timestamp)
        self.assertLessEqual(log.timestamp, timezone.now())
    
    def test_event_log_user_optional(self):
        """Test that user is optional for system events"""
        data = self.log_data.copy()
        del data['user']
        data['event_type'] = 'system_startup'
        data['description'] = 'System started successfully'
        
        log = EventLog.objects.create(**data)
        self.assertIsNone(log.user)
        self.assertEqual(log.event_type, 'system_startup')
    
    def test_event_log_validation(self):
        """Test event log validation"""
        # Test invalid event type
        with self.assertRaises(ValidationError):
            log = EventLog(
                user=self.user,
                event_type='invalid_event',
                description='Test description'
            )
            log.full_clean()
        
        # Test empty description
        with self.assertRaises(ValidationError):
            log = EventLog(
                user=self.user,
                event_type='user_login',
                description=''
            )
            log.full_clean()
    
    def test_event_log_cleanup(self):
        """Test event log cleanup functionality"""
        # Create old logs
        old_timestamp = timezone.now() - timedelta(days=90)
        old_log = EventLog.objects.create(
            user=self.user,
            event_type='user_login',
            description='Old login',
            timestamp=old_timestamp
        )
        
        # Create recent logs
        recent_log = EventLog.objects.create(**self.log_data)
        
        # Test cleanup (this would be implemented in a management command)
        # For now, just verify the logs exist
        self.assertEqual(EventLog.objects.count(), 2)

@pytest.mark.unit
@pytest.mark.core
class SystemConfigurationModelTest(TestCase):
    """Test cases for SystemConfiguration model"""
    
    def setUp(self):
        """Set up test data"""
        self.config_data = {
            'key': 'max_file_size',
            'value': '10485760',
            'description': 'Maximum file upload size in bytes',
            'category': 'file_upload'
        }
    
    def test_config_creation(self):
        """Test basic configuration creation"""
        config = SystemConfiguration.objects.create(**self.config_data)
        self.assertEqual(config.key, 'max_file_size')
        self.assertEqual(config.value, '10485760')
        self.assertEqual(config.description, 'Maximum file upload size in bytes')
        self.assertEqual(config.category, 'file_upload')
        self.assertIsNotNone(config.created_at)
        self.assertIsNotNone(config.updated_at)
    
    def test_config_str_representation(self):
        """Test configuration string representation"""
        config = SystemConfiguration.objects.create(**self.config_data)
        expected_str = f"{config.key} = {config.value}"
        self.assertEqual(str(config), expected_str)
    
    def test_config_unique_key(self):
        """Test that configuration keys must be unique"""
        SystemConfiguration.objects.create(**self.config_data)
        
        # Try to create duplicate key
        with self.assertRaises(IntegrityError):
            SystemConfiguration.objects.create(
                key='max_file_size',
                value='20971520',
                description='Different description',
                category='file_upload'
            )
    
    def test_config_validation(self):
        """Test configuration validation"""
        # Test empty key
        with self.assertRaises(ValidationError):
            config = SystemConfiguration(
                key='',
                value='test_value',
                description='Test description',
                category='test'
            )
            config.full_clean()
        
        # Test empty value
        with self.assertRaises(ValidationError):
            config = SystemConfiguration(
                key='test_key',
                value='',
                description='Test description',
                category='test'
            )
            config.full_clean()
    
    def test_config_update_tracking(self):
        """Test that updated_at is properly tracked"""
        config = SystemConfiguration.objects.create(**self.config_data)
        initial_updated = config.updated_at
        
        # Update the configuration
        config.value = '20971520'
        config.save()
        
        self.assertGreater(config.updated_at, initial_updated)
    
    def test_config_get_value_method(self):
        """Test configuration get_value method"""
        config = SystemConfiguration.objects.create(**self.config_data)
        
        # Test getting existing value
        value = SystemConfiguration.get_value('max_file_size')
        self.assertEqual(value, '10485760')
        
        # Test getting non-existent value with default
        value = SystemConfiguration.get_value('non_existent', 'default_value')
        self.assertEqual(value, 'default_value')
    
    def test_config_set_value_method(self):
        """Test configuration set_value method"""
        # Test setting new value
        SystemConfiguration.set_value('test_key', 'test_value', 'Test description', 'test')
        
        config = SystemConfiguration.objects.get(key='test_key')
        self.assertEqual(config.value, 'test_value')
        
        # Test updating existing value
        SystemConfiguration.set_value('test_key', 'updated_value')
        
        config.refresh_from_db()
        self.assertEqual(config.value, 'updated_value')

@pytest.mark.unit
@pytest.mark.core
class CoreModelIntegrationTest(TestCase):
    """Integration tests for core models"""
    
    def setUp(self):
        """Set up test data"""
        self.admin_user = TestUtils.create_test_user('admin')
        self.basic_user = TestUtils.create_test_user('basic')
        self.premium_user = TestUtils.create_test_user('premium')
    
    def test_user_permission_workflow(self):
        """Test complete user permission workflow"""
        # Create permissions for different user types
        basic_permission = UserPermission.objects.create(
            user_type='basic',
            module='directory',
            can_read=True,
            can_write=True,
            can_delete=False,
            can_admin=False
        )
        
        premium_permission = UserPermission.objects.create(
            user_type='premium',
            module='directory',
            can_read=True,
            can_write=True,
            can_delete=True,
            can_admin=False
        )
        
        admin_permission = UserPermission.objects.create(
            user_type='admin',
            module='directory',
            can_read=True,
            can_write=True,
            can_delete=True,
            can_admin=True
        )
        
        # Verify permissions are created
        self.assertEqual(UserPermission.objects.count(), 3)
        
        # Test permission inheritance
        basic_user_perms = UserPermission.objects.filter(user_type=self.basic_user.user_type)
        self.assertEqual(basic_user_perms.count(), 1)
        
        premium_user_perms = UserPermission.objects.filter(user_type=self.premium_user.user_type)
        self.assertEqual(premium_user_perms.count(), 1)
        
        admin_user_perms = UserPermission.objects.filter(user_type=self.admin_user.user_type)
        self.assertEqual(admin_user_perms.count(), 1)
    
    def test_event_logging_workflow(self):
        """Test complete event logging workflow"""
        # Log various events
        EventLog.objects.create(
            user=self.basic_user,
            event_type='user_login',
            description='Basic user logged in',
            ip_address='127.0.0.1'
        )
        
        EventLog.objects.create(
            user=self.premium_user,
            event_type='user_login',
            description='Premium user logged in',
            ip_address='127.0.0.1'
        )
        
        EventLog.objects.create(
            user=self.admin_user,
            event_type='admin_action',
            description='Admin performed action',
            ip_address='127.0.0.1'
        )
        
        # Verify logs are created
        self.assertEqual(EventLog.objects.count(), 3)
        
        # Test log filtering
        login_logs = EventLog.objects.filter(event_type='user_login')
        self.assertEqual(login_logs.count(), 2)
        
        admin_logs = EventLog.objects.filter(event_type='admin_action')
        self.assertEqual(admin_logs.count(), 1)
    
    def test_system_configuration_workflow(self):
        """Test complete system configuration workflow"""
        # Set various configurations
        SystemConfiguration.set_value('max_file_size', '10485760', 'Max file size', 'file_upload')
        SystemConfiguration.set_value('session_timeout', '3600', 'Session timeout', 'security')
        SystemConfiguration.set_value('maintenance_mode', 'false', 'Maintenance mode', 'system')
        
        # Verify configurations
        self.assertEqual(SystemConfiguration.objects.count(), 3)
        
        # Test configuration retrieval
        max_file_size = SystemConfiguration.get_value('max_file_size')
        self.assertEqual(max_file_size, '10485760')
        
        session_timeout = SystemConfiguration.get_value('session_timeout')
        self.assertEqual(session_timeout, '3600')
        
        maintenance_mode = SystemConfiguration.get_value('maintenance_mode')
        self.assertEqual(maintenance_mode, 'false')
        
        # Test configuration update
        SystemConfiguration.set_value('max_file_size', '20971520')
        updated_size = SystemConfiguration.get_value('max_file_size')
        self.assertEqual(updated_size, '20971520')
