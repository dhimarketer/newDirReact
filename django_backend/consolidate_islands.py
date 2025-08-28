#!/usr/bin/env python3
"""
2025-01-28: Island consolidation script
Consolidates islands with numeric suffixes (e.g., "K. Male 1", "K. Male 2") 
into single entries by removing the numeric suffix and merging related data.
Ignores islands that begin with "x_" as requested.
"""

import os
import sys
import django
import re
from collections import defaultdict

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_core.models import Island
from dirReactFinal_directory.models import PhoneBookEntry
from django.db import transaction

def get_base_island_name(island_name):
    """
    Extract the base island name by removing numeric suffixes.
    Examples:
    - "K. Male 1" -> "K. Male"
    - "Sh. feydhoo 3" -> "Sh. feydhoo"
    - "aa. mathiveri 1" -> "aa. mathiveri"
    """
    # Remove numeric suffixes (space followed by numbers)
    base_name = re.sub(r'\s+\d+$', '', island_name.strip())
    return base_name

def consolidate_islands():
    """
    Main function to consolidate islands with numeric suffixes.
    """
    print("Starting island consolidation process...")
    
    # Get all islands
    all_islands = Island.objects.all().order_by('name')
    print(f"Total islands found: {all_islands.count()}")
    
    # Group islands by base name (excluding x_ prefixed ones)
    island_groups = defaultdict(list)
    
    for island in all_islands:
        # Skip islands that begin with "x_"
        if island.name.startswith('x_'):
            print(f"Skipping x_ prefixed island: {island.name}")
            continue
            
        base_name = get_base_island_name(island.name)
        island_groups[base_name].append(island)
    
    # Find groups that need consolidation (more than one island)
    consolidation_needed = {base: islands for base, islands in island_groups.items() 
                           if len(islands) > 1}
    
    print(f"\nFound {len(consolidation_needed)} island groups that need consolidation:")
    for base_name, islands in consolidation_needed.items():
        print(f"  {base_name}: {[island.name for island in islands]}")
    
    if not consolidation_needed:
        print("No consolidation needed!")
        return
    
    # Start consolidation process
    print(f"\nStarting consolidation of {len(consolidation_needed)} island groups...")
    
    with transaction.atomic():
        consolidated_count = 0
        
        for base_name, islands in consolidation_needed.items():
            print(f"\nProcessing group: {base_name}")
            
            # Sort islands by name to ensure consistent ordering
            islands.sort(key=lambda x: x.name)
            
            # Use the first island as the primary one (usually the one without suffix)
            primary_island = islands[0]
            islands_to_merge = islands[1:]
            
            print(f"  Primary island: {primary_island.name} (ID: {primary_island.id})")
            print(f"  Islands to merge: {[island.name for island in islands_to_merge]}")
            
            # Update all phonebook entries to use the primary island
            updated_entries = 0
            for island_to_merge in islands_to_merge:
                # Update phonebook entries
                entries = PhoneBookEntry.objects.filter(island=island_to_merge)
                count = entries.count()
                if count > 0:
                    entries.update(island=primary_island)
                    updated_entries += count
                    print(f"    Updated {count} phonebook entries from {island_to_merge.name} to {primary_island.name}")
                
                # Update family-related entries if they exist
                # (This would need to be expanded based on your family model structure)
                
                # Delete the merged island
                island_to_merge.delete()
                print(f"    Deleted merged island: {island_to_merge.name}")
            
            # Update the primary island name to the base name if it's different
            if primary_island.name != base_name:
                old_name = primary_island.name
                primary_island.name = base_name
                primary_island.save()
                print(f"    Updated primary island name from '{old_name}' to '{base_name}'")
            
            consolidated_count += 1
            print(f"  Group {base_name} consolidated successfully")
        
        print(f"\nConsolidation completed! Processed {consolidated_count} island groups.")
        
        # Verify results
        final_count = Island.objects.count()
        print(f"Final island count: {final_count}")
        
        # Show some examples of consolidated islands
        print("\nSample of consolidated islands:")
        sample_islands = Island.objects.all().order_by('name')[:20]
        for island in sample_islands:
            print(f"  - {island.name}")

def verify_consolidation():
    """
    Verify that consolidation was successful by checking for remaining numeric suffixes.
    """
    print("\nVerifying consolidation...")
    
    all_islands = Island.objects.all()
    remaining_suffixes = []
    
    for island in all_islands:
        # Skip x_ prefixed islands
        if island.name.startswith('x_'):
            continue
            
        # Check if there are still numeric suffixes
        if re.search(r'\s+\d+$', island.name):
            remaining_suffixes.append(island.name)
    
    if remaining_suffixes:
        print(f"WARNING: Found {len(remaining_suffixes)} islands still with numeric suffixes:")
        for name in remaining_suffixes[:10]:  # Show first 10
            print(f"  - {name}")
        if len(remaining_suffixes) > 10:
            print(f"  ... and {len(remaining_suffixes) - 10} more")
    else:
        print("SUCCESS: No remaining numeric suffixes found (excluding x_ prefixed islands)")

if __name__ == "__main__":
    try:
        consolidate_islands()
        verify_consolidation()
        print("\nIsland consolidation script completed successfully!")
        
    except Exception as e:
        print(f"Error during consolidation: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
