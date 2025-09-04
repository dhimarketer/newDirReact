#!/usr/bin/env python3
"""
Fix Expatriate Classification Script
===================================

This script fixes the gender classification for entries that were incorrectly
classified as expatriate due to common local surnames being in the expatriate list.

Author: AI Assistant
Date: 2025-01-31
"""

import os
import sys
import django
from django.db import connection
from collections import defaultdict
import time

# Add the Django project directory to Python path
sys.path.append('/home/mine/Documents/codingProjects/DirReactFinal/django_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_directory.models import PhoneBookEntry
from django.db import models

def load_name_lists():
    """Load the exclusive name lists from files"""
    print("Loading name lists...")
    
    # Load exclusive female names
    female_names = set()
    try:
        with open('exclusive_female_names_20250904_033837.txt', 'r') as f:
            for line in f:
                name = line.strip().lower()
                if name:
                    female_names.add(name)
        print(f"Loaded {len(female_names)} exclusive female names")
    except FileNotFoundError:
        print("Error: exclusive_female_names_20250904_033837.txt not found")
        return None, None, None
    
    # Load exclusive male names
    male_names = set()
    try:
        with open('exclusive_male_names_20250904_033837.txt', 'r') as f:
            for line in f:
                name = line.strip().lower()
                if name:
                    male_names.add(name)
        print(f"Loaded {len(male_names)} exclusive male names")
    except FileNotFoundError:
        print("Error: exclusive_male_names_20250904_033837.txt not found")
        return None, None, None
    
    # Load expatriate names but exclude common local surnames
    expatriate_names = set()
    common_local_surnames = {
        'ibrahim', 'haroon', 'hassan', 'usman', 'hussain', 'abdul', 'didi', 
        'kamal', 'shakir', 'moosa', 'ahmed', 'mohamed', 'ali', 'abdullah', 
        'raheem', 'gadir', 'abdulla'
    }
    
    try:
        with open('clean_expatriate_name_parts_20250904_100336.txt', 'r') as f:
            for line in f:
                name = line.strip().lower()
                if name and name not in common_local_surnames:
                    expatriate_names.add(name)
        print(f"Loaded {len(expatriate_names)} expatriate name parts (excluding common local surnames)")
    except FileNotFoundError:
        print("Error: clean_expatriate_name_parts_20250904_100336.txt not found")
        return None, None, None
    
    return female_names, male_names, expatriate_names

def parse_name_parts(name):
    """Parse name into parts, sorted by length for better matching"""
    if not name:
        return []
    
    parts = []
    for part in name.replace(',', ' ').replace('.', ' ').replace('-', ' ').split():
        part = part.strip().lower()
        if part and len(part) > 1:  # Skip single characters
            parts.append(part)
    
    # Sort by length (longest first) for more accurate matching
    parts.sort(key=len, reverse=True)
    return parts

def classify_gender(name_parts, female_names, male_names, expatriate_names):
    """
    Classify gender based on name parts using the corrected logic:
    1. First check against exclusive feminine names
    2. Then check against exclusive male names
    3. Finally check against expatriate names (excluding common local surnames)
    """
    if not name_parts:
        return None, "no_name_parts"
    
    # Step 1: Check against exclusive feminine names
    for part in name_parts:
        if part in female_names:
            return 'F', f"exclusive_female_{part}"
    
    # Step 2: Check against exclusive male names
    for part in name_parts:
        if part in male_names:
            return 'M', f"exclusive_male_{part}"
    
    # Step 3: Check against expatriate names (excluding common local surnames)
    for part in name_parts:
        if part in expatriate_names:
            return 'e', f"expatriate_{part}"
    
    return None, "unclassified"

def main():
    """Main function to fix expatriate classification"""
    print("Starting Fix Expatriate Classification")
    print("=" * 50)
    
    # Load name lists
    female_names, male_names, expatriate_names = load_name_lists()
    
    if not female_names or not male_names or not expatriate_names:
        print("Error: No name lists loaded. Exiting.")
        return
    
    # Get all contacts with gender='e' that need to be reclassified
    print("\nQuerying contacts with gender='e'...")
    contacts = PhoneBookEntry.objects.filter(gender='e')
    
    total_contacts = contacts.count()
    print(f"Found {total_contacts} contacts with gender='e' to reclassify")
    
    if total_contacts == 0:
        print("No contacts found with gender='e'. Exiting.")
        return
    
    # Statistics
    stats = {
        'processed': 0,
        'F': 0,  # Female
        'M': 0,  # Male
        'e': 0,  # Expatriate (correctly classified)
        'O': 0,  # Other
        'unclassified': 0,
        'errors': 0
    }
    
    # Process contacts in batches
    batch_size = 1000
    start_time = time.time()
    
    print(f"\nProcessing contacts in batches of {batch_size}...")
    
    for i in range(0, total_contacts, batch_size):
        batch_contacts = contacts[i:i + batch_size]
        batch_updates = []
        
        for contact in batch_contacts:
            try:
                # Parse name parts
                name_parts = parse_name_parts(contact.name)
                
                # Classify gender
                gender, reason = classify_gender(name_parts, female_names, male_names, expatriate_names)
                
                if gender:
                    contact.gender = gender
                    batch_updates.append(contact)
                    stats[gender] += 1
                else:
                    stats['unclassified'] += 1
                
                stats['processed'] += 1
                
                # Progress reporting
                if stats['processed'] % 10000 == 0:
                    elapsed = time.time() - start_time
                    rate = stats['processed'] / elapsed if elapsed > 0 else 0
                    print(f"Processed {stats['processed']}/{total_contacts} contacts ({rate:.1f} contacts/sec)")
                
            except Exception as e:
                stats['errors'] += 1
                print(f"Error processing contact {contact.pid}: {e}")
        
        # Bulk update the batch
        if batch_updates:
            PhoneBookEntry.objects.bulk_update(batch_updates, ['gender'], batch_size=500)
            print(f"Updated batch of {len(batch_updates)} contacts")
    
    # Final statistics
    elapsed = time.time() - start_time
    print(f"\nReclassification Complete!")
    print("=" * 50)
    print(f"Total processed: {stats['processed']}")
    print(f"Female: {stats['F']}")
    print(f"Male: {stats['M']}")
    print(f"Expatriate: {stats['e']}")
    print(f"Other: {stats['O']}")
    print(f"Unclassified: {stats['unclassified']}")
    print(f"Errors: {stats['errors']}")
    print(f"Time taken: {elapsed:.2f} seconds")
    print(f"Rate: {stats['processed']/elapsed:.1f} contacts/second")
    
    # Update project status
    with open('/home/mine/Documents/codingProjects/DirReactFinal/PROJECT_STATUS.txt', 'a') as f:
        f.write(f"## 2025-01-31 23:59 | django_backend/fix_expatriate_classification.py | EXECUTED - Fixed expatriate classification by reclassifying gender='e' entries: {stats['F']} female, {stats['M']} male, {stats['e']} expatriate, {stats['unclassified']} unclassified | completed\n")

if __name__ == "__main__":
    main()
