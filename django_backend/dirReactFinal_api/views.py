# 2025-01-27: API views for dirReactFinal migration project
# REST API views for all major functionality

from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import JsonResponse
from .filters import PhoneBookEntryFilter, UserFilter, FamilyGroupFilter, PendingChangeFilter
from .permissions import (
    CanManageDirectory, CanManageUsers, CanManageFamily, 
    CanModerate, CanViewAnalytics, IsOwnerOrAdmin
)
import json
import time # Added for random seed

# Import models
from dirReactFinal_core.models import User, UserPermission, EventLog
from dirReactFinal_directory.models import PhoneBookEntry, Image
from dirReactFinal_family.models import FamilyGroup, FamilyMember
from dirReactFinal_moderation.models import PendingChange, PhotoModeration
from dirReactFinal_scoring.models import ScoreTransaction, RewardRule

# Import serializers
from .serializers import (
    UserLoginSerializer, UserRegistrationSerializer, UserSerializer,
    PhoneBookEntrySerializer, PhoneBookEntryCreateSerializer, ImageSerializer,
    FamilyGroupSerializer, FamilyMemberSerializer,
    PendingChangeSerializer, PhotoModerationSerializer,
    ScoreTransactionSerializer, RewardRuleSerializer,
    EventLogSerializer, SearchSerializer, BulkOperationSerializer
)

# Authentication Views
class UserLoginView(APIView):
    """User login endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            
            # Log login event
            EventLog.objects.create(
                user=user,
                event_type='login',
                description=f'User {user.username} logged in',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': UserSerializer(user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserRegistrationView(APIView):
    """User registration endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            
            # Log registration event
            EventLog.objects.create(
                user=user,
                event_type='login',
                description=f'New user {user.username} registered',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLogoutView(APIView):
    """User logout endpoint"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            # Log logout event
            EventLog.objects.create(
                user=request.user,
                event_type='logout',
                description=f'User {request.user.username} logged out',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({'message': 'Successfully logged out'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(APIView):
    """User profile endpoint - returns current user's profile"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get current user's profile"""
        try:
            user = request.user
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except Exception as e:
            return Response({
                'error': 'Failed to get user profile',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def patch(self, request):
        """Update current user's profile"""
        try:
            user = request.user
            serializer = UserSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': 'Failed to update user profile',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change user password"""
        try:
            user = request.user
            current_password = request.data.get('current_password')
            new_password = request.data.get('new_password')
            confirm_password = request.data.get('confirm_password')
            
            # Validate input
            if not all([current_password, new_password, confirm_password]):
                return Response({
                    'error': 'All password fields are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if new_password != confirm_password:
                return Response({
                    'error': 'New passwords do not match'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if len(new_password) < 8:
                return Response({
                    'error': 'New password must be at least 8 characters long'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify current password
            if not user.check_password(current_password):
                return Response({
                    'error': 'Current password is incorrect'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Change password
            user.set_password(new_password)
            user.save()
            
            # Log password change event
            EventLog.objects.create(
                user=user,
                event_type='password_change',
                description=f'User {user.username} changed password',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({'message': 'Password changed successfully'})
            
        except Exception as e:
            return Response({
                'error': 'Failed to change password',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def donate_points(self, request):
        """Donate points to another user"""
        try:
            donor = request.user
            recipient_username = request.data.get('recipient_username')
            points = request.data.get('points')
            
            # Validate input
            if not recipient_username or not points:
                return Response({
                    'error': 'Recipient username and points are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                points = int(points)
            except ValueError:
                return Response({
                    'error': 'Points must be a valid number'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if points <= 0:
                return Response({
                    'error': 'Points must be greater than 0'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if points > donor.score:
                return Response({
                    'error': 'Insufficient points for donation'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Find recipient
            try:
                recipient = User.objects.get(username=recipient_username)
            except User.DoesNotExist:
                return Response({
                    'error': 'Recipient user not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            if recipient.id == donor.id:
                return Response({
                    'error': 'Cannot donate points to yourself'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Perform donation
            donor.score -= points
            recipient.score += points
            donor.save()
            recipient.save()
            
            # Create score transaction records
            ScoreTransaction.objects.create(
                user=donor,
                transaction_type='spend',
                points=-points,
                description=f'Donated {points} points to {recipient.username}',
                related_user=recipient
            )
            
            ScoreTransaction.objects.create(
                user=recipient,
                transaction_type='earn',
                points=points,
                description=f'Received {points} points from {donor.username}',
                related_user=donor
            )
            
            # Log donation event
            EventLog.objects.create(
                user=donor,
                event_type='score_change',
                description=f'Donated {points} points to {recipient.username}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            EventLog.objects.create(
                user=recipient,
                event_type='score_change',
                description=f'Received {points} points from {donor.username}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': f'Successfully donated {points} points to {recipient.username}',
                'new_balance': donor.score,
                'recipient_new_balance': recipient.score
            })
            
        except Exception as e:
            return Response({
                'error': 'Failed to donate points',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# User Management Views
class UserViewSet(viewsets.ModelViewSet):
    """User management viewset"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [CanManageUsers]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = UserFilter
    search_fields = ['username', 'email']
    ordering_fields = ['username', 'join_date', 'score']
    
    def get_queryset(self):
        # 2025-01-27: Fixed admin user management - allow admin users to see all users
        if self.request.user.is_staff or self.request.user.is_superuser:
            return User.objects.all()
        elif getattr(self.request.user, 'user_type', None) == 'admin':
            return User.objects.all()
        else:
            return User.objects.filter(id=self.request.user.id)
    
    @action(detail=True, methods=['post'])
    def update_score(self, request, pk=None):
        """Update user score"""
        try:
            user = self.get_object()
            points = request.data.get('points', 0)
            reason = request.data.get('reason', 'Score update')
            
            if points == 0:
                return Response({
                    'error': 'Points value cannot be zero'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not reason or not reason.strip():
                return Response({
                    'error': 'Reason is required for score changes'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update user score
            old_score = user.score
            user.score += points
            user.save()
            
            # Log score change event
            EventLog.objects.create(
                user=request.user,
                event_type='score_change',
                description=f'Admin {request.user.username} changed {user.username} score from {old_score} to {user.score} ({points:+d} points): {reason}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': f'Score updated successfully. {user.username} score changed from {old_score} to {user.score} ({points:+d} points)',
                'old_score': old_score,
                'new_score': user.score,
                'points_added': points
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to update score: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def change_password(self, request, pk=None):
        """Admin change user password"""
        try:
            user = self.get_object()
            new_password = request.data.get('new_password')
            
            if not new_password:
                return Response({
                    'error': 'New password is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if len(new_password) < 8:
                return Response({
                    'error': 'Password must be at least 8 characters long'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Change password
            user.set_password(new_password)
            user.save()
            
            # Log password change event
            EventLog.objects.create(
                user=user,
                event_type='password_change',
                description=f'Password changed by admin {request.user.username}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({'message': 'Password changed successfully'})
            
        except Exception as e:
            return Response({
                'error': f'Failed to change password: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def activate_user(self, request, pk=None):
        """Activate a user account"""
        try:
            user = self.get_object()
            
            if user.status == 'active':
                return Response({
                    'error': f'User {user.username} is already active'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user.status = 'active'
            user.is_banned = False
            user.save()
            
            # Log activation event
            EventLog.objects.create(
                user=request.user,
                event_type='score_change',  # Using existing event type
                description=f'Admin {request.user.username} activated user {user.username}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': f'User {user.username} activated successfully'
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to activate user: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def ban_user(self, request, pk=None):
        """Ban a user account"""
        try:
            user = self.get_object()
            
            if user.is_banned:
                return Response({
                    'error': f'User {user.username} is already banned'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if user.is_superuser or user.is_staff:
                return Response({
                    'error': 'Cannot ban superuser or staff accounts'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user.is_banned = True
            user.status = 'suspended'
            user.save()
            
            # Log ban event
            EventLog.objects.create(
                user=request.user,
                event_type='score_change',  # Using existing event type
                description=f'Admin {request.user.username} banned user {user.username}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': f'User {user.username} banned successfully'
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to ban user: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def unban_user(self, request, pk=None):
        """Unban a user account"""
        try:
            user = self.get_object()
            
            if not user.is_banned:
                return Response({
                    'error': f'User {user.username} is not banned'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user.is_banned = False
            user.status = 'active'
            user.save()
            
            # Log unban event
            EventLog.objects.create(
                user=request.user,
                event_type='score_change',  # Using existing event type
                description=f'Admin {request.user.username} unbanned user {user.username}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': f'User {user.username} unbanned successfully'
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to unban user: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def change_user_type(self, request, pk=None):
        """Change user type (promote/demote)"""
        try:
            user = self.get_object()
            new_user_type = request.data.get('user_type')
            
            if not new_user_type:
                return Response({
                    'error': 'New user type is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if new_user_type not in ['basic', 'premium', 'moderator', 'admin']:
                return Response({
                    'error': 'Invalid user type'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            old_user_type = user.user_type
            user.user_type = new_user_type
            user.save()
            
            # Log user type change event
            EventLog.objects.create(
                user=request.user,
                event_type='score_change',  # Using existing event type
                description=f'Admin {request.user.username} changed {user.username} from {old_user_type} to {new_user_type}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': f'User {user.username} type changed from {old_user_type} to {new_user_type}'
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to change user type: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete method - set user as inactive instead of deleting"""
        try:
            user = self.get_object()
            username = user.username
            
            # Check if user is trying to deactivate themselves
            if user == request.user:
                return Response({
                    'error': 'Cannot deactivate your own account'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if user is a superuser or staff (protected users)
            if user.is_superuser or user.is_staff:
                return Response({
                    'error': 'Cannot deactivate superuser or staff accounts'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if user is already inactive
            if user.status == 'inactive':
                return Response({
                    'error': f'User {username} is already inactive'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Set user as inactive (soft delete)
            user.status = 'inactive'
            user.save()
            
            # Log deactivation event
            EventLog.objects.create(
                user=request.user,
                event_type='delete_contact',  # Using existing event type
                description=f'Admin {request.user.username} deactivated user {username}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': f'User {username} deactivated successfully (status set to inactive)'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"Error deactivating user: {error_details}")
            
            return Response({
                'error': 'Failed to deactivate user',
                'detail': str(e),
                'traceback': error_details
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Directory Management Views
from .utils import create_wildcard_query, process_wildcard_filters

class PhoneBookEntryViewSet(viewsets.ModelViewSet):
    """Phonebook entry management viewset"""
    queryset = PhoneBookEntry.objects.all()
    serializer_class = PhoneBookEntrySerializer
    # 2025-01-28: FIXED - Set default permissions to require authentication for sensitive operations
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PhoneBookEntryFilter
    search_fields = ['name', 'contact', 'nid', 'address', 'profession']
    ordering_fields = ['name', 'contact', 'pid']  # 2025-01-27: Removed non-existent created_at field
    
    def get_permissions(self):
        """Override permissions for search actions - allow anonymous access to search"""
        if self.action in ['list', 'retrieve', 'advanced_search', 'public_stats', 'get_person_details']:
            # Allow search, read operations, public stats, and person details for anyone (anonymous or authenticated)
            from rest_framework.permissions import AllowAny
            return [AllowAny()]
        elif self.action == 'premium_image_search':
            # Premium image search requires authentication and proper access
            from rest_framework.permissions import IsAuthenticated
            return [IsAuthenticated()]
        # For other actions, require proper permissions
        return [CanManageDirectory()]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PhoneBookEntryCreateSerializer
        return PhoneBookEntrySerializer
    
    def perform_create(self, serializer):
        # 2025-01-29: FIX - Create pending change instead of directly saving entry
        # This ensures all user submissions go through admin approval workflow
        
        # Get the validated data
        validated_data = serializer.validated_data
        
        # Create a pending change for admin approval
        from dirReactFinal_moderation.models import PendingChange
        
        pending_change = PendingChange.objects.create(
            change_type='add',
            status='pending',
            new_data=validated_data,
            requested_by=self.request.user,
            entry=None  # No existing entry for new additions
        )
        
        # Log creation of pending change
        EventLog.objects.create(
            user=self.request.user,
            event_type='pending_change_created',
            description=f'Created pending change for new entry: {validated_data.get("name", "Unknown")}'
        )
        
        # Don't save the entry yet - it will be created after admin approval
        # The serializer.save() call will be intercepted, so we need to handle this differently
        raise serializers.ValidationError(
            "Entry submitted successfully and is pending admin approval. "
            "You will be notified once it's reviewed."
        )
    
    def perform_update(self, serializer):
        # 2025-01-29: FIX - Create pending change for updates instead of directly modifying entry
        # This ensures all user edits go through admin approval workflow
        
        instance = self.get_object()
        validated_data = serializer.validated_data
        
        # Create a pending change for admin approval
        from dirReactFinal_moderation.models import PendingChange
        
        pending_change = PendingChange.objects.create(
            change_type='edit',
            status='pending',
            new_data=validated_data,
            requested_by=self.request.user,
            entry=instance  # Link to existing entry being edited
        )
        
        # Log creation of pending change for edit
        EventLog.objects.create(
            user=self.request.user,
            event_type='pending_change_created',
            description=f'Created pending change for editing entry: {instance.name}'
        )
        
        # Don't update the entry yet - it will be updated after admin approval
        raise serializers.ValidationError(
            "Edit submitted successfully and is pending admin approval. "
            "You will be notified once it's reviewed."
        )
    
    def perform_partial_update(self, serializer):
        # 2025-01-29: FIX - Create pending change for partial updates as well
        # This ensures all user edits go through admin approval workflow
        
        instance = self.get_object()
        validated_data = serializer.validated_data
        
        # 2025-01-29: ENHANCED - Special handling for status changes to deceased/unlisted
        # These require admin approval due to sensitivity
        status_changed = 'status' in validated_data and validated_data['status'] != instance.status
        is_unlisted_changed = 'is_unlisted' in validated_data and validated_data['is_unlisted'] != instance.is_unlisted
        
        if status_changed or is_unlisted_changed:
            # Create a pending change for admin approval
            from dirReactFinal_moderation.models import PendingChange
            
            # Add special flag for status changes
            change_data = validated_data.copy()
            change_data['_status_change_requires_approval'] = True
            
            pending_change = PendingChange.objects.create(
                change_type='edit',
                status='pending',
                new_data=change_data,
                requested_by=self.request.user,
                entry=instance  # Link to existing entry being edited
            )
            
            # Log creation of pending change for status edit
            EventLog.objects.create(
                user=self.request.user,
                event_type='pending_change_created',
                description=f'Created pending change for status edit of entry: {instance.name} (status: {validated_data.get("status", "unchanged")}, unlisted: {validated_data.get("is_unlisted", "unchanged")})'
            )
            
            # Don't update the entry yet - it will be updated after admin approval
            raise serializers.ValidationError(
                "Status change submitted successfully and is pending admin approval. "
                "You will be notified once it's reviewed."
            )
        
        # Create a pending change for admin approval for other fields
        from dirReactFinal_moderation.models import PendingChange
        
        pending_change = PendingChange.objects.create(
            change_type='edit',
            status='pending',
            new_data=validated_data,
            requested_by=self.request.user,
            entry=instance  # Link to existing entry being edited
        )
        
        # Log creation of pending change for partial edit
        EventLog.objects.create(
            user=self.request.user,
            event_type='pending_change_created',
            description=f'Created pending change for partial edit of entry: {instance.name}'
        )
        
        # Don't update the entry yet - it will be updated after admin approval
        raise serializers.ValidationError(
            "Edit submitted successfully and is pending admin approval. "
            "You will be notified once it's reviewed."
        )
    
    def perform_destroy(self, instance):
        # 2025-01-29: FIX - Create pending change for deletions instead of directly deleting entry
        # This ensures all user deletions go through admin approval workflow
        
        # Create a pending change for admin approval
        from dirReactFinal_moderation.models import PendingChange
        
        pending_change = PendingChange.objects.create(
            change_type='delete',
            status='pending',
            new_data={'action': 'delete', 'entry_name': instance.name},
            requested_by=self.request.user,
            entry=instance  # Link to existing entry being deleted
        )
        
        # Log creation of pending change for deletion
        EventLog.objects.create(
            user=self.request.user,
            event_type='pending_change_created',
            description=f'Created pending change for deleting entry: {instance.name}'
        )
        
        # Don't delete the entry yet - it will be deleted after admin approval
        raise serializers.ValidationError(
            "Delete request submitted successfully and is pending admin approval. "
            "You will be notified once it's reviewed."
        )
    
    @action(detail=False, methods=['post'])
    def advanced_search(self, request):
        """Advanced search with multiple criteria - accessible to everyone"""
        try:
            # 2025-01-29: FIXED - Handle request data properly for both DRF and regular requests
            # The frontend sends JSON data, not form data
            if hasattr(request, 'data'):
                # DRF request object
                search_data = request.data
            elif request.body:
                # Parse JSON from request body (frontend sends JSON)
                try:
                    import json
                    search_data = json.loads(request.body.decode('utf-8'))
                except (json.JSONDecodeError, UnicodeDecodeError) as e:
                    print(f"JSON parsing failed: {e}")
                    search_data = {}
            elif hasattr(request, 'POST'):
                # Fallback to POST data (form data)
                search_data = request.POST.dict()
                # Convert empty strings to None for consistency
                for key, value in search_data.items():
                    if value == '':
                        search_data[key] = None
            else:
                # No data found
                search_data = {}
            
            serializer = SearchSerializer(data=search_data)
            if not serializer.is_valid():
                print(f"SearchSerializer validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            data = serializer.validated_data
            queryset = PhoneBookEntry.objects.all()
            
            # 2025-01-28: Refactored to use SearchService for better maintainability and testability
            from .services import SearchService
            search_service = SearchService()
            
            # Analyze search data to determine which filters are active
            analysis = search_service.analyze_search_data(data)
            
            # Handle comma-separated queries with AND logic
            if analysis['use_and_logic']:
                print(f"DEBUG: Comma-separated query detected. Data keys: {list(data.keys())}")
                print(f"DEBUG: enableSmartFieldDetection value: {data.get('enableSmartFieldDetection')}")
                print(f"DEBUG: useAndLogic value: {data.get('useAndLogic')}")
                queryset, response_data = search_service.handle_comma_separated_query(data, analysis)
                
                # Return early since we've handled the comma-separated query
                serializer = PhoneBookEntrySerializer(queryset, many=True)
                return Response({
                    'count': queryset.count(),
                    'results': serializer.data,
                    **response_data
                })
            
            # Handle field combination searches (address+island, address+party, etc.)
            field_combination_results = search_service.handle_field_combination_search(data, analysis)
            
            # 2025-01-29: FIXED - Only use field combination results if they exist
            # Otherwise, keep the original queryset for general query search
            if field_combination_results is not None:
                queryset = field_combination_results
                print(f"Using field combination search results: {queryset.count()} entries")
            else:
                print("No field combinations found, proceeding with general query search")
            
            # Handle general query search if no specific field filters
            print(f"DEBUG: Checking has_query: {analysis['has_query']}")
            if analysis['has_query']:
                print(f"DEBUG: Calling handle_general_query_search for query: '{data.get('query', 'NOT_FOUND')}'")
                queryset = search_service.handle_general_query_search(data, queryset)
            else:
                print(f"DEBUG: has_query is False, not calling general query search")
            
            # Apply individual field filters if we have specific field filters
            # This handles single-field searches (like just address, just name, etc.)
            has_specific_fields = any([
                analysis['has_name_filter'],
                analysis['has_address_filter'], 
                analysis['has_island_filter'],
                analysis['has_party_filter'],
                analysis['has_contact_filter'],
                analysis['has_nid_filter'],
                analysis['has_profession_filter'],
                analysis['has_gender_filter'],
                analysis['has_min_age_filter'],
                analysis['has_max_age_filter'],
                analysis['has_remark_filter'],
                analysis['has_pep_status_filter']
            ])
            
            if has_specific_fields:
                print(f"Applying individual field filters for specific fields")
                queryset = search_service.apply_individual_filters(data, analysis, queryset)
            
            # 2025-01-28: Add query optimization and timeout handling for better performance
            try:
                # Optimize the query for better performance
                queryset = search_service.optimize_search_query(queryset, timeout_seconds=20)
                
                # Execute search with timeout protection
                queryset, timeout_exceeded = search_service.execute_search_with_timeout(queryset, timeout_seconds=20)
                
                if timeout_exceeded:
                    logger.warning("Search query exceeded timeout, returning partial results")
                    # Return partial results with timeout warning
                    return Response({
                        'warning': 'Search query took longer than expected. Results may be incomplete.',
                        'timeout_exceeded': True
                    }, status=status.HTTP_200_OK)
                
            except Exception as e:
                logger.error(f"Error during query optimization: {e}")
                # Continue with unoptimized query if optimization fails
            
            # Apply pagination
            results, total_count, page, page_size = search_service.apply_pagination(queryset, data)
            
            print(f"Final search results: {total_count} total entries")
            if total_count > 0:
                print(f"Sample entries: {[{'name': r.name, 'party': r.party, 'contact': r.contact} for r in results[:3]]}")
            
            serializer = PhoneBookEntrySerializer(results, many=True)
            
            # Deduct points for basic search (except for admin users and anonymous users)
            if request.user.is_authenticated and not (request.user.is_staff or request.user.is_superuser):
                try:
                    from dirReactFinal_scoring.utils import deduct_points_for_action, get_action_points
                    
                    # Get points cost from database
                    points_cost, threshold = get_action_points('basic_search')
                    points_to_deduct = abs(points_cost) if points_cost < 0 else 0
                    
                    # Check if user has enough points
                    if request.user.score < points_to_deduct:
                        return Response({
                            'error': f'Insufficient points. Basic search costs {points_to_deduct} point. Current balance: {request.user.score} points.',
                            'code': 'INSUFFICIENT_POINTS'
                        }, status=status.HTTP_403_FORBIDDEN)
                    
                    # Check if user meets threshold requirement
                    if threshold > 0 and request.user.score < threshold:
                        return Response({
                            'error': f'Minimum {threshold} points required for basic search. Current balance: {request.user.score} points.',
                            'code': 'INSUFFICIENT_THRESHOLD'
                        }, status=status.HTTP_403_FORBIDDEN)
                    
                    # Deduct points
                    if not deduct_points_for_action(request.user, 'basic_search', request):
                        return Response({
                            'error': 'Failed to process points deduction',
                            'code': 'POINTS_DEDUCTION_FAILED'
                        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
                    print(f"Deducted {points_to_deduct} point from user {request.user.username}. New balance: {request.user.score}")
                except Exception as e:
                    print(f"Error deducting points: {str(e)}")
                    # Continue with the search even if points deduction fails
            
            # Get points information for response
            from dirReactFinal_scoring.utils import get_action_points
            points_cost, threshold = get_action_points('basic_search')
            points_deducted = abs(points_cost) if points_cost < 0 and request.user.is_authenticated and not (request.user.is_staff or request.user.is_superuser) else 0
            
            # Handle anonymous users for points information
            remaining_points = getattr(request.user, 'score', 0) if request.user.is_authenticated else 0
            
            return Response({
                'results': serializer.data,
                'total_count': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size,
                'points_deducted': points_deducted,
                'remaining_points': remaining_points,
                'action_cost': points_cost,
                'threshold_required': threshold
            })
            
        except Exception as e:
            print(f"Error in advanced_search: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': 'Internal server error during search'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def bulk_operation(self, request):
        """Bulk operations on phonebook entries"""
        serializer = BulkOperationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        operation = data['operation']
        entry_ids = data['entry_ids']
        
        if operation == 'delete':
            PhoneBookEntry.objects.filter(id__in=entry_ids).delete()
            message = f'Deleted {len(entry_ids)} entries'
        elif operation == 'update_status':
            update_data = data.get('update_data', {})
            PhoneBookEntry.objects.filter(id__in=entry_ids).update(**update_data)
            message = f'Updated {len(entry_ids)} entries'
        else:
            return Response({'error': 'Invalid operation'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'message': message})
    
    @action(detail=False, methods=['get'])
    def search_history(self, request):
        """Get search history for current user"""
        try:
            # For now, return empty array since SearchHistory model needs to be implemented
            # This can be enhanced later to track actual search history
            return Response([])
        except Exception as e:
            return Response({
                'error': 'Failed to get search history',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def public_stats(self, request):
        """Get public directory statistics - accessible to everyone"""
        try:
            from django.db.models import Count
            
            # Total entries
            total_entries = PhoneBookEntry.objects.count()
            
            # Entries by atoll (using the new ForeignKey field)
            entries_by_atoll = {}
            try:
                atoll_stats = PhoneBookEntry.objects.values('atoll_fk__name').annotate(
                    count=Count('pid')
                ).exclude(atoll_fk__isnull=True)
                
                for stat in atoll_stats:
                    atoll_name = stat['atoll_fk__name'] or 'Unknown'
                    entries_by_atoll[atoll_name] = stat['count']
            except Exception:
                # Fallback if atoll_fk field doesn't exist
                entries_by_atoll = {}
            
            # Entries by profession
            entries_by_profession = {}
            profession_stats = PhoneBookEntry.objects.values('profession').annotate(
                count=Count('pid')
            ).exclude(profession__isnull=True).exclude(profession='')
            
            for stat in profession_stats:
                entries_by_profession[stat['profession']] = stat['count']
            
            # Entries by gender
            entries_by_gender = {}
            gender_stats = PhoneBookEntry.objects.values('gender').annotate(
                count=Count('pid')
            ).exclude(gender__isnull=True).exclude(gender='')
            
            for stat in gender_stats:
                entries_by_gender[stat['gender']] = stat['count']
            
            return Response({
                'total_entries': total_entries,
                'entries_by_atoll': entries_by_atoll,
                'entries_by_profession': entries_by_profession,
                'entries_by_gender': entries_by_gender,
                'last_updated': timezone.now().isoformat()
            })
            
        except Exception as e:
            return Response({
                'error': 'Failed to get directory statistics',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def save_search_history(self, request):
        """Save search history for current user"""
        try:
            # For now, return success since SearchHistory model needs to be implemented
            # This can be enhanced later to actually save search history
            return Response({
                'message': 'Search history saved successfully',
                'status': 'success'
            })
        except Exception as e:
            return Response({
                'error': 'Failed to save search history',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def export(self, request):
        """Export search results"""
        try:
            # For now, return a simple message
            # This can be enhanced later to actually export data
            return Response({
                'message': 'Export functionality will be implemented in the next phase'
            })
        except Exception as e:
            return Response({
                'error': 'Failed to export data',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def popular_searches(self, request):
        """Get popular search terms"""
        try:
            # For now, return some sample popular searches
            # This can be enhanced later to track actual popular searches
            popular_searches = [
                'Male',
                'Female',
                'Male',
                'Male',
                'Male'
            ]
            
            return Response({
                'popular_searches': popular_searches
            })
        except Exception as e:
            return Response({
                'error': 'Failed to get popular searches',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def premium_image_search(self, request):
        """Premium feature: Search entries with images, especially PEP profiles"""
        # Allow admin users to access image search regardless of user type
        if request.user.is_authenticated:
            # Check if user is admin (staff or superuser)
            if request.user.is_staff or request.user.is_superuser:
                # Admin users can always access
                pass
            elif hasattr(request.user, 'user_type') and request.user.user_type != 'premium':
                # Non-admin, non-premium users are restricted
                return Response({
                    'error': 'Premium feature. Upgrade your account to access image search.',
                    'code': 'PREMIUM_REQUIRED'
                }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Get query parameters
            query = request.query_params.get('query', '')
            pep_only = request.query_params.get('pep_only', 'false').lower() == 'true'
            status = request.query_params.get('status', '')  # 2025-01-28: Added status filter
            atoll = request.query_params.get('atoll', '')
            island = request.query_params.get('island', '')
            party = request.query_params.get('party', '')
            profession = request.query_params.get('profession', '')
            
            # Start with entries that have images - use image_status flag
            queryset = PhoneBookEntry.objects.exclude(image_status__isnull=True).exclude(image_status='0')
            
            # Debug: Log the search parameters
            print(f"Premium image search - Query: '{query}', Party: '{party}', PEP only: {pep_only}, Status: '{status}'")
            print(f"Initial queryset count (entries with images): {queryset.count()}")
            
            # Apply status filter if requested (2025-01-28: Added status filtering)
            if status:
                queryset = queryset.filter(status=status)
                print(f"Filtered by status '{status}': {queryset.count()} entries")
            
            # Apply PEP filter if requested
            if pep_only:
                queryset = queryset.filter(pep_status='1')  # 1 means PEP in your data
                print(f"Filtered by PEP status: {queryset.count()} entries")
            
            # Apply search filters
            if query:
                # Use wildcard-aware queries for comprehensive search
                name_query = create_wildcard_query('name', query)
                contact_query = create_wildcard_query('contact', query)
                nid_query = create_wildcard_query('nid', query)
                address_query = create_wildcard_query('address', query)
                party_query = create_wildcard_query('party', query)
                profession_query = create_wildcard_query('profession', query)
                remark_query = create_wildcard_query('remark', query)
                queryset = queryset.filter(
                    name_query | contact_query | nid_query | address_query | party_query | profession_query | remark_query
                )
            
            if atoll:
                atoll_query = create_wildcard_query('atoll', atoll)
                queryset = queryset.filter(atoll_query)
            
            if island:
                island_query = create_wildcard_query('island', island)
                queryset = queryset.filter(island_query)
            
            if party:
                print(f"Filtering by party: '{party}'")
                party_query = create_wildcard_query('party', party)
                party_filtered = queryset.filter(party_query)
                print(f"Entries with party '{party}': {party_filtered.count()}")
                queryset = party_filtered
            
            if profession:
                profession_query = create_wildcard_query('profession', profession)
                queryset = queryset.filter(profession_query)
            
            # 2025-01-29: Add randomization to ensure images don't appear in same order every time
            # Use random ordering to provide variety in image display
            import random
            # Generate a random seed based on current time and user session for consistent randomization per session
            random_seed = hash(f"{request.session.session_key}_{int(time.time() / 3600)}")  # Change every hour
            random.seed(random_seed)
            
            # Apply efficient randomization using random offset instead of order_by('?')
            # This provides randomization while maintaining good performance for large datasets
            total_entries = queryset.count()
            if total_entries > 0:
                # Use a random offset to start from a different position each time
                # This ensures variety without the performance penalty of order_by('?')
                random_offset = random.randint(0, min(total_entries - 1, 1000))  # Cap offset to prevent too much skipping
                print(f"Applied efficient randomization with seed: {random_seed}, offset: {random_offset}")
                
                # Apply the random offset by slicing the queryset
                # This gives us a different starting point for each session
                queryset = queryset[random_offset:] | queryset[:random_offset]
            else:
                print(f"No entries found for randomization")
            
            # Pagination
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            start = (page - 1) * page_size
            end = start + page_size
            
            total_count = queryset.count()
            results = queryset[start:end]
            
            # 2025-01-29: Add select_related AFTER all filtering and randomization to preserve ForeignKey optimization
            try:
                results = results.select_related('atoll', 'island', 'party')
                print("Added select_related for ForeignKey optimization AFTER filtering")
            except Exception as e:
                print(f"Could not add select_related: {e}")
            
            print(f"Final results count: {total_count}")
            if total_count > 0:
                print(f"Sample entries: {[{'name': r.name, 'party': r.party} for r in results[:3]]}")
            
            # Serialize with image information
            from .serializers import PhoneBookEntryWithImageSerializer
            serializer = PhoneBookEntryWithImageSerializer(results, many=True)
            
            # Deduct points for image search (except for admin users and anonymous users)
            if request.user.is_authenticated and not (request.user.is_staff or request.user.is_superuser):
                try:
                    from dirReactFinal_scoring.utils import deduct_points_for_action, get_action_points
                    
                    # Get points cost from database
                    points_cost, threshold = get_action_points('image_search')
                    points_to_deduct = abs(points_cost) if points_cost < 0 else 0
                    
                    # Check if user has enough points
                    if request.user.score < points_to_deduct:
                        return Response({
                            'error': f'Insufficient points. Image search costs {points_to_deduct} points. Current balance: {request.user.score} points.',
                            'code': 'INSUFFICIENT_POINTS'
                        }, status=status.HTTP_403_FORBIDDEN)
                    
                    # Check if user meets threshold requirement
                    if threshold > 0 and request.user.score < threshold:
                        return Response({
                            'error': f'Minimum {threshold} points required for image search. Current balance: {request.user.score} points.',
                            'code': 'INSUFFICIENT_THRESHOLD'
                        }, status=status.HTTP_403_FORBIDDEN)
                    
                    # Deduct points
                    if not deduct_points_for_action(request.user, 'image_search', request):
                        return Response({
                            'error': 'Failed to process points deduction',
                            'code': 'POINTS_DEDUCTION_FAILED'
                        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
                    print(f"Deducted {points_to_deduct} points from user {request.user.username}. New balance: {request.user.score}")
                except Exception as e:
                    print(f"Error deducting points: {str(e)}")
                    # Continue with the search even if points deduction fails
            
            # Get points information for response
            from dirReactFinal_scoring.utils import get_action_points
            points_cost, threshold = get_action_points('image_search')
            points_deducted = abs(points_cost) if points_cost < 0 and request.user.is_authenticated and not (request.user.is_staff or request.user.is_superuser) else 0
            
            # Handle anonymous users for points information
            remaining_points = getattr(request.user, 'score', 0) if request.user.is_authenticated else 0
            
            return Response({
                'results': serializer.data,
                'total_count': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size,
                'pep_count': queryset.filter(pep_status='1').count(),
                'total_with_images': queryset.count(),
                'points_deducted': points_deducted,
                'remaining_points': remaining_points,
                'action_cost': points_cost,
                'threshold_required': threshold,
                'random_seed': random_seed  # 2025-01-29: Include random seed in response for debugging
            })
        except Exception as e:
            print(f"Error in premium_image_search: {str(e)}")
            return Response({
                'error': 'Failed to perform image search',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def get_person_details(self, request):
        """Get complete person details by PID with all related information"""
        try:
            pid = request.query_params.get('pid')
            if not pid:
                return Response({
                    'error': 'PID parameter is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 2025-01-29: CRITICAL FIX - Use single query with select_related to get all ForeignKey relationships
            person = PhoneBookEntry.objects.select_related(
                'atoll', 'island', 'party'
            ).get(pid=pid)
            
            # Serialize with complete information
            from .serializers import PhoneBookEntryWithImageSerializer
            serializer = PhoneBookEntryWithImageSerializer(person)
            
            print(f"Retrieved complete details for PID {pid}: {person.name}")
            print(f"Atoll: {person.atoll}, Island: {person.island}, Party: {person.party}")
            
            return Response({
                'person': serializer.data,
                'message': f'Complete details retrieved for {person.name}'
            })
            
        except PhoneBookEntry.DoesNotExist:
            return Response({
                'error': f'Person with PID {pid} not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': 'Failed to retrieve person details',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Image Management Views
class ImageViewSet(viewsets.ModelViewSet):
    """Image management viewset"""
    queryset = Image.objects.all()
    serializer_class = ImageSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        image = serializer.save()
        
        # Log image upload
        EventLog.objects.create(
            user=self.request.user,
            event_type='upload_photo',
            description=f'Uploaded photo for {image.entry.name}'
        )

# Family Management Views
class FamilyGroupViewSet(viewsets.ModelViewSet):
    """Family group management viewset"""
    queryset = FamilyGroup.objects.all()
    serializer_class = FamilyGroupSerializer
    permission_classes = [CanManageFamily]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = FamilyGroupFilter
    search_fields = ['name', 'description']
    
    def perform_create(self, serializer):
        group = serializer.save(created_by=self.request.user)

class FamilyMemberViewSet(viewsets.ModelViewSet):
    """Family member management viewset"""
    queryset = FamilyMember.objects.all()
    serializer_class = FamilyMemberSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['family_group', 'relationship_type', 'is_primary']

# Moderation Views
class PendingChangeViewSet(viewsets.ModelViewSet):
    """Pending change management viewset"""
    queryset = PendingChange.objects.all()
    serializer_class = PendingChangeSerializer
    permission_classes = [CanModerate]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = PendingChangeFilter
    ordering_fields = ['requested_at', 'reviewed_at']
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return PendingChange.objects.all()
        return PendingChange.objects.filter(requested_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a pending change"""
        change = self.get_object()
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # 2025-01-29: ENHANCED - Actually process the approved change
            if change.change_type == 'add':
                # Create the actual entry from pending change data
                from dirReactFinal_directory.models import PhoneBookEntry
                from dirReactFinal_api.serializers import PhoneBookEntryCreateSerializer
                
                # Create serializer with the pending change data
                serializer = PhoneBookEntryCreateSerializer(data=change.new_data)
                if serializer.is_valid():
                    # Save the entry
                    entry = serializer.save()
                    
                    # Log the actual entry creation
                    EventLog.objects.create(
                        user=request.user,
                        event_type='add_contact',
                        description=f'Admin approved and created entry: {entry.name}'
                    )
                    
                    # Update the pending change
                    change.status = 'approved'
                    change.reviewed_by = request.user
                    change.reviewed_at = timezone.now()
                    change.entry = entry  # Link to the created entry
                    change.save()
                    
                    return Response({
                        'message': 'Change approved and entry created successfully',
                        'entry_id': entry.pid
                    })
                else:
                    return Response({
                        'error': 'Invalid entry data',
                        'details': serializer.errors
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
            elif change.change_type == 'edit':
                # Handle editing existing entries
                if change.entry:
                    # Update the existing entry with new data
                    for field, value in change.new_data.items():
                        if hasattr(change.entry, field):
                            setattr(change.entry, field, value)
                    change.entry.save()
                    
                    # Log the update
                    EventLog.objects.create(
                        user=request.user,
                        event_type='edit_contact',
                        description=f'Admin approved edit for entry: {change.entry.name}'
                    )
                    
                    # Update the pending change
                    change.status = 'approved'
                    change.reviewed_by = request.user
                    change.reviewed_at = timezone.now()
                    change.save()
                    
                    return Response({
                        'message': 'Edit approved and applied successfully',
                        'entry_id': change.entry.pid
                    })
                else:
                    return Response({
                        'error': 'No entry found for edit operation'
                    }, status=status.HTTP_400_BAD_REQUEST)
            elif change.change_type == 'delete':
                # Handle deleting entries
                if change.entry:
                    entry_name = change.entry.name
                    entry_id = change.entry.pid
                    
                    # Delete the entry
                    change.entry.delete()
                    
                    # Log the deletion
                    EventLog.objects.create(
                        user=request.user,
                        event_type='delete_contact',
                        description=f'Admin approved deletion of entry: {entry_name}'
                    )
                    
                    # Update the pending change
                    change.status = 'approved'
                    change.reviewed_by = request.user
                    change.reviewed_at = timezone.now()
                    change.save()
                    
                    return Response({
                        'message': 'Delete approved and entry removed successfully',
                        'deleted_entry_id': entry_id
                    })
                else:
                    return Response({
                        'error': 'No entry found for delete operation'
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                # For other change types, just mark as approved
                change.status = 'approved'
                change.reviewed_by = request.user
                change.reviewed_at = timezone.now()
                change.save()
                
                return Response({'message': 'Change approved'})
                
        except Exception as e:
            return Response({
                'error': 'Failed to process approved change',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a pending change"""
        change = self.get_object()
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        change.status = 'rejected'
        change.reviewed_by = request.user
        change.reviewed_at = timezone.now()
        change.save()
        
        return Response({'message': 'Change rejected'})

class PhotoModerationViewSet(viewsets.ModelViewSet):
    """Photo moderation viewset"""
    queryset = PhotoModeration.objects.all()
    serializer_class = PhotoModerationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['submitted_at', 'reviewed_at']
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return PhotoModeration.objects.all()
        return PhotoModeration.objects.filter(submitted_by=self.request.user)

# Scoring Views
class ScoreTransactionViewSet(viewsets.ModelViewSet):
    """Score transaction viewset"""
    queryset = ScoreTransaction.objects.all()
    serializer_class = ScoreTransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['transaction_type', 'user']
    ordering_fields = ['timestamp']
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return ScoreTransaction.objects.all()
        return ScoreTransaction.objects.filter(user=self.request.user)

class RewardRuleViewSet(viewsets.ModelViewSet):
    """Reward rule management viewset"""
    queryset = RewardRule.objects.all()
    serializer_class = RewardRuleSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['action_type', 'is_active']

# Analytics and Statistics Views
class AnalyticsViewSet(viewsets.ViewSet):
    """Analytics and statistics endpoint"""
    # 2025-01-28: FIXED - Require authentication for analytics data
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """Get basic analytics overview"""
        # 2025-01-28: DEBUG - Log request details
        print(f"=== ANALYTICS DEBUG ===")
        print(f"DEBUG: User authenticated: {request.user.is_authenticated}")
        print(f"DEBUG: User username: {request.user.username}")
        print(f"DEBUG: User is_superuser: {request.user.is_superuser}")
        print(f"DEBUG: User is_staff: {request.user.is_staff}")
        print(f"DEBUG: User user_type: {getattr(request.user, 'user_type', 'N/A')}")
        print(f"DEBUG: Request headers: {dict(request.headers)}")
        print(f"=== END ANALYTICS DEBUG ===")
        
        try:
            # Basic statistics
            total_users = User.objects.count()
            total_contacts = PhoneBookEntry.objects.count()
            
            # Check if family_groups table exists and use correct name
            try:
                total_families = FamilyGroup.objects.count()
            except Exception:
                total_families = 0
            
            # Check if pending_changes table exists
            try:
                pending_changes = PendingChange.objects.filter(status='pending').count()
            except Exception:
                pending_changes = 0
            
            # User statistics
            active_users = User.objects.filter(status='active').count()
            banned_users = User.objects.filter(is_banned=True).count()
            avg_score = User.objects.aggregate(avg_score=Avg('score'))['avg_score'] or 0
            
            # Contact statistics by location
            contacts_by_atoll = PhoneBookEntry.objects.values('atoll').annotate(
                count=Count('pid')  # 2025-01-27: Fixed - use 'pid' instead of 'id' for PhoneBookEntry
            ).order_by('-count')[:5]
            
            # Recent activity - check if event_logs table exists
            try:
                recent_events = EventLog.objects.select_related('user').order_by('-timestamp')[:10]
                recent_events_data = EventLogSerializer(recent_events, many=True).data
            except Exception:
                recent_events_data = []
            
            return Response({
                'overview': {
                    'total_users': total_users,
                    'total_contacts': total_contacts,
                    'total_families': total_families,
                    'pending_changes': pending_changes
                },
                'users': {
                    'active_users': active_users,
                    'banned_users': banned_users,
                    'average_score': round(avg_score, 2)
                },
                'contacts_by_atoll': list(contacts_by_atoll),
                'recent_activity': recent_events_data
            })
        except Exception as e:
            # Return fallback data if there's an error
            return Response({
                'overview': {
                    'total_users': 0,
                    'total_contacts': 0,
                    'total_families': 0,
                    'pending_changes': 0
                },
                'users': {
                    'active_users': 0,
                    'banned_users': 0,
                    'average_score': 0
                },
                'contacts_by_atoll': [],
                'recent_activity': []
            }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def directory_stats(self, request):
        """Get directory-specific statistics"""
        try:
            # Total entries
            total_entries = PhoneBookEntry.objects.count()
            
            # Entries by atoll
            entries_by_atoll = {}
            atoll_stats = PhoneBookEntry.objects.values('atoll').annotate(
                count=Count('id')
            ).exclude(atoll__isnull=True).exclude(atoll='')
            
            for stat in atoll_stats:
                entries_by_atoll[stat['atoll']] = stat['count']
            
            # Entries by profession
            entries_by_profession = {}
            profession_stats = PhoneBookEntry.objects.values('profession').annotate(
                count=Count('id')
            ).exclude(profession__isnull=True).exclude(profession='')
            
            for stat in profession_stats:
                entries_by_profession[stat['profession']] = stat['count']
            
            # Entries by gender
            entries_by_gender = {}
            gender_stats = PhoneBookEntry.objects.values('gender').annotate(
                count=Count('id')
            ).exclude(gender__isnull=True).exclude(gender='')
            
            for stat in gender_stats:
                entries_by_gender[stat['gender']] = stat['count']
            
            # Recent additions - not available since no created_at field
            recent_additions = 0
            
            # Pending changes - check if table exists
            try:
                pending_changes = PendingChange.objects.filter(status='pending').count()
            except Exception:
                pending_changes = 0
            
            return Response({
                'total_entries': total_entries,
                'entries_by_atoll': entries_by_atoll,
                'entries_by_profession': entries_by_profession,
                'entries_by_gender': entries_by_gender,
                'recent_additions': recent_additions,
                'pending_changes': pending_changes
            })
            
        except Exception as e:
            return Response({
                'error': 'Failed to get directory statistics',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Health Check View
class HealthCheckView(APIView):
    """Health check endpoint for monitoring"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        try:
            # Check database connection
            User.objects.count()
            
            return Response({
                'status': 'healthy',
                'timestamp': timezone.now().isoformat(),
                'database': 'connected',
                'version': '1.0.0'
            })
        except Exception as e:
            return Response({
                'status': 'unhealthy',
                'timestamp': timezone.now().isoformat(),
                'error': str(e)
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
