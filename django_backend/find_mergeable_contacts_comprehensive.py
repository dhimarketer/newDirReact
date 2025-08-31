#!/usr/bin/env python3
"""
2025-01-29: NEW - Comprehensive merge script to catch ALL potential matches

This script implements enhanced merge criteria to avoid needing to merge again later:
1. Same name + address
2. NID compatibility (exact, X-format, A-prefix with matching last 3 digits)
3. Island flexibility (same island, one blank, or different islands with strong NID match)
4. Additional validation to prevent false matches
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
    
    Examples:
    - "386" and "386" -> True (identical)
    - "386" and "XXX" -> True (X can represent 386)
    - "3X6" and "386" -> True (X can represent 8)
    - "386" and "123" -> False (different values)
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
    """
    Calculate confidence score for a merge group.
    Higher score = more likely to be the same person.
    """
    confidence = 0
    
    # NID compatibility (strongest indicator)
    nids = [e.nid.strip() for e in entries if e.nid and e.nid.strip()]
    if len(nids) > 1:
        # Check if NIDs are compatible
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
        # Check if all islands are the same
        island_names = []
        for island in islands:
            if hasattr(island, 'name'):
                island_names.append(island.name)
            else:
                island_names.append(str(island))
        
        if len(set(island_names)) == 1:
            confidence += 30  # Same island
        else:
            # Different islands - check if they're in same atoll
            atoll_names = []
            for island in islands:
                if hasattr(island, 'atoll') and island.atoll and hasattr(island.atoll, 'name'):
                    atoll_names.append(island.atoll.name)
            
            if len(set(atoll_names)) == 1 and len(atoll_names) > 0:
                confidence += 20  # Same atoll
            else:
                confidence += 10  # Different atolls (lower confidence)
    
    # Data completeness
    complete_entries = sum(1 for e in entries if e.nid and e.island and e.DOB)
    if complete_entries > 0:
        confidence += 20  # Has complete data
    
    return confidence

def find_comprehensive_mergeable_contacts():
    """
    Find ALL potentially mergeable contacts using enhanced criteria
    """
    print("🔍 COMPREHENSIVE MERGE ANALYSIS - Catching ALL potential matches")
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
    excluded_groups = []
    
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
            # Check if all islands are the same
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
        elif confidence >= 80:  # High confidence even without strong NID match
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
                'best_entry': best_entry,
                'contacts_to_merge': get_unique_values(entries, 'contact'),
                'remarks_to_merge': get_unique_values(entries, 'remark'),
                'parties_to_merge': get_unique_values(entries, 'party'),
                'dobs_to_merge': get_unique_values(entries, 'DOB'),
                'professions_to_merge': get_unique_values(entries, 'profession'),
                'emails_to_merge': get_unique_values(entries, 'email')
            }
            
            mergeable_candidates.append(candidate)
            
            # Print group info
            print(f"✅ GROUP {candidate['group_id']}: {name} - {address}")
            print(f"   Type: {merge_type} | Confidence: {confidence}%")
            print(f"   Reason: {candidate['merge_reason']}")
            print(f"   Entries: {len(entries)} | NIDs: {len(nids)} | Islands: {len(islands)}")
        else:
            excluded_groups.append({
                'name': name,
                'address': address,
                'entries': entries,
                'reason': f"Low confidence ({confidence}%) - {merge_type}"
            })
    
    print(f"\n📊 COMPREHENSIVE MERGE SUMMARY")
    print("=" * 80)
    print(f"✅ Mergeable groups: {len(mergeable_candidates)}")
    print(f"❌ Excluded groups: {len(excluded_groups)}")
    print(f"📋 Total groups analyzed: {len(name_address_groups)}")
    
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

def get_unique_values(entries, field_name):
    """Get unique non-blank values for a field across entries"""
    values = set()
    for entry in entries:
        value = getattr(entry, field_name)
        if value and str(value).strip():
            values.add(str(value).strip())
    return list(values)

def export_comprehensive_csv(candidates, filename=None):
    """Export comprehensive merge candidates to CSV"""
    if not filename:
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"comprehensive_mergeable_contacts_{timestamp}.csv"
    
    import csv
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        headers = [
            'Group_ID', 'Name', 'Address', 'Total_Entries', 'Entries_with_NID', 'Entries_with_Island',
            'Merge_Type', 'Confidence_Score', 'Merge_Reason', 'Primary_Entry_PID', 'Primary_Entry_NID',
            'Primary_Entry_Island', 'Primary_Entry_Contact', 'Primary_Entry_Party', 'Primary_Entry_DOB',
            'Contacts_to_Merge', 'Remarks_to_Merge', 'Parties_to_Merge', 'DOBs_to_Merge',
            'Professions_to_Merge', 'Emails_to_Merge'
        ]
        
        writer = csv.writer(csvfile)
        writer.writerow(headers)
        
        for candidate in candidates:
            best_entry = candidate['best_entry']
            
            row = [
                candidate['group_id'],
                candidate['name'],
                candidate['address'],
                candidate['total_entries'],
                candidate['nid_entries'],
                candidate['island_entries'],
                candidate['merge_type'],
                candidate['confidence'],
                candidate['merge_reason'],
                best_entry.pid,
                best_entry.nid or 'BLANK',
                best_entry.island.name if best_entry.island else 'BLANK',
                best_entry.contact or 'BLANK',
                best_entry.party or 'BLANK',
                best_entry.DOB or 'BLANK',
                '; '.join(candidate['contacts_to_merge']) if candidate['contacts_to_merge'] else 'BLANK',
                '; '.join(candidate['remarks_to_merge']) if candidate['remarks_to_merge'] else 'BLANK',
                '; '.join(candidate['parties_to_merge']) if candidate['parties_to_merge'] else 'BLANK',
                '; '.join(candidate['dobs_to_merge']) if candidate['dobs_to_merge'] else 'BLANK',
                '; '.join(candidate['professions_to_merge']) if candidate['professions_to_merge'] else 'BLANK',
                '; '.join(candidate['emails_to_merge']) if candidate['emails_to_merge'] else 'BLANK'
            ]
            
            writer.writerow(row)
    
    return filename

def main():
    """Main function"""
    try:
        print("🚀 Starting comprehensive merge analysis...")
        print("This will catch ALL potential matches to avoid future re-merging")
        print("=" * 80)
        
        # Find comprehensive merge candidates
        candidates = find_comprehensive_mergeable_contacts()
        
        if candidates:
            # Export to CSV
            csv_filename = export_comprehensive_csv(candidates)
            print(f"\n📊 CSV EXPORT COMPLETE: {csv_filename}")
            
            # Calculate summary
            total_entries = sum(c['total_entries'] for c in candidates)
            total_after_merge = len(candidates)
            entries_to_delete = total_entries - total_after_merge
            
            print(f"\n📋 COMPREHENSIVE MERGE IMPACT:")
            print(f"   Total entries involved: {total_entries}")
            print(f"   Total contacts after merge: {total_after_merge}")
            print(f"   Entries to delete: {entries_to_delete}")
            print(f"   Space savings: {entries_to_delete} database records")
            
            print(f"\n✅ COMPREHENSIVE ANALYSIS COMPLETE")
            print("=" * 80)
            print(f"📊 CSV file exported: {csv_filename}")
            print(f"📋 You can now:")
            print(f"   1. Review ALL potential merge candidates")
            print(f"   2. Confirm which groups should be merged")
            print(f"   3. Run merge execution script with your approval")
            print(f"   4. Avoid needing to merge again later!")
            
        else:
            print("❌ No mergeable candidates found")
            
    except Exception as e:
        print(f"❌ Error during comprehensive analysis: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
