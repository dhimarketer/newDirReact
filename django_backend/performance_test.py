#!/usr/bin/env python3
# 2025-01-27: Performance testing script for dirReactFinal Django backend
# Uses Locust for load testing and performance analysis

import os
import sys
import time
import json
import requests
from locust import HttpUser, task, between, events
from locust.exception import StopUser
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DirReactFinalUser(HttpUser):
    """Locust user class for dirReactFinal API performance testing"""
    
    wait_time = between(1, 3)  # Wait 1-3 seconds between requests
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.auth_token = None
        self.user_type = None
        self.test_data = {}
    
    def on_start(self):
        """Set up user when starting"""
        self.authenticate_user()
        self.create_test_data()
    
    def authenticate_user(self):
        """Authenticate user and get token"""
        try:
            # Create test user
            user_data = {
                'username': f'perfuser_{int(time.time())}',
                'email': f'perf{int(time.time())}@test.com',
                'password': 'perfpass123',
                'user_type': 'basic',
                'first_name': 'Performance',
                'last_name': 'User'
            }
            
            # Register user
            response = self.client.post('/api/auth/register/', json=user_data)
            if response.status_code == 201:
                self.user_type = 'basic'
                # Login to get token
                login_data = {
                    'username': user_data['username'],
                    'password': user_data['password']
                }
                response = self.client.post('/api/auth/login/', json=login_data)
                if response.status_code == 200:
                    self.auth_token = response.json().get('access')
                    self.client.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                    logger.info(f"User authenticated: {user_data['username']}")
                else:
                    logger.error(f"Login failed: {response.status_code}")
            else:
                logger.error(f"Registration failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Authentication error: {e}")
    
    def create_test_data(self):
        """Create test data for performance testing"""
        if not self.auth_token:
            return
            
        try:
            # Create test phonebook entry
            phonebook_data = {
                'name': f'Perf Contact {int(time.time())}',
                'contact': f'777{int(time.time()) % 10000:04d}',
                'address': f'Performance Test Address {int(time.time())}',
                'atoll': 'Male',
                'island': 'Male City',
                'status': 'active'
            }
            
            response = self.client.post('/api/phonebook/', json=phonebook_data)
            if response.status_code == 201:
                self.test_data['phonebook_id'] = response.json().get('id')
                logger.info(f"Test phonebook entry created: {self.test_data['phonebook_id']}")
            
            # Create test family group
            family_data = {
                'name': f'Perf Family {int(time.time())}',
                'description': f'Performance test family {int(time.time())}',
                'is_public': True
            }
            
            response = self.client.post('/api/family-groups/', json=family_data)
            if response.status_code == 201:
                self.test_data['family_id'] = response.json().get('id')
                logger.info(f"Test family group created: {self.test_data['family_id']}")
                
        except Exception as e:
            logger.error(f"Test data creation error: {e}")
    
    @task(3)
    def test_phonebook_list(self):
        """Test phonebook list endpoint performance"""
        try:
            response = self.client.get('/api/phonebook/')
            if response.status_code != 200:
                logger.warning(f"Phonebook list failed: {response.status_code}")
        except Exception as e:
            logger.error(f"Phonebook list error: {e}")
    
    @task(2)
    def test_phonebook_search(self):
        """Test phonebook search performance"""
        try:
            search_terms = ['John', 'Jane', 'Test', 'Male', 'Addu']
            search_term = search_terms[int(time.time()) % len(search_terms)]
            response = self.client.get(f'/api/phonebook/?search={search_term}')
            if response.status_code != 200:
                logger.warning(f"Phonebook search failed: {response.status_code}")
        except Exception as e:
            logger.error(f"Phonebook search error: {e}")
    
    @task(2)
    def test_phonebook_filter(self):
        """Test phonebook filtering performance"""
        try:
            filters = ['atoll=Male', 'status=active', 'island=Male City']
            filter_param = filters[int(time.time()) % len(filters)]
            response = self.client.get(f'/api/phonebook/?{filter_param}')
            if response.status_code != 200:
                logger.warning(f"Phonebook filter failed: {response.status_code}")
        except Exception as e:
            logger.error(f"Phonebook filter error: {e}")
    
    @task(1)
    def test_phonebook_detail(self):
        """Test phonebook detail endpoint performance"""
        if not self.test_data.get('phonebook_id'):
            return
            
        try:
            response = self.client.get(f'/api/phonebook/{self.test_data["phonebook_id"]}/')
            if response.status_code != 200:
                logger.warning(f"Phonebook detail failed: {response.status_code}")
        except Exception as e:
            logger.error(f"Phonebook detail error: {e}")
    
    @task(1)
    def test_family_group_list(self):
        """Test family group list endpoint performance"""
        try:
            response = self.client.get('/api/family-groups/')
            if response.status_code != 200:
                logger.warning(f"Family group list failed: {response.status_code}")
        except Exception as e:
            logger.error(f"Family group list error: {e}")
    
    @task(1)
    def test_score_transaction_list(self):
        """Test score transaction list endpoint performance"""
        try:
            response = self.client.get('/api/score-transactions/')
            if response.status_code != 200:
                logger.warning(f"Score transaction list failed: {response.status_code}")
        except Exception as e:
            logger.error(f"Score transaction list error: {e}")
    
    @task(1)
    def test_user_profile(self):
        """Test user profile endpoint performance"""
        try:
            response = self.client.get('/api/users/profile/')
            if response.status_code != 200:
                logger.warning(f"User profile failed: {response.status_code}")
        except Exception as e:
            logger.error(f"User profile error: {e}")

class AdminUser(DirReactFinalUser):
    """Admin user for testing admin-specific endpoints"""
    
    def authenticate_user(self):
        """Authenticate as admin user"""
        try:
            # Use existing admin credentials or create admin user
            admin_data = {
                'username': 'perfadmin',
                'email': 'perfadmin@test.com',
                'password': 'adminpass123',
                'user_type': 'admin',
                'first_name': 'Performance',
                'last_name': 'Admin'
            }
            
            # Try to login first
            login_data = {
                'username': admin_data['username'],
                'password': admin_data['password']
            }
            response = self.client.post('/api/auth/login/', json=login_data)
            
            if response.status_code == 200:
                self.auth_token = response.json().get('access')
                self.user_type = 'admin'
            else:
                # Create admin user if doesn't exist
                response = self.client.post('/api/auth/register/', json=admin_data)
                if response.status_code == 201:
                    response = self.client.post('/api/auth/login/', json=login_data)
                    if response.status_code == 200:
                        self.auth_token = response.json().get('access')
                        self.user_type = 'admin'
            
            if self.auth_token:
                self.client.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                logger.info(f"Admin user authenticated: {admin_data['username']}")
                
        except Exception as e:
            logger.error(f"Admin authentication error: {e}")
    
    @task(1)
    def test_pending_changes_list(self):
        """Test pending changes list endpoint performance"""
        try:
            response = self.client.get('/api/pending-changes/')
            if response.status_code != 200:
                logger.warning(f"Pending changes list failed: {response.status_code}")
        except Exception as e:
            logger.error(f"Pending changes list error: {e}")
    
    @task(1)
    def test_admin_dashboard(self):
        """Test admin dashboard endpoint performance"""
        try:
            response = self.client.get('/api/admin/dashboard/')
            if response.status_code != 200:
                logger.warning(f"Admin dashboard failed: {response.status_code}")
        except Exception as e:
            logger.error(f"Admin dashboard error: {e}")

class PremiumUser(DirReactFinalUser):
    """Premium user for testing premium features"""
    
    def authenticate_user(self):
        """Authenticate as premium user"""
        try:
            premium_data = {
                'username': f'perfpremium_{int(time.time())}',
                'email': f'perfpremium{int(time.time())}@test.com',
                'password': 'premiumpass123',
                'user_type': 'premium',
                'first_name': 'Performance',
                'last_name': 'Premium'
            }
            
            # Register premium user
            response = self.client.post('/api/auth/register/', json=premium_data)
            if response.status_code == 201:
                self.user_type = 'premium'
                # Login to get token
                login_data = {
                    'username': premium_data['username'],
                    'password': premium_data['password']
                }
                response = self.client.post('/api/auth/login/', json=login_data)
                if response.status_code == 200:
                    self.auth_token = response.json().get('access')
                    self.client.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                    logger.info(f"Premium user authenticated: {premium_data['username']}")
                    
        except Exception as e:
            logger.error(f"Premium authentication error: {e}")
    
    @task(1)
    def test_advanced_search(self):
        """Test advanced search features for premium users"""
        try:
            # Test advanced search with multiple parameters
            search_params = {
                'search': 'Test',
                'atoll': 'Male',
                'status': 'active',
                'sort_by': 'name',
                'sort_order': 'asc'
            }
            response = self.client.get('/api/phonebook/', params=search_params)
            if response.status_code != 200:
                logger.warning(f"Advanced search failed: {response.status_code}")
        except Exception as e:
            logger.error(f"Advanced search error: {e}")

# Performance test configuration
PERFORMANCE_CONFIG = {
    'load_testing': {
        'users': 100,
        'spawn_rate': 10,
        'run_time': '5m'
    },
    'stress_testing': {
        'users': 500,
        'spawn_rate': 50,
        'run_time': '10m'
    },
    'endurance_testing': {
        'users': 200,
        'spawn_rate': 20,
        'run_time': '1h'
    }
}

def run_performance_test(test_type='load_testing'):
    """Run performance test with specified configuration"""
    if test_type not in PERFORMANCE_CONFIG:
        print(f"Unknown test type: {test_type}")
        return
    
    config = PERFORMANCE_CONFIG[test_type]
    
    print(f"🚀 Starting {test_type} performance test")
    print(f"Users: {config['users']}")
    print(f"Spawn Rate: {config['spawn_rate']}")
    print(f"Run Time: {config['run_time']}")
    
    # This would be run with locust command line
    # locust -f performance_test.py --host=http://localhost:8000 --users={config['users']} --spawn-rate={config['spawn_rate']} --run-time={config['run_time']}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_type = sys.argv[1]
        run_performance_test(test_type)
    else:
        print("Usage: python performance_test.py [load_testing|stress_testing|endurance_testing]")
        print("Default: load_testing")
        run_performance_test('load_testing')
