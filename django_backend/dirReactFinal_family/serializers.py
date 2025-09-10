# 2024-12-28: Phase 4 - Enhanced serializers for rich relationships, media, and events

from rest_framework import serializers
from django.db import models
from .models import FamilyGroup, FamilyMember, FamilyRelationship, FamilyMedia, FamilyEvent
from dirReactFinal_directory.models import PhoneBookEntry

class FamilyMediaSerializer(serializers.ModelSerializer):
    """Serializer for family media attachments"""
    
    class Meta:
        model = FamilyMedia
        fields = [
            'id', 'person', 'relationship', 'family_group', 'media_type', 'title',
            'description', 'file_path', 'file_size', 'mime_type', 'uploaded_by',
            'upload_date', 'is_public', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'upload_date', 'created_at', 'updated_at']

class FamilyEventSerializer(serializers.ModelSerializer):
    """Serializer for family life events"""
    
    person_name = serializers.CharField(source='person.name', read_only=True)
    related_person_name = serializers.CharField(source='related_person.name', read_only=True)
    media_attachments = FamilyMediaSerializer(many=True, read_only=True)
    
    class Meta:
        model = FamilyEvent
        fields = [
            'id', 'person', 'person_name', 'event_type', 'title', 'description',
            'event_date', 'location', 'related_person', 'related_person_name',
            'media_attachments', 'is_verified', 'source', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class EnhancedFamilyRelationshipSerializer(serializers.ModelSerializer):
    """Enhanced serializer for family relationships with Phase 4 metadata"""
    
    person1_name = serializers.CharField(source='person1.name', read_only=True)
    person2_name = serializers.CharField(source='person2.name', read_only=True)
    family_group_name = serializers.CharField(source='family_group.name', read_only=True)
    media_attachments = FamilyMediaSerializer(many=True, read_only=True)
    
    class Meta:
        model = FamilyRelationship
        fields = [
            'id', 'person1', 'person2', 'person1_name', 'person2_name',
            'relationship_type', 'family_group', 'family_group_name',
            'notes', 'is_active', 'start_date', 'end_date', 'relationship_status',
            'is_biological', 'is_legal', 'confidence_level', 'media_attachments',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_confidence_level(self, value):
        """Validate confidence level is between 0 and 100"""
        if value < 0 or value > 100:
            raise serializers.ValidationError("Confidence level must be between 0 and 100")
        return value
    
    def validate_relationship_status(self, value):
        """Validate relationship status is valid"""
        valid_statuses = ['active', 'inactive', 'ended', 'suspended', 'divorced']
        if value not in valid_statuses:
            raise serializers.ValidationError(f"Invalid relationship status: {value}. Must be one of: {', '.join(valid_statuses)}")
        return value

class FamilyMemberSerializer(serializers.ModelSerializer):
    """Serializer for family members"""
    
    entry_name = serializers.CharField(source='entry.name', read_only=True)
    family_group_name = serializers.CharField(source='family_group.name', read_only=True)
    
    class Meta:
        model = FamilyMember
        fields = [
            'id', 'entry', 'entry_name', 'family_group', 'family_group_name',
            'role_in_family', 'joined_at'
        ]
        read_only_fields = ['id', 'joined_at']

class FamilyMemberWithEntrySerializer(serializers.ModelSerializer):
    """Serializer for family members with full entry details including age"""
    
    entry_name = serializers.CharField(source='entry.name', read_only=True)
    family_group_name = serializers.CharField(source='family_group.name', read_only=True)
    entry_age = serializers.SerializerMethodField()
    entry_contact = serializers.CharField(source='entry.contact', read_only=True)
    entry_dob = serializers.CharField(source='entry.DOB', read_only=True)
    entry_gender = serializers.CharField(source='entry.gender', read_only=True)
    entry_profession = serializers.CharField(source='entry.profession', read_only=True)
    entry_nid = serializers.CharField(source='entry.nid', read_only=True)
    
    class Meta:
        model = FamilyMember
        fields = [
            'id', 'entry', 'entry_name', 'family_group', 'family_group_name',
            'role_in_family', 'joined_at', 'entry_age', 'entry_contact', 
            'entry_dob', 'entry_gender', 'entry_profession', 'entry_nid'
        ]
        read_only_fields = ['id', 'joined_at']
    
    def get_entry_age(self, obj):
        """Get calculated age from entry"""
        if obj.entry:
            return obj.entry.get_age()
        return None

class FamilyGroupSerializer(serializers.ModelSerializer):
    """Serializer for family groups"""
    
    members = FamilyMemberSerializer(many=True, read_only=True)
    relationships = EnhancedFamilyRelationshipSerializer(many=True, read_only=True)
    media_attachments = FamilyMediaSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FamilyGroup
        fields = [
            'id', 'name', 'description', 'address', 'island', 'is_public',
            'created_by', 'members', 'relationships', 'media_attachments',
            'member_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_member_count(self, obj):
        return obj.members.count()

class FamilyGroupWithEntryDetailsSerializer(serializers.ModelSerializer):
    """Serializer for family groups with full entry details including ages"""
    
    members = FamilyMemberWithEntrySerializer(many=True, read_only=True)
    relationships = EnhancedFamilyRelationshipSerializer(many=True, read_only=True)
    media_attachments = FamilyMediaSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FamilyGroup
        fields = [
            'id', 'name', 'description', 'address', 'island', 'is_public',
            'created_by', 'members', 'relationships', 'media_attachments',
            'member_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_member_count(self, obj):
        return obj.members.count()

class PersonCentricFamilyGroupSerializer(serializers.ModelSerializer):
    """Serializer for family groups with person-centric relationships (Phase 1 implementation)"""
    
    members = FamilyMemberWithEntrySerializer(many=True, read_only=True)
    all_relationships = serializers.SerializerMethodField()
    media_attachments = FamilyMediaSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FamilyGroup
        fields = [
            'id', 'name', 'description', 'address', 'island', 'is_public',
            'created_by', 'members', 'all_relationships', 'media_attachments',
            'member_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_member_count(self, obj):
        return obj.members.count()
    
    def get_all_relationships(self, obj):
        """Get ALL relationships for all members in this family group (person-centric approach)"""
        from .models import FamilyRelationship
        
        # Get all PIDs of members in this family group
        member_pids = [member.entry.pid for member in obj.members.all()]
        
        if not member_pids:
            return []
        
        # Get ALL relationships involving any of these members (across all family groups)
        all_relationships = FamilyRelationship.objects.filter(
            models.Q(person1__pid__in=member_pids) | models.Q(person2__pid__in=member_pids)
        ).select_related('person1', 'person2', 'family_group').distinct()
        
        # Serialize the relationships
        serializer = EnhancedFamilyRelationshipSerializer(all_relationships, many=True)
        return serializer.data

class PhoneBookEntryWithMediaSerializer(serializers.ModelSerializer):
    """Enhanced phone book entry serializer with media and events"""
    
    media_attachments = FamilyMediaSerializer(many=True, read_only=True)
    life_events = FamilyEventSerializer(many=True, read_only=True)
    
    class Meta:
        model = PhoneBookEntry
        fields = [
            'pid', 'name', 'contact', 'address', 'island',
            'media_attachments', 'life_events'
        ]
        read_only_fields = ['pid']