# ReactFlow Infinite Loop Fix Plan

## Problem Analysis

From the logs, I can identify three critical issues:

### 1. **Infinite Re-rendering Loop**
- Component is being called hundreds of times
- `🔍 SimpleReactFlowFamilyTree - Component called with:` appears repeatedly
- This indicates a React infinite loop in useEffect or dependency array

### 2. **Duplicate Edge Keys**
- React warnings: "Encountered two children with the same key"
- Keys like `center-to-child-210030` are duplicated
- This suggests edges are being created multiple times

### 3. **Layout Still Not Working**
- Despite creating 13 nodes and 11 edges, the layout is still not displaying correctly
- The organizational chart structure is not being rendered properly

## Root Cause Analysis

### Infinite Loop Causes:
1. **useEffect Dependencies**: Likely missing or incorrect dependencies in useEffect
2. **State Updates in Render**: State being updated during render cycle
3. **Object/Array Recreation**: New objects/arrays being created on every render
4. **useMemo/useCallback Issues**: Dependencies causing recalculation

### Duplicate Keys Causes:
1. **Edge Creation Logic**: Edges being created multiple times
2. **Key Generation**: Same keys being generated for different edges
3. **Component Re-mounting**: Component re-mounting causing duplicate edge creation

## Solution Plan

### Phase 1: Fix Infinite Loop
1. **Audit useEffect Dependencies**
   - Check all useEffect hooks in SimpleReactFlowFamilyTree.tsx
   - Ensure dependencies are properly memoized
   - Remove unnecessary dependencies

2. **Fix State Management**
   - Use useCallback for functions passed as dependencies
   - Use useMemo for expensive calculations
   - Ensure state updates don't trigger re-renders

3. **Optimize Component Structure**
   - Move expensive calculations outside render
   - Use React.memo for component optimization
   - Fix any state updates in render cycle

### Phase 2: Fix Duplicate Keys
1. **Audit Edge Creation Logic**
   - Check edge creation in useMemo
   - Ensure unique keys for each edge
   - Fix any duplicate edge generation

2. **Fix Key Generation**
   - Use unique identifiers for edge keys
   - Include parent/child IDs in key generation
   - Ensure no duplicate keys across renders

### Phase 3: Fix Layout Issues
1. **Verify Node Positioning**
   - Check center node positioning logic
   - Ensure nodes are positioned correctly
   - Fix any coordinate calculation issues

2. **Verify Edge Connections**
   - Check edge source/target connections
   - Ensure edges connect to correct nodes
   - Fix any connection logic issues

3. **Test Layout Rendering**
   - Verify ReactFlow is receiving correct data
   - Check if edges are being rendered
   - Ensure proper visual output

## Implementation Steps

### Step 1: Fix Infinite Loop
- [ ] Audit useEffect in SimpleReactFlowFamilyTree.tsx
- [ ] Fix dependency arrays
- [ ] Add useCallback/useMemo where needed
- [ ] Remove any state updates in render

### Step 2: Fix Duplicate Keys
- [ ] Audit edge creation logic
- [ ] Fix key generation to be unique
- [ ] Ensure no duplicate edges are created
- [ ] Test edge creation in isolation

### Step 3: Fix Layout
- [ ] Verify node positioning calculations
- [ ] Check edge connection logic
- [ ] Test with simple data first
- [ ] Ensure proper organizational chart structure

### Step 4: Test and Validate
- [ ] Test with small family (2 parents, 2 children)
- [ ] Test with larger family (2 parents, 10 children)
- [ ] Verify no infinite loops
- [ ] Verify no duplicate keys
- [ ] Verify proper layout display

## Expected Outcome

After implementing this plan:
1. **No infinite loops** - Component renders only when necessary
2. **No duplicate keys** - All edges have unique identifiers
3. **Proper layout** - Clean organizational chart with horizontal spouse line and children connecting to center
4. **Good performance** - Smooth rendering without excessive re-renders

## Risk Mitigation

- Test each phase independently
- Use console logs to verify fixes
- Start with simple test data
- Incrementally add complexity
- Monitor performance during development

## Success Criteria

- Component renders only once per data change
- No React warnings about duplicate keys
- Clean organizational chart layout visible
- Horizontal spouse line between parents
- Children connecting to center of spouse line
- Draggable functionality preserved
