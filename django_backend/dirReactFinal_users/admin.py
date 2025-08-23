# 2025-01-27: Admin configuration for users models

from django.contrib import admin
from .models import UserProfile, UserSession, UserActivity

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """Admin for UserProfile model"""
    list_display = ['user', 'phone_number', 'national_id', 'email_notifications', 'sms_notifications']
    list_filter = ['email_notifications', 'sms_notifications', 'created_at']
    search_fields = ['user__username', 'phone_number', 'national_id']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    """Admin for UserSession model"""
    list_display = ['user', 'session_key', 'ip_address', 'is_active', 'last_activity']
    list_filter = ['is_active', 'created_at']
    search_fields = ['user__username', 'session_key', 'ip_address']
    readonly_fields = ['created_at', 'last_activity']
    ordering = ['-last_activity']

@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    """Admin for UserActivity model"""
    list_display = ['user', 'activity_type', 'description', 'created_at']
    list_filter = ['activity_type', 'created_at']
    search_fields = ['user__username', 'description']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
