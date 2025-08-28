# 2025-01-27: Family tree serializers for dirReactFinal migration project
# Based on existing Flask family tree functionality

from rest_framework import serializers
from dirReactFinal_directory.models import PhoneBookEntry
from .models import FamilyGroup, FamilyMember, FamilyRelationship

class PhoneBookEntrySerializer(serializers.ModelSerializer):
    """Serializer for phone book entries in family context"""
    age = serializers.SerializerMethodField()  # 2025-01-28: Added age field for reliable age calculation
    
    class Meta:
        model = PhoneBookEntry
        fields = ['pid', 'name', 'contact', 'island', 'address', 'party', 'DOB', 'gender', 'age']  # 2025-01-28: Added age field
    
    def get_age(self, obj):
        """2025-01-28: Get age using reliable backend calculation method"""
        return obj.get_age()

class FamilyGroupSerializer(serializers.ModelSerializer):
    """Basic serializer for family groups"""
    created_by = serializers.ReadOnlyField(source='created_by.username')
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FamilyGroup
        fields = [
            'id', 'name', 'description', 'address', 'island', 'created_by', 'created_at', 
            'updated_at', 'member_count'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_member_count(self, obj):
        """Get the number of members in this family group"""
        if hasattr(obj, 'member_count'):
            return obj.member_count
        return obj.members.count()

class FamilyGroupDetailSerializer(FamilyGroupSerializer):
    """Detailed serializer for family groups with nested members"""
    members = serializers.SerializerMethodField()
    relationships = serializers.SerializerMethodField()
    
    class Meta(FamilyGroupSerializer.Meta):
        fields = FamilyGroupSerializer.Meta.fields + ['members', 'relationships']
    
    def get_members(self, obj):
        """Get detailed member information including full entry data"""
        members = obj.members.all()[:10]  # Limit to first 10 for performance
        return FamilyMemberDetailSerializer(members, many=True).data
    
    def get_relationships(self, obj):
        """Get basic relationship information"""
        relationships = obj.relationships.all()[:10]  # Limit to first 10 for performance
        return FamilyRelationshipSerializer(relationships, many=True).data

class FamilyMemberSerializer(serializers.ModelSerializer):
    """Basic serializer for family members"""
    entry_name = serializers.ReadOnlyField(source='entry.name')
    entry_phone = serializers.ReadOnlyField(source='entry.phone_number')
    family_group_name = serializers.ReadOnlyField(source='family_group.name')
    
    class Meta:
        model = FamilyMember
        fields = [
            'id', 'entry', 'entry_name', 'entry_phone', 'family_group', 
            'family_group_name', 'role_in_family', 'joined_at'
        ]
        read_only_fields = ['id', 'joined_at']
    
    def validate(self, data):
        """Validate that the entry is not already a member of this family group"""
        entry = data.get('entry')
        family_group = data.get('family_group')
        
        if entry and family_group:
            existing_member = FamilyMember.objects.filter(
                entry=entry, 
                family_group=family_group
            ).exclude(id=self.instance.id if self.instance else None)
            
            if existing_member.exists():
                raise serializers.ValidationError(
                    "This person is already a member of this family group"
                )
        
        return data

class FamilyMemberDetailSerializer(FamilyMemberSerializer):
    """Detailed serializer for family members with full entry information"""
    entry = PhoneBookEntrySerializer(read_only=True)
    
    class Meta(FamilyMemberSerializer.Meta):
        fields = FamilyMemberSerializer.Meta.fields + ['entry']

class FamilyRelationshipSerializer(serializers.ModelSerializer):
    """Basic serializer for family relationships"""
    person1_name = serializers.ReadOnlyField(source='person1.name')
    person2_name = serializers.ReadOnlyField(source='person2.name')
    family_group_name = serializers.ReadOnlyField(source='family_group.name')
    relationship_type_display = serializers.ReadOnlyField(source='get_relationship_type_display')
    
    class Meta:
        model = FamilyRelationship
        fields = [
            'id', 'person1', 'person1_name', 'person2', 'person2_name',
            'relationship_type', 'relationship_type_display', 'family_group',
            'family_group_name', 'notes', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate relationship data"""
        person1 = data.get('person1')
        person2 = data.get('person2')
        relationship_type = data.get('relationship_type')
        family_group = data.get('family_group')
        
        # Ensure person1 and person2 are different
        if person1 and person2 and person1 == person2:
            raise serializers.ValidationError(
                "A person cannot have a relationship with themselves"
            )
        
        # Check if this relationship already exists
        if person1 and person2 and family_group:
            existing_relationship = FamilyRelationship.objects.filter(
                person1=person1,
                person2=person2,
                family_group=family_group,
                relationship_type=relationship_type
            ).exclude(id=self.instance.id if self.instance else None)
            
            if existing_relationship.exists():
                raise serializers.ValidationError(
                    "This relationship already exists in this family group"
                )
        
        return data

class FamilyRelationshipDetailSerializer(FamilyRelationshipSerializer):
    """Detailed serializer for family relationships with full person information"""
    person1 = PhoneBookEntrySerializer(read_only=True)
    person2 = PhoneBookEntrySerializer(read_only=True)
    
    class Meta(FamilyRelationshipSerializer.Meta):
        fields = FamilyRelationshipSerializer.Meta.fields + ['person1', 'person2']

class FamilyGroupCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating family groups"""
    class Meta:
        model = FamilyGroup
        fields = ['name', 'description', 'address', 'island']
    
    def create(self, validated_data):
        """Create a new family group"""
        user = self.context['request'].user
        return FamilyGroup.objects.create(
            created_by=user,
            **validated_data
        )

class FamilyMemberCreateSerializer(serializers.ModelSerializer):
    """Serializer for adding family members"""
    class Meta:
        model = FamilyMember
        fields = ['entry', 'role_in_family']
    
    def create(self, validated_data):
        """Create a new family member"""
        family_group = self.context['family_group']
        return FamilyMember.objects.create(
            family_group=family_group,
            **validated_data
        )

class FamilyRelationshipCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating family relationships"""
    class Meta:
        model = FamilyRelationship
        fields = ['person1', 'person2', 'relationship_type', 'notes']
    
    def create(self, validated_data):
        """Create a new family relationship"""
        family_group = self.context['family_group']
        return FamilyRelationship.objects.create(
            family_group=family_group,
            **validated_data
        )
