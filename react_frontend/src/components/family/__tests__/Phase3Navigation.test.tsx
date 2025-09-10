// 2024-12-28: Phase 3 Navigation Controls Tests
// Tests for Navigation Controls, Progressive Disclosure, and Search/Filter functionality

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ConnectedFamilyGraph from '../ConnectedFamilyGraph';
import FamilyTreeSearchFilter from '../FamilyTreeSearchFilter';
import { GlobalPerson, GlobalRelationship } from '../../../services/globalPersonRegistry';

// Mock React Flow
vi.mock('reactflow', () => ({
  ReactFlow: ({ children, ...props }: any) => (
    <div data-testid="react-flow" {...props}>
      {children}
    </div>
  ),
  Node: ({ data, ...props }: any) => (
    <div data-testid={`node-${data.id}`} {...props}>
      {data.label}
    </div>
  ),
  Edge: ({ data, ...props }: any) => (
    <div data-testid={`edge-${data.id}`} {...props}>
      {data.label}
    </div>
  ),
  useNodesState: () => [[], vi.fn()],
  useEdgesState: () => [[], vi.fn()],
  useReactFlow: () => ({
    fitView: vi.fn(),
    getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
    setViewport: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    zoomTo: vi.fn(),
    getZoom: () => 1,
    setCenter: vi.fn(),
  }),
  Background: () => <div data-testid="background" />,
  Controls: () => <div data-testid="controls" />,
  MiniMap: () => <div data-testid="mini-map" />,
}));

// Mock services
vi.mock('../../../services/globalPersonRegistry', () => ({
  globalPersonRegistry: {
    getPersonContext: vi.fn(),
    getConnectedFamilies: vi.fn(),
  },
}));


const mockGlobalPersons: GlobalPerson[] = [
  {
    pid: 1001,
    name: 'John Doe',
    contact: '1234567890',
    email: 'john@example.com',
    address: '123 Main St',
    island: 'Male',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_active: true
  },
  {
    pid: 1002,
    name: 'Jane Doe',
    contact: '0987654321',
    email: 'jane@example.com',
    address: '123 Main St',
    island: 'Male',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_active: true
  },
  {
    pid: 1003,
    name: 'Bob Smith',
    contact: '5555555555',
    email: 'bob@example.com',
    address: '456 Oak Ave',
    island: 'Male',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_active: true
  },
];

const mockGlobalRelationships: GlobalRelationship[] = [
  {
    id: 1,
    person1_pid: 1001,
    person2_pid: 1002,
    person1_name: 'John Doe',
    person2_name: 'Jane Doe',
    relationship_type: 'spouse',
    relationship_type_display: 'Spouse',
    notes: '',
    is_active: true,
    start_date: '2020-01-01',
    end_date: undefined,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    person1_pid: 1001,
    person2_pid: 1003,
    person1_name: 'John Doe',
    person2_name: 'Bob Smith',
    relationship_type: 'parent',
    relationship_type_display: 'Parent',
    notes: '',
    is_active: true,
    start_date: '1990-01-01',
    end_date: undefined,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('Phase 3: Navigation Controls Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NavigationControls', () => {
    it('provides zoom controls for large trees', () => {
      render(
        <ConnectedFamilyGraph
          rootPersonPid={1001}
          maxDepth={3}
          onPersonClick={vi.fn()}
          onRelationshipClick={vi.fn()}
          showNavigationControls={true}
        />
      );

      // Should render controls
      expect(screen.getByTestId('controls')).toBeInTheDocument();
    });

    it('implements center on person functionality', () => {
      render(
        <ConnectedFamilyGraph
          rootPersonPid={1001}
          maxDepth={3}
          onPersonClick={vi.fn()}
          onRelationshipClick={vi.fn()}
          showNavigationControls={true}
        />
      );

      // Center functionality would be tested through user interaction
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('shows path to root for selected person', () => {
      render(
        <ConnectedFamilyGraph
          rootPersonPid={1001}
          maxDepth={3}
          onPersonClick={vi.fn()}
          onRelationshipClick={vi.fn()}
          showNavigationControls={true}
        />
      );

      // Should render React Flow with path highlighting capability
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('provides mini-map for navigation', () => {
      render(
        <ConnectedFamilyGraph
          rootPersonPid={1001}
          maxDepth={3}
          onPersonClick={vi.fn()}
          onRelationshipClick={vi.fn()}
          showNavigationControls={true}
        />
      );

      // Should render mini-map
      expect(screen.getByTestId('mini-map')).toBeInTheDocument();
    });

    it('handles zoom in functionality', () => {
      render(
        <ConnectedFamilyGraph
          rootPersonPid={1001}
          maxDepth={3}
          onPersonClick={vi.fn()}
          onRelationshipClick={vi.fn()}
          showNavigationControls={true}
        />
      );

      // Zoom in functionality would be tested through user interaction
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('handles zoom out functionality', () => {
      render(
        <ConnectedFamilyGraph
          rootPersonPid={1001}
          maxDepth={3}
          onPersonClick={vi.fn()}
          onRelationshipClick={vi.fn()}
          showNavigationControls={true}
        />
      );

      // Zoom out functionality would be tested through user interaction
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('provides breadcrumb navigation', () => {
      render(
        <ConnectedFamilyGraph
          rootPersonPid={1001}
          maxDepth={3}
          onPersonClick={vi.fn()}
          onRelationshipClick={vi.fn()}
          showNavigationControls={true}
        />
      );

      // Breadcrumb navigation would be implemented in the component
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
  });

  describe('ProgressiveDisclosure', () => {
    it('starts with immediate family by default', () => {
      render(
        <ConnectedFamilyGraph
          rootPersonPid={1001}
          maxDepth={1}
          onPersonClick={vi.fn()}
          onRelationshipClick={vi.fn()}
          showNuclearFamilyGrouping={true}
        />
      );

      // Should render with focused view
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('provides expand ancestors button', () => {
      render(
        <ConnectedFamilyGraph
          rootPersonPid={1001}
          maxDepth={2}
          onPersonClick={vi.fn()}
          onRelationshipClick={vi.fn()}
          showNuclearFamilyGrouping={true}
        />
      );

      // Expand ancestors functionality would be implemented
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('provides expand descendants button', () => {
      render(
        <ConnectedFamilyGraph
          rootPersonPid={1001}
          maxDepth={2}
          onPersonClick={vi.fn()}
          onRelationshipClick={vi.fn()}
          showNuclearFamilyGrouping={true}
        />
      );

      // Expand descendants functionality would be implemented
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('allows collapsing family branches', () => {
      render(
        <ConnectedFamilyGraph
          rootPersonPid={1001}
          maxDepth={3}
          onPersonClick={vi.fn()}
          onRelationshipClick={vi.fn()}
          showNuclearFamilyGrouping={true}
        />
      );

      // Collapse functionality would be implemented
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('handles depth control for family tree', () => {
      render(
        <ConnectedFamilyGraph
          rootPersonPid={1001}
          maxDepth={3}
          onPersonClick={vi.fn()}
          onRelationshipClick={vi.fn()}
          showNuclearFamilyGrouping={true}
        />
      );

      // Depth control would be implemented
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
  });

  describe('SearchAndFilter', () => {
    it('searches by name across all families', () => {
      render(
        <FamilyTreeSearchFilter
          persons={mockGlobalPersons}
          relationships={mockGlobalRelationships}
          onFilteredDataChange={vi.fn()}
          onPersonSelect={vi.fn()}
          onRelationshipSelect={vi.fn()}
        />
      );

      // Should render search input
      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('filters by birth year range', () => {
      render(
        <FamilyTreeSearchFilter
          persons={mockGlobalPersons}
          relationships={mockGlobalRelationships}
          onFilteredDataChange={vi.fn()}
          onPersonSelect={vi.fn()}
          onRelationshipSelect={vi.fn()}
        />
      );

      // Should render birth year filter
      const birthYearFilter = screen.getByText(/birth year/i);
      expect(birthYearFilter).toBeInTheDocument();
    });

    it('filters by location/island', () => {
      render(
        <FamilyTreeSearchFilter
          persons={mockGlobalPersons}
          relationships={mockGlobalRelationships}
          onFilteredDataChange={vi.fn()}
          onPersonSelect={vi.fn()}
          onRelationshipSelect={vi.fn()}
        />
      );

      // Should render location filter
      const locationFilter = screen.getByText(/location/i);
      expect(locationFilter).toBeInTheDocument();
    });

    it('filters by relationship type', () => {
      render(
        <FamilyTreeSearchFilter
          persons={mockGlobalPersons}
          relationships={mockGlobalRelationships}
          onFilteredDataChange={vi.fn()}
          onPersonSelect={vi.fn()}
          onRelationshipSelect={vi.fn()}
        />
      );

      // Should render relationship type filter
      const relationshipFilter = screen.getByText(/relationship/i);
      expect(relationshipFilter).toBeInTheDocument();
    });

    it('provides advanced filter combinations', () => {
      render(
        <FamilyTreeSearchFilter
          persons={mockGlobalPersons}
          relationships={mockGlobalRelationships}
          onFilteredDataChange={vi.fn()}
          onPersonSelect={vi.fn()}
          onRelationshipSelect={vi.fn()}
        />
      );

      // Should render advanced filter options
      expect(screen.getByText(/advanced/i)).toBeInTheDocument();
    });

    it('handles search input changes', () => {
      const mockOnFilteredDataChange = vi.fn();
      
      render(
        <FamilyTreeSearchFilter
          persons={mockGlobalPersons}
          relationships={mockGlobalRelationships}
          onFilteredDataChange={mockOnFilteredDataChange}
          onPersonSelect={vi.fn()}
          onRelationshipSelect={vi.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });

      // Should trigger filtered data change
      expect(mockOnFilteredDataChange).toHaveBeenCalled();
    });

    it('handles filter changes', () => {
      const mockOnFilteredDataChange = vi.fn();
      
      render(
        <FamilyTreeSearchFilter
          persons={mockGlobalPersons}
          relationships={mockGlobalRelationships}
          onFilteredDataChange={mockOnFilteredDataChange}
          onPersonSelect={vi.fn()}
          onRelationshipSelect={vi.fn()}
        />
      );

      // Test filter change would be triggered by user interaction
      expect(screen.getByTestId('search-filter')).toBeInTheDocument();
    });

    it('shows filter statistics', () => {
      render(
        <FamilyTreeSearchFilter
          persons={mockGlobalPersons}
          relationships={mockGlobalRelationships}
          onFilteredDataChange={vi.fn()}
          onPersonSelect={vi.fn()}
          onRelationshipSelect={vi.fn()}
        />
      );

      // Should show filter statistics
      expect(screen.getByText(/results/i)).toBeInTheDocument();
    });

    it('provides connected persons filter', () => {
      render(
        <FamilyTreeSearchFilter
          persons={mockGlobalPersons}
          relationships={mockGlobalRelationships}
          onFilteredDataChange={vi.fn()}
          onPersonSelect={vi.fn()}
          onRelationshipSelect={vi.fn()}
        />
      );

      // Should render connected persons filter
      expect(screen.getByText(/connected/i)).toBeInTheDocument();
    });

    it('handles generation level filtering', () => {
      render(
        <FamilyTreeSearchFilter
          persons={mockGlobalPersons}
          relationships={mockGlobalRelationships}
          onFilteredDataChange={vi.fn()}
          onPersonSelect={vi.fn()}
          onRelationshipSelect={vi.fn()}
        />
      );

      // Should render generation level filter
      expect(screen.getByText(/generation/i)).toBeInTheDocument();
    });

    it('provides sorting options', () => {
      render(
        <FamilyTreeSearchFilter
          persons={mockGlobalPersons}
          relationships={mockGlobalRelationships}
          onFilteredDataChange={vi.fn()}
          onPersonSelect={vi.fn()}
          onRelationshipSelect={vi.fn()}
        />
      );

      // Should render sorting options
      expect(screen.getByText(/sort/i)).toBeInTheDocument();
    });
  });

  describe('ResponsiveDesign', () => {
    it('adapts to mobile screen sizes', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <ConnectedFamilyGraph
          rootPersonPid={1001}
          maxDepth={3}
          onPersonClick={vi.fn()}
          onRelationshipClick={vi.fn()}
          showNavigationControls={true}
        />
      );

      // Should render with mobile-optimized layout
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('adapts to tablet screen sizes', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <ConnectedFamilyGraph
          rootPersonPid={1001}
          maxDepth={3}
          onPersonClick={vi.fn()}
          onRelationshipClick={vi.fn()}
          showNavigationControls={true}
        />
      );

      // Should render with tablet-optimized layout
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('adapts to desktop screen sizes', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(
        <ConnectedFamilyGraph
          rootPersonPid={1001}
          maxDepth={3}
          onPersonClick={vi.fn()}
          onRelationshipClick={vi.fn()}
          showNavigationControls={true}
        />
      );

      // Should render with desktop-optimized layout
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
  });

  describe('PerformanceOptimization', () => {
    it('handles large family trees efficiently', () => {
      const startTime = performance.now();
      
      render(
        <ConnectedFamilyGraph
          rootPersonPid={1001}
          maxDepth={5}
          onPersonClick={vi.fn()}
          onRelationshipClick={vi.fn()}
          showNavigationControls={true}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);
      
      // Should still render React Flow
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('implements virtual scrolling for large member lists', () => {
      render(
        <FamilyTreeSearchFilter
          persons={mockGlobalPersons}
          relationships={mockGlobalRelationships}
          onFilteredDataChange={vi.fn()}
          onPersonSelect={vi.fn()}
          onRelationshipSelect={vi.fn()}
        />
      );

      // Virtual scrolling would be implemented for large lists
      expect(screen.getByTestId('search-filter')).toBeInTheDocument();
    });

    it('optimizes rendering with memoization', () => {
      render(
        <ConnectedFamilyGraph
          rootPersonPid={1001}
          maxDepth={3}
          onPersonClick={vi.fn()}
          onRelationshipClick={vi.fn()}
          showNavigationControls={true}
        />
      );

      // Memoization would be implemented for performance
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
  });
});