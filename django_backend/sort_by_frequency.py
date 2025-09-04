#!/usr/bin/env python3
# 2025-01-31: Sort refined feminine name parts by frequency

def sort_by_frequency():
    """Sort the refined feminine name parts by frequency from original data"""
    
    # Read the refined list
    refined_names = set()
    with open('clean_feminine_name_parts.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Extract names from the refined list (skip header lines)
    for line in lines:
        line = line.strip()
        if line and not line.startswith('=') and not line.startswith('Total:') and not line.startswith('CLEAN'):
            refined_names.add(line)
    
    print(f"Found {len(refined_names)} refined feminine name parts")
    
    # Read frequency data from original file
    frequency_data = {}
    with open('unique_feminine_name_parts.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Extract frequency data
    in_parts_section = False
    for line in lines:
        line = line.strip()
        
        if line.startswith("FEMININE NAME PARTS (sorted by frequency):"):
            in_parts_section = True
            continue
        
        if in_parts_section and line.startswith("="):
            break
        
        # Extract name and frequency from lines like "   1. aishath                   (appears 20421 times)"
        if in_parts_section and line and line[0].isdigit():
            parts = line.split('.', 1)
            if len(parts) > 1:
                name_freq_part = parts[1].strip()
                # Split by '(' to separate name from frequency
                if '(' in name_freq_part:
                    name_part = name_freq_part.split('(')[0].strip()
                    freq_part = name_freq_part.split('(')[1]
                    if 'appears' in freq_part and 'times' in freq_part:
                        try:
                            freq = int(freq_part.split('appears')[1].split('times')[0].strip())
                            frequency_data[name_part] = freq
                        except:
                            pass
    
    print(f"Found frequency data for {len(frequency_data)} names")
    
    # Filter refined names that have frequency data and sort by frequency
    refined_with_freq = []
    for name in refined_names:
        if name in frequency_data:
            refined_with_freq.append((name, frequency_data[name]))
        else:
            # If no frequency data, assign 0
            refined_with_freq.append((name, 0))
    
    # Sort by frequency (descending)
    refined_with_freq.sort(key=lambda x: x[1], reverse=True)
    
    # Output sorted list
    print("\nREFINED FEMININE NAME PARTS (sorted by frequency)")
    print("=" * 60)
    print(f"Total: {len(refined_with_freq)} refined feminine name parts")
    print("=" * 60)
    
    for i, (name, freq) in enumerate(refined_with_freq, 1):
        if freq > 0:
            print(f"{i:4d}. {name:<25} (appears {freq:5d} times)")
        else:
            print(f"{i:4d}. {name:<25} (no frequency data)")
    
    # Also save to file
    with open('refined_feminine_by_frequency.txt', 'w', encoding='utf-8') as f:
        f.write("REFINED FEMININE NAME PARTS (sorted by frequency)\n")
        f.write("=" * 60 + "\n")
        f.write(f"Total: {len(refined_with_freq)} refined feminine name parts\n")
        f.write("=" * 60 + "\n\n")
        
        for i, (name, freq) in enumerate(refined_with_freq, 1):
            if freq > 0:
                f.write(f"{i:4d}. {name:<25} (appears {freq:5d} times)\n")
            else:
                f.write(f"{i:4d}. {name:<25} (no frequency data)\n")
    
    print(f"\nSorted list saved to: refined_feminine_by_frequency.txt")
    
    return refined_with_freq

if __name__ == "__main__":
    sort_by_frequency()
