#!/usr/bin/env python3
"""
2025-01-29: NEW - Fast merge executor with progress tracking and batch processing
Optimized for large-scale merges with confidence >= 90
"""
import os, sys, django
from collections import defaultdict
from typing import List, Dict, Tuple, Set
import csv
from datetime import datetime
import time

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

def find_high_confidence_mergeable_contacts():
    """Find mergeable contacts with confidence >= 90"""
    print("🔍 Finding high-confidence mergeable contacts (confidence >= 90)...")
    
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
    
    # Apply merge criteria and confidence filter
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
            # Only include high-confidence candidates
            if confidence >= 90:
                candidates.append({
                    'name': name,
                    'address': address,
                    'entries': entries,
                    'confidence': confidence
                })
    
    # Sort by confidence (highest first)
    candidates.sort(key=lambda x: x['confidence'], reverse=True)
    
    print(f"✅ High-confidence mergeable groups found: {len(candidates)}")
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

def execute_merge_fast(candidates, batch_size=100):
    """Execute merge in batches with progress tracking"""
    print(f"🚀 Executing merge for {len(candidates)} high-confidence groups...")
    print(f"📦 Processing in batches of {batch_size}")
    
    merge_results = []
    successful_merges = 0
    failed_merges = 0
    start_time = time.time()
    
    # Process in batches
    for batch_start in range(0, len(candidates), batch_size):
        batch_end = min(batch_start + batch_size, len(candidates))
        batch = candidates[batch_start:batch_end]
        
        print(f"\n📦 Processing batch {batch_start//batch_size + 1}/{(len(candidates)-1)//batch_size + 1}")
        print(f"   Groups {batch_start + 1} to {batch_end} of {len(candidates)}")
        
        batch_start_time = time.time()
        
        for i, candidate in enumerate(batch):
            global_index = batch_start + i
            try:
                entries = candidate['entries']
                primary_entry = select_best_entry(entries)
                
                # Progress indicator
                if (global_index + 1) % 10 == 0:
                    elapsed = time.time() - start_time
                    rate = (global_index + 1) / elapsed if elapsed > 0 else 0
                    eta = (len(candidates) - global_index - 1) / rate if rate > 0 else 0
                    print(f"   📊 Progress: {global_index + 1}/{len(candidates)} ({((global_index + 1)/len(candidates)*100):.1f}%) | Rate: {rate:.1f} merges/sec | ETA: {eta/60:.1f} min")
                
                # Merge data into primary entry
                contacts = get_unique_values(entries, 'contact')
                if contacts:
                    primary_entry.contact = ' | '.join(contacts)
                
                remarks = get_unique_values(entries, 'remark')
                if remarks:
                    primary_entry.remark = ' | '.join(remarks)
                
                emails = get_unique_values(entries, 'email')
                if emails:
                    primary_entry.email = ' | '.join(emails)
                
                # Save the updated primary entry
                primary_entry.save()
                
                # Delete the duplicate entries
                pids_to_delete = [entry.pid for entry in entries if entry != primary_entry]
                deleted_count = PhoneBookEntry.objects.filter(pid__in=pids_to_delete).delete()[0]
                
                merge_results.append({
                    'group_id': global_index + 1,
                    'name': candidate['name'],
                    'address': candidate['address'],
                    'confidence': candidate['confidence'],
                    'primary_pid': primary_entry.pid,
                    'entries_merged': len(entries),
                    'entries_deleted': deleted_count,
                    'status': 'SUCCESS'
                })
                
                successful_merges += 1
                
            except Exception as e:
                print(f"   ❌ Group {global_index + 1} failed: {str(e)}")
                merge_results.append({
                    'group_id': global_index + 1,
                    'name': candidate['name'],
                    'address': candidate['address'],
                    'confidence': candidate['confidence'],
                    'primary_pid': 'ERROR',
                    'entries_merged': 0,
                    'entries_deleted': 0,
                    'status': f'FAILED: {str(e)}'
                })
                failed_merges += 1
        
        batch_time = time.time() - batch_start_time
        print(f"   ⏱️  Batch completed in {batch_time:.1f} seconds")
    
    total_time = time.time() - start_time
    
    print(f"\n📊 MERGE EXECUTION SUMMARY")
    print("=" * 50)
    print(f"✅ Successful merges: {successful_merges}")
    print(f"❌ Failed merges: {failed_merges}")
    print(f"📋 Total processed: {len(candidates)}")
    print(f"⏱️  Total time: {total_time/60:.1f} minutes")
    print(f"🚀 Average rate: {successful_merges/total_time:.1f} merges/second")
    
    return merge_results

def export_merge_results(merge_results, filename=None):
    """Export merge execution results to CSV"""
    if not filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"merge_execution_results_{timestamp}.csv"
    
    print(f"📊 Exporting merge results to: {filename}")
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        headers = [
            'Group_ID', 'Name', 'Address', 'Confidence_Score', 'Primary_PID', 
            'Entries_Merged', 'Entries_Deleted', 'Status'
        ]
        
        writer = csv.writer(csvfile)
        writer.writerow(headers)
        
        for result in merge_results:
            writer.writerow([
                result['group_id'],
                result['name'],
                result['address'],
                result['confidence'],
                result['primary_pid'],
                result['entries_merged'],
                result['entries_deleted'],
                result['status']
            ])
    
    print(f"✅ Merge results exported to: {filename}")
    return filename

def main():
    """Main execution function"""
    try:
        print("🚀 FAST MERGE EXECUTOR - High Confidence (>= 90)")
        print("=" * 60)
        
        # Find high-confidence mergeable contacts
        candidates = find_high_confidence_mergeable_contacts()
        
        if not candidates:
            print("❌ No high-confidence mergeable contacts found")
            return
        
        # Show summary before execution
        print(f"\n📊 PRE-MERGE SUMMARY")
        print("=" * 40)
        print(f"✅ Groups to merge: {len(candidates)}")
        print(f"🎯 Confidence threshold: >= 90%")
        print(f"📋 Total entries involved: {sum(len(c['entries']) for c in candidates)}")
        print(f"⏱️  Estimated time: {len(candidates)/50:.1f} minutes (at 50 merges/sec)")
        
        # Ask for confirmation
        response = input("\n⚠️  Are you sure you want to proceed with the merge? (yes/no): ")
        if response.lower() != 'yes':
            print("❌ Merge cancelled by user")
            return
        
        # Execute merge with progress tracking
        merge_results = execute_merge_fast(candidates, batch_size=100)
        
        # Export results
        results_file = export_merge_results(merge_results)
        
        print(f"\n🎉 MERGE EXECUTION COMPLETE!")
        print(f"📋 Results file: {results_file}")
        
    except Exception as e:
        print(f"❌ Error during execution: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
