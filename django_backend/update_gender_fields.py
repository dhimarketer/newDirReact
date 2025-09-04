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

def is_feminine_name(name):
    """Enhanced function to detect feminine names"""
    if not name:
        return False
        
    name_lower = name.lower().strip()
    
    # Comprehensive list of feminine name parts in Maldivian names (data-driven from database analysis)
    female_name_parts = [
        # Core traditional Maldivian feminine names
        'fathmath', 'fathimath', 'aishath', 'mariyam', 'mariya',
        'hawwa', 'shareefa', 'shazna', 'jameela', 'adheeba', 
        'aminath', 'shabana', 'faiga', 'areefa', 'areesha',
        'areeshath', 'nashida', 'nasheeda', 'shameema', 'shaheema',
        'shaheedha', 'zahra', 'zahira', 'zaheera', 'zareena',
        'zumna', 'zunaira', 'nabeeha', 'nasreena', 'naseema',
        'nazeera', 'shaheeda', 'shafeea', 'shimaaha', 'shaznaa',
        'riyasha', 'rifasha', 'rasheesha', 'raayasha', 'rafeesha',
        'ramaasha', 'raheema', 'rifga', 'rushda', 'rushdha',
        'raaja', 'raasha', 'ruwayda', 'ruwaydha', 'rayaasha',
        'rifaasha', 'rafeefa', 'rajeeva', 'rajeefa', 'raheefa'
    ]
    
    # Check for specific feminine name parts
    for female_part in female_name_parts:
        if female_part in name_lower:
            return True
    
    # Check for names ending with -a (feminine pattern)
    if name_lower.endswith('a') and len(name_lower) > 3:
        # Exclude some common male names ending with 'a'
        male_exceptions = ['abdulla', 'abdula', 'rasheed', 'mohamed', 'ahmed']
        if name_lower not in male_exceptions:
            return True
    
    # Check for names ending with -th (feminine pattern)
    if name_lower.endswith('th') and len(name_lower) > 4:
        return True
        
    return False

def update_gender_fields_simple():
    """Simple and fast gender field update"""
    
    # Step 1: Standardize existing gender data (convert to lowercase)
    logger.info("Step 1: Standardizing existing gender data...")
    entries_with_gender = PhoneBookEntry.objects.exclude(
        Q(gender__isnull=True) | Q(gender__exact='')
    )
    
    standardized_count = 0
    for entry in entries_with_gender:
        if entry.gender and entry.gender.upper() in ['M', 'F']:
            old_gender = entry.gender
            entry.gender = entry.gender.lower()
            entry.save(update_fields=['gender'])
            standardized_count += 1
            if standardized_count <= 5:  # Log first few for debugging
                logger.debug(f"Standardized {entry.name}: {old_gender} -> {entry.gender}")
    
    logger.info(f"Standardized {standardized_count} existing gender entries")
    
    # Step 2: Get all entries with gender data for name mapping
    logger.info("Step 2: Finding entries with existing gender data...")
    entries_with_gender = PhoneBookEntry.objects.exclude(
        Q(gender__isnull=True) | Q(gender__exact='')
    ).values('name', 'gender')
    
    # Create a mapping of name -> gender
    name_gender_map = {}
    for entry in entries_with_gender:
        name_gender_map[entry['name']] = entry['gender']
    
    logger.info(f"Found {len(name_gender_map)} unique names with gender data")
    
    # Step 3: Update entries without gender using exact name matches
    logger.info("Step 3: Updating gender using exact name matches...")
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
    
    # Step 4: Re-evaluate existing gender assignments using enhanced female detection
    logger.info("Step 4: Re-evaluating existing gender assignments...")
    
    # Find entries that are currently marked as male but might be female
    male_entries = PhoneBookEntry.objects.filter(gender='m')
    reclassified_female = 0
    
    for entry in male_entries:
        if is_feminine_name(entry.name):
            entry.gender = 'f'
            entry.save(update_fields=['gender'])
            reclassified_female += 1
            if reclassified_female <= 5:  # Log first few for debugging
                logger.debug(f"Reclassified as female: {entry.name}")
    
    logger.info(f"Reclassified {reclassified_female} entries from male to female")
    
    # Step 5: Detect female names by checking for female name parts and patterns
    logger.info("Step 5: Detecting female names by name parts and patterns...")
    
    # Find entries still without gender
    entries_still_without_gender = PhoneBookEntry.objects.filter(
        Q(gender__isnull=True) | Q(gender__exact='')
    )
    
    female_detections = 0
    for entry in entries_still_without_gender:
        # Skip entries with null names
        if not entry.name:
            continue
            
        # Use enhanced feminine name detection
        if is_feminine_name(entry.name):
            entry.gender = 'f'
            entry.save(update_fields=['gender'])
            female_detections += 1
            logger.debug(f"Detected female name: {entry.name}")
    
    logger.info(f"Detected {female_detections} female names by name parts")
    
    # Step 5: Set remaining entries as male (assume rest as male)
    logger.info("Step 5: Setting remaining entries as male...")
    entries_still_without_gender = PhoneBookEntry.objects.filter(
        Q(gender__isnull=True) | Q(gender__exact='')
    )
    
    male_assignments = 0
    for entry in entries_still_without_gender:
        if entry.name:  # Only assign male to entries with names
            entry.gender = 'm'
            entry.save(update_fields=['gender'])
            male_assignments += 1
    
    logger.info(f"Assigned {male_assignments} entries as male")
    
    # Step 6: Final statistics
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
    logger.info(f"Reclassified as female: {reclassified_female}")
    logger.info(f"Female detections: {female_detections}")
    logger.info(f"Male assignments: {male_assignments}")
    logger.info("=" * 50)
    
    return {
        'total_entries': total_entries,
        'entries_with_gender': final_with_gender,
        'updates_from_names': updates_from_names,
        'reclassified_female': reclassified_female,
        'female_detections': female_detections,
        'male_assignments': male_assignments
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
