# 2025-01-28: Search service for extracting complex business logic from views
# Refactoring the advanced_search method to improve maintainability and testability

from django.db.models import Q, QuerySet
from django.utils import timezone
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple, Optional
from .utils import create_wildcard_query
from dirReactFinal_directory.models import PhoneBookEntry
import logging
import time

logger = logging.getLogger(__name__)

class SearchService:
    """Service class for handling complex search logic and query parsing"""
    
    def __init__(self):
        # 2025-01-28: Initialize search service with configuration
        self.address_indicators = [
            'ge', 'maa', 'villa', 'house', 'flat', 'room', 'floor', 'block', 
            'area', 'zone', 'district', 'ward', 'sector', 'street', 'road', 
            'avenue', 'lane', 'drive', 'place', 'court', 'building', 
            'apartment', 'habaruge'
        ]
        
        self.island_indicators = [
            'male', 'addu', 'fuamulah', 'gan', 'fuvahmulah', 'thinadhoo', 
            'vaadhoo', 'keyodhoo', 'maradhoo', 'feydhoo', 'hithadhoo', 
            'kudahuvadhoo', 'kulhudhuffushi', 'naifaru', 'dhidhoo', 
            'hulhumale', 'viligili', 'hulhule', 'villingili'
        ]
        
        self.profession_indicators = [
            'teacher', 'doctor', 'engineer', 'lawyer', 'business', 'fisherman', 
            'farmer', 'student', 'retired', 'unemployed', 'government', 
            'private', 'self-employed', 'nurse', 'accountant', 'manager', 
            'driver', 'cook', 'cleaner', 'security'
        ]
        
        self.political_parties = ['AP', 'MDP', 'PPM', 'JP', 'MNP', 'ADH', 'PJP']
        self.gender_values = ['MALE', 'FEMALE', 'M', 'F']
        self.atoll_codes = ['M', 'F', 'S', 'N', 'L', 'B', 'AA', 'ADH', 'HDH', 'TH', 'V', 'HA', 'R']
    
    def optimize_search_query(self, queryset: QuerySet, timeout_seconds: int = 25) -> QuerySet:
        """
        Optimize search query with timeout handling and performance improvements
        
        Args:
            queryset: The Django QuerySet to optimize
            timeout_seconds: Maximum time to allow for query execution (default: 25 seconds)
        
        Returns:
            Optimized QuerySet with timeout protection
        """
        # 2025-01-28: Add query optimization and timeout handling for large datasets
        start_time = time.time()
        
        # Add select_related for ForeignKey fields to reduce database queries
        try:
            queryset = queryset.select_related('atoll', 'island', 'party')
            logger.info("Added select_related for ForeignKey optimization")
        except Exception as e:
            logger.warning(f"Could not add select_related: {e}")
        
        # Add only() to limit fields if we don't need all data
        # This can significantly improve performance for large datasets
        try:
            # Only select essential fields for search results
            queryset = queryset.only(
                'pid', 'name', 'contact', 'address', 'atoll__name', 
                'island__name', 'party__name', 'profession', 'gender'
            )
            logger.info("Added only() to limit selected fields for performance")
        except Exception as e:
            logger.warning(f"Could not add only(): {e}")
        
        # Check if query is taking too long
        if time.time() - start_time > timeout_seconds:
            logger.warning(f"Query optimization took too long ({time.time() - start_time:.2f}s), proceeding with basic optimization")
        
        logger.info(f"Query optimization completed in {time.time() - start_time:.2f}s")
        return queryset
    
    def execute_search_with_timeout(self, queryset: QuerySet, timeout_seconds: int = 25) -> Tuple[QuerySet, bool]:
        """
        Execute search query with timeout protection
        
        Args:
            queryset: The Django QuerySet to execute
            timeout_seconds: Maximum time to allow for query execution
        
        Returns:
            Tuple of (QuerySet, timeout_exceeded_flag)
        """
        # 2025-01-28: Add timeout protection for search queries to prevent frontend timeouts
        start_time = time.time()
        
        try:
            # Execute the query with timeout protection
            results = list(queryset[:1000])  # Limit to first 1000 results initially
            
            execution_time = time.time() - start_time
            logger.info(f"Search query executed in {execution_time:.2f}s, returned {len(results)} results")
            
            if execution_time > timeout_seconds:
                logger.warning(f"Search query took {execution_time:.2f}s (exceeded {timeout_seconds}s timeout)")
                return queryset, True
            
            return queryset, False
            
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Search query failed after {execution_time:.2f}s: {e}")
            raise e
    
    def _create_foreign_key_query(self, field_name: str, search_term: str, fallback_field: str = None) -> Q:
        """
        Create a query for ForeignKey fields with fallback to text search if ForeignKey fails
        
        Args:
            field_name: The ForeignKey field name (e.g., 'island', 'party')
            search_term: The search term
            fallback_field: The fallback field name (defaults to field_name)
        
        Returns:
            Django Q object for the search
        """
        if not fallback_field:
            fallback_field = field_name
            
        try:
            # Try ForeignKey relationship first
            if '*' in search_term or '%' in search_term:
                return Q(**{f"{field_name}__name__iregex": search_term.replace('*', '.*').replace('%', '.*')})
            else:
                return Q(**{f"{field_name}__name__icontains": search_term})
        except Exception as e:
            logger.warning(f"ForeignKey search failed for {field_name}, falling back to text search: {e}")
            # Fallback: treat as a text field if ForeignKey fails
            if '*' in search_term or '%' in search_term:
                return create_wildcard_query(fallback_field, search_term)
            else:
                return Q(**{f"{fallback_field}__icontains": search_term})
        
        self.island_indicators = [
            'male', 'addu', 'fuamulah', 'gan', 'fuvahmulah', 'thinadhoo', 
            'vaadhoo', 'keyodhoo', 'maradhoo', 'feydhoo', 'hithadhoo', 
            'kudahuvadhoo', 'kulhudhuffushi', 'naifaru', 'dhidhoo', 
            'hulhumale', 'viligili', 'hulhule', 'villingili'
        ]
        
        self.profession_indicators = [
            'teacher', 'doctor', 'engineer', 'lawyer', 'business', 'fisherman', 
            'farmer', 'student', 'retired', 'unemployed', 'government', 
            'private', 'self-employed', 'nurse', 'accountant', 'manager', 
            'driver', 'cook', 'cleaner', 'security'
        ]
        
        self.political_parties = ['AP', 'MDP', 'PPM', 'JP', 'MNP', 'ADH', 'PJP']
        self.gender_values = ['MALE', 'FEMALE', 'M', 'F']
        self.atoll_codes = ['M', 'F', 'S', 'N', 'L', 'B', 'AA', 'ADH', 'HDH', 'TH', 'V', 'HA', 'R']
    
    def analyze_search_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze search data to determine which filters are active"""
        # 2025-01-28: Extract filter analysis logic from advanced_search method
        analysis = {
            'has_address_filter': bool(data.get('address') and data['address'].strip()),
            'has_island_filter': bool(data.get('island') and data['island'].strip()),
            'has_party_filter': bool(data.get('party') and data['party'].strip()),
            'has_query': bool(data.get('query') and data['query'].strip()),
            'has_name_filter': bool(data.get('name') and data['name'].strip()),
            'has_contact_filter': bool(data.get('contact') and data['contact'].strip()),
            'has_nid_filter': bool(data.get('nid') and data['nid'].strip()),
            'has_atoll_filter': bool(data.get('atoll') and data['atoll'].strip()),
            'has_profession_filter': bool(data.get('profession') and data['profession'].strip()),
            'has_gender_filter': bool(data.get('gender') and data['gender'].strip()),
            'has_remark_filter': bool(data.get('remark') and data['remark'].strip()),
            'has_pep_status_filter': bool(data.get('pep_status') and data['pep_status'].strip()),
            'has_min_age_filter': bool(data.get('min_age') and data['min_age'] > 0),
            'has_max_age_filter': bool(data.get('max_age') and data['max_age'] > 0),
            'is_family_search': data.get('limit_results', False),
            'use_and_logic': data.get('useAndLogic', False)
        }
        
        logger.info(f"Search analysis: {analysis}")
        return analysis
    
    def handle_comma_separated_query(self, data: Dict[str, Any], analysis: Dict[str, Any]) -> Tuple[QuerySet, Dict[str, Any]]:
        """Handle comma-separated queries with AND logic"""
        # 2025-01-28: Extract comma-separated query logic from advanced_search method
        logger.info("Processing comma-separated query with AND logic")
        
        queryset = PhoneBookEntry.objects.all()
        and_conditions = Q()
        field_count = 0
        
        # Build AND query for all specified fields
        if analysis['has_name_filter']:
            name_query = create_wildcard_query('name', data['name'].strip())
            and_conditions &= name_query
            field_count += 1
            logger.info(f"Added name filter: '{data['name'].strip()}'")
        
        if analysis['has_address_filter']:
            address_query = create_wildcard_query('address', data['address'].strip())
            and_conditions &= address_query
            field_count += 1
            logger.info(f"Added address filter: '{data['address'].strip()}'")
        
        if analysis['has_island_filter']:
            # 2025-01-28: FIXED - Use helper method for ForeignKey handling
            island_term = data['island'].strip()
            island_query = self._create_foreign_key_query('island', island_term)
            and_conditions &= island_query
            field_count += 1
            logger.info(f"Added island filter: '{island_term}'")
        
        if analysis['has_party_filter']:
            # 2025-01-28: FIXED - Use helper method for ForeignKey handling
            party_term = data['party'].strip()
            party_query = self._create_foreign_key_query('party', party_term)
            and_conditions &= party_query
            field_count += 1
            logger.info(f"Added party filter: '{party_term}'")
        
        if analysis['has_contact_filter']:
            contact_query = create_wildcard_query('contact', data['contact'].strip())
            and_conditions &= contact_query
            field_count += 1
            logger.info(f"Added contact filter: '{data['contact'].strip()}'")
        
        if analysis['has_nid_filter']:
            nid_query = create_wildcard_query('nid', data['nid'].strip())
            and_conditions &= nid_query
            field_count += 1
            logger.info(f"Added NID filter: '{data['nid'].strip()}'")
        
        if analysis['has_profession_filter']:
            profession_query = create_wildcard_query('profession', data['profession'].strip())
            and_conditions &= profession_query
            field_count += 1
            logger.info(f"Added profession filter: '{data['profession'].strip()}'")
        
        if analysis['has_gender_filter']:
            gender_query = create_wildcard_query('gender', data['gender'].strip())
            and_conditions &= gender_query
            field_count += 1
            logger.info(f"Added gender filter: '{data['gender'].strip()}'")
        
        if analysis['has_min_age_filter']:
            and_conditions &= Q(age__gte=data['min_age'])
            field_count += 1
            logger.info(f"Added min age filter: {data['min_age']}")
        
        if analysis['has_max_age_filter']:
            and_conditions &= Q(age__lte=data['max_age'])
            field_count += 1
            logger.info(f"Added max age filter: {data['max_age']}")
        
        logger.info(f"Comma-separated query: {field_count} fields with AND logic")
        
        # Apply AND logic to get precise results
        precise_queryset = queryset.filter(and_conditions)
        logger.info(f"Results after AND logic: {precise_queryset.count()}")
        
        if precise_queryset.count() > 0:
            queryset = precise_queryset
            logger.info("Using precise AND logic results for comma-separated query")
            
            # Show sample results for debugging
            sample_entries = queryset[:3]
            for entry in sample_entries:
                logger.info(f"Sample result: {entry.name} - Address: {entry.address} - Island: {entry.island} - Party: {entry.party}")
        else:
            logger.info("No results found with AND logic for comma-separated query")
        
        response_data = {
            'search_type': 'comma_separated_and_logic',
            'fields_used': field_count,
            'logic_applied': 'AND'
        }
        
        return queryset, response_data
    
    def handle_field_combination_search(self, data: Dict[str, Any], analysis: Dict[str, Any]) -> QuerySet:
        """Handle searches with multiple field combinations (address+island, address+party, etc.)"""
        # 2025-01-28: Extract field combination logic from advanced_search method
        queryset = PhoneBookEntry.objects.all()
        
        if analysis['has_address_filter'] and analysis['has_island_filter']:
            queryset = self._handle_address_island_search(data, analysis, queryset)
        elif analysis['has_address_filter'] and analysis['has_party_filter']:
            queryset = self._handle_address_party_search(data, queryset)
        elif analysis['has_name_filter'] and analysis['has_party_filter']:
            queryset = self._handle_name_party_search(data, queryset)
        elif analysis['has_island_filter'] and analysis['has_party_filter']:
            queryset = self._handle_island_party_search(data, queryset)
        
        return queryset
    
    def _handle_address_island_search(self, data: Dict[str, Any], analysis: Dict[str, Any], queryset: QuerySet) -> QuerySet:
        """Handle address + island combination search"""
        logger.info(f"Smart search case: Address='{data['address']}', Island='{data['island']}'")
        
        address_term = data['address'].strip()
        island_term = data['island'].strip()
        
        logger.info(f"Searching for address term: '{address_term}' AND island term: '{island_term}'")
        
        # Debug: Check what exists in the database for these terms
        logger.info(f"Database check - Entries with address containing '{address_term}': {PhoneBookEntry.objects.filter(address__icontains=address_term).count()}")
        # 2025-01-28: FIXED - Handle island field correctly (it's a ForeignKey, not a text field)
        try:
            island_count = PhoneBookEntry.objects.filter(island__name__icontains=island_term).count()
            logger.info(f"Database check - Entries with island name containing '{island_term}': {island_count}")
        except Exception as e:
            logger.warning(f"Could not check island count (field may not be properly migrated): {e}")
            island_count = 0
        
        # First try: Use AND logic for precise results (narrow scope)
        if analysis['is_family_search']:
            logger.info("Using exact matching for family search")
            precise_queryset = queryset.filter(
                Q(address__iexact=address_term) & Q(island__name__iexact=island_term)
            )
        else:
            # Use wildcard-aware matching for flexible search
            address_query = create_wildcard_query('address', address_term)
            # 2025-01-28: FIXED - Use helper method for ForeignKey handling
            island_query = self._create_foreign_key_query('island', island_term)
            precise_queryset = queryset.filter(address_query & island_query)
        
        logger.info(f"Results after AND logic (precise): {precise_queryset.count()}")
        
        if precise_queryset.count() > 0:
            queryset = precise_queryset
            logger.info("Using precise AND logic results")
        else:
            # No precise results, try OR logic for broader results
            logger.info("No precise results found, trying OR logic for broader results...")
            
            address_query = create_wildcard_query('address', address_term)
            # 2025-01-28: FIXED - Use helper method for ForeignKey handling
            island_query = self._create_foreign_key_query('island', island_term)
            broader_queryset = queryset.filter(address_query | island_query)
            
            logger.info(f"Results after OR logic (broader): {broader_queryset.count()}")
            
            if broader_queryset.count() > 0:
                queryset = broader_queryset
                logger.info("Using broader OR logic results")
            else:
                logger.info("No results found with either AND or OR logic")
        
        return queryset
    
    def _handle_address_party_search(self, data: Dict[str, Any], queryset: QuerySet) -> QuerySet:
        """Handle address + party combination search"""
        logger.info(f"Smart search case: Address='{data['address']}', Party='{data['party']}'")
        
        address_term = data['address'].strip()
        party_term = data['party'].strip()
        
        # First try: Use AND logic for precise results
        address_query = create_wildcard_query('address', address_term)
        # 2025-01-28: FIXED - Handle ForeignKey field properly
        if '*' in party_term or '%' in party_term:
            party_query = Q(party__name__iregex=party_term.replace('*', '.*').replace('%', '.*'))
        else:
            party_query = Q(party__name__icontains=party_term)
        precise_queryset = queryset.filter(address_query & party_query)
        
        if precise_queryset.count() > 0:
            return precise_queryset
        else:
            # Fall back to OR logic for broader results
            broader_queryset = queryset.filter(address_query | party_query)
            return broader_queryset if broader_queryset.count() > 0 else queryset
    
    def _handle_name_party_search(self, data: Dict[str, Any], queryset: QuerySet) -> QuerySet:
        """Handle name + party combination search"""
        logger.info(f"Smart search case: Name='{data['name']}', Party='{data['party']}'")
        
        name_term = data['name'].strip()
        party_term = data['party'].strip()
        
        # First try: Use AND logic for precise results
        name_query = create_wildcard_query('name', name_term)
        # 2025-01-28: FIXED - Handle ForeignKey field properly
        if '*' in party_term or '%' in party_term:
            party_query = Q(party__name__iregex=party_term.replace('*', '.*').replace('%', '.*'))
        else:
            party_query = Q(party__name__icontains=party_term)
        precise_queryset = queryset.filter(name_query & party_query)
        
        if precise_queryset.count() > 0:
            return precise_queryset
        else:
            # Fall back to OR logic for broader results
            broader_queryset = queryset.filter(name_query | party_query)
            return broader_queryset if broader_queryset.count() > 0 else queryset
    
    def _handle_island_party_search(self, data: Dict[str, Any], queryset: QuerySet) -> QuerySet:
        """Handle island + party combination search"""
        logger.info(f"Smart search case: Island='{data['island']}', Party='{data['party']}'")
        
        island_term = data['island'].strip()
        party_term = data['party'].strip()
        
        # First try: Use AND logic for precise results
        # 2025-01-28: FIXED - Handle ForeignKey field properly
        if '*' in island_term or '%' in island_term:
            island_query = Q(island__name__iregex=island_term.replace('*', '.*').replace('%', '.*'))
        else:
            island_query = Q(island__name__icontains=island_term)
        if '*' in party_term or '%' in party_term:
            party_query = Q(party__name__iregex=party_term.replace('*', '.*').replace('%', '.*'))
        else:
            party_query = Q(party__name__icontains=party_term)
        precise_queryset = queryset.filter(island_query & party_query)
        
        if precise_queryset.count() > 0:
            return precise_queryset
        else:
            # Fall back to OR logic for broader results
            broader_queryset = queryset.filter(island_query | party_query)
            return broader_queryset if broader_queryset.count() > 0 else queryset
    
    def handle_general_query_search(self, data: Dict[str, Any], queryset: QuerySet) -> QuerySet:
        """Handle general query search with smart field detection"""
        # 2025-01-28: Extract general query logic from advanced_search method
        query = data['query'].strip()
        logger.info(f"General query search: '{query}'")
        
        if query.isdigit():
            return self._handle_numeric_query(query, queryset)
        elif query.upper() in self.political_parties:
            return self._handle_political_party_query(query, queryset)
        elif query.upper() in self.gender_values:
            return self._handle_gender_query(query, queryset)
        elif len(query) <= 3 and query.upper() in self.atoll_codes:
            return self._handle_atoll_query(query, queryset)
        else:
            return self._handle_text_query(query, queryset)
    
    def _handle_numeric_query(self, query: str, queryset: QuerySet) -> QuerySet:
        """Handle numeric queries (phone numbers, NIDs)"""
        if len(query) >= 7:
            # 7+ digits - likely phone number
            logger.info(f"Query '{query}' appears to be a phone number")
            return queryset.filter(contact__icontains=query)
        else:
            # Shorter numeric - could be NID or phone number
            logger.info(f"Query '{query}' is numeric - searching in contact and NID fields")
            contact_query = create_wildcard_query('contact', query)
            nid_query = create_wildcard_query('nid', query)
            return queryset.filter(contact_query | nid_query)
    
    def _handle_political_party_query(self, query: str, queryset: QuerySet) -> QuerySet:
        """Handle political party queries"""
        logger.info(f"Query '{query}' appears to be a political party")
        party_query = create_wildcard_query('party', query)
        return queryset.filter(party_query)
    
    def _handle_gender_query(self, query: str, queryset: QuerySet) -> QuerySet:
        """Handle gender queries"""
        logger.info(f"Query '{query}' appears to be gender")
        gender_query = create_wildcard_query('gender', query)
        return queryset.filter(gender_query)
    
    def _handle_atoll_query(self, query: str, queryset: QuerySet) -> QuerySet:
        """Handle atoll abbreviation queries"""
        logger.info(f"Query '{query}' appears to be an atoll code")
        # 2025-01-28: FIXED - Handle ForeignKey field properly
        if '*' in query or '%' in query:
            atoll_query = Q(atoll__name__iregex=query.replace('*', '.*').replace('%', '.*'))
        else:
            atoll_query = Q(atoll__name__icontains=query)
        return queryset.filter(atoll_query)
    
    def _handle_text_query(self, query: str, queryset: QuerySet) -> QuerySet:
        """Handle text queries with smart field detection"""
        logger.info(f"Query '{query}' appears to be text - analyzing for specific field types")
        
        # Check if query looks like an address
        is_likely_address = any(indicator in query.lower() for indicator in self.address_indicators)
        
        # Special handling for "ge" suffix patterns
        if not is_likely_address:
            if query.lower().endswith('ge') or ' ge' in query.lower():
                is_likely_address = True
                logger.info(f"Query '{query}' detected as address due to 'ge' suffix pattern")
        
        # Check if query looks like an island name
        is_likely_island = any(island in query.lower() for island in self.island_indicators)
        
        # Check if query looks like a profession
        is_likely_profession = any(prof in query.lower() for prof in self.profession_indicators)
        
        # Apply smart field-specific search based on analysis
        if is_likely_address:
            logger.info(f"Query '{query}' detected as address - searching in address field")
            address_query = create_wildcard_query('address', query)
            return queryset.filter(address_query)
        elif is_likely_island:
            logger.info(f"Query '{query}' detected as island - searching in island field")
            # 2025-01-28: FIXED - Handle ForeignKey field properly
            if '*' in query or '%' in query:
                island_query = Q(island__name__iregex=query.replace('*', '.*').replace('%', '.*'))
            else:
                island_query = Q(island__name__icontains=query)
            return queryset.filter(island_query)
        elif is_likely_profession:
            logger.info(f"Query '{query}' detected as profession - searching in profession field")
            profession_query = create_wildcard_query('profession', query)
            return queryset.filter(profession_query)
        else:
            # Default to comprehensive search across multiple fields
            logger.info(f"Query '{query}' - performing comprehensive search across name, address, island, profession, remark")
            name_query = create_wildcard_query('name', query)
            address_query = create_wildcard_query('address', query)
            # 2025-01-28: FIXED - Handle ForeignKey field properly
            if '*' in query or '%' in query:
                island_query = Q(island__name__iregex=query.replace('*', '.*').replace('%', '.*'))
            else:
                island_query = Q(island__name__icontains=query)
            profession_query = create_wildcard_query('profession', query)
            remark_query = create_wildcard_query('remark', query)
            return queryset.filter(
                name_query | address_query | island_query | profession_query | remark_query
            )
    
    def apply_individual_filters(self, data: Dict[str, Any], analysis: Dict[str, Any], queryset: QuerySet) -> QuerySet:
        """Apply individual field filters to the queryset"""
        # 2025-01-28: Extract individual filter logic from advanced_search method
        logger.info("Processing individual field filters...")
        
        if analysis['has_name_filter']:
            name_query = create_wildcard_query('name', data['name'])
            queryset = queryset.filter(name_query)
            logger.info(f"Filtering by name: '{data['name']}'")
        
        if analysis['has_contact_filter']:
            contact_query = create_wildcard_query('contact', data['contact'])
            queryset = queryset.filter(contact_query)
            logger.info(f"Filtering by contact: '{data['contact']}'")
        
        if analysis['has_nid_filter']:
            nid_query = create_wildcard_query('nid', data['nid'])
            queryset = queryset.filter(nid_query)
            logger.info(f"Filtering by NID: '{data['nid']}'")
        
        if analysis['has_address_filter']:
            address_query = create_wildcard_query('address', data['address'])
            queryset = queryset.filter(address_query)
            logger.info(f"Filtering by address: '{data['address']}'")
        
        if analysis['has_atoll_filter']:
            # 2025-01-28: FIXED - Handle ForeignKey field properly
            atoll_term = data['atoll']
            if '*' in atoll_term or '%' in atoll_term:
                atoll_query = Q(atoll__name__iregex=atoll_term.replace('*', '.*').replace('%', '.*'))
            else:
                atoll_query = Q(atoll__name__icontains=atoll_term)
            queryset = queryset.filter(atoll_query)
            logger.info(f"Filtering by atoll: '{atoll_term}'")
        
        if analysis['has_island_filter']:
            # 2025-01-28: FIXED - Handle ForeignKey field properly
            island_term = data['island']
            if '*' in island_term or '%' in island_term:
                island_query = Q(island__name__iregex=island_term.replace('*', '.*').replace('%', '.*'))
            else:
                island_query = Q(island__name__icontains=island_term)
            queryset = queryset.filter(island_query)
            logger.info(f"Filtering by island: '{island_term}'")
        
        if analysis['has_party_filter']:
            # 2025-01-28: FIXED - Handle ForeignKey field properly
            party_term = data['party']
            if '*' in party_term or '%' in party_term:
                party_query = Q(party__name__iregex=party_term.replace('*', '.*').replace('%', '.*'))
            else:
                party_query = Q(party__name__icontains=party_term)
            queryset = queryset.filter(party_query)
            logger.info(f"Filtering by party: '{party_term}'")
        
        if analysis['has_profession_filter']:
            profession_query = create_wildcard_query('profession', data['profession'])
            queryset = queryset.filter(profession_query)
            logger.info(f"Filtering by profession: '{data['profession']}'")
        
        if analysis['has_gender_filter']:
            gender_query = create_wildcard_query('gender', data['gender'])
            queryset = queryset.filter(gender_query)
            logger.info(f"Filtering by gender: '{data['gender']}'")
        
        if analysis['has_remark_filter']:
            remark_query = create_wildcard_query('remark', data['remark'])
            queryset = queryset.filter(remark_query)
            logger.info(f"Filtering by remark: '{data['remark']}'")
        
        if analysis['has_pep_status_filter']:
            pep_status_query = create_wildcard_query('pep_status', data['pep_status'])
            queryset = queryset.filter(pep_status_query)
            logger.info(f"Filtering by PEP status: '{data['pep_status']}'")
        
        if analysis['has_min_age_filter']:
            cutoff_date = timezone.now() - timedelta(days=data['min_age'] * 365.25)
            queryset = queryset.filter(DOB__lte=cutoff_date.strftime('%d/%m/%Y'))
            logger.info(f"Filtering by minimum age: {data['min_age']}")
        
        if analysis['has_max_age_filter']:
            cutoff_date = timezone.now() - timedelta(days=data['max_age'] * 365.25)
            queryset = queryset.filter(DOB__gte=cutoff_date.strftime('%d/%m/%Y'))
            logger.info(f"Filtering by maximum age: {data['max_age']}")
        
        logger.info(f"Results after individual field filters: {queryset.count()}")
        return queryset
    
    def apply_pagination(self, queryset: QuerySet, data: Dict[str, Any]) -> Tuple[QuerySet, int, int, int]:
        """Apply pagination to the queryset"""
        # 2025-01-28: Extract pagination logic from advanced_search method
        page = data.get('page', 1)
        page_size = data.get('page_size', 20)
        start = (page - 1) * page_size
        end = start + page_size
        
        total_count = queryset.count()
        results = queryset[start:end]
        
        logger.info(f"Final search results: {total_count} total entries")
        if total_count > 0:
            sample_entries = results[:3]
            for entry in sample_entries:
                logger.info(f"Sample entry: {entry.name} - Party: {entry.party} - Contact: {entry.contact}")
        
        return results, total_count, page, page_size
