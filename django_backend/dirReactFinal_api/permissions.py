# 2025-01-27: Custom permissions for dirReactFinal migration project
# Role-based access control for API endpoints

from rest_framework import permissions
from dirReactFinal_core.models import UserPermission

class HasModulePermission(permissions.BasePermission):
    """Custom permission to check if user has access to a specific module"""
    
    def __init__(self, module_name, permission_type='read'):
        self.module_name = module_name
        self.permission_type = permission_type
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Superusers have all permissions
        if request.user.is_superuser:
            return True
        
        # Check user permissions for the module
        try:
            user_perm = UserPermission.objects.get(
                user_type=request.user.user_type,
                module=self.module_name
            )
            
            if self.permission_type == 'read':
                return user_perm.can_read
            elif self.permission_type == 'write':
                return user_perm.can_write
            elif self.permission_type == 'delete':
                return user_perm.can_delete
            elif self.permission_type == 'admin':
                return user_perm.can_admin
            
        except UserPermission.DoesNotExist:
            # If no specific permission is set, deny access
            return False
        
        return False

class IsOwnerOrReadOnly(permissions.BasePermission):
    """Custom permission to only allow owners of an object to edit it"""
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner
        return obj.user == request.user

class IsOwnerOrAdmin(permissions.BasePermission):
    """Custom permission to only allow owners or admins to access an object"""
    
    def has_object_permission(self, request, view, obj):
        # Admins can access everything
        if request.user.is_staff:
            return True
        
        # Check if user is the owner
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        elif hasattr(obj, 'requested_by'):
            return obj.requested_by == request.user
        
        return False

class CanModerate(permissions.BasePermission):
    """Custom permission for moderation actions"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Superusers and staff can moderate
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Check if user has moderator role
        return request.user.user_type in ['moderator', 'admin']
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Superusers and staff can moderate everything
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Moderators can moderate content
        if request.user.user_type in ['moderator', 'admin']:
            return True
        
        return False

class CanManageUsers(permissions.BasePermission):
    """Custom permission for user management actions"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Superusers and staff can manage users
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Check if user has admin role
        user_type = getattr(request.user, 'user_type', None)
        if user_type == 'admin':
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Superusers and staff can manage all users
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Admins can manage users
        if request.user.user_type == 'admin':
            return True
        
        # Users can only manage their own profile
        if obj == request.user:
            return True
        
        return False

class CanManageDirectory(permissions.BasePermission):
    """Custom permission for directory management actions"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Superusers and staff can manage directory
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Check if user has directory management permission
        try:
            user_perm = UserPermission.objects.get(
                user_type=request.user.user_type,
                module='directory'
            )
            
            # Check specific permissions based on request method
            if request.method in ['GET', 'HEAD', 'OPTIONS']:
                return user_perm.can_read
            elif request.method in ['POST', 'PUT', 'PATCH']:
                return user_perm.can_write
            elif request.method == 'DELETE':
                return user_perm.can_delete
            else:
                return user_perm.can_write
                
        except UserPermission.DoesNotExist:
            return False
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Superusers and staff can manage everything
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Check if user has directory management permission
        try:
            user_perm = UserPermission.objects.get(
                user_type=request.user.user_type,
                module='directory'
            )
            
            # Check specific permissions based on request method
            if request.method in ['GET', 'HEAD', 'OPTIONS']:
                return user_perm.can_read
            elif request.method in ['POST', 'PUT', 'PATCH']:
                return user_perm.can_write
            elif request.method == 'DELETE':
                return user_perm.can_delete
            else:
                return user_perm.can_write
                
        except UserPermission.DoesNotExist:
            return False

class CanManageFamily(permissions.BasePermission):
    """Custom permission for family management actions"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Superusers and staff can manage families
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Check if user has family management permission
        try:
            user_perm = UserPermission.objects.get(
                user_type=request.user.user_type,
                module='family'
            )
            
            # Check specific permissions based on request method
            if request.method in ['GET', 'HEAD', 'OPTIONS']:
                return user_perm.can_read
            elif request.method in ['POST', 'PUT', 'PATCH']:
                return user_perm.can_write
            elif request.method == 'DELETE':
                return user_perm.can_delete
            else:
                return user_perm.can_write
                
        except UserPermission.DoesNotExist:
            return False
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Superusers and staff can manage everything
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Check if user has family management permission
        try:
            user_perm = UserPermission.objects.get(
                user_type=request.user.user_type,
                module='family'
            )
            return user_perm.can_write
        except UserPermission.DoesNotExist:
            return False

class CanViewAnalytics(permissions.BasePermission):
    """Custom permission for viewing analytics"""
    
    def has_permission(self, request, view):
        # 2025-01-28: DEBUG - Log permission check details
        print(f"=== PERMISSION DEBUG ===")
        print(f"DEBUG: User authenticated: {request.user.is_authenticated}")
        print(f"DEBUG: User username: {request.user.username}")
        print(f"DEBUG: User is_superuser: {request.user.is_superuser}")
        print(f"DEBUG: User is_staff: {request.user.is_staff}")
        print(f"DEBUG: User user_type: {getattr(request.user, 'user_type', 'N/A')}")
        print(f"=== END PERMISSION DEBUG ===")
        
        if not request.user.is_authenticated:
            print("DEBUG: Permission denied - user not authenticated")
            return False
        
        # Superusers, staff, and admin users can view analytics
        if request.user.is_superuser or request.user.is_staff or request.user.user_type == 'admin':
            print("DEBUG: Permission granted - user is superuser, staff, or admin")
            return True
        
        # Check if user has analytics permission
        try:
            user_perm = UserPermission.objects.get(
                user_type=request.user.user_type,
                module='analytics'
            )
            print(f"DEBUG: Permission check result: {user_perm.can_read}")
            return user_perm.can_read
        except UserPermission.DoesNotExist:
            print("DEBUG: Permission denied - no UserPermission record found")
            return False

# Permission mixins for viewsets
class PermissionMixin:
    """Mixin to add custom permissions to viewsets"""
    
    def get_permissions(self):
        """Return the list of permissions that this view requires"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [CanManageDirectory]
        elif self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]

class UserPermissionMixin:
    """Mixin to add user management permissions to viewsets"""
    
    def get_permissions(self):
        """Return the list of permissions that this view requires"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [CanManageUsers]
        elif self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]

class FamilyPermissionMixin:
    """Mixin to add family management permissions to viewsets"""
    
    def get_permissions(self):
        """Return the list of permissions that this view requires"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [CanManageFamily]
        elif self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
