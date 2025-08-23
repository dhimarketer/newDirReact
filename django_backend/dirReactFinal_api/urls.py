# 2025-01-27: API URLs configuration for dirReactFinal migration project

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

# Import views
from .views import (
    UserLoginView, UserRegistrationView, UserLogoutView, UserProfileView,
    UserViewSet, PhoneBookEntryViewSet, ImageViewSet,
    FamilyGroupViewSet, FamilyMemberViewSet,
    PendingChangeViewSet, PhotoModerationViewSet,
    ScoreTransactionViewSet, RewardRuleViewSet,
    AnalyticsViewSet, HealthCheckView
)
from .token_views import CustomTokenObtainPairView, CustomTokenRefreshView

# Create router for API endpoints
router = DefaultRouter()

# Register API endpoints
router.register(r'users', UserViewSet, basename='user')
router.register(r'phonebook', PhoneBookEntryViewSet, basename='phonebook')
router.register(r'images', ImageViewSet, basename='image')
router.register(r'family-groups', FamilyGroupViewSet, basename='family-group')
router.register(r'family-members', FamilyMemberViewSet, basename='family-member')
router.register(r'pending-changes', PendingChangeViewSet, basename='pending-change')
router.register(r'photo-moderation', PhotoModerationViewSet, basename='photo-moderation')
router.register(r'score-transactions', ScoreTransactionViewSet, basename='score-transaction')
router.register(r'reward-rules', RewardRuleViewSet, basename='reward-rule')
router.register(r'analytics', AnalyticsViewSet, basename='analytics')

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='auth-login'),
    path('auth/register/', UserRegistrationView.as_view(), name='auth-register'),
    path('auth/logout/', UserLogoutView.as_view(), name='auth-logout'),
    path('auth/refresh/', CustomTokenRefreshView.as_view(), name='auth-refresh'),
    path('auth/profile/', UserProfileView.as_view(), name='auth-profile'),  # 2025-01-27: Fixed - use proper UserProfileView
    
    # Health check
    path('health/', HealthCheckView.as_view(), name='health-check'),
    
    # Include router URLs
    path('', include(router.urls)),
]
