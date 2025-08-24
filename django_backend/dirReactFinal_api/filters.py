# 2025-01-27: Custom filters for dirReactFinal migration project
# Advanced filtering and search capabilities for the API

import django_filters
from django.db.models import Q
from dirReactFinal_directory.models import PhoneBookEntry
from dirReactFinal_core.models import User, EventLog
from dirReactFinal_family.models import FamilyGroup
from dirReactFinal_moderation.models import PendingChange
from dirReactFinal_api.utils import create_wildcard_query

class PhoneBookEntryFilter(django_filters.FilterSet):
    """Advanced filter for phonebook entries"""
    
    # Text search fields
    search = django_filters.CharFilter(method='search_filter', label='Search')
    
    # Location filters
    atoll = django_filters.CharFilter(lookup_expr='icontains')
    island = django_filters.CharFilter(lookup_expr='icontains')
    street = django_filters.CharFilter(lookup_expr='icontains')
    ward = django_filters.CharFilter(lookup_expr='icontains')
    
    # Contact information filters
    name = django_filters.CharFilter(lookup_expr='icontains')
    contact = django_filters.CharFilter(lookup_expr='icontains')
    nid = django_filters.CharFilter(lookup_expr='icontains')
    email = django_filters.CharFilter(lookup_expr='icontains')
    
    # Demographics filters
    gender = django_filters.ChoiceFilter(choices=[
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other')
    ])
    profession = django_filters.CharFilter(lookup_expr='icontains')
    
    # Status filters
    status = django_filters.ChoiceFilter(choices=[
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('pending', 'Pending')
    ])
    change_status = django_filters.ChoiceFilter(choices=[
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    ])
    image_status = django_filters.ChoiceFilter(choices=[
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('no_image', 'No Image')
    ])
    
    # Date filters - 2025-01-27: Removed non-existent created_at/updated_at fields
    # created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    # created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    # updated_after = django_filters.DateFilter(field_name='updated_at', lookup_expr='gte')
    # updated_before = django_filters.DateFilter(field_name='updated_at', lookup_expr='lte')
    
    # Age range filters
    min_age = django_filters.NumberFilter(method='filter_min_age', label='Minimum Age')
    max_age = django_filters.NumberFilter(method='filter_max_age', label='Maximum Age')
    
    # Party filter
    party = django_filters.CharFilter(lookup_expr='icontains')
    
    # PEP status filter
    pep_status = django_filters.ChoiceFilter(choices=[
        ('yes', 'Yes'),
        ('no', 'No'),
        ('pending', 'Pending')
    ])
    
    class Meta:
        model = PhoneBookEntry
        fields = {
            'name': ['exact', 'icontains', 'startswith'],
            'contact': ['exact', 'icontains'],
            'nid': ['exact', 'icontains'],
            'address': ['icontains'],
            'profession': ['icontains'],
        }
    
    def search_filter(self, queryset, name, value):
        """Custom search filter across multiple fields"""
        if value:
            # Use wildcard-aware queries for comprehensive search
            name_query = create_wildcard_query('name', value)
            contact_query = create_wildcard_query('contact', value)
            nid_query = create_wildcard_query('nid', value)
            address_query = create_wildcard_query('address', value)
            profession_query = create_wildcard_query('profession', value)
            email_query = create_wildcard_query('email', value)
            return queryset.filter(
                name_query | contact_query | nid_query | address_query | profession_query | email_query
            )
        return queryset
    
    def filter_min_age(self, queryset, name, value):
        """Filter by minimum age"""
        if value is not None:
            from datetime import datetime, timedelta
            max_dob = datetime.now() - timedelta(days=value * 365)
            return queryset.exclude(DOB__isnull=True).filter(
                DOB__lte=max_dob.strftime('%d/%m/%Y')
            )
        return queryset
    
    def filter_max_age(self, queryset, name, value):
        """Filter by maximum age"""
        if value is not None:
            from datetime import datetime, timedelta
            min_dob = datetime.now() - timedelta(days=value * 365)
            return queryset.exclude(DOB__isnull=True).filter(
                DOB__gte=min_dob.strftime('%d/%m/%Y')
            )
        return queryset

class UserFilter(django_filters.FilterSet):
    """Filter for user management"""
    
    search = django_filters.CharFilter(method='search_filter', label='Search')
    user_type = django_filters.ChoiceFilter(choices=[
        ('basic', 'Basic'),
        ('premium', 'Premium'),
        ('admin', 'Admin'),
        ('moderator', 'Moderator')
    ])
    status = django_filters.ChoiceFilter(choices=[
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended')
    ])
    is_banned = django_filters.BooleanFilter()
    
    # Score range filters
    min_score = django_filters.NumberFilter(field_name='score', lookup_expr='gte')
    max_score = django_filters.NumberFilter(field_name='score', lookup_expr='lte')
    
    # Date filters
    joined_after = django_filters.DateFilter(field_name='join_date', lookup_expr='gte')
    joined_before = django_filters.DateFilter(field_name='join_date', lookup_expr='lte')
    
    class Meta:
        model = User
        fields = {
            'username': ['exact', 'icontains'],
            'email': ['exact', 'icontains'],
            'score': ['exact', 'gte', 'lte'],
        }
    
    def search_filter(self, queryset, name, value):
        """Custom search filter for users"""
        if value:
            # Use wildcard-aware queries for comprehensive search
            username_query = create_wildcard_query('username', value)
            email_query = create_wildcard_query('email', value)
            first_name_query = create_wildcard_query('first_name', value)
            last_name_query = create_wildcard_query('last_name', value)
            return queryset.filter(
                username_query | email_query | first_name_query | last_name_query
            )
        return queryset

class FamilyGroupFilter(django_filters.FilterSet):
    """Filter for family groups"""
    
    search = django_filters.CharFilter(method='search_filter', label='Search')
    created_by = django_filters.ModelChoiceFilter(queryset=User.objects.all())
    
    # Date filters - 2025-01-27: Removed non-existent created_at fields
    # created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    # created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    
    class Meta:
        model = FamilyGroup
        fields = {
            'name': ['exact', 'icontains'],
            'description': ['icontains'],
        }
    
    def search_filter(self, queryset, name, value):
        """Custom search filter for family groups"""
        if value:
            # Use wildcard-aware queries for comprehensive search
            name_query = create_wildcard_query('name', value)
            description_query = create_wildcard_query('description', value)
            return queryset.filter(
                name_query | description_query
            )
        return queryset

class PendingChangeFilter(django_filters.FilterSet):
    """Filter for pending changes"""
    
    change_type = django_filters.ChoiceFilter(choices=[
        ('name', 'Name'),
        ('contact', 'Contact'),
        ('address', 'Address'),
        ('email', 'Email'),
        ('profession', 'Profession'),
        ('other', 'Other')
    ])
    status = django_filters.ChoiceFilter(choices=[
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    ])
    requested_by = django_filters.ModelChoiceFilter(queryset=User.objects.all())
    reviewed_by = django_filters.ModelChoiceFilter(queryset=User.objects.all())
    
    # Date filters
    requested_after = django_filters.DateFilter(field_name='requested_at', lookup_expr='gte')
    requested_before = django_filters.DateFilter(field_name='requested_at', lookup_expr='lte')
    reviewed_after = django_filters.DateFilter(field_name='reviewed_at', lookup_expr='gte')
    reviewed_before = django_filters.DateFilter(field_name='reviewed_at', lookup_expr='lte')
    
    class Meta:
        model = PendingChange
        fields = {
            'entry': ['exact'],
            'change_type': ['exact'],
            'status': ['exact'],
        }

class EventLogFilter(django_filters.FilterSet):
    """Filter for event logs"""
    
    user = django_filters.ModelChoiceFilter(queryset=User.objects.all())
    event_type = django_filters.ChoiceFilter(choices=[
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('search', 'Search'),
        ('add_contact', 'Add Contact'),
        ('edit_contact', 'Edit Contact'),
        ('delete_contact', 'Delete Contact'),
        ('upload_photo', 'Upload Photo'),
        ('referral', 'Referral'),
        ('score_change', 'Score Change'),
    ])
    
    # Date filters
    timestamp_after = django_filters.DateTimeFilter(field_name='timestamp', lookup_expr='gte')
    timestamp_before = django_filters.DateTimeFilter(field_name='timestamp', lookup_expr='lte')
    
    class Meta:
        model = EventLog
        fields = {
            'event_type': ['exact'],
            'ip_address': ['exact', 'icontains'],
        }

# Custom filter methods for complex queries
class AdvancedSearchFilter:
    """Advanced search functionality for complex queries"""
    
    @staticmethod
    def search_phonebook(query, filters=None):
        """Advanced search in phonebook with multiple criteria"""
        queryset = PhoneBookEntry.objects.all()
        
        if query:
            # Use wildcard-aware queries for comprehensive search
            name_query = create_wildcard_query('name', query)
            contact_query = create_wildcard_query('contact', query)
            nid_query = create_wildcard_query('nid', query)
            address_query = create_wildcard_query('address', query)
            profession_query = create_wildcard_query('profession', query)
            queryset = queryset.filter(
                name_query | contact_query | nid_query | address_query | profession_query
            )
        
        if filters:
            # Apply additional filters
            if filters.get('atoll'):
                atoll_query = create_wildcard_query('atoll', filters['atoll'])
                queryset = queryset.filter(atoll_query)
            
            if filters.get('island'):
                island_query = create_wildcard_query('island', filters['island'])
                queryset = queryset.filter(island_query)
            
            if filters.get('profession'):
                profession_query = create_wildcard_query('profession', filters['profession'])
                queryset = queryset.filter(profession_query)
            
            if filters.get('gender'):
                queryset = queryset.filter(gender=filters['gender'])
            
            if filters.get('min_age') or filters.get('max_age'):
                queryset = queryset.exclude(DOB__isnull=True)
                
                if filters.get('min_age'):
                    from datetime import datetime, timedelta
                    max_dob = datetime.now() - timedelta(days=filters['min_age'] * 365)
                    queryset = queryset.filter(DOB__lte=max_dob.strftime('%d/%m/%Y'))
                
                if filters.get('max_age'):
                    from datetime import datetime, timedelta
                    min_dob = datetime.now() - timedelta(days=filters['max_age'] * 365)
                    queryset = queryset.filter(DOB__gte=min_dob.strftime('%d/%m/%Y'))
        
        return queryset
