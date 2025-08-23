# 2025-01-27: Admin configuration for core models

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, UserPermission, EventLog, RewardSetting

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Custom admin for User model"""
    list_display = ['username', 'email', 'user_type', 'score', 'status', 'is_banned', 'join_date']
    list_filter = ['user_type', 'status', 'is_banned', 'join_date']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-join_date']
    
    fieldsets = UserAdmin.fieldsets + (
        ('dirReactFinal Fields', {
            'fields': ('user_type', 'relatedto', 'status', 'score', 'spam_score', 
                      'last_spam_check', 'warning_count', 'is_banned', 'eula_agreed_date')
        }),
    )
    
    readonly_fields = ['join_date']

@admin.register(UserPermission)
class UserPermissionAdmin(admin.ModelAdmin):
    """Admin for UserPermission model"""
    list_display = ['user_type', 'module', 'can_read', 'can_write', 'can_delete', 'can_admin']
    list_filter = ['user_type', 'module']
    search_fields = ['user_type', 'module']
    list_editable = ['can_read', 'can_write', 'can_delete', 'can_admin']

@admin.register(EventLog)
class EventLogAdmin(admin.ModelAdmin):
    """Admin for EventLog model"""
    list_display = ['user', 'event_type', 'ip_address', 'timestamp']
    list_filter = ['event_type', 'timestamp']
    search_fields = ['user__username', 'description']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']

@admin.register(RewardSetting)
class RewardSettingAdmin(admin.ModelAdmin):
    """Admin for RewardSetting model"""
    list_display = ['action', 'points', 'description', 'is_active']
    list_filter = ['is_active']
    search_fields = ['action', 'description']
    list_editable = ['points', 'is_active']
