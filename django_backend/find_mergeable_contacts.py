#!/usr/bin/env python3
"""
2025-01-29: NEW - Script to identify mergeable contacts in the t1 table

Criteria for merging:
1. Same name and address
2. One entry has NID, others are blank
3. One entry has island, others are blank
4. Merge will consolidate: phone numbers, remarks, party, DOB, and other fields
5. Preserve existing data by appending new data

This script only identifies candidates - does not perform actual merging.
"""

import os
import sys
import django
import csv
from collections import defaultdict
from typing import List, Dict, Tuple, Set
from datetime import datetime

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_directory.models import PhoneBookEntry
from dirReactFinal_core.models import Island, Atoll, Party

def normalize_text(text):
    """Normalize text for comparison by removing extra spaces and converting to lowercase"""
    if not text:
        return ""
    return " ".join(text.strip().lower().split())

def find_mergeable_contacts():
    """
    Find contacts that can be merged based on the specified criteria
    """
    print("🔍 Analyzing contacts for merge candidates...")
    print("=" * 80)
    
    # Get all entries
    all_entries = PhoneBookEntry.objects.all()
    print(f"Total contacts in database: {all_entries.count()}")
    
    # Group by normalized name + address
    name_address_groups = defaultdict(list)
    
    for entry in all_entries:
        normalized_name = normalize_text(entry.name)
        normalized_address = normalize_text(entry.address) if entry.address else ""
        
        if normalized_name and normalized_address:  # Only consider entries with both name and address
            key = (normalized_name, normalized_address)
            name_address_groups[key].append(entry)
    
    print(f"Unique name+address combinations: {len(name_address_groups)}")
    
    # Find groups with multiple entries (potential duplicates)
    duplicate_groups = {key: entries for key, entries in name_address_groups.items() 
                       if len(entries) > 1}
    
    print(f"Groups with multiple entries: {len(duplicate_groups)}")
    
    # Analyze each duplicate group for mergeability
    mergeable_candidates = []
    
    for (name, address), entries in duplicate_groups.items():
        if len(entries) < 2:
            continue
            
        # Check mergeability criteria
        nid_entries = [e for e in entries if e.nid and e.nid.strip()]
        island_entries = [e for e in entries if e.island]
        
        # Criteria: at least one entry should have NID, and at least one should have island
        if len(nid_entries) >= 1 and len(island_entries) >= 1:
            # Check if other entries are missing these fields
            missing_nid_count = len([e for e in entries if not e.nid or not e.nid.strip()])
            missing_island_count = len([e for e in entries if not e.island])
            
            if missing_nid_count >= 1 and missing_island_count >= 1:
                mergeable_candidates.append({
                    'name': name,
                    'address': address,
                    'entries': entries,
                    'nid_entries': nid_entries,
                    'island_entries': island_entries,
                    'missing_nid_count': missing_nid_count,
                    'missing_island_count': missing_island_count
                })
    
    print(f"Mergeable candidates found: {len(mergeable_candidates)}")
    print("=" * 80)
    
    return mergeable_candidates

def export_to_csv(candidates, filename=None):
    """
    Export mergeable candidates to CSV file for manual analysis
    """
    if not candidates:
        print("❌ No mergeable contacts to export.")
        return
    
    if not filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"mergeable_contacts_{timestamp}.csv"
    
    print(f"📊 Exporting {len(candidates)} mergeable contact groups to CSV...")
    print(f"📁 File: {filename}")
    
    # CSV headers
    headers = [
        'Group_ID', 'Name', 'Address', 'Total_Entries', 'Entries_with_NID', 'Entries_with_Island',
        'Entry_PID', 'Entry_NID', 'Entry_Island', 'Entry_Contact', 'Entry_Party', 'Entry_DOB',
        'Entry_Remark', 'Entry_Gender', 'Entry_Profession', 'Entry_Email', 'Entry_Status',
        'Primary_Entry_PID', 'Primary_Entry_Reason', 'Contacts_to_Merge', 'Remarks_to_Merge',
        'Parties_to_Merge', 'DOBs_to_Merge', 'Professions_to_Merge', 'Emails_to_Merge'
    ]
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(headers)
        
        for i, candidate in enumerate(candidates, 1):
            entries = candidate['entries']
            nid_entries = candidate['nid_entries']
            island_entries = candidate['island_entries']
            
            # Find the best entry to keep (one with NID and island)
            best_entry = None
            for entry in entries:
                if entry.nid and entry.island:
                    best_entry = entry
                    break
            
            if not best_entry:
                # If no entry has both NID and island, choose the one with most complete data
                best_entry = max(entries, key=lambda e: sum([
                    1 if e.nid else 0,
                    1 if e.island else 0,
                    1 if e.contact else 0,
                    1 if e.DOB else 0,
                    1 if e.remark else 0
                ]))
            
            # Calculate merge statistics
            all_contacts = [e.contact for e in entries if e.contact and e.contact.strip()]
            all_remarks = [e.remark for e in entries if e.remark and e.remark.strip()]
            all_parties = [e.party for e in entries if e.party]
            all_dobs = [e.DOB for e in entries if e.DOB and e.DOB.strip()]
            all_professions = [e.profession for e in entries if e.profession and e.profession.strip()]
            all_emails = [e.email for e in entries if e.email and e.email.strip()]
            
            # Write each entry as a separate row for detailed analysis
            for j, entry in enumerate(entries):
                row = [
                    i,  # Group_ID
                    candidate['name'],  # Name
                    candidate['address'],  # Address
                    len(entries),  # Total_Entries
                    len(nid_entries),  # Entries_with_NID
                    len(island_entries),  # Entries_with_Island
                    entry.pid,  # Entry_PID
                    entry.nid or '',  # Entry_NID
                    entry.island.name if entry.island else '',  # Entry_Island
                    entry.contact or '',  # Entry_Contact
                    entry.party.name if entry.party else '',  # Entry_Party
                    entry.DOB or '',  # Entry_DOB
                    entry.remark or '',  # Entry_Remark
                    entry.gender or '',  # Entry_Gender
                    entry.profession or '',  # Entry_Profession
                    entry.email or '',  # Entry_Email
                    entry.status or '',  # Entry_Status
                    best_entry.pid,  # Primary_Entry_PID
                    'Has NID and Island' if (best_entry.nid and best_entry.island) else 'Most complete data',  # Primary_Entry_Reason
                    len(all_contacts),  # Contacts_to_Merge
                    len(all_remarks),  # Remarks_to_Merge
                    len(all_parties),  # Parties_to_Merge
                    len(all_dobs),  # DOBs_to_Merge
                    len(all_professions),  # Professions_to_Merge
                    len(all_emails)  # Emails_to_Merge
                ]
                writer.writerow(row)
    
    print(f"✅ CSV export completed: {filename}")
    print(f"📊 Total rows exported: {sum(len(c['entries']) for c in candidates)}")
    
    return filename

def display_mergeable_candidates(candidates):
    """
    Display detailed information about mergeable candidates
    """
    if not candidates:
        print("❌ No mergeable contacts found.")
        return
    
    print(f"✅ Found {len(candidates)} mergeable contact groups:")
    print("=" * 80)
    
    for i, candidate in enumerate(candidates, 1):
        print(f"\n📋 GROUP {i}: {candidate['name']} - {candidate['address']}")
        print("-" * 60)
        
        entries = candidate['entries']
        nid_entries = candidate['nid_entries']
        island_entries = candidate['island_entries']
        
        print(f"Total entries: {len(entries)}")
        print(f"Entries with NID: {len(nid_entries)}")
        print(f"Entries with Island: {len(island_entries)}")
        
        # Show detailed entry information
        for j, entry in enumerate(entries, 1):
            print(f"\n  Entry {j} (PID: {entry.pid}):")
            print(f"    NID: {entry.nid or 'BLANK'}")
            print(f"    Island: {entry.island.name if entry.island else 'BLANK'}")
            print(f"    Contact: {entry.contact or 'BLANK'}")
            print(f"    Party: {entry.party.name if entry.party else 'BLANK'}")
            print(f"    DOB: {entry.DOB or 'BLANK'}")
            print(f"    Remark: {entry.remark or 'BLANK'}")
            print(f"    Gender: {entry.gender or 'BLANK'}")
            print(f"    Profession: {entry.profession or 'BLANK'}")
            print(f"    Email: {entry.email or 'BLANK'}")
            print(f"    Status: {entry.status or 'BLANK'}")
        
        # Show what would be merged
        print(f"\n  🔄 MERGE ANALYSIS:")
        
        # Find the best entry to keep (one with NID and island)
        best_entry = None
        for entry in entries:
            if entry.nid and entry.island:
                best_entry = entry
                break
        
        if best_entry:
            print(f"    Primary entry to keep: PID {best_entry.pid} (has both NID and Island)")
        else:
            print(f"    Primary entry: Will need to choose one with most complete data")
        
        # Show fields that would be consolidated
        all_contacts = [e.contact for e in entries if e.contact and e.contact.strip()]
        all_remarks = [e.remark for e in entries if e.remark and e.remark.strip()]
        all_parties = [e.party for e in entries if e.party]
        all_dobs = [e.DOB for e in entries if e.DOB and e.DOB.strip()]
        all_professions = [e.profession for e in entries if e.profession and e.profession.strip()]
        all_emails = [e.email for e in entries if e.email and e.email.strip()]
        
        print(f"    Contacts to merge: {len(all_contacts)} unique values")
        print(f"    Remarks to merge: {len(all_remarks)} unique values")
        print(f"    Parties to merge: {len(all_parties)} unique values")
        print(f"    DOBs to merge: {len(all_dobs)} unique values")
        print(f"    Professions to merge: {len(all_professions)} unique values")
        print(f"    Emails to merge: {len(all_emails)} unique values")
        
        print("-" * 60)

def generate_merge_summary(candidates):
    """
    Generate a summary report of mergeable contacts
    """
    if not candidates:
        return
    
    print("\n📊 MERGE SUMMARY REPORT")
    print("=" * 80)
    
    total_entries_to_merge = sum(len(c['entries']) for c in candidates)
    total_contacts_after_merge = len(candidates)
    entries_to_delete = total_entries_to_merge - total_contacts_after_merge
    
    print(f"Total entries involved: {total_entries_to_merge}")
    print(f"Total contacts after merge: {total_contacts_after_merge}")
    print(f"Entries to delete: {entries_to_delete}")
    print(f"Space savings: {entries_to_delete} database records")
    
    # Field consolidation summary
    total_contacts = sum(len([e for e in c['entries'] if e.contact and e.contact.strip()]) for c in candidates)
    total_remarks = sum(len([e for e in c['entries'] if e.remark and e.remark.strip()]) for c in candidates)
    total_parties = sum(len([e for e in c['entries'] if e.party]) for c in candidates)
    total_dobs = sum(len([e for e in c['entries'] if e.DOB and e.DOB.strip()]) for c in candidates)
    
    print(f"\nData consolidation:")
    print(f"  Phone numbers: {total_contacts} → {total_contacts_after_merge}")
    print(f"  Remarks: {total_remarks} → {total_contacts_after_merge}")
    print(f"  Party affiliations: {total_parties} → {total_contacts_after_merge}")
    print(f"  Date of birth: {total_dobs} → {total_contacts_after_merge}")

def main():
    """
    Main function to run the merge analysis
    """
    print("🔍 CONTACT MERGE ANALYSIS TOOL")
    print("=" * 80)
    print("This tool identifies contacts that can be merged based on:")
    print("1. Same name and address")
    print("2. One entry has NID, others are blank")
    print("3. One entry has island, others are blank")
    print("4. Will consolidate: phone numbers, remarks, party, DOB, and other fields")
    print("5. Will export results to CSV for manual analysis")
    print("=" * 80)
    
    try:
        # Find mergeable candidates
        candidates = find_mergeable_contacts()
        
        # Export to CSV for manual analysis
        csv_filename = export_to_csv(candidates)
        
        # Display detailed information
        display_mergeable_candidates(candidates)
        
        # Generate summary report
        generate_merge_summary(candidates)
        
        print("\n" + "=" * 80)
        print("✅ ANALYSIS COMPLETE")
        print("=" * 80)
        print(f"📊 CSV file exported: {csv_filename}")
        print("📋 You can now:")
        print("1. Open the CSV file in Excel/Google Sheets for analysis")
        print("2. Review the merge candidates manually")
        print("3. Confirm which groups should be merged")
        print("4. Run a separate merge script with your approval")
        print("=" * 80)
        
    except Exception as e:
        print(f"❌ Error during analysis: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
