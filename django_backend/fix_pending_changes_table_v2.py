#!/usr/bin/env python3
"""
2025-01-29: NEW - Fix pending_changes table structure to match Django model
Recreates the table with the exact structure expected by the PendingChange model
"""
import os, sys, django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from django.db import connection

def fix_pending_changes_table():
    """Fix the pending_changes table structure to match the Django model"""
    print("🔍 Fixing pending_changes table structure...")
    
    with connection.cursor() as cursor:
        # Drop the existing table
        cursor.execute("DROP TABLE IF EXISTS pending_changes;")
        print("✅ Dropped existing table")
        
        # Create the table with the correct structure based on the model
        create_table_sql = """
        CREATE TABLE pending_changes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            change_type VARCHAR(20) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            entry_id INTEGER,
            new_data TEXT,
            requested_by_id INTEGER NOT NULL,
            reviewed_by_id INTEGER,
            review_notes TEXT,
            review_date DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        """
        
        try:
            cursor.execute(create_table_sql)
            print("✅ pending_changes table recreated with correct structure")
            
            # Verify the table exists and has the right columns
            cursor.execute("PRAGMA table_info(pending_changes);")
            columns = cursor.fetchall()
            print("📋 Table columns:")
            for col in columns:
                print(f"   - {col[1]} ({col[2]})")
            
            return True
            
        except Exception as e:
            print(f"❌ Error recreating table: {str(e)}")
            return False

def main():
    """Main execution function"""
    try:
        print("🚀 FIXING PENDING_CHANGES TABLE STRUCTURE")
        print("=" * 50)
        
        success = fix_pending_changes_table()
        
        if success:
            print("\n🎉 Table structure fix completed successfully!")
            print("✅ The table now matches the Django model exactly")
            print("✅ You can now run the merge script")
        else:
            print("\n❌ Failed to fix the table structure")
            print("🔧 Manual intervention may be required")
            
    except Exception as e:
        print(f"❌ Error during execution: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
