#!/usr/bin/env python
# 2025-01-27: Script to create test images for phonebook entries to test image search functionality

import os
import sys
import django
from pathlib import Path

# Setup Django environment
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_directory.models import PhoneBookEntry, Image
from django.core.files import File
from PIL import Image as PILImage
import io

def create_test_image(filename, size=(200, 200), color=(100, 150, 200)):
    """Create a simple test image"""
    # Create a simple colored image
    img = PILImage.new('RGB', size, color)
    
    # Convert to bytes
    img_io = io.BytesIO()
    img.save(img_io, format='JPEG', quality=85)
    img_io.seek(0)
    
    return img_io

def create_test_images():
    """Create test images for some phonebook entries"""
    print("Creating test images for phonebook entries...")
    
    # Get some sample entries
    entries = PhoneBookEntry.objects.all()[:10]  # First 10 entries
    
    for i, entry in enumerate(entries):
        try:
            # Check if entry already has an image
            if hasattr(entry, 'image'):
                print(f"Entry {entry.pid} ({entry.name}) already has an image, skipping...")
                continue
            
            # Create a test image
            img_io = create_test_image(f"test_image_{entry.pid}.jpg")
            
            # Create Image record
            image = Image.objects.create(
                filename=f"test_image_{entry.pid}.jpg",
                entry=entry
            )
            
            # Save the actual image file
            image.image_file.save(
                f"test_image_{entry.pid}.jpg",
                File(img_io),
                save=True
            )
            
            print(f"Created image for entry {entry.pid} ({entry.name}): {image.filename}")
            
        except Exception as e:
            print(f"Error creating image for entry {entry.pid}: {str(e)}")
    
    print(f"\nTotal images created: {Image.objects.count()}")
    print("Test images created successfully!")

if __name__ == "__main__":
    create_test_images()
