#!/usr/bin/env python3
# 2025-01-31: Update gender detection with full database-driven feminine name list

import os
import sys
import django
from django.db.models import Q
from collections import Counter

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_directory.models import PhoneBookEntry

def get_comprehensive_feminine_parts():
    """Get comprehensive list of feminine name parts from database analysis"""
    
    # Get all entries with gender data
    female_entries = PhoneBookEntry.objects.filter(gender='f').values_list('name', flat=True)
    male_entries = PhoneBookEntry.objects.filter(gender='m').values_list('name', flat=True)
    
    # Split names into parts
    female_name_parts = []
    male_name_parts = []
    
    for name in female_entries:
        if name:
            parts = [part.strip().lower() for part in name.split() if part.strip()]
            female_name_parts.extend(parts)
    
    for name in male_entries:
        if name:
            parts = [part.strip().lower() for part in name.split() if part.strip()]
            male_name_parts.extend(parts)
    
    # Count frequency of each name part
    female_part_counts = Counter(female_name_parts)
    male_part_counts = Counter(male_name_parts)
    
    # Find name parts that appear in both genders
    all_female_parts = set(female_part_counts.keys())
    all_male_parts = set(male_part_counts.keys())
    
    # Find unique feminine parts (appear only in female names)
    unique_feminine_parts = all_female_parts - all_male_parts
    
    # Sort by frequency
    unique_feminine_sorted = sorted(unique_feminine_parts, key=lambda x: female_part_counts[x], reverse=True)
    
    return unique_feminine_sorted

def is_feminine_name(name, feminine_parts):
    """Enhanced function to detect feminine names"""
    if not name:
        return False
        
    name_lower = name.lower().strip()
    
    # Check for specific feminine name parts
    for female_part in feminine_parts:
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

def update_gender_fields_comprehensive():
    """Comprehensive gender field update using full database analysis"""
    
    print("=" * 60)
    print("COMPREHENSIVE GENDER UPDATE WITH DATABASE ANALYSIS")
    print("=" * 60)
    
    # Get comprehensive feminine parts list
    print("Step 1: Analyzing database for feminine name parts...")
    feminine_parts = get_comprehensive_feminine_parts()
    print(f"Found {len(feminine_parts)} unique feminine name parts")
    
    # Show top 20 most frequent feminine parts
    print("\nTop 20 most frequent feminine name parts:")
    for i, part in enumerate(feminine_parts[:20], 1):
        print(f"{i:2d}. {part}")
    
    # Step 1: Standardize existing gender data (convert to lowercase)
    print("\nStep 2: Standardizing existing gender data...")
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
    
    print(f"Standardized {standardized_count} existing gender entries")
    
    # Step 2: Re-evaluate existing gender assignments using comprehensive feminine detection
    print("\nStep 3: Re-evaluating existing gender assignments...")
    
    # Find entries that are currently marked as male but might be female
    male_entries = PhoneBookEntry.objects.filter(gender='m')
    reclassified_female = 0
    
    for entry in male_entries:
        if is_feminine_name(entry.name, feminine_parts):
            entry.gender = 'f'
            entry.save(update_fields=['gender'])
            reclassified_female += 1
            if reclassified_female <= 10:  # Log first 10 for debugging
                print(f"  Reclassified as female: {entry.name}")
    
    print(f"Reclassified {reclassified_female} entries from male to female")
    
    # Step 3: Final statistics
    final_with_gender = PhoneBookEntry.objects.exclude(
        Q(gender__isnull=True) | Q(gender__exact='')
    ).count()
    
    total_entries = PhoneBookEntry.objects.count()
    female_entries = PhoneBookEntry.objects.filter(gender='f').count()
    male_entries = PhoneBookEntry.objects.filter(gender='m').count()
    
    print("\n" + "=" * 60)
    print("COMPREHENSIVE GENDER UPDATE COMPLETED!")
    print("=" * 60)
    print(f"Total entries: {total_entries}")
    print(f"Entries with gender: {final_with_gender}")
    print(f"Female entries: {female_entries} ({(female_entries/total_entries)*100:.1f}%)")
    print(f"Male entries: {male_entries} ({(male_entries/total_entries)*100:.1f}%)")
    print(f"Reclassified as female: {reclassified_female}")
    print("=" * 60)
    
    return {
        'total_entries': total_entries,
        'female_entries': female_entries,
        'male_entries': male_entries,
        'reclassified_female': reclassified_female,
        'feminine_parts_count': len(feminine_parts)
    }

def main():
    """Main execution function"""
    print("Starting COMPREHENSIVE gender field update with database analysis...")
    
    try:
        result = update_gender_fields_comprehensive()
        print("Comprehensive gender update completed successfully!")
        return 0
        
    except Exception as e:
        print(f"Comprehensive gender update failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
