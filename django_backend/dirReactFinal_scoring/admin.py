# 2025-01-27: Admin configuration for scoring models

from django.contrib import admin
from .models import ScoreTransaction, ScoreRule, UserScoreHistory, ReferralBonus

@admin.register(ScoreTransaction)
class ScoreTransactionAdmin(admin.ModelAdmin):
    """Admin for ScoreTransaction model"""
    list_display = ['user', 'transaction_type', 'points', 'description', 'created_at']
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['user__username', 'description', 'admin_notes']
    readonly_fields = ['created_at']
    ordering = ['-created_at']

@admin.register(ScoreRule)
class ScoreRuleAdmin(admin.ModelAdmin):
    """Admin for ScoreRule model"""
    list_display = ['name', 'rule_type', 'points', 'is_active', 'created_at']
    list_filter = ['rule_type', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    list_editable = ['points', 'is_active']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(UserScoreHistory)
class UserScoreHistoryAdmin(admin.ModelAdmin):
    """Admin for UserScoreHistory model"""
    list_display = ['user', 'score_before', 'score_after', 'change_amount', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username']
    readonly_fields = ['created_at']
    ordering = ['-created_at']

@admin.register(ReferralBonus)
class ReferralBonusAdmin(admin.ModelAdmin):
    """Admin for ReferralBonus model"""
    list_display = ['referrer', 'referred_user', 'bonus_amount', 'is_paid', 'created_at']
    list_filter = ['is_paid', 'created_at']
    search_fields = ['referrer__username', 'referred_user__username']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
    
    actions = ['mark_as_paid']
    
    def mark_as_paid(self, request, queryset):
        """Mark selected referral bonuses as paid"""
        for bonus in queryset:
            bonus.mark_as_paid()
        updated = queryset.count()
        self.message_user(request, f'{updated} referral bonuses were marked as paid.')
    mark_as_paid.short_description = "Mark as paid"
