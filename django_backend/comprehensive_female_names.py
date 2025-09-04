#!/usr/bin/env python3
# 2025-01-31: Comprehensive list of Maldivian feminine name parts

# Comprehensive list of feminine name parts in Maldivian names
comprehensive_female_name_parts = [
    # Traditional core Maldivian feminine names
    'fathmath', 'fathimath', 'aishath', 'mariyam', 'mariya',
    'hawwa', 'shareefa', 'shazna', 'jameela', 'adheeba', 
    'aminath', 'shabana', 'faiga', 'areefa', 'areesha',
    'areeshath', 'nashida', 'nashida', 'nasheeda', 'shameema',
    'shameema', 'shaheema', 'shaheedha', 'zahra', 'zahira',
    'zahira', 'zaheera', 'zareena', 'zumna', 'zunaira',
    
    # Common ending patterns (feminine)
    'aishath', 'fathimath', 'aminath', 'nasheeda', 'shareefa',
    'jameela', 'adheeba', 'nabeeha', 'shaheema', 'shameema',
    'nasreena', 'naseema', 'nazeera', 'shaheeda', 'shafeea',
    'shimaaha', 'shameema', 'shazna', 'shazna', 'shaznaa',
    
    # Names ending with -a (feminine pattern)
    'shareefa', 'jameela', 'adheeba', 'nabeeha', 'shaheema',
    'naseema', 'nasreena', 'shaheeda', 'shafeea', 'shaznaa',
    'zahira', 'zaheera', 'zareena', 'zunaira', 'mariya',
    'areefa', 'areesha', 'nasheeda', 'shimaaha', 'faiga',
    
    # Names ending with -th (feminine pattern)  
    'fathmath', 'fathimath', 'aishath', 'aminath', 'areeshath',
    'nasheedath', 'shareefath', 'jameelaath', 'adheebath',
    'nabeehath', 'shaheemth', 'shameemath', 'nasreenath',
    'naseemath', 'nazeereath', 'shaheedath', 'shafeeath',
    
    # Additional Maldivian patterns
    'hawwa', 'mariyam', 'shabana', 'shaznaa', 'faiga',
    'nasheeda', 'shameema', 'shaheema', 'zahira', 'zaheera',
    'zareena', 'zunaira', 'naseema', 'nasreena', 'nazeera',
    'shaheeda', 'shafeea', 'shimaaha', 'nabeeha', 'shaznaa',
    
    # Extended feminine names
    'riyasha', 'rifasha', 'rasheesha', 'raayasha', 'rafeesha',
    'ramaasha', 'raheema', 'rifga', 'rushda', 'rushdha',
    'raaja', 'raasha', 'ruwayda', 'ruwaydha', 'rayaasha',
    'rifaasha', 'rafeefa', 'rajeeva', 'rajeefa', 'raheefa'
]

# Remove duplicates and sort
unique_female_names = sorted(list(set(comprehensive_female_name_parts)))

print("Comprehensive Female Name Parts List:")
print("=" * 50)
for i, name in enumerate(unique_female_names, 1):
    print(f"{i:2d}. {name}")
print(f"\nTotal: {len(unique_female_names)} unique feminine name parts")

# Also show patterns
print("\n" + "=" * 50)
print("PATTERN ANALYSIS:")
print("=" * 50)

names_ending_a = [name for name in unique_female_names if name.endswith('a')]
names_ending_th = [name for name in unique_female_names if name.endswith('th')]

print(f"Names ending with -a: {len(names_ending_a)}")
for name in names_ending_a[:10]:  # Show first 10
    print(f"  - {name}")
if len(names_ending_a) > 10:
    print(f"  ... and {len(names_ending_a) - 10} more")

print(f"\nNames ending with -th: {len(names_ending_th)}")
for name in names_ending_th[:10]:  # Show first 10
    print(f"  - {name}")
if len(names_ending_th) > 10:
    print(f"  ... and {len(names_ending_th) - 10} more")
