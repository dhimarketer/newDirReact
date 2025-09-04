#!/usr/bin/env python3
# 2025-01-31: Update gender detection using authoritative feminine names list
# Uses clean_feminine_names_abc.txt as the source of truth for feminine names

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

def load_authoritative_feminine_names():
    """Load the authoritative list of feminine names from clean_feminine_names_abc.txt"""
    
    feminine_names_file = os.path.join(os.path.dirname(__file__), 'clean_feminine_names_abc.txt')
    
    if not os.path.exists(feminine_names_file):
        logger.error(f"Feminine names file not found: {feminine_names_file}")
        return set()
    
    feminine_names = set()
    
    try:
        with open(feminine_names_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                # Skip empty lines and header lines
                if line and not line.startswith('=') and not line.startswith('Total:') and not line.startswith('CLEAN'):
                    feminine_names.add(line.lower())
        
        logger.info(f"Loaded {len(feminine_names)} authoritative feminine names")
        return feminine_names
        
    except Exception as e:
        logger.error(f"Error loading feminine names file: {e}")
        return set()

def is_feminine_name_authoritative(name, feminine_names_set):
    """Enhanced function to detect feminine names using authoritative list"""
    if not name:
        return False
        
    name_lower = name.lower().strip()
    
    # Split name into parts for checking
    name_parts = [part.strip() for part in name_lower.split() if part.strip()]
    
    # Check if any part of the name is in the authoritative feminine names list
    for part in name_parts:
        if part in feminine_names_set:
            return True
    
    # Additional pattern-based detection for names ending with -a or -th
    # Only apply if not already detected by authoritative list
    if name_lower.endswith('a') and len(name_lower) > 3:
        # Exclude some common male names ending with 'a'
        male_exceptions = ['abdulla', 'abdula', 'rasheed', 'mohamed', 'ahmed', 'umar', 'ali']
        if name_lower not in male_exceptions:
            return True
    
    # Check for names ending with -th (feminine pattern)
    if name_lower.endswith('th') and len(name_lower) > 4:
        return True
        
    return False

def update_gender_fields_authoritative():
    """Update gender fields using authoritative feminine names list"""
    
    logger.info("=" * 60)
    logger.info("GENDER UPDATE USING AUTHORITATIVE FEMININE NAMES LIST")
    logger.info("=" * 60)
    
    # Load authoritative feminine names
    logger.info("Step 1: Loading authoritative feminine names list...")
    feminine_names_set = load_authoritative_feminine_names()
    
    if not feminine_names_set:
        logger.error("Failed to load feminine names list. Aborting.")
        return None
    
    logger.info(f"Loaded {len(feminine_names_set)} authoritative feminine names")
    
    # Show some examples of loaded names
    sample_names = list(feminine_names_set)[:10]
    logger.info(f"Sample feminine names: {', '.join(sample_names)}")
    
    # Step 1: Clear all existing gender data to start fresh
    logger.info("\nStep 2: Clearing all existing gender data...")
    total_entries = PhoneBookEntry.objects.count()
    PhoneBookEntry.objects.all().update(gender=None)
    logger.info(f"Cleared gender data for {total_entries} entries")
    
    # Step 2: Identify and skip entries with non-blank extra field (expatriates/businesses)
    logger.info("\nStep 3: Identifying entries with non-blank extra field (expatriates/businesses)...")
    entries_with_extra = PhoneBookEntry.objects.exclude(
        Q(extra__isnull=True) | Q(extra__exact='')
    ).count()
    logger.info(f"Found {entries_with_extra} entries with non-blank extra field - these will be skipped")
    
    # Show some examples of entries with extra field
    sample_extra_entries = PhoneBookEntry.objects.exclude(
        Q(extra__isnull=True) | Q(extra__exact='')
    ).order_by('pid')[:5]
    logger.info("Sample entries with extra field (will be skipped):")
    for entry in sample_extra_entries:
        logger.info(f"  - {entry.name} (extra: '{entry.extra}')")
    
    # Step 3: Detect female names using authoritative list (skip entries with non-blank extra field)
    logger.info("\nStep 4: Detecting female names using authoritative list...")
    
    # Find entries without gender and without non-blank extra field - use batch processing for efficiency
    entries_for_gender_detection = PhoneBookEntry.objects.filter(
        Q(gender__isnull=True) | Q(gender__exact='')
    ).filter(
        Q(extra__isnull=True) | Q(extra__exact='')
    ).filter(
        name__isnull=False
    ).exclude(
        name__exact=''
    ).order_by('pid')  # Sort by primary key for consistent processing
    
    total_entries_to_process = entries_for_gender_detection.count()
    logger.info(f"Processing {total_entries_to_process} entries for gender detection (excluding expatriates/businesses)")
    
    female_detections = 0
    sample_female_detections = []
    batch_size = 1000  # Process in batches for better performance
    
    # Process in batches to avoid memory issues
    for i in range(0, total_entries_to_process, batch_size):
        batch_entries = entries_for_gender_detection[i:i + batch_size]
        
        for entry in batch_entries:
            # Use authoritative feminine name detection
            if is_feminine_name_authoritative(entry.name, feminine_names_set):
                entry.gender = 'f'
                entry.save(update_fields=['gender'])
                female_detections += 1
                
                # Collect samples for logging
                if len(sample_female_detections) < 10:
                    sample_female_detections.append(entry.name)
        
        # Log progress every 10 batches
        if (i // batch_size) % 10 == 0:
            logger.info(f"Processed {min(i + batch_size, total_entries_to_process)}/{total_entries_to_process} entries...")
    
    logger.info(f"Detected {female_detections} female names using authoritative list")
    if sample_female_detections:
        logger.info(f"Sample female detections: {', '.join(sample_female_detections)}")
    
    # Step 4: Set remaining entries as male (assume rest as male, but skip expatriates/businesses)
    logger.info("\nStep 5: Setting remaining entries as male (excluding expatriates/businesses)...")
    entries_still_without_gender = PhoneBookEntry.objects.filter(
        Q(gender__isnull=True) | Q(gender__exact='')
    ).filter(
        Q(extra__isnull=True) | Q(extra__exact='')
    ).filter(
        name__isnull=False
    ).exclude(
        name__exact=''
    ).order_by('pid')  # Sort by primary key for consistent processing
    
    total_male_entries = entries_still_without_gender.count()
    logger.info(f"Setting {total_male_entries} entries as male...")
    
    male_assignments = 0
    
    # Process in batches for better performance
    for i in range(0, total_male_entries, batch_size):
        batch_entries = entries_still_without_gender[i:i + batch_size]
        
        for entry in batch_entries:
            entry.gender = 'm'
            entry.save(update_fields=['gender'])
            male_assignments += 1
        
        # Log progress every 10 batches
        if (i // batch_size) % 10 == 0:
            logger.info(f"Assigned male to {min(i + batch_size, total_male_entries)}/{total_male_entries} entries...")
    
    logger.info(f"Assigned {male_assignments} entries as male")
    
    # Step 5: Count entries with non-blank extra field (expatriates/businesses) that were skipped
    entries_with_extra_skipped = PhoneBookEntry.objects.exclude(
        Q(extra__isnull=True) | Q(extra__exact='')
    ).count()
    
    logger.info(f"Skipped {entries_with_extra_skipped} entries with non-blank extra field (expatriates/businesses)")
    
    # Step 6: Final statistics
    final_with_gender = PhoneBookEntry.objects.exclude(
        Q(gender__isnull=True) | Q(gender__exact='')
    ).count()
    
    female_entries = PhoneBookEntry.objects.filter(gender='f').count()
    male_entries = PhoneBookEntry.objects.filter(gender='m').count()
    entries_without_gender = PhoneBookEntry.objects.filter(
        Q(gender__isnull=True) | Q(gender__exact='')
    ).count()
    
    logger.info("\n" + "=" * 60)
    logger.info("AUTHORITATIVE GENDER UPDATE COMPLETED!")
    logger.info("=" * 60)
    logger.info(f"Total entries: {total_entries}")
    logger.info(f"Entries with gender: {final_with_gender}")
    logger.info(f"Female entries: {female_entries} ({(female_entries/total_entries)*100:.1f}%)")
    logger.info(f"Male entries: {male_entries} ({(male_entries/total_entries)*100:.1f}%)")
    logger.info(f"Entries without gender: {entries_without_gender}")
    logger.info(f"Entries with non-blank extra field (skipped): {entries_with_extra_skipped}")
    logger.info(f"Female detections (authoritative): {female_detections}")
    logger.info(f"Male assignments: {male_assignments}")
    logger.info("=" * 60)
    
    return {
        'total_entries': total_entries,
        'female_entries': female_entries,
        'male_entries': male_entries,
        'entries_without_gender': entries_without_gender,
        'entries_with_extra_skipped': entries_with_extra_skipped,
        'female_detections': female_detections,
        'male_assignments': male_assignments,
        'feminine_names_loaded': len(feminine_names_set)
    }

def main():
    """Main execution function"""
    logger.info("Starting AUTHORITATIVE gender field update...")
    
    try:
        with transaction.atomic():
            result = update_gender_fields_authoritative()
        
        if result:
            logger.info("Authoritative gender update completed successfully!")
            return 0
        else:
            logger.error("Authoritative gender update failed!")
            return 1
        
    except Exception as e:
        logger.error(f"Authoritative gender update failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
