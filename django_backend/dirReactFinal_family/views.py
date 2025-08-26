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
                serializer = self.get_serializer(family_group)
                return Response(serializer.data)
            else:
                return Response({'error': 'No family group found for this address'}, status=status.HTTP_404_NOT_FOUND)
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
                
                # Find the family group to delete
                if family_group_id:
                    print(f"DEBUG: Looking up family group by ID: {family_group_id}")
                    try:
                        family_group = FamilyGroup.objects.get(id=family_group_id)
                    except FamilyGroup.DoesNotExist:
                        return Response(
                            {'error': f'Family group with ID {family_group_id} not found'}, 
                            status=status.HTTP_404_NOT_FOUND
                        )
                else:
                    print(f"DEBUG: Looking up family group by address: {address}, {island}")
                    family_group = FamilyGroup.get_by_address(address, island)
                    if not family_group:
                        return Response(
                            {'error': 'No family group found for this address'}, 
                            status=status.HTTP_404_NOT_FOUND
                        )
                
                print(f"DEBUG: Found family group: {family_group.id} - {family_group.name}")
                
                # Get family info before deletion for logging
                family_name = family_group.name
                family_address = family_group.address
                family_island = family_group.island
                member_count = family_group.members.count()
                relationship_count = family_group.relationships.count()
                
                print(f"DEBUG: Family has {member_count} members and {relationship_count} relationships")
                print(f"DEBUG: Family details - Name: {family_name}, Address: {family_address}, Island: {family_island}")
                
                # Store member information for confirmation (without deleting entries)
                members_info = []
                for member in family_group.members.all():
                    print(f"DEBUG: Processing member: {member.entry.name} (PID: {member.entry.pid})")
                    members_info.append({
                        'entry_id': member.entry.pid,
                        'name': member.entry.name,
                        'contact': member.entry.contact,
                        'address': member.entry.address,
                        'island': member.entry.island
                    })
                
                print(f"DEBUG: Stored info for {len(members_info)} members")
                
                # Clear family_group_id references in PhoneBookEntry records
                print("DEBUG: Clearing family_group_id references in PhoneBookEntry records")
                from dirReactFinal_directory.models import PhoneBookEntry
                try:
                    # First, let's check if there are any records to update
                    records_to_update = PhoneBookEntry.objects.filter(family_group_id=family_group.id)
                    print(f"DEBUG: Found {records_to_update.count()} PhoneBookEntry records to update")
                    
                    if records_to_update.exists():
                        updated_count = records_to_update.update(family_group_id=None)
                        print(f"DEBUG: Updated {updated_count} PhoneBookEntry records")
                        
                        # Verify the update was successful
                        remaining_refs = PhoneBookEntry.objects.filter(family_group_id=family_group.id).count()
                        if remaining_refs > 0:
                            print(f"DEBUG: Warning - {remaining_refs} PhoneBookEntry records still reference family group")
                        else:
                            print("DEBUG: All PhoneBookEntry references cleared successfully")
                    else:
                        print("DEBUG: No PhoneBookEntry records found to update")
                        
                except Exception as e:
                    print(f"DEBUG: Error updating PhoneBookEntry records: {str(e)}")
                    raise Exception(f"Failed to clear family group references: {str(e)}")
                
                # Delete family associations (members and relationships) but NOT the phonebook entries
                print("DEBUG: Deleting family members")
                try:
                    family_group.members.all().delete()
                    print("DEBUG: Family members deleted successfully")
                except Exception as e:
                    print(f"DEBUG: Error deleting family members: {str(e)}")
                    raise Exception(f"Failed to delete family members: {str(e)}")
                
                print("DEBUG: Deleting family relationships")
                try:
                    family_group.relationships.all().delete()
                    print("DEBUG: Family relationships deleted successfully")
                except Exception as e:
                    print(f"DEBUG: Error deleting family relationships: {str(e)}")
                    raise Exception(f"Failed to delete family relationships: {str(e)}")
                
                # Delete the family group itself
                print("DEBUG: Deleting family group")
                try:
                    family_group.delete()
                    print("DEBUG: Family group deleted successfully")
                except Exception as e:
                    print(f"DEBUG: Error deleting family group: {str(e)}")
                    raise Exception(f"Failed to delete family group: {str(e)}")
                
                print("DEBUG: Family deletion completed successfully")
                
                return Response({
                    'message': f'Successfully deleted family "{family_name}" at {family_address}, {family_island}',
                    'details': {
                        'family_name': family_name,
                        'address': family_address,
                        'island': family_island,
                        'members_removed': member_count,
                        'relationships_removed': relationship_count,
                        'phonebook_entries_preserved': len(members_info),
                        'preserved_members': members_info
                    }
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            import traceback
            print(f"DEBUG: Exception occurred: {str(e)}")
            print(f"DEBUG: Traceback: {traceback.format_exc()}")
            
            # Provide more specific error information
            error_message = str(e)
            if "foreign key constraint" in error_message.lower():
                error_message = "Database constraint violation - family group has active references"
            elif "does not exist" in error_message.lower():
                error_message = "Family group not found or already deleted"
            elif "permission" in error_message.lower():
                error_message = "Permission denied - insufficient privileges"
            elif "database is locked" in error_message.lower():
                error_message = "Database is locked - another operation may be in progress"
            elif "timeout" in error_message.lower():
                error_message = "Database operation timed out"
            
            return Response(
                {'error': f'Failed to delete family: {error_message}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
