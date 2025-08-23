# 2025-01-27: Moderation models for dirReactFinal migration project
# Based on existing Flask moderation and approval functionality

from django.db import models
from dirReactFinal_core.models import User
from dirReactFinal_directory.models import PhoneBookEntry

class PendingChange(models.Model):
    """
    Pending changes model for admin approval workflow
    """
    CHANGE_TYPES = [
        ('add', 'Add New Entry'),
        ('edit', 'Edit Existing Entry'),
        ('delete', 'Delete Entry'),
        ('photo_upload', 'Photo Upload'),
        ('family_update', 'Family Relationship Update'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('under_review', 'Under Review'),
    ]
    
    change_type = models.CharField(max_length=20, choices=CHANGE_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Entry information
    entry = models.ForeignKey(PhoneBookEntry, on_delete=models.CASCADE, null=True, blank=True)
    new_data = models.JSONField(null=True, blank=True)  # Store new/modified data
    
    # User information
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pending_changes')
    reviewed_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='reviewed_changes')
    
    # Review information
    review_notes = models.TextField(null=True, blank=True)
    review_date = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'pending_changes'
        ordering = ['-created_at']
        verbose_name = 'Pending Change'
        verbose_name_plural = 'Pending Changes'
    
    def __str__(self):
        return f"{self.get_change_type_display()} - {self.status} - {self.requested_by.username}"
    
    def approve(self, reviewer, notes=None):
        """Approve the pending change"""
        self.status = 'approved'
        self.reviewed_by = reviewer
        self.review_notes = notes
        self.review_date = models.timezone.now()
        self.save()
    
    def reject(self, reviewer, notes=None):
        """Reject the pending change"""
        self.status = 'rejected'
        self.reviewed_by = reviewer
        self.review_notes = notes
        self.review_date = models.timezone.now()
        self.save()

class PhotoModeration(models.Model):
    """
    Photo moderation model for managing photo uploads
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    entry = models.ForeignKey(PhoneBookEntry, on_delete=models.CASCADE, related_name='photo_moderations')
    photo_file = models.ImageField(upload_to='pending_photos/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # User information
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='photo_uploads')
    reviewed_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='photo_reviews')
    
    # Review information
    review_notes = models.TextField(null=True, blank=True)
    review_date = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'photo_moderations'
        ordering = ['-created_at']
        verbose_name = 'Photo Moderation'
        verbose_name_plural = 'Photo Moderations'
    
    def __str__(self):
        return f"Photo for {self.entry.name} - {self.status}"
    
    def approve(self, reviewer, notes=None):
        """Approve the photo upload"""
        self.status = 'approved'
        self.reviewed_by = reviewer
        self.review_notes = notes
        self.review_date = models.timezone.now()
        self.save()
    
    def reject(self, reviewer, notes=None):
        """Reject the photo upload"""
        self.status = 'rejected'
        self.reviewed_by = reviewer
        self.review_notes = notes
        self.review_date = models.timezone.now()
        self.save()

class SpamReport(models.Model):
    """
    Spam report model for tracking user reports
    """
    REPORT_TYPES = [
        ('inappropriate_content', 'Inappropriate Content'),
        ('spam', 'Spam'),
        ('fake_information', 'Fake Information'),
        ('harassment', 'Harassment'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('investigating', 'Investigating'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    ]
    
    reported_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='spam_reports_received')
    reported_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='spam_reports_filed')
    report_type = models.CharField(max_length=30, choices=REPORT_TYPES)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    
    # Resolution information
    resolved_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='spam_reports_resolved')
    resolution_notes = models.TextField(null=True, blank=True)
    resolution_date = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'spam_reports'
        ordering = ['-created_at']
        verbose_name = 'Spam Report'
        verbose_name_plural = 'Spam Reports'
    
    def __str__(self):
        return f"Spam report against {self.reported_user.username} - {self.status}"
