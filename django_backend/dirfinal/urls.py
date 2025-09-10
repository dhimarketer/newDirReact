# 2025-01-27: Main URL configuration for dirReactFinal migration project

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from dirReactFinal_core.views import get_islands, get_parties, get_atolls

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('dirReactFinal_api.urls')),
    path('api/family/', include('dirReactFinal_family.urls', namespace='family')),
    path('api/islands/', get_islands, name='get_islands'),
    path('api/atolls/', get_atolls, name='get_atolls'),
    path('api/parties/', get_parties, name='get_parties'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
