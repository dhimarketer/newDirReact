#!/usr/bin/env python3
# 2025-01-31: CLEANUP - Clean up all intermediate gender classification files

import os
import glob
from datetime import datetime

def cleanup_gender_classification_files():
    """Clean up all intermediate gender classification files"""
    
    print("=" * 80)
    print("CLEANING UP GENDER CLASSIFICATION FILES")
    print("=" * 80)
    
    # Files to keep (final results)
    files_to_keep = [
        'exclusive_male_names_20250904_033837.txt',
        'exclusive_female_names_20250904_033837.txt', 
        'clean_expatriate_name_parts_20250904_100336.txt'
    ]
    
    # Patterns for files to remove
    patterns_to_remove = [
        # All intermediate classification files
        '*20250904_033837.txt',
        '*20250904_090305.txt',
        '*20250904_090802.txt',
        '*20250904_091520.txt',
        '*20250904_091647.txt',
        '*20250904_042411.txt',
        '*20250904_042422.txt',
        '*20250904_094921.txt',
        '*20250904_095004.txt',
        '*20250904_100336.txt',
        
        # All JSON summary files
        '*summary*.json',
        '*results*.json',
        
        # All rules files
        '*rules*.txt',
        
        # All removed/cleaned files
        '*removed*.txt',
        '*filtered*.txt',
        '*final*.txt',
        '*clean*.txt',
        
        # All business/location files
        '*business*.txt',
        '*location*.txt',
        '*unclassified*.txt',
        
        # All reclassified files
        '*reclassified*.txt',
        '*remaining*.txt',
        '*updated*.txt',
        
        # All true expatriate files
        '*true_expatriate*.txt',
        '*all_expatriate*.txt',
        
        # All comprehensive files
        '*comprehensive*.txt',
        '*comprehensive*.json'
    ]
    
    # Get all files matching patterns
    files_to_remove = []
    for pattern in patterns_to_remove:
        files_to_remove.extend(glob.glob(pattern))
    
    # Remove duplicates and filter out files to keep
    files_to_remove = list(set(files_to_remove))
    files_to_remove = [f for f in files_to_remove if f not in files_to_keep]
    
    print(f"Files to keep ({len(files_to_keep)}):")
    for file in files_to_keep:
        if os.path.exists(file):
            print(f"  ✓ {file}")
        else:
            print(f"  ✗ {file} (not found)")
    
    print(f"\nFiles to remove ({len(files_to_remove)}):")
    for file in sorted(files_to_remove):
        if os.path.exists(file):
            size = os.path.getsize(file)
            print(f"  - {file} ({size:,} bytes)")
        else:
            print(f"  - {file} (not found)")
    
    # Remove files
    removed_count = 0
    removed_size = 0
    
    for file in files_to_remove:
        if os.path.exists(file):
            try:
                size = os.path.getsize(file)
                os.remove(file)
                removed_count += 1
                removed_size += size
                print(f"  ✓ Removed: {file}")
            except Exception as e:
                print(f"  ✗ Failed to remove {file}: {e}")
    
    print(f"\n" + "=" * 80)
    print("CLEANUP COMPLETED!")
    print("=" * 80)
    print(f"Files removed: {removed_count}")
    print(f"Space freed: {removed_size:,} bytes ({removed_size/1024/1024:.1f} MB)")
    print("=" * 80)
    
    # Show remaining files
    print("\nRemaining files:")
    remaining_files = []
    for pattern in ['*20250904*.txt', '*20250904*.json']:
        remaining_files.extend(glob.glob(pattern))
    
    remaining_files = list(set(remaining_files))
    for file in sorted(remaining_files):
        if os.path.exists(file):
            size = os.path.getsize(file)
            print(f"  - {file} ({size:,} bytes)")
    
    return True

def main():
    """Main execution function"""
    print("Starting cleanup of gender classification files...")
    
    try:
        success = cleanup_gender_classification_files()
        
        if success:
            print("\nCleanup completed successfully!")
            return 0
        else:
            print("\nCleanup failed!")
            return 1
        
    except Exception as e:
        print(f"Cleanup failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    import sys
    sys.exit(main())
