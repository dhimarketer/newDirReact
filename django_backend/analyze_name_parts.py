#!/usr/bin/env python3
# 2025-01-31: Analyze database to identify unique feminine name parts
# Strategy: Compare classified female vs male names to find unique feminine parts

import os
import sys
import django
from django.db.models import Q
from collections import Counter, defaultdict
import re

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_directory.models import PhoneBookEntry

def split_name_into_parts(name):
    """Split a name into individual parts/words"""
    if not name:
        return []
    # Split by spaces and clean up
    parts = [part.strip().lower() for part in name.split() if part.strip()]
    return parts

def analyze_name_parts():
    """Analyze database to identify unique feminine name parts"""
    
    print("=" * 60)
    print("DATABASE-DRIVEN FEMININE NAME PARTS ANALYSIS")
    print("=" * 60)
    
    # Get all entries with gender data
    female_entries = PhoneBookEntry.objects.filter(gender='f').values_list('name', flat=True)
    male_entries = PhoneBookEntry.objects.filter(gender='m').values_list('name', flat=True)
    
    print(f"Found {female_entries.count()} female entries")
    print(f"Found {male_entries.count()} male entries")
    
    # Split names into parts
    female_name_parts = []
    male_name_parts = []
    
    print("\nProcessing female names...")
    for name in female_entries:
        parts = split_name_into_parts(name)
        female_name_parts.extend(parts)
    
    print("Processing male names...")
    for name in male_entries:
        parts = split_name_into_parts(name)
        male_name_parts.extend(parts)
    
    # Count frequency of each name part
    female_part_counts = Counter(female_name_parts)
    male_part_counts = Counter(male_name_parts)
    
    print(f"\nTotal female name parts: {len(female_name_parts)}")
    print(f"Total male name parts: {len(male_name_parts)}")
    print(f"Unique female name parts: {len(female_part_counts)}")
    print(f"Unique male name parts: {len(male_part_counts)}")
    
    # Find name parts that appear in both genders
    all_female_parts = set(female_part_counts.keys())
    all_male_parts = set(male_part_counts.keys())
    common_parts = all_female_parts.intersection(all_male_parts)
    
    print(f"\nCommon name parts (appear in both genders): {len(common_parts)}")
    
    # Find unique feminine parts (appear only in female names)
    unique_feminine_parts = all_female_parts - all_male_parts
    
    print(f"Unique feminine name parts: {len(unique_feminine_parts)}")
    
    # Find unique masculine parts (appear only in male names)  
    unique_masculine_parts = all_male_parts - all_female_parts
    
    print(f"Unique masculine name parts: {len(unique_masculine_parts)}")
    
    # Analyze common parts by frequency
    print("\n" + "=" * 60)
    print("COMMON NAME PARTS ANALYSIS (appear in both genders)")
    print("=" * 60)
    
    common_parts_analysis = []
    for part in sorted(common_parts):
        female_count = female_part_counts[part]
        male_count = male_part_counts[part]
        total_count = female_count + male_count
        female_ratio = (female_count / total_count) * 100
        
        common_parts_analysis.append({
            'part': part,
            'female_count': female_count,
            'male_count': male_count,
            'total_count': total_count,
            'female_ratio': female_ratio
        })
    
    # Sort by total frequency
    common_parts_analysis.sort(key=lambda x: x['total_count'], reverse=True)
    
    print("Top 20 most common name parts:")
    for i, analysis in enumerate(common_parts_analysis[:20], 1):
        print(f"{i:2d}. {analysis['part']:15} | F:{analysis['female_count']:4} M:{analysis['male_count']:4} | {analysis['female_ratio']:5.1f}% female")
    
    # Show unique feminine parts
    print("\n" + "=" * 60)
    print("UNIQUE FEMININE NAME PARTS")
    print("=" * 60)
    
    unique_feminine_sorted = sorted(unique_feminine_parts, key=lambda x: female_part_counts[x], reverse=True)
    
    print("All unique feminine name parts (sorted by frequency):")
    for i, part in enumerate(unique_feminine_sorted, 1):
        count = female_part_counts[part]
        print(f"{i:2d}. {part:20} (appears {count} times in female names)")
    
    # Show unique masculine parts
    print("\n" + "=" * 60)
    print("UNIQUE MASCULINE NAME PARTS")
    print("=" * 60)
    
    unique_masculine_sorted = sorted(unique_masculine_parts, key=lambda x: male_part_counts[x], reverse=True)
    
    print("All unique masculine name parts (sorted by frequency):")
    for i, part in enumerate(unique_masculine_sorted, 1):
        count = male_part_counts[part]
        print(f"{i:2d}. {part:20} (appears {count} times in male names)")
    
    # Generate the final list for the gender detection script
    print("\n" + "=" * 60)
    print("FINAL FEMININE NAME PARTS LIST FOR SCRIPT")
    print("=" * 60)
    
    print("female_name_parts = [")
    for part in unique_feminine_sorted:
        print(f"    '{part}',")
    print("]")
    
    print(f"\nTotal unique feminine name parts: {len(unique_feminine_sorted)}")
    
    return {
        'unique_feminine_parts': unique_feminine_sorted,
        'unique_masculine_parts': unique_masculine_sorted,
        'common_parts': list(common_parts),
        'female_part_counts': female_part_counts,
        'male_part_counts': male_part_counts
    }

if __name__ == "__main__":
    analyze_name_parts()
