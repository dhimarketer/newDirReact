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
        # 2025-01-27: Added unique constraint for address+island combination to prevent duplicates
        unique_together = [['address', 'island']]
    
    def __str__(self):
        return self.name
    
    def get_member_count(self):
        """Get the number of members in this family group"""
        return self.members.count()
    
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
                
                # For now, just return the basic family group
                # Complex relationship logic can be added later once we resolve the database lock issue
                logger.info(f"Successfully created family group with {len(family_members)} total members for {address}, {island}")
                return family_group
                
        except Exception as e:
            print(f"ERROR: Failed to infer family for {address}, {island}: {str(e)}")
            return None

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
