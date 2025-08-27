#!/usr/bin/env python3
"""
Detailed debug script to investigate "heeraage, goidhoo" data thoroughly
"""

import os
import sys
import django

# Add the Django project to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')

# Setup Django
django.setup()

from dirReactFinal_directory.models import PhoneBookEntry
from dirReactFinal_family.models import FamilyGroup, FamilyMember, FamilyRelationship
from django.db.models import Q

def debug_heeraage_goidhoo_detailed():
    """Detailed investigation of heeraage, goidhoo data"""
    print("🔍 DETAILED Investigation of 'heeraage, goidhoo' Data\n")
    
    # Test different variations
    address_variations = [
        "heeraage",
        "Heeraage", 
        "HEERAAGE",
        "heeraage ",
        " heeraage",
        "heeraage.",
        ".heeraage",
        "heeraage,",
        ",heeraage"
    ]
    
    island_variations = [
        "goidhoo",
        "Goidhoo",
        "GOIDHOO", 
        "goidhoo ",
        " goidhoo",
        "goidhoo.",
        ".goidhoo",
        "goidhoo,",
        ",goidhoo"
    ]
    
    print("📝 Testing Address Variations:")
    for addr in address_variations:
        count = PhoneBookEntry.objects.filter(address__iexact=addr).count()
        print(f"   '{addr}' -> {count} entries")
    
    print("\n📝 Testing Island Variations:")
    for isl in island_variations:
        count = PhoneBookEntry.objects.filter(island__iexact=isl).count()
        print(f"   '{isl}' -> {count} entries")
    
    print("\n🎯 Testing Exact Combinations:")
    
    # Test exact matches first
    exact_match = PhoneBookEntry.objects.filter(
        address__iexact="heeraage",
        island__iexact="goidhoo"
    )
    print(f"   Exact match (iexact): {exact_match.count()} entries")
    
    if exact_match.count() > 0:
        print("   📋 Found entries:")
        for entry in exact_match:
            print(f"      - {entry.name} | PID: {entry.pid} | Address: '{entry.address}' | Island: '{entry.island}'")
    
    # Test with different case sensitivity
    print(f"\n🎯 Testing Case Sensitivity:")
    
    # Case sensitive
    case_sensitive = PhoneBookEntry.objects.filter(
        address="heeraage",
        island="goidhoo"
    )
    print(f"   Case sensitive: {case_sensitive.count()} entries")
    
    # Case insensitive with contains
    case_insensitive_contains = PhoneBookEntry.objects.filter(
        address__icontains="heeraage",
        island__icontains="goidhoo"
    )
    print(f"   Case insensitive contains: {case_insensitive_contains.count()} entries")
    
    if case_insensitive_contains.count() > 0:
        print("   📋 Found entries with contains:")
        for entry in case_insensitive_contains[:10]:  # Show first 10
            print(f"      - {entry.name} | PID: {entry.pid} | Address: '{entry.address}' | Island: '{entry.island}'")
    
    # Test with regex for more flexible matching
    print(f"\n🎯 Testing Regex Patterns:")
    
    import re
    
    # Get all entries and check manually
    all_entries = PhoneBookEntry.objects.all()
    matching_entries = []
    
    for entry in all_entries:
        if entry.address and entry.island:
            # Check if address contains "heeraage" (case insensitive)
            addr_match = re.search(r'heeraage', entry.address, re.IGNORECASE)
            # Check if island contains "goidhoo" (case insensitive)  
            isl_match = re.search(r'goidhoo', entry.island, re.IGNORECASE)
            
            if addr_match and isl_match:
                matching_entries.append(entry)
    
    print(f"   Regex pattern match: {len(matching_entries)} entries")
    
    if matching_entries:
        print("   📋 Regex matched entries:")
        for entry in matching_entries:
            print(f"      - {entry.name} | PID: {entry.pid} | Address: '{entry.address}' | Island: '{entry.island}'")
    
    # Check for whitespace or special character issues
    print(f"\n🎯 Checking for Whitespace/Special Character Issues:")
    
    # Look for entries with extra spaces
    whitespace_entries = PhoneBookEntry.objects.filter(
        Q(address__icontains="heeraage") | Q(island__icontains="goidhoo")
    )
    
    print(f"   Total entries with heeraage or goidhoo: {whitespace_entries.count()}")
    
    # Show some examples with their exact content
    print("   📋 Sample entries (showing exact content):")
    for entry in whitespace_entries[:15]:
        addr_repr = repr(entry.address) if entry.address else "None"
        isl_repr = repr(entry.island) if entry.island else "None"
        print(f"      - {entry.name} | PID: {entry.pid}")
        print(f"        Address: {addr_repr}")
        print(f"        Island: {isl_repr}")
        print()
    
    # Check if there are any entries that might be truncated or have encoding issues
    print(f"\n🎯 Checking for Data Quality Issues:")
    
    # Look for entries with very long addresses or islands
    long_addresses = PhoneBookEntry.objects.filter(
        Q(address__isnull=False) & Q(address__length__gt=50)
    )
    print(f"   Entries with address > 50 chars: {long_addresses.count()}")
    
    long_islands = PhoneBookEntry.objects.filter(
        Q(island__isnull=False) & Q(island__length__gt=50)
    )
    print(f"   Entries with island > 50 chars: {long_islands.count()}")
    
    # Check for entries with null or empty values
    null_address = PhoneBookEntry.objects.filter(address__isnull=True).count()
    empty_address = PhoneBookEntry.objects.filter(address__exact='').count()
    null_island = PhoneBookEntry.objects.filter(island__isnull=True).count()
    empty_island = PhoneBookEntry.objects.filter(island__exact='').count()
    
    print(f"   Null addresses: {null_address}")
    print(f"   Empty addresses: {empty_address}")
    print(f"   Null islands: {null_island}")
    print(f"   Empty islands: {empty_island}")
    
    # Final summary
    print(f"\n🎯 FINAL SUMMARY:")
    print(f"   Exact match (iexact): {exact_match.count()}")
    print(f"   Case insensitive contains: {case_insensitive_contains.count()}")
    print(f"   Regex pattern match: {len(matching_entries)}")
    
    if len(matching_entries) > 0:
        print(f"   ✅ FOUND {len(matching_entries)} entries for heeraage, goidhoo!")
        print(f"   The family creation should work for these entries.")
    else:
        print(f"   ❌ NO entries found for heeraage, goidhoo")
        print(f"   This explains why family creation fails.")

if __name__ == "__main__":
    debug_heeraage_goidhoo_detailed()
