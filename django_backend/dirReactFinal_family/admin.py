# 2025-01-27: Admin configuration for family models
# 2025-01-27: Enhanced admin interface with better display and filtering

from django.contrib import admin
from django.utils.html import format_html
from .models import FamilyGroup, FamilyRelationship, FamilyMember

@admin.register(FamilyGroup)
class FamilyGroupAdmin(admin.ModelAdmin):
    """Admin for FamilyGroup model"""
    list_display = ['name', 'created_by', 'member_count', 'is_public', 'created_at', 'updated_at']
    list_filter = ['is_public', 'created_at', 'updated_at']
    search_fields = ['name', 'description', 'created_by__username']
    readonly_fields = ['created_at', 'updated_at', 'member_count']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'is_public')
        }),
        ('Ownership', {
            'fields': ('created_by',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def member_count(self, obj):
        """Display member count with color coding"""
        count = obj.get_member_count()
        if count == 0:
            color = 'red'
        elif count < 5:
            color = 'orange'
        else:
            color = 'green'
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, count
        )
    member_count.short_description = 'Members'

@admin.register(FamilyRelationship)
class FamilyRelationshipAdmin(admin.ModelAdmin):
    """Admin for FamilyRelationship model"""
    list_display = ['person1_name', 'relationship_type', 'person2_name', 'family_group_name', 'is_active', 'created_at']
    list_filter = ['relationship_type', 'is_active', 'created_at', 'family_group']
    search_fields = ['person1__name', 'person2__name', 'family_group__name', 'notes']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['family_group__name', 'person1__name']
    
    fieldsets = (
        ('Relationship Information', {
            'fields': ('person1', 'relationship_type', 'person2', 'family_group')
        }),
        ('Additional Details', {
            'fields': ('notes', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def person1_name(self, obj):
        """Display person1 name with link"""
        if obj.person1:
            return format_html(
                '<a href="/admin/dirReactFinal_directory/phonebookentry/{}/change/">{}</a>',
                obj.person1.id, obj.person1.name
            )
        return 'N/A'
    person1_name.short_description = 'Person 1'
    
    def person2_name(self, obj):
        """Display person2 name with link"""
        if obj.person2:
            return format_html(
                '<a href="/admin/dirReactFinal_directory/phonebookentry/{}/change/">{}</a>',
                obj.person2.id, obj.person2.name
            )
        return 'N/A'
    person2_name.short_description = 'Person 2'
    
    def family_group_name(self, obj):
        """Display family group name with link"""
        if obj.family_group:
            return format_html(
                '<a href="/admin/dirReactFinal_directory/familygroup/{}/change/">{}</a>',
                obj.family_group.id, obj.family_group.name
            )
        return 'N/A'
    family_group_name.short_description = 'Family Group'
    
    def relationship_type(self, obj):
        """Display relationship type with color coding"""
        type_display = obj.get_relationship_type_display()
        
        # Color code different relationship types
        color_map = {
            'parent': 'blue',
            'child': 'green',
            'spouse': 'purple',
            'sibling': 'orange',
            'grandparent': 'brown',
            'grandchild': 'teal',
            'aunt_uncle': 'indigo',
            'niece_nephew': 'pink',
            'cousin': 'gray',
            'other': 'black',
        }
        
        color = color_map.get(obj.relationship_type, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, type_display
        )
    relationship_type.short_description = 'Relationship Type'

@admin.register(FamilyMember)
class FamilyMemberAdmin(admin.ModelAdmin):
    """Admin for FamilyMember model"""
    list_display = ['entry_name', 'family_group_name', 'role_in_family', 'joined_at']
    list_filter = ['role_in_family', 'joined_at', 'family_group']
    search_fields = ['entry__name', 'family_group__name', 'role_in_family']
    readonly_fields = ['joined_at']
    ordering = ['family_group__name', 'entry__name']
    
    fieldsets = (
        ('Member Information', {
            'fields': ('entry', 'family_group', 'role_in_family')
        }),
        ('Timestamps', {
            'fields': ('joined_at',),
            'classes': ('collapse',)
        }),
    )
    
    def entry_name(self, obj):
        """Display entry name with link to entry"""
        if obj.entry:
            return format_html(
                '<a href="/admin/dirReactFinal_directory/phonebookentry/{}/change/">{}</a>',
                obj.entry.id, obj.entry.name
            )
        return 'N/A'
    entry_name.short_description = 'Member Name'
    
    def family_group_name(self, obj):
        """Display family group name with link"""
        if obj.family_group:
            return format_html(
                '<a href="/admin/dirReactFinal_directory/familygroup/{}/change/">{}</a>',
                obj.family_group.id, obj.family_group.name
            )
        return 'N/A'
    family_group_name.short_description = 'Family Group'
