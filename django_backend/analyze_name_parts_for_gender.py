#!/usr/bin/env python3
# 2025-01-31: NEW - Gender detection based on most frequent name parts from database analysis
# This script analyzes existing gender data to find top 10 most common name parts for each gender
# Then updates gender fields based on name prefixes

import os
import sys
import django
from django.db import transaction
from django.db.models import Q, Count
from collections import Counter
import logging
import re

# Setup Django environment (only if not already set up)
if not hasattr(django, 'apps') or not django.apps.apps.ready:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
    django.setup()

from dirReactFinal_directory.models import PhoneBookEntry

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Also print to console for Django shell
def log_and_print(message):
    logger.info(message)
    print(message)

def extract_name_parts(name):
    """Extract individual name parts from a full name"""
    if not name:
        return []
    
    # Split by common separators and clean up
    parts = re.split(r'[\s,.-]+', name.strip())
    # Filter out empty parts and convert to lowercase
    return [part.lower().strip() for part in parts if part.strip()]

def analyze_gender_name_parts():
    """Analyze existing gender data to find most frequent name parts for each gender"""
    
    log_and_print("Analyzing existing gender data to find most frequent name parts...")
    
    # Get all entries with gender data
    entries_with_gender = PhoneBookEntry.objects.exclude(
        Q(gender__isnull=True) | Q(gender__exact='')
    ).values('name', 'gender')
    
    log_and_print(f"Found {len(entries_with_gender)} entries with gender data")
    
    # Separate by gender
    male_names = []
    female_names = []
    
    for entry in entries_with_gender:
        name_parts = extract_name_parts(entry['name'])
        if entry['gender'].upper() in ['M', 'MALE']:
            male_names.extend(name_parts)
        elif entry['gender'].upper() in ['F', 'FEMALE']:
            female_names.extend(name_parts)
    
    # Count frequency of each name part
    male_counter = Counter(male_names)
    female_counter = Counter(female_names)
    
    # Get top 10 most frequent name parts for each gender
    top_male_parts = [part for part, count in male_counter.most_common(10)]
    top_female_parts = [part for part, count in female_counter.most_common(10)]
    
    log_and_print("Top 10 most frequent male name parts:")
    for i, (part, count) in enumerate(male_counter.most_common(10), 1):
        log_and_print(f"  {i}. {part} ({count} occurrences)")
    
    log_and_print("Top 10 most frequent female name parts:")
    for i, (part, count) in enumerate(female_counter.most_common(10), 1):
        log_and_print(f"  {i}. {part} ({count} occurrences)")
    
    return top_male_parts, top_female_parts

def detect_gender_by_name_prefix(name, male_prefixes, female_prefixes):
    """Detect gender based on name prefixes from top frequent name parts"""
    if not name:
        return None
    
    name_lower = name.lower().strip()
    
    # Check if name starts with any of the top female prefixes
    for female_prefix in female_prefixes:
        if name_lower.startswith(female_prefix.lower()):
            return 'f'
    
    # Check if name starts with any of the top male prefixes
    for male_prefix in male_prefixes:
        if name_lower.startswith(male_prefix.lower()):
            return 'm'
    
    return None

def update_gender_by_name_parts():
    """Update gender fields based on name prefix analysis"""
    
    log_and_print("Starting gender detection based on name prefix analysis...")
    
    # Step 1: Analyze existing data to get top name parts
    top_male_parts, top_female_parts = analyze_gender_name_parts()
    
    # Step 2: Get entries without gender or with uncertain gender
    entries_to_update = PhoneBookEntry.objects.filter(
        Q(gender__isnull=True) | Q(gender__exact='') | Q(gender__in=['O', 'OTHER'])
    )
    
    log_and_print(f"Found {entries_to_update.count()} entries to analyze for gender detection")
    
    # Step 3: Update gender based on name prefixes
    male_detections = 0
    female_detections = 0
    no_detection = 0
    
    for entry in entries_to_update:
        if not entry.name:
            continue
            
        detected_gender = detect_gender_by_name_prefix(
            entry.name, top_male_parts, top_female_parts
        )
        
        if detected_gender:
            entry.gender = detected_gender
            entry.save(update_fields=['gender'])
            
            if detected_gender == 'm':
                male_detections += 1
                if male_detections <= 5:  # Log first few for debugging
                    logger.debug(f"Detected male: {entry.name}")
            else:
                female_detections += 1
                if female_detections <= 5:  # Log first few for debugging
                    logger.debug(f"Detected female: {entry.name}")
        else:
            no_detection += 1
    
    # Step 4: Final statistics
    final_with_gender = PhoneBookEntry.objects.exclude(
        Q(gender__isnull=True) | Q(gender__exact='')
    ).count()
    
    total_entries = PhoneBookEntry.objects.count()
    
    log_and_print("=" * 60)
    log_and_print("GENDER DETECTION BY NAME PARTS COMPLETED!")
    log_and_print("=" * 60)
    log_and_print(f"Total entries: {total_entries}")
    log_and_print(f"Entries with gender: {final_with_gender}")
    log_and_print(f"Entries without gender: {total_entries - final_with_gender}")
    log_and_print(f"Male detections: {male_detections}")
    log_and_print(f"Female detections: {female_detections}")
    log_and_print(f"No detection possible: {no_detection}")
    log_and_print("=" * 60)
    log_and_print("Top male name prefixes used:")
    for i, prefix in enumerate(top_male_parts, 1):
        log_and_print(f"  {i}. {prefix}")
    log_and_print("Top female name prefixes used:")
    for i, prefix in enumerate(top_female_parts, 1):
        log_and_print(f"  {i}. {prefix}")
    log_and_print("=" * 60)
    
    return {
        'total_entries': total_entries,
        'entries_with_gender': final_with_gender,
        'male_detections': male_detections,
        'female_detections': female_detections,
        'no_detection': no_detection,
        'top_male_parts': top_male_parts,
        'top_female_parts': top_female_parts
    }

def main():
    """Main execution function"""
    log_and_print("Starting gender detection based on name prefix analysis...")
    
    try:
        with transaction.atomic():
            result = update_gender_by_name_parts()
        
        log_and_print("Gender detection completed successfully!")
        return 0
        
    except Exception as e:
        log_and_print(f"Gender detection failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

# Execute the main function when run directly
if __name__ == "__main__":
    main()
else:
    # When imported in Django shell, just run the main function
    main()
