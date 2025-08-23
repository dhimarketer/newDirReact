# 2025-01-27: Scoring models for dirReactFinal migration project
# Based on existing Flask scoring and gamification functionality

from django.db import models
from dirReactFinal_core.models import User
from dirReactFinal_directory.models import PhoneBookEntry

class ScoreTransaction(models.Model):
    """
    Score transaction model for tracking point changes
    """
    TRANSACTION_TYPES = [
        ('earn', 'Earned'),
        ('spend', 'Spent'),
        ('bonus', 'Bonus'),
        ('penalty', 'Penalty'),
        ('referral', 'Referral Bonus'),
        ('admin_adjustment', 'Admin Adjustment'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='score_transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    points = models.IntegerField()  # Positive for earned/bonus, negative for spent/penalty
    description = models.TextField()
    
    # Related objects (optional)
    related_entry = models.ForeignKey(PhoneBookEntry, on_delete=models.CASCADE, null=True, blank=True)
    related_user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='related_score_transactions')
    
    # Admin information
    processed_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='processed_score_transactions')
    admin_notes = models.TextField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'score_transactions'
        ordering = ['-created_at']
        verbose_name = 'Score Transaction'
        verbose_name_plural = 'Score Transactions'
    
    def __str__(self):
        return f"{self.user.username} {self.get_transaction_type_display()}: {self.points} points"
    
    def get_absolute_points(self):
        """Get the absolute value of points"""
        return abs(self.points)

class ScoreRule(models.Model):
    """
    Score rules for defining how points are awarded/deducted
    """
    RULE_TYPES = [
        ('action', 'Action-based'),
        ('referral', 'Referral-based'),
        ('bonus', 'Bonus'),
        ('penalty', 'Penalty'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    rule_type = models.CharField(max_length=20, choices=RULE_TYPES)
    points = models.IntegerField()
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    
    # Conditions (stored as JSON)
    conditions = models.JSONField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'score_rules'
        verbose_name = 'Score Rule'
        verbose_name_plural = 'Score Rules'
    
    def __str__(self):
        return f"{self.name}: {self.points} points"

class UserScoreHistory(models.Model):
    """
    User score history for tracking score changes over time
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='score_history')
    score_before = models.IntegerField()
    score_after = models.IntegerField()
    change_amount = models.IntegerField()
    transaction = models.ForeignKey(ScoreTransaction, on_delete=models.CASCADE, related_name='score_history_entries')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_score_history'
        ordering = ['-created_at']
        verbose_name = 'User Score History'
        verbose_name_plural = 'User Score Histories'
    
    def __str__(self):
        return f"{self.user.username}: {self.score_before} → {self.score_after} ({self.change_amount:+d})"

class ReferralBonus(models.Model):
    """
    Referral bonus model for tracking referral rewards
    """
    referrer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referral_bonuses_given')
    referred_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referral_bonuses_received')
    bonus_amount = models.IntegerField()
    is_paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'referral_bonuses'
        unique_together = ['referrer', 'referred_user']
        verbose_name = 'Referral Bonus'
        verbose_name_plural = 'Referral Bonuses'
    
    def __str__(self):
        return f"{self.referrer.username} → {self.referred_user.username}: {self.bonus_amount} points"
    
    def mark_as_paid(self):
        """Mark the referral bonus as paid"""
        from django.utils import timezone
        self.is_paid = True
        self.paid_at = timezone.now()
        self.save()

# Alias for backward compatibility
RewardRule = ScoreRule
