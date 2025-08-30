// 2025-01-29: EditDirectoryEntryModal component for editing existing directory entries
// Creates pending changes that require admin approval

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/authStore';
import { directoryService } from '../../services/directoryService';
import { PhoneBookEntry } from '../../types/directory';
import { toast } from 'react-hot-toast';
import islandService from '../../services/islandService';

interface EditDirectoryEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: PhoneBookEntry | null;
  onSuccess?: () => void;
}

interface FormData {
  nid: string;
  name: string;
  contact: string;
  address: string;
  atoll: string;
  island: string;
  street: string;
  ward: string;
  party: string;
  DOB: string;
  status: 'active' | 'deceased' | 'unlisted' | 'inactive' | 'outdated' | '';  // 2025-01-29: ENHANCED - Standardized status choices
  is_unlisted: boolean;  // 2025-01-29: NEW - Boolean field to mark entries as unlisted
  remark: string;
  email: string;
  gender: string;
  extra: string;
  profession: string;
  pep_status: string;
}

const EditDirectoryEntryModal: React.FC<EditDirectoryEntryModalProps> = ({
  isOpen,
  onClose,
  entry,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [atolls, setAtolls] = useState<Array<{ id: number; name: string }>>([]);
  const [islands, setIslands] = useState<Array<{ id: number; name: string; atoll: string }>>([]);
  const [parties, setParties] = useState<Array<{ id: number; name: string }>>([]);

  const [formData, setFormData] = useState<FormData>({
    nid: '',
    name: '',
    contact: '',
    address: '',
    atoll: '',
    island: '',
    street: '',
    ward: '',
    party: '',
    DOB: '',
    status: '',
    is_unlisted: false,  // 2025-01-29: NEW - Boolean field to mark entries as unlisted
    remark: '',
    email: '',
    gender: '',
    extra: '',
    profession: '',
    pep_status: '',
  });

  // Load reference data and populate form when entry changes
  useEffect(() => {
    if (isOpen) {
      loadReferenceData();
      if (entry) {
        populateForm(entry);
      }
    }
  }, [isOpen, entry]);

  const loadReferenceData = async () => {
    try {
      const [atollsResponse, islandsData, partiesData] = await Promise.all([
        fetch('/api/atolls/').then(res => res.json()),
        islandService.getIslands(),
        directoryService.getParties(),
      ]);
      
      // Extract atolls data from the response structure
      const atollsData = atollsResponse.success ? atollsResponse.atolls : [];
      
      console.log('Loaded reference data:', { atollsData, islandsData, partiesData });
      
      setAtolls(atollsData);
      setIslands(islandsData);
      setParties(partiesData);
    } catch (error) {
      console.error('Failed to load reference data:', error);
      toast.error('Failed to load reference data');
    }
  };

  const populateForm = (entry: PhoneBookEntry) => {
    setFormData({
      nid: entry.nid || '',
      name: entry.name || '',
      contact: entry.contact || '',
      address: entry.address || '',
      atoll: entry.atoll || '',
      island: entry.island || '',
      street: entry.street || '',
      ward: entry.ward || '',
      party: entry.party || '',
      DOB: entry.DOB || '',
      status: entry.status || '',
      is_unlisted: entry.is_unlisted || false,  // 2025-01-29: NEW - Boolean field to mark entries as unlisted
      remark: entry.remark || '',
      email: entry.email || '',
      gender: entry.gender || '',
      extra: entry.extra || '',
      profession: entry.profession || '',
      pep_status: entry.pep_status || '',
    });
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.contact.trim()) {
      newErrors.contact = 'Contact number is required';
    } else if (!/^\d{7,}$/.test(formData.contact)) {
      newErrors.contact = 'Contact number must be at least 7 digits';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.DOB && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(formData.DOB)) {
      newErrors.DOB = 'Please enter a valid date (YYYY-MM-DD or YYYY)';
    }
    
    // 2025-01-29: ENHANCED - Validate status field
    if (!formData.status.trim()) {
      newErrors.status = 'Status is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !entry) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Update the entry through the API (this will create a pending change)
      // 2025-01-29: ENHANCED - Convert empty status to undefined for API compatibility
      const updateData = {
        ...formData,
        status: formData.status || undefined,  // Convert empty string to undefined
      };
      await directoryService.updateEntry(entry.pid, updateData);
      
      toast.success('Entry update submitted successfully! It will be reviewed by an administrator.');
      onSuccess?.();
      handleClose();
      
    } catch (error: any) {
      console.error('Failed to submit entry update:', error);
      toast.error(error.message || 'Failed to submit entry update. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      nid: '',
      name: '',
      contact: '',
      address: '',
      atoll: '',
      island: '',
      street: '',
      ward: '',
      party: '',
      DOB: '',
      status: '',
      is_unlisted: false,  // 2025-01-29: NEW - Boolean field to mark entries as unlisted
      remark: '',
      email: '',
      gender: '',
      extra: '',
      profession: '',
      pep_status: '',
    });
    setErrors({});
    setIsSubmitting(false);
  };

  // Filter islands based on selected atoll
  // Extract atoll code from atoll name (e.g., "Atoll AA" -> "AA")
  const getAtollCode = (atollName: string) => {
    if (atollName.startsWith('Atoll ')) {
      return atollName.substring(6); // Remove "Atoll " prefix
    }
    return atollName;
  };
  
  const filteredIslands = formData.atoll 
    ? islands.filter(island => island.atoll === getAtollCode(formData.atoll))
    : [];

  if (!isOpen || !entry) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 add-entry-page">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="sticky top-0 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200 px-8 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-orange-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold text-gray-900">Edit Directory Entry</h2>
                <p className="text-orange-700 text-lg">Suggest corrections for existing data</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-10 h-10 bg-white/80 hover:bg-white rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all duration-200 flex-shrink-0 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-4 p-4 bg-orange-100/80 rounded-xl border border-orange-300">
            <p className="text-orange-800 font-medium">
              <svg className="w-5 h-5 inline mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Entry ID: {entry.pid} • Updates require administrator approval before being applied.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8" style={{ maxWidth: '100%' }}>
          {/* Basic Information */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-8 rounded-xl border border-blue-200" style={{ maxWidth: '100%' }}>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-10 h-10 bg-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Basic Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ maxWidth: '100%' }}>
              <div style={{ maxWidth: '100%' }}>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-3">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Full name"
                  disabled={isSubmitting}
                  style={{ maxWidth: '100%' }}
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div style={{ maxWidth: '100%' }}>
                <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-3">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="contact"
                  value={formData.contact}
                  onChange={(e) => handleInputChange('contact', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 ${
                    errors.contact ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="7-digit contact number"
                  disabled={isSubmitting}
                  style={{ maxWidth: '100%' }}
                />
                {errors.contact && (
                  <p className="mt-2 text-sm text-red-600">{errors.contact}</p>
                )}
              </div>

              <div style={{ maxWidth: '100%' }}>
                <label htmlFor="nid" className="block text-sm font-medium text-gray-700 mb-3">
                  NID Number
                </label>
                <input
                  type="text"
                  id="nid"
                  value={formData.nid}
                  onChange={(e) => handleInputChange('nid', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                  placeholder="National ID number"
                  disabled={isSubmitting}
                  style={{ maxWidth: '100%' }}
                />
              </div>

              <div style={{ maxWidth: '100%' }}>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-3">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="email@example.com"
                  disabled={isSubmitting}
                  style={{ maxWidth: '100%' }}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div style={{ maxWidth: '100%' }}>
                <label htmlFor="DOB" className="block text-sm font-medium text-gray-700 mb-3">
                  Date of Birth
                </label>
                <input
                  type="text"
                  id="DOB"
                  value={formData.DOB}
                  onChange={(e) => handleInputChange('DOB', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 ${
                    errors.DOB ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="YYYY-MM-DD or YYYY"
                  disabled={isSubmitting}
                  style={{ maxWidth: '100%' }}
                />
                {errors.DOB && (
                  <p className="mt-2 text-sm text-red-600">{errors.DOB}</p>
                )}
              </div>

              <div style={{ maxWidth: '100%' }}>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-3">
                  Gender
                </label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                  disabled={isSubmitting}
                  style={{ maxWidth: '100%' }}
                >
                  <option value="">Select gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-xl border border-green-200" style={{ maxWidth: '100%' }}>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-10 h-10 bg-green-200 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Address Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ maxWidth: '100%' }}>
              <div style={{ maxWidth: '100%' }}>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-3">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Street address"
                  disabled={isSubmitting}
                  style={{ maxWidth: '100%' }}
                />
                {errors.address && (
                  <p className="mt-2 text-sm text-red-600">{errors.address}</p>
                )}
              </div>

              <div style={{ maxWidth: '100%' }}>
                <label htmlFor="atoll" className="block text-sm font-medium text-gray-700 mb-3">
                  Atoll
                </label>
                <select
                  id="atoll"
                  value={formData.atoll}
                  onChange={(e) => {
                    handleInputChange('atoll', e.target.value);
                    handleInputChange('island', ''); // Reset island when atoll changes
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                  disabled={isSubmitting}
                  style={{ maxWidth: '100%' }}
                >
                  <option value="">Select atoll</option>
                  {atolls.map(atoll => (
                    <option key={atoll.id} value={atoll.name}>{atoll.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ maxWidth: '100%' }}>
                <label htmlFor="island" className="block text-sm font-medium text-gray-700 mb-3">
                  Island
                </label>
                <select
                  id="island"
                  value={formData.island}
                  onChange={(e) => handleInputChange('island', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                  disabled={isSubmitting || !formData.atoll}
                  style={{ maxWidth: '100%' }}
                >
                  <option value="">
                    {formData.atoll ? 'Select island' : 'Select atoll first'}
                  </option>
                  {filteredIslands.map(island => (
                    <option key={island.id} value={island.name}>{island.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ maxWidth: '100%' }}>
                <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-3">
                  Street
                </label>
                <input
                  type="text"
                  id="street"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                  placeholder="Street name"
                  disabled={isSubmitting}
                  style={{ maxWidth: '100%' }}
                />
              </div>

              <div style={{ maxWidth: '100%' }}>
                <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-3">
                  Ward
                </label>
                <input
                  type="text"
                  id="ward"
                  value={formData.ward}
                  onChange={(e) => handleInputChange('ward', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                  placeholder="Ward number"
                  disabled={isSubmitting}
                  style={{ maxWidth: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-xl border border-purple-200" style={{ maxWidth: '100%' }}>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-10 h-10 bg-purple-200 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Additional Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ maxWidth: '100%' }}>
              <div style={{ maxWidth: '100%' }}>
                <label htmlFor="party" className="block text-sm font-medium text-gray-700 mb-3">
                  Political Party
                </label>
                <select
                  id="party"
                  value={formData.party}
                  onChange={(e) => handleInputChange('party', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                  disabled={isSubmitting}
                  style={{ maxWidth: '100%' }}
                >
                  <option value="">Select party</option>
                  {parties.map(party => (
                    <option key={party.id} value={party.name}>{party.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ maxWidth: '100%' }}>
                <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-3">
                  Profession
                </label>
                <input
                  type="text"
                  id="profession"
                  value={formData.profession}
                  onChange={(e) => handleInputChange('profession', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                  placeholder="Job or profession"
                  disabled={isSubmitting}
                  style={{ maxWidth: '100%' }}
                />
              </div>

              <div style={{ maxWidth: '100%' }}>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-3">
                  Status <span className="text-orange-600">*</span>
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                  disabled={isSubmitting}
                  style={{ maxWidth: '100%' }}
                >
                  <option value="">Select status...</option>
                  <option value="active">Active</option>
                  <option value="deceased">Deceased</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="inactive">Inactive</option>
                  <option value="outdated">Outdated</option>
                </select>
                {errors.status && (
                  <div className="text-red-500 text-sm mt-1">{errors.status}</div>
                )}
              </div>

              <div style={{ maxWidth: '100%' }}>
                <label htmlFor="is_unlisted" className="block text-sm font-medium text-gray-700 mb-3">
                  <input
                    type="checkbox"
                    id="is_unlisted"
                    checked={formData.is_unlisted}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_unlisted: e.target.checked }))}
                    className="mr-3 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                    disabled={isSubmitting}
                  />
                  Mark as Unlisted (hidden from public search)
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Unlisted entries will be hidden from public search results and require admin approval.
                </p>
              </div>

              <div style={{ maxWidth: '100%' }}>
                <label htmlFor="pep_status" className="block text-sm font-medium text-gray-700 mb-3">
                  PEP Status
                </label>
                <input
                  type="text"
                  id="pep_status"
                  value={formData.pep_status}
                  onChange={(e) => handleInputChange('pep_status', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                  placeholder="Politically exposed person status"
                  disabled={isSubmitting}
                  style={{ maxWidth: '100%' }}
                />
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="remark" className="block text-sm font-medium text-gray-700 mb-3">
                Remarks
              </label>
              <textarea
                id="remark"
                value={formData.remark}
                onChange={(e) => handleInputChange('remark', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                placeholder="Additional notes or remarks"
                disabled={isSubmitting}
                style={{ maxWidth: '100%' }}
              />
            </div>

            <div className="mt-6">
              <label htmlFor="extra" className="block text-sm font-medium text-gray-700 mb-3">
                Extra Information
              </label>
              <textarea
                id="extra"
                value={formData.extra}
                onChange={(e) => handleInputChange('extra', e.target.value)}
                rows={2}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                placeholder="Any additional information"
                disabled={isSubmitting}
                style={{ maxWidth: '100%' }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:from-orange-700 hover:to-amber-700 transition-all duration-200 disabled:opacity-50 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Changes for Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDirectoryEntryModal;
