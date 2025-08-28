# 2025-01-27: Directory models for dirReactFinal migration project
# Based on existing Flask PhoneBookEntry and Image models

from django.db import models
from django.core.validators import FileExtensionValidator
import os
import logging

class PhoneBookEntry(models.Model):
    """
    Phonebook entry model
    Directly maps to existing 't1' table in the database
    """
    # Primary key - maps to existing 'pid' column
    pid = models.IntegerField(primary_key=True)
    
    # Basic information
    nid = models.CharField(max_length=20, null=True, blank=True, db_index=True)  # 2025-01-28: Added db_index for search performance
    name = models.TextField(db_index=True)  # 2025-01-28: Added db_index for search performance
    contact = models.CharField(max_length=20, null=True, blank=True, db_index=True)  # 2025-01-28: Added db_index for search performance
    address = models.TextField(null=True, blank=True, db_index=True)  # 2025-01-28: Added db_index for search performance
    atoll = models.ForeignKey('dirReactFinal_core.Atoll', on_delete=models.SET_NULL, null=True, blank=True, db_column='atoll_fk_id', db_index=True)  # 2025-01-28: Updated to ForeignKey with db_index
    island = models.ForeignKey('dirReactFinal_core.Island', on_delete=models.SET_NULL, null=True, blank=True, db_column='island_fk_id', db_index=True)  # 2025-01-28: Updated to ForeignKey with db_index
    street = models.TextField(null=True, blank=True)
    ward = models.TextField(null=True, blank=True)
    
    # Additional information
    party = models.ForeignKey('dirReactFinal_core.Party', on_delete=models.SET_NULL, null=True, blank=True, db_column='party_fk_id', db_index=True)  # 2025-01-28: Updated to ForeignKey with db_index
    DOB = models.TextField(null=True, blank=True)
    status = models.TextField(null=True, blank=True)
    remark = models.TextField(null=True, blank=True, db_index=True)  # 2025-01-28: Added db_index for search performance
    email = models.CharField(max_length=120, null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')], null=True, blank=True, db_column='gender_choice', db_index=True)  # 2025-01-28: Updated to CharField with choices and db_index
    extra = models.TextField(null=True, blank=True)
    profession = models.TextField(null=True, blank=True, db_index=True)  # 2025-01-28: Added db_index for search performance
    pep_status = models.TextField(null=True, blank=True)
    
    # Change management
    change_status = models.CharField(max_length=20, default='pending')
    requested_by = models.TextField(null=True, blank=True)
    batch = models.CharField(max_length=20, null=True, blank=True)
    
    # Image status
    image_status = models.CharField(max_length=20, null=True, blank=True)
    
    # Family group reference
    family_group_id = models.IntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 't1'
        verbose_name = 'Phone Book Entry'
        verbose_name_plural = 'Phone Book Entries'
        indexes = [
            models.Index(fields=['contact']),
            models.Index(fields=['name']),
            models.Index(fields=['nid']),
            models.Index(fields=['address']),
            models.Index(fields=['profession']),
            models.Index(fields=['remark']),
            models.Index(fields=['atoll']),
            models.Index(fields=['island']),
            models.Index(fields=['party']),
            models.Index(fields=['gender']),
            # Composite indexes for common search combinations
            models.Index(fields=['name', 'address']),
            models.Index(fields=['address', 'island']),
            models.Index(fields=['name', 'party']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.contact}"
    
    def get_age(self):
        """
        2025-01-28: ENHANCED - Calculate age from DOB using year only to avoid month/day swap errors
        
        Uses only the year part of the date to calculate age, which is more reliable
        since month and day fields could have been swapped during data entry.
        """
        if not self.DOB:
            return None
        
        try:
            from datetime import datetime
            today = datetime.now()
            current_year = today.year
            
            # 2025-01-28: ENHANCED - Log DOB parsing for debugging
            logger = logging.getLogger(__name__)
            logger.debug(f"Processing DOB: '{self.DOB}' for entry {self.pid} ({self.name})")
            
            # Handle different date formats and extract year
            if '/' in self.DOB:
                # Format: DD/MM/YYYY or MM/DD/YYYY (ambiguous, so use year only)
                parts = self.DOB.split('/')
                logger.debug(f"Split by '/': {parts}")
                
                if len(parts) == 3:
                    # Try to identify the year (should be the largest 4-digit number)
                    year = None
                    for i, part in enumerate(parts):
                        logger.debug(f"Checking part {i}: '{part}' (length: {len(part)})")
                        if len(part) == 4 and part.isdigit():
                            year = int(part)
                            logger.debug(f"Found year {year} in part {i}")
                            break
                    
                    if year and 1900 <= year <= current_year:
                        age = current_year - year
                        logger.debug(f"DOB '{self.DOB}' parsed as year {year}, age {age}")
                        return age
                    else:
                        logger.debug(f"DOB '{self.DOB}' - invalid year {year} or out of range")
                        # 2025-01-28: FIX - Try alternative parsing for DD/MM/YYYY format
                        if len(parts[2]) == 4 and parts[2].isdigit():
                            # Assume DD/MM/YYYY format and use the third part
                            year = int(parts[2])
                            if 1900 <= year <= current_year:
                                age = current_year - year
                                logger.debug(f"DOB '{self.DOB}' parsed as DD/MM/YYYY format, year {year}, age {age}")
                                return age
                        
            elif '-' in self.DOB:
                # Format: YYYY-MM-DD or DD-MM-YYYY (ambiguous, so use year only)
                parts = self.DOB.split('-')
                logger.debug(f"Split by '-': {parts}")
                
                if len(parts) == 3:
                    # Try to identify the year (should be the largest 4-digit number)
                    year = None
                    for i, part in enumerate(parts):
                        logger.debug(f"Checking part {i}: '{part}' (length: {len(part)})")
                        if len(part) == 4 and part.isdigit():
                            year = int(part)
                            logger.debug(f"Found year {year} in part {i}")
                            break
                    
                    if year and 1900 <= year <= current_year:
                        age = current_year - year
                        logger.debug(f"DOB '{self.DOB}' parsed as year {year}, age {age}")
                        return age
                    else:
                        logger.debug(f"DOB '{self.DOB}' - invalid year {year} or out of range")
                        
            elif len(self.DOB) == 4 and self.DOB.isdigit():
                # Format: YYYY (year only)
                year = int(self.DOB)
                if 1900 <= year <= current_year:
                    age = current_year - year
                    logger.debug(f"DOB '{self.DOB}' parsed as year {year}, age {age}")
                    return age
                else:
                    logger.debug(f"DOB '{self.DOB}' - invalid year {year} or out of range")
            else:
                logger.debug(f"DOB '{self.DOB}' - unrecognized format")
                    
        except Exception as e:
            # Log the error for debugging but don't fail
            logger = logging.getLogger(__name__)
            logger.error(f"Error calculating age for DOB '{self.DOB}' for entry {self.pid} ({self.name}): {str(e)}")
            return None
            
        logger.debug(f"Failed to parse age from DOB '{self.DOB}' for entry {self.pid} ({self.name})")
        return None

    @classmethod
    def get_best_entry_for_person(cls, name, address, island=None):
        """
        2025-01-28: NEW - Find the best entry for a person, prioritizing entries with DOB data
        
        This method helps resolve duplicate entries by finding the most complete entry
        for a person (name + address + island combination).
        
        Args:
            name (str): Person's name
            address (str): Person's address
            island (str, optional): Person's island (if None, will try to find best match)
            
        Returns:
            PhoneBookEntry: The best entry for this person, or None if not found
        """
        # First, try to find entries with exact name + address + island match
        if island:
            entries = cls.objects.filter(
                name__iexact=name,
                address__iexact=address,
                island=island
            )
        else:
            # If no island specified, find all entries with name + address
            entries = cls.objects.filter(
                name__iexact=name,
                address__iexact=address
            )
        
        if not entries.exists():
            return None
        
        # If only one entry, return it
        if entries.count() == 1:
            return entries.first()
        
        # Multiple entries found - prioritize by data completeness
        # 1. First priority: entries with DOB data
        entries_with_dob = entries.exclude(DOB__isnull=True).exclude(DOB__exact='')
        
        if entries_with_dob.exists():
            # Among entries with DOB, prefer the one with most complete data
            best_entry = None
            best_score = -1
            
            for entry in entries_with_dob:
                score = 0
                # Score based on data completeness
                if entry.contact: score += 1
                if entry.email: score += 1
                if entry.nid: score += 1
                if entry.gender: score += 1
                if entry.profession: score += 1
                if entry.island: score += 1
                if entry.atoll: score += 1
                
                if score > best_score:
                    best_score = score
                    best_entry = entry
            
            return best_entry
        
        # 2. Second priority: entries without DOB but with other data
        # Find entry with most complete data
        best_entry = None
        best_score = -1
        
        for entry in entries:
            score = 0
            if entry.contact: score += 1
            if entry.email: score += 1
            if entry.nid: score += 1
            if entry.gender: score += 1
            if entry.profession: score += 1
            if entry.island: score += 1
            if entry.atoll: score += 1
            
            if score > best_score:
                best_score = score
                best_entry = entry
        
        return best_entry

    @classmethod
    def get_entries_for_family_inference(cls, address, island):
        """
        2025-01-28: FIXED - Get entries for family inference with intelligent deduplication
        
        This method returns a list of entries for family inference, handling duplicates
        intelligently by prioritizing entries with DOB data while preserving all
        legitimate family members.
        
        Args:
            address (str): Address to search for
            island (str): Island to search for
            
        Returns:
            list: List of PhoneBookEntry objects, prioritizing DOB entries
        """
        # Get all entries for this address + island
        all_entries = cls.objects.filter(
            address__iexact=address,
            island=island
        )
        
        if not all_entries.exists():
            return []
        
        # Group entries by name to identify potential duplicates
        from collections import defaultdict
        name_groups = defaultdict(list)
        
        for entry in all_entries:
            name_groups[entry.name.lower()].append(entry)
        
        # Process each name group
        family_entries = []
        for name, entries in name_groups.items():
            if len(entries) == 1:
                # Single entry - include it
                family_entries.append(entries[0])
            else:
                # Multiple entries with same name - this could be:
                # 1. Duplicate records for the same person
                # 2. Different people with the same name (e.g., father and son)
                
                # First, check if any have DOB data
                entries_with_dob = [e for e in entries if e.DOB and e.DOB != 'None']
                entries_without_dob = [e for e in entries if not e.DOB or e.DOB == 'None']
                
                if entries_with_dob:
                    # If we have entries with DOB, prioritize them
                    # Use the best entry with DOB data
                    best_dob_entry = cls.get_best_entry_for_person(entries[0].name, address, island)
                    if best_dob_entry:
                        family_entries.append(best_dob_entry)
                    
                    # Also include entries without DOB if they have different contact info
                    # (this handles cases where same person has multiple records)
                    for entry in entries_without_dob:
                        # Only add if it has different contact info (suggesting it's a different person)
                        if entry.contact and entry.contact != best_dob_entry.contact:
                            family_entries.append(entry)
                else:
                    # No DOB data - include all entries as they might be different people
                    # Use the best entry for each based on data completeness
                    best_entry = cls.get_best_entry_for_person(entries[0].name, address, island)
                    if best_entry:
                        family_entries.append(best_entry)
        
        return family_entries

class Image(models.Model):
    """
    Image model for contact photos
    Based on existing Flask Image model
    """
    id = models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')
    filename = models.CharField(max_length=255, unique=True)
    image_file = models.ImageField(upload_to='contact_photos/', validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'gif'])])
    last_modified = models.DateTimeField(auto_now=True)
    entry = models.OneToOneField(PhoneBookEntry, on_delete=models.CASCADE, related_name='image')
    
    class Meta:
        db_table = 'images'
        verbose_name = 'Contact Image'
        verbose_name_plural = 'Contact Images'
    
    def __str__(self):
        return f"Image for entry {self.entry.pid}"
    
    def delete(self, *args, **kwargs):
        """Override delete to remove image file from storage"""
        if self.image_file:
            if os.path.isfile(self.image_file.path):
                os.remove(self.image_file.path)
        super().delete(*args, **kwargs)

class SearchHistory(models.Model):
    """
    Search history model for tracking user searches
    """
    user = models.ForeignKey('dirReactFinal_core.User', on_delete=models.CASCADE, related_name='search_history')
    search_term = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'search_history'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user.username} searched for '{self.search_term}' at {self.timestamp}"
