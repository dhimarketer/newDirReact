#!/usr/bin/env python3
"""
Update Unique Name Lists Script
==============================

This script updates the unique male and female name lists by extracting
first names from entries that are correctly classified as "M" or "F" in the database.

Author: AI Assistant
Date: 2025-01-31
"""

import os
import sys
import django
from collections import defaultdict
import time

# Add the Django project directory to Python path
sys.path.append('/home/mine/Documents/codingProjects/DirReactFinal/django_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_directory.models import PhoneBookEntry

def extract_first_name(full_name):
    """Extract the first name from a full name"""
    if not full_name:
        return None
    
    # Split by common separators and take the first part
    first_part = full_name.replace(',', ' ').replace('.', ' ').replace('-', ' ').split()[0]
    first_part = first_part.strip().lower()
    
    # Only return if it's a valid name (more than 1 character, not a number)
    if len(first_part) > 1 and not first_part.isdigit():
        return first_part
    
    return None

def load_existing_lists():
    """Load existing male and female name lists"""
    male_names = set()
    female_names = set()
    
    # Load existing male names
    try:
        with open('exclusive_male_names_20250904_033837.txt', 'r') as f:
            for line in f:
                name = line.strip().lower()
                if name:
                    male_names.add(name)
        print(f"Loaded {len(male_names)} existing male names")
    except FileNotFoundError:
        print("No existing male names file found")
    
    # Load existing female names
    try:
        with open('exclusive_female_names_20250904_033837.txt', 'r') as f:
            for line in f:
                name = line.strip().lower()
                if name:
                    female_names.add(name)
        print(f"Loaded {len(female_names)} existing female names")
    except FileNotFoundError:
        print("No existing female names file found")
    
    return male_names, female_names

def update_name_lists():
    """Update the unique name lists from database entries"""
    print("Starting Unique Name Lists Update")
    print("=" * 50)
    
    # Load existing lists
    male_names, female_names = load_existing_lists()
    
    # Get all entries with correct gender classifications
    male_entries = PhoneBookEntry.objects.filter(gender='M')
    female_entries = PhoneBookEntry.objects.filter(gender='F')
    
    print(f"Found {male_entries.count()} male entries")
    print(f"Found {female_entries.count()} female entries")
    
    # Extract first names from male entries
    print("\nProcessing male entries...")
    new_male_names = set()
    male_stats = defaultdict(int)
    
    for entry in male_entries:
        first_name = extract_first_name(entry.name)
        if first_name:
            new_male_names.add(first_name)
            male_stats[first_name] += 1
    
    # Extract first names from female entries
    print("Processing female entries...")
    new_female_names = set()
    female_stats = defaultdict(int)
    
    for entry in female_entries:
        first_name = extract_first_name(entry.name)
        if first_name:
            new_female_names.add(first_name)
            female_stats[first_name] += 1
    
    # Update the lists
    original_male_count = len(male_names)
    original_female_count = len(female_names)
    
    male_names.update(new_male_names)
    female_names.update(new_female_names)
    
    new_male_added = len(male_names) - original_male_count
    new_female_added = len(female_names) - original_female_count
    
    print(f"\nResults:")
    print(f"Male names: {original_male_count} -> {len(male_names)} (+{new_male_added})")
    print(f"Female names: {original_female_count} -> {len(female_names)} (+{new_female_added})")
    
    # Save updated male names list
    with open('exclusive_male_names_20250904_033837.txt', 'w') as f:
        for name in sorted(male_names):
            f.write(f"{name}\n")
    print(f"Saved {len(male_names)} male names to exclusive_male_names_20250904_033837.txt")
    
    # Save updated female names list
    with open('exclusive_female_names_20250904_033837.txt', 'w') as f:
        for name in sorted(female_names):
            f.write(f"{name}\n")
    print(f"Saved {len(female_names)} female names to exclusive_female_names_20250904_033837.txt")
    
    # Show most common names
    print(f"\n=== TOP 20 MOST COMMON MALE NAMES ===")
    for name, count in sorted(male_stats.items(), key=lambda x: x[1], reverse=True)[:20]:
        print(f"{name}: {count} occurrences")
    
    print(f"\n=== TOP 20 MOST COMMON FEMALE NAMES ===")
    for name, count in sorted(female_stats.items(), key=lambda x: x[1], reverse=True)[:20]:
        print(f"{name}: {count} occurrences")
    
    # Check for names that appear in both lists (potential conflicts)
    conflicts = male_names.intersection(female_names)
    if conflicts:
        print(f"\n=== CONFLICTS FOUND ({len(conflicts)} names in both lists) ===")
        for name in sorted(conflicts):
            male_count = male_stats.get(name, 0)
            female_count = female_stats.get(name, 0)
            print(f"{name}: {male_count} male, {female_count} female")
    
    # Update project status
    with open('/home/mine/Documents/codingProjects/DirReactFinal/PROJECT_STATUS.txt', 'a') as f:
        f.write(f"## 2025-01-31 23:59 | django_backend/update_unique_name_lists.py | EXECUTED - Updated unique name lists from database: {len(male_names)} male names (+{new_male_added}), {len(female_names)} female names (+{new_female_added}) | completed\n")

def main():
    """Main function"""
    update_name_lists()

if __name__ == "__main__":
    main()
