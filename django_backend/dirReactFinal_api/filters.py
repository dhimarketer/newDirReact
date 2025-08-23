# 2025-01-27: Custom filters for dirReactFinal migration project
# Advanced filtering and search capabilities for the API

import django_filters
from django.db.models import Q
from dirReactFinal_directory.models import PhoneBookEntry
from dirReactFinal_core.models import User, EventLog
from dirReactFinal_family.models import FamilyGroup
from dirReactFinal_moderation.models import PendingChange

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
            return queryset.filter(
                Q(name__icontains=value) |
                Q(contact__icontains=value) |
                Q(nid__icontains=value) |
                Q(address__icontains=value) |
                Q(profession__icontains=value) |
                Q(email__icontains=value)
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
            return queryset.filter(
                Q(username__icontains=value) |
                Q(email__icontains=value) |
                Q(first_name__icontains=value) |
                Q(last_name__icontains=value)
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
            return queryset.filter(
                Q(name__icontains=value) |
                Q(description__icontains=value)
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
            queryset = queryset.filter(
                Q(name__icontains=query) |
                Q(contact__icontains=query) |
                Q(nid__icontains=query) |
                Q(address__icontains=query) |
                Q(profession__icontains=query)
            )
        
        if filters:
            # Apply additional filters
            if filters.get('atoll'):
                queryset = queryset.filter(atoll__icontains=filters['atoll'])
            
            if filters.get('island'):
                queryset = queryset.filter(island__icontains=filters['island'])
            
            if filters.get('profession'):
                queryset = queryset.filter(profession__icontains=filters['profession'])
            
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
