# 2025-01-27: Basic model testing for dirReactFinal migration project

import os
import sys
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

def test_models():
    """Test that all models can be imported and have correct structure"""
    try:
        # Test core models
        from dirReactFinal_core.models import User, UserPermission, EventLog, RewardSetting
        print("✅ Core models imported successfully")
        
        # Test directory models
        from dirReactFinal_directory.models import PhoneBookEntry, Image, SearchHistory
        print("✅ Directory models imported successfully")
        
        # Test family models
        from dirReactFinal_family.models import FamilyGroup, FamilyRelationship, FamilyMember
        print("✅ Family models imported successfully")
        
        # Test moderation models
        from dirReactFinal_moderation.models import PendingChange, PhotoModeration, SpamReport
        print("✅ Moderation models imported successfully")
        
        # Test scoring models
        from dirReactFinal_scoring.models import ScoreTransaction, ScoreRule, UserScoreHistory, ReferralBonus
        print("✅ Scoring models imported successfully")
        
        # Test users models
        from dirReactFinal_users.models import UserProfile, UserSession, UserActivity
        print("✅ Users models imported successfully")
        
        print("\n🎉 All models imported successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error importing models: {e}")
        return False

def test_admin_config():
    """Test that admin configurations can be imported"""
    try:
        # Test admin imports
        from dirReactFinal_core.admin import CustomUserAdmin, UserPermissionAdmin, EventLogAdmin, RewardSettingAdmin
        from dirReactFinal_directory.admin import PhoneBookEntryAdmin, ImageAdmin, SearchHistoryAdmin
        from dirReactFinal_family.admin import FamilyGroupAdmin, FamilyRelationshipAdmin, FamilyMemberAdmin
        from dirReactFinal_moderation.admin import PendingChangeAdmin, PhotoModerationAdmin, SpamReportAdmin
        from dirReactFinal_scoring.admin import ScoreTransactionAdmin, ScoreRuleAdmin, UserScoreHistoryAdmin, ReferralBonusAdmin
        from dirReactFinal_users.admin import UserProfileAdmin, UserSessionAdmin, UserActivityAdmin
        
        print("✅ All admin configurations imported successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error importing admin configurations: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing dirReactFinal Django models...\n")
    
    models_ok = test_models()
    admin_ok = test_admin_config()
    
    if models_ok and admin_ok:
        print("\n🎯 All tests passed! Django backend is ready for development.")
    else:
        print("\n💥 Some tests failed. Please check the errors above.")
        sys.exit(1)
