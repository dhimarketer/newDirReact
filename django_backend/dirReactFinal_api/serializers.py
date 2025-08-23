# 2025-01-27: API serializers for dirReactFinal migration project
# Serializers for converting Django models to JSON and vice versa

from rest_framework import serializers
from django.contrib.auth import authenticate
from dirReactFinal_core.models import User, UserPermission, EventLog
from dirReactFinal_directory.models import PhoneBookEntry, Image
from dirReactFinal_family.models import FamilyGroup, FamilyMember
from dirReactFinal_moderation.models import PendingChange, PhotoModeration
from dirReactFinal_scoring.models import ScoreTransaction, RewardRule

# User Authentication Serializers
class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include username and password')
        
        return attrs

class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'user_type']
        extra_kwargs = {
            'password': {'write_only': True},
            'password_confirm': {'write_only': True}
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'user_type', 'relatedto', 'status', 
                 'score', 'spam_score', 'warning_count', 'is_banned', 'join_date', 'is_staff', 'is_superuser',
                 'eula_agreed_date', 'last_spam_check']
        read_only_fields = ['id', 'join_date', 'is_staff', 'is_superuser']

# Directory Management Serializers
class PhoneBookEntrySerializer(serializers.ModelSerializer):
    """Serializer for phonebook entries"""
    age = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PhoneBookEntry
        fields = ['pid', 'nid', 'name', 'contact', 'address', 'atoll', 'island', 
                 'street', 'ward', 'party', 'DOB', 'status', 'remark', 
                 'email', 'gender', 'extra', 'profession', 'pep_status',
                 'change_status', 'requested_by', 'batch', 'image_status', 'family_group_id',
                 'age', 'image_url']  # 2025-08-22: Added missing age and image_url fields
        read_only_fields = ['pid']  # pid is the primary key
    
    def get_age(self, obj):
        return obj.get_age()
    
    def get_image_url(self, obj):
        # Since we don't have actual image files, return a placeholder or None
        return None

class PhoneBookEntryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating phonebook entries"""
    class Meta:
        model = PhoneBookEntry
        fields = ['nid', 'name', 'contact', 'address', 'atoll', 'island', 
                 'street', 'ward', 'party', 'DOB', 'status', 'remark', 
                 'email', 'gender', 'extra', 'profession', 'pep_status']
    
    def validate_contact(self, value):
        """Validate contact number format"""
        if not value.isdigit() or len(value) < 7:
            raise serializers.ValidationError("Contact number must be at least 7 digits")
        return value

class PhoneBookEntryWithImageSerializer(serializers.ModelSerializer):
    """Serializer for phonebook entries with detailed image information for premium search"""
    age = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    image_filename = serializers.SerializerMethodField()
    image_upload_date = serializers.SerializerMethodField()
    pep_status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = PhoneBookEntry
        fields = [
            'pid', 'nid', 'name', 'contact', 'address', 'atoll', 'island', 
            'street', 'ward', 'party', 'DOB', 'status', 'remark', 
            'email', 'gender', 'extra', 'profession', 'pep_status',
            'age', 'image_url', 'image_filename', 'image_upload_date',
            'pep_status_display'
        ]
        read_only_fields = ['pid']  # pid is the primary key
    
    def get_age(self, obj):
        return obj.get_age()
    
    def get_image_url(self, obj):
        # Check if entry has an image status and return the URL
        if obj.image_status and obj.image_status != '0':
            # Check if the image file actually exists
            import os
            from django.conf import settings
            image_path = os.path.join(settings.MEDIA_ROOT, 'contact_photos', obj.image_status)
            if os.path.exists(image_path):
                # Return relative URL that will work in both development and production
                return f'/media/contact_photos/{obj.image_status}'
            else:
                # File doesn't exist, return None
                return None
        return None
    
    def get_image_filename(self, obj):
        # Return the image_status as filename if it exists
        if obj.image_status and obj.image_status != '0':
            return obj.image_status
        return None
    
    def get_image_upload_date(self, obj):
        # Since we don't have upload date in image_status, return None for now
        # Could be extracted from filename if it contains timestamp
        return None
    
    def get_pep_status_display(self, obj):
        if obj.pep_status == '1':
            return 'Politically Exposed Person'
        elif obj.pep_status == '0':
            return 'Not PEP'
        elif obj.pep_status and obj.pep_status.strip():
            return f'Status: {obj.pep_status}'
        return 'Unknown'

class ImageSerializer(serializers.ModelSerializer):
    """Serializer for contact images"""
    entry_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Image
        fields = ['id', 'filename', 'entry_id', 'entry_name', 'last_modified']
        read_only_fields = ['id', 'last_modified']
    
    def get_entry_name(self, obj):
        try:
            entry = PhoneBookEntry.objects.get(pid=obj.entry_id)
            return entry.name
        except PhoneBookEntry.DoesNotExist:
            return 'Unknown Entry'

# Family Management Serializers
class FamilyMemberSerializer(serializers.ModelSerializer):
    """Serializer for family members"""
    member_name = serializers.CharField(source='member.name', read_only=True)
    
    class Meta:
        model = FamilyMember
        fields = ['id', 'family_group', 'member', 'member_name', 'relationship_type', 
                 'is_primary', 'joined_date']
        read_only_fields = ['id', 'joined_date']

class FamilyGroupSerializer(serializers.ModelSerializer):
    """Serializer for family groups"""
    members = FamilyMemberSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FamilyGroup
        fields = ['id', 'name', 'description', 'created_by', 'created_at', 
                 'updated_at', 'members', 'member_count']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_member_count(self, obj):
        return obj.members.count()

# Moderation Serializers
class PendingChangeSerializer(serializers.ModelSerializer):
    """Serializer for pending changes"""
    entry_name = serializers.CharField(source='entry.name', read_only=True)
    requester_name = serializers.CharField(source='requested_by.username', read_only=True)
    
    class Meta:
        model = PendingChange
        fields = ['id', 'entry', 'entry_name', 'change_type', 'new_data', 
                 'requested_by', 'requester_name', 'status', 
                 'created_at', 'updated_at', 'reviewed_by', 'review_date', 'review_notes']
        read_only_fields = ['id', 'created_at', 'updated_at']

class PhotoModerationSerializer(serializers.ModelSerializer):
    """Serializer for photo moderation"""
    entry_name = serializers.CharField(source='entry.name', read_only=True)
    
    class Meta:
        model = PhotoModeration
        fields = ['id', 'entry', 'entry_name', 'image', 'status', 'submitted_by', 
                 'submitted_at', 'reviewed_at', 'reviewed_by', 'rejection_reason']
        read_only_fields = ['id', 'submitted_at']

# Scoring Serializers
class ScoreTransactionSerializer(serializers.ModelSerializer):
    """Serializer for score transactions"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = ScoreTransaction
        fields = ['id', 'user', 'user_name', 'transaction_type', 'points', 
                 'description', 'related_entry', 'timestamp']
        read_only_fields = ['id', 'timestamp']

class RewardRuleSerializer(serializers.ModelSerializer):
    """Serializer for reward rules"""
    class Meta:
        model = RewardRule
        fields = ['id', 'rule_name', 'action_type', 'points', 'conditions', 
                 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

# Event Log Serializer
class EventLogSerializer(serializers.ModelSerializer):
    """Serializer for event logs"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = EventLog
        fields = ['id', 'user', 'user_name', 'event_type', 'description', 
                 'ip_address', 'user_agent', 'timestamp']
        read_only_fields = ['id', 'timestamp']

# Search and Filter Serializers
class SearchSerializer(serializers.Serializer):
    """Serializer for search requests"""
    query = serializers.CharField(max_length=200, required=False, allow_blank=True)
    name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    contact = serializers.CharField(max_length=20, required=False, allow_blank=True)
    nid = serializers.CharField(max_length=20, required=False, allow_blank=True)
    address = serializers.CharField(max_length=500, required=False, allow_blank=True)
    atoll = serializers.CharField(max_length=100, required=False, allow_blank=True)
    island = serializers.CharField(max_length=100, required=False, allow_blank=True)
    party = serializers.CharField(max_length=100, required=False, allow_blank=True)
    profession = serializers.CharField(max_length=100, required=False, allow_blank=True)
    gender = serializers.CharField(max_length=10, required=False, allow_blank=True)
    min_age = serializers.IntegerField(required=False, min_value=0)
    max_age = serializers.IntegerField(required=False, min_value=0)
    remark = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    pep_status = serializers.CharField(max_length=20, required=False, allow_blank=True)
    page = serializers.IntegerField(required=False, default=1, min_value=1)
    page_size = serializers.IntegerField(required=False, default=20, min_value=1, max_value=100)

class BulkOperationSerializer(serializers.Serializer):
    """Serializer for bulk operations"""
    operation = serializers.ChoiceField(choices=['delete', 'update_status', 'export'])
    entry_ids = serializers.ListField(child=serializers.IntegerField())
    update_data = serializers.DictField(required=False)
