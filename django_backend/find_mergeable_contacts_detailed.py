#!/usr/bin/env python3
"""
2025-01-29: NEW - Detailed merge script showing ALL entries in each group

This script creates a CSV that shows every entry in each merge group,
not just the summary, so you can see exactly what will be merged.
"""

import os
import sys
import django
from collections import defaultdict
from typing import List, Dict, Tuple, Set

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

def patterns_compatible(pattern1, pattern2):
    """
    Check if two NID patterns are compatible for merging.
    X characters are treated as placeholders that can represent any digit.
    """
    if pattern1 == pattern2:
        return True
    
    # If both patterns are all digits, they must be identical
    if pattern1.isdigit() and pattern2.isdigit():
        return pattern1 == pattern2
    
    # If one pattern has X characters, check compatibility
    if 'X' in pattern1.upper() or 'X' in pattern2.upper():
        # Convert to uppercase for comparison
        p1 = pattern1.upper()
        p2 = pattern2.upper()
        
        # Check if patterns have same length
        if len(p1) != len(p2):
            return False
        
        # Check each position for compatibility
        for i in range(len(p1)):
            char1 = p1[i]
            char2 = p2[i]
            
            # If both are X, they're compatible
            if char1 == 'X' and char2 == 'X':
                continue
            
            # If one is X, it can represent the other
            if char1 == 'X' or char2 == 'X':
                continue
            
            # If both are digits, they must match
            if char1.isdigit() and char2.isdigit():
                if char1 != char2:
                    return False
            
            # If one is digit and one is letter (not X), they're not compatible
            elif char1.isdigit() != char2.isdigit():
                return False
        
        return True
    
    return False

def calculate_merge_confidence(entries):
    """Calculate confidence score for a merge group"""
    confidence = 0
    
    # NID compatibility (strongest indicator)
    nids = [e.nid.strip() for e in entries if e.nid and e.nid.strip()]
    if len(nids) > 1:
        if all(nid.startswith('A') for nid in nids):
            last_three_patterns = [nid[-3:] for nid in nids if len(nid) >= 3]
            if len(set(last_three_patterns)) == 1:
                confidence += 50  # Strong NID match
            elif all(patterns_compatible(last_three_patterns[0], pattern) for pattern in last_three_patterns[1:]):
                confidence += 40  # Compatible NID patterns
        elif len(set(nids)) == 1:
            confidence += 50  # Exact NID match
    
    # Island consistency
    islands = [e.island for e in entries if e.island]
    if len(islands) == 1:
        confidence += 30  # Single island
    elif len(islands) > 1:
        island_names = []
        for island in islands:
            if hasattr(island, 'name'):
                island_names.append(island.name)
            else:
                island_names.append(str(island))
        
        if len(set(island_names)) == 1:
            confidence += 30  # Same island
        else:
            # Check if same atoll
            atoll_names = []
            for island in islands:
                if hasattr(island, 'atoll') and island.atoll and hasattr(island.atoll, 'name'):
                    atoll_names.append(island.atoll.name)
            
            if len(set(atoll_names)) == 1 and len(atoll_names) > 0:
                confidence += 20  # Same atoll
            else:
                confidence += 10  # Different atolls
    
    # Data completeness
    complete_entries = sum(1 for e in entries if e.nid and e.island and e.DOB)
    if complete_entries > 0:
        confidence += 20  # Has complete data
    
    return confidence

def find_detailed_mergeable_contacts():
    """Find mergeable contacts with detailed entry information"""
    print("🔍 DETAILED MERGE ANALYSIS - Showing ALL entries in each group")
    print("=" * 80)
    
    # Get all entries
    all_entries = PhoneBookEntry.objects.all()
    print(f"Total entries in database: {all_entries.count()}")
    
    # Group by normalized name + address
    name_address_groups = defaultdict(list)
    
    for entry in all_entries:
        normalized_name = normalize_text(entry.name)
        normalized_address = normalize_text(entry.address)
        
        if normalized_name and normalized_address:
            key = (normalized_name, normalized_address)
            name_address_groups[key].append(entry)
    
    print(f"Unique name+address combinations: {len(name_address_groups)}")
    
    # Find mergeable groups
    mergeable_candidates = []
    
    for (name, address), entries in name_address_groups.items():
        if len(entries) < 2:
            continue
        
        # Calculate merge confidence
        confidence = calculate_merge_confidence(entries)
        
        # Enhanced merge criteria
        merge_reason = []
        merge_type = "UNKNOWN"
        
        # Check NID compatibility
        nids = [e.nid.strip() for e in entries if e.nid and e.nid.strip()]
        if len(nids) > 1:
            if all(nid.startswith('A') for nid in nids):
                last_three_patterns = [nid[-3:] for nid in nids if len(nid) >= 3]
                if len(set(last_three_patterns)) == 1:
                    merge_reason.append("Identical last 3 digits")
                    merge_type = "STRONG_NID_MATCH"
                elif all(patterns_compatible(last_three_patterns[0], pattern) for pattern in last_three_patterns[1:]):
                    merge_reason.append("Compatible NID patterns (X-format)")
                    merge_type = "X_FORMAT_NID_MATCH"
                else:
                    merge_reason.append("Different NID patterns")
                    merge_type = "WEAK_NID_MATCH"
            elif len(set(nids)) == 1:
                merge_reason.append("Exact NID match")
                merge_type = "EXACT_NID_MATCH"
            else:
                merge_reason.append("Different NIDs")
                merge_type = "DIFFERENT_NIDS"
        
        # Check island consistency
        islands = [e.island for e in entries if e.island]
        if len(islands) == 1:
            merge_reason.append("Single island")
        elif len(islands) > 1:
            island_names = []
            for island in islands:
                if hasattr(island, 'name'):
                    island_names.append(island.name)
                else:
                    island_names.append(str(island))
            
            if len(set(island_names)) == 1:
                merge_reason.append("Same island")
            else:
                # Check if same atoll
                atoll_names = []
                for island in islands:
                    if hasattr(island, 'atoll') and island.atoll and hasattr(island.atoll, 'name'):
                        atoll_names.append(island.atoll.name)
                
                if len(set(atoll_names)) == 1 and len(atoll_names) > 0:
                    merge_reason.append(f"Same atoll: {atoll_names[0]}")
                else:
                    merge_reason.append(f"Different atolls: {', '.join(set(atoll_names)) if atoll_names else 'Unknown'}")
        
        # Determine if mergeable based on confidence and type
        is_mergeable = False
        
        if merge_type in ["STRONG_NID_MATCH", "EXACT_NID_MATCH"]:
            is_mergeable = True
        elif merge_type == "X_FORMAT_NID_MATCH" and confidence >= 60:
            is_mergeable = True
        elif merge_type == "WEAK_NID_MATCH" and confidence >= 70:
            is_mergeable = True
        elif confidence >= 80:
            is_mergeable = True
        
        if is_mergeable:
            # Select best entry to keep
            best_entry = select_best_entry(entries)
            
            candidate = {
                'group_id': len(mergeable_candidates) + 1,
                'name': name,
                'address': address,
                'entries': entries,
                'total_entries': len(entries),
                'nid_entries': len([e for e in entries if e.nid and e.nid.strip()]),
                'island_entries': len([e for e in entries if e.island]),
                'merge_type': merge_type,
                'confidence': confidence,
                'merge_reason': '; '.join(merge_reason),
                'best_entry': best_entry
            }
            
            mergeable_candidates.append(candidate)
            
            # Print group info
            print(f"✅ GROUP {candidate['group_id']}: {name} - {address}")
            print(f"   Type: {merge_type} | Confidence: {confidence}%")
            print(f"   Entries: {len(entries)} | NIDs: {len(nids)} | Islands: {len(islands)}")
    
    print(f"\n📊 DETAILED MERGE SUMMARY")
    print("=" * 80)
    print(f"✅ Mergeable groups: {len(mergeable_candidates)}")
    
    return mergeable_candidates

def select_best_entry(entries):
    """Select the best entry to keep as primary"""
    # Check if we have different islands
    islands = [e.island for e in entries if e.island]
    island_names = []
    for island in islands:
        if hasattr(island, 'name'):
            island_names.append(island.name)
        else:
            island_names.append(str(island))
    
    has_different_islands = len(set(island_names)) > 1
    
    if has_different_islands:
        # When islands differ, prioritize X-format NID entries (most recent)
        x_format_entries = [e for e in entries if e.nid and 'X' in e.nid.upper()]
        
        if x_format_entries:
            # Among X-format entries, select the most complete one
            best_x_entry = max(x_format_entries, key=lambda e: sum(1 for field in [e.contact, e.DOB, e.remark, e.profession, e.email] if field))
            print(f"   🎯 Different islands detected - using X-format NID entry (most recent): PID {best_x_entry.pid}")
            return best_x_entry
    
    # Fallback to original logic when islands are same or no X-format entries
    # Priority 1: Has both NID and Island
    best_entries = [e for e in entries if e.nid and e.island]
    if best_entries:
        # Among these, select the most complete
        return max(best_entries, key=lambda e: sum(1 for field in [e.contact, e.DOB, e.remark, e.profession, e.email] if field))
    
    # Priority 2: Has NID
    nid_entries = [e for e in entries if e.nid]
    if nid_entries:
        return max(nid_entries, key=lambda e: sum(1 for field in [e.contact, e.DOB, e.remark, e.profession, e.email] if field))
    
    # Priority 3: Has Island
    island_entries = [e for e in entries if e.island]
    if island_entries:
        return max(island_entries, key=lambda e: sum(1 for field in [e.contact, e.DOB, e.remark, e.profession, e.email] if field))
    
    # Priority 4: Most complete data
    return max(entries, key=lambda e: sum(1 for field in [e.contact, e.DOB, e.remark, e.profession, e.email] if field))

def export_detailed_csv(candidates, filename=None):
    """Export detailed merge candidates showing ALL entries"""
    if not filename:
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"detailed_mergeable_contacts_{timestamp}.csv"
    
    import csv
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        headers = [
            'Group_ID', 'Entry_Number', 'Name', 'Address', 'Total_Entries_in_Group',
            'Merge_Type', 'Confidence_Score', 'Merge_Reason', 'Is_Primary',
            'PID', 'NID', 'Island', 'Contact', 'Party', 'DOB', 'Remark', 'Gender',
            'Profession', 'Email', 'Status', 'Is_Unlisted', 'Family_Group_ID'
        ]
        
        writer = csv.writer(csvfile)
        writer.writerow(headers)
        
        for candidate in candidates:
            best_entry = candidate['best_entry']
            
            # Write each entry in the group
            for i, entry in enumerate(candidate['entries'], 1):
                is_primary = (entry == best_entry)
                
                row = [
                    candidate['group_id'],
                    i,  # Entry number within group
                    candidate['name'],
                    candidate['address'],
                    candidate['total_entries'],
                    candidate['merge_type'],
                    candidate['confidence'],
                    candidate['merge_reason'],
                    'YES' if is_primary else 'NO',
                    entry.pid,
                    entry.nid or 'BLANK',
                    entry.island.name if entry.island else 'BLANK',
                    entry.contact or 'BLANK',
                    entry.party or 'BLANK',
                    entry.DOB or 'BLANK',
                    entry.remark or 'BLANK',
                    entry.gender or 'BLANK',
                    entry.profession or 'BLANK',
                    entry.email or 'BLANK',
                    entry.status or 'BLANK',
                    entry.is_unlisted or 'BLANK',
                    entry.family_group_id or 'BLANK'
                ]
                
                writer.writerow(row)
    
    return filename

def main():
    """Main function"""
    try:
        print("🚀 Starting detailed merge analysis...")
        print("This will show ALL entries in each merge group")
        print("=" * 80)
        
        # Find detailed merge candidates
        candidates = find_detailed_mergeable_contacts()
        
        if candidates:
            # Export to detailed CSV
            csv_filename = export_detailed_csv(candidates)
            print(f"\n📊 DETAILED CSV EXPORT COMPLETE: {csv_filename}")
            
            # Calculate summary
            total_entries = sum(c['total_entries'] for c in candidates)
            total_after_merge = len(candidates)
            entries_to_delete = total_entries - total_after_merge
            
            print(f"\n📋 DETAILED MERGE IMPACT:")
            print(f"   Total entries involved: {total_entries}")
            print(f"   Total contacts after merge: {total_after_merge}")
            print(f"   Entries to delete: {entries_to_delete}")
            print(f"   Space savings: {entries_to_delete} database records")
            
            print(f"\n✅ DETAILED ANALYSIS COMPLETE")
            print("=" * 80)
            print(f"📊 CSV file exported: {csv_filename}")
            print(f"📋 Now you can see:")
            print(f"   1. ALL entries in each merge group")
            print(f"   2. Which entry is marked as PRIMARY (to keep)")
            print(f"   3. Exact details of what will be merged")
            print(f"   4. Complete information for manual review")
            
        else:
            print("❌ No mergeable candidates found")
            
    except Exception as e:
        print(f"❌ Error during detailed analysis: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
