#!/usr/bin/env python3
# 2025-01-31: Verification script for gender detection results

import os
import sys
import django
from django.db.models import Q

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_directory.models import PhoneBookEntry

def verify_gender_detection():
    """Verify that specific female names are correctly classified"""
    
    # Test names mentioned by user
    test_names = [
        'areefa mohamed fulhu',
        'areesha abdul shakoor',
        'areeshath',
        'fathmath',
        'aishath',
        'mariyam',
        'hawwa',
        'shareefa',
        'aminath'
    ]
    
    print("=" * 60)
    print("GENDER DETECTION VERIFICATION")
    print("=" * 60)
    
    for name in test_names:
        # Search for entries with this name
        entries = PhoneBookEntry.objects.filter(name__icontains=name)
        
        print(f"\nTesting name: '{name}'")
        print(f"Found {entries.count()} entries")
        
        for entry in entries[:3]:  # Show first 3 matches
            print(f"  - {entry.name} -> Gender: {entry.gender}")
    
    # Check overall statistics
    total_entries = PhoneBookEntry.objects.count()
    female_entries = PhoneBookEntry.objects.filter(gender='f').count()
    male_entries = PhoneBookEntry.objects.filter(gender='m').count()
    no_gender = PhoneBookEntry.objects.filter(
        Q(gender__isnull=True) | Q(gender__exact='')
    ).count()
    
    print("\n" + "=" * 60)
    print("OVERALL STATISTICS")
    print("=" * 60)
    print(f"Total entries: {total_entries}")
    print(f"Female entries: {female_entries}")
    print(f"Male entries: {male_entries}")
    print(f"No gender: {no_gender}")
    print(f"Female percentage: {(female_entries/total_entries)*100:.1f}%")
    print(f"Male percentage: {(male_entries/total_entries)*100:.1f}%")

if __name__ == "__main__":
    verify_gender_detection()
