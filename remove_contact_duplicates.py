#!/usr/bin/env python
"""
2024-12-28: Temporary script to remove duplicates from contact field
Script to identify and handle duplicate contact numbers in the phonebook database

USAGE:
    cd /home/mine/Documents/codingProjects/DirReactFinal
    python remove_contact_duplicates.py

REQUIREMENTS:
    - Virtual environment activated (venv)
    - Django backend dependencies installed
    - Database accessible
"""

import os
import sys
import django
import re
from collections import defaultdict
from datetime import datetime

# Add the django_backend directory to Python path
django_backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'django_backend')
sys.path.append(django_backend_path)

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from django.db import connection, transaction
from dirReactFinal_directory.models import PhoneBookEntry

def normalize_contact(contact):
    """
    Normalize contact number by removing spaces, dashes, and other non-digit characters
    Keep only digits for comparison
    """
    if not contact:
        return ""
    
    # Remove all non-digit characters
    normalized = re.sub(r'[^\d]', '', str(contact))
    return normalized

def find_contact_duplicates():
    """
    Find all duplicate contact numbers in the database
    Returns a dictionary with contact numbers as keys and list of entries as values
    """
    print("🔍 Searching for duplicate contact numbers...")
    
    # Get all entries with non-empty contact numbers
    entries = PhoneBookEntry.objects.exclude(
        contact__isnull=True
    ).exclude(
        contact__exact=''
    ).values('pid', 'name', 'contact', 'address', 'nid')
    
    # Group by normalized contact number
    contact_groups = defaultdict(list)
    
    for entry in entries:
        normalized_contact = normalize_contact(entry['contact'])
        if normalized_contact and len(normalized_contact) >= 7:  # Valid contact length
            contact_groups[normalized_contact].append(entry)
    
    # Filter to only groups with duplicates
    duplicates = {contact: entries for contact, entries in contact_groups.items() 
                 if len(entries) > 1}
    
    print(f"📊 Found {len(duplicates)} contact numbers with duplicates")
    return duplicates

def analyze_duplicates(duplicates):
    """
    Analyze duplicate entries to determine the best strategy for handling them
    """
    print("\n📋 Analyzing duplicate entries...")
    
    total_duplicates = 0
    merge_candidates = []
    conflict_entries = []
    
    for contact, entries in duplicates.items():
        total_duplicates += len(entries)
        
        # Check if entries can be merged (same name or similar)
        names = [entry['name'].strip().lower() for entry in entries]
        unique_names = set(names)
        
        if len(unique_names) == 1:
            # Same name - good merge candidate
            merge_candidates.append({
                'contact': contact,
                'entries': entries,
                'reason': 'Same name'
            })
        elif len(unique_names) <= 2:
            # Similar names - potential merge candidate
            merge_candidates.append({
                'contact': contact,
                'entries': entries,
                'reason': 'Similar names'
            })
        else:
            # Different names - conflict
            conflict_entries.append({
                'contact': contact,
                'entries': entries,
                'reason': 'Different names'
            })
    
    print(f"📈 Analysis Results:")
    print(f"   Total duplicate entries: {total_duplicates}")
    print(f"   Merge candidates: {len(merge_candidates)}")
    print(f"   Conflict entries: {len(conflict_entries)}")
    
    return merge_candidates, conflict_entries

def select_best_entry(entries):
    """
    Select the best entry from a list of duplicate entries
    Priority: most complete data, then highest PID (newest)
    """
    def entry_score(entry):
        score = 0
        
        # Score based on data completeness
        if entry['nid'] and entry['nid'].strip():
            score += 10
        if entry['address'] and entry['address'].strip():
            score += 5
        if entry['name'] and entry['name'].strip():
            score += 3
            
        # Prefer higher PID (newer entries)
        score += entry['pid'] / 1000000
        
        return score
    
    return max(entries, key=entry_score)

def merge_duplicate_entries(merge_candidates, dry_run=True):
    """
    Merge duplicate entries by keeping the best one and removing others
    """
    print(f"\n🔄 {'[DRY RUN] ' if dry_run else ''}Merging duplicate entries...")
    
    merged_count = 0
    removed_count = 0
    
    for candidate in merge_candidates:
        contact = candidate['contact']
        entries = candidate['entries']
        reason = candidate['reason']
        
        if len(entries) <= 1:
            continue
            
        # Select the best entry to keep
        best_entry = select_best_entry(entries)
        entries_to_remove = [e for e in entries if e['pid'] != best_entry['pid']]
        
        print(f"\n📞 Contact: {contact}")
        print(f"   Reason: {reason}")
        print(f"   Keeping: PID {best_entry['pid']} - {best_entry['name']}")
        print(f"   Removing: {len(entries_to_remove)} entries")
        
        for entry in entries_to_remove:
            print(f"     - PID {entry['pid']} - {entry['name']}")
        
        if not dry_run:
            try:
                with transaction.atomic():
                    # Remove duplicate entries
                    for entry in entries_to_remove:
                        PhoneBookEntry.objects.filter(pid=entry['pid']).delete()
                        removed_count += 1
                    
                    merged_count += 1
                    print(f"   ✅ Merged successfully")
                    
            except Exception as e:
                print(f"   ❌ Error merging: {e}")
        else:
            merged_count += 1
            removed_count += len(entries_to_remove)
            print(f"   ✅ [DRY RUN] Would merge successfully")
    
    print(f"\n📊 Merge Summary:")
    print(f"   Groups processed: {merged_count}")
    print(f"   Entries removed: {removed_count}")
    
    return merged_count, removed_count

def handle_conflict_entries(conflict_entries, dry_run=True):
    """
    Handle entries with different names but same contact number
    """
    print(f"\n⚠️  {'[DRY RUN] ' if dry_run else ''}Handling conflict entries...")
    
    for conflict in conflict_entries:
        contact = conflict['contact']
        entries = conflict['entries']
        reason = conflict['reason']
        
        print(f"\n📞 Contact: {contact}")
        print(f"   Reason: {reason}")
        print(f"   Entries with different names:")
        
        for entry in entries:
            print(f"     - PID {entry['pid']} - {entry['name']} - {entry['address']}")
        
        print(f"   ⚠️  Manual review required - different people with same contact")
    
    return len(conflict_entries)

def export_duplicates_report(duplicates, filename=None):
    """
    Export duplicate entries to CSV for manual review
    """
    if not filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"contact_duplicates_report_{timestamp}.csv"
    
    print(f"\n📄 Exporting duplicates report to: {filename}")
    
    try:
        import csv
        
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['contact', 'pid', 'name', 'address', 'nid', 'duplicate_count']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            
            for contact, entries in duplicates.items():
                for entry in entries:
                    writer.writerow({
                        'contact': contact,
                        'pid': entry['pid'],
                        'name': entry['name'],
                        'address': entry['address'],
                        'nid': entry['nid'],
                        'duplicate_count': len(entries)
                    })
        
        print(f"✅ Report exported successfully: {filename}")
        return filename
        
    except Exception as e:
        print(f"❌ Error exporting report: {e}")
        return None

def main():
    """
    Main function to run the duplicate removal process
    """
    print("🚀 Starting Contact Duplicates Removal Script")
    print("=" * 50)
    
    try:
        # Step 1: Find duplicates
        duplicates = find_contact_duplicates()
        
        if not duplicates:
            print("✅ No duplicate contact numbers found!")
            return
        
        # Step 2: Analyze duplicates
        merge_candidates, conflict_entries = analyze_duplicates(duplicates)
        
        # Step 3: Export report
        report_file = export_duplicates_report(duplicates)
        
        # Step 4: Handle merge candidates (dry run first)
        if merge_candidates:
            print(f"\n🔄 Running DRY RUN for merge candidates...")
            merge_duplicate_entries(merge_candidates, dry_run=True)
            
            # Ask for confirmation
            print(f"\n❓ Do you want to proceed with merging {len(merge_candidates)} groups?")
            print("   This will remove duplicate entries permanently.")
            response = input("   Type 'yes' to proceed, anything else to cancel: ").strip().lower()
            
            if response == 'yes':
                print(f"\n🔄 Proceeding with actual merge...")
                merge_duplicate_entries(merge_candidates, dry_run=False)
            else:
                print("❌ Merge cancelled by user")
        
        # Step 5: Report conflicts
        if conflict_entries:
            handle_conflict_entries(conflict_entries, dry_run=True)
            print(f"\n⚠️  {len(conflict_entries)} conflict entries require manual review")
            print(f"   Check the exported report: {report_file}")
        
        print(f"\n✅ Script completed successfully!")
        print(f"   Report file: {report_file}")
        
    except Exception as e:
        print(f"❌ Script failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
