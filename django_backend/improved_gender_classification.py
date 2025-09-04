#!/usr/bin/env python3
"""
Improved Gender Classification Script
=====================================

This script implements an improved gender classification system that:
1. Checks if "extra" field is blank (only process entries with blank extra field)
2. Sorts name fields for faster matching
3. First checks against exclusive feminine names
4. Then checks against exclusive male names  
5. Finally checks against expatriate names (mark as 'e')

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
        with open('/home/mine/Documents/codingProjects/DirReactFinal/django_backend/exclusive_female_names_20250904_033837.txt', 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip().lower()
                if line and not line.startswith('=') and not line.startswith('EXCLUSIVE') and not line.startswith('Total:'):
                    female_names.add(line)
        print(f"Loaded {len(female_names)} exclusive female names")
    except FileNotFoundError:
        print("Warning: exclusive_female_names_20250904_033837.txt not found")
    
    # Load exclusive male names
    male_names = set()
    try:
        with open('/home/mine/Documents/codingProjects/DirReactFinal/django_backend/exclusive_male_names_20250904_033837.txt', 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip().lower()
                if line and not line.startswith('=') and not line.startswith('EXCLUSIVE') and not line.startswith('Total:'):
                    male_names.add(line)
        print(f"Loaded {len(male_names)} exclusive male names")
    except FileNotFoundError:
        print("Warning: exclusive_male_names_20250904_033837.txt not found")
    
    # Load expatriate names
    expatriate_names = set()
    try:
        with open('/home/mine/Documents/codingProjects/DirReactFinal/django_backend/clean_expatriate_name_parts_20250904_100336.txt', 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip().lower()
                if line and not line.startswith('=') and not line.startswith('CLEAN') and not line.startswith('Total:') and not line.startswith('These are') and not line.startswith('All English') and not line.startswith('Use these') and not line.startswith('If a name'):
                    expatriate_names.add(line)
        print(f"Loaded {len(expatriate_names)} expatriate name parts")
    except FileNotFoundError:
        print("Warning: clean_expatriate_name_parts_20250904_100336.txt not found")
    
    return female_names, male_names, expatriate_names

def extract_name_parts(name):
    """Extract and sort name parts from a full name for faster matching"""
    if not name:
        return []
    
    # Split by common separators and clean up
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
    Classify gender based on name parts using the improved logic:
    1. First check against exclusive feminine names
    2. Then check against exclusive male names
    3. Finally check against expatriate names
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
    
    # Step 3: Check against expatriate names
    for part in name_parts:
        if part in expatriate_names:
            return 'e', f"expatriate_{part}"
    
    return None, "unclassified"

def main():
    """Main function to run the improved gender classification"""
    print("Starting Improved Gender Classification")
    print("=" * 50)
    
    # Load name lists
    female_names, male_names, expatriate_names = load_name_lists()
    
    if not female_names and not male_names and not expatriate_names:
        print("Error: No name lists loaded. Exiting.")
        return
    
    # Get all contacts with blank extra field
    print("\nQuerying contacts with blank extra field...")
    contacts = PhoneBookEntry.objects.filter(extra__isnull=True).exclude(extra='').exclude(extra__exact='')
    
    # Also include contacts where extra field is None or empty string
    contacts = PhoneBookEntry.objects.filter(
        models.Q(extra__isnull=True) | 
        models.Q(extra='') | 
        models.Q(extra__exact='')
    )
    
    total_contacts = contacts.count()
    print(f"Found {total_contacts} contacts with blank extra field")
    
    if total_contacts == 0:
        print("No contacts found with blank extra field. Exiting.")
        return
    
    # Statistics
    stats = {
        'processed': 0,
        'F': 0,  # Female
        'M': 0,  # Male
        'e': 0,  # Expatriate
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
                # Extract and sort name parts
                name_parts = extract_name_parts(contact.name)
                
                # Classify gender
                gender, reason = classify_gender(name_parts, female_names, male_names, expatriate_names)
                
                if gender:
                    contact.gender = gender
                    batch_updates.append(contact)
                    stats[gender] += 1
                else:
                    stats['unclassified'] += 1
                
                stats['processed'] += 1
                
                # Log progress every 1000 contacts
                if stats['processed'] % 1000 == 0:
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
    print(f"\nClassification Complete!")
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
        f.write(f"## 2025-01-31 23:59 | django_backend/improved_gender_classification.py | EXECUTED - Improved gender classification with sorted name matching: {stats['F']} female, {stats['M']} male, {stats['e']} expatriate, {stats['unclassified']} unclassified | completed\n")

if __name__ == "__main__":
    main()
