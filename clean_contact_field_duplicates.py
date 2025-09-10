#!/usr/bin/env python
"""
2024-12-28: Script to remove duplicate numbers from contact field
Cleans up contact field by removing duplicate phone numbers within the same field

USAGE:
    cd /home/mine/Documents/codingProjects/DirReactFinal
    python clean_contact_field_duplicates.py

REQUIREMENTS:
    - Virtual environment activated (venv)
    - Django backend dependencies installed
    - Database accessible
"""

import os
import sys
import django
import re
from datetime import datetime

# Add the django_backend directory to Python path
django_backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'django_backend')
sys.path.append(django_backend_path)

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from django.db import connection, transaction
from dirReactFinal_directory.models import PhoneBookEntry

def extract_phone_numbers(contact_string):
    """
    Extract all phone numbers from a contact string
    Handles various separators: comma, semicolon, space, newline, etc.
    """
    if not contact_string:
        return []
    
    # Split by common separators
    separators = r'[,;|\n\r\t]+'
    numbers = re.split(separators, str(contact_string))
    
    # Clean each number
    cleaned_numbers = []
    for num in numbers:
        # Remove all non-digit characters except + at the beginning
        cleaned = re.sub(r'[^\d+]', '', num.strip())
        if cleaned and len(cleaned) >= 7:  # Valid phone number length
            cleaned_numbers.append(cleaned)
    
    return cleaned_numbers

def remove_duplicates_from_contact(contact_string):
    """
    Remove duplicate phone numbers from a contact string
    Preserves the original format as much as possible
    """
    if not contact_string:
        return contact_string
    
    # Extract unique phone numbers
    numbers = extract_phone_numbers(contact_string)
    unique_numbers = list(dict.fromkeys(numbers))  # Preserve order, remove duplicates
    
    if not unique_numbers:
        return contact_string
    
    # Join with comma and space (most common format)
    return ', '.join(unique_numbers)

def find_contacts_with_duplicates():
    """
    Find all contact fields that contain duplicate numbers
    """
    print("🔍 Searching for contact fields with duplicate numbers...")
    
    # Get all entries with non-empty contact numbers
    entries = PhoneBookEntry.objects.exclude(
        contact__isnull=True
    ).exclude(
        contact__exact=''
    ).values('pid', 'name', 'contact')
    
    duplicates_found = []
    
    for entry in entries:
        contact = entry['contact']
        numbers = extract_phone_numbers(contact)
        
        # Check if there are duplicates
        if len(numbers) != len(set(numbers)):
            duplicates_found.append({
                'pid': entry['pid'],
                'name': entry['name'],
                'original_contact': contact,
                'numbers': numbers,
                'unique_numbers': list(dict.fromkeys(numbers)),
                'cleaned_contact': remove_duplicates_from_contact(contact)
            })
    
    print(f"📊 Found {len(duplicates_found)} contact fields with duplicate numbers")
    return duplicates_found

def clean_contact_duplicates(duplicates, dry_run=True):
    """
    Clean duplicate numbers from contact fields
    """
    print(f"\n🧹 {'[DRY RUN] ' if dry_run else ''}Cleaning duplicate numbers from contact fields...")
    
    cleaned_count = 0
    total_duplicates_removed = 0
    
    for duplicate in duplicates:
        pid = duplicate['pid']
        name = duplicate['name']
        original = duplicate['original_contact']
        cleaned = duplicate['cleaned_contact']
        numbers = duplicate['numbers']
        unique_numbers = duplicate['unique_numbers']
        
        duplicates_removed = len(numbers) - len(unique_numbers)
        
        print(f"\n📞 PID {pid} - {name}")
        print(f"   Original: {original}")
        print(f"   Numbers found: {numbers}")
        print(f"   Unique numbers: {unique_numbers}")
        print(f"   Cleaned: {cleaned}")
        print(f"   Duplicates removed: {duplicates_removed}")
        
        if not dry_run:
            try:
                with transaction.atomic():
                    PhoneBookEntry.objects.filter(pid=pid).update(contact=cleaned)
                    cleaned_count += 1
                    total_duplicates_removed += duplicates_removed
                    print(f"   ✅ Updated successfully")
                    
            except Exception as e:
                print(f"   ❌ Error updating: {e}")
        else:
            cleaned_count += 1
            total_duplicates_removed += duplicates_removed
            print(f"   ✅ [DRY RUN] Would update successfully")
    
    print(f"\n📊 Cleaning Summary:")
    print(f"   Contact fields processed: {cleaned_count}")
    print(f"   Total duplicate numbers removed: {total_duplicates_removed}")
    
    return cleaned_count, total_duplicates_removed

def export_cleaning_report(duplicates, filename=None):
    """
    Export cleaning report to CSV
    """
    if not filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"contact_cleaning_report_{timestamp}.csv"
    
    print(f"\n📄 Exporting cleaning report to: {filename}")
    
    try:
        import csv
        
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['pid', 'name', 'original_contact', 'cleaned_contact', 'numbers_found', 'unique_numbers', 'duplicates_removed']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            
            for duplicate in duplicates:
                writer.writerow({
                    'pid': duplicate['pid'],
                    'name': duplicate['name'],
                    'original_contact': duplicate['original_contact'],
                    'cleaned_contact': duplicate['cleaned_contact'],
                    'numbers_found': ', '.join(duplicate['numbers']),
                    'unique_numbers': ', '.join(duplicate['unique_numbers']),
                    'duplicates_removed': len(duplicate['numbers']) - len(duplicate['unique_numbers'])
                })
        
        print(f"✅ Report exported successfully: {filename}")
        return filename
        
    except Exception as e:
        print(f"❌ Error exporting report: {e}")
        return None

def main():
    """
    Main function to run the contact field cleaning process
    """
    print("🚀 Starting Contact Field Duplicate Cleaning Script")
    print("=" * 60)
    
    try:
        # Step 1: Find contacts with duplicates
        duplicates = find_contacts_with_duplicates()
        
        if not duplicates:
            print("✅ No contact fields with duplicate numbers found!")
            return
        
        # Step 2: Show examples
        print(f"\n📋 Examples of duplicate numbers found:")
        for i, duplicate in enumerate(duplicates[:5]):  # Show first 5 examples
            print(f"   {i+1}. PID {duplicate['pid']} - {duplicate['name']}")
            print(f"      Original: {duplicate['original_contact']}")
            print(f"      Cleaned:  {duplicate['cleaned_contact']}")
            print(f"      Duplicates: {len(duplicate['numbers']) - len(duplicate['unique_numbers'])}")
        
        if len(duplicates) > 5:
            print(f"   ... and {len(duplicates) - 5} more")
        
        # Step 3: Export report
        report_file = export_cleaning_report(duplicates)
        
        # Step 4: Clean duplicates (dry run first)
        print(f"\n🔄 Running DRY RUN for cleaning...")
        clean_contact_duplicates(duplicates, dry_run=True)
        
        # Ask for confirmation
        print(f"\n❓ Do you want to proceed with cleaning {len(duplicates)} contact fields?")
        print("   This will remove duplicate numbers from contact fields permanently.")
        response = input("   Type 'yes' to proceed, anything else to cancel: ").strip().lower()
        
        if response == 'yes':
            print(f"\n🧹 Proceeding with actual cleaning...")
            clean_contact_duplicates(duplicates, dry_run=False)
        else:
            print("❌ Cleaning cancelled by user")
        
        print(f"\n✅ Script completed successfully!")
        print(f"   Report file: {report_file}")
        
    except Exception as e:
        print(f"❌ Script failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
