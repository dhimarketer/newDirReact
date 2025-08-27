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
    created_by = models.ForeignKey('dirReactFinal_core.User', on_delete=models.CASCADE)
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
        2025-01-28: NEW - Sophisticated family inference logic
        
        Rules:
        1. All members of the same address are assumed to be family by default
        2. The eldest two (female, male) with DOB are considered parents
        3. Parents to children shall have an age gap of at least 10 years
        4. People with no DOB are not considered parents
        5. Automatically creates family group and relationships
        6. 2025-01-28: ENHANCED - Preserves manually updated families
        """
        from django.db import transaction
        from datetime import datetime
        from dirReactFinal_directory.models import PhoneBookEntry
        
        logger = logging.getLogger(__name__)
        
        try:
            with transaction.atomic():
                # Check if family group already exists
                existing_family = cls.objects.filter(address=address, island=island).first()
                
                # 2025-01-28: ENHANCED - If family exists and has been manually updated, return it as-is
                if existing_family and existing_family.is_manually_updated:
                    logger.info(f"Family for {address}, {island} has been manually updated - preserving existing structure")
                    return existing_family
                
                # Get all phonebook entries for this address
                logger.info(f"Searching for entries with address='{address}' and island='{island}'")
                
                entries = PhoneBookEntry.objects.filter(
                    address__iexact=address,
                    island__iexact=island
                )
                
                logger.info(f"Found {entries.count()} total entries for this address/island")
                
                # Show some sample entries for debugging
                for entry in entries[:5]:
                    logger.info(f"Sample entry: PID={entry.pid}, name='{entry.name}', address='{entry.address}', island='{entry.island}', DOB='{entry.DOB}', gender='{entry.gender}'")
                
                # Filter entries with DOB
                entries_with_dob = entries.exclude(DOB__isnull=True).exclude(DOB__exact='')
                logger.info(f"Found {entries_with_dob.count()} entries with DOB")
                
                if not entries_with_dob.exists():
                    logger.warning(f"No entries with DOB found for {address}, {island}")
                    return None
                
                # Calculate ages and sort by age (eldest first)
                entries_with_age = []
                for entry in entries_with_dob:
                    age = entry.get_age()
                    if age is not None:
                        entries_with_age.append((entry, age))
                
                logger.info(f"Found {len(entries_with_age)} entries with valid age calculation")
                
                # Sort by age (eldest first)
                entries_with_age.sort(key=lambda x: x[1], reverse=True)
                
                if not entries_with_age:
                    logger.warning(f"No entries with valid age found for {address}, {island}")
                    return None
                
                # Create or get family group
                family_group, created = cls.objects.get_or_create(
                    address=address,
                    island=island,
                    defaults={
                        'name': f"Family at {address}",
                        'description': f"Family from {address}, {island} (auto-inferred)",
                        'created_by': created_by,
                        'is_manually_updated': False  # 2025-01-28: Set as auto-inferred
                    }
                )
                
                # 2025-01-28: ENHANCED - Only clear existing data if this is a new family or not manually updated
                if not family_group.is_manually_updated:
                    # Clear existing members and relationships for this family
                    family_group.members.all().delete()
                    family_group.relationships.all().delete()
                    
                    # Add all entries as family members
                    for entry, age in entries_with_age:
                        FamilyMember.objects.create(
                            entry=entry,
                            family_group=family_group,
                            role_in_family='member'
                        )
                    
                    # Identify potential parents (eldest male and female with DOB)
                    potential_parents = []
                    for entry, age in entries_with_age:
                        if entry.gender and entry.DOB:
                            potential_parents.append((entry, age))
                    
                    # Sort potential parents by age (eldest first)
                    potential_parents.sort(key=lambda x: x[1], reverse=True)
                    
                    # Find eldest male and female
                    eldest_male = None
                    eldest_female = None
                    
                    for entry, age in potential_parents:
                        if entry.gender.lower() in ['male', 'm', '1'] and eldest_male is None:
                            eldest_male = (entry, age)
                        elif entry.gender.lower() in ['female', 'f', '2'] and eldest_female is None:
                            eldest_female = (entry, age)
                        
                        if eldest_male and eldest_female:
                            break
                    
                    # Create parent relationships
                    parents = []
                    if eldest_male:
                        parents.append(eldest_male)
                        # Update role to parent
                        FamilyMember.objects.filter(
                            entry=eldest_male[0],
                            family_group=family_group
                        ).update(role_in_family='parent')
                    
                    if eldest_female:
                        parents.append(eldest_female)
                        # Update role to parent
                        FamilyMember.objects.filter(
                            entry=eldest_female[0],
                            family_group=family_group
                        ).update(role_in_family='parent')
                    
                    # Create parent-child relationships based on age gap
                    for entry, age in entries_with_age:
                        # Skip if this is a parent
                        if any(entry.pid == parent[0].pid for parent in parents):
                            continue
                        
                        # Find suitable parent(s) with at least 10 year age gap
                        suitable_parents = []
                        for parent_entry, parent_age in parents:
                            age_gap = parent_age - age
                            if age_gap >= 10:  # At least 10 year age gap
                                suitable_parents.append(parent_entry)
                        
                        # Create parent-child relationships
                        for parent_entry in suitable_parents:
                            # Check if relationship already exists to avoid duplicates
                            existing_rel = FamilyRelationship.objects.filter(
                                person1=parent_entry,
                                person2=entry,
                                relationship_type='parent',
                                family_group=family_group
                            ).first()
                            
                            if not existing_rel:
                                # Create parent -> child relationship
                                FamilyRelationship.objects.create(
                                    person1=parent_entry,
                                    person2=entry,
                                    relationship_type='parent',
                                    family_group=family_group,
                                    notes=f"Auto-inferred: {parent_entry.name} -> {entry.name} (age gap: {parent_entry.get_age() - age} years)"
                                )
                            
                            # Check if reverse relationship exists
                            existing_reverse_rel = FamilyRelationship.objects.filter(
                                person1=entry,
                                person2=parent_entry,
                                relationship_type='child',
                                family_group=family_group
                            ).first()
                            
                            if not existing_reverse_rel:
                                # Create child -> parent relationship (reciprocal)
                                FamilyRelationship.objects.create(
                                    person1=entry,
                                    person2=parent_entry,
                                    relationship_type='child',
                                    family_group=family_group,
                                    notes=f"Auto-inferred: {entry.name} -> {parent_entry.name} (age gap: {parent_entry.get_age() - age} years)"
                                )
                            
                            # Update child role
                            FamilyMember.objects.filter(
                                entry=entry,
                                family_group=family_group
                            ).update(role_in_family='child')
                    
                    # Create sibling relationships for children
                    children = FamilyMember.objects.filter(
                        family_group=family_group,
                        role_in_family='child'
                    )
                    
                    if children.count() > 1:
                        # Group children by their parents
                        from collections import defaultdict
                        parent_children = defaultdict(list)
                        
                        for child in children:
                            # Find parents of this child
                            parent_relationships = FamilyRelationship.objects.filter(
                                person2=child.entry,
                                relationship_type='parent',
                                family_group=family_group
                            )
                            
                            for parent_rel in parent_relationships:
                                parent_children[parent_rel.person1.pid].append(child.entry)
                        
                        # Create sibling relationships
                        for parent_pid, children_list in parent_children.items():
                            if len(children_list) > 1:
                                # Create sibling relationships between all children of the same parent
                                for i, child1 in enumerate(children_list):
                                    for child2 in children_list[i+1:]:
                                        # Check if sibling relationship already exists
                                        existing_sibling = FamilyRelationship.objects.filter(
                                            person1=child1,
                                            person2=child2,
                                            relationship_type='sibling',
                                            family_group=family_group
                                        ).first()
                                        
                                        if not existing_sibling:
                                            # Create bidirectional sibling relationships
                                            FamilyRelationship.objects.create(
                                                person1=child1,
                                                person2=child2,
                                                relationship_type='sibling',
                                                family_group=family_group,
                                                notes=f"Auto-inferred: {child1.name} and {child2.name} are siblings"
                                            )
                                        
                                        # Check if reverse relationship exists
                                        existing_reverse_sibling = FamilyRelationship.objects.filter(
                                            person1=child2,
                                            person2=child1,
                                            relationship_type='sibling',
                                            family_group=family_group
                                        ).first()
                                        
                                        if not existing_reverse_sibling:
                                            FamilyRelationship.objects.create(
                                                person1=child2,
                                                person2=child1,
                                                relationship_type='sibling',
                                                family_group=family_group,
                                                notes=f"Auto-inferred: {child2.name} and {child1.name} are siblings"
                                            )
                else:
                    logger.info(f"Family for {address}, {island} is manually updated - skipping auto-inference")
                
                print(f"DEBUG: Auto-inferred family for {address}, {island}")
                print(f"DEBUG: Total members: {family_group.members.count()}")
                print(f"DEBUG: Total relationships: {family_group.relationships.count()}")
                print(f"DEBUG: Is manually updated: {family_group.is_manually_updated}")
                
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
