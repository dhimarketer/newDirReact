# Dagre Implementation Plan for Family Tree

## Executive Summary
Replace manual SVG layout calculations with Dagre automatic layout engine in React Flow family tree component.

## Current State Analysis
- ✅ Dagre already installed (`dagre: ^0.8.5`)
- ✅ React Flow already implemented (`@xyflow/react: ^12.0.0`)
- ✅ CleanReactFlowFamilyTree.tsx exists with manual positioning
- ❌ Manual positioning logic is complex and brittle
- ❌ No automatic layout engine integration

## Implementation Steps

### Step 1: Create useFamilyGraphLayout Hook
**File**: `react_frontend/src/components/family/hooks/useFamilyGraphLayout.ts`
**Purpose**: Transform family data into Dagre layout, return React Flow nodes/edges

**Key Features**:
- Takes `familyMembers` and `relationships` as input
- Creates Dagre graph with proper hierarchy
- Handles parent-child relationships explicitly
- Returns positioned nodes and edges for React Flow

### Step 2: Refactor CleanReactFlowFamilyTree
**File**: `react_frontend/src/components/family/CleanReactFlowFamilyTree.tsx`
**Changes**:
- Remove all manual positioning logic (lines 152-229)
- Replace with `useFamilyGraphLayout` hook
- Keep custom node components (FamilyNode, UnionNode)
- Simplify component to just render React Flow

### Step 3: Update FamilyTreeWindow Integration
**File**: `react_frontend/src/components/family/FamilyTreeWindow.tsx`
**Changes**:
- Replace ClassicFamilyTree with CleanReactFlowFamilyTree
- Ensure proper data flow to new layout hook

### Step 4: Test and Validate
- Test with various family structures
- Verify relationship arrows display correctly
- Ensure proper hierarchy layout

## Technical Details

### Dagre Configuration
```typescript
const g = new dagre.graphlib.Graph();
g.setGraph({ 
  rankdir: 'TB',        // Top-to-bottom layout
  nodesep: 50,          // Node separation
  ranksep: 100,         // Rank separation
  align: 'UL'           // Upper-left alignment
});
```

### Node Sizing
- Family nodes: 200px width, 80px height
- Union nodes: 20px width, 20px height

### Edge Types
- Parent-child: Solid lines with arrows
- Spouse: Dashed horizontal lines
- Union connections: Vertical connectors

## Benefits
1. **Automatic Layout**: No more manual coordinate calculations
2. **Scalable**: Handles complex family structures automatically
3. **Maintainable**: Clean separation of data and visualization
4. **Robust**: Industry-standard graph layout algorithm
5. **Extensible**: Easy to add new relationship types

## Files to Modify
1. `react_frontend/src/components/family/hooks/useFamilyGraphLayout.ts` (NEW)
2. `react_frontend/src/components/family/CleanReactFlowFamilyTree.tsx` (REFACTOR)
3. `react_frontend/src/components/family/FamilyTreeWindow.tsx` (UPDATE)

## Timeline
- Step 1: 15 minutes (create hook)
- Step 2: 20 minutes (refactor component)
- Step 3: 10 minutes (update integration)
- Step 4: 15 minutes (test and validate)
- **Total: ~1 hour**
