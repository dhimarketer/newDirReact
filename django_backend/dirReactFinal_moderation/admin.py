# 2025-01-27: Admin configuration for moderation models

from django.contrib import admin
from .models import PendingChange, PhotoModeration, SpamReport

@admin.register(PendingChange)
class PendingChangeAdmin(admin.ModelAdmin):
    """Admin for PendingChange model"""
    list_display = ['change_type', 'status', 'requested_by', 'entry', 'created_at']
    list_filter = ['change_type', 'status', 'created_at']
    search_fields = ['requested_by__username', 'entry__name', 'review_notes']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    actions = ['approve_changes', 'reject_changes']
    
    def approve_changes(self, request, queryset):
        """Approve selected pending changes"""
        updated = queryset.update(status='approved')
        self.message_user(request, f'{updated} changes were successfully approved.')
    approve_changes.short_description = "Approve selected changes"
    
    def reject_changes(self, request, queryset):
        """Reject selected pending changes"""
        updated = queryset.update(status='rejected')
        self.message_user(request, f'{updated} changes were successfully rejected.')
    reject_changes.short_description = "Reject selected changes"

@admin.register(PhotoModeration)
class PhotoModerationAdmin(admin.ModelAdmin):
    """Admin for PhotoModeration model"""
    list_display = ['entry', 'status', 'uploaded_by', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['entry__name', 'uploaded_by__username', 'review_notes']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    actions = ['approve_photos', 'reject_photos']
    
    def approve_photos(self, request, queryset):
        """Approve selected photo uploads"""
        updated = queryset.update(status='approved')
        self.message_user(request, f'{updated} photos were successfully approved.')
    approve_photos.short_description = "Approve selected photos"
    
    def reject_photos(self, request, queryset):
        """Reject selected photo uploads"""
        updated = queryset.update(status='rejected')
        self.message_user(request, f'{updated} photos were successfully rejected.')
    reject_photos.short_description = "Reject selected photos"

@admin.register(SpamReport)
class SpamReportAdmin(admin.ModelAdmin):
    """Admin for SpamReport model"""
    list_display = ['reported_user', 'report_type', 'status', 'reported_by', 'created_at']
    list_filter = ['report_type', 'status', 'created_at']
    search_fields = ['reported_user__username', 'reported_by__username', 'description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    actions = ['mark_investigating', 'mark_resolved', 'mark_dismissed']
    
    def mark_investigating(self, request, queryset):
        """Mark selected reports as investigating"""
        updated = queryset.update(status='investigating')
        self.message_user(request, f'{updated} reports were marked as investigating.')
    mark_investigating.short_description = "Mark as investigating"
    
    def mark_resolved(self, request, queryset):
        """Mark selected reports as resolved"""
        updated = queryset.update(status='resolved')
        self.message_user(request, f'{updated} reports were marked as resolved.')
    mark_resolved.short_description = "Mark as resolved"
    
    def mark_dismissed(self, request, queryset):
        """Mark selected reports as dismissed"""
        updated = queryset.update(status='dismissed')
        self.message_user(request, f'{updated} reports were marked as dismissed.')
    mark_dismissed.short_description = "Mark as dismissed"
