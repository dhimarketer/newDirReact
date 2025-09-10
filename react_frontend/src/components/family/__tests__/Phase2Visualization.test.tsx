// 2024-12-28: Phase 2 Visualization Enhancement Tests
// Tests for Connected Family Graph, Dagre Layout, and Visual Grouping

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ConnectedFamilyGraph from '../ConnectedFamilyGraph';
import { FamilyMember, FamilyRelationship, FamilyGroup } from '../../../types/family';

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
  }),
  Background: () => <div data-testid="background" />,
  Controls: () => <div data-testid="controls" />,
  MiniMap: () => <div data-testid="mini-map" />,
}));

// Mock Dagre
vi.mock('dagre', () => ({
  default: {
    layout: vi.fn((graph) => {
      // Mock Dagre layout - return nodes with positions
      return {
        nodes: graph.nodes.map((node: any) => ({
          ...node,
          x: Math.random() * 1000,
          y: Math.random() * 1000,
        })),
        edges: graph.edges,
      };
    }),
  },
}));

// Mock services
vi.mock('../../../services/globalPersonRegistry', () => ({
  globalPersonRegistry: {
    getPersonContext: vi.fn(),
    getConnectedFamilies: vi.fn(),
  },
}));

const mockFamilyGroups: FamilyGroup[] = [
  {
    id: 1,
    name: 'Doe Family',
    description: 'Main family',
    address: '123 Main St',
    island: 'Male',
    is_public: true,
    created_by: 1,
    members: [],
    relationships: [],
    privacy_settings: {
      who_can_view: 'public',
      who_can_edit: 'members',
      who_can_add_members: 'members',
      who_can_remove_members: 'admins',
      who_can_see_contact_info: 'public',
      who_can_see_personal_notes: 'members',
    },
    tags: [],
    member_count: 3,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Smith Family',
    description: 'Extended family',
    address: '456 Oak Ave',
    island: 'Male',
    is_public: true,
    created_by: 1,
    members: [],
    relationships: [],
    privacy_settings: {
      who_can_view: 'public',
      who_can_edit: 'members',
      who_can_add_members: 'members',
      who_can_remove_members: 'admins',
      who_can_see_contact_info: 'public',
      who_can_see_personal_notes: 'members',
    },
    tags: [],
    member_count: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockFamilyMembers: FamilyMember[] = [
  {
    id: 1,
    user: 1,
    family_group: 1,
    role: { id: 1, name: 'father', description: 'Father', permissions: [] },
    relationship: 'parent',
    is_admin: true,
    joined_date: '2024-01-01T00:00:00Z',
    profile_picture: '',
    notes: '',
    entry: {
      pid: 1001,
      name: 'John Doe',
      contact: '1234567890',
      email: 'john@example.com',
      address: '123 Main St',
      island: 'Male',
      notes: '',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    role_in_family: 'father',
  },
  {
    id: 2,
    user: 2,
    family_group: 1,
    role: { id: 2, name: 'mother', description: 'Mother', permissions: [] },
    relationship: 'parent',
    is_admin: true,
    joined_date: '2024-01-01T00:00:00Z',
    profile_picture: '',
    notes: '',
    entry: {
      pid: 1002,
      name: 'Jane Doe',
      contact: '0987654321',
      email: 'jane@example.com',
      address: '123 Main St',
      island: 'Male',
      notes: '',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    role_in_family: 'mother',
  },
  {
    id: 3,
    user: 3,
    family_group: 2,
    role: { id: 3, name: 'father', description: 'Father', permissions: [] },
    relationship: 'parent',
    is_admin: true,
    joined_date: '2024-01-01T00:00:00Z',
    profile_picture: '',
    notes: '',
    entry: {
      pid: 1003,
      name: 'Bob Smith',
      contact: '5555555555',
      email: 'bob@example.com',
      address: '456 Oak Ave',
      island: 'Male',
      notes: '',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    role_in_family: 'father',
  },
];

const mockFamilyRelationships: FamilyRelationship[] = [
  {
    id: 1,
    person1: 1001,
    person2: 1002,
    person1_name: 'John Doe',
    person2_name: 'Jane Doe',
    relationship_type: 'spouse',
    relationship_type_display: 'Spouse',
    family_group: 1,
    notes: '',
    is_active: true,
    start_date: '2020-01-01',
    end_date: undefined,
    relationship_status: 'active',
    is_biological: true,
    is_legal: true,
    confidence_level: 100,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    person1: 1001,
    person2: 1003,
    person1_name: 'John Doe',
    person2_name: 'Bob Smith',
    relationship_type: 'parent',
    relationship_type_display: 'Parent',
    family_group: 1,
    notes: '',
    is_active: true,
    start_date: '1990-01-01',
    end_date: undefined,
    relationship_status: 'active',
    is_biological: true,
    is_legal: true,
    confidence_level: 100,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('Phase 2: Visualization Enhancement Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ConnectedFamilyGraph', () => {
    it('renders all connected families in single React Flow instance', () => {
      render(
        <ConnectedFamilyGraph
          familyGroups={mockFamilyGroups}
          familyMembers={mockFamilyMembers}
          familyRelationships={mockFamilyRelationships}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      // Should render React Flow
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      
      // Should render nodes for all family members
      expect(screen.getByTestId('node-1001')).toBeInTheDocument();
      expect(screen.getByTestId('node-1002')).toBeInTheDocument();
      expect(screen.getByTestId('node-1003')).toBeInTheDocument();
    });

    it('uses Dagre layout for entire connected graph', () => {
      const { dagre } = require('dagre');
      
      render(
        <ConnectedFamilyGraph
          familyGroups={mockFamilyGroups}
          familyMembers={mockFamilyMembers}
          familyRelationships={mockFamilyRelationships}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      // Dagre should be called for layout
      expect(dagre.default.layout).toHaveBeenCalled();
    });

    it('shows visual grouping for nuclear families', () => {
      render(
        <ConnectedFamilyGraph
          familyGroups={mockFamilyGroups}
          familyMembers={mockFamilyMembers}
          familyRelationships={mockFamilyRelationships}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      // Should render background for visual grouping
      expect(screen.getByTestId('background')).toBeInTheDocument();
    });

    it('handles cross-family relationships correctly', () => {
      render(
        <ConnectedFamilyGraph
          familyGroups={mockFamilyGroups}
          familyMembers={mockFamilyMembers}
          familyRelationships={mockFamilyRelationships}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      // Should render edges for cross-family relationships
      expect(screen.getByTestId('edge-1')).toBeInTheDocument();
      expect(screen.getByTestId('edge-2')).toBeInTheDocument();
    });

    it('provides navigation controls', () => {
      render(
        <ConnectedFamilyGraph
          familyGroups={mockFamilyGroups}
          familyMembers={mockFamilyMembers}
          familyRelationships={mockFamilyRelationships}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      // Should render controls
      expect(screen.getByTestId('controls')).toBeInTheDocument();
      
      // Should render mini-map
      expect(screen.getByTestId('mini-map')).toBeInTheDocument();
    });

    it('handles empty data gracefully', () => {
      render(
        <ConnectedFamilyGraph
          familyGroups={[]}
          familyMembers={[]}
          familyRelationships={[]}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      // Should still render React Flow
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('handles large connected graphs efficiently', () => {
      // Create large dataset
      const largeFamilyGroups = Array.from({ length: 10 }, (_, i) => ({
        ...mockFamilyGroups[0],
        id: i + 1,
        name: `Family ${i + 1}`,
      }));

      const largeFamilyMembers = Array.from({ length: 50 }, (_, i) => ({
        ...mockFamilyMembers[0],
        id: i + 1,
        entry: {
          ...mockFamilyMembers[0].entry!,
          pid: 1000 + i,
          name: `Person ${i + 1}`,
        },
      }));

      const largeFamilyRelationships = Array.from({ length: 30 }, (_, i) => ({
        ...mockFamilyRelationships[0],
        id: i + 1,
        person1: 1000 + i,
        person2: 1000 + (i + 1) % 50,
      }));

      const startTime = performance.now();
      
      render(
        <ConnectedFamilyGraph
          familyGroups={largeFamilyGroups}
          familyMembers={largeFamilyMembers}
          familyRelationships={largeFamilyRelationships}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);
      
      // Should still render React Flow
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('calls onNodeClick when node is clicked', () => {
      const mockOnNodeClick = vi.fn();
      
      render(
        <ConnectedFamilyGraph
          familyGroups={mockFamilyGroups}
          familyMembers={mockFamilyMembers}
          familyRelationships={mockFamilyRelationships}
          onNodeClick={mockOnNodeClick}
          onEdgeClick={vi.fn()}
        />
      );

      // Click on a node
      const node = screen.getByTestId('node-1001');
      fireEvent.click(node);

      expect(mockOnNodeClick).toHaveBeenCalled();
    });

    it('calls onEdgeClick when edge is clicked', () => {
      const mockOnEdgeClick = vi.fn();
      
      render(
        <ConnectedFamilyGraph
          familyGroups={mockFamilyGroups}
          familyMembers={mockFamilyMembers}
          familyRelationships={mockFamilyRelationships}
          onNodeClick={vi.fn()}
          onEdgeClick={mockOnEdgeClick}
        />
      );

      // Click on an edge
      const edge = screen.getByTestId('edge-1');
      fireEvent.click(edge);

      expect(mockOnEdgeClick).toHaveBeenCalled();
    });
  });

  describe('DagreLayoutIntegration', () => {
    it('auto-layouts entire connected graph', () => {
      const { dagre } = require('dagre');
      
      render(
        <ConnectedFamilyGraph
          familyGroups={mockFamilyGroups}
          familyMembers={mockFamilyMembers}
          familyRelationships={mockFamilyRelationships}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      // Dagre should be called with proper graph structure
      expect(dagre.default.layout).toHaveBeenCalledWith(
        expect.objectContaining({
          nodes: expect.any(Array),
          edges: expect.any(Array),
        })
      );
    });

    it('maintains nuclear family groupings in layout', () => {
      const { dagre } = require('dagre');
      
      render(
        <ConnectedFamilyGraph
          familyGroups={mockFamilyGroups}
          familyMembers={mockFamilyMembers}
          familyRelationships={mockFamilyRelationships}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      // Dagre should be called
      expect(dagre.default.layout).toHaveBeenCalled();
      
      // The layout should preserve family groupings
      const layoutCall = dagre.default.layout.mock.calls[0][0];
      expect(layoutCall.nodes).toHaveLength(mockFamilyMembers.length);
      expect(layoutCall.edges).toHaveLength(mockFamilyRelationships.length);
    });

    it('handles large connected graphs efficiently', () => {
      const { dagre } = require('dagre');
      
      // Create large dataset
      const largeFamilyGroups = Array.from({ length: 5 }, (_, i) => ({
        ...mockFamilyGroups[0],
        id: i + 1,
        name: `Family ${i + 1}`,
      }));

      const largeFamilyMembers = Array.from({ length: 20 }, (_, i) => ({
        ...mockFamilyMembers[0],
        id: i + 1,
        entry: {
          ...mockFamilyMembers[0].entry!,
          pid: 1000 + i,
          name: `Person ${i + 1}`,
        },
      }));

      const largeFamilyRelationships = Array.from({ length: 15 }, (_, i) => ({
        ...mockFamilyRelationships[0],
        id: i + 1,
        person1: 1000 + i,
        person2: 1000 + (i + 1) % 20,
      }));

      const startTime = performance.now();
      
      render(
        <ConnectedFamilyGraph
          familyGroups={largeFamilyGroups}
          familyMembers={largeFamilyMembers}
          familyRelationships={largeFamilyRelationships}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time
      expect(renderTime).toBeLessThan(500);
      
      // Dagre should be called
      expect(dagre.default.layout).toHaveBeenCalled();
    });
  });

  describe('VisualGrouping', () => {
    it('displays family group backgrounds', () => {
      render(
        <ConnectedFamilyGraph
          familyGroups={mockFamilyGroups}
          familyMembers={mockFamilyMembers}
          familyRelationships={mockFamilyRelationships}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      // Should render background for visual grouping
      expect(screen.getByTestId('background')).toBeInTheDocument();
    });

    it('groups nodes by family membership', () => {
      render(
        <ConnectedFamilyGraph
          familyGroups={mockFamilyGroups}
          familyMembers={mockFamilyMembers}
          familyRelationships={mockFamilyRelationships}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      // All nodes should be rendered
      expect(screen.getByTestId('node-1001')).toBeInTheDocument();
      expect(screen.getByTestId('node-1002')).toBeInTheDocument();
      expect(screen.getByTestId('node-1003')).toBeInTheDocument();
    });

    it('shows family group labels', () => {
      render(
        <ConnectedFamilyGraph
          familyGroups={mockFamilyGroups}
          familyMembers={mockFamilyMembers}
          familyRelationships={mockFamilyRelationships}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      // Family group names should be visible
      expect(screen.getByText('Doe Family')).toBeInTheDocument();
      expect(screen.getByText('Smith Family')).toBeInTheDocument();
    });
  });
});
