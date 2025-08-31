#!/usr/bin/env python3
"""
2025-01-29: NEW - Script to check actual NID patterns in the database

This script will analyze what NID patterns actually exist, including:
- A-prefix NIDs with different lengths
- NIDs with unusual characters
- NIDs with 'x' characters
- Different NID formats
"""

import os
import sys
import django
from collections import defaultdict, Counter

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_directory.models import PhoneBookEntry

def analyze_nid_patterns():
    """
    Analyze actual NID patterns in the database
    """
    print("🔍 ANALYZING ACTUAL NID PATTERNS IN DATABASE")
    print("=" * 80)
    
    # Get all entries with NIDs
    entries_with_nid = PhoneBookEntry.objects.filter(
        nid__isnull=False
    ).exclude(nid='').exclude(nid__exact='')
    
    print(f"Total entries with NIDs: {entries_with_nid.count()}")
    
    # Analyze NID patterns
    nid_patterns = defaultdict(list)
    nid_lengths = Counter()
    nid_prefixes = Counter()
    unusual_nids = []
    
    for entry in entries_with_nid:
        nid = entry.nid.strip()
        if not nid:
            continue
            
        # Analyze length
        nid_lengths[len(nid)] += 1
        
        # Analyze prefix
        if nid:
            prefix = nid[0] if nid else ''
            nid_prefixes[prefix] += 1
        
        # Check for unusual characters
        has_unusual = any(char not in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' for char in nid.upper())
        if has_unusual:
            unusual_nids.append({
                'nid': nid,
                'pid': entry.pid,
                'name': entry.name,
                'address': entry.address
            })
        
        # Categorize by pattern
        if nid.startswith('A'):
            if len(nid) == 7:
                pattern = "Axxxxxx (7 chars)"
            elif len(nid) == 4:
                pattern = "Axxx (4 chars)"
            elif len(nid) == 6:
                pattern = "Axxxxx (6 chars)"
            elif len(nid) == 5:
                pattern = "Axxxx (5 chars)"
            elif len(nid) == 3:
                pattern = "Axx (3 chars)"
            else:
                pattern = f"A-prefix ({len(nid)} chars)"
        elif nid.startswith('P'):
            pattern = "P-prefix"
        elif nid.startswith('B'):
            pattern = "B-prefix"
        elif nid.isdigit():
            pattern = "Numeric only"
        elif nid.isalpha():
            pattern = "Letters only"
        else:
            pattern = "Mixed format"
        
        nid_patterns[pattern].append(nid)
    
    # Display results
    print("\n📊 NID LENGTH ANALYSIS:")
    print("-" * 40)
    for length, count in sorted(nid_lengths.items()):
        print(f"  {length} characters: {count} NIDs")
    
    print("\n📊 NID PREFIX ANALYSIS:")
    print("-" * 40)
    for prefix, count in sorted(nid_prefixes.items()):
        print(f"  '{prefix}': {count} NIDs")
    
    print("\n📊 NID PATTERN ANALYSIS:")
    print("-" * 40)
    for pattern, nids in sorted(nid_patterns.items()):
        print(f"  {pattern}: {len(nids)} NIDs")
        # Show first few examples
        examples = nids[:5]
        print(f"    Examples: {', '.join(examples)}")
        if len(nids) > 5:
            print(f"    ... and {len(nids) - 5} more")
    
    if unusual_nids:
        print("\n⚠️ UNUSUAL NID CHARACTERS FOUND:")
        print("-" * 40)
        for item in unusual_nids[:10]:  # Show first 10
            print(f"  NID: '{item['nid']}' | PID: {item['pid']} | Name: {item['name']}")
        if len(unusual_nids) > 10:
            print(f"  ... and {len(unusual_nids) - 10} more")
    else:
        print("\n✅ No unusual NID characters found")
    
    # Check for specific patterns you mentioned
    print("\n🔍 CHECKING FOR SPECIFIC PATTERNS:")
    print("-" * 40)
    
    # Look for NIDs with 'x' characters
    nids_with_x = [entry.nid for entry in entries_with_nid if 'x' in entry.nid.lower()]
    if nids_with_x:
        print(f"  NIDs with 'x' characters: {len(nids_with_x)} found")
        print(f"  Examples: {', '.join(nids_with_x[:10])}")
    else:
        print("  No NIDs with 'x' characters found")
    
    # Look for A-prefix NIDs with last 3 digits pattern
    a_prefix_nids = [entry.nid for entry in entries_with_nid if entry.nid.startswith('A')]
    if a_prefix_nids:
        print(f"  A-prefix NIDs: {len(a_prefix_nids)} found")
        
        # Check last 3 digits patterns
        last_three_patterns = Counter()
        for nid in a_prefix_nids:
            if len(nid) >= 3:
                last_three = nid[-3:]
                if last_three.isdigit():
                    last_three_patterns[last_three] += 1
        
        print(f"  Last 3 digits patterns: {len(last_three_patterns)} unique patterns")
        print(f"  Most common last 3 digits: {dict(last_three_patterns.most_common(10))}")
    
    print("\n" + "=" * 80)
    print("✅ NID pattern analysis completed")

def main():
    """
    Main function
    """
    try:
        analyze_nid_patterns()
    except Exception as e:
        print(f"❌ Error during analysis: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
