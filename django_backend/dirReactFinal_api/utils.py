# 2025-01-27: Utility functions for wildcard search processing
from django.db.models import Q
import re

def create_wildcard_query(field_name: str, pattern: str) -> Q:
    """
    Convert a wildcard pattern to a Django Q object for database queries.
    
    Args:
        field_name: The database field name (e.g., 'address', 'island')
        pattern: The search pattern that may contain * or % wildcards
    
    Returns:
        Django Q object for the wildcard search
    """
    if not pattern:
        return Q()
    
    # Convert % to * for consistency
    pattern = pattern.replace('%', '*')
    
    # If no wildcards, use simple icontains
    if '*' not in pattern:
        return Q(**{f"{field_name}__icontains": pattern})
    
    # Convert wildcard pattern to regex pattern
    # Escape special regex characters except *
    regex_pattern = re.escape(pattern)
    # Replace escaped \* with .* for regex wildcard
    regex_pattern = regex_pattern.replace(r'\*', '.*')
    
    # Add anchors for exact matching
    if not pattern.startswith('*'):
        regex_pattern = '^' + regex_pattern
    if not pattern.endswith('*'):
        regex_pattern = regex_pattern + '$'
    
    # Use iregex for case-insensitive regex search
    return Q(**{f"{field_name}__iregex": regex_pattern})

def process_wildcard_filters(filters: dict) -> dict:
    """
    Process all filters to handle wildcards properly.
    
    Args:
        filters: Dictionary of field filters that may contain wildcards
    
    Returns:
        Dictionary with processed wildcard queries
    """
    processed_filters = {}
    
    for field_name, value in filters.items():
        if value and isinstance(value, str) and ('*' in value or '%' in value):
            # This field has wildcards, process it
            processed_filters[field_name] = create_wildcard_query(field_name, value)
        else:
            # No wildcards, keep as is
            processed_filters[field_name] = value
    
    return processed_filters
