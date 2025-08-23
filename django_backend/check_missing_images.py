#!/usr/bin/env python3
# 2025-01-27: Script to check for missing image files

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_directory.models import PhoneBookEntry

def check_missing_images():
    """Check which entries have image_status but missing image files"""
    media_root = os.path.join(os.path.dirname(__file__), 'media', 'contact_photos')
    
    # Get all entries with images
    entries_with_images = PhoneBookEntry.objects.exclude(image_status__isnull=True).exclude(image_status='0')
    
    print(f"Total entries with image_status: {entries_with_images.count()}")
    
    missing_files = []
    existing_files = []
    
    for entry in entries_with_images[:20]:  # Check first 20 for now
        image_path = os.path.join(media_root, entry.image_status)
        if os.path.exists(image_path):
            existing_files.append(entry.image_status)
        else:
            missing_files.append({
                'pid': entry.pid,
                'name': entry.name,
                'image_status': entry.image_status
            })
    
    print(f"\nExisting image files: {len(existing_files)}")
    print(f"Missing image files: {len(missing_files)}")
    
    if missing_files:
        print("\nSample missing files:")
        for item in missing_files[:5]:
            print(f"  PID {item['pid']}: {item['name']} - {item['image_status']}")
    
    return missing_files, existing_files

if __name__ == "__main__":
    check_missing_images()
