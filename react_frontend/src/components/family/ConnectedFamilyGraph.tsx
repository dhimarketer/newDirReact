// 2024-12-28: Connected Family Graph Component
// Implements Phase 3 of Family Tree Enhancement Plan - Enhanced UX with Navigation Controls
// Renders all connected families as a single React Flow graph using global person registry

import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import { ReactFlow, Node, Edge, MarkerType, ReactFlowProvider, useNodesState, useEdgesState, Controls, Background, Handle, Position, BaseEdge, EdgeLabelRenderer, getBezierPath, getStraightPath, ReactFlowInstance, NodeTypes, EdgeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { globalPersonRegistry, GlobalPerson, GlobalRelationship } from '../../services/globalPersonRegistry';

interface ConnectedFamilyGraphProps {
  rootPersonPid: number;
  maxDepth?: number;
  onPersonClick?: (person: GlobalPerson) => void;
  onRelationshipClick?: (relationship: GlobalRelationship) => void;
  showNuclearFamilyGrouping?: boolean;
  showNavigationControls?: boolean;
}

interface NuclearFamilyGroup {
  id: string;
  name: string;
  members: GlobalPerson[];
  relationships: GlobalRelationship[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isCollapsed: boolean;
}

// Custom node component for family members with Phase 3 enhancements
const FamilyMemberNode = ({ data, selected }: { data: { person: GlobalPerson; familyContexts: any[]; highlighted?: boolean; pathHighlight?: boolean }; selected?: boolean }) => {
  const { person, familyContexts, highlighted = false, pathHighlight = false } = data;
  
  const nodeClasses = [
    'family-member-node',
    selected ? 'selected' : '',
    highlighted ? 'highlighted' : '',
    pathHighlight ? 'path-highlight' : ''
  ].filter(Boolean).join(' ');
  
  return (
    <div className={nodeClasses}>
      <Handle type="target" position={Position.Top} />
      <div className="node-content">
        <div className="person-name">{person.name}</div>
        <div className="person-details">
          {person.age && <span className="age">{person.age} years</span>}
          {person.gender && <span className="gender">{person.gender}</span>}
        </div>
        {familyContexts.length > 1 && (
          <div className="family-count">
            {familyContexts.length} families
          </div>
        )}
        {highlighted && <div className="highlight-indicator">⭐</div>}
        {pathHighlight && <div className="path-indicator">🔗</div>}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

// Custom edge component for relationships
const RelationshipEdge = ({ 
  id, 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  sourcePosition, 
  targetPosition, 
  style = {}, 
  data 
}: any) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} />
      <EdgeLabelRenderer>
        {data?.relationship_type && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: '#fff',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 500,
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
            className="nodrag nopan"
          >
            {data.relationship_type}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};

const ConnectedFamilyGraph: React.FC<ConnectedFamilyGraphProps> = ({
  rootPersonPid,
  maxDepth = 3,
  onPersonClick,
  onRelationshipClick,
  showNuclearFamilyGrouping = true,
  showNavigationControls = true
}) => {
  const [persons, setPersons] = useState<GlobalPerson[]>([]);
  const [relationships, setRelationships] = useState<GlobalRelationship[]>([]);
  const [nuclearFamilyGroups, setNuclearFamilyGroups] = useState<NuclearFamilyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedPersonPid, setSelectedPersonPid] = useState<number | null>(null);
  const [showPathToRoot, setShowPathToRoot] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState<'overview' | 'focused' | 'detailed'>('overview');
  const [highlightedPath, setHighlightedPath] = useState<number[]>([]);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [breadcrumbs, setBreadcrumbs] = useState<{pid: number, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch connected persons and relationships
  useEffect(() => {
    const fetchConnectedData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { persons: connectedPersons, relationships: connectedRelationships } = 
          await globalPersonRegistry.getConnectedPersons(rootPersonPid, maxDepth);
        
        setPersons(connectedPersons);
        setRelationships(connectedRelationships);
        
        // Group persons into nuclear families
        if (showNuclearFamilyGrouping) {
          const groups = await groupPersonsIntoNuclearFamilies(connectedPersons, connectedRelationships);
          setNuclearFamilyGroups(groups);
        }
      } catch (err) {
        console.error('Error fetching connected family data:', err);
        setError('Failed to load family data');
      } finally {
        setLoading(false);
      }
    };

    fetchConnectedData();
  }, [rootPersonPid, maxDepth, showNuclearFamilyGrouping]);

  // Group persons into nuclear families based on family contexts
  const groupPersonsIntoNuclearFamilies = async (
    persons: GlobalPerson[], 
    relationships: GlobalRelationship[]
  ): Promise<NuclearFamilyGroup[]> => {
    const groups: NuclearFamilyGroup[] = [];
    const processedPids = new Set<number>();

    for (const person of persons) {
      if (processedPids.has(person.pid)) continue;

      try {
        const familyContexts = await globalPersonRegistry.getPersonFamilyContexts(person.pid);
        
        for (const context of familyContexts) {
          if (context.family_group_id) {
            // Find or create nuclear family group
            let group = groups.find(g => g.id === `family_${context.family_group_id}`);
            
            if (!group) {
              group = {
                id: `family_${context.family_group_id}`,
                name: context.family_group_name || `Family ${context.family_group_id}`,
                members: [],
                relationships: [],
                bounds: { x: 0, y: 0, width: 0, height: 0 },
                isCollapsed: false
              };
              groups.push(group);
            }

            // Add person to group if not already added
            if (!group.members.find(m => m.pid === person.pid)) {
              group.members.push(person);
              processedPids.add(person.pid);
            }

            // Add relationships within this family
            const familyRelationships = relationships.filter(rel => 
              rel.family_group_id === context.family_group_id
            );
            group.relationships.push(...familyRelationships);
          }
        }
      } catch (err) {
        console.error(`Error getting family contexts for person ${person.pid}:`, err);
      }
    }

    return groups;
  };

  // Calculate layout using Dagre
  const calculateLayout = useCallback(() => {
    if (persons.length === 0) return;

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
      rankdir: 'TB',
      nodesep: 100,
      ranksep: 150,
      align: 'UL',
      ranker: 'longest-path'
    });

    const nodeWidth = 200;
    const nodeHeight = 100;

    // Add nodes to Dagre graph
    persons.forEach(person => {
      dagreGraph.setNode(person.pid.toString(), { width: nodeWidth, height: nodeHeight });
    });

    // Add edges to Dagre graph
    relationships.forEach(rel => {
      if (rel.is_active) {
        dagreGraph.setEdge(rel.person1_pid.toString(), rel.person2_pid.toString());
      }
    });

    // Run Dagre layout
    dagre.layout(dagreGraph);

    // Convert to React Flow nodes with Phase 3 enhancements
    const reactFlowNodes: Node[] = persons.map(person => {
      const dagreNode = dagreGraph.node(person.pid.toString());
      const isHighlighted = highlightedPath.includes(person.pid);
      const isPathHighlight = showPathToRoot && isHighlighted;
      
      return {
        id: person.pid.toString(),
        type: 'familyMember',
        position: { x: dagreNode.x - nodeWidth / 2, y: dagreNode.y - nodeHeight / 2 },
        data: { 
          person,
          familyContexts: [], // TODO: Add family contexts
          highlighted: isHighlighted,
          pathHighlight: isPathHighlight
        },
        draggable: true,
        selected: selectedPersonPid === person.pid,
      };
    });

    // Convert to React Flow edges
    const reactFlowEdges: Edge[] = relationships
      .filter(rel => rel.is_active)
      .map(rel => ({
        id: `rel-${rel.id}`,
        source: rel.person1_pid.toString(),
        target: rel.person2_pid.toString(),
        type: 'relationship',
        data: {
          relationship_type: rel.relationship_type,
          relationship: rel
        },
        style: {
          stroke: rel.relationship_type === 'spouse' ? '#ec4899' : '#8B4513',
          strokeWidth: 2,
          strokeDasharray: rel.relationship_type === 'spouse' ? '8,4' : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: rel.relationship_type === 'spouse' ? '#ec4899' : '#8B4513',
          width: 10,
          height: 7,
        }
      }));

    setNodes(reactFlowNodes);
    setEdges(reactFlowEdges);
  }, [persons, relationships, highlightedPath, showPathToRoot, selectedPersonPid]);

  // Recalculate layout when data changes
  useEffect(() => {
    calculateLayout();
  }, [calculateLayout]);

  // Enhanced Navigation functions for Phase 3
  const centerOnPerson = useCallback((pid: number) => {
    if (reactFlowInstance) {
      const node = nodes.find(n => n.id === pid.toString());
      if (node) {
        reactFlowInstance.fitView({
          nodes: [{ id: node.id }],
          duration: 500,
          padding: 0.1
        });
        setSelectedPersonPid(pid);
        setViewMode('focused');
        
        // Update breadcrumbs
        const person = persons.find(p => p.pid === pid);
        if (person) {
          setBreadcrumbs(prev => {
            const existing = prev.findIndex(b => b.pid === pid);
            if (existing >= 0) {
              return prev.slice(0, existing + 1);
            }
            return [...prev, { pid, name: person.name }];
          });
        }
      }
    }
  }, [reactFlowInstance, nodes, persons]);

  const centerOnRoot = useCallback(() => {
    centerOnPerson(rootPersonPid);
    setBreadcrumbs([{ pid: rootPersonPid, name: persons.find(p => p.pid === rootPersonPid)?.name || 'Root' }]);
  }, [centerOnPerson, rootPersonPid, persons]);

  const fitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ duration: 500, padding: 0.1 });
      setViewMode('overview');
    }
  }, [reactFlowInstance]);

  const zoomIn = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn({ duration: 300 });
      setZoomLevel(prev => Math.min(prev * 1.2, 2));
    }
  }, [reactFlowInstance]);

  const zoomOut = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut({ duration: 300 });
      setZoomLevel(prev => Math.max(prev / 1.2, 0.1));
    }
  }, [reactFlowInstance]);

  const resetZoom = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomTo(1, { duration: 300 });
      setZoomLevel(1);
    }
  }, [reactFlowInstance]);

  const toggleMiniMap = useCallback(() => {
    setShowMiniMap(prev => !prev);
  }, []);

  const navigateToBreadcrumb = useCallback((pid: number) => {
    centerOnPerson(pid);
  }, [centerOnPerson]);

  const showPathToRootForPerson = useCallback((pid: number) => {
    setSelectedPersonPid(pid);
    setShowPathToRoot(true);
    
    // Find path to root using BFS
    const visited = new Set<number>();
    const queue = [{ pid, path: [pid] }];
    const pathToRoot: number[] = [];

    while (queue.length > 0) {
      const { pid: currentPid, path } = queue.shift()!;
      
      if (currentPid === rootPersonPid) {
        pathToRoot.push(...path);
        break;
      }

      if (visited.has(currentPid)) continue;
      visited.add(currentPid);

      // Find relationships for this person
      const personRelationships = relationships.filter(rel => 
        rel.is_active && (rel.person1_pid === currentPid || rel.person2_pid === currentPid)
      );

      for (const rel of personRelationships) {
        const nextPid = rel.person1_pid === currentPid ? rel.person2_pid : rel.person1_pid;
        if (!visited.has(nextPid)) {
          queue.push({ pid: nextPid, path: [...path, nextPid] });
        }
      }
    }

    // Highlight path nodes
    if (pathToRoot.length > 0) {
      setHighlightedPath(pathToRoot);
      const pathNodes = nodes.filter(n => pathToRoot.includes(parseInt(n.id)));
      if (reactFlowInstance) {
        reactFlowInstance.fitView({
          nodes: pathNodes,
          duration: 500,
          padding: 0.1
        });
      }
    }
  }, [rootPersonPid, relationships, nodes, reactFlowInstance]);

  const clearPathHighlight = useCallback(() => {
    setHighlightedPath([]);
    setShowPathToRoot(false);
  }, []);

  const expandAncestors = useCallback((pid: number) => {
    // Find all ancestors of the selected person
    const ancestors = new Set<number>();
    const queue = [pid];
    
    while (queue.length > 0) {
      const currentPid = queue.shift()!;
      if (ancestors.has(currentPid)) continue;
      ancestors.add(currentPid);
      
      // Find parent relationships
      const parentRelationships = relationships.filter(rel => 
        rel.is_active && 
        rel.relationship_type === 'parent' && 
        rel.person2_pid === currentPid
      );
      
      for (const rel of parentRelationships) {
        queue.push(rel.person1_pid);
      }
    }
    
    // Center on ancestors
    const ancestorNodes = nodes.filter(n => ancestors.has(parseInt(n.id)));
    if (reactFlowInstance && ancestorNodes.length > 0) {
      reactFlowInstance.fitView({
        nodes: ancestorNodes,
        duration: 500,
        padding: 0.1
      });
    }
  }, [relationships, nodes, reactFlowInstance]);

  const expandDescendants = useCallback((pid: number) => {
    // Find all descendants of the selected person
    const descendants = new Set<number>();
    const queue = [pid];
    
    while (queue.length > 0) {
      const currentPid = queue.shift()!;
      if (descendants.has(currentPid)) continue;
      descendants.add(currentPid);
      
      // Find child relationships
      const childRelationships = relationships.filter(rel => 
        rel.is_active && 
        rel.relationship_type === 'parent' && 
        rel.person1_pid === currentPid
      );
      
      for (const rel of childRelationships) {
        queue.push(rel.person2_pid);
      }
    }
    
    // Center on descendants
    const descendantNodes = nodes.filter(n => descendants.has(parseInt(n.id)));
    if (reactFlowInstance && descendantNodes.length > 0) {
      reactFlowInstance.fitView({
        nodes: descendantNodes,
        duration: 500,
        padding: 0.1
      });
    }
  }, [relationships, nodes, reactFlowInstance]);

  const toggleNuclearFamilyGroup = useCallback((groupId: string) => {
    setNuclearFamilyGroups(prev => 
      prev.map(group => 
        group.id === groupId 
          ? { ...group, isCollapsed: !group.isCollapsed }
          : group
      )
    );
  }, []);

  // Handle node click
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (onPersonClick && node.data?.person) {
      onPersonClick(node.data.person);
    }
    setSelectedPersonPid(parseInt(node.id));
  }, [onPersonClick]);

  // Handle edge click
  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    if (onRelationshipClick && edge.data?.relationship) {
      onRelationshipClick(edge.data.relationship);
    }
  }, [onRelationshipClick]);

  if (loading) {
    return (
      <div className="connected-family-graph-loading">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <div className="loading-text">Loading family tree...</div>
            <div className="loading-subtext">Fetching connected families and relationships</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="connected-family-graph-error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error}</div>
          <div className="error-actions">
            <button 
              onClick={() => window.location.reload()} 
              className="retry-button"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (persons.length === 0) {
    return (
      <div className="connected-family-graph-empty">
        <div className="empty-container">
          <div className="empty-icon">👥</div>
          <div className="empty-message">No family members found</div>
          <div className="empty-subtext">Try adjusting your search criteria or check the family data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="connected-family-graph-container">
      {/* Enhanced Navigation Controls - Phase 3 */}
      {showNavigationControls && (
        <div className="navigation-controls">
          {/* Primary Navigation */}
          <div className="control-group primary-nav">
            <button 
              onClick={centerOnRoot}
              className="nav-button primary"
              title="Center on root person"
            >
              🏠 Root
            </button>
            <button 
              onClick={fitView}
              className="nav-button primary"
              title="Fit entire tree to view"
            >
              🔍 Overview
            </button>
            {selectedPersonPid && (
              <>
                <button 
                  onClick={() => showPathToRootForPerson(selectedPersonPid)}
                  className="nav-button primary"
                  title="Show path to root"
                >
                  🔗 Path to Root
                </button>
                <button 
                  onClick={() => expandAncestors(selectedPersonPid)}
                  className="nav-button primary"
                  title="Expand ancestors"
                >
                  ⬆️ Ancestors
                </button>
                <button 
                  onClick={() => expandDescendants(selectedPersonPid)}
                  className="nav-button primary"
                  title="Expand descendants"
                >
                  ⬇️ Descendants
                </button>
              </>
            )}
          </div>
          
          {/* Zoom Controls */}
          <div className="control-group zoom-controls">
            <button 
              onClick={zoomOut}
              className="nav-button zoom"
              title="Zoom out"
            >
              ➖
            </button>
            <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
            <button 
              onClick={zoomIn}
              className="nav-button zoom"
              title="Zoom in"
            >
              ➕
            </button>
            <button 
              onClick={resetZoom}
              className="nav-button zoom"
              title="Reset zoom"
            >
              🔄
            </button>
          </div>

          {/* View Mode Controls */}
          <div className="control-group view-modes">
            <label className="control-label">View:</label>
            <select 
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value as 'overview' | 'focused' | 'detailed')}
              className="view-select"
            >
              <option value="overview">Overview</option>
              <option value="focused">Focused</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>

          {/* Utility Controls */}
          <div className="control-group utility">
            <button 
              onClick={toggleMiniMap}
              className={`nav-button utility ${showMiniMap ? 'active' : ''}`}
              title="Toggle mini-map"
            >
              🗺️
            </button>
            {highlightedPath.length > 0 && (
              <button 
                onClick={clearPathHighlight}
                className="nav-button utility"
                title="Clear path highlight"
              >
                ✖️ Clear Path
              </button>
            )}
          </div>
        </div>
      )}

      {/* Breadcrumbs Navigation */}
      {breadcrumbs.length > 0 && (
        <div className="breadcrumbs">
          <span className="breadcrumb-label">Navigation:</span>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.pid}>
              <button 
                onClick={() => navigateToBreadcrumb(crumb.pid)}
                className={`breadcrumb-item ${selectedPersonPid === crumb.pid ? 'active' : ''}`}
              >
                {crumb.name}
              </button>
              {index < breadcrumbs.length - 1 && <span className="breadcrumb-separator">›</span>}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Mini-Map */}
      {showMiniMap && (
        <div className="mini-map">
          <div className="mini-map-header">
            <span>Mini-Map</span>
            <button onClick={toggleMiniMap} className="mini-map-close">✖</button>
          </div>
          <div className="mini-map-content">
            {/* Mini-map content would go here - simplified representation */}
            <div className="mini-map-nodes">
              {nodes.slice(0, 10).map(node => (
                <div 
                  key={node.id}
                  className={`mini-node ${selectedPersonPid === parseInt(node.id) ? 'selected' : ''}`}
                  onClick={() => centerOnPerson(parseInt(node.id))}
                  title={node.data?.person?.name}
                >
                  {node.data?.person?.name?.charAt(0) || '?'}
                </div>
              ))}
              {nodes.length > 10 && <div className="mini-more">+{nodes.length - 10}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Nuclear Family Groups Panel */}
      {showNuclearFamilyGrouping && nuclearFamilyGroups.length > 0 && (
        <div className="nuclear-family-panel">
          <h4>Nuclear Families</h4>
          <div className="family-groups">
            {nuclearFamilyGroups.map(group => (
              <div key={group.id} className="family-group-item">
                <button
                  onClick={() => toggleNuclearFamilyGroup(group.id)}
                  className={`group-toggle ${group.isCollapsed ? 'collapsed' : 'expanded'}`}
                >
                  {group.isCollapsed ? '▶' : '▼'} {group.name}
                </button>
                <span className="member-count">({group.members.length} members)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .connected-family-graph-container {
          width: 100%;
          height: 100%;
          background: #ffffff;
          position: relative;
        }
        .navigation-controls {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 10;
          background: rgba(255, 255, 255, 0.98);
          padding: 12px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
          max-width: calc(100vw - 40px);
          backdrop-filter: blur(8px);
        }
        .control-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .control-group.primary-nav {
          gap: 8px;
        }
        .control-group.zoom-controls {
          background: #f8fafc;
          padding: 4px 8px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .control-group.view-modes {
          gap: 8px;
        }
        .control-group.utility {
          gap: 4px;
        }
        .nav-button {
          padding: 6px 10px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 500;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .nav-button:hover {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .nav-button.primary {
          background: #1e40af;
          font-size: 12px;
          padding: 8px 12px;
        }
        .nav-button.primary:hover {
          background: #1e3a8a;
        }
        .nav-button.zoom {
          background: #6b7280;
          padding: 4px 8px;
          font-size: 14px;
        }
        .nav-button.zoom:hover {
          background: #4b5563;
        }
        .nav-button.utility {
          background: #10b981;
          padding: 6px 8px;
        }
        .nav-button.utility:hover {
          background: #059669;
        }
        .nav-button.utility.active {
          background: #dc2626;
        }
        .nav-button.utility.active:hover {
          background: #b91c1c;
        }
        .control-label {
          font-size: 11px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .zoom-level {
          font-size: 11px;
          font-weight: 600;
          color: #374151;
          min-width: 40px;
          text-align: center;
        }
        .view-select {
          padding: 4px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 11px;
          background: white;
        }
        .breadcrumbs {
          position: absolute;
          top: 70px;
          left: 10px;
          z-index: 10;
          background: rgba(255, 255, 255, 0.95);
          padding: 8px 12px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 8px;
          max-width: calc(100vw - 40px);
          overflow-x: auto;
        }
        .breadcrumb-label {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .breadcrumb-item {
          background: none;
          border: none;
          color: #3b82f6;
          cursor: pointer;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }
        .breadcrumb-item:hover {
          background: #dbeafe;
          color: #1e40af;
        }
        .breadcrumb-item.active {
          background: #3b82f6;
          color: white;
        }
        .breadcrumb-separator {
          color: #9ca3af;
          font-size: 12px;
        }
        .mini-map {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 10;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          width: 200px;
          max-height: 300px;
          overflow: hidden;
        }
        .mini-map-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .mini-map-header span {
          font-size: 11px;
          font-weight: 600;
          color: #374151;
        }
        .mini-map-close {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 12px;
          padding: 2px 4px;
          border-radius: 2px;
        }
        .mini-map-close:hover {
          background: #e5e7eb;
          color: #374151;
        }
        .mini-map-content {
          padding: 8px;
        }
        .mini-map-nodes {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .mini-node {
          width: 24px;
          height: 24px;
          background: #e5e7eb;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .mini-node:hover {
          background: #3b82f6;
          color: white;
          transform: scale(1.1);
        }
        .mini-node.selected {
          background: #dc2626;
          color: white;
        }
        .mini-more {
          width: 24px;
          height: 24px;
          background: #f3f4f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: #6b7280;
          border: 1px dashed #9ca3af;
        }
        .nuclear-family-panel {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 10;
          background: rgba(255, 255, 255, 0.95);
          padding: 10px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          max-width: 250px;
        }
        .nuclear-family-panel h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #374151;
        }
        .family-groups {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .family-group-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .group-toggle {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          color: #374151;
          padding: 2px 4px;
          border-radius: 2px;
        }
        .group-toggle:hover {
          background: #f3f4f6;
        }
        .member-count {
          font-size: 10px;
          color: #6b7280;
        }
        .family-member-node {
          background: #fef3c7;
          border: 2px solid #8B4513;
          border-radius: 8px;
          padding: 8px 12px;
          min-width: 180px;
          min-height: 60px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
          position: relative;
        }
        .family-member-node:hover {
          background: #fde68a;
          cursor: pointer;
          transform: scale(1.05);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .family-member-node.selected {
          border-color: #3b82f6;
          background: #dbeafe;
          transform: scale(1.08);
          box-shadow: 0 6px 12px rgba(59, 130, 246, 0.3);
        }
        .family-member-node.highlighted {
          border-color: #dc2626;
          background: #fef2f2;
          animation: pulse 2s infinite;
        }
        .family-member-node.path-highlight {
          border-color: #10b981;
          background: #ecfdf5;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1.05); }
          50% { transform: scale(1.1); }
        }
        .node-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .person-name {
          font-weight: bold;
          font-size: 14px;
          color: #1f2937;
        }
        .person-details {
          font-size: 10px;
          color: #6b7280;
          display: flex;
          gap: 8px;
        }
        .family-count {
          font-size: 9px;
          color: #8B4513;
          background: #fef3c7;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #8B4513;
        }
        .highlight-indicator {
          position: absolute;
          top: -5px;
          right: -5px;
          font-size: 12px;
          animation: twinkle 1.5s infinite;
        }
        .path-indicator {
          position: absolute;
          top: -5px;
          left: -5px;
          font-size: 12px;
          color: #10b981;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }
        .connected-family-graph-loading,
        .connected-family-graph-error,
        .connected-family-graph-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 400px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
        .loading-container,
        .error-container,
        .empty-container {
          text-align: center;
          max-width: 300px;
        }
        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .loading-text {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }
        .loading-subtext {
          font-size: 14px;
          color: #6b7280;
        }
        .error-icon,
        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .error-message {
          font-size: 16px;
          font-weight: 600;
          color: #dc2626;
          margin-bottom: 16px;
        }
        .error-actions {
          margin-top: 16px;
        }
        .retry-button {
          padding: 8px 16px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        .retry-button:hover {
          background: #b91c1c;
        }
        .empty-message {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }
        .empty-subtext {
          font-size: 14px;
          color: #6b7280;
        }
        
        /* Responsive Design - Phase 3 */
        @media (max-width: 768px) {
          .navigation-controls {
            flex-direction: column;
            gap: 8px;
            padding: 8px;
            max-width: calc(100vw - 20px);
          }
          .control-group {
            flex-wrap: wrap;
            justify-content: center;
          }
          .nav-button {
            font-size: 10px;
            padding: 4px 8px;
          }
          .breadcrumbs {
            top: 120px;
            max-width: calc(100vw - 20px);
            padding: 6px 8px;
          }
          .mini-map {
            width: 150px;
            max-height: 200px;
          }
          .family-member-node {
            min-width: 140px;
            min-height: 50px;
            padding: 6px 8px;
          }
          .person-name {
            font-size: 12px;
          }
          .person-details {
            font-size: 9px;
          }
        }
        
        @media (max-width: 480px) {
          .navigation-controls {
            position: relative;
            margin-bottom: 10px;
          }
          .breadcrumbs {
            position: relative;
            top: 0;
            margin-bottom: 10px;
          }
          .mini-map {
            position: relative;
            top: 0;
            right: 0;
            width: 100%;
            margin-bottom: 10px;
          }
        }
      `}</style>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onInit={setReactFlowInstance}
        nodeTypes={{
          familyMember: FamilyMemberNode
        }}
        edgeTypes={{
          relationship: RelationshipEdge
        }}
        fitView
        nodesConnectable={false}
        nodesDraggable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={false}
        attributionPosition="bottom-left"
        deleteKeyCode={null}
        multiSelectionKeyCode={null}
        selectionKeyCode={null}
        data-testid="react-flow"
      >
        <Controls 
          position="top-right"
          showZoom={true}
          showFitView={true}
          showInteractive={false}
        />
        <Background 
          color="#f8f9fa" 
          gap={20} 
          size={1}
        />
      </ReactFlow>
    </div>
  );
};

// Wrap with ReactFlowProvider
const ConnectedFamilyGraphWithProvider: React.FC<ConnectedFamilyGraphProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ConnectedFamilyGraph {...props} />
    </ReactFlowProvider>
  );
};

export default ConnectedFamilyGraphWithProvider;
