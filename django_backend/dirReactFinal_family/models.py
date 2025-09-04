# 2025-01-27: Family tree models for dirReactFinal migration project
# Based on existing Flask family tree functionality

from django.db import models
from dirReactFinal_directory.models import PhoneBookEntry
import logging

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
            
            # NUCLEAR FAMILY RULE: Select 2 oldest as potential parents (only if age gap is reasonable, 15–40 years)
            potential_parents = entries_with_dob[:2]  # Take the 2 oldest
            potential_children = entries_with_dob[2:]  # All others become children
            
            # CONSISTENCY RULE: Validate age gap between potential parents (15-40 years)
            if len(potential_parents) == 2:
                parent1_age, parent2_age = potential_parents[0][1], potential_parents[1][1]
                age_gap = abs(parent1_age - parent2_age)
                
                if age_gap > 40:
                    print(f"DEBUG: Age gap too large between potential parents: {age_gap} years. Using only oldest as parent.")
                    # Only use the oldest as parent
                    potential_parents = [potential_parents[0]]
                    potential_children = entries_with_dob[1:]
                elif age_gap < 15:
                    print(f"DEBUG: Age gap too small between potential parents: {age_gap} years. Using only oldest as parent.")
                    # Only use the oldest as parent
                    potential_parents = [potential_parents[0]]
                    potential_children = entries_with_dob[1:]
            
            # CONSISTENCY RULE: Parents must be older than their children (minimum 15 year gap)
            parents = []
            children = []
            
            for parent_entry, parent_age in potential_parents:
                parents.append(parent_entry)
                print(f"DEBUG: Selected parent: {parent_entry.name} (age {parent_age})")
            
            for child_entry, child_age in potential_children:
                # Validate that child is at least 15 years younger than any parent
                is_valid_child = True
                for parent_entry, parent_age in potential_parents:
                    if parent_age - child_age < 15:
                        print(f"DEBUG: Skipped child {child_entry.name} (age {child_age}) - too close in age to parent {parent_entry.name} (age {parent_age})")
                        is_valid_child = False
                        break
                
                if is_valid_child:
                    children.append(child_entry)
                    print(f"DEBUG: Selected child: {child_entry.name} (age {child_age})")
                else:
                    print(f"DEBUG: Child {child_entry.name} (age {child_age}) requires manual validation - age conflict with parents")
            
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
            for entry in entries:
                if entry.DOB:
                    try:
                        # 2025-01-31: FIXED - Support multiple DOB formats
                        dob = None
                        age = None
                        
                        # Try different date formats
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
        ('parent', 'Parent'),
        ('child', 'Child'),
        ('spouse', 'Spouse'),
        ('sibling', 'Sibling'),
        ('grandparent', 'Grandparent'),
        ('grandchild', 'Grandchild'),
        ('aunt_uncle', 'Aunt/Uncle'),
        ('niece_nephew', 'Niece/Nephew'),
        ('cousin', 'Cousin'),
        ('other', 'Other'),
    ]
    
    person1 = models.ForeignKey(PhoneBookEntry, on_delete=models.CASCADE, related_name='relationships_from')
    person2 = models.ForeignKey(PhoneBookEntry, on_delete=models.CASCADE, related_name='relationships_to')
    relationship_type = models.CharField(max_length=20, choices=RELATIONSHIP_TYPES)
    family_group = models.ForeignKey(FamilyGroup, on_delete=models.CASCADE, related_name='relationships')
    
    # Additional relationship details
    notes = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
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
    
    def get_reciprocal_relationship(self):
        """Get the reciprocal relationship type"""
        reciprocal_map = {
            'parent': 'child',
            'child': 'parent',
            'spouse': 'spouse',
            'sibling': 'sibling',
            'grandparent': 'grandchild',
            'grandchild': 'grandparent',
            'aunt_uncle': 'niece_nephew',
            'niece_nephew': 'aunt_uncle',
            'cousin': 'cousin',
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
