from rest_framework import serializers
from .models import Island, Party, Atoll

class IslandSerializer(serializers.ModelSerializer):
    """Serializer for Island model"""
    
    class Meta:
        model = Island
        fields = ['id', 'name', 'atoll', 'island_type', 'is_active']


class PartySerializer(serializers.ModelSerializer):
    """Serializer for Party model"""
    
    class Meta:
        model = Party
        fields = ['id', 'name', 'short_name', 'is_active']


class AtollSerializer(serializers.ModelSerializer):
    """Serializer for Atoll model"""
    
    class Meta:
        model = Atoll
        fields = ['id', 'name', 'code', 'is_active']