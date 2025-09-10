// 2024-12-28: Phase 4 - Life events timeline for family members

import React, { useState } from 'react';
import { FamilyEvent, FamilyMedia } from '../../types/family';

interface FamilyEventTimelineProps {
  personId: number;
  personName: string;
  events: FamilyEvent[];
  media: FamilyMedia[];
  onEventAdded?: (event: FamilyEvent) => void;
  onEventUpdated?: (event: FamilyEvent) => void;
  onEventRemoved?: (eventId: number) => void;
  disabled?: boolean;
}

const EVENT_TYPES = [
  { value: 'birth', label: 'Birth', icon: '👶', color: 'bg-green-100 text-green-800' },
  { value: 'death', label: 'Death', icon: '🕊️', color: 'bg-gray-100 text-gray-800' },
  { value: 'marriage', label: 'Marriage', icon: '💒', color: 'bg-pink-100 text-pink-800' },
  { value: 'divorce', label: 'Divorce', icon: '💔', color: 'bg-red-100 text-red-800' },
  { value: 'adoption', label: 'Adoption', icon: '👨‍👩‍👧‍👦', color: 'bg-blue-100 text-blue-800' },
  { value: 'graduation', label: 'Graduation', icon: '🎓', color: 'bg-purple-100 text-purple-800' },
  { value: 'migration', label: 'Migration', icon: '✈️', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'religious_ceremony', label: 'Religious Ceremony', icon: '🕌', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'anniversary', label: 'Anniversary', icon: '🎉', color: 'bg-orange-100 text-orange-800' },
  { value: 'other', label: 'Other', icon: '📅', color: 'bg-gray-100 text-gray-800' },
];

export const FamilyEventTimeline: React.FC<FamilyEventTimelineProps> = ({
  personId,
  personName,
  events,
  media,
  onEventAdded,
  onEventUpdated,
  onEventRemoved,
  disabled = false,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<FamilyEvent | null>(null);
  const [eventForm, setEventForm] = useState({
    event_type: 'birth' as const,
    title: '',
    description: '',
    event_date: '',
    location: '',
    related_person: undefined as number | undefined,
    is_verified: false,
    source: '',
    notes: '',
  });

  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  );

  const getEventTypeInfo = (eventType: string) => {
    return EVENT_TYPES.find(type => type.value === eventType) || EVENT_TYPES[EVENT_TYPES.length - 1];
  };

  const handleAddEvent = async () => {
    try {
      const newEvent: FamilyEvent = {
        id: 0, // Will be set by backend
        person: personId,
        ...eventForm,
        media_attachments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // TODO: Replace with actual API call
      const response = await fetch('/api/family/events/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEvent),
      });

      if (response.ok) {
        const createdEvent = await response.json();
        onEventAdded?.(createdEvent);
        setEventForm({
          event_type: 'birth',
          title: '',
          description: '',
          event_date: '',
          location: '',
          related_person: undefined,
          is_verified: false,
          source: '',
          notes: '',
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const handleUpdateEvent = async (event: FamilyEvent) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/family/events/${event.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (response.ok) {
        const updatedEvent = await response.json();
        onEventUpdated?.(updatedEvent);
        setEditingEvent(null);
      }
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleRemoveEvent = async (eventId: number) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/family/events/${eventId}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onEventRemoved?.(eventId);
      }
    } catch (error) {
      console.error('Error removing event:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getEventMedia = (event: FamilyEvent) => {
    return (media || []).filter(m => event.media_attachments?.includes(m.id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Life Events - {personName}
        </h3>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={disabled}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {showAddForm ? 'Cancel' : 'Add Event'}
        </button>
      </div>

      {/* Add Event Form */}
      {showAddForm && (
        <div className="p-4 bg-gray-50 rounded-md space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type
              </label>
              <select
                value={eventForm.event_type}
                onChange={(e) => setEventForm(prev => ({ ...prev, event_type: e.target.value as any }))}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {EVENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Date
              </label>
              <input
                type="date"
                value={eventForm.event_date}
                onChange={(e) => setEventForm(prev => ({ ...prev, event_date: e.target.value }))}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={eventForm.title}
              onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter event title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={eventForm.description}
              onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
              disabled={disabled}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter event description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={eventForm.location}
                onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter event location"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source
              </label>
              <input
                type="text"
                value={eventForm.source}
                onChange={(e) => setEventForm(prev => ({ ...prev, source: e.target.value }))}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Source of information"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={eventForm.is_verified}
                onChange={(e) => setEventForm(prev => ({ ...prev, is_verified: e.target.checked }))}
                disabled={disabled}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Verified event</span>
            </label>
            <button
              type="button"
              onClick={handleAddEvent}
              disabled={disabled || !eventForm.title || !eventForm.event_date}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Event
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {sortedEvents.length > 0 ? (
        <div className="space-y-4">
          {sortedEvents.map((event) => {
            const eventTypeInfo = getEventTypeInfo(event.event_type);
            const eventMedia = getEventMedia(event);
            
            return (
              <div key={event.id} className="flex space-x-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${eventTypeInfo.color}`}>
                    {eventTypeInfo.icon}
                  </div>
                  <div className="w-0.5 h-16 bg-gray-300 mt-2"></div>
                </div>

                {/* Event content */}
                <div className="flex-1 pb-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-500">{formatDate(event.event_date)}</p>
                        {event.location && (
                          <p className="text-sm text-gray-600">📍 {event.location}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {event.is_verified && (
                          <span className="text-green-600 text-sm">✓ Verified</span>
                        )}
                        {!disabled && (
                          <div className="flex space-x-1">
                            <button
                              type="button"
                              onClick={() => setEditingEvent(event)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveEvent(event.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-gray-700 mb-3">{event.description}</p>
                    )}

                    {event.source && (
                      <p className="text-xs text-gray-500 mb-2">Source: {event.source}</p>
                    )}

                    {event.notes && (
                      <p className="text-xs text-gray-600 italic">{event.notes}</p>
                    )}

                    {/* Event media */}
                    {eventMedia.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600 mb-2">Attachments:</p>
                        <div className="flex space-x-2">
                          {eventMedia.map((media) => (
                            <a
                              key={media.id}
                              href={media.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              {getEventTypeInfo(media.media_type).icon} {media.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl mb-2 block">📅</span>
          <p>No life events recorded yet</p>
          <p className="text-sm">Click "Add Event" to start documenting important milestones</p>
        </div>
      )}
    </div>
  );
};

export default FamilyEventTimeline;
