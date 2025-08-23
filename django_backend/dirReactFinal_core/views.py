from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .serializers import IslandSerializer
from .models import Island

# Create your views here.

@api_view(['GET'])
@permission_classes([AllowAny])
def get_islands(request):
    """Get all active islands for search functionality"""
    try:
        # Get all active islands, ordered by name
        islands = Island.objects.filter(is_active=True).order_by('name')
        
        # Serialize the data
        serializer = IslandSerializer(islands, many=True)
        
        return Response({
            'success': True,
            'islands': serializer.data,
            'count': islands.count()
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)
