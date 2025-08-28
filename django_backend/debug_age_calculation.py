#!/usr/bin/env python3
"""
2025-01-28: Script to debug age calculation for specific family members

This script tests the age calculation for the family at 'kinbigasdhoshuge, f. feeali'
to identify why some members show NaN ages.
"""

import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_directory.models import PhoneBookEntry
import logging

# Set up logging to see debug messages
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def debug_age_calculation():
    """Debug age calculation for specific family members"""
    print("=== AGE CALCULATION DEBUG ===")
    
    # Test the specific family members mentioned in the issue
    test_dobs = [
        "28/08/1984",  # ahmed nadeem
        "19/08/1986",  # mohamed nadeem
        "23/06/1966",  # jaleela ibrahim
        "29/04/1992",  # ageela ibrahim
        "24/05/1990",  # aishath nazeela
        "07/02/1982",  # aminath zameela (shows age 43)
        "04/01/2000",  # rafhan ibrahim (shows age 25)
    ]
    
    print(f"Testing {len(test_dobs)} DOB values:")
    print("-" * 50)
    
    for dob in test_dobs:
        print(f"\nTesting DOB: '{dob}'")
        
        # Create a mock entry to test the get_age method
        mock_entry = PhoneBookEntry()
        mock_entry.DOB = dob
        mock_entry.pid = 999999  # Mock PID
        mock_entry.name = "Test Entry"
        
        try:
            age = mock_entry.get_age()
            print(f"  Result: age = {age}")
            
            if age is None:
                print(f"  ❌ FAILED: Age calculation returned None")
            else:
                print(f"  ✅ SUCCESS: Age calculated as {age}")
                
        except Exception as e:
            print(f"  ❌ ERROR: {str(e)}")
    
    print("\n" + "=" * 50)
    
    # Now test with real entries from the database
    print("\n=== TESTING REAL DATABASE ENTRIES ===")
    
    try:
        # Find entries with the specific address
        entries = PhoneBookEntry.objects.filter(
            address__icontains='kinbigasdhoshuge'
        )[:10]  # Limit to first 10
        
        print(f"Found {entries.count()} entries with address containing 'kinbigasdhoshuge'")
        
        for entry in entries:
            print(f"\nEntry: PID={entry.pid}, Name='{entry.name}', DOB='{entry.DOB}'")
            
            if entry.DOB:
                age = entry.get_age()
                print(f"  Calculated age: {age}")
                
                if age is None:
                    print(f"  ❌ Age calculation failed for this entry")
                else:
                    print(f"  ✅ Age calculation successful: {age}")
            else:
                print(f"  ❌ No DOB data")
                
    except Exception as e:
        print(f"Error querying database: {str(e)}")

if __name__ == '__main__':
    debug_age_calculation()
