#!/usr/bin/env python3
"""
2025-01-29: NEW - Fix missing pending_changes table
Creates the table that Django expects but doesn't exist
"""
import os, sys, django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from django.db import connection

def check_and_create_pending_changes_table():
    """Check if pending_changes table exists and create it if not"""
    print("🔍 Checking if pending_changes table exists...")
    
    with connection.cursor() as cursor:
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='pending_changes';")
        result = cursor.fetchone()
        
        if result:
            print("✅ pending_changes table already exists")
            return True
        else:
            print("❌ pending_changes table does not exist - creating it...")
            
            # Create the table based on the model structure
            create_table_sql = """
            CREATE TABLE pending_changes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                change_type VARCHAR(50) NOT NULL,
                model_name VARCHAR(100) NOT NULL,
                object_id INTEGER NOT NULL,
                old_data TEXT,
                new_data TEXT,
                status VARCHAR(20) DEFAULT 'pending',
                requested_by_id INTEGER,
                requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                reviewed_by_id INTEGER,
                reviewed_at DATETIME,
                notes TEXT
            );
            """
            
            try:
                cursor.execute(create_table_sql)
                print("✅ pending_changes table created successfully")
                return True
            except Exception as e:
                print(f"❌ Error creating table: {str(e)}")
                return False

def main():
    """Main execution function"""
    try:
        print("🚀 FIXING MISSING PENDING_CHANGES TABLE")
        print("=" * 50)
        
        success = check_and_create_pending_changes_table()
        
        if success:
            print("\n🎉 Table fix completed successfully!")
            print("✅ You can now run the merge script")
        else:
            print("\n❌ Failed to fix the table")
            print("🔧 Manual intervention may be required")
            
    except Exception as e:
        print(f"❌ Error during execution: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
