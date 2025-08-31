#!/usr/bin/env python3
"""
2025-01-29: NEW - Script to find examples of NIDs with X characters that could be merged

This script will search for cases where:
1. Same name + address has entries with AXXX format and Axxxxxx format
2. The last 3 characters match (e.g., AXXX386 and A123386)
3. These could potentially be merged
"""

import os
import sys
import django
from collections import defaultdict

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_directory.models import PhoneBookEntry

def find_x_nid_examples():
    """
    Find examples where NIDs with X characters could potentially be merged
    """
    print("🔍 SEARCHING FOR X-NID MERGE EXAMPLES")
    print("=" * 80)
    
    # Get all entries with NIDs
    entries_with_nid = PhoneBookEntry.objects.filter(
        nid__isnull=False
    ).exclude(nid='').exclude(nid__exact='')
    
    print(f"Total entries with NIDs: {entries_with_nid.count()}")
    
    # Group by name + address
    name_address_groups = defaultdict(list)
    
    for entry in entries_with_nid:
        normalized_name = " ".join(entry.name.strip().lower().split()) if entry.name else ""
        normalized_address = " ".join(entry.address.strip().lower().split()) if entry.address else ""
        
        if normalized_name and normalized_address:
            key = (normalized_name, normalized_address)
            name_address_groups[key].append(entry)
    
    print(f"Unique name+address combinations: {len(name_address_groups)}")
    
    # Find groups with multiple entries that have different NID formats
    potential_x_merges = []
    
    for (name, address), entries in name_address_groups.items():
        if len(entries) < 2:
            continue
        
        # Check if this group has both X-format and regular NIDs
        x_format_nids = []
        regular_nids = []
        
        for entry in entries:
            nid = entry.nid.strip()
            if nid.startswith('A'):
                if 'X' in nid.upper():
                    x_format_nids.append(nid)
                else:
                    regular_nids.append(nid)
        
        # If we have both formats, check for potential matches
        if x_format_nids and regular_nids:
            # Check if any X-format NIDs could match regular NIDs
            for x_nid in x_format_nids:
                for reg_nid in regular_nids:
                    if len(x_nid) >= 3 and len(reg_nid) >= 3:
                        x_last_three = x_nid[-3:]
                        reg_last_three = reg_nid[-3:]
                        
                        # Check if the last 3 characters are compatible
                        if patterns_compatible(x_last_three, reg_last_three):
                            potential_x_merges.append({
                                'name': name,
                                'address': address,
                                'entries': entries,
                                'x_nid': x_nid,
                                'regular_nid': reg_nid,
                                'x_last_three': x_last_three,
                                'reg_last_three': reg_last_three
                            })
                            break
                if any(merge['name'] == name and merge['address'] == address for merge in potential_x_merges):
                    break
    
    print(f"\n📊 POTENTIAL X-NID MERGE EXAMPLES FOUND: {len(potential_x_merges)}")
    print("=" * 80)
    
    if potential_x_merges:
        for i, example in enumerate(potential_x_merges[:20], 1):  # Show first 20
            print(f"\n📋 EXAMPLE {i}: {example['name']} - {example['address']}")
            print("-" * 60)
            print(f"X-format NID: {example['x_nid']} (last 3: {example['x_last_three']})")
            print(f"Regular NID: {example['regular_nid']} (last 3: {example['reg_last_three']})")
            print(f"Total entries: {len(example['entries'])}")
            
            # Show entry details
            for j, entry in enumerate(example['entries'], 1):
                print(f"  Entry {j} (PID: {entry.pid}):")
                print(f"    NID: {entry.nid}")
                print(f"    Island: {entry.island.name if entry.island else 'BLANK'}")
                print(f"    Contact: {entry.contact or 'BLANK'}")
                print(f"    DOB: {entry.DOB or 'BLANK'}")
    else:
        print("❌ No potential X-NID merge examples found")
        print("\nThis could mean:")
        print("1. No entries with same name+address have both X-format and regular NIDs")
        print("2. The X-format NIDs don't match any regular NIDs in the same groups")
        print("3. The merge groups are already correctly identified")
    
    print("\n" + "=" * 80)
    print("✅ X-NID example search completed")

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

def main():
    """
    Main function
    """
    try:
        find_x_nid_examples()
    except Exception as e:
        print(f"❌ Error during analysis: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
