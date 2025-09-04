#!/usr/bin/env python3
# 2025-01-31: Extract clean feminine name parts list without serial numbers

def extract_clean_feminine_parts():
    """Extract feminine name parts as clean list without serial numbers"""
    
    feminine_parts = []
    
    # Read the text file and extract name parts
    with open('unique_feminine_name_parts.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Find the section with the feminine name parts
    in_parts_section = False
    for line in lines:
        line = line.strip()
        
        # Start reading when we hit the parts section
        if line.startswith("FEMININE NAME PARTS (sorted by frequency):"):
            in_parts_section = True
            continue
        
        # Stop when we hit the next section
        if in_parts_section and line.startswith("="):
            break
        
        # Extract name parts from lines like "   1. aishath                   (appears 20421 times)"
        if in_parts_section and line and line[0].isdigit():
            # Find the name part between the number and the frequency
            parts = line.split('.', 1)
            if len(parts) > 1:
                name_part = parts[1].split('(')[0].strip()
                if name_part:
                    feminine_parts.append(name_part)
    
    # Sort alphabetically
    feminine_parts_sorted = sorted(feminine_parts)
    
    # Output as a clean list
    print("CLEAN FEMININE NAME PARTS LIST")
    print("=" * 50)
    print(f"Total: {len(feminine_parts_sorted)} feminine name parts")
    print("=" * 50)
    
    for part in feminine_parts_sorted:
        print(part)
    
    print("\n" + "=" * 50)
    print("PYTHON LIST FORMAT:")
    print("=" * 50)
    print("female_name_parts = [")
    
    # Output in chunks of 10 for better readability
    for i in range(0, len(feminine_parts_sorted), 10):
        chunk = feminine_parts_sorted[i:i+10]
        print("    " + ", ".join([f"'{part}'" for part in chunk]) + ",")
    
    print("]")
    
    return feminine_parts_sorted

if __name__ == "__main__":
    extract_clean_feminine_parts()
