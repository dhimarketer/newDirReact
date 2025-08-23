# 2025-01-27: Test configuration for dirReactFinal Django backend
# Defines testing environments, settings, and configurations

import os
from pathlib import Path

# Test environment configurations
TEST_ENVIRONMENTS = {
    'development': {
        'database': 'sqlite',
        'cache': 'memory',
        'media_storage': 'local',
        'debug': True,
        'logging': 'debug',
        'coverage_threshold': 90,
    },
    'staging': {
        'database': 'postgresql',
        'cache': 'redis',
        'media_storage': 'local',
        'debug': False,
        'logging': 'info',
        'coverage_threshold': 95,
    },
    'production': {
        'database': 'postgresql',
        'cache': 'redis',
        'media_storage': 's3',
        'debug': False,
        'logging': 'warning',
        'coverage_threshold': 95,
    }
}

# Test data factories
TEST_FACTORIES = {
    'users': {
        'admin': {
            'username': 'testadmin',
            'email': 'admin@test.com',
            'password': 'testpass123',
            'user_type': 'admin',
            'is_staff': True,
            'is_superuser': True
        },
        'premium': {
            'username': 'testpremium',
            'email': 'premium@test.com',
            'password': 'testpass123',
            'user_type': 'premium',
            'is_staff': False,
            'is_superuser': False
        },
        'basic': {
            'username': 'testbasic',
            'email': 'basic@test.com',
            'password': 'testpass123',
            'user_type': 'basic',
            'is_staff': False,
            'is_superuser': False
        }
    },
    'phonebook': {
        'sample_entries': [
            {
                'name': 'John Doe',
                'contact': '7771234',
                'address': '123 Main Street',
                'atoll': 'Male',
                'island': 'Male City',
                'status': 'active'
            },
            {
                'name': 'Jane Smith',
                'contact': '7775678',
                'address': '456 Oak Avenue',
                'atoll': 'Addu',
                'island': 'Hithadhoo',
                'status': 'active'
            },
            {
                'name': 'Bob Johnson',
                'contact': '7779012',
                'address': '789 Pine Road',
                'atoll': 'Haa Alifu',
                'island': 'Dhiddhoo',
                'status': 'inactive'
            }
        ]
    },
    'families': {
        'sample_groups': [
            {
                'name': 'Doe Family',
                'description': 'Extended family of John Doe',
                'is_public': True
            },
            {
                'name': 'Smith Family',
                'description': 'Family of Jane Smith',
                'is_public': False
            }
        ]
    }
}

# Performance test configurations
PERFORMANCE_TESTS = {
    'load_testing': {
        'users': 100,
        'requests_per_user': 50,
        'ramp_up_time': 30,  # seconds
        'test_duration': 300,  # seconds
        'target_response_time': 200,  # milliseconds
        'max_error_rate': 1.0  # percentage
    },
    'stress_testing': {
        'users': 500,
        'requests_per_user': 100,
        'ramp_up_time': 60,
        'test_duration': 600,
        'target_response_time': 500,
        'max_error_rate': 5.0
    },
    'endurance_testing': {
        'users': 200,
        'requests_per_user': 1000,
        'ramp_up_time': 120,
        'test_duration': 3600,
        'target_response_time': 300,
        'max_error_rate': 2.0
    }
}

# Security test configurations
SECURITY_TESTS = {
    'authentication': {
        'brute_force_attempts': 100,
        'password_complexity': True,
        'session_timeout': 3600,
        'max_failed_logins': 5
    },
    'authorization': {
        'permission_escalation': True,
        'role_based_access': True,
        'api_rate_limiting': True
    },
    'data_protection': {
        'sql_injection': True,
        'xss_protection': True,
        'csrf_protection': True,
        'input_validation': True
    }
}

# Test markers and categories
TEST_MARKERS = {
    'unit': 'Unit tests for individual components',
    'integration': 'Integration tests for component interactions',
    'api': 'API endpoint tests',
    'auth': 'Authentication and authorization tests',
    'permissions': 'Permission system tests',
    'security': 'Security vulnerability tests',
    'performance': 'Performance and load tests',
    'slow': 'Slow running tests (>1 second)',
    'smoke': 'Critical functionality smoke tests',
    'regression': 'Regression tests for bug fixes',
    'edge_case': 'Edge case and boundary tests',
    'data_migration': 'Data migration tests',
    'deployment': 'Deployment and configuration tests'
}

# Coverage thresholds by module
COVERAGE_THRESHOLDS = {
    'dirReactFinal_core': 95,
    'dirReactFinal_users': 95,
    'dirReactFinal_directory': 95,
    'dirReactFinal_family': 95,
    'dirReactFinal_moderation': 95,
    'dirReactFinal_scoring': 95,
    'dirReactFinal_api': 95,
    'overall': 95
}

# Test data cleanup
TEST_CLEANUP = {
    'auto_cleanup': True,
    'cleanup_after_each_test': False,
    'cleanup_after_test_class': True,
    'cleanup_after_test_session': True,
    'preserve_test_data': False
}

# Test reporting
TEST_REPORTING = {
    'html_coverage': True,
    'xml_coverage': True,
    'terminal_coverage': True,
    'junit_xml': True,
    'performance_metrics': True,
    'security_report': True
}

# Environment-specific settings
def get_test_settings(environment='development'):
    """Get test settings for specified environment"""
    if environment not in TEST_ENVIRONMENTS:
        raise ValueError(f"Unknown test environment: {environment}")
    
    return TEST_ENVIRONMENTS[environment]

def get_coverage_threshold(module=None):
    """Get coverage threshold for specified module"""
    if module is None:
        return COVERAGE_THRESHOLDS['overall']
    return COVERAGE_THRESHOLDS.get(module, COVERAGE_THRESHOLDS['overall'])

def get_test_factory_data(factory_type, key=None):
    """Get test factory data for specified type and key"""
    if factory_type not in TEST_FACTORIES:
        raise ValueError(f"Unknown factory type: {factory_type}")
    
    if key is None:
        return TEST_FACTORIES[factory_type]
    
    return TEST_FACTORIES[factory_type].get(key, {})

# Test utilities
class TestUtils:
    """Utility class for test operations"""
    
    @staticmethod
    def create_test_user(user_type='basic', **kwargs):
        """Create a test user with specified type"""
        from dirReactFinal_core.models import User
        
        user_data = TEST_FACTORIES['users'].get(user_type, {}).copy()
        user_data.update(kwargs)
        
        return User.objects.create_user(**user_data)
    
    @staticmethod
    def create_test_phonebook_entry(**kwargs):
        """Create a test phonebook entry"""
        from dirReactFinal_directory.models import PhoneBookEntry
        
        entry_data = TEST_FACTORIES['phonebook']['sample_entries'][0].copy()
        entry_data.update(kwargs)
        
        return PhoneBookEntry.objects.create(**entry_data)
    
    @staticmethod
    def create_test_family_group(**kwargs):
        """Create a test family group"""
        from dirReactFinal_family.models import FamilyGroup
        
        group_data = TEST_FACTORIES['families']['sample_groups'][0].copy()
        group_data.update(kwargs)
        
        return FamilyGroup.objects.create(**group_data)
