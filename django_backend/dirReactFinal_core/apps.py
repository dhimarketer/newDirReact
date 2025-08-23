# 2025-01-27: Core app configuration

from django.apps import AppConfig

class DirReactFinalCoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'dirReactFinal_core'
    verbose_name = 'dirReactFinal Core'
    
    def ready(self):
        """Import signals when app is ready"""
        try:
            import dirReactFinal_core.signals
        except ImportError:
            pass
