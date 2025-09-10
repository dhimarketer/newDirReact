// 2024-12-28: Global Family Tree Test Component
// Tests Phase 1 implementation with existing family data

import React, { useState, useEffect } from 'react';
import { globalPersonRegistry, GlobalPerson, GlobalRelationship } from '../../services/globalPersonRegistry';
import ConnectedFamilyGraph from './ConnectedFamilyGraph';

interface GlobalFamilyTreeTestProps {
  testPersonPid?: number;
}

const GlobalFamilyTreeTest: React.FC<GlobalFamilyTreeTestProps> = ({ 
  testPersonPid = 1 // Default test PID
}) => {
  const [testPerson, setTestPerson] = useState<GlobalPerson | null>(null);
  const [personRelationships, setPersonRelationships] = useState<GlobalRelationship[]>([]);
  const [personFamilyContexts, setPersonFamilyContexts] = useState<any[]>([]);
  const [connectedData, setConnectedData] = useState<{
    persons: GlobalPerson[];
    relationships: GlobalRelationship[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test global person registry
  const testGlobalPersonRegistry = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🧪 Testing Global Person Registry...');

      // Test 1: Get person by PID
      console.log(`📋 Test 1: Getting person with PID ${testPersonPid}`);
      const person = await globalPersonRegistry.getPerson(testPersonPid);
      setTestPerson(person);
      console.log('✅ Person retrieved:', person);

      if (!person) {
        setError(`No person found with PID ${testPersonPid}`);
        return;
      }

      // Test 2: Get person relationships
      console.log(`🔗 Test 2: Getting relationships for person ${person.name}`);
      const relationships = await globalPersonRegistry.getPersonRelationships(testPersonPid);
      setPersonRelationships(relationships);
      console.log('✅ Relationships retrieved:', relationships);

      // Test 3: Get person family contexts
      console.log(`👥 Test 3: Getting family contexts for person ${person.name}`);
      const contexts = await globalPersonRegistry.getPersonFamilyContexts(testPersonPid);
      setPersonFamilyContexts(contexts);
      console.log('✅ Family contexts retrieved:', contexts);

      // Test 4: Get connected persons
      console.log(`🌐 Test 4: Getting connected persons for person ${person.name}`);
      const connected = await globalPersonRegistry.getConnectedPersons(testPersonPid, 2);
      setConnectedData(connected);
      console.log('✅ Connected data retrieved:', connected);

      console.log('🎉 All tests passed!');

    } catch (err) {
      console.error('❌ Test failed:', err);
      setError(`Test failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // Test creating a relationship
  const testCreateRelationship = async () => {
    if (!testPerson) return;

    try {
      console.log('🔗 Testing relationship creation...');
      
      // This would create a relationship with another person
      // For now, just log the attempt
      console.log('✅ Relationship creation test ready (not implemented yet)');
      
    } catch (err) {
      console.error('❌ Relationship creation test failed:', err);
    }
  };

  useEffect(() => {
    testGlobalPersonRegistry();
  }, [testPersonPid]);

  const handlePersonClick = (person: GlobalPerson) => {
    console.log('👆 Person clicked:', person);
    // Update test to use clicked person
    setTestPersonPid(person.pid);
  };

  const handleRelationshipClick = (relationship: GlobalRelationship) => {
    console.log('🔗 Relationship clicked:', relationship);
  };

  return (
    <div className="global-family-tree-test">
      <div className="test-header">
        <h2>Global Family Tree Test</h2>
        <div className="test-controls">
          <input
            type="number"
            value={testPersonPid}
            onChange={(e) => setTestPersonPid(parseInt(e.target.value) || 1)}
            placeholder="Enter PID to test"
            className="pid-input"
          />
          <button onClick={testGlobalPersonRegistry} disabled={loading}>
            {loading ? 'Testing...' : 'Run Tests'}
          </button>
          <button onClick={testCreateRelationship} disabled={!testPerson}>
            Test Create Relationship
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <h3>❌ Error</h3>
          <p>{error}</p>
        </div>
      )}

      {testPerson && (
        <div className="test-results">
          <div className="person-info">
            <h3>👤 Test Person</h3>
            <div className="person-details">
              <p><strong>Name:</strong> {testPerson.name}</p>
              <p><strong>PID:</strong> {testPerson.pid}</p>
              <p><strong>Age:</strong> {testPerson.age || 'Unknown'}</p>
              <p><strong>Gender:</strong> {testPerson.gender || 'Unknown'}</p>
              <p><strong>Address:</strong> {testPerson.address || 'Unknown'}</p>
            </div>
          </div>

          <div className="relationships-info">
            <h3>🔗 Relationships ({personRelationships.length})</h3>
            {personRelationships.length > 0 ? (
              <ul>
                {personRelationships.map(rel => (
                  <li key={rel.id}>
                    <strong>{rel.person1_name}</strong> is <strong>{rel.relationship_type}</strong> of <strong>{rel.person2_name}</strong>
                    {rel.family_group_name && <span> (in {rel.family_group_name})</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No relationships found</p>
            )}
          </div>

          <div className="family-contexts-info">
            <h3>👥 Family Contexts ({personFamilyContexts.length})</h3>
            {personFamilyContexts.length > 0 ? (
              <ul>
                {personFamilyContexts.map((context, index) => (
                  <li key={index}>
                    <strong>{context.family_group_name}</strong> as <strong>{context.role_in_family || 'member'}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No family contexts found</p>
            )}
          </div>

          <div className="connected-data-info">
            <h3>🌐 Connected Data</h3>
            <p><strong>Total Persons:</strong> {connectedData?.persons.length || 0}</p>
            <p><strong>Total Relationships:</strong> {connectedData?.relationships.length || 0}</p>
          </div>
        </div>
      )}

      {connectedData && connectedData.persons.length > 0 && (
        <div className="connected-graph">
          <h3>🌳 Connected Family Graph</h3>
          <div className="graph-container" style={{ height: '600px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <ConnectedFamilyGraph
              rootPersonPid={testPersonPid}
              maxDepth={2}
              onPersonClick={handlePersonClick}
              onRelationshipClick={handleRelationshipClick}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .global-family-tree-test {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .test-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }
        .test-controls {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .pid-input {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          width: 120px;
        }
        button {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .test-results {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .person-info,
        .relationships-info,
        .family-contexts-info,
        .connected-data-info {
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        .person-details p {
          margin: 8px 0;
        }
        ul {
          list-style: none;
          padding: 0;
        }
        li {
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        li:last-child {
          border-bottom: none;
        }
        .connected-graph {
          margin-top: 20px;
        }
        .graph-container {
          background: white;
        }
      `}</style>
    </div>
  );
};

export default GlobalFamilyTreeTest;
