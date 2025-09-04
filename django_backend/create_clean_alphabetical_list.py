#!/usr/bin/env python3
# 2025-01-31: Create clean alphabetical list from refined feminine names

def create_clean_alphabetical_list():
    """Create clean alphabetical list from refined feminine names file"""
    
    feminine_names = []
    
    # Read the refined file
    with open('refined_feminine_by_frequency.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Extract names from the refined list (skip header lines)
    for line in lines:
        line = line.strip()
        if line and not line.startswith('=') and not line.startswith('Total:') and not line.startswith('REFINED'):
            # Extract name from lines like "   1. aishath                   (appears 20421 times)"
            if line[0].isdigit() and '.' in line:
                parts = line.split('.', 1)
                if len(parts) > 1:
                    name_part = parts[1].split('(')[0].strip()
                    if name_part:
                        feminine_names.append(name_part)
    
    # Sort alphabetically
    feminine_names_sorted = sorted(feminine_names)
    
    # Output clean alphabetical list
    print("CLEAN FEMININE NAME PARTS LIST (ALPHABETICAL)")
    print("=" * 50)
    print(f"Total: {len(feminine_names_sorted)} feminine name parts")
    print("=" * 50)
    
    for name in feminine_names_sorted:
        print(name)
    
    # Save to file
    with open('clean_feminine_names_abc.txt', 'w', encoding='utf-8') as f:
        f.write("CLEAN FEMININE NAME PARTS LIST (ALPHABETICAL)\n")
        f.write("=" * 50 + "\n")
        f.write(f"Total: {len(feminine_names_sorted)} feminine name parts\n")
        f.write("=" * 50 + "\n\n")
        
        for name in feminine_names_sorted:
            f.write(name + "\n")
    
    print(f"\nClean alphabetical list saved to: clean_feminine_names_abc.txt")
    
    return feminine_names_sorted

if __name__ == "__main__":
    create_clean_alphabetical_list()
