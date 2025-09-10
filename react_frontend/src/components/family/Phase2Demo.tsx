// 2024-12-28: Phase 2 Demo Component
// Demonstrates all Phase 2 features of the Family Tree Enhancement Plan

import React, { useState } from 'react';
import EnhancedFamilyTreeWindow from './EnhancedFamilyTreeWindow';
import ConnectedFamilyGraph from './ConnectedFamilyGraph';
import FamilyTreeSearchFilter from './FamilyTreeSearchFilter';
import { GlobalPerson, GlobalRelationship } from '../../services/globalPersonRegistry';

const Phase2Demo: React.FC = () => {
  const [demoMode, setDemoMode] = useState<'enhanced' | 'graph' | 'search'>('enhanced');
  const [rootPersonPid, setRootPersonPid] = useState(1);
  const [showDemo, setShowDemo] = useState(false);

  const handlePersonClick = (person: GlobalPerson) => {
    console.log('Person clicked:', person);
  };

  const handleRelationshipClick = (relationship: GlobalRelationship) => {
    console.log('Relationship clicked:', relationship);
  };

  const renderDemoContent = () => {
    switch (demoMode) {
      case 'enhanced':
        return (
          <EnhancedFamilyTreeWindow
            rootPersonPid={rootPersonPid}
            onPersonClick={handlePersonClick}
            onRelationshipClick={handleRelationshipClick}
            onClose={() => setShowDemo(false)}
          />
        );
      
      case 'graph':
        return (
          <div className="graph-demo">
            <div className="demo-controls">
              <h3>Connected Family Graph Demo</h3>
              <div className="control-group">
                <label>Root Person PID:</label>
                <input
                  type="number"
                  value={rootPersonPid}
                  onChange={(e) => setRootPersonPid(parseInt(e.target.value) || 1)}
                  className="pid-input"
                />
                <button onClick={() => setDemoMode('enhanced')} className="back-button">
                  ← Back to Enhanced View
                </button>
              </div>
            </div>
            <div className="graph-container">
              <ConnectedFamilyGraph
                rootPersonPid={rootPersonPid}
                maxDepth={3}
                onPersonClick={handlePersonClick}
                onRelationshipClick={handleRelationshipClick}
                showNuclearFamilyGrouping={true}
                showNavigationControls={true}
              />
            </div>
          </div>
        );
      
      case 'search':
        return (
          <div className="search-demo">
            <div className="demo-controls">
              <h3>Search & Filter Demo</h3>
              <button onClick={() => setDemoMode('enhanced')} className="back-button">
                ← Back to Enhanced View
              </button>
            </div>
            <div className="search-container">
              <FamilyTreeSearchFilter
                persons={[]} // Mock data would be loaded here
                relationships={[]} // Mock data would be loaded here
                onFilteredDataChange={(persons, relationships) => {
                  console.log('Filtered data:', { persons, relationships });
                }}
                onPersonSelect={handlePersonClick}
                onRelationshipSelect={handleRelationshipClick}
              />
              <div className="search-results">
                <p>Search results will appear here when connected to real data.</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (!showDemo) {
    return (
      <div className="phase2-demo">
        <div className="demo-intro">
          <h1>🌳 Family Tree Enhancement - Phase 2 Demo</h1>
          <p>This demo showcases all the Phase 2 features implemented based on the external reviewer's advice:</p>
          
          <div className="features-list">
            <h3>✅ Phase 2 Features Implemented:</h3>
            <ul>
              <li><strong>Visual Grouping:</strong> Nuclear families are grouped with collapsible panels</li>
              <li><strong>Navigation Controls:</strong> "Center on Root", "Show Path to Root", depth control</li>
              <li><strong>Progressive Disclosure:</strong> Expand/collapse family branches with configurable depth</li>
              <li><strong>Enhanced Dagre Layout:</strong> Better handling of nuclear family grouping</li>
              <li><strong>Search & Filter:</strong> Advanced filtering by name, age, gender, relationship type, family group</li>
              <li><strong>Dual View Modes:</strong> Graph view and list view for different use cases</li>
              <li><strong>Family Context UI:</strong> Shows which nuclear family each person belongs to</li>
              <li><strong>Interactive Details:</strong> Click on persons/relationships to see detailed information</li>
            </ul>
          </div>

          <div className="demo-options">
            <h3>Choose Demo Mode:</h3>
            <div className="demo-buttons">
              <button 
                onClick={() => {
                  setDemoMode('enhanced');
                  setShowDemo(true);
                }}
                className="demo-button enhanced"
              >
                🚀 Enhanced Family Tree Window
                <small>Complete integrated experience</small>
              </button>
              
              <button 
                onClick={() => {
                  setDemoMode('graph');
                  setShowDemo(true);
                }}
                className="demo-button graph"
              >
                📊 Connected Family Graph
                <small>Single graph rendering with navigation</small>
              </button>
              
              <button 
                onClick={() => {
                  setDemoMode('search');
                  setShowDemo(true);
                }}
                className="demo-button search"
              >
                🔍 Search & Filter
                <small>Advanced filtering capabilities</small>
              </button>
            </div>
          </div>

          <div className="demo-settings">
            <h3>Demo Settings:</h3>
            <div className="setting-group">
              <label>Root Person PID:</label>
              <input
                type="number"
                value={rootPersonPid}
                onChange={(e) => setRootPersonPid(parseInt(e.target.value) || 1)}
                className="pid-input"
                placeholder="Enter person ID to start from"
              />
              <small>This will be the starting point for the family tree</small>
            </div>
          </div>
        </div>

        <style jsx>{`
          .phase2-demo {
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          .demo-intro h1 {
            color: #1f2937;
            margin-bottom: 16px;
          }
          .demo-intro p {
            color: #6b7280;
            margin-bottom: 24px;
            font-size: 16px;
          }
          .features-list {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 32px;
            border: 1px solid #e5e7eb;
          }
          .features-list h3 {
            color: #1f2937;
            margin-bottom: 12px;
          }
          .features-list ul {
            list-style: none;
            padding: 0;
          }
          .features-list li {
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
            color: #374151;
          }
          .features-list li:last-child {
            border-bottom: none;
          }
          .demo-options {
            margin-bottom: 32px;
          }
          .demo-options h3 {
            color: #1f2937;
            margin-bottom: 16px;
          }
          .demo-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 16px;
          }
          .demo-button {
            padding: 20px;
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            cursor: pointer;
            text-align: left;
            transition: all 0.2s ease;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .demo-button:hover {
            border-color: #3b82f6;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .demo-button.enhanced {
            border-color: #10b981;
          }
          .demo-button.enhanced:hover {
            border-color: #059669;
            background: #f0fdf4;
          }
          .demo-button.graph {
            border-color: #3b82f6;
          }
          .demo-button.graph:hover {
            border-color: #2563eb;
            background: #eff6ff;
          }
          .demo-button.search {
            border-color: #f59e0b;
          }
          .demo-button.search:hover {
            border-color: #d97706;
            background: #fffbeb;
          }
          .demo-button small {
            color: #6b7280;
            font-size: 12px;
          }
          .demo-settings {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .demo-settings h3 {
            color: #1f2937;
            margin-bottom: 16px;
          }
          .setting-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .setting-group label {
            font-weight: 500;
            color: #374151;
          }
          .pid-input {
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            width: 200px;
          }
          .setting-group small {
            color: #6b7280;
            font-size: 12px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="phase2-demo-active">
      <div className="demo-header">
        <button 
          onClick={() => setShowDemo(false)}
          className="back-to-intro"
        >
          ← Back to Demo Selection
        </button>
        <h2>Phase 2 Demo - {demoMode.charAt(0).toUpperCase() + demoMode.slice(1)} Mode</h2>
      </div>
      
      <div className="demo-content">
        {renderDemoContent()}
      </div>

      <style jsx>{`
        .phase2-demo-active {
          width: 100%;
          height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .demo-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        .back-to-intro {
          padding: 8px 16px;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .back-to-intro:hover {
          background: #4b5563;
        }
        .demo-header h2 {
          margin: 0;
          color: #1f2937;
        }
        .demo-content {
          flex: 1;
          overflow: hidden;
        }
        .graph-demo, .search-demo {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .demo-controls {
          padding: 16px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        .demo-controls h3 {
          margin: 0 0 12px 0;
          color: #1f2937;
        }
        .control-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .control-group label {
          font-weight: 500;
          color: #374151;
        }
        .pid-input {
          padding: 6px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          width: 100px;
        }
        .back-button {
          padding: 6px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .back-button:hover {
          background: #2563eb;
        }
        .graph-container, .search-container {
          flex: 1;
          overflow: hidden;
        }
        .search-results {
          padding: 20px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }
        .search-results p {
          margin: 0;
          color: #6b7280;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default Phase2Demo;
