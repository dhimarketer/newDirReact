# 2025-01-27: Admin configuration for family models

from django.contrib import admin
from .models import FamilyGroup, FamilyRelationship, FamilyMember

@admin.register(FamilyGroup)
class FamilyGroupAdmin(admin.ModelAdmin):
    """Admin for FamilyGroup model"""
    list_display = ['name', 'created_by', 'get_member_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'description', 'created_by__username']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(FamilyRelationship)
class FamilyRelationshipAdmin(admin.ModelAdmin):
    """Admin for FamilyRelationship model"""
    list_display = ['person1', 'person2', 'relationship_type', 'family_group', 'is_active']
    list_filter = ['relationship_type', 'family_group', 'is_active', 'created_at']
    search_fields = ['person1__name', 'person2__name', 'family_group__name']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(FamilyMember)
class FamilyMemberAdmin(admin.ModelAdmin):
    """Admin for FamilyMember model"""
    list_display = ['entry', 'family_group', 'role_in_family', 'joined_at']
    list_filter = ['family_group', 'joined_at']
    search_fields = ['entry__name', 'family_group__name', 'role_in_family']
    readonly_fields = ['joined_at']
