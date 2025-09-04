#!/usr/bin/env python3
# 2025-01-31: Extract unique feminine name parts to text file

import os
import sys
import django
from django.db.models import Q
from collections import Counter

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_directory.models import PhoneBookEntry

def extract_feminine_parts_to_file():
    """Extract unique feminine name parts and save to text file"""
    
    print("Extracting unique feminine name parts from database...")
    
    # Get all entries with gender data
    female_entries = PhoneBookEntry.objects.filter(gender='f').values_list('name', flat=True)
    male_entries = PhoneBookEntry.objects.filter(gender='m').values_list('name', flat=True)
    
    print(f"Found {female_entries.count()} female entries")
    print(f"Found {male_entries.count()} male entries")
    
    # Split names into parts
    female_name_parts = []
    male_name_parts = []
    
    print("Processing female names...")
    for name in female_entries:
        if name:
            parts = [part.strip().lower() for part in name.split() if part.strip()]
            female_name_parts.extend(parts)
    
    print("Processing male names...")
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
    
    print(f"Found {len(unique_feminine_sorted)} unique feminine name parts")
    
    # Save to text file
    output_file = "unique_feminine_name_parts.txt"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("UNIQUE FEMININE NAME PARTS FROM DATABASE ANALYSIS\n")
        f.write("=" * 60 + "\n")
        f.write(f"Total unique feminine name parts: {len(unique_feminine_sorted)}\n")
        f.write(f"Generated from {female_entries.count()} female entries\n")
        f.write(f"Excluded {len(all_female_parts.intersection(all_male_parts))} common parts that appear in both genders\n")
        f.write("=" * 60 + "\n\n")
        
        f.write("FEMININE NAME PARTS (sorted by frequency):\n")
        f.write("-" * 40 + "\n")
        
        for i, part in enumerate(unique_feminine_sorted, 1):
            count = female_part_counts[part]
            f.write(f"{i:4d}. {part:<25} (appears {count:4d} times)\n")
        
        f.write("\n" + "=" * 60 + "\n")
        f.write("PYTHON LIST FORMAT:\n")
        f.write("=" * 60 + "\n")
        f.write("female_name_parts = [\n")
        
        # Write in chunks of 10 for better readability
        for i in range(0, len(unique_feminine_sorted), 10):
            chunk = unique_feminine_sorted[i:i+10]
            f.write("    ")
            f.write(", ".join([f"'{part}'" for part in chunk]))
            if i + 10 < len(unique_feminine_sorted):
                f.write(",")
            f.write("\n")
        
        f.write("]\n")
        
        f.write("\n" + "=" * 60 + "\n")
        f.write("PATTERN ANALYSIS:\n")
        f.write("=" * 60 + "\n")
        
        # Analyze patterns
        names_ending_a = [name for name in unique_feminine_sorted if name.endswith('a')]
        names_ending_th = [name for name in unique_feminine_sorted if name.endswith('th')]
        names_ending_ha = [name for name in unique_feminine_sorted if name.endswith('ha')]
        names_ending_na = [name for name in unique_feminine_sorted if name.endswith('na')]
        
        f.write(f"Names ending with -a: {len(names_ending_a)}\n")
        f.write(f"Names ending with -th: {len(names_ending_th)}\n")
        f.write(f"Names ending with -ha: {len(names_ending_ha)}\n")
        f.write(f"Names ending with -na: {len(names_ending_na)}\n")
        
        f.write(f"\nTop 20 names ending with -a:\n")
        for name in names_ending_a[:20]:
            f.write(f"  - {name}\n")
        
        f.write(f"\nTop 20 names ending with -th:\n")
        for name in names_ending_th[:20]:
            f.write(f"  - {name}\n")
    
    print(f"Unique feminine name parts saved to: {output_file}")
    print(f"Total: {len(unique_feminine_sorted)} unique feminine name parts")
    
    return unique_feminine_sorted

if __name__ == "__main__":
    extract_feminine_parts_to_file()
