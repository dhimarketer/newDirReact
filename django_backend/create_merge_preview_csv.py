#!/usr/bin/env python3
"""
2025-01-29: NEW - Script to create merge preview CSV showing before-and-after comparison
Shows all original entries followed by the final merged result for each group
"""
import os, sys, django
from collections import defaultdict
from typing import List, Dict, Tuple, Set
import csv
from datetime import datetime

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_directory.models import PhoneBookEntry
from dirReactFinal_core.models import Island, Atoll, Party

def normalize_text(text):
    """Normalize text for comparison"""
    if not text:
        return ""
    return str(text).lower().strip()

def patterns_compatible(pattern1, pattern2):
    """Check if NID patterns are compatible (handles X placeholders)"""
    if pattern1 == pattern2:
        return True
    if pattern1.isdigit() and pattern2.isdigit():
        return pattern1 == pattern2
    if 'X' in pattern1.upper() or 'X' in pattern2.upper():
        p1 = pattern1.upper()
        p2 = pattern2.upper()
        if len(p1) != len(p2):
            return False
        for i in range(len(p1)):
            char1 = p1[i]
            char2 = p2[i]
            if char1 == 'X' and char2 == 'X':
                continue
            if char1 == 'X' or char2 == 'X':
                continue
            if char1.isdigit() and char2.isdigit():
                if char1 != char2:
                    return False
            elif char1.isdigit() != char2.isdigit():
                return False
        return True
    return False

def calculate_merge_confidence(entries):
    """Calculate confidence score for merge group"""
    nids = [e.nid for e in entries if e.nid]
    islands = [e.island for e in entries if e.island]
    
    # NID compatibility
    nid_compatible = True
    if len(set(nids)) > 1:
        # Check A-prefix NID compatibility
        a_prefixed_nids = [nid for nid in nids if nid.startswith('A')]
        if len(a_prefixed_nids) == len(nids):
            # All NIDs are A-prefix, check last 3 digits
            last_three_digits = []
            for nid in nids:
                if len(nid) >= 3:
                    last_three = nid[-3:]
                    last_three_digits.append(last_three)
                else:
                    nid_compatible = False
                    break
            
            if nid_compatible:
                if len(set(last_three_digits)) == 1:
                    nid_compatible = True
                else:
                    # Check X-pattern compatibility
                    reference_pattern = last_three_digits[0]
                    for pattern in last_three_digits[1:]:
                        if not patterns_compatible(reference_pattern, pattern):
                            nid_compatible = False
                            break
        else:
            nid_compatible = False
    
    # Island consistency
    island_names = []
    for island in islands:
        if hasattr(island, 'name'):
            island_names.append(island.name)
        else:
            island_names.append(str(island))
    
    island_consistent = len(set(island_names)) <= 1
    
    # Calculate confidence
    confidence = 0
    if nid_compatible:
        confidence += 50
    if island_consistent:
        confidence += 30
    if len(entries) == 2:
        confidence += 20
    elif len(entries) > 2:
        confidence += 10
    
    return min(confidence, 100)

def find_mergeable_contacts():
    """Find all mergeable contact groups"""
    print("🔍 Finding mergeable contacts...")
    
    # Get all entries
    entries = PhoneBookEntry.objects.all()
    print(f"📊 Total entries in database: {entries.count()}")
    
    # Group by normalized name + address
    groups = defaultdict(list)
    for entry in entries:
        key = (normalize_text(entry.name), normalize_text(entry.address))
        groups[key].append(entry)
    
    # Filter groups with multiple entries
    mergeable_groups = {k: v for k, v in groups.items() if len(v) > 1}
    print(f"📋 Groups with multiple entries: {len(mergeable_groups)}")
    
    # Apply merge criteria
    candidates = []
    for (name, address), entries in mergeable_groups.items():
        # Check NID compatibility
        nids = [e.nid for e in entries if e.nid]
        if len(set(nids)) > 1:
            # Check A-prefix NID compatibility
            a_prefixed_nids = [nid for nid in nids if nid.startswith('A')]
            if len(a_prefixed_nids) == len(nids):
                # All NIDs are A-prefix, check last 3 digits
                last_three_digits = []
                nid_compatible = True
                for nid in nids:
                    if len(nid) >= 3:
                        last_three = nid[-3:]
                        last_three_digits.append(last_three)
                    else:
                        nid_compatible = False
                        break
                
                if nid_compatible:
                    if len(set(last_three_digits)) == 1:
                        nid_compatible = True
                    else:
                        # Check X-pattern compatibility
                        reference_pattern = last_three_digits[0]
                        for pattern in last_three_digits[1:]:
                            if not patterns_compatible(reference_pattern, pattern):
                                nid_compatible = False
                                break
            else:
                nid_compatible = False
        else:
            nid_compatible = True
        
        if nid_compatible:
            confidence = calculate_merge_confidence(entries)
            candidates.append({
                'name': name,
                'address': address,
                'entries': entries,
                'confidence': confidence
            })
    
    # Sort by confidence (highest first)
    candidates.sort(key=lambda x: x['confidence'], reverse=True)
    
    print(f"✅ Mergeable groups found: {len(candidates)}")
    return candidates

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
    """Get unique non-blank values for a field"""
    values = []
    for entry in entries:
        value = getattr(entry, field_name)
        if value and str(value).strip():
            values.append(str(value).strip())
    
    # Remove duplicates while preserving order
    seen = set()
    unique_values = []
    for value in values:
        if value not in seen:
            seen.add(value)
            unique_values.append(value)
    
    return unique_values

def create_merged_entry(entries, primary_entry):
    """Create the merged entry data"""
    merged = {}
    
    # Use primary entry as base
    for field in ['name', 'address', 'nid', 'island', 'atoll', 'party', 'DOB', 'gender', 'profession', 'status', 'is_unlisted', 'family_group_id']:
        value = getattr(primary_entry, field)
        if value:
            if hasattr(value, 'name'):  # Foreign key object
                merged[field] = value.name
            else:
                merged[field] = str(value)
        else:
            merged[field] = "BLANK"
    
    # Merge contact (phone numbers)
    contacts = get_unique_values(entries, 'contact')
    merged['contact'] = ' | '.join(contacts) if contacts else "BLANK"
    
    # Merge remarks
    remarks = get_unique_values(entries, 'remark')
    merged['remark'] = ' | '.join(remarks) if remarks else "BLANK"
    
    # Merge email
    emails = get_unique_values(entries, 'email')
    merged['email'] = ' | '.join(emails) if emails else "BLANK"
    
    # Use primary entry PID
    merged['pid'] = primary_entry.pid
    
    return merged

def export_merge_preview_csv(candidates, filename=None):
    """Export merge preview CSV showing before-and-after comparison"""
    if not filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"merge_preview_comparison_{timestamp}.csv"
    
    print(f"📊 Creating merge preview CSV: {filename}")
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        # Define headers
        headers = [
            'Group_ID', 'Entry_Type', 'Name', 'Address', 'PID', 'NID', 'Island', 'Contact', 
            'Party', 'DOB', 'Remark', 'Gender', 'Profession', 'Email', 'Status', 
            'Is_Unlisted', 'Family_Group_ID', 'Merge_Type', 'Confidence_Score'
        ]
        
        writer = csv.writer(csvfile)
        writer.writerow(headers)
        
        group_id = 1
        for candidate in candidates:
            entries = candidate['entries']
            primary_entry = select_best_entry(entries)
            merged_entry = create_merged_entry(entries, primary_entry)
            
            # Write all original entries first
            for i, entry in enumerate(entries):
                row = [
                    group_id,  # Group_ID
                    f"ORIGINAL_{i+1}",  # Entry_Type
                    entry.name or "BLANK",
                    entry.address or "BLANK",
                    entry.pid,
                    entry.nid or "BLANK",
                    entry.island.name if entry.island and hasattr(entry.island, 'name') else (str(entry.island) if entry.island else "BLANK"),
                    entry.contact or "BLANK",
                    entry.party.name if entry.party and hasattr(entry.party, 'name') else (str(entry.party) if entry.party else "BLANK"),
                    entry.DOB or "BLANK",
                    entry.remark or "BLANK",
                    entry.gender or "BLANK",
                    entry.profession or "BLANK",
                    entry.email or "BLANK",
                    entry.status or "BLANK",
                    entry.is_unlisted or "BLANK",
                    entry.family_group_id or "BLANK",
                    "STRONG_NID_MATCH",  # Merge_Type
                    candidate['confidence']  # Confidence_Score
                ]
                writer.writerow(row)
            
            # Write the merged result entry
            merged_row = [
                group_id,  # Group_ID
                "MERGED_RESULT",  # Entry_Type
                merged_entry['name'],
                merged_entry['address'],
                merged_entry['pid'],
                merged_entry['nid'],
                merged_entry['island'],
                merged_entry['contact'],
                merged_entry['party'],
                merged_entry['DOB'],
                merged_entry['remark'],
                merged_entry['gender'],
                merged_entry['profession'],
                merged_entry['email'],
                merged_entry['status'],
                merged_entry['is_unlisted'],
                merged_entry['family_group_id'],
                "STRONG_NID_MATCH",  # Merge_Type
                candidate['confidence']  # Confidence_Score
            ]
            writer.writerow(merged_row)
            
            # Add a separator row
            separator_row = [group_id, "---SEPARATOR---"] + [""] * (len(headers) - 2)
            writer.writerow(separator_row)
            
            group_id += 1
    
    print(f"✅ Merge preview CSV exported: {filename}")
    return filename

def main():
    """Main execution function"""
    try:
        print("🚀 MERGE PREVIEW CSV GENERATOR")
        print("=" * 50)
        
        # Find mergeable contacts
        candidates = find_mergeable_contacts()
        
        if not candidates:
            print("❌ No mergeable contacts found")
            return
        
        # Export preview CSV
        filename = export_merge_preview_csv(candidates)
        
        print("\n📊 MERGE PREVIEW SUMMARY")
        print("=" * 50)
        print(f"✅ Total merge groups: {len(candidates)}")
        print(f"📋 CSV file: {filename}")
        print(f"📖 Format: ORIGINAL entries → MERGED_RESULT → Separator → Next group")
        print("\n🎯 Each group shows:")
        print("   1. All original entries (ORIGINAL_1, ORIGINAL_2, etc.)")
        print("   2. The final merged result (MERGED_RESULT)")
        print("   3. A separator line (---SEPARATOR---)")
        print("   4. Then the next group...")
        
    except Exception as e:
        print(f"❌ Error during execution: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
