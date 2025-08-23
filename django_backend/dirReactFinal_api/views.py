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
        user = self.get_object()
        points = request.data.get('points', 0)
        reason = request.data.get('reason', 'Score update')
        
        user.score += points
        user.save()
        
        # Log score change
        EventLog.objects.create(
            user=user,
            event_type='score_change',
            description=f'Score changed by {points} points: {reason}'
        )
        
        return Response({'message': f'Score updated. New score: {user.score}'})
    
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
class PhoneBookEntryViewSet(viewsets.ModelViewSet):
    """Phonebook entry management viewset"""
    queryset = PhoneBookEntry.objects.all()
    serializer_class = PhoneBookEntrySerializer
    permission_classes = []  # 2025-01-27: Fixed permission issue for search functionality
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PhoneBookEntryFilter
    search_fields = ['name', 'contact', 'nid', 'address', 'profession']
    ordering_fields = ['name', 'contact', 'pid']  # 2025-01-27: Removed non-existent created_at field
    
    def get_permissions(self):
        """Override permissions for search actions - allow anonymous access to search"""
        if self.action in ['list', 'retrieve', 'advanced_search']:
            # Allow search and read operations for anyone (anonymous or authenticated)
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
        entry = serializer.save()
        
        # Log creation event
        EventLog.objects.create(
            user=self.request.user,
            event_type='add_contact',
            description=f'Added contact: {entry.name}'
        )
    
    @action(detail=False, methods=['post'])
    def advanced_search(self, request):
        """Advanced search with multiple criteria - accessible to everyone"""
        try:
            serializer = SearchSerializer(data=request.data)
            if not serializer.is_valid():
                print(f"SearchSerializer validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            data = serializer.validated_data
            queryset = PhoneBookEntry.objects.all()
            
            # 2025-01-27: Fixed search logic to prioritize specific field filters over general query field
            # Check if we have specific address and island filters (smart search case)
            has_address_filter = data.get('address') and data['address'].strip()
            has_island_filter = data.get('island') and data['island'].strip()
            has_party_filter = data.get('party') and data['party'].strip()
            has_query = data.get('query') and data['query'].strip()
            has_name_filter = data.get('name') and data['name'].strip()
            has_contact_filter = data.get('contact') and data['contact'].strip()
            has_nid_filter = data.get('nid') and data['nid'].strip()
            has_atoll_filter = data.get('atoll') and data['atoll'].strip()
            has_profession_filter = data.get('profession') and data['profession'].strip()
            has_gender_filter = data.get('gender') and data['gender'].strip()
            has_remark_filter = data.get('remark') and data['remark'].strip()
            has_pep_status_filter = data.get('pep_status') and data['pep_status'].strip()
            has_min_age_filter = data.get('min_age') and data['min_age'] > 0
            has_max_age_filter = data.get('max_age') and data['max_age'] > 0
            is_family_search = data.get('limit_results', False)  # Flag for family searches
            
            print(f"Search analysis - Address: {has_address_filter}, Island: {has_island_filter}, Query: {has_query}, Family search: {is_family_search}")
            
            # PRIORITY: Handle specific field filters FIRST (address+island, address+party, etc.)
            # This ensures that when users search with specific fields, they get precise results
            if has_address_filter and has_island_filter:
                print(f"Smart search case: Address='{data['address']}', Island='{data['island']}'")
                
                # Reset queryset to all entries since we're doing custom field-based search
                # The smart query analysis was filtering out results prematurely
                queryset = PhoneBookEntry.objects.all()
                print(f"Reset queryset to all entries: {queryset.count()}")
                
                # For address + island combination, try AND logic first for precise results
                # If no results, fall back to OR logic for broader results
                address_term = data['address'].strip()
                island_term = data['island'].strip()
                
                # Pad terms with wildcards for more flexible matching
                # This helps catch partial matches within longer text
                padded_address_term = f"*{address_term}*"
                padded_island_term = f"*{island_term}*"
                
                print(f"Searching for address term: '{address_term}' (padded: '{padded_address_term}') AND island term: '{island_term}' (padded: '{padded_island_term}')")
                print(f"First trying AND logic for precise results...")
                
                # Debug: Check what exists in the database for these terms
                print(f"Database check - Entries with address containing '{address_term}': {PhoneBookEntry.objects.filter(address__icontains=address_term).count()}")
                print(f"Database check - Entries with island containing '{island_term}': {PhoneBookEntry.objects.filter(island__icontains=island_term).count()}")
                
                # Show some sample entries for debugging
                address_entries = PhoneBookEntry.objects.filter(address__icontains=address_term)[:3]
                island_entries = PhoneBookEntry.objects.filter(island__icontains=island_term)[:3]
                
                if address_entries.exists():
                    print(f"Sample address entries for '{address_term}':")
                    for entry in address_entries:
                        print(f"  - {entry.name}: address='{entry.address}', island='{entry.island}'")
                
                if island_entries.exists():
                    print(f"Sample island entries for '{island_term}':")
                    for entry in island_entries:
                        print(f"  - {entry.name}: address='{entry.address}', island='{entry.island}'")
                
                # First try: Use AND logic for precise results (narrow scope)
                # For family searches, use exact matching; otherwise use partial matching
                if is_family_search:
                    print("Using exact matching for family search")
                    precise_queryset = queryset.filter(
                        Q(address__iexact=address_term) & Q(island__iexact=island_term)
                    )
                else:
                    # Using padded terms for more flexible matching
                    precise_queryset = queryset.filter(
                        Q(address__icontains=address_term) & Q(island__icontains=island_term)
                    )
                
                print(f"Results after AND logic (precise): {precise_queryset.count()}")
                
                if precise_queryset.count() > 0:
                    # Use the precise results
                    queryset = precise_queryset
                    print("Using precise AND logic results")
                else:
                    # No precise results, try OR logic for broader results
                    print("No precise results found, trying OR logic for broader results...")
                    
                    broader_queryset = queryset.filter(
                        Q(address__icontains=address_term) |
                        Q(island__icontains=island_term)
                    )
                    
                    print(f"Results after OR logic (broader): {broader_queryset.count()}")
                    
                    if broader_queryset.count() > 0:
                        queryset = broader_queryset
                        print("Using broader OR logic results")
                        print("Note: These results match EITHER address OR island, not necessarily both")
                        
                        # Show some sample entries to understand what was found
                        sample_entries = queryset[:3]
                        for entry in sample_entries:
                            print(f"Sample entry: {entry.name} - Address: {entry.address} - Island: {entry.island} - Atoll: {entry.atoll}")
                    else:
                        print("No results found with either AND or OR logic")
                        print("This combination may not exist in the database")
            
            # Handle the case where we have both address and party filters (smart search case)
            elif has_address_filter and has_party_filter:
                print(f"Smart search case: Address='{data['address']}', Party='{data['party']}'")
                
                # Reset queryset to all entries since we're doing custom field-based search
                queryset = PhoneBookEntry.objects.all()
                print(f"Reset queryset to all entries: {queryset.count()}")
                
                # For address + party combination, try AND logic first for precise results
                # If no results, fall back to OR logic for broader results
                address_term = data['address'].strip()
                party_term = data['party'].strip()
                
                print(f"Searching for address term: '{address_term}' AND party term: '{party_term}'")
                print(f"First trying AND logic for precise results...")
                
                # Debug: Check what exists in the database for these terms
                print(f"Database check - Entries with address containing '{address_term}': {PhoneBookEntry.objects.filter(address__icontains=address_term).count()}")
                print(f"Database check - Entries with party containing '{party_term}': {PhoneBookEntry.objects.filter(party__icontains=party_term).count()}")
                
                # Show some sample entries for debugging
                address_entries = PhoneBookEntry.objects.filter(address__icontains=address_term)[:3]
                party_entries = PhoneBookEntry.objects.filter(party__icontains=party_term)[:3]
                
                if address_entries.exists():
                    print(f"Sample address entries for '{address_term}':")
                    for entry in address_entries:
                        print(f"  - {entry.name}: address='{entry.address}', party='{entry.party}'")
                
                if party_entries.exists():
                    print(f"Sample party entries for '{party_term}':")
                    for entry in party_entries:
                        print(f"  - {entry.name}: address='{entry.address}', party='{entry.party}'")
                
                # First try: Use AND logic for precise results (narrow scope)
                precise_queryset = queryset.filter(
                    Q(address__icontains=address_term) & Q(party__icontains=party_term)
                )
                
                print(f"Results after AND logic (precise): {precise_queryset.count()}")
                
                if precise_queryset.count() > 0:
                    # Use the precise results
                    queryset = precise_queryset
                    print("Using precise AND logic results")
                else:
                    # No precise results, try OR logic for broader results
                    print("No precise results found, trying OR logic for broader results...")
                    
                    broader_queryset = queryset.filter(
                        Q(address__icontains=address_term) |
                        Q(party__icontains=party_term)
                    )
                    
                    print(f"Results after OR logic (broader): {broader_queryset.count()}")
                    
                    if broader_queryset.count() > 0:
                        queryset = broader_queryset
                        print("Using broader OR logic results")
                        print("Note: These results match EITHER address OR party, not necessarily both")
                    else:
                        print("No results found with either AND or OR logic")
            
            # Handle the case where we have both name and party filters (smart search case)
            elif has_name_filter and has_party_filter:
                print(f"Smart search case: Name='{data['name']}', Party='{data['party']}'")
                
                # Reset queryset to all entries since we're doing custom field-based search
                queryset = PhoneBookEntry.objects.all()
                print(f"Reset queryset to all entries: {queryset.count()}")
                
                # For name + party combination, try AND logic first for precise results
                # If no results, fall back to OR logic for broader results
                name_term = data['name'].strip()
                party_term = data['party'].strip()
                
                print(f"Searching for name term: '{name_term}' AND party term: '{party_term}'")
                print(f"First trying AND logic for precise results...")
                
                # Debug: Check what exists in the database for these terms
                print(f"Database check - Entries with name containing '{name_term}': {PhoneBookEntry.objects.filter(name__icontains=name_term).count()}")
                print(f"Database check - Entries with party containing '{party_term}': {PhoneBookEntry.objects.filter(party__icontains=party_term).count()}")
                
                # First try: Use AND logic for precise results (narrow scope)
                precise_queryset = queryset.filter(
                    Q(name__icontains=name_term) & Q(party__icontains=party_term)
                )
                
                print(f"Results after AND logic (precise): {precise_queryset.count()}")
                
                if precise_queryset.count() > 0:
                    # Use the precise results
                    queryset = precise_queryset
                    print("Using precise AND logic results")
                else:
                    # No precise results, try OR logic for broader results
                    print("No precise results found, trying OR logic for broader results...")
                    
                    broader_queryset = queryset.filter(
                        Q(name__icontains=name_term) |
                        Q(party__icontains=party_term)
                    )
                    
                    print(f"Results after OR logic (broader): {broader_queryset.count()}")
                    
                    if broader_queryset.count() > 0:
                        queryset = broader_queryset
                        print("Using broader OR logic results")
                        print("Note: These results match EITHER name OR party, not necessarily both")
                    else:
                        print("No results found with either AND or OR logic")
            
            # Handle the case where we have both island and party filters (smart search case)
            elif has_island_filter and has_party_filter:
                print(f"Smart search case: Island='{data['island']}', Party='{data['party']}'")
                
                # Reset queryset to all entries since we're doing custom field-based search
                queryset = PhoneBookEntry.objects.all()
                print(f"Reset queryset to all entries: {queryset.count()}")
                
                # For island + party combination, try AND logic first for precise results
                # If no results, fall back to OR logic for broader results
                island_term = data['island'].strip()
                party_term = data['party'].strip()
                
                print(f"Searching for island term: '{island_term}' AND party term: '{party_term}'")
                print(f"First trying AND logic for precise results...")
                
                # Debug: Check what exists in the database for these terms
                print(f"Database check - Entries with island containing '{island_term}': {PhoneBookEntry.objects.filter(island__icontains=island_term).count()}")
                print(f"Database check - Entries with party containing '{party_term}': {PhoneBookEntry.objects.filter(party__icontains=party_term).count()}")
                
                # First try: Use AND logic for precise results (narrow scope)
                precise_queryset = queryset.filter(
                    Q(island__icontains=island_term) & Q(party__icontains=party_term)
                )
                
                print(f"Results after AND logic (precise): {precise_queryset.count()}")
                
                if precise_queryset.count() > 0:
                    # Use the precise results
                    queryset = precise_queryset
                    print("Using precise AND logic results")
                else:
                    # No precise results, try OR logic for broader results
                    print("No precise results found, trying OR logic for broader results...")
                    
                    broader_queryset = queryset.filter(
                        Q(island__icontains=island_term) |
                        Q(party__icontains=party_term)
                    )
                    
                    print(f"Results after OR logic (broader): {broader_queryset.count()}")
                    
                    if broader_queryset.count() > 0:
                        queryset = broader_queryset
                        print("Using broader OR logic results")
                        print("Note: These results match EITHER island OR party, not necessarily both")
                    else:
                        print("No results found with either AND or OR logic")
            
            # ONLY process general query if we don't have specific field filters
            # This ensures that specific field searches take priority over general query searches
            elif has_query:
                query = data['query'].strip()
                print(f"General query search (no specific field filters): '{query}'")
                
                # Enhanced smart search logic for better field detection
                if query.isdigit():
                    # Numeric query - likely phone number or NID
                    if len(query) >= 7:
                        # 7+ digits - likely phone number
                        print(f"Query '{query}' appears to be a phone number")
                        queryset = queryset.filter(contact__icontains=query)
                    else:
                        # Shorter numeric - could be NID or phone number
                        print(f"Query '{query}' is numeric - searching in contact and NID fields")
                        queryset = queryset.filter(
                            Q(contact__icontains=query) |
                            Q(nid__icontains=query)
                        )
                elif query.upper() in ['AP', 'MDP', 'PPM', 'JP', 'MNP', 'ADH', 'PJP']:
                    # Political party abbreviation
                    print(f"Query '{query}' appears to be a political party")
                    queryset = queryset.filter(party__icontains=query)
                elif query.upper() in ['MALE', 'FEMALE', 'M', 'F']:
                    # Gender
                    print(f"Query '{query}' appears to be gender")
                    queryset = queryset.filter(gender__icontains=query)
                elif len(query) <= 3 and query.upper() in ['M', 'F', 'S', 'N', 'L', 'B', 'AA', 'ADH', 'HDH', 'TH', 'V', 'HA', 'R']:
                    # Atoll abbreviation
                    print(f"Query '{query}' appears to be an atoll code")
                    queryset = queryset.filter(atoll__icontains=query)
                else:
                    # Enhanced text query analysis for better field detection
                    print(f"Query '{query}' appears to be text - analyzing for specific field types")
                    
                    # Check if query looks like an address (contains common address indicators)
                    address_indicators = ['ge', 'maa', 'villa', 'house', 'flat', 'room', 'floor', 'block', 'area', 'zone', 'district', 'ward', 'sector', 'street', 'road', 'avenue', 'lane', 'drive', 'place', 'court', 'building', 'apartment', 'habaruge']
                    is_likely_address = any(indicator in query.lower() for indicator in address_indicators)
                    
                    # Special handling for "ge" suffix patterns (very common in Maldivian addresses)
                    if not is_likely_address:
                        # Check if query ends with "ge" or contains " ge" (with space)
                        if query.lower().endswith('ge') or ' ge' in query.lower():
                            is_likely_address = True
                            print(f"Query '{query}' detected as address due to 'ge' suffix pattern")
                    
                    # Check if query looks like an island name (common Maldivian island patterns)
                    island_indicators = ['male', 'addu', 'fuamulah', 'gan', 'fuvahmulah', 'thinadhoo', 'vaadhoo', 'keyodhoo', 'maradhoo', 'feydhoo', 'hithadhoo', 'kudahuvadhoo', 'kulhudhuffushi', 'naifaru', 'dhidhoo', 'hulhumale', 'viligili', 'hulhule', 'villingili']
                    is_likely_island = any(island in query.lower() for island in island_indicators)
                    
                    # Check if query looks like a profession
                    profession_indicators = ['teacher', 'doctor', 'engineer', 'lawyer', 'business', 'fisherman', 'farmer', 'student', 'retired', 'unemployed', 'government', 'private', 'self-employed', 'nurse', 'accountant', 'manager', 'driver', 'cook', 'cleaner', 'security']
                    is_likely_profession = any(prof in query.lower() for prof in profession_indicators)
                    
                    # Apply smart field-specific search based on analysis
                    if is_likely_address:
                        print(f"Query '{query}' detected as address - searching in address field")
                        queryset = queryset.filter(address__icontains=query)
                    elif is_likely_island:
                        print(f"Query '{query}' detected as island - searching in island field")
                        queryset = queryset.filter(island__icontains=query)
                    elif is_likely_profession:
                        print(f"Query '{query}' detected as profession - searching in profession field")
                        queryset = queryset.filter(profession__icontains=query)
                    else:
                        # Default to comprehensive search across multiple fields
                        print(f"Query '{query}' - performing comprehensive search across name, address, island, profession, remark")
                        queryset = queryset.filter(
                            Q(name__icontains=query) |
                            Q(address__icontains=query) |
                            Q(island__icontains=query) |
                            Q(profession__icontains=query) |
                            Q(remark__icontains=query)
                        )
                
                print(f"Results after general query search: {queryset.count()}")
            
            # Handle individual field filters if no combinations were processed
            else:
                print("Processing individual field filters...")
                
                if has_name_filter:
                    print(f"Filtering by name: '{data['name']}'")
                    queryset = queryset.filter(name__icontains=data['name'])
                
                if has_contact_filter:
                    print(f"Filtering by contact: '{data['contact']}'")
                    queryset = queryset.filter(contact__icontains=data['contact'])
                
                if has_nid_filter:
                    print(f"Filtering by NID: '{data['nid']}'")
                    queryset = queryset.filter(nid__icontains=data['nid'])
                
                if has_address_filter:
                    print(f"Filtering by address: '{data['address']}'")
                    queryset = queryset.filter(address__icontains=data['address'])
                
                if has_atoll_filter:
                    print(f"Filtering by atoll: '{data['atoll']}'")
                    queryset = queryset.filter(atoll__icontains=data['atoll'])
                
                if has_island_filter:
                    print(f"Filtering by island: '{data['island']}'")
                    queryset = queryset.filter(island__icontains=data['island'])
                
                if has_party_filter:
                    print(f"Filtering by party: '{data['party']}'")
                    queryset = queryset.filter(party__icontains=data['party'])
                
                if has_profession_filter:
                    print(f"Filtering by profession: '{data['profession']}'")
                    queryset = queryset.filter(profession__icontains=data['profession'])
                
                if has_gender_filter:
                    print(f"Filtering by gender: '{data['gender']}'")
                    queryset = queryset.filter(gender__icontains=data['gender'])
                
                if has_remark_filter:
                    print(f"Filtering by remark: '{data['remark']}'")
                    queryset = queryset.filter(remark__icontains=data['remark'])
                
                if has_pep_status_filter:
                    print(f"Filtering by PEP status: '{data['pep_status']}'")
                    queryset = queryset.filter(pep_status__icontains=data['pep_status'])
                
                if has_min_age_filter:
                    print(f"Filtering by minimum age: {data['min_age']}")
                    # Convert DOB to age for filtering
                    from datetime import datetime, timedelta
                    cutoff_date = datetime.now() - timedelta(days=data['min_age'] * 365.25)
                    queryset = queryset.filter(DOB__lte=cutoff_date.strftime('%d/%m/%Y'))
                
                if has_max_age_filter:
                    print(f"Filtering by maximum age: {data['max_age']}")
                    # Convert DOB to age for filtering
                    from datetime import datetime, timedelta
                    cutoff_date = datetime.now() - timedelta(days=data['max_age'] * 365.25)
                    queryset = queryset.filter(DOB__gte=cutoff_date.strftime('%d/%m/%Y'))
                
                print(f"Results after individual field filters: {queryset.count()}")
            
            # Pagination
            page = data.get('page', 1)
            page_size = data.get('page_size', 20)
            start = (page - 1) * page_size
            end = start + page_size
            
            total_count = queryset.count()
            results = queryset[start:end]
            
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
            atoll = request.query_params.get('atoll', '')
            island = request.query_params.get('island', '')
            party = request.query_params.get('party', '')
            profession = request.query_params.get('profession', '')
            
            # Start with entries that have images - use image_status flag
            queryset = PhoneBookEntry.objects.exclude(image_status__isnull=True).exclude(image_status='0')
            
            # Debug: Log the search parameters
            print(f"Premium image search - Query: '{query}', Party: '{party}', PEP only: {pep_only}")
            print(f"Initial queryset count (entries with images): {queryset.count()}")
            
            # Apply PEP filter if requested
            if pep_only:
                queryset = queryset.filter(pep_status='1')  # 1 means PEP in your data
            
            # Apply search filters
            if query:
                queryset = queryset.filter(
                    Q(name__icontains=query) |
                    Q(contact__icontains=query) |
                    Q(nid__icontains=query) |
                    Q(address__icontains=query) |
                    Q(party__icontains=query) |
                    Q(profession__icontains=query) |
                    Q(remark__icontains=query)
                )
            
            if atoll:
                queryset = queryset.filter(atoll__icontains=atoll)
            
            if island:
                queryset = queryset.filter(island__icontains=island)
            
            if party:
                print(f"Filtering by party: '{party}'")
                party_filtered = queryset.filter(party__icontains=party)
                print(f"Entries with party '{party}': {party_filtered.count()}")
                queryset = party_filtered
            
            if profession:
                queryset = queryset.filter(profession__icontains=profession)
            
            # Pagination
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            start = (page - 1) * page_size
            end = start + page_size
            
            total_count = queryset.count()
            results = queryset[start:end]
            
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
                'threshold_required': threshold
            })
            
        except Exception as e:
            return Response({
                'error': 'Failed to perform premium image search',
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
        
        change.status = 'approved'
        change.reviewed_by = request.user
        change.reviewed_at = timezone.now()
        change.save()
        
        return Response({'message': 'Change approved'})
    
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
    permission_classes = [CanViewAnalytics]
    
    def list(self, request):
        """Get basic analytics overview"""
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
