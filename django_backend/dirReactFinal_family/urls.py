# 2025-01-27: Family tree URLs for dirReactFinal migration project
# Based on existing Flask family tree functionality

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FamilyGroupViewSet, FamilyMemberViewSet, FamilyRelationshipViewSet

router = DefaultRouter()
router.register(r'groups', FamilyGroupViewSet)
router.register(r'members', FamilyMemberViewSet)
router.register(r'relationships', FamilyRelationshipViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # 2025-01-28: Custom endpoints for family tree functionality
    path('groups/by_address/', FamilyGroupViewSet.as_view({'get': 'by_address'}), name='family-by-address'),
    path('groups/create_or_update_by_address/', FamilyGroupViewSet.as_view({'post': 'create_or_update_by_address'}), name='family-create-or-update-by-address'),
    path('groups/infer_family/', FamilyGroupViewSet.as_view({'post': 'infer_family'}), name='family-infer'),
    # 2025-01-31: NEW - Endpoint for creating sub-families when relationships change
    path('groups/create_sub_family/', FamilyGroupViewSet.as_view({'post': 'create_sub_family'}), name='family-create-sub-family'),
    
    # 2025-01-28: Family member management endpoints
    path('groups/<int:family_id>/members/', FamilyGroupViewSet.as_view({'get': 'members', 'post': 'add_member'}), name='family-members'),
    path('groups/<int:family_id>/members/<int:member_id>/', FamilyGroupViewSet.as_view({'put': 'update_member', 'delete': 'remove_member'}), name='family-member-detail'),
    path('groups/<int:family_id>/members/bulk/', FamilyGroupViewSet.as_view({'post': 'bulk_add_members'}), name='family-bulk-add-members'),
    
    # 2025-01-28: Family relationship management endpoints
    path('groups/<int:family_id>/relationships/', FamilyGroupViewSet.as_view({'get': 'relationships', 'post': 'add_relationship'}), name='family-relationships'),
    path('groups/<int:family_id>/relationships/<int:relationship_id>/', FamilyGroupViewSet.as_view({'put': 'update_relationship', 'delete': 'remove_relationship'}), name='family-relationship-detail'),
    
    # 2025-01-28: Family group management endpoints
    path('groups/<int:family_id>/export/', FamilyGroupViewSet.as_view({'get': 'export'}), name='family-export'),
    path('groups/<int:family_id>/stats/', FamilyGroupViewSet.as_view({'get': 'stats'}), name='family-stats'),
    path('groups/<int:family_id>/mark_manually_updated/', FamilyGroupViewSet.as_view({'patch': 'mark_manually_updated'}), name='family-mark-manually-updated'),
    path('groups/delete_updated_families/', FamilyGroupViewSet.as_view({'post': 'delete_updated_families'}), name='family-delete-updated'),
]
