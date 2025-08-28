# 2025-01-27: Admin configuration for core models

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, UserPermission, EventLog, RewardSetting, Island, Atoll, Party

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

@admin.register(Island)
class IslandAdmin(admin.ModelAdmin):
    list_display = ['name', 'atoll', 'island_type', 'is_active', 'created_at']
    list_filter = ['island_type', 'atoll', 'is_active']
    search_fields = ['name', 'atoll']
    ordering = ['name']
    list_per_page = 50
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'atoll', 'island_type')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Atoll)
class AtollAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'code']
    ordering = ['name']
    list_per_page = 50
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'code')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Party)
class PartyAdmin(admin.ModelAdmin):
    list_display = ['name', 'short_name', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'short_name']
    ordering = ['name']
    list_per_page = 50
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'short_name')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')
