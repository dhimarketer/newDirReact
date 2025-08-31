# 2025-01-27: Family tree views for dirReactFinal migration project
# Based on existing Flask family tree functionality

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.contrib.auth import get_user_model
from django.db import transaction

from .models import FamilyGroup, FamilyMember, FamilyRelationship
from .serializers import (
    FamilyGroupSerializer, 
    FamilyMemberSerializer, 
    FamilyRelationshipSerializer,
    FamilyGroupDetailSerializer,
    FamilyMemberDetailSerializer
)
from dirReactFinal_directory.models import PhoneBookEntry

User = get_user_model()

class FamilyGroupViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing family groups
    """
    queryset = FamilyGroup.objects.all()
    serializer_class = FamilyGroupSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """Override permissions for specific actions"""
        if self.action in ['by_address', 'infer_family']:
            # 2025-01-28: FIXED - Allow public access to by_address and infer_family endpoints for family tree functionality
            return [permissions.AllowAny()]
        return super().get_permissions()
    
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
            if created_by == 'me':
                # Filter by current user
                queryset = queryset.filter(created_by=self.request.user)
            else:
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
    
    # 2025-01-28: REMOVED: Conflicting relationships action - nested router provides full CRUD functionality
    # @action(detail=True, methods=['get'])
    # def relationships(self, request, pk=None):
    #     """Get all relationships in a family group"""
    #     family_group = self.get_object()
    #     relationships = FamilyRelationship.objects.filter(family_group=family_group)
    #     serializer = FamilyRelationshipSerializer(relationships, many=True)
    #     return Response(serializer.data)
    
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
    
    @action(detail=False, methods=['get'])
    def by_address(self, request):
        """Get family group by address and island"""
        address = request.query_params.get('address')
        island = request.query_params.get('island')
        
        if not address or not island:
            return Response(
                {'error': 'Both address and island parameters are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            family_group = FamilyGroup.get_by_address(address, island)
            if family_group:
                # 2025-01-28: FIXED - Use FamilyGroupDetailSerializer to include members and relationships
                from .serializers import FamilyGroupDetailSerializer
                serializer = FamilyGroupDetailSerializer(family_group)
                return Response(serializer.data)
            else:
                # 2025-01-28: FIXED - Updated error message to reflect that family groups can be created for all addresses
                return Response({
                    'error': 'No family group found for this address',
                    'message': 'Family groups can be created for any address. If no family group exists, try creating one or contact an administrator.',
                    'address': address,
                    'island': island,
                    'suggestion': 'Try creating a family group or search for a different address'
                }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def create_or_update_by_address(self, request):
        """Create or update family group by address and island"""
        address = request.data.get('address')
        island = request.data.get('island')
        members = request.data.get('members', [])
        relationships = request.data.get('relationships', [])
        
        if not address or not island:
            return Response(
                {'error': 'Both address and island are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # 2025-01-28: ENHANCED - Use automatic family inference if no explicit data provided
            if not members and not relationships:
                print(f"DEBUG: No explicit members/relationships provided - using automatic family inference")
                family_group = FamilyGroup.infer_family_from_address(address, island, request.user)
                
                if family_group:
                    print(f"DEBUG: Successfully auto-inferred family group {family_group.id}")
                    serializer = self.get_serializer(family_group)
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                else:
                    print(f"DEBUG: No family could be inferred - creating empty family group")
                    # Create empty family group if inference fails
                    family_group = FamilyGroup.objects.create(
                        name=f"Family at {address}",
                        description=f"Family from {address}, {island}",
                        address=address,
                        island=island,
                        created_by=request.user
                    )
                    serializer = self.get_serializer(family_group)
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            # Try to get existing family group
            family_group = FamilyGroup.get_by_address(address, island)
            
            if family_group:
                # Update existing family group
                if family_group.created_by != request.user and not request.user.is_staff:
                    return Response(
                        {'error': 'Only the creator or admins can update this family group'}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # 2025-01-28: FIXED: Preserve existing relationships while updating members
                # 2025-01-28: This prevents loss of original family structure when adding new relationships
                print(f"DEBUG: Updating existing family group {family_group.id} - preserving relationships")
                
                # Update members (replace completely as requested)
                family_group.members.all().delete()
                
                # 2025-01-28: CRITICAL: Do NOT delete existing relationships - merge with new ones
                # 2025-01-28: This preserves the original family structure while allowing additions
                existing_relationships = list(family_group.relationships.all())
                print(f"DEBUG: Preserving {len(existing_relationships)} existing relationships")
                
                # 2025-01-28: Create a set of existing relationship pairs to avoid duplicates
                existing_pairs = set()
                for rel in existing_relationships:
                    pair = tuple(sorted([rel.person1.pid, rel.person2.pid]))
                    existing_pairs.add(pair)
                
                print(f"DEBUG: Existing relationship pairs: {existing_pairs}")
            else:
                # Create new family group
                family_group = FamilyGroup.objects.create(
                    name=f"Family at {address}",
                    description=f"Family from {address}, {island}",
                    address=address,
                    island=island,
                    created_by=request.user
                )
                existing_relationships = []
                existing_pairs = set()
                print(f"DEBUG: Created new family group {family_group.id}")
            
            # Add members
            for member_data in members:
                entry_id = member_data.get('entry_id')
                role = member_data.get('role', 'member')
                
                if entry_id:
                    try:
                        # 2025-01-28: Fixed to use pid field instead of id for PhoneBookEntry
                        entry = PhoneBookEntry.objects.get(pid=entry_id)
                        FamilyMember.objects.create(
                            entry=entry,
                            family_group=family_group,
                            role_in_family=role
                        )
                    except PhoneBookEntry.DoesNotExist:
                        continue
            
            # 2025-01-28: ENHANCED: Add relationships with duplicate prevention
            relationships_added = 0
            relationships_skipped = 0
            
            for rel_data in relationships:
                person1_id = rel_data.get('person1_id')
                person2_id = rel_data.get('person2_id')
                rel_type = rel_data.get('relationship_type')
                notes = rel_data.get('notes', '')
                
                if person1_id and person2_id and rel_type:
                    try:
                        # 2025-01-28: Fixed to use pid field instead of id for PhoneBookEntry
                        person1 = PhoneBookEntry.objects.get(pid=person1_id)
                        person2 = PhoneBookEntry.objects.get(pid=person2_id)
                        
                        # 2025-01-28: Check if this relationship already exists to prevent duplicates
                        pair = tuple(sorted([person1_id, person2_id]))
                        if pair in existing_pairs:
                            print(f"DEBUG: Skipping duplicate relationship: {person1.name} -> {person2.name} ({rel_type})")
                            relationships_skipped += 1
                            continue
                        
                        # 2025-01-28: Create new relationship
                        FamilyRelationship.objects.create(
                            person1=person1,
                            person2=person2,
                            relationship_type=rel_type,
                            notes=notes,
                            family_group=family_group
                        )
                        
                        # 2025-01-28: Add to existing pairs to prevent future duplicates
                        existing_pairs.add(pair)
                        relationships_added += 1
                        
                        print(f"DEBUG: Created relationship: {person1.name} -> {person2.name} ({rel_type})")
                    except PhoneBookEntry.DoesNotExist:
                        continue
            
            print(f"DEBUG: Relationship update summary: {relationships_added} added, {relationships_skipped} skipped")
            
            # 2025-01-28: Return the updated family group with all relationships
            serializer = self.get_serializer(family_group)
            return Response(serializer.data, status=status.HTTP_200_OK if family_group else status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def infer_family(self, request):
        """
        2025-01-28: NEW - Dedicated endpoint for automatic family inference
        
        Automatically creates family groups and relationships based on:
        1. All members of the same address are assumed to be family by default
        2. The eldest two (female, male) with DOB are considered parents
        3. Parents to children shall have an age gap of at least 10 years
        4. People with no DOB are not considered parents
        5. 2025-01-28: ENHANCED - Works for both authenticated and unauthenticated users
        """
        address = request.data.get('address')
        island = request.data.get('island')
        
        if not address or not island:
            return Response(
                {'error': 'Both address and island are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            print(f"DEBUG: Family inference requested for {address}, {island}")
            print(f"DEBUG: User authenticated: {request.user.is_authenticated}")
            print(f"DEBUG: User: {request.user}")
            
            # 2025-01-28: ENHANCED - Handle unauthenticated users for public family tree generation
            user_for_creation = request.user if request.user.is_authenticated else None
            
            family_group = FamilyGroup.infer_family_from_address(address, island, user_for_creation)
            
            if family_group:
                print(f"DEBUG: Successfully inferred family group {family_group.id}")
                serializer = self.get_serializer(family_group)
                return Response({
                    'success': True,
                    'message': f'Family automatically inferred for {address}, {island}',
                    'data': serializer.data
                }, status=status.HTTP_201_CREATED)
            else:
                print(f"DEBUG: No family could be inferred for {address}, {island}")
                return Response({
                    'success': False,
                    'message': f'No family members found for {address}, {island}. Please ensure there are phonebook entries at this address.',
                    'data': None
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            print(f"ERROR: Family inference failed for {address}, {island}: {str(e)}")
            return Response({
                'success': False,
                'error': f'Failed to infer family: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def delete_updated_families(self, request):
        """
        Delete updated families while preserving users and names from addresses.
        This function removes family associations but keeps all phonebook entries intact.
        """
        print("=== DEBUG: delete_updated_families method called ===")
        # 2025-01-28: Added function to delete updated families while preserving users and names
        
        # Check if user is admin or staff
        if not request.user.is_staff:
            return Response(
                {'error': 'Only administrators can delete updated families'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get parameters
        address = request.data.get('address')
        island = request.data.get('island')
        family_group_id = request.data.get('family_group_id')
        
        print(f"DEBUG: delete_updated_families called with address={address}, island={island}, family_group_id={family_group_id}")
        print(f"DEBUG: Request data: {request.data}")
        print(f"DEBUG: Request user: {request.user.username} (staff: {request.user.is_staff})")
        
        # Validate parameters
        if not family_group_id and (not address or not island):
            return Response(
                {'error': 'Either family_group_id or both address and island are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate family_group_id if provided
        if family_group_id:
            try:
                family_group_id = int(family_group_id)
                if family_group_id <= 0:
                    return Response(
                        {'error': 'family_group_id must be a positive integer'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, TypeError):
                return Response(
                    {'error': 'family_group_id must be a valid integer'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        try:
            print("DEBUG: About to start database transaction")
            
            with transaction.atomic():
                print("DEBUG: Transaction started successfully")
                
                if family_group_id:
                    # Delete specific family group
                    try:
                        family_group = FamilyGroup.objects.get(id=family_group_id)
                        print(f"DEBUG: Found family group: {family_group.name}")
                        
                        # Delete family members and relationships
                        FamilyMember.objects.filter(family_group=family_group).delete()
                        FamilyRelationship.objects.filter(family_group=family_group).delete()
                        
                        # Delete the family group itself
                        family_group.delete()
                        
                        print(f"DEBUG: Successfully deleted family group {family_group_id}")
                        
                        return Response({
                            'success': True,
                            'message': f'Family group {family_group_id} deleted successfully'
                        }, status=status.HTTP_200_OK)
                        
                    except FamilyGroup.DoesNotExist:
                        return Response({
                            'success': False,
                            'error': f'Family group {family_group_id} not found'
                        }, status=status.HTTP_404_NOT_FOUND)
                        
                else:
                    # Delete families by address and island
                    families_to_delete = FamilyGroup.objects.filter(
                        address__iexact=address,
                        island__iexact=island
                    )
                    
                    if not families_to_delete.exists():
                        return Response({
                            'success': False,
                            'error': f'No family groups found for {address}, {island}'
                        }, status=status.HTTP_404_NOT_FOUND)
                    
                    deleted_count = 0
                    for family_group in families_to_delete:
                        print(f"DEBUG: Deleting family group: {family_group.name}")
                        
                        # Delete family members and relationships
                        FamilyMember.objects.filter(family_group=family_group).delete()
                        FamilyRelationship.objects.filter(family_group=family_group).delete()
                        
                        # Delete the family group itself
                        family_group.delete()
                        deleted_count += 1
                    
                    print(f"DEBUG: Successfully deleted {deleted_count} family groups")
                    
                    return Response({
                        'success': True,
                        'message': f'Successfully deleted {deleted_count} family groups for {address}, {island}'
                    }, status=status.HTTP_200_OK)
                    
        except Exception as e:
            print(f"ERROR: Failed to delete updated families: {str(e)}")
            return Response({
                'success': False,
                'error': f'Failed to delete updated families: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['patch'])
    def mark_manually_updated(self, request, pk=None):
        """
        2025-01-28: NEW - Mark family as manually updated by user
        
        This endpoint is called when the user makes manual changes to the family tree
        to preserve those changes from being overwritten by automatic inference.
        """
        family_group = self.get_object()
        
        try:
            # Mark the family as manually updated
            family_group.mark_as_manually_updated()
            
            return Response({
                'success': True,
                'message': f'Family {family_group.name} marked as manually updated'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"ERROR: Failed to mark family as manually updated: {str(e)}")
            return Response({
                'success': False,
                'error': f'Failed to mark family as manually updated: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

print("=== DEBUG: views.py file loaded successfully ===")
