// 2024-12-28: Phase 4 - Media upload and management for family members and relationships

import React, { useState, useRef } from 'react';
import { FamilyMedia } from '../../types/family';

interface FamilyMediaManagerProps {
  personId?: number;
  relationshipId?: number;
  familyGroupId?: number;
  familyGroup?: any;
  familyMembers?: any[];
  familyRelationships?: any[];
  existingMedia?: FamilyMedia[];
  media?: FamilyMedia[];
  onMediaAdded?: (media: FamilyMedia) => void;
  onMediaRemoved?: (mediaId: number) => void;
  onMediaUpload?: (media: FamilyMedia) => void;
  onMediaDelete?: (mediaId: number) => void;
  disabled?: boolean;
}

const MEDIA_TYPES = [
  { value: 'photo', label: 'Photo', icon: '📷' },
  { value: 'document', label: 'Document', icon: '📄' },
  { value: 'certificate', label: 'Certificate', icon: '📜' },
  { value: 'video', label: 'Video', icon: '🎥' },
  { value: 'audio', label: 'Audio', icon: '🎵' },
  { value: 'other', label: 'Other', icon: '📎' },
];

export const FamilyMediaManager: React.FC<FamilyMediaManagerProps> = ({
  personId,
  relationshipId,
  familyGroupId,
  familyGroup,
  familyMembers = [],
  familyRelationships = [],
  existingMedia = [],
  media = [],
  onMediaAdded,
  onMediaRemoved,
  onMediaUpload,
  onMediaDelete,
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    media_type: 'photo' as const,
    is_public: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadForm(prev => ({
        ...prev,
        title: file.name.split('.')[0], // Use filename as default title
      }));
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description || '');
      formData.append('media_type', uploadForm.media_type);
      formData.append('is_public', uploadForm.is_public.toString());
      
      if (personId) formData.append('person', personId.toString());
      if (relationshipId) formData.append('relationship', relationshipId.toString());
      if (familyGroupId) formData.append('family_group', familyGroupId.toString());

      // TODO: Replace with actual API call
      const response = await fetch('/api/family/media/', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newMedia = await response.json();
        onMediaAdded?.(newMedia);
        setUploadForm({
          title: '',
          description: '',
          media_type: 'photo',
          is_public: false,
        });
        setShowUploadForm(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Error uploading media:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveMedia = async (mediaId: number) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/family/media/${mediaId}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onMediaRemoved?.(mediaId);
        onMediaDelete?.(mediaId);
      }
    } catch (error) {
      console.error('Error removing media:', error);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getMediaIcon = (mediaType: string) => {
    const type = MEDIA_TYPES.find(t => t.value === mediaType);
    return type?.icon || '📎';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Media Attachments</h3>
        <button
          type="button"
          onClick={() => setShowUploadForm(!showUploadForm)}
          disabled={disabled}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {showUploadForm ? 'Cancel' : 'Add Media'}
        </button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="p-4 bg-gray-50 rounded-md space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Media Type
              </label>
              <select
                value={uploadForm.media_type}
                onChange={(e) => setUploadForm(prev => ({ ...prev, media_type: e.target.value as any }))}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MEDIA_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter media title"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={uploadForm.description}
              onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
              disabled={disabled}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter media description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={uploadForm.is_public}
                onChange={(e) => setUploadForm(prev => ({ ...prev, is_public: e.target.checked }))}
                disabled={disabled}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Make this media public</span>
            </label>
            <button
              type="button"
              onClick={handleUpload}
              disabled={disabled || isUploading || !uploadForm.title}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-4">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search media..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Types</option>
            {MEDIA_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
            Filter
          </button>
        </div>
      </div>

      {/* Drag and Drop Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
        <div className="text-4xl mb-4">📎</div>
        <p className="text-lg font-medium text-gray-700 mb-2">Drag and drop files here</p>
        <p className="text-sm text-gray-500 mb-4">or click to browse files</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Upload Files
        </button>
      </div>

      {/* Media List */}
      {(media.length > 0 || existingMedia.length > 0) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(media.length > 0 ? media : existingMedia).map((mediaItem) => (
            <div key={mediaItem.id} className="border border-gray-200 rounded-md p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getMediaIcon(mediaItem.media_type)}</span>
                  <div>
                    <h4 className="font-medium text-gray-900 truncate">{mediaItem.title}</h4>
                    <p className="text-sm text-gray-500">{mediaItem.media_type}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveMedia(mediaItem.id)}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
              
              {mediaItem.description && (
                <p className="text-sm text-gray-600 mb-2">{mediaItem.description}</p>
              )}
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatFileSize(mediaItem.file_size)}</span>
                <span>{mediaItem.is_public ? 'Public' : 'Private'}</span>
              </div>
              
              <div className="mt-2">
                <a
                  href={mediaItem.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View/Download
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl mb-2 block">📎</span>
          <p>No media attachments yet</p>
          <p className="text-sm">Click "Add Media" to upload photos, documents, or other files</p>
        </div>
      )}
    </div>
  );
};

export default FamilyMediaManager;
