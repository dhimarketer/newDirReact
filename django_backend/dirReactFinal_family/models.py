# 2025-01-27: Family tree models for dirReactFinal migration project
# Based on existing Flask family tree functionality

from django.db import models
from django.core.files.storage import default_storage
from dirReactFinal_directory.models import PhoneBookEntry
import logging
import os

def family_media_upload_path(instance, filename):
    """
    Generate upload path for family media files using NID
    Files are stored in Docker volume: /app/media/family_media/{nid}/{filename}
    """
    # Get NID from the person if available
    nid = None
    if instance.person and instance.person.nid:
        nid = instance.person.nid
    elif instance.family_group and instance.family_group.members.exists():
        # Try to get NID from first family member
        first_member = instance.family_group.members.first()
        if first_member and first_member.entry.nid:
            nid = first_member.entry.nid
    
    # Fallback to 'unknown' if no NID found
    if not nid:
        nid = 'unknown'
    
    # Create directory structure: family_media/{nid}/{filename}
    return os.path.join('family_media', nid, filename)

class FamilyGroup(models.Model):
    """
    Family group model for organizing family relationships
    """
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    # 2025-01-27: Added address and island fields to link family groups to specific locations
    address = models.CharField(max_length=255, null=True, blank=True, help_text="Address where this family lives")
    island = models.CharField(max_length=255, null=True, blank=True, help_text="Island where this family lives")
    # 2025-01-31: NEW - Support for multiple families at same address with parent-child relationships
    parent_family = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, help_text="Parent family group if this is a sub-family")
    is_public = models.BooleanField(default=False, help_text="Whether this family group is visible to all users")
    # 2025-01-28: Added field to track if family has been manually updated by user
    is_manually_updated = models.BooleanField(default=False, help_text="Whether this family has been manually updated by a user")
    created_by = models.ForeignKey('dirReactFinal_core.User', on_delete=models.CASCADE, null=True, blank=True, help_text="User who created this family group (null for auto-generated)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'family_groups'
        verbose_name = 'Family Group'
        verbose_name_plural = 'Family Groups'
        # 2025-01-31: REMOVED - Unique constraint to allow multiple families at same address
        # unique_together = [['address', 'island']]
    
    def __str__(self):
        return self.name
    
    def get_member_count(self):
        """Get the number of members in this family group"""
        return self.members.count()
    
    def get_sub_families(self):
        """2025-01-31: NEW - Get all sub-families of this family group"""
        return FamilyGroup.objects.filter(parent_family=self)
    
    def get_all_related_families(self):
        """2025-01-31: NEW - Get all families related to this address (including parent and sub-families)"""
        if self.parent_family:
            # This is a sub-family, get all families at the same address
            return FamilyGroup.objects.filter(address=self.address, island=self.island)
        else:
            # This is a parent family, get all families at the same address
            return FamilyGroup.objects.filter(address=self.address, island=self.island)
    
    def mark_as_manually_updated(self):
        """2025-01-28: NEW - Mark this family as manually updated by user"""
        self.is_manually_updated = True
        self.save(update_fields=['is_manually_updated'])
    
    def cleanup_members_without_dob(self):
        """
        2025-01-28: NEW - Remove family members who don't have DOB data
        
        This method ensures that only members with calculable ages remain in the family group.
        """
        members_to_remove = []
        for member in self.members.all():
            if not member.entry.DOB or member.entry.DOB == 'None':
                members_to_remove.append(member.id)
        
        if members_to_remove:
            self.members.filter(id__in=members_to_remove).delete()
            logger = logging.getLogger(__name__)
            logger.info(f"Removed {len(members_to_remove)} members without DOB from family group {self.id}")
            return len(members_to_remove)
        
        return 0
    
    @classmethod
    def get_by_address(cls, address, island):
        """Get family group by address and island"""
        try:
            return cls.objects.get(address=address, island=island)
        except cls.DoesNotExist:
            return None
    
    @classmethod
    def get_all_by_address(cls, address, island):
        """2025-01-31: ENHANCED - Get all family groups at a specific address with fuzzy island matching"""
        from dirReactFinal_core.models import Island
        
        # First, try exact match
        exact_matches = cls.objects.filter(address=address, island=island).order_by('created_at')
        
        if exact_matches.exists():
            return exact_matches
        
        # If no exact matches, try fuzzy matching by address only
        # This handles cases where families have different island formats
        address_matches = cls.objects.filter(address=address).order_by('created_at')
        
        if address_matches.exists():
            return address_matches
        
        # If still no matches, try to find families with similar addresses
        # This handles minor variations in address spelling/case
        from django.db.models import Q
        similar_addresses = cls.objects.filter(
            Q(address__iexact=address) |  # Case-insensitive exact match
            Q(address__icontains=address) |  # Contains the address
            Q(address__startswith=address.split(',')[0].strip())  # Starts with the main part of address
        ).order_by('created_at')
        
        return similar_addresses
    
    @classmethod
    def infer_family_from_address(cls, address, island, created_by):
        """
        2025-01-28: ENHANCED - Infer family structure from address and island
        
        This method automatically creates family groups and relationships based on
        phonebook entries at a specific address. It prioritizes entries with DOB data
        and uses deduplication to avoid processing duplicate entries.
        
        Args:
            address (str): Address to search for
            island (str): Island name to search for
            created_by (User): User who created this family group (can be None for unauthenticated)
            
        Returns:
            FamilyGroup: Created or updated family group, or None if failed
        """
        from django.db import transaction
        from dirReactFinal_directory.models import PhoneBookEntry
        import logging
        
        logger = logging.getLogger(__name__)
        
        try:
            # Use atomic transaction to prevent database lock issues
            with transaction.atomic():
                logger.info(f"Starting family inference for {address}, {island}")
                
                # Check if family group already exists
                existing_family = cls.objects.filter(
                    address=address,
                    island=island
                ).first()
                
                if existing_family and existing_family.is_manually_updated:
                    logger.info(f"Family for {address}, {island} is manually updated - skipping auto-inference")
                    return existing_family
                
                # Get all phonebook entries for this address
                logger.info(f"Searching for entries with address='{address}' and island='{island}'")
                
                # 2025-01-28: FIXED - Handle island as string parameter that needs to be matched against Island model names
                # Since island field is now a ForeignKey, we need to find the Island object first
                from dirReactFinal_core.models import Island
                
                # Try to find the island by name (case-insensitive)
                try:
                    island_obj = Island.objects.filter(name__iexact=island).first()
                    if not island_obj:
                        # Try without the atoll code
                        island_name_without_code = island.split(' (')[0] if ' (' in island else island
                        island_obj = Island.objects.filter(name__iexact=island_name_without_code).first()
                    
                    if not island_obj:
                        logger.error(f"Island '{island}' not found in database")
                        return None
                    
                    logger.info(f"Found island: {island_obj.name} (ID: {island_obj.id})")
                    
                    # 2025-01-28: ENHANCED - Use deduplication logic to get best entries for each person
                    # This ensures we work with entries that have DOB data when available
                    entries = PhoneBookEntry.get_entries_for_family_inference(address, island_obj)
                    
                    if not entries:
                        logger.warning(f"No entries found for {address}, {island}")
                        return None
                    
                    logger.info(f"Found {len(entries)} unique people at {address}, {island} (after deduplication)")
                    
                except Exception as e:
                    logger.error(f"Error finding island '{island}': {str(e)}")
                    return None
                
                logger.info(f"Found {len(entries)} total entries for this address/island")
                
                # Show some sample entries for debugging
                for entry in entries[:5]:
                    logger.info(f"Sample entry: PID={entry.pid}, name='{entry.name}', address='{entry.address}', island='{entry.island}', DOB='{entry.DOB}', gender='{entry.gender}'")
                
                # Filter entries with DOB
                entries_with_dob = [entry for entry in entries if entry.DOB and entry.DOB != 'None']
                logger.info(f"Found {len(entries_with_dob)} entries with DOB")
                
                # 2025-01-28: ENHANCED - Log DOB data quality for debugging
                if entries_with_dob:
                    logger.info(f"DOB data quality check for {address}, {island}:")
                    for entry in entries_with_dob[:5]:  # Show first 5 entries
                        age = entry.get_age()
                        logger.info(f"  PID={entry.pid}, name='{entry.name}', DOB='{entry.DOB}', calculated_age={age}")
                else:
                    logger.warning(f"No entries with DOB found for {address}, {island}")
                    # 2025-01-28: FIXED - Allow family group creation even without DOB data
                    # This ensures family groups can be created for all addresses
                    logger.info(f"Creating family group for {address}, {island} without DOB data - will include all entries")
                    # Continue with all entries instead of returning None
                
                # 2025-01-28: ENHANCED - Log gender information for debugging
                entries_with_gender = [entry for entry in entries if entry.gender and entry.gender != 'None']
                logger.info(f"Found {len(entries_with_gender)} entries with gender data")
                if entries_with_gender:
                    for entry in entries_with_gender[:3]:
                        logger.info(f"Entry with gender: PID={entry.pid}, name='{entry.name}', gender='{entry.gender}'")
                else:
                    logger.warning(f"No entries with gender data found for {address}, {island} - will use age-based inference only")
                
                # Calculate ages and sort by age (eldest first)
                entries_with_age = []
                for entry in entries_with_dob:
                    age = entry.get_age()
                    if age is not None:
                        entries_with_age.append((entry, age))
                
                logger.info(f"Found {len(entries_with_age)} entries with valid age calculation")
                
                # 2025-01-28: FIXED - Allow family group creation with all entries, not just DOB entries
                # This ensures family groups can be created for all addresses
                if not entries_with_age:
                    logger.warning(f"No entries with valid age calculation found for {address}, {island}")
                    logger.info(f"Creating basic family group with all entries for {address}, {island}")
                    
                    # Create basic family group with all entries (including those without DOB)
                    family_group_defaults = {
                        'name': f"Family at {address}",
                        'description': f"Family from {address}, {island} (all entries - {len(entries)} members)",
                        'is_manually_updated': False
                    }
                    
                    if created_by:
                        family_group_defaults['created_by'] = created_by
                    
                    family_group, created = cls.objects.get_or_create(
                        address=address,
                        island=island,
                        defaults=family_group_defaults
                    )
                    
                    # Clear existing data and add all entries as members
                    family_group.members.all().delete()
                    family_group.relationships.all().delete()
                    
                    for entry in entries:
                        FamilyMember.objects.create(
                            entry=entry,
                            family_group=family_group,
                            role_in_family='member'
                        )
                    
                    logger.info(f"Created family group with {len(entries)} total entries for {address}, {island}")
                    
                    # 2025-01-31: FIXED - Save the family group to ensure it's persisted to database
                    family_group.save()
                    print(f"DEBUG: Saved family group {family_group.id} to database")
                    
                    return family_group
                
                # 2025-01-28: FIXED - Create family group with all entries, prioritizing age-calculable members
                # This ensures family groups can be created for all addresses while maintaining age information
                logger.info(f"Creating family group with {len(entries)} total members for {address}, {island} (including {len(entries_with_age)} with age data)")
                
                # Create or get family group
                family_group_defaults = {
                    'name': f"Family at {address}",
                    'description': f"Family from {address}, {island} (all entries - {len(entries)} members, {len(entries_with_age)} with age data)",
                    'is_manually_updated': False
                }
                
                if created_by:
                    family_group_defaults['created_by'] = created_by
                
                family_group, created = cls.objects.get_or_create(
                    address=address,
                    island=island,
                    defaults=family_group_defaults
                )
                
                logger.info(f"Family group {'created' if created else 'retrieved'}: {family_group.id}")
                
                # Clear existing data and add all entries as members
                family_group.members.all().delete()
                family_group.relationships.all().delete()
                
                # 2025-01-28: FIXED - Add all entries as members, not just age-calculable ones
                # This ensures family groups include all people at an address
                family_members = []
                for entry in entries:
                    family_members.append(FamilyMember(
                        entry=entry,
                        family_group=family_group,
                        role_in_family='member'
                    ))
                
                if family_members:
                    FamilyMember.objects.bulk_create(family_members, ignore_conflicts=True)
                
                logger.info(f"Added {len(family_members)} total members to family group")
                
                # 2025-01-31: SIMPLIFIED - Create only nuclear family relationships initially
                logger.info(f"Successfully created family group with {len(family_members)} total members for {address}, {island}")
                
                # Create simple nuclear family relationships only (parents + children)
                print(f"DEBUG: Starting NUCLEAR family relationship inference for family group {family_group.id} with {len(entries)} entries")
                cls._create_nuclear_family_relationships(family_group, entries)
                print(f"DEBUG: Completed NUCLEAR family relationship inference for family group {family_group.id}")
                
                # 2025-01-31: FIXED - Save the family group to ensure it's persisted to database
                family_group.save()
                print(f"DEBUG: Saved family group {family_group.id} to database")
                
                return family_group
                
        except Exception as e:
            print(f"ERROR: Failed to infer family for {address}, {island}: {str(e)}")
            return None
    
    @classmethod
    def _create_nuclear_family_relationships(cls, family_group, entries):
        """
        2025-01-31: ENHANCED - Create nuclear family relationships following strict rules
        
        NUCLEAR FAMILY CREATION RULES:
        1. Always start with nuclear family only (parents + children)
        2. Select 2 oldest as potential parents (only if age gap is reasonable, 15–40 years)
        3. Assign all younger members at that address as children
        4. Do not infer grandparents automatically
        5. Parents must be older than their children (minimum 15 year gap)
        6. Avoid creating more than 2 parents per nuclear family unit
        7. Grandparent relationships only emerge through user edits, never automatically
        """
        from datetime import datetime
        
        try:
            # Filter entries with DOB and calculate ages
            entries_with_dob = []
            for entry in entries:
                if entry.DOB:
                    try:
                        # Support multiple DOB formats
                        dob = None
                        age = None
                        
                        date_formats = ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y', '%Y/%m/%d']
                        
                        for date_format in date_formats:
                            try:
                                dob = datetime.strptime(entry.DOB, date_format)
                                current_year = datetime.now().year
                                birth_year = dob.year
                                age = current_year - birth_year
                                break
                            except ValueError:
                                continue
                        
                        # 2024-12-29: FIXED - Also handle year-only format (e.g., "1970")
                        if dob is None and len(entry.DOB) == 4 and entry.DOB.isdigit():
                            try:
                                birth_year = int(entry.DOB)
                                current_year = datetime.now().year
                                age = current_year - birth_year
                                dob = datetime(birth_year, 1, 1)  # Use January 1st as default
                                print(f"DEBUG: Parsed year-only DOB {entry.DOB} as {birth_year}, age {age}")
                            except ValueError:
                                pass
                        
                        if dob and age is not None and 0 < age < 120:
                            entries_with_dob.append((entry, age))
                            print(f"DEBUG: Entry {entry.name} has age {age} (DOB: {entry.DOB})")
                    except Exception as e:
                        print(f"DEBUG: Error processing entry {entry.name} DOB {entry.DOB}: {str(e)}")
                        continue
            
            print(f"DEBUG: Found {len(entries_with_dob)} entries with valid DOB and age")
            
            if len(entries_with_dob) < 2:
                print(f"DEBUG: Not enough entries with valid DOB for nuclear family inference: {len(entries_with_dob)}")
                return
            
            # Sort by age (oldest first)
            entries_with_dob.sort(key=lambda x: x[1], reverse=True)
            
            # NUCLEAR FAMILY RULE: Find the most likely parent couple based on age and gender
            potential_parents = []
            potential_children = []
            
            # 2024-12-29: NUCLEAR FAMILY ONLY - Find the most likely parent couple for nuclear family
            # Strategy: Exclude grandparents (people much older than others) and find the most likely parent couple
            # Multi-generational relationships should only be created through manual user editing
            
            # First, identify potential grandparents (people much older than the majority)
            ages = [age for _, age in entries_with_dob]
            if len(ages) >= 3:
                # Calculate median age to identify outliers
                sorted_ages = sorted(ages)
                median_age = sorted_ages[len(sorted_ages) // 2]
                
                # People more than 30 years older than median are likely grandparents
                nuclear_family_entries = [(entry, age) for entry, age in entries_with_dob 
                                        if age <= median_age + 30]
                grandparent_entries = [(entry, age) for entry, age in entries_with_dob 
                                     if age > median_age + 30]
                
                if grandparent_entries:
                    print(f"DEBUG: Identified {len(grandparent_entries)} potential grandparents (excluded from nuclear family):")
                    for entry, age in grandparent_entries:
                        print(f"  - {entry.name} (age {age}) - will require manual relationship editing")
            else:
                # Not enough people to identify grandparents reliably
                nuclear_family_entries = entries_with_dob
                grandparent_entries = []
            
            # Now find the most likely parent couple from nuclear family entries
            male_candidates = [(entry, age) for entry, age in nuclear_family_entries if entry.gender == 'M']
            female_candidates = [(entry, age) for entry, age in nuclear_family_entries if entry.gender == 'F']
            
            if male_candidates and female_candidates:
                # Sort by age (oldest first)
                male_candidates.sort(key=lambda x: x[1], reverse=True)
                female_candidates.sort(key=lambda x: x[1], reverse=True)
                
                # Try to pair the oldest male and female
                oldest_male = male_candidates[0]
                oldest_female = female_candidates[0]
                age_gap = abs(oldest_male[1] - oldest_female[1])
                
                if age_gap <= 20:  # Reasonable age gap for parents
                    potential_parents = [oldest_male, oldest_female]
                    # All others in nuclear family become children
                    potential_children = [(entry, age) for entry, age in nuclear_family_entries 
                                        if entry.pid != oldest_male[0].pid and entry.pid != oldest_female[0].pid]
                    print(f"DEBUG: Found nuclear parent couple: {oldest_male[0].name} ({oldest_male[1]}) and {oldest_female[0].name} ({oldest_female[1]})")
                else:
                    print(f"DEBUG: Age gap too large between oldest male and female: {age_gap} years. Using single parent approach.")
                    # Fall back to single parent approach
                    potential_parents = [oldest_male]
                    potential_children = [(entry, age) for entry, age in nuclear_family_entries if entry.pid != oldest_male[0].pid]
            else:
                # No gender data or only one gender - use age-based approach
                print(f"DEBUG: No suitable parent couple found. Using age-based single parent approach.")
                potential_parents = [nuclear_family_entries[0]]  # Oldest person in nuclear family
                potential_children = nuclear_family_entries[1:]  # All others
            
            # CONSISTENCY RULE: Parents must be older than their children (minimum 15 year gap)
            parents = []
            children = []
            
            for parent_entry, parent_age in potential_parents:
                parents.append(parent_entry)
                print(f"DEBUG: Selected parent: {parent_entry.name} (age {parent_age})")
            
            # 2024-12-29: NUCLEAR FAMILY ONLY - Simple child selection for nuclear family
            for child_entry, child_age in potential_children:
                # Check if child is at least 15 years younger than any parent
                is_valid_child = True
                for parent_entry, parent_age in potential_parents:
                    if parent_age - child_age < 15:
                        print(f"DEBUG: Skipped {child_entry.name} (age {child_age}) - too close in age to parent {parent_entry.name} (age {parent_age})")
                        is_valid_child = False
                        break
                
                if is_valid_child:
                    children.append(child_entry)
                    print(f"DEBUG: Selected child: {child_entry.name} (age {child_age})")
                else:
                    print(f"DEBUG: {child_entry.name} (age {child_age}) requires manual validation - age conflict with parents")
            
            print(f"DEBUG: NUCLEAR family structure: {len(parents)} parents, {len(children)} children")
            print(f"DEBUG: Parents: {[p.name for p in parents]}")
            print(f"DEBUG: Children: {[c.name for c in children]}")
            
            # Check for duplicate assignments
            parent_ids = {p.pid for p in parents}
            child_ids = {c.pid for c in children}
            duplicates = parent_ids.intersection(child_ids)
            if duplicates:
                print(f"🚨 ERROR: Found {len(duplicates)} people assigned to both parent and child roles: {duplicates}")
                for pid in duplicates:
                    parent = next(p for p in parents if p.pid == pid)
                    child = next(c for c in children if c.pid == pid)
                    print(f"🚨 DUPLICATE: {parent.name} (PID: {pid}) is both parent and child!")
            
            # Handle entries without DOB - they become children by default (requires manual validation)
            entries_without_dob = [entry for entry in entries if not entry.DOB]
            for entry in entries_without_dob:
                children.append(entry)
                print(f"DEBUG: Added entry without DOB as child (requires manual validation): {entry.name}")
            
            if parents and children:
                # Create parent-child relationships (nuclear family only)
                for parent in parents:
                    for child in children:
                        cls._create_relationship_if_not_exists(
                            family_group, parent, child, 'parent'
                        )
                        cls._create_relationship_if_not_exists(
                            family_group, child, parent, 'child'
                        )
                
                # Create spouse relationship between parents (max 2 parents per nuclear family)
                if len(parents) == 2:
                    cls._create_relationship_if_not_exists(
                        family_group, parents[0], parents[1], 'spouse'
                    )
                    cls._create_relationship_if_not_exists(
                        family_group, parents[1], parents[0], 'spouse'
                    )
                
                # Create sibling relationships between children
                for i, child1 in enumerate(children):
                    for child2 in children[i+1:]:
                        cls._create_relationship_if_not_exists(
                            family_group, child1, child2, 'sibling'
                        )
                        cls._create_relationship_if_not_exists(
                            family_group, child2, child1, 'sibling'
                        )
                
                print(f"DEBUG: Created NUCLEAR family relationships: {len(parents)} parents, {len(children)} children")
            else:
                print(f"DEBUG: No clear nuclear family structure found - requires manual user editing")
            
        except Exception as e:
            print(f"ERROR: Failed to create nuclear family relationships: {str(e)}")

    @classmethod
    def _create_inferred_relationships(cls, family_group, entries):
        """
        2025-01-31: SIMPLIFIED - Create simple nuclear family relationships only
        
        This method creates ONLY basic nuclear family relationships:
        1. The eldest two (female, male) with DOB are considered parents
        2. Parents to children shall have an age gap of at least 10 years
        3. People with no DOB are not considered parents
        4. Siblings are people of similar age (within 5 years) who are not parents
        
        NOTE: Multi-generational relationships (grandparents, grandchildren) are NOT created
        automatically. These should only be created through user editing.
        """
        from datetime import datetime
        from dirReactFinal_directory.models import PhoneBookEntry
        
        try:
            # Filter entries with DOB and calculate ages
            entries_with_dob = []
            print(f"DEBUG: Processing {len(entries)} entries for relationship inference")
            for entry in entries:
                print(f"DEBUG: Processing entry {entry.name} with DOB: '{entry.DOB}'")
                if entry.DOB:
                    try:
                        # 2025-01-31: FIXED - Support multiple DOB formats
                        dob = None
                        age = None
                        
                        # Try different date formats including year-only
                        date_formats = ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y', '%Y/%m/%d']
                        
                        for date_format in date_formats:
                            try:
                                dob = datetime.strptime(entry.DOB, date_format)
                                # 2025-01-31: FIXED - Use year-only calculation for age (ignore month and day)
                                current_year = datetime.now().year
                                birth_year = dob.year
                                age = current_year - birth_year
                                break
                            except ValueError:
                                continue
                        
                        # 2024-12-29: FIXED - Also handle year-only format (e.g., "1970")
                        if dob is None and len(entry.DOB) == 4 and entry.DOB.isdigit():
                            try:
                                birth_year = int(entry.DOB)
                                current_year = datetime.now().year
                                age = current_year - birth_year
                                dob = datetime(birth_year, 1, 1)  # Use January 1st as default
                                print(f"DEBUG: Parsed year-only DOB {entry.DOB} as {birth_year}, age {age}")
                            except ValueError:
                                pass
                        
                        if dob and age is not None:
                            # Skip entries with invalid ages (too old or too young)
                            if 0 < age < 120:
                                entries_with_dob.append((entry, age))
                                print(f"DEBUG: Entry {entry.name} has age {age} (DOB: {entry.DOB})")
                            else:
                                print(f"DEBUG: Skipping entry {entry.name} with invalid age {age}")
                        else:
                            print(f"DEBUG: Skipping entry {entry.name} with unparseable DOB format: {entry.DOB}")
                    except Exception as e:
                        print(f"DEBUG: Error processing entry {entry.name} DOB {entry.DOB}: {str(e)}")
                        continue
            
            print(f"DEBUG: Found {len(entries_with_dob)} entries with valid DOB and age")
            
            if len(entries_with_dob) < 2:
                print(f"DEBUG: Not enough entries with valid DOB for relationship inference: {len(entries_with_dob)}")
                return
            
            # Sort by age (oldest first)
            entries_with_dob.sort(key=lambda x: x[1], reverse=True)
            
            # 2025-01-31: SIMPLIFIED - Create only nuclear family relationships (parents + children)
            # Multi-generational relationships should only be created through user editing
            
            # Find parents (eldest male and female with at least 15 year age gap from others)
            # Increased age gap to be more conservative and avoid creating grandparent relationships
            parents = []
            children = []
            
            # 2025-01-31: ENHANCED - Handle cases where gender data is not available
            eldest_male = None
            eldest_female = None
            
            # First try to find by gender if available
            for entry, age in entries_with_dob:
                if entry.gender == 'M' and eldest_male is None:
                    eldest_male = (entry, age)
                elif entry.gender == 'F' and eldest_female is None:
                    eldest_female = (entry, age)
                
                if eldest_male and eldest_female:
                    break
            
            # If no gender data available, use age-based selection for parents
            if not eldest_male and not eldest_female:
                print(f"DEBUG: No gender data available, using age-based parent selection")
                # Sort by age (oldest first) and select top 2 as potential parents
                sorted_entries = sorted(entries_with_dob, key=lambda x: x[1], reverse=True)
                if len(sorted_entries) >= 2:
                    eldest_male = sorted_entries[0]  # Oldest as first parent
                    eldest_female = sorted_entries[1]  # Second oldest as second parent
                    print(f"DEBUG: Selected parents by age: {eldest_male[0].name} ({eldest_male[1]}) and {eldest_female[0].name} ({eldest_female[1]})")
            elif eldest_male and not eldest_female:
                # Only male found, find oldest female or use second oldest overall
                print(f"DEBUG: Only male parent found, looking for female parent")
                sorted_entries = sorted(entries_with_dob, key=lambda x: x[1], reverse=True)
                for entry, age in sorted_entries:
                    if entry != eldest_male[0]:  # Not the same as male parent
                        eldest_female = (entry, age)
                        break
            elif eldest_female and not eldest_male:
                # Only female found, find oldest male or use second oldest overall
                print(f"DEBUG: Only female parent found, looking for male parent")
                sorted_entries = sorted(entries_with_dob, key=lambda x: x[1], reverse=True)
                for entry, age in sorted_entries:
                    if entry != eldest_female[0]:  # Not the same as female parent
                        eldest_male = (entry, age)
                        break
            
            # 2025-01-31: ENHANCED - Intelligent parent detection based on age gaps and family structure
            if eldest_male and eldest_female:
                # Ensure we have tuples for consistency
                if not isinstance(eldest_male, tuple):
                    eldest_male = (eldest_male, 0)  # Fallback if not tuple
                if not isinstance(eldest_female, tuple):
                    eldest_female = (eldest_female, 0)  # Fallback if not tuple
                    
                print(f"DEBUG: Found eldest male {eldest_male[0].name} (age {eldest_male[1]}) and eldest female {eldest_female[0].name} (age {eldest_female[1]})")
                
                # 2025-01-31: ENHANCED - Intelligent parent detection algorithm
                # Look for the most likely parent pair based on age gaps and family structure
                parents = []
                children = []
                
                # Sort all entries by age for analysis
                sorted_entries = sorted(entries_with_dob, key=lambda x: x[1], reverse=True)
                
                # Find the best parent pair by analyzing age gaps
                best_parent_pair = None
                best_score = -1
                
                # Try different combinations of potential parents
                for i in range(min(4, len(sorted_entries))):  # Check top 4 oldest as potential parents
                    for j in range(i+1, min(4, len(sorted_entries))):
                        potential_parent1 = sorted_entries[i]
                        potential_parent2 = sorted_entries[j]
                        
                        # Debug: Check if we have tuples
                        print(f"DEBUG: potential_parent1 type: {type(potential_parent1)}, potential_parent2 type: {type(potential_parent2)}")
                        if not isinstance(potential_parent1, tuple) or not isinstance(potential_parent2, tuple):
                            print(f"DEBUG: Skipping non-tuple parent pair")
                            continue
                        
                        # Calculate score based on age gap and family structure
                        parent_age = min(potential_parent1[1], potential_parent2[1])
                        potential_children = [entry for entry, age in sorted_entries if entry not in [potential_parent1[0], potential_parent2[0]]]
                        
                        if potential_children:
                            # Calculate average age gap between parents and children
                            # Find ages for the potential children
                            child_ages = []
                            for entry in potential_children:
                                for entry_with_age, age in sorted_entries:
                                    if entry_with_age == entry:
                                        child_ages.append(age)
                                        break
                            
                            if child_ages:
                                avg_age_gap = sum(parent_age - age for age in child_ages) / len(child_ages)
                                
                                # Score based on:
                                # 1. Reasonable age gap (15-40 years is ideal)
                                # 2. Not too many children (max 10)
                                # 3. Parents should be reasonably close in age (max 10 years difference)
                                # 4. No children should be older than parents
                                parent_age_diff = abs(potential_parent1[1] - potential_parent2[1])
                                min_parent_age = min(potential_parent1[1], potential_parent2[1])
                                
                                # Check if any "children" are older than parents (invalid)
                                invalid_children = [age for age in child_ages if age >= min_parent_age]
                                
                                score = 0
                                if len(invalid_children) == 0:  # No children older than parents
                                    score += 15  # High score for valid parent-child relationship
                                else:
                                    score -= 20  # Heavy penalty for invalid relationships
                                    
                                if 15 <= avg_age_gap <= 40:  # Good parent-child age gap
                                    score += 10
                                if parent_age_diff <= 10:  # Parents close in age (reduced from 20 to 10)
                                    score += 5
                                if len(potential_children) <= 10:  # Allow larger families (increased from 6 to 10)
                                    score += 3
                                if avg_age_gap >= 10:  # Minimum age gap
                                    score += 2
                                
                                print(f"DEBUG: Parent pair {potential_parent1[0].name} ({potential_parent1[1]}) + {potential_parent2[0].name} ({potential_parent2[1]}) - Score: {score}, Avg gap: {avg_age_gap:.1f}, Children: {len(potential_children)}")
                                
                                if score > best_score:
                                    best_score = score
                                    best_parent_pair = (potential_parent1, potential_parent2, potential_children)
                
                # Use the best parent pair found
                if best_parent_pair and best_score >= 5:  # Minimum score threshold
                    parent1, parent2, potential_children = best_parent_pair
                    parents = [parent1[0], parent2[0]]
                    children = potential_children
                    print(f"DEBUG: Selected best parent pair: {parent1[0].name} ({parent1[1]}) + {parent2[0].name} ({parent2[1]}) with score {best_score}")
                else:
                    # Fallback to simple logic if no good pair found
                    parents = [eldest_male[0], eldest_female[0]]
                    children = [entry for entry, age in entries_with_dob if entry not in [eldest_male[0], eldest_female[0]]]
                    print(f"DEBUG: Using fallback parent selection: {parents[0].name} + {parents[1].name}")
                
                print(f"DEBUG: Creating NUCLEAR family relationships with {len(parents)} parents and {len(children)} children")
                print(f"DEBUG: Parents: {[p.name for p in parents]}")
                print(f"DEBUG: Children: {[c.name for c in children]}")
                
                if children:
                    # Create parent-child relationships (nuclear family only)
                    for parent in parents:
                        for child in children:
                            cls._create_relationship_if_not_exists(
                                family_group, parent, child, 'parent'
                            )
                            cls._create_relationship_if_not_exists(
                                family_group, child, parent, 'child'
                            )
                    
                    # Create spouse relationship between parents
                    if len(parents) == 2:
                        cls._create_relationship_if_not_exists(
                            family_group, parents[0], parents[1], 'spouse'
                        )
                        cls._create_relationship_if_not_exists(
                            family_group, parents[1], parents[0], 'spouse'
                        )
                    
                    # Create sibling relationships between children only
                    for i, child1 in enumerate(children):
                        for child2 in children[i+1:]:
                            cls._create_relationship_if_not_exists(
                                family_group, child1, child2, 'sibling'
                            )
                            cls._create_relationship_if_not_exists(
                                family_group, child2, child1, 'sibling'
                            )
                    
                    print(f"DEBUG: Created NUCLEAR family relationships: {len(parents)} parents, {len(children)} children")
                else:
                    # Only parents found, no children
                    print(f"DEBUG: Only parents found, no children to create relationships with")
                    # Create spouse relationship between parents
                    if len(parents) == 2:
                        cls._create_relationship_if_not_exists(
                            family_group, parents[0], parents[1], 'spouse'
                        )
                        cls._create_relationship_if_not_exists(
                            family_group, parents[1], parents[0], 'spouse'
                        )
                        print(f"DEBUG: Created spouse relationship between parents")
            else:
                # No clear parents found, treat all as siblings (no multi-generational structure)
                print(f"DEBUG: No clear parents found, creating sibling relationships only")
                sibling_relationships_created = 0
                for i, (entry1, age1) in enumerate(entries_with_dob):
                    for entry2, age2 in entries_with_dob[i+1:]:
                        if abs(age1 - age2) <= 5:  # Similar age = siblings
                            cls._create_relationship_if_not_exists(
                                family_group, entry1, entry2, 'sibling'
                            )
                            cls._create_relationship_if_not_exists(
                                family_group, entry2, entry1, 'sibling'
                            )
                            sibling_relationships_created += 2
                
                print(f"DEBUG: Created {sibling_relationships_created} sibling relationships for {len(entries_with_dob)} members (no parent-child structure)")
            
        except Exception as e:
            print(f"ERROR: Failed to create inferred relationships: {str(e)}")
    
    @classmethod
    def _create_relationship_if_not_exists(cls, family_group, person1, person2, relationship_type):
        """Create a relationship if it doesn't already exist"""
        
        try:
            print(f"DEBUG: Creating relationship {person1.name} -> {person2.name} ({relationship_type})")
            relationship, created = FamilyRelationship.objects.get_or_create(
                person1=person1,
                person2=person2,
                relationship_type=relationship_type,
                family_group=family_group,
                defaults={'is_active': True}
            )
            if created:
                print(f"DEBUG: Successfully created relationship {person1.name} -> {person2.name} ({relationship_type})")
            else:
                print(f"DEBUG: Relationship already exists {person1.name} -> {person2.name} ({relationship_type})")
        except Exception as e:
            print(f"ERROR: Failed to create relationship {person1.name} -> {person2.name}: {str(e)}")

class FamilyRelationship(models.Model):
    """
    Family relationship model for defining connections between family members
    """
    RELATIONSHIP_TYPES = [
        # Basic relationships
        ('parent', 'Parent'),
        ('child', 'Child'),
        ('spouse', 'Spouse'),
        ('sibling', 'Sibling'),
        ('grandparent', 'Grandparent'),
        ('grandchild', 'Grandchild'),
        ('aunt_uncle', 'Aunt/Uncle'),
        ('niece_nephew', 'Niece/Nephew'),
        ('cousin', 'Cousin'),
        
        # Extended family relationships
        ('step_parent', 'Step-Parent'),
        ('step_child', 'Step-Child'),
        ('step_sibling', 'Step-Sibling'),
        ('half_sibling', 'Half-Sibling'),
        
        # In-law relationships
        ('father_in_law', 'Father-in-Law'),
        ('mother_in_law', 'Mother-in-Law'),
        ('son_in_law', 'Son-in-Law'),
        ('daughter_in_law', 'Daughter-in-Law'),
        ('brother_in_law', 'Brother-in-Law'),
        ('sister_in_law', 'Sister-in-Law'),
        
        # Legal and formal relationships
        ('adopted_parent', 'Adopted Parent'),
        ('adopted_child', 'Adopted Child'),
        ('legal_guardian', 'Legal Guardian'),
        ('ward', 'Ward'),
        ('foster_parent', 'Foster Parent'),
        ('foster_child', 'Foster Child'),
        
        # Religious and ceremonial relationships
        ('godparent', 'Godparent'),
        ('godchild', 'Godchild'),
        ('sponsor', 'Sponsor'),
        
        # Other relationships
        ('other', 'Other'),
    ]
    
    person1 = models.ForeignKey(PhoneBookEntry, on_delete=models.CASCADE, related_name='relationships_from')
    person2 = models.ForeignKey(PhoneBookEntry, on_delete=models.CASCADE, related_name='relationships_to')
    relationship_type = models.CharField(max_length=20, choices=RELATIONSHIP_TYPES)
    family_group = models.ForeignKey(FamilyGroup, on_delete=models.CASCADE, related_name='relationships')
    
    # Additional relationship details
    notes = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # 2024-12-28: Phase 4 - Rich relationship metadata
    start_date = models.DateField(null=True, blank=True, help_text="When this relationship began (e.g., marriage date, adoption date)")
    end_date = models.DateField(null=True, blank=True, help_text="When this relationship ended (e.g., divorce date, death date)")
    relationship_status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('inactive', 'Inactive'),
            ('ended', 'Ended'),
            ('suspended', 'Suspended'),
            ('divorced', 'Divorced'),
        ],
        default='active',
        help_text="Current status of the relationship"
    )
    is_biological = models.BooleanField(default=True, help_text="Whether this is a biological relationship")
    is_legal = models.BooleanField(default=False, help_text="Whether this relationship has legal recognition")
    confidence_level = models.IntegerField(
        default=100,
        help_text="Confidence level in the accuracy of this relationship (0-100%)"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'family_relationships'
        unique_together = ['person1', 'person2', 'relationship_type']
        verbose_name = 'Family Relationship'
        verbose_name_plural = 'Family Relationships'
    
    def __str__(self):
        return f"{self.person1.name} is {self.get_relationship_type_display()} of {self.person2.name}"
    
    def clean(self):
        """Validate the relationship type, confidence level, and same-person relationships"""
        from django.core.exceptions import ValidationError
        valid_types = [choice[0] for choice in self.RELATIONSHIP_TYPES]
        if self.relationship_type not in valid_types:
            raise ValidationError(f"Invalid relationship type: {self.relationship_type}. Must be one of: {', '.join(valid_types)}")
        
        # Validate confidence level
        if self.confidence_level < 0 or self.confidence_level > 100:
            raise ValidationError(f"Confidence level must be between 0 and 100, got {self.confidence_level}")
        
        # Validate that person1 and person2 are different
        if self.person1 and self.person2 and self.person1 == self.person2:
            raise ValidationError("A person cannot have a relationship with themselves")
    
    def save(self, *args, **kwargs):
        """Override save to run validation"""
        self.full_clean()
        super().save(*args, **kwargs)
    
    def get_reciprocal_relationship(self):
        """Get the reciprocal relationship type"""
        reciprocal_map = {
            # Basic relationships
            'parent': 'child',
            'child': 'parent',
            'spouse': 'spouse',
            'sibling': 'sibling',
            'grandparent': 'grandchild',
            'grandchild': 'grandparent',
            'aunt_uncle': 'niece_nephew',
            'niece_nephew': 'aunt_uncle',
            'cousin': 'cousin',
            
            # Extended family relationships
            'step_parent': 'step_child',
            'step_child': 'step_parent',
            'step_sibling': 'step_sibling',
            'half_sibling': 'half_sibling',
            
            # In-law relationships
            'father_in_law': 'son_in_law',  # Father-in-law <-> Son-in-law (through marriage)
            'mother_in_law': 'daughter_in_law',  # Mother-in-law <-> Daughter-in-law (through marriage)
            'son_in_law': 'father_in_law',  # Son-in-law <-> Father-in-law (through marriage)
            'daughter_in_law': 'mother_in_law',  # Daughter-in-law <-> Mother-in-law (through marriage)
            'brother_in_law': 'brother_in_law',  # Brother-in-law <-> Brother-in-law (through marriage)
            'sister_in_law': 'sister_in_law',  # Sister-in-law <-> Sister-in-law (through marriage)
            
            # Legal and formal relationships
            'adopted_parent': 'adopted_child',
            'adopted_child': 'adopted_parent',
            'legal_guardian': 'ward',
            'ward': 'legal_guardian',
            'foster_parent': 'foster_child',
            'foster_child': 'foster_parent',
            
            # Religious and ceremonial relationships
            'godparent': 'godchild',
            'godchild': 'godparent',
            'sponsor': 'sponsor',  # Sponsor relationship is typically reciprocal
            
            # Other relationships
            'other': 'other',
        }
        return reciprocal_map.get(self.relationship_type, 'other')

class FamilyMember(models.Model):
    """
    Family member model for linking phonebook entries to family groups
    """
    entry = models.ForeignKey(PhoneBookEntry, on_delete=models.CASCADE, related_name='family_memberships')
    family_group = models.ForeignKey(FamilyGroup, on_delete=models.CASCADE, related_name='members')
    role_in_family = models.CharField(max_length=100, null=True, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'family_members'
        unique_together = ['entry', 'family_group']
        verbose_name = 'Family Member'
        verbose_name_plural = 'Family Members'
    
    def __str__(self):
        return f"{self.entry.name} in {self.family_group.name}"


class FamilyMedia(models.Model):
    """
    2024-12-28: Phase 4 - Media attachments for family members and relationships
    """
    MEDIA_TYPES = [
        ('photo', 'Photo'),
        ('document', 'Document'),
        ('certificate', 'Certificate'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('other', 'Other'),
    ]
    
    # What this media is attached to
    person = models.ForeignKey(PhoneBookEntry, on_delete=models.CASCADE, related_name='media_attachments', null=True, blank=True)
    relationship = models.ForeignKey(FamilyRelationship, on_delete=models.CASCADE, related_name='media_attachments', null=True, blank=True)
    family_group = models.ForeignKey(FamilyGroup, on_delete=models.CASCADE, related_name='media_attachments', null=True, blank=True)
    
    # Media details
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    file = models.FileField(upload_to=family_media_upload_path, null=True, blank=True)  # Actual file upload using NID
    file_path = models.CharField(max_length=500, null=True, blank=True)  # Path to the actual file
    file_size = models.BigIntegerField(null=True, blank=True)  # File size in bytes
    mime_type = models.CharField(max_length=100, null=True, blank=True)
    tags = models.CharField(max_length=500, null=True, blank=True)  # Comma-separated tags
    
    # Metadata
    uploaded_by = models.CharField(max_length=100, null=True, blank=True)  # User who uploaded
    upload_date = models.DateTimeField(auto_now_add=True)
    is_public = models.BooleanField(default=False)  # Whether this media is publicly visible
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'family_media'
        verbose_name = 'Family Media'
        verbose_name_plural = 'Family Media'
    
    def __str__(self):
        return f"{self.title} ({self.get_media_type_display()})"
    
    def save(self, *args, **kwargs):
        """Override save to update file_path and file_size when file is uploaded"""
        if self.file:
            # Update file_path to match the actual file location
            self.file_path = self.file.name
            # Update file_size if not already set
            if not self.file_size and hasattr(self.file, 'size'):
                self.file_size = self.file.size
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        """Override delete to remove file from storage"""
        if self.file:
            try:
                if default_storage.exists(self.file.name):
                    default_storage.delete(self.file.name)
            except Exception as e:
                logging.error(f"Error deleting file {self.file.name}: {e}")
        super().delete(*args, **kwargs)


class FamilyEvent(models.Model):
    """
    2024-12-28: Phase 4 - Life events and milestones for family members
    """
    EVENT_TYPES = [
        ('birth', 'Birth'),
        ('death', 'Death'),
        ('marriage', 'Marriage'),
        ('divorce', 'Divorce'),
        ('adoption', 'Adoption'),
        ('graduation', 'Graduation'),
        ('migration', 'Migration'),
        ('religious_ceremony', 'Religious Ceremony'),
        ('anniversary', 'Anniversary'),
        ('employment', 'Employment'),
        ('retirement', 'Retirement'),
        ('illness', 'Illness'),
        ('recovery', 'Recovery'),
        ('other', 'Other'),
    ]
    
    person = models.ForeignKey(PhoneBookEntry, on_delete=models.CASCADE, related_name='life_events')
    event_type = models.CharField(max_length=30, choices=EVENT_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    event_date = models.DateField()
    location = models.CharField(max_length=200, null=True, blank=True)
    
    # Related people (e.g., spouse for marriage, parents for birth)
    related_person = models.ForeignKey(PhoneBookEntry, on_delete=models.SET_NULL, null=True, blank=True, related_name='related_events')
    
    # Media attachments
    media_attachments = models.ManyToManyField(FamilyMedia, blank=True, related_name='events')
    
    # Metadata
    is_verified = models.BooleanField(default=False)  # Whether this event is verified
    verification_source = models.CharField(max_length=200, null=True, blank=True)  # Source of verification
    source = models.CharField(max_length=200, null=True, blank=True)  # Source of information
    notes = models.TextField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'family_events'
        verbose_name = 'Family Event'
        verbose_name_plural = 'Family Events'
        ordering = ['-event_date']
    
    def __str__(self):
        return f"{self.person.name} - {self.title} ({self.event_date})"
