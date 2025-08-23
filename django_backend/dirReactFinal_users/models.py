# 2025-01-27: Users app models for dirReactFinal migration project
# Based on existing Flask user management functionality

from django.db import models
from django.contrib.auth.models import User
from dirReactFinal_core.models import User as CoreUser

class UserProfile(models.Model):
    """
    Extended user profile model
    """
    user = models.OneToOneField(CoreUser, on_delete=models.CASCADE, related_name='profile')
    
    # Personal information
    phone_number = models.CharField(max_length=20, unique=True)
    national_id = models.CharField(max_length=20, unique=True)
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    
    # Contact preferences
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    
    # Profile settings
    profile_photo = models.ImageField(upload_to='profile_photos/', null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profiles'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
    
    def __str__(self):
        return f"Profile for {self.user.username}"
    
    def get_full_name(self):
        """Get user's full name"""
        return f"{self.user.first_name} {self.user.last_name}".strip() or self.user.username

class UserSession(models.Model):
    """
    User session tracking model
    """
    user = models.ForeignKey(CoreUser, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=40, unique=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_sessions'
        ordering = ['-last_activity']
        verbose_name = 'User Session'
        verbose_name_plural = 'User Sessions'
    
    def __str__(self):
        return f"Session for {self.user.username} - {self.session_key[:8]}..."

class UserActivity(models.Model):
    """
    User activity tracking model
    """
    ACTIVITY_TYPES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('search', 'Search'),
        ('view_profile', 'View Profile'),
        ('edit_profile', 'Edit Profile'),
        ('upload_photo', 'Upload Photo'),
        ('add_contact', 'Add Contact'),
        ('edit_contact', 'Edit Contact'),
        ('delete_contact', 'Delete Contact'),
        ('family_action', 'Family Action'),
        ('referral_action', 'Referral Action'),
    ]
    
    user = models.ForeignKey(CoreUser, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    description = models.TextField()
    metadata = models.JSONField(null=True, blank=True)  # Additional activity data
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_activities'
        ordering = ['-created_at']
        verbose_name = 'User Activity'
        verbose_name_plural = 'User Activities'
    
    def __str__(self):
        return f"{self.user.username} - {self.get_activity_type_display()} at {self.created_at}"
