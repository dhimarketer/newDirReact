# 2025-01-27: Admin configuration for directory models

from django.contrib import admin
from .models import PhoneBookEntry, Image, SearchHistory

@admin.register(PhoneBookEntry)
class PhoneBookEntryAdmin(admin.ModelAdmin):
    """Admin for PhoneBookEntry model"""
    list_display = ['name', 'contact', 'nid', 'atoll', 'island', 'status', 'is_unlisted', 'change_status', 'pep_status']
    list_filter = ['change_status', 'atoll', 'island', 'gender', 'pep_status', 'status', 'is_unlisted']
    search_fields = ['name', 'contact', 'nid', 'address', 'email']
    readonly_fields = ['pid']  # pid is the primary key
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('pid', 'name', 'contact', 'nid', 'email', 'gender', 'DOB')
        }),
        ('Location', {
            'fields': ('address', 'atoll', 'island', 'street', 'ward')
        }),
        ('Additional Information', {
            'fields': ('party', 'status', 'is_unlisted', 'remark', 'profession', 'pep_status', 'extra')
        }),
        ('Change Management', {
            'fields': ('change_status', 'requested_by', 'batch', 'image_status')
        }),
        ('Family', {
            'fields': ('family_group_id',)
        }),
    )

@admin.register(Image)
class ImageAdmin(admin.ModelAdmin):
    """Admin for Image model"""
    list_display = ['entry', 'filename', 'last_modified']
    list_filter = ['last_modified']
    search_fields = ['entry__name', 'filename']
    readonly_fields = ['last_modified']

@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    """Admin for SearchHistory model"""
    list_display = ['user', 'search_term', 'ip_address', 'timestamp']
    list_filter = ['timestamp']
    search_fields = ['user__username', 'search_term']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']
