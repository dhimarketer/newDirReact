# 2024-12-28: Phase 4 - Advanced API views for rich relationships, media, and events

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import FamilyGroup, FamilyMember, FamilyRelationship, FamilyMedia, FamilyEvent
from .serializers import (
    FamilyMediaSerializer, FamilyEventSerializer, EnhancedFamilyRelationshipSerializer,
    FamilyMemberSerializer, FamilyGroupSerializer, PhoneBookEntryWithMediaSerializer
)
from dirReactFinal_directory.models import PhoneBookEntry

class FamilyMediaViewSet(viewsets.ModelViewSet):
    """ViewSet for managing family media attachments"""
    
    queryset = FamilyMedia.objects.all()
    serializer_class = FamilyMediaSerializer
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by person, relationship, or family group
        person_id = self.request.query_params.get('person')
        relationship_id = self.request.query_params.get('relationship')
        family_group_id = self.request.query_params.get('family_group')
        
        if person_id:
            queryset = queryset.filter(person_id=person_id)
        if relationship_id:
            queryset = queryset.filter(relationship_id=relationship_id)
        if family_group_id:
            queryset = queryset.filter(family_group_id=family_group_id)
        
        return queryset
    
    def perform_create(self, serializer):
        # Set uploaded_by to current user if available
        if hasattr(self.request, 'user') and self.request.user.is_authenticated:
            serializer.save(uploaded_by=self.request.user.username)
        else:
            serializer.save(uploaded_by='anonymous')
    
    @action(detail=False, methods=['get'])
    def by_person(self, request):
        """Get all media for a specific person"""
        person_id = request.query_params.get('person_id')
        if not person_id:
            return Response({'error': 'person_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        media = self.get_queryset().filter(person_id=person_id)
        serializer = self.get_serializer(media, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_family_group(self, request):
        """Get all media for a specific family group"""
        family_group_id = request.query_params.get('family_group_id')
        if not family_group_id:
            return Response({'error': 'family_group_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        media = self.get_queryset().filter(family_group_id=family_group_id)
        serializer = self.get_serializer(media, many=True)
        return Response(serializer.data)

class FamilyEventViewSet(viewsets.ModelViewSet):
    """ViewSet for managing family life events"""
    
    queryset = FamilyEvent.objects.all()
    serializer_class = FamilyEventSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by person
        person_id = self.request.query_params.get('person')
        if person_id:
            queryset = queryset.filter(person_id=person_id)
        
        # Filter by event type
        event_type = self.request.query_params.get('event_type')
        if event_type:
            queryset = queryset.filter(event_type=event_type)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(event_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(event_date__lte=end_date)
        
        return queryset.order_by('-event_date')
    
    @action(detail=False, methods=['get'])
    def by_person(self, request):
        """Get all events for a specific person"""
        person_id = request.query_params.get('person_id')
        if not person_id:
            return Response({'error': 'person_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        events = self.get_queryset().filter(person_id=person_id)
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def timeline(self, request):
        """Get a timeline of events for multiple people"""
        person_ids = request.query_params.getlist('person_ids')
        if not person_ids:
            return Response({'error': 'person_ids is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        events = self.get_queryset().filter(person_id__in=person_ids)
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)

class EnhancedFamilyRelationshipViewSet(viewsets.ModelViewSet):
    """Enhanced ViewSet for family relationships with Phase 4 features"""
    
    queryset = FamilyRelationship.objects.all()
    serializer_class = EnhancedFamilyRelationshipSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by family group
        family_group_id = self.request.query_params.get('family_group')
        if family_group_id:
            queryset = queryset.filter(family_group_id=family_group_id)
        
        # Filter by person
        person_id = self.request.query_params.get('person')
        if person_id:
            queryset = queryset.filter(Q(person1_id=person_id) | Q(person2_id=person_id))
        
        # Filter by relationship type
        relationship_type = self.request.query_params.get('relationship_type')
        if relationship_type:
            queryset = queryset.filter(relationship_type=relationship_type)
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(relationship_status=status)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def by_person(self, request):
        """Get all relationships for a specific person"""
        person_id = request.query_params.get('person_id')
        if not person_id:
            return Response({'error': 'person_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        relationships = self.get_queryset().filter(Q(person1_id=person_id) | Q(person2_id=person_id))
        serializer = self.get_serializer(relationships, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_family_group(self, request):
        """Get all relationships for a specific family group"""
        family_group_id = request.query_params.get('family_group_id')
        if not family_group_id:
            return Response({'error': 'family_group_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        relationships = self.get_queryset().filter(family_group_id=family_group_id)
        serializer = self.get_serializer(relationships, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_media(self, request, pk=None):
        """Add media attachment to a relationship"""
        relationship = self.get_object()
        media_data = request.data.copy()
        media_data['relationship'] = relationship.id
        
        serializer = FamilyMediaSerializer(data=media_data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EnhancedFamilyGroupViewSet(viewsets.ModelViewSet):
    """Enhanced ViewSet for family groups with Phase 4 features"""
    
    queryset = FamilyGroup.objects.all()
    serializer_class = FamilyGroupSerializer
    
    @action(detail=True, methods=['get'])
    def complete_data(self, request, pk=None):
        """Get complete family data including relationships, media, and events"""
        family_group = self.get_object()
        
        # Get all members
        members = FamilyMember.objects.filter(family_group=family_group)
        member_serializer = FamilyMemberSerializer(members, many=True)
        
        # Get all relationships
        relationships = FamilyRelationship.objects.filter(family_group=family_group)
        relationship_serializer = EnhancedFamilyRelationshipSerializer(relationships, many=True)
        
        # Get all media
        media = FamilyMedia.objects.filter(family_group=family_group)
        media_serializer = FamilyMediaSerializer(media, many=True)
        
        # Get all events for family members
        member_ids = members.values_list('entry_id', flat=True)
        events = FamilyEvent.objects.filter(person_id__in=member_ids)
        event_serializer = FamilyEventSerializer(events, many=True)
        
        return Response({
            'family_group': self.get_serializer(family_group).data,
            'members': member_serializer.data,
            'relationships': relationship_serializer.data,
            'media': media_serializer.data,
            'events': event_serializer.data,
        })
    
    @action(detail=True, methods=['post'])
    def add_media(self, request, pk=None):
        """Add media attachment to a family group"""
        family_group = self.get_object()
        media_data = request.data.copy()
        media_data['family_group'] = family_group.id
        
        serializer = FamilyMediaSerializer(data=media_data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PersonWithMediaViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for phone book entries with media and events"""
    
    queryset = PhoneBookEntry.objects.all()
    serializer_class = PhoneBookEntryWithMediaSerializer
    
    @action(detail=True, methods=['get'])
    def complete_profile(self, request, pk=None):
        """Get complete person profile with all related data"""
        person = self.get_object()
        
        # Get all relationships
        relationships = FamilyRelationship.objects.filter(Q(person1=person) | Q(person2=person))
        relationship_serializer = EnhancedFamilyRelationshipSerializer(relationships, many=True)
        
        # Get all media
        media = FamilyMedia.objects.filter(person=person)
        media_serializer = FamilyMediaSerializer(media, many=True)
        
        # Get all events
        events = FamilyEvent.objects.filter(person=person)
        event_serializer = FamilyEventSerializer(events, many=True)
        
        return Response({
            'person': self.get_serializer(person).data,
            'relationships': relationship_serializer.data,
            'media': media_serializer.data,
            'events': event_serializer.data,
        })
