# 2025-01-27: Custom throttling for dirReactFinal migration project
# Rate limiting for different API endpoints and user types

from rest_framework.throttling import UserRateThrottle, AnonRateThrottle, SimpleRateThrottle
from dirReactFinal_core.models import UserPermission

class BasicUserThrottle(UserRateThrottle):
    """Throttling for basic users"""
    rate = '100/hour'  # 100 requests per hour

class PremiumUserThrottle(UserRateThrottle):
    """Throttling for premium users"""
    rate = '500/hour'  # 500 requests per hour

class AdminUserThrottle(UserRateThrottle):
    """Throttling for admin users"""
    rate = '1000/hour'  # 1000 requests per hour

class AnonymousUserThrottle(AnonRateThrottle):
    """Throttling for anonymous users"""
    rate = '20/hour'  # 20 requests per hour

class SearchThrottle(UserRateThrottle):
    """Throttling for search operations"""
    rate = '50/hour'  # 50 searches per hour

class UploadThrottle(UserRateThrottle):
    """Throttling for file uploads"""
    rate = '10/hour'  # 10 uploads per hour

class AuthenticationThrottle(AnonRateThrottle):
    """Throttling for authentication attempts"""
    rate = '5/minute'  # 5 attempts per minute

class CustomUserThrottle(SimpleRateThrottle):
    """Custom throttling based on user type and permissions"""
    
    def get_cache_key(self, request, view):
        if request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }
    
    def get_rate(self, request):
        """Get rate limit based on user type and permissions"""
        if not request.user.is_authenticated:
            return '20/hour'  # Anonymous users
        
        user_type = request.user.user_type
        
        # Base rates by user type
        base_rates = {
            'basic': '100/hour',
            'premium': '500/hour',
            'moderator': '800/hour',
            'admin': '1000/hour'
        }
        
        base_rate = base_rates.get(user_type, '100/hour')
        
        # Check if user has custom rate limit permission
        try:
            user_perm = UserPermission.objects.get(
                user_type=user_type,
                module='api'
            )
            if user_perm.rate_limit:
                return user_perm.rate_limit
        except UserPermission.DoesNotExist:
            pass
        
        return base_rate

class ModuleSpecificThrottle(SimpleRateThrottle):
    """Throttling specific to different modules"""
    
    def __init__(self, module_name, default_rate='100/hour'):
        self.module_name = module_name
        self.default_rate = default_rate
        super().__init__()
    
    def get_cache_key(self, request, view):
        if request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        
        return f"throttle_{self.module_name}_{ident}"
    
    def get_rate(self, request):
        """Get rate limit based on module and user permissions"""
        if not request.user.is_authenticated:
            return '10/hour'  # Anonymous users have very limited access
        
        user_type = request.user.user_type
        
        # Check module-specific permissions
        try:
            user_perm = UserPermission.objects.get(
                user_type=user_type,
                module=self.module_name
            )
            
            # If user has custom rate limit for this module
            if user_perm.rate_limit:
                return user_perm.rate_limit
            
            # Base rates by user type for this module
            module_rates = {
                'basic': '50/hour',
                'premium': '200/hour',
                'moderator': '300/hour',
                'admin': '500/hour'
            }
            
            return module_rates.get(user_type, self.default_rate)
            
        except UserPermission.DoesNotExist:
            # Default rates if no specific permission is set
            default_rates = {
                'basic': '30/hour',
                'premium': '100/hour',
                'moderator': '200/hour',
                'admin': '300/hour'
            }
            
            return default_rates.get(user_type, self.default_rate)

# Module-specific throttling classes
class DirectoryThrottle(ModuleSpecificThrottle):
    """Throttling for directory operations"""
    def __init__(self):
        super().__init__('directory', '100/hour')

class FamilyThrottle(ModuleSpecificThrottle):
    """Throttling for family operations"""
    def __init__(self):
        super().__init__('family', '50/hour')

class ModerationThrottle(ModuleSpecificThrottle):
    """Throttling for moderation operations"""
    def __init__(self):
        super().__init__('moderation', '200/hour')

class UserManagementThrottle(ModuleSpecificThrottle):
    """Throttling for user management operations"""
    def __init__(self):
        super().__init__('users', '50/hour')

class AnalyticsThrottle(ModuleSpecificThrottle):
    """Throttling for analytics operations"""
    def __init__(self):
        super().__init__('analytics', '30/hour')

# Throttling configuration for different views
THROTTLE_CLASSES = {
    'default': {
        'throttle_classes': [CustomUserThrottle],
        'throttle_scope': 'default'
    },
    'search': {
        'throttle_classes': [SearchThrottle],
        'throttle_scope': 'search'
    },
    'upload': {
        'throttle_classes': [UploadThrottle],
        'throttle_scope': 'upload'
    },
    'auth': {
        'throttle_classes': [AuthenticationThrottle],
        'throttle_scope': 'auth'
    },
    'directory': {
        'throttle_classes': [DirectoryThrottle],
        'throttle_scope': 'directory'
    },
    'family': {
        'throttle_classes': [FamilyThrottle],
        'throttle_scope': 'family'
    },
    'moderation': {
        'throttle_classes': [ModerationThrottle],
        'throttle_scope': 'moderation'
    },
    'users': {
        'throttle_classes': [UserManagementThrottle],
        'throttle_scope': 'users'
    },
    'analytics': {
        'throttle_classes': [AnalyticsThrottle],
        'throttle_scope': 'analytics'
    }
}
