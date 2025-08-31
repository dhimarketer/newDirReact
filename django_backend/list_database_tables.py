#!/usr/bin/env python3
"""
2025-01-29: NEW - List all tables in the database
Helps identify which tables exist and which are missing
"""
import os, sys, django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from django.db import connection

def list_all_tables():
    """List all tables in the database"""
    print("🔍 LISTING ALL TABLES IN THE DATABASE")
    print("=" * 50)
    
    with connection.cursor() as cursor:
        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
        tables = cursor.fetchall()
        
        if not tables:
            print("❌ No tables found in database")
            return
        
        print(f"📊 Total tables found: {len(tables)}")
        print("\n📋 Table List:")
        print("-" * 30)
        
        for i, (table_name,) in enumerate(tables, 1):
            # Get table info
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            
            print(f"{i:2d}. {table_name}")
            print(f"    Columns: {len(columns)}")
            
            # Show first few column names
            column_names = [col[1] for col in columns[:3]]
            if len(columns) > 3:
                column_names.append("...")
            print(f"    Sample columns: {', '.join(column_names)}")
            print()

def check_required_tables():
    """Check if required tables for the merge exist"""
    print("🔍 CHECKING REQUIRED TABLES FOR MERGE")
    print("=" * 50)
    
    required_tables = [
        't1',  # PhoneBookEntry
        'pending_changes',  # PendingChange
        'photo_moderations',  # PhotoModeration
    ]
    
    with connection.cursor() as cursor:
        for table_name in required_tables:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?;", (table_name,))
            exists = cursor.fetchone() is not None
            
            status = "✅ EXISTS" if exists else "❌ MISSING"
            print(f"{status} {table_name}")
            
            if exists:
                # Show table structure
                cursor.execute(f"PRAGMA table_info({table_name});")
                columns = cursor.fetchall()
                print(f"    Columns: {len(columns)}")
                for col in columns:
                    print(f"      - {col[1]} ({col[2]})")
            print()

def main():
    """Main execution function"""
    try:
        list_all_tables()
        print("\n" + "="*60 + "\n")
        check_required_tables()
        
    except Exception as e:
        print(f"❌ Error during execution: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
