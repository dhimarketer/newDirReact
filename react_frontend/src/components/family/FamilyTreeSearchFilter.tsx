// 2024-12-28: Family Tree Search and Filter Component
// Implements Phase 3 of Family Tree Enhancement Plan - Enhanced UX with Advanced Filtering
// Provides comprehensive search and filtering capabilities for the connected family graph

import React, { useState, useMemo, useCallback } from 'react';
import { GlobalPerson, GlobalRelationship } from '../../services/globalPersonRegistry';

interface FamilyTreeSearchFilterProps {
  persons: GlobalPerson[];
  relationships: GlobalRelationship[];
  onFilteredDataChange: (filteredPersons: GlobalPerson[], filteredRelationships: GlobalRelationship[]) => void;
  onPersonSelect: (person: GlobalPerson) => void;
  onRelationshipSelect: (relationship: GlobalRelationship) => void;
}

interface FilterState {
  searchTerm: string;
  selectedGender: string;
  selectedRelationshipType: string;
  ageRange: [number, number];
  showOnlyActive: boolean;
  selectedFamilyGroup: string;
  generationLevel: string;
  showOnlyConnected: boolean;
  sortBy: 'name' | 'age' | 'generation' | 'family';
  sortOrder: 'asc' | 'desc';
  highlightMatches: boolean;
  showStatistics: boolean;
}

const FamilyTreeSearchFilter: React.FC<FamilyTreeSearchFilterProps> = ({
  persons,
  relationships,
  onFilteredDataChange,
  onPersonSelect,
  onRelationshipSelect
}) => {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    selectedGender: 'all',
    selectedRelationshipType: 'all',
    ageRange: [0, 120],
    showOnlyActive: true,
    selectedFamilyGroup: 'all',
    generationLevel: 'all',
    showOnlyConnected: false,
    sortBy: 'name',
    sortOrder: 'asc',
    highlightMatches: true,
    showStatistics: true
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Get unique values for filter options with Phase 3 enhancements
  const filterOptions = useMemo(() => {
    const genders = [...new Set(persons.map(p => p.gender).filter(Boolean))];
    const relationshipTypes = [...new Set(relationships.map(r => r.relationship_type))];
    const familyGroups = [...new Set(relationships.map(r => r.family_group_name).filter(Boolean))];
    
    // Calculate generation levels (simplified - based on age ranges)
    const generationLevels = [
      { value: 'elder', label: 'Elders (70+)', minAge: 70, maxAge: 120 },
      { value: 'adult', label: 'Adults (30-69)', minAge: 30, maxAge: 69 },
      { value: 'young', label: 'Young Adults (18-29)', minAge: 18, maxAge: 29 },
      { value: 'child', label: 'Children (0-17)', minAge: 0, maxAge: 17 }
    ];
    
    return {
      genders,
      relationshipTypes,
      familyGroups,
      generationLevels
    };
  }, [persons, relationships]);

  // Apply enhanced filters to data with Phase 3 features
  const filteredData = useMemo(() => {
    let filteredPersons = persons;
    let filteredRelationships = relationships;

    // Search term filter with highlighting
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredPersons = filteredPersons.filter(person => 
        person.name.toLowerCase().includes(searchLower) ||
        person.address?.toLowerCase().includes(searchLower) ||
        person.island?.toLowerCase().includes(searchLower) ||
        person.contact?.toLowerCase().includes(searchLower)
      );
    }

    // Gender filter
    if (filters.selectedGender !== 'all') {
      filteredPersons = filteredPersons.filter(person => 
        person.gender === filters.selectedGender
      );
    }

    // Age range filter
    filteredPersons = filteredPersons.filter(person => {
      if (!person.age) return true;
      return person.age >= filters.ageRange[0] && person.age <= filters.ageRange[1];
    });

    // Generation level filter
    if (filters.generationLevel !== 'all') {
      const level = filterOptions.generationLevels.find(l => l.value === filters.generationLevel);
      if (level) {
        filteredPersons = filteredPersons.filter(person => {
          if (!person.age) return true;
          return person.age >= level.minAge && person.age <= level.maxAge;
        });
      }
    }

    // Active status filter
    if (filters.showOnlyActive) {
      filteredPersons = filteredPersons.filter(person => 
        person.is_active !== false
      );
    }

    // Connected persons filter
    if (filters.showOnlyConnected) {
      const connectedPids = new Set(
        relationships.flatMap(rel => [rel.person1_pid, rel.person2_pid])
      );
      filteredPersons = filteredPersons.filter(person => 
        connectedPids.has(person.pid)
      );
    }

    // Family group filter
    if (filters.selectedFamilyGroup !== 'all') {
      const familyGroupPids = new Set(
        relationships
          .filter(rel => rel.family_group_name === filters.selectedFamilyGroup)
          .flatMap(rel => [rel.person1_pid, rel.person2_pid])
      );
      filteredPersons = filteredPersons.filter(person => 
        familyGroupPids.has(person.pid)
      );
    }

    // Filter relationships based on filtered persons
    const filteredPersonPids = new Set(filteredPersons.map(p => p.pid));
    filteredRelationships = filteredRelationships.filter(rel => 
      filteredPersonPids.has(rel.person1_pid) && 
      filteredPersonPids.has(rel.person2_pid)
    );

    // Relationship type filter
    if (filters.selectedRelationshipType !== 'all') {
      filteredRelationships = filteredRelationships.filter(rel => 
        rel.relationship_type === filters.selectedRelationshipType
      );
    }

    // Sort filtered persons
    filteredPersons.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'age':
          comparison = (a.age || 0) - (b.age || 0);
          break;
        case 'generation':
          // Sort by age (reverse for generation - older first)
          comparison = (b.age || 0) - (a.age || 0);
          break;
        case 'family':
          const aFamily = relationships.find(r => r.person1_pid === a.pid || r.person2_pid === a.pid)?.family_group_name || '';
          const bFamily = relationships.find(r => r.person1_pid === b.pid || r.person2_pid === b.pid)?.family_group_name || '';
          comparison = aFamily.localeCompare(bFamily);
          break;
      }
      
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return {
      persons: filteredPersons,
      relationships: filteredRelationships
    };
  }, [persons, relationships, filters, filterOptions.generationLevels]);

  // Update parent component when filtered data changes
  React.useEffect(() => {
    onFilteredDataChange(filteredData.persons, filteredData.relationships);
  }, [filteredData, onFilteredDataChange]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      selectedGender: 'all',
      selectedRelationshipType: 'all',
      ageRange: [0, 120],
      showOnlyActive: true,
      selectedFamilyGroup: 'all',
      generationLevel: 'all',
      showOnlyConnected: false,
      sortBy: 'name',
      sortOrder: 'asc',
      highlightMatches: true,
      showStatistics: true
    });
  }, []);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalPersons = persons.length;
    const totalRelationships = relationships.length;
    const filteredPersons = filteredData.persons.length;
    const filteredRelationships = filteredData.relationships.length;
    
    const genderStats = persons.reduce((acc, person) => {
      const gender = person.gender || 'Unknown';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const ageStats = persons.reduce((acc, person) => {
      if (person.age) {
        if (person.age < 18) acc.children++;
        else if (person.age < 30) acc.youngAdults++;
        else if (person.age < 50) acc.adults++;
        else if (person.age < 70) acc.middleAged++;
        else acc.elderly++;
      }
      return acc;
    }, { children: 0, youngAdults: 0, adults: 0, middleAged: 0, elderly: 0 });
    
    const relationshipStats = relationships.reduce((acc, rel) => {
      acc[rel.relationship_type] = (acc[rel.relationship_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalPersons,
      totalRelationships,
      filteredPersons,
      filteredRelationships,
      genderStats,
      ageStats,
      relationshipStats
    };
  }, [persons, relationships, filteredData]);

  // Get person by PID for selection
  const getPersonByPid = useCallback((pid: number) => {
    return persons.find(p => p.pid === pid);
  }, [persons]);

  return (
    <div className="family-tree-search-filter" data-testid="search-filter">
      <div className="search-header">
        <h3>Search & Filter</h3>
        <button 
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="toggle-advanced"
        >
          {showAdvancedFilters ? 'Hide' : 'Show'} Advanced
        </button>
      </div>

      {/* Basic Search */}
      <div className="search-section">
        <div className="search-input-group">
          <input
            type="text"
            placeholder="Search by name, address, or island..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="search-input"
          />
          <button 
            onClick={clearFilters}
            className="clear-button"
            title="Clear all filters"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="advanced-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Gender:</label>
              <select
                value={filters.selectedGender}
                onChange={(e) => handleFilterChange('selectedGender', e.target.value)}
                className="filter-select"
              >
                <option value="all">All Genders</option>
                {filterOptions.genders.map(gender => (
                  <option key={gender} value={gender}>{gender}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Relationship Type:</label>
              <select
                value={filters.selectedRelationshipType}
                onChange={(e) => handleFilterChange('selectedRelationshipType', e.target.value)}
                className="filter-select"
              >
                <option value="all">All Relationships</option>
                {filterOptions.relationshipTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>Age Range:</label>
              <div className="age-range">
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={filters.ageRange[0]}
                  onChange={(e) => handleFilterChange('ageRange', [parseInt(e.target.value) || 0, filters.ageRange[1]])}
                  className="age-input"
                />
                <span>to</span>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={filters.ageRange[1]}
                  onChange={(e) => handleFilterChange('ageRange', [filters.ageRange[0], parseInt(e.target.value) || 120])}
                  className="age-input"
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Family Group:</label>
              <select
                value={filters.selectedFamilyGroup}
                onChange={(e) => handleFilterChange('selectedFamilyGroup', e.target.value)}
                className="filter-select"
              >
                <option value="all">All Families</option>
                {filterOptions.familyGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>Generation Level:</label>
              <select
                value={filters.generationLevel}
                onChange={(e) => handleFilterChange('generationLevel', e.target.value)}
                className="filter-select"
              >
                <option value="all">All Generations</option>
                {filterOptions.generationLevels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Sort By:</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="filter-select"
              >
                <option value="name">Name</option>
                <option value="age">Age</option>
                <option value="generation">Generation</option>
                <option value="family">Family</option>
              </select>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>Sort Order:</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="filter-select"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          <div className="filter-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.showOnlyActive}
                onChange={(e) => handleFilterChange('showOnlyActive', e.target.checked)}
              />
              Show only active persons
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.showOnlyConnected}
                onChange={(e) => handleFilterChange('showOnlyConnected', e.target.checked)}
              />
              Show only connected persons
            </label>
          </div>

          <div className="filter-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.highlightMatches}
                onChange={(e) => handleFilterChange('highlightMatches', e.target.checked)}
              />
              Highlight search matches
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.showStatistics}
                onChange={(e) => handleFilterChange('showStatistics', e.target.checked)}
              />
              Show statistics
            </label>
          </div>
        </div>
      )}

      {/* Enhanced Results Summary with Statistics */}
      <div className="results-summary">
        <div className="summary-main">
          <p>
            Showing <strong>{filteredData.persons.length}</strong> of <strong>{persons.length}</strong> persons
            {filteredData.relationships.length !== relationships.length && 
              `, <strong>${filteredData.relationships.length}</strong> of <strong>${relationships.length}</strong> relationships`
            }
          </p>
        </div>
        
        {filters.showStatistics && (
          <div className="statistics-panel">
            <div className="stat-group">
              <h4>Gender Distribution</h4>
              <div className="stat-bars">
                {Object.entries(statistics.genderStats).map(([gender, count]) => (
                  <div key={gender} className="stat-bar">
                    <span className="stat-label">{gender}:</span>
                    <div className="stat-bar-fill" style={{ width: `${(count / statistics.totalPersons) * 100}%` }}></div>
                    <span className="stat-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="stat-group">
              <h4>Age Groups</h4>
              <div className="stat-grid">
                <div className="stat-item">Children: {statistics.ageStats.children}</div>
                <div className="stat-item">Young Adults: {statistics.ageStats.youngAdults}</div>
                <div className="stat-item">Adults: {statistics.ageStats.adults}</div>
                <div className="stat-item">Middle-aged: {statistics.ageStats.middleAged}</div>
                <div className="stat-item">Elderly: {statistics.ageStats.elderly}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button 
          onClick={() => {
            const randomPerson = filteredData.persons[Math.floor(Math.random() * filteredData.persons.length)];
            if (randomPerson) onPersonSelect(randomPerson);
          }}
          className="action-button"
          disabled={filteredData.persons.length === 0}
        >
          🎲 Random Person
        </button>
        
        <button 
          onClick={() => {
            const oldestPerson = filteredData.persons.reduce((oldest, person) => 
              (!oldest.age || (person.age && person.age > oldest.age)) ? person : oldest
            );
            if (oldestPerson) onPersonSelect(oldestPerson);
          }}
          className="action-button"
          disabled={filteredData.persons.length === 0}
        >
          👴 Oldest Person
        </button>
      </div>

      <style jsx>{`
        .family-tree-search-filter {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .search-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .search-header h3 {
          margin: 0;
          font-size: 16px;
          color: #374151;
        }
        .toggle-advanced {
          padding: 4px 8px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .toggle-advanced:hover {
          background: #2563eb;
        }
        .search-section {
          margin-bottom: 16px;
        }
        .search-input-group {
          display: flex;
          gap: 8px;
        }
        .search-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
        }
        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 1px #3b82f6;
        }
        .clear-button {
          padding: 8px 12px;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .clear-button:hover {
          background: #4b5563;
        }
        .advanced-filters {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .filter-row {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
        }
        .filter-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .filter-group label {
          font-size: 12px;
          font-weight: 500;
          color: #374151;
        }
        .filter-select {
          padding: 6px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 12px;
        }
        .age-range {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .age-input {
          width: 60px;
          padding: 4px 6px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 12px;
          text-align: center;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #374151;
          cursor: pointer;
        }
        .results-summary {
          margin-bottom: 12px;
        }
        .results-summary p {
          margin: 0;
          font-size: 12px;
          color: #6b7280;
        }
        .quick-actions {
          display: flex;
          gap: 8px;
        }
        .action-button {
          padding: 6px 12px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .action-button:hover:not(:disabled) {
          background: #059669;
        }
        .action-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        .summary-main p {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: #374151;
        }
        .summary-main strong {
          color: #1f2937;
          font-weight: 600;
        }
        .statistics-panel {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px;
          margin-top: 8px;
        }
        .stat-group {
          margin-bottom: 16px;
        }
        .stat-group:last-child {
          margin-bottom: 0;
        }
        .stat-group h4 {
          margin: 0 0 8px 0;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stat-bars {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stat-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
        }
        .stat-label {
          min-width: 60px;
          color: #6b7280;
          font-weight: 500;
        }
        .stat-bar-fill {
          height: 8px;
          background: #3b82f6;
          border-radius: 4px;
          min-width: 20px;
        }
        .stat-count {
          color: #374151;
          font-weight: 600;
          min-width: 20px;
          text-align: right;
        }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 6px;
        }
        .stat-item {
          background: white;
          padding: 6px 8px;
          border-radius: 4px;
          font-size: 11px;
          color: #374151;
          border: 1px solid #e5e7eb;
          text-align: center;
        }
        
        /* Responsive Design - Phase 3 */
        @media (max-width: 768px) {
          .family-tree-search-filter {
            padding: 12px;
          }
          .search-header {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }
          .filter-row {
            flex-direction: column;
            gap: 8px;
          }
          .filter-group {
            width: 100%;
          }
          .search-input-group {
            flex-direction: column;
          }
          .quick-actions {
            flex-direction: column;
            gap: 6px;
          }
          .stat-grid {
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          }
        }
        
        @media (max-width: 480px) {
          .family-tree-search-filter {
            padding: 8px;
          }
          .search-header h3 {
            font-size: 14px;
          }
          .toggle-advanced {
            font-size: 10px;
            padding: 3px 6px;
          }
          .filter-select,
          .search-input {
            font-size: 12px;
          }
          .stat-group h4 {
            font-size: 10px;
          }
          .stat-bar {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default FamilyTreeSearchFilter;
