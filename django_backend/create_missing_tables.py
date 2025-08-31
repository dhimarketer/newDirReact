#!/usr/bin/env python3
"""
2025-01-29: NEW - Create all missing tables that Django expects
Creates photo_moderations and any other missing tables
"""
import os, sys, django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from django.db import connection

def create_photo_moderations_table():
    """Create the missing photo_moderations table"""
    print("🔍 Creating missing photo_moderations table...")
    
    with connection.cursor() as cursor:
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='photo_moderations';")
        if cursor.fetchone():
            print("✅ photo_moderations table already exists")
            return True
        
        # Create the table based on the PhotoModeration model
        create_table_sql = """
        CREATE TABLE photo_moderations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_id INTEGER NOT NULL,
            photo_file VARCHAR(255) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            uploaded_by_id INTEGER NOT NULL,
            reviewed_by_id INTEGER,
            review_notes TEXT,
            review_date DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        """
        
        try:
            cursor.execute(create_table_sql)
            print("✅ photo_moderations table created successfully")
            return True
        except Exception as e:
            print(f"❌ Error creating photo_moderations table: {str(e)}")
            return False

def verify_all_required_tables():
    """Verify all required tables for the merge exist"""
    print("\n🔍 VERIFYING ALL REQUIRED TABLES")
    print("=" * 40)
    
    required_tables = [
        't1',  # PhoneBookEntry
        'pending_changes',  # PendingChange
        'photo_moderations',  # PhotoModeration
    ]
    
    all_exist = True
    
    with connection.cursor() as cursor:
        for table_name in required_tables:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?;", (table_name,))
            exists = cursor.fetchone() is not None
            
            status = "✅ EXISTS" if exists else "❌ MISSING"
            print(f"{status} {table_name}")
            
            if not exists:
                all_exist = False
    
    if all_exist:
        print("\n🎉 All required tables exist!")
        print("✅ You can now run the merge script")
    else:
        print("\n❌ Some required tables are still missing")
        print("🔧 Please check the errors above")
    
    return all_exist

def main():
    """Main execution function"""
    try:
        print("🚀 CREATING MISSING TABLES FOR MERGE")
        print("=" * 50)
        
        # Create missing tables
        photo_moderations_created = create_photo_moderations_table()
        
        if photo_moderations_created:
            # Verify all tables exist
            all_tables_exist = verify_all_required_tables()
            
            if all_tables_exist:
                print("\n🎉 SUCCESS: All tables are ready for merge!")
            else:
                print("\n❌ FAILED: Some tables are still missing")
        else:
            print("\n❌ FAILED: Could not create photo_moderations table")
            
    except Exception as e:
        print(f"❌ Error during execution: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
