# 2025-01-27: Points management utilities for dynamic scoring system

from dirReactFinal_scoring.models import ScoreRule
from dirReactFinal_core.models import EventLog
from django.utils import timezone

def get_action_points(action_name):
    """
    Get the points cost/reward for a specific action from the database
    """
    try:
        rule = ScoreRule.objects.get(name=action_name, is_active=True)
        return rule.points, rule.conditions.get('threshold', 0)
    except ScoreRule.DoesNotExist:
        # Return default values if rule not found
        return 0, 0

def can_perform_action(user, action_name):
    """
    Check if user has enough points to perform an action
    """
    points_cost, threshold = get_action_points(action_name)
    
    # If action costs points, check if user has enough
    if points_cost < 0:
        return user.score >= abs(points_cost)
    
    # If action has a threshold, check if user meets it
    if threshold > 0:
        return user.score >= threshold
    
    return True

def deduct_points_for_action(user, action_name, request=None):
    """
    Deduct points for performing an action and log the transaction
    """
    points_cost, _ = get_action_points(action_name)
    
    if points_cost >= 0:
        return True  # No deduction needed
    
    points_to_deduct = abs(points_cost)
    
    if user.score < points_to_deduct:
        return False  # Insufficient points
    
    # Deduct points
    user.score -= points_to_deduct
    user.save()
    
    # Log the points deduction
    try:
        EventLog.objects.create(
            user=user,
            event_type='score_change',
            description=f'Deducted {points_to_deduct} points for {action_name}',
            ip_address=request.META.get('REMOTE_ADDR') if request else None,
            user_agent=request.META.get('HTTP_USER_AGENT', '') if request else ''
        )
    except Exception as e:
        print(f"Error logging points deduction: {str(e)}")
    
    return True

def get_user_points_summary(user):
    """
    Get a summary of user's points and available actions
    """
    actions = {}
    for rule in ScoreRule.objects.filter(is_active=True):
        actions[rule.name] = {
            'points': rule.points,
            'threshold': rule.conditions.get('threshold', 0),
            'can_perform': can_perform_action(user, rule.name)
        }
    
    return {
        'current_points': user.score,
        'actions': actions
    }
