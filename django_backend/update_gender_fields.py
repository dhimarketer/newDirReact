#!/usr/bin/env python3
# 2025-01-28: SIMPLIFIED Gender field update script
# Fast and efficient approach: exact name matching + female name detection

import os
import sys
import django
from django.db import transaction
from django.db.models import Q
import logging

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_directory.models import PhoneBookEntry

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def update_gender_fields_simple():
    """Simple and fast gender field update"""
    
    # Step 1: Get all entries with gender data
    logger.info("Step 1: Finding entries with existing gender data...")
    entries_with_gender = PhoneBookEntry.objects.exclude(
        Q(gender__isnull=True) | Q(gender__exact='')
    ).values('name', 'gender')
    
    # Create a mapping of name -> gender
    name_gender_map = {}
    for entry in entries_with_gender:
        name_gender_map[entry['name']] = entry['gender']
    
    logger.info(f"Found {len(name_gender_map)} unique names with gender data")
    
    # Step 2: Update entries without gender using exact name matches
    logger.info("Step 2: Updating gender using exact name matches...")
    entries_without_gender = PhoneBookEntry.objects.filter(
        Q(gender__isnull=True) | Q(gender__exact='')
    )
    
    updates_from_names = 0
    for entry in entries_without_gender:
        if entry.name in name_gender_map:
            entry.gender = name_gender_map[entry.name]
            entry.save(update_fields=['gender'])
            updates_from_names += 1
    
    logger.info(f"Updated {updates_from_names} entries using exact name matches")
    
    # Step 3: Detect female names by checking for female name parts
    logger.info("Step 3: Detecting female names by name parts...")
    
    # Common female name parts in Maldivian names
    female_name_parts = [
        'fathmath', 'fathimath', 'aishath', 'aishath', 'mariyam', 'mariya',
        'hawwa', 'hawwa', 'shareefa', 'shareefa', 'shazna', 'shazna',
        'jameela', 'jameela', 'adheeba', 'adheeba', 'aminath', 'aminath',
        'shabana', 'shabana', 'faiga', 'faiga'
    ]
    
    # Find entries still without gender
    entries_still_without_gender = PhoneBookEntry.objects.filter(
        Q(gender__isnull=True) | Q(gender__exact='')
    )
    
    female_detections = 0
    for entry in entries_still_without_gender:
        # Skip entries with null names
        if not entry.name:
            continue
            
        name_lower = entry.name.lower()
        for female_part in female_name_parts:
            if female_part in name_lower:
                entry.gender = 'f'
                entry.save(update_fields=['gender'])
                female_detections += 1
                break
    
    logger.info(f"Detected {female_detections} female names by name parts")
    
    # Step 4: Final statistics
    final_with_gender = PhoneBookEntry.objects.exclude(
        Q(gender__isnull=True) | Q(gender__exact='')
    ).count()
    
    total_entries = PhoneBookEntry.objects.count()
    
    logger.info("=" * 50)
    logger.info("GENDER UPDATE COMPLETED!")
    logger.info(f"Total entries: {total_entries}")
    logger.info(f"Entries with gender: {final_with_gender}")
    logger.info(f"Entries without gender: {total_entries - final_with_gender}")
    logger.info(f"Updates from name matches: {updates_from_names}")
    logger.info(f"Female detections: {female_detections}")
    logger.info("=" * 50)
    
    return {
        'total_entries': total_entries,
        'entries_with_gender': final_with_gender,
        'updates_from_names': updates_from_names,
        'female_detections': female_detections
    }

def main():
    """Main execution function"""
    logger.info("Starting SIMPLIFIED gender field update...")
    
    try:
        with transaction.atomic():
            result = update_gender_fields_simple()
        
        logger.info("Gender update completed successfully!")
        return 0
        
    except Exception as e:
        logger.error(f"Gender update failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
