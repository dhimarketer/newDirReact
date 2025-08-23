# 2025-01-27: Family tree models for dirReactFinal migration project
# Based on existing Flask family tree functionality

from django.db import models
from dirReactFinal_directory.models import PhoneBookEntry

class FamilyGroup(models.Model):
    """
    Family group model for organizing family relationships
    """
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    is_public = models.BooleanField(default=False, help_text="Whether this family group is visible to all users")
    created_by = models.ForeignKey('dirReactFinal_core.User', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'family_groups'
        verbose_name = 'Family Group'
        verbose_name_plural = 'Family Groups'
    
    def __str__(self):
        return self.name
    
    def get_member_count(self):
        """Get the number of members in this family group"""
        return self.members.count()

class FamilyRelationship(models.Model):
    """
    Family relationship model for defining connections between family members
    """
    RELATIONSHIP_TYPES = [
        ('parent', 'Parent'),
        ('child', 'Child'),
        ('spouse', 'Spouse'),
        ('sibling', 'Sibling'),
        ('grandparent', 'Grandparent'),
        ('grandchild', 'Grandchild'),
        ('aunt_uncle', 'Aunt/Uncle'),
        ('niece_nephew', 'Niece/Nephew'),
        ('cousin', 'Cousin'),
        ('other', 'Other'),
    ]
    
    person1 = models.ForeignKey(PhoneBookEntry, on_delete=models.CASCADE, related_name='relationships_from')
    person2 = models.ForeignKey(PhoneBookEntry, on_delete=models.CASCADE, related_name='relationships_to')
    relationship_type = models.CharField(max_length=20, choices=RELATIONSHIP_TYPES)
    family_group = models.ForeignKey(FamilyGroup, on_delete=models.CASCADE, related_name='relationships')
    
    # Additional relationship details
    notes = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'family_relationships'
        unique_together = ['person1', 'person2', 'relationship_type']
        verbose_name = 'Family Relationship'
        verbose_name_plural = 'Family Relationships'
    
    def __str__(self):
        return f"{self.person1.name} is {self.get_relationship_type_display()} of {self.person2.name}"
    
    def get_reciprocal_relationship(self):
        """Get the reciprocal relationship type"""
        reciprocal_map = {
            'parent': 'child',
            'child': 'parent',
            'spouse': 'spouse',
            'sibling': 'sibling',
            'grandparent': 'grandchild',
            'grandchild': 'grandparent',
            'aunt_uncle': 'niece_nephew',
            'niece_nephew': 'aunt_uncle',
            'cousin': 'cousin',
            'other': 'other',
        }
        return reciprocal_map.get(self.relationship_type, 'other')

class FamilyMember(models.Model):
    """
    Family member model for linking phonebook entries to family groups
    """
    entry = models.ForeignKey(PhoneBookEntry, on_delete=models.CASCADE, related_name='family_memberships')
    family_group = models.ForeignKey(FamilyGroup, on_delete=models.CASCADE, related_name='members')
    role_in_family = models.CharField(max_length=100, null=True, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'family_members'
        unique_together = ['entry', 'family_group']
        verbose_name = 'Family Member'
        verbose_name_plural = 'Family Members'
    
    def __str__(self):
        return f"{self.entry.name} in {self.family_group.name}"
