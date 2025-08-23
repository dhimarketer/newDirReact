# 2025-01-27: Directory models for dirReactFinal migration project
# Based on existing Flask PhoneBookEntry and Image models

from django.db import models
from django.core.validators import FileExtensionValidator
import os

class PhoneBookEntry(models.Model):
    """
    Phonebook entry model
    Directly maps to existing 't1' table in the database
    """
    # Primary key - maps to existing 'pid' column
    pid = models.IntegerField(primary_key=True)
    
    # Basic information
    nid = models.CharField(max_length=20, null=True, blank=True)
    name = models.TextField()
    contact = models.CharField(max_length=20)
    address = models.TextField(null=True, blank=True)
    atoll = models.TextField(null=True, blank=True)
    island = models.TextField(null=True, blank=True)
    street = models.TextField(null=True, blank=True)
    ward = models.TextField(null=True, blank=True)
    
    # Additional information
    party = models.TextField(null=True, blank=True)
    DOB = models.TextField(null=True, blank=True)
    status = models.TextField(null=True, blank=True)
    remark = models.TextField(null=True, blank=True)
    email = models.CharField(max_length=120, null=True, blank=True)
    gender = models.TextField(null=True, blank=True)
    extra = models.TextField(null=True, blank=True)
    profession = models.TextField(null=True, blank=True)
    pep_status = models.TextField(null=True, blank=True)
    
    # Change management
    change_status = models.CharField(max_length=20, default='pending')
    requested_by = models.TextField(null=True, blank=True)
    batch = models.CharField(max_length=20, null=True, blank=True)
    
    # Image status
    image_status = models.CharField(max_length=20, null=True, blank=True)
    
    # Family group reference
    family_group_id = models.IntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 't1'
        verbose_name = 'Phone Book Entry'
        verbose_name_plural = 'Phone Book Entries'
        indexes = [
            models.Index(fields=['contact']),
            models.Index(fields=['name']),
            models.Index(fields=['nid']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.contact}"
    
    def get_age(self):
        """Calculate age from DOB if available"""
        if not self.DOB:
            return None
        try:
            # Handle different date formats
            if '/' in self.DOB:
                from datetime import datetime
                dob = datetime.strptime(self.DOB, '%d/%m/%Y')
                today = datetime.now()
                age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                return age
        except:
            return None
        return None

class Image(models.Model):
    """
    Image model for contact photos
    Based on existing Flask Image model
    """
    id = models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')
    filename = models.CharField(max_length=255, unique=True)
    image_file = models.ImageField(upload_to='contact_photos/', validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'gif'])])
    last_modified = models.DateTimeField(auto_now=True)
    entry = models.OneToOneField(PhoneBookEntry, on_delete=models.CASCADE, related_name='image')
    
    class Meta:
        db_table = 'images'
        verbose_name = 'Contact Image'
        verbose_name_plural = 'Contact Images'
    
    def __str__(self):
        return f"Image for entry {self.entry.id}"
    
    def delete(self, *args, **kwargs):
        """Override delete to remove image file from storage"""
        if self.image_file:
            if os.path.isfile(self.image_file.path):
                os.remove(self.image_file.path)
        super().delete(*args, **kwargs)

class SearchHistory(models.Model):
    """
    Search history model for tracking user searches
    """
    user = models.ForeignKey('dirReactFinal_core.User', on_delete=models.CASCADE, related_name='search_history')
    search_term = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'search_history'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user.username} searched for '{self.search_term}' at {self.timestamp}"
