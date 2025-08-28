#!/usr/bin/env python3
"""
2025-01-28: Script to clean up family groups by removing members without DOB data

This script ensures that all family groups only contain members with calculable ages.
"""

import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_family.models import FamilyGroup
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def cleanup_family_groups():
    """Clean up all family groups by removing members without DOB data"""
    logger.info("Starting family group cleanup...")
    
    total_groups = FamilyGroup.objects.count()
    total_cleaned = 0
    total_members_removed = 0
    
    for family_group in FamilyGroup.objects.all():
        logger.info(f"Processing family group {family_group.id}: {family_group.name}")
        
        # Count members before cleanup
        members_before = family_group.members.count()
        
        # Clean up members without DOB
        members_removed = family_group.cleanup_members_without_dob()
        
        # Count members after cleanup
        members_after = family_group.members.count()
        
        if members_removed > 0:
            total_cleaned += 1
            total_members_removed += members_removed
            logger.info(f"  Cleaned up {family_group.id}: removed {members_removed} members without DOB")
            logger.info(f"  Members: {members_before} -> {members_after}")
        else:
            logger.info(f"  No cleanup needed for {family_group.id}")
    
    logger.info(f"Cleanup completed!")
    logger.info(f"Total family groups processed: {total_groups}")
    logger.info(f"Groups cleaned: {total_cleaned}")
    logger.info(f"Total members removed: {total_members_removed}")

if __name__ == '__main__':
    cleanup_family_groups()
