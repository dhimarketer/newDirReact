from rest_framework import serializers
from .models import Island

class IslandSerializer(serializers.ModelSerializer):
    """Serializer for Island model"""
    
    class Meta:
        model = Island
        fields = ['id', 'name', 'atoll', 'island_type', 'is_active']

