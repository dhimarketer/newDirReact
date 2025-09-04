#!/usr/bin/env python3
# 2025-01-31: Debug script for gender detection issues

import os
import sys
import django
from django.db.models import Q

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_directory.models import PhoneBookEntry

def debug_gender_issue():
    """Debug the gender detection issue"""
    
    print("=" * 60)
    print("GENDER DETECTION DEBUG")
    print("=" * 60)
    
    # Check the specific problematic entry
    entry = PhoneBookEntry.objects.filter(name='areesha abdul shakoor').first()
    if entry:
        print(f"Entry: {entry.name}")
        print(f"Gender: '{entry.gender}'")
        print(f"Gender type: {type(entry.gender)}")
        print(f"Gender length: {len(str(entry.gender)) if entry.gender else 'None'}")
    
    # Check all gender values
    print("\nAll unique gender values:")
    gender_values = PhoneBookEntry.objects.values_list('gender', flat=True).distinct()
    for gender in gender_values:
        count = PhoneBookEntry.objects.filter(gender=gender).count()
        print(f"  '{gender}' -> {count} entries")
    
    # Check entries with different gender formats
    print("\nChecking different gender formats:")
    print(f"Entries with gender='f': {PhoneBookEntry.objects.filter(gender='f').count()}")
    print(f"Entries with gender='F': {PhoneBookEntry.objects.filter(gender='F').count()}")
    print(f"Entries with gender='m': {PhoneBookEntry.objects.filter(gender='m').count()}")
    print(f"Entries with gender='M': {PhoneBookEntry.objects.filter(gender='M').count()}")
    print(f"Entries with gender='male': {PhoneBookEntry.objects.filter(gender='male').count()}")
    print(f"Entries with gender='female': {PhoneBookEntry.objects.filter(gender='female').count()}")
    
    # Check entries with null/empty gender
    null_gender = PhoneBookEntry.objects.filter(
        Q(gender__isnull=True) | Q(gender__exact='')
    ).count()
    print(f"Entries with null/empty gender: {null_gender}")

if __name__ == "__main__":
    debug_gender_issue()
