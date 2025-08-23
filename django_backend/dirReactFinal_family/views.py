# 2025-01-27: Family tree views for dirReactFinal migration project
# Based on existing Flask family tree functionality

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.contrib.auth import get_user_model

from .models import FamilyGroup, FamilyMember, FamilyRelationship
from .serializers import (
    FamilyGroupSerializer, 
    FamilyMemberSerializer, 
    FamilyRelationshipSerializer,
    FamilyGroupDetailSerializer,
    FamilyMemberDetailSerializer
)

User = get_user_model()

class FamilyGroupViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing family groups
    """
    queryset = FamilyGroup.objects.all()
    serializer_class = FamilyGroupSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter queryset based on user permissions and search"""
        queryset = FamilyGroup.objects.all()
        
        # Search by name or description
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search)
            )
        
        # Filter by creator
        created_by = self.request.query_params.get('created_by', None)
        if created_by:
            queryset = queryset.filter(created_by_id=created_by)
        
        # Filter by privacy (public/private)
        is_public = self.request.query_params.get('is_public', None)
        if is_public is not None:
            if is_public.lower() == 'true':
                queryset = queryset.filter(is_public=True)
            elif is_public.lower() == 'false':
                queryset = queryset.filter(is_public=False)
        
        # Add member count annotation
        queryset = queryset.annotate(member_count=Count('members'))
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        """Use detailed serializer for retrieve actions"""
        if self.action in ['retrieve', 'list']:
            return FamilyGroupDetailSerializer
        return FamilyGroupSerializer
    
    def perform_create(self, serializer):
        """Set the creator when creating a family group"""
        serializer.save(created_by=self.request.user)
    
    def perform_update(self, serializer):
        """Ensure only creator or admins can update"""
        family_group = self.get_object()
        if family_group.created_by != self.request.user and not self.request.user.is_staff:
            raise permissions.PermissionDenied("Only the creator or admins can update this family group")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Ensure only creator or admins can delete"""
        if instance.created_by != self.request.user and not self.request.user.is_staff:
            raise permissions.PermissionDenied("Only the creator or admins can delete this family group")
        instance.delete()
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get all members of a family group"""
        family_group = self.get_object()
        members = FamilyMember.objects.filter(family_group=family_group)
        serializer = FamilyMemberDetailSerializer(members, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def relationships(self, request, pk=None):
        """Get all relationships in a family group"""
        family_group = self.get_object()
        relationships = FamilyRelationship.objects.filter(family_group=family_group)
        serializer = FamilyRelationshipSerializer(relationships, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get statistics for a family group"""
        family_group = self.get_object()
        member_count = family_group.members.count()
        relationship_count = family_group.relationships.count()
        
        stats = {
            'id': family_group.id,
            'name': family_group.name,
            'member_count': member_count,
            'relationship_count': relationship_count,
            'created_at': family_group.created_at,
            'updated_at': family_group.updated_at,
        }
        
        return Response(stats)

class FamilyMemberViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing family members
    """
    queryset = FamilyMember.objects.all()
    serializer_class = FamilyMemberSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter by family group and other parameters"""
        queryset = FamilyMember.objects.all()
        
        family_id = self.kwargs.get('family_pk')
        if family_id:
            queryset = queryset.filter(family_group_id=family_id)
        
        # Search by member name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(entry__name__icontains=search)
        
        # Filter by role
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role_in_family__icontains=role)
        
        return queryset.order_by('entry__name')
    
    def get_serializer_class(self):
        """Use detailed serializer for retrieve actions"""
        if self.action in ['retrieve', 'list']:
            return FamilyMemberDetailSerializer
        return FamilyMemberSerializer
    
    def perform_create(self, serializer):
        """Set the family group when creating a member"""
        family_id = self.kwargs.get('family_pk')
        family_group = get_object_or_404(FamilyGroup, id=family_id)
        
        # Check if user has permission to add members
        if family_group.created_by != self.request.user and not self.request.user.is_staff:
            raise permissions.PermissionDenied("Only the creator or admins can add members")
        
        serializer.save(family_group=family_group)
    
    def perform_update(self, serializer):
        """Ensure only creator or admins can update"""
        family_member = self.get_object()
        family_group = family_member.family_group
        
        if family_group.created_by != self.request.user and not self.request.user.is_staff:
            raise permissions.PermissionDenied("Only the creator or admins can update members")
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Ensure only creator or admins can remove"""
        family_group = instance.family_group
        
        if family_group.created_by != self.request.user and not self.request.user.is_staff:
            raise permissions.PermissionDenied("Only the creator or admins can remove members")
        
        instance.delete()

class FamilyRelationshipViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing family relationships
    """
    queryset = FamilyRelationship.objects.all()
    serializer_class = FamilyRelationshipSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter by family group"""
        queryset = FamilyRelationship.objects.all()
        
        family_id = self.kwargs.get('family_pk')
        if family_id:
            queryset = queryset.filter(family_group_id=family_id)
        
        return queryset.order_by('person1__name')
    
    def perform_create(self, serializer):
        """Set the family group when creating a relationship"""
        family_id = self.kwargs.get('family_pk')
        family_group = get_object_or_404(FamilyGroup, id=family_id)
        
        # Check if user has permission to add relationships
        if family_group.created_by != self.request.user and not self.request.user.is_staff:
            raise permissions.PermissionDenied("Only the creator or admins can add relationships")
        
        serializer.save(family_group=family_group)
    
    def perform_update(self, serializer):
        """Ensure only creator or admins can update"""
        relationship = self.get_object()
        family_group = relationship.family_group
        
        if family_group.created_by != self.request.user and not self.request.user.is_staff:
            raise permissions.PermissionDenied("Only the creator or admins can update relationships")
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Ensure only creator or admins can delete"""
        family_group = instance.family_group
        
        if family_group.created_by != self.request.user and not self.request.user.is_staff:
            raise permissions.PermissionDenied("Only the creator or admins can delete relationships")
        
        instance.delete()
