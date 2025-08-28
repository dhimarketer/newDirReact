#!/usr/bin/env python
"""
2025-01-28: Populate party table with existing party values
Script to populate the dirReactFinal_core_party table before migration
"""

import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from django.db import connection
from dirReactFinal_core.models import Party

def populate_party_table():
    """Populate the party table with existing party values from t1 table"""
    try:
        with connection.cursor() as cursor:
            # Get all unique party values from t1 table
            cursor.execute("SELECT DISTINCT party FROM t1 WHERE party IS NOT NULL AND party != ''")
            party_values = cursor.fetchall()
            
            print(f"Found {len(party_values)} unique party values")
            
            if not party_values:
                print("No party values found - no action needed")
                return True
            
            # Create Party objects for each unique value
            created_count = 0
            for party_record in party_values:
                party_name = party_record[0]
                
                # Skip if party already exists
                if Party.objects.filter(name=party_name).exists():
                    print(f"  Party '{party_name}' already exists, skipping")
                    continue
                
                # Create new party
                try:
                    # Handle complex party names (e.g., "MDP, MDA")
                    if ',' in party_name:
                        # For complex names, use the first party as primary
                        primary_party = party_name.split(',')[0].strip()
                        short_name = primary_party[:50]  # Limit to 50 chars
                    else:
                        primary_party = party_name
                        short_name = party_name[:50] if len(party_name) > 50 else party_name
                    
                    party = Party.objects.create(
                        name=party_name,
                        short_name=short_name,
                        is_active=True
                    )
                    print(f"  Created party: '{party_name}' (ID: {party.id})")
                    created_count += 1
                    
                except Exception as e:
                    print(f"  ERROR creating party '{party_name}': {e}")
                    continue
            
            print(f"\nParty table population completed:")
            print(f"  Total unique parties found: {len(party_values)}")
            print(f"  New parties created: {created_count}")
            print(f"  Total parties in table: {Party.objects.count()}")
            
            return True
                
    except Exception as e:
        print(f"ERROR: Failed to populate party table: {e}")
        return False

if __name__ == "__main__":
    print("Starting party table population...")
    success = populate_party_table()
    if success:
        print("\n✅ Party table population completed successfully")
        print("You can now run: python manage.py migrate")
    else:
        print("\n❌ Party table population failed")
        sys.exit(1)
