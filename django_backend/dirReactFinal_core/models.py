# 2025-01-27: Core models for dirReactFinal migration project
# Based on existing Flask models from the original application

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import datetime

class User(AbstractUser):
    """
    Extended User model for dirReactFinal
    Based on existing Flask User model
    """
    # 2025-01-27: Extended user fields for dirReactFinal functionality
    
    # Basic fields
    email = models.EmailField(unique=True, null=True, blank=True)
    user_type = models.CharField(max_length=20, default='basic')
    relatedto = models.CharField(max_length=20, null=True, blank=True)
    status = models.CharField(max_length=20, default='active')
    score = models.IntegerField(default=100)
    
    # Spam prevention fields
    spam_score = models.IntegerField(default=0)
    last_spam_check = models.DateTimeField(null=True, blank=True)
    warning_count = models.IntegerField(default=0)
    is_banned = models.BooleanField(default=False)
    
    # EULA agreement field (exists in database)
    eula_agreed_date = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    join_date = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.username} ({self.user_type})"
    
    def get_age(self):
        """
        2025-01-28: ENHANCED - Calculate age from date of birth using year only to avoid month/day swap errors
        
        Uses only the year part of the date to calculate age, which is more reliable
        since month and day fields could have been swapped during data entry.
        """
        if hasattr(self, 'profile') and self.profile.DOB:
            try:
                from datetime import datetime
                today = datetime.now()
                current_year = today.year
                dob_str = self.profile.DOB
                
                # Handle different date formats and extract year
                if '/' in dob_str:
                    # Format: DD/MM/YYYY or MM/DD/YYYY (ambiguous, so use year only)
                    parts = dob_str.split('/')
                    if len(parts) == 3:
                        # Try to identify the year (should be the largest 4-digit number)
                        year = None
                        for part in parts:
                            if len(part) == 4 and part.isdigit():
                                year = int(part)
                                break
                        
                        if year and 1900 <= year <= current_year:
                            age = current_year - year
                            return age
                            
                elif '-' in dob_str:
                    # Format: YYYY-MM-DD or DD-MM-YYYY (ambiguous, so use year only)
                    parts = dob_str.split('-')
                    if len(parts) == 3:
                        # Try to identify the year (should be the largest 4-digit number)
                        year = None
                        for part in parts:
                            if len(part) == 4 and part.isdigit():
                                year = int(part)
                                break
                        
                        if year and 1900 <= year <= current_year:
                            age = current_year - year
                            return age
                            
                elif len(dob_str) == 4 and dob_str.isdigit():
                    # Format: YYYY (year only)
                    year = int(dob_str)
                    if 1900 <= year <= current_year:
                        age = current_year - year
                        return age
                        
            except Exception as e:
                # Log the error for debugging but don't fail
                print(f"Error calculating age for DOB '{self.profile.DOB}': {str(e)}")
                return None
        return None

class UserPermission(models.Model):
    """
    User permissions model for role-based access control
    """
    user_type = models.CharField(max_length=20)
    module = models.CharField(max_length=50)
    can_read = models.BooleanField(default=False)
    can_write = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)
    can_admin = models.BooleanField(default=False)
    rate_limit = models.CharField(max_length=50, null=True, blank=True)
    
    class Meta:
        db_table = 'user_permissions'
        unique_together = ['user_type', 'module']
    
    def __str__(self):
        return f"{self.user_type} - {self.module}"

class EventLog(models.Model):
    """
    Event logging model for tracking user actions
    """
    EVENT_TYPES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('search', 'Search'),
        ('add_contact', 'Add Contact'),
        ('edit_contact', 'Edit Contact'),
        ('delete_contact', 'Delete Contact'),
        ('upload_photo', 'Upload Photo'),
        ('referral', 'Referral'),
        ('score_change', 'Score Change'),
        ('password_change', 'Password Change'),
        ('family_deleted', 'Family Deleted'),  # 2025-01-28: Added for tracking family deletion events
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_logs')
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'event_logs'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user.username} - {self.event_type} - {self.timestamp}"

class RewardSetting(models.Model):
    """
    Reward settings for the gamification system
    """
    action = models.CharField(max_length=50, unique=True)
    points = models.IntegerField(default=0)
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'reward_settings'
    
    def __str__(self):
        return f"{self.action}: {self.points} points"

class SystemConfiguration(models.Model):
    """
    System configuration model for storing application settings
    """
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'system_configuration'
        verbose_name = 'System Configuration'
        verbose_name_plural = 'System Configuration'
    
    def __str__(self):
        return f"{self.key}: {self.value}"

class Island(models.Model):
    """Model to store Maldivian island information"""
    name = models.CharField(max_length=100, unique=True)
    atoll = models.CharField(max_length=100, blank=True)
    island_type = models.CharField(
        max_length=20,
        choices=[
            ('inhabited', 'Inhabited Island'),
            ('uninhabited', 'Uninhabited Island'),
            ('resort', 'Resort Island'),
            ('airport', 'Airport Island'),
            ('capital', 'Capital Island'),
        ],
        default='inhabited'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Island'
        verbose_name_plural = 'Islands'

    def __str__(self):
        return f"{self.name} ({self.atoll})"

class Atoll(models.Model):
    """Model to store Maldivian atoll information"""
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, blank=True, help_text="Short code for the atoll")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Atoll'
        verbose_name_plural = 'Atolls'

    def __str__(self):
        return self.name

class Party(models.Model):
    """Model to store political party information"""
    name = models.CharField(max_length=200, unique=True)
    short_name = models.CharField(max_length=50, blank=True, help_text="Abbreviated party name")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Political Party'
        verbose_name_plural = 'Political Parties'

    def __str__(self):
        return self.name
