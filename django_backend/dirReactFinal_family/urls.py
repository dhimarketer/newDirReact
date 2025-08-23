# 2025-01-27: Family tree URLs for dirReactFinal migration project
# Based on existing Flask family tree functionality

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import FamilyGroupViewSet, FamilyMemberViewSet, FamilyRelationshipViewSet

# Create the main router for family groups
router = DefaultRouter()
router.register(r'groups', FamilyGroupViewSet, basename='family-group')

# Create nested routers for family members and relationships
family_groups_router = routers.NestedDefaultRouter(router, r'groups', lookup='family')
family_groups_router.register(r'members', FamilyMemberViewSet, basename='family-member')
family_groups_router.register(r'relationships', FamilyRelationshipViewSet, basename='family-relationship')

app_name = 'family'

urlpatterns = [
    # Include the main router URLs
    path('', include(router.urls)),
    
    # Include the nested router URLs
    path('', include(family_groups_router.urls)),
]

# The resulting URL patterns will be:
# /api/family/groups/ - List/Create family groups
# /api/family/groups/{id}/ - Retrieve/Update/Delete family group
# /api/family/groups/{id}/members/ - List/Create family members
# /api/family/groups/{id}/members/{member_id}/ - Retrieve/Update/Delete family member
# /api/family/groups/{id}/relationships/ - List/Create family relationships
# /api/family/groups/{id}/relationships/{relationship_id}/ - Retrieve/Update/Delete family relationship
# /api/family/groups/{id}/members/ - Get members (custom action)
# /api/family/groups/{id}/relationships/ - Get relationships (custom action)
# /api/family/groups/{id}/stats/ - Get family group statistics (custom action)
