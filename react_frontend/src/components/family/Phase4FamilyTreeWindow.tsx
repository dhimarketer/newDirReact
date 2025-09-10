// 2024-12-28: Phase 4 - Comprehensive family tree window with advanced features

import React, { useState, useEffect } from 'react';
import { FamilyMember, FamilyRelationship, FamilyGroup, FamilyMedia, FamilyEvent } from '../../types/family';
import EnhancedRelationshipSelector from './EnhancedRelationshipSelector';
import FamilyMediaManager from './FamilyMediaManager';
import FamilyEventTimeline from './FamilyEventTimeline';

interface Phase4FamilyTreeWindowProps {
  familyGroups: FamilyGroup[];
  familyMembers: FamilyMember[];
  familyRelationships: FamilyRelationship[];
  familyMedia?: FamilyMedia[];
  familyEvents?: FamilyEvent[];
  onFamilyUpdate?: (data: any) => void;
  onRelationshipUpdate?: (data: any) => void;
  onMediaUpdate?: (data: any) => void;
  onEventUpdate?: (data: any) => void;
  onSave?: (updatedData: any) => void;
  onClose?: () => void;
}

export const Phase4FamilyTreeWindow: React.FC<Phase4FamilyTreeWindowProps> = ({
  familyGroups,
  familyMembers,
  familyRelationships,
  familyMedia = [],
  familyEvents = [],
  onFamilyUpdate,
  onRelationshipUpdate,
  onMediaUpdate,
  onEventUpdate,
  onSave,
  onClose,
}) => {
  const familyGroup = familyGroups[0];
  const [activeTab, setActiveTab] = useState<'relationships' | 'media' | 'events' | 'timeline'>('relationships');

  // Handle empty data
  if (!familyGroup || familyMembers.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Data Available</h2>
          <p className="text-gray-600 mb-6">No family data found. Please add family members and relationships first.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  const [selectedPerson, setSelectedPerson] = useState<FamilyMember | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<FamilyRelationship | null>(null);
  const [media, setMedia] = useState<FamilyMedia[]>(familyMedia);
  const [events, setEvents] = useState<FamilyEvent[]>(familyEvents);

  // Load media and events for selected person
  useEffect(() => {
    if (selectedPerson) {
      loadPersonMedia(selectedPerson.id);
      loadPersonEvents(selectedPerson.id);
    }
  }, [selectedPerson]);

  const loadPersonMedia = async (personId: number) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/family/media/?person=${personId}`);
      if (response.ok) {
        const personMedia = await response.json();
        setMedia(personMedia);
      }
    } catch (error) {
      console.error('Error loading media:', error);
    }
  };

  const loadPersonEvents = async (personId: number) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/family/events/?person=${personId}`);
      if (response.ok) {
        const personEvents = await response.json();
        setEvents(personEvents);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleRelationshipUpdate = (updatedRelationship: Partial<FamilyRelationship>) => {
    if (selectedRelationship) {
      const updated = { ...selectedRelationship, ...updatedRelationship };
      setSelectedRelationship(updated);
      
      // TODO: Update relationship in backend
      console.log('Updating relationship:', updated);
    }
  };

  const handleMediaAdded = (newMedia: FamilyMedia) => {
    setMedia(prev => [...prev, newMedia]);
  };

  const handleMediaRemoved = (mediaId: number) => {
    setMedia(prev => prev.filter(m => m.id !== mediaId));
  };

  const handleEventAdded = (newEvent: FamilyEvent) => {
    setEvents(prev => [...prev, newEvent]);
  };

  const handleEventUpdated = (updatedEvent: FamilyEvent) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  };

  const handleEventRemoved = (eventId: number) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  const getPersonName = (personId: number) => {
    const person = familyMembers.find(m => m.id === personId);
    return person?.entry?.name || `Person ${personId}`;
  };

  const getRelationshipDisplay = (relationship: FamilyRelationship) => {
    const person1Name = getPersonName(relationship.person1);
    const person2Name = getPersonName(relationship.person2);
    return `${person1Name} → ${person2Name} (${relationship.relationship_type})`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              Phase 4: Advanced Family Tree - {familyGroup?.name || 'Family'}
            </h2>
            <p className="text-sm text-gray-600">
              Rich relationships, media attachments, and life events
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search family members, relationships, events..."
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'relationships', label: 'Relationships', icon: '👥' },
              { id: 'media', label: 'Media', icon: '📷' },
              { id: 'events', label: 'Events', icon: '📅' },
              { id: 'timeline', label: 'Timeline', icon: '⏰' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'relationships' && (
            <div className="h-full flex">
              {/* Person List */}
              <div className="w-1/3 border-r border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Family Members</h3>
                <div className="space-y-2">
                  {familyMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedPerson(member)}
                      className={`w-full text-left p-3 rounded-md border ${
                        selectedPerson?.id === member.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">
                        {member.entry?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {member.role_in_family || 'No role assigned'}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Relationships</h4>
                  <div className="space-y-2">
                    {familyRelationships.map((relationship) => (
                      <button
                        key={relationship.id}
                        onClick={() => setSelectedRelationship(relationship)}
                        className={`w-full text-left p-2 rounded-md border text-sm ${
                          selectedRelationship?.id === relationship.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {getRelationshipDisplay(relationship)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Relationship Editor */}
              <div className="flex-1 p-6">
                {selectedRelationship ? (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Edit Relationship
                    </h3>
                    <EnhancedRelationshipSelector
                      relationship={selectedRelationship}
                      onUpdate={handleRelationshipUpdate}
                      person1Name={getPersonName(selectedRelationship.person1)}
                      person2Name={getPersonName(selectedRelationship.person2)}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <span className="text-4xl mb-2 block">👥</span>
                    <p>Select a relationship to edit</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="h-full p-6">
              <FamilyMediaManager
                familyGroup={familyGroup}
                familyMembers={familyMembers}
                familyRelationships={familyRelationships}
                media={media}
                onMediaUpload={onMediaUpdate}
                onMediaDelete={onMediaUpdate}
              />
            </div>
          )}

          {activeTab === 'events' && (
            <div className="h-full p-6">
              <FamilyEventTimeline
                familyGroup={familyGroup}
                familyMembers={familyMembers}
                familyRelationships={familyRelationships}
                events={events}
                onEventCreate={onEventUpdate}
                onEventUpdate={onEventUpdate}
                onEventDelete={onEventUpdate}
              />
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="h-full p-6">
              <div className="text-center py-12 text-gray-500">
                <span className="text-4xl mb-2 block">⏰</span>
                <p>Timeline view coming soon</p>
                <p className="text-sm">This will show a comprehensive timeline of all family events</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ familyMembers, familyRelationships, familyGroup })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Phase4FamilyTreeWindow;
