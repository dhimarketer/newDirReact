#!/usr/bin/env python3
"""
Database Analysis Script for Smart Search Optimization
Analyzes existing data patterns to optimize the smart search feature

Usage:
    python analyze_search_patterns.py

This script will:
1. Analyze political party patterns
2. Analyze address patterns and suffixes
3. Analyze island/atoll patterns
4. Analyze name patterns
5. Analyze profession patterns
6. Generate optimization recommendations
"""

import os
import sys
import django
from collections import Counter, defaultdict
from typing import Dict, List, Tuple, Any

# Add the Django project to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')

# Setup Django
django.setup()

from dirReactFinal_directory.models import PhoneBookEntry
from dirReactFinal_core.models import Island

def analyze_political_parties() -> Dict[str, Any]:
    """Analyze political party patterns in the database"""
    print("🔍 Analyzing political party patterns...")
    
    # Get all non-empty party values
    parties = PhoneBookEntry.objects.exclude(
        party__isnull=True
    ).exclude(
        party__exact=''
    ).values_list('party', flat=True)
    
    # Count occurrences
    party_counts = Counter(parties)
    
    # Find unique parties
    unique_parties = list(party_counts.keys())
    
    # Analyze patterns
    analysis = {
        'total_entries_with_party': len(parties),
        'unique_parties': len(unique_parties),
        'party_distribution': dict(party_counts.most_common(20)),
        'all_parties': sorted(unique_parties),
        'recommendations': []
    }
    
    # Generate recommendations
    if len(unique_parties) > 0:
        analysis['recommendations'].append(f"Found {len(unique_parties)} unique political parties")
        analysis['recommendations'].append("Top parties: " + ", ".join([f"{p} ({c})" for p, c in party_counts.most_common(10)]))
    
    return analysis

def analyze_address_patterns() -> Dict[str, Any]:
    """Analyze address patterns and suffixes in the database"""
    print("🏠 Analyzing address patterns...")
    
    # Get all non-empty address values
    addresses = PhoneBookEntry.objects.exclude(
        address__isnull=True
    ).exclude(
        address__exact=''
    ).values_list('address', flat=True)
    
    # Count occurrences
    address_counts = Counter(addresses)
    
    # Analyze suffixes (last 3-5 characters)
    suffixes_3 = Counter()
    suffixes_4 = Counter()
    suffixes_5 = Counter()
    
    # Analyze prefixes (first 3-5 characters)
    prefixes_3 = Counter()
    prefixes_4 = Counter()
    prefixes_5 = Counter()
    
    # Analyze common patterns
    for address in addresses:
        if len(address) >= 3:
            suffixes_3[address[-3:]] += 1
        if len(address) >= 4:
            suffixes_4[address[-4:]] += 1
        if len(address) >= 5:
            suffixes_5[address[-5:]] += 1
            
        if len(address) >= 3:
            prefixes_3[address[:3]] += 1
        if len(address) >= 4:
            prefixes_4[address[:4]] += 1
        if len(address) >= 5:
            prefixes_5[address[:5]] += 1
    
    # Find common address patterns
    common_addresses = [addr for addr, count in address_counts.most_common(50) if count > 2]
    
    analysis = {
        'total_entries_with_address': len(addresses),
        'unique_addresses': len(address_counts),
        'address_distribution': dict(address_counts.most_common(20)),
        'common_suffixes_3': dict(suffixes_3.most_common(20)),
        'common_suffixes_4': dict(suffixes_4.most_common(20)),
        'common_suffixes_5': dict(suffixes_5.most_common(20)),
        'common_prefixes_3': dict(prefixes_3.most_common(20)),
        'common_prefixes_4': dict(prefixes_4.most_common(20)),
        'common_prefixes_5': dict(prefixes_5.most_common(20)),
        'common_addresses': common_addresses,
        'recommendations': []
    }
    
    # Generate recommendations
    analysis['recommendations'].append(f"Found {len(addresses)} entries with addresses")
    analysis['recommendations'].append(f"Found {len(address_counts)} unique addresses")
    
    # Check for common Maldivian patterns
    maldivian_patterns = ['ge', 'maa', 'villa', 'house', 'flat', 'room', 'floor', 'block', 'area', 'zone', 'district', 'ward', 'sector']
    found_patterns = []
    
    for pattern in maldivian_patterns:
        pattern_count = sum(1 for addr in addresses if pattern.lower() in addr.lower())
        if pattern_count > 0:
            found_patterns.append(f"{pattern}: {pattern_count}")
    
    if found_patterns:
        analysis['recommendations'].append("Maldivian address patterns found: " + ", ".join(found_patterns))
    
    return analysis

def analyze_island_patterns() -> Dict[str, Any]:
    """Analyze island and atoll patterns in the database"""
    print("🏝️ Analyzing island and atoll patterns...")
    
    # Get all non-empty island and atoll values
    islands = PhoneBookEntry.objects.exclude(
        island__isnull=True
    ).exclude(
        island__exact=''
    ).values_list('island', flat=True)
    
    atolls = PhoneBookEntry.objects.exclude(
        atoll__isnull=True
    ).exclude(
        atoll__exact=''
    ).values_list('atoll', flat=True)
    
    # Count occurrences
    island_counts = Counter(islands)
    atoll_counts = Counter(atolls)
    
    # Get unique values
    unique_islands = list(island_counts.keys())
    unique_atolls = list(atoll_counts.keys())
    
    # Check against official island database
    try:
        official_islands = Island.objects.filter(is_active=True).values_list('name', flat=True)
        official_island_names = set(island.lower() for island in official_islands)
        
        # Find unofficial island names
        unofficial_islands = [island for island in unique_islands if island.lower() not in official_island_names]
        
        # Find common misspellings (simple approach)
        potential_misspellings = []
        for island in unique_islands:
            if len(island) >= 4:  # Only check longer names
                for official in official_islands:
                    if len(official) >= 4:
                        # Simple similarity check (can be improved)
                        if island.lower() in official.lower() or official.lower() in island.lower():
                            if island.lower() != official.lower():
                                potential_misspellings.append(f"{island} -> {official}")
                                break
    except Exception as e:
        print(f"Warning: Could not access official island database: {e}")
        official_island_names = set()
        unofficial_islands = []
        potential_misspellings = []
    
    analysis = {
        'total_entries_with_island': len(islands),
        'total_entries_with_atoll': len(atolls),
        'unique_islands': len(unique_islands),
        'unique_atolls': len(unique_atolls),
        'island_distribution': dict(island_counts.most_common(20)),
        'atoll_distribution': dict(atoll_counts.most_common(20)),
        'all_islands': sorted(unique_islands),
        'all_atolls': sorted(unique_atolls),
        'official_islands_count': len(official_island_names),
        'unofficial_islands': unofficial_islands,
        'potential_misspellings': potential_misspellings,
        'recommendations': []
    }
    
    # Generate recommendations
    analysis['recommendations'].append(f"Found {len(islands)} entries with islands")
    analysis['recommendations'].append(f"Found {len(atolls)} entries with atolls")
    analysis['recommendations'].append(f"Found {len(unique_islands)} unique island names")
    analysis['recommendations'].append(f"Found {len(unique_atolls)} unique atoll names")
    
    if unofficial_islands:
        analysis['recommendations'].append(f"Found {len(unofficial_islands)} unofficial island names")
    
    if potential_misspellings:
        analysis['recommendations'].append(f"Found {len(potential_misspellings)} potential misspellings")
    
    return analysis

def analyze_name_patterns() -> Dict[str, Any]:
    """Analyze name patterns in the database"""
    print("👤 Analyzing name patterns...")
    
    # Get all non-empty name values
    names = PhoneBookEntry.objects.exclude(
        name__isnull=True
    ).exclude(
        name__exact=''
    ).values_list('name', flat=True)
    
    # Count occurrences
    name_counts = Counter(names)
    
    # Analyze name lengths
    name_lengths = [len(name) for name in names]
    length_counts = Counter(name_lengths)
    
    # Find common names
    common_names = [name for name, count in name_counts.most_common(50) if count > 2]
    
    # Analyze name structure (simple approach)
    single_names = []
    double_names = []
    complex_names = []
    
    for name in names:
        parts = name.strip().split()
        if len(parts) == 1:
            single_names.append(name)
        elif len(parts) == 2:
            double_names.append(name)
        else:
            complex_names.append(name)
    
    analysis = {
        'total_entries_with_name': len(names),
        'unique_names': len(name_counts),
        'name_distribution': dict(name_counts.most_common(20)),
        'name_length_distribution': dict(length_counts),
        'common_names': common_names,
        'name_structure': {
            'single_names': len(single_names),
            'double_names': len(double_names),
            'complex_names': len(complex_names)
        },
        'sample_single_names': single_names[:10],
        'sample_double_names': double_names[:10],
        'sample_complex_names': complex_names[:10],
        'recommendations': []
    }
    
    # Generate recommendations
    analysis['recommendations'].append(f"Found {len(names)} entries with names")
    analysis['recommendations'].append(f"Found {len(name_counts)} unique names")
    analysis['recommendations'].append(f"Name length range: {min(name_lengths)} to {max(name_lengths)} characters")
    analysis['recommendations'].append(f"Most common name length: {length_counts.most_common(1)[0][0]} characters")
    
    return analysis

def analyze_profession_patterns() -> Dict[str, Any]:
    """Analyze profession patterns in the database"""
    print("💼 Analyzing profession patterns...")
    
    # Get all non-empty profession values
    professions = PhoneBookEntry.objects.exclude(
        profession__isnull=True
    ).exclude(
        profession__exact=''
    ).values_list('profession', flat=True)
    
    # Count occurrences
    profession_counts = Counter(professions)
    
    # Find unique professions
    unique_professions = list(profession_counts.keys())
    
    # Analyze profession categories (simple approach)
    profession_categories = defaultdict(int)
    for profession in professions:
        profession_lower = profession.lower()
        if any(word in profession_lower for word in ['teacher', 'teach']):
            profession_categories['Education'] += 1
        elif any(word in profession_lower for word in ['doctor', 'dr', 'physician']):
            profession_categories['Medical'] += 1
        elif any(word in profession_lower for word in ['engineer', 'eng']):
            profession_categories['Engineering'] += 1
        elif any(word in profession_lower for word in ['lawyer', 'attorney']):
            profession_categories['Legal'] += 1
        elif any(word in profession_lower for word in ['business', 'businessman']):
            profession_categories['Business'] += 1
        elif any(word in profession_lower for word in ['fisherman', 'fisher']):
            profession_categories['Fishing'] += 1
        elif any(word in profession_lower for word in ['farmer', 'agriculture']):
            profession_categories['Agriculture'] += 1
        elif any(word in profession_lower for word in ['student']):
            profession_categories['Student'] += 1
        elif any(word in profession_lower for word in ['retired', 'retirement']):
            profession_categories['Retired'] += 1
        elif any(word in profession_lower for word in ['unemployed', 'jobless']):
            profession_categories['Unemployed'] += 1
        elif any(word in profession_lower for word in ['government', 'govt']):
            profession_categories['Government'] += 1
        elif any(word in profession_lower for word in ['private', 'self-employed']):
            profession_categories['Private Sector'] += 1
        else:
            profession_categories['Other'] += 1
    
    analysis = {
        'total_entries_with_profession': len(professions),
        'unique_professions': len(unique_professions),
        'profession_distribution': dict(profession_counts.most_common(20)),
        'all_professions': sorted(unique_professions),
        'profession_categories': dict(profession_categories),
        'recommendations': []
    }
    
    # Generate recommendations
    analysis['recommendations'].append(f"Found {len(professions)} entries with professions")
    analysis['recommendations'].append(f"Found {len(unique_professions)} unique professions")
    
    if profession_categories:
        top_category = max(profession_categories.items(), key=lambda x: x[1])
        analysis['recommendations'].append(f"Most common category: {top_category[0]} ({top_category[1]} entries)")
    
    return analysis

def generate_optimization_recommendations(all_analysis: Dict[str, Any]) -> List[str]:
    """Generate optimization recommendations based on analysis"""
    recommendations = []
    
    # Party recommendations
    party_analysis = all_analysis['political_parties']
    if party_analysis['unique_parties'] > 0:
        recommendations.append(f"Replace hardcoded party list with {party_analysis['unique_parties']} database-derived parties")
        recommendations.append("Add fuzzy matching for party abbreviations and variations")
    
    # Address recommendations
    address_analysis = all_analysis['addresses']
    if address_analysis['total_entries_with_address'] > 0:
        recommendations.append("Replace hardcoded address patterns with database-derived patterns")
        recommendations.append(f"Add {len(address_analysis['common_suffixes_3'])} common suffix patterns")
        recommendations.append(f"Add {len(address_analysis['common_prefixes_3'])} common prefix patterns")
    
    # Island recommendations
    island_analysis = all_analysis['islands']
    if island_analysis['total_entries_with_island'] > 0:
        recommendations.append(f"Replace hardcoded island list with {island_analysis['unique_islands']} database-derived islands")
        if island_analysis['potential_misspellings']:
            recommendations.append(f"Add fuzzy matching for {len(island_analysis['potential_misspellings'])} potential misspellings")
    
    # Name recommendations
    name_analysis = all_analysis['names']
    if name_analysis['total_entries_with_name'] > 0:
        recommendations.append("Add Maldivian name pattern recognition")
        recommendations.append(f"Handle {name_analysis['name_structure']['single_names']} single names and {name_analysis['name_structure']['double_names']} double names")
    
    # Profession recommendations
    profession_analysis = all_analysis['professions']
    if profession_analysis['total_entries_with_profession'] > 0:
        recommendations.append(f"Replace hardcoded profession list with {profession_analysis['unique_professions']} database-derived professions")
        recommendations.append("Add profession category detection")
    
    return recommendations

def main():
    """Main analysis function"""
    print("🚀 Starting Smart Search Database Analysis...")
    print("=" * 60)
    
    try:
        # Run all analyses
        all_analysis = {
            'political_parties': analyze_political_parties(),
            'addresses': analyze_address_patterns(),
            'islands': analyze_island_patterns(),
            'names': analyze_name_patterns(),
            'professions': analyze_profession_patterns()
        }
        
        # Generate recommendations
        recommendations = generate_optimization_recommendations(all_analysis)
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 ANALYSIS SUMMARY")
        print("=" * 60)
        
        for category, analysis in all_analysis.items():
            print(f"\n🔍 {category.replace('_', ' ').title()}:")
            for rec in analysis.get('recommendations', [])[:3]:  # Show first 3 recommendations
                print(f"   • {rec}")
        
        print(f"\n🎯 OPTIMIZATION RECOMMENDATIONS:")
        for i, rec in enumerate(recommendations, 1):
            print(f"   {i}. {rec}")
        
        # Save detailed results to file
        output_file = "search_pattern_analysis_results.txt"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("SMART SEARCH PATTERN ANALYSIS RESULTS\n")
            f.write("=" * 50 + "\n\n")
            
            for category, analysis in all_analysis.items():
                f.write(f"{category.upper()}:\n")
                f.write("-" * 30 + "\n")
                for key, value in analysis.items():
                    if key != 'recommendations':
                        f.write(f"{key}: {value}\n")
                f.write("\n")
            
            f.write("RECOMMENDATIONS:\n")
            f.write("-" * 30 + "\n")
            for rec in recommendations:
                f.write(f"• {rec}\n")
        
        print(f"\n💾 Detailed results saved to: {output_file}")
        print("\n✅ Analysis complete! Review results before proceeding with optimization.")
        
    except Exception as e:
        print(f"❌ Error during analysis: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
