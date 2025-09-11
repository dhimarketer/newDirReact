// 2025-01-10: Member search modal - redirects to main search page with member selection mode
// 2025-01-10: UPDATED - Uses existing search page instead of creating duplicate search form

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneBookEntry } from '../../types/directory';

interface MemberSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMember: (member: PhoneBookEntry) => void;
  currentAddress: string;
  currentIsland: string;
  familyName?: string; // 2025-01-10: NEW - Family name for context
  excludePids?: number[]; // PIDs to exclude from search results
}

const MemberSearchModal: React.FC<MemberSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectMember,
  currentAddress,
  currentIsland,
  familyName,
  excludePids = []
}) => {
  const navigate = useNavigate();

  // Redirect to search page with member selection mode
  useEffect(() => {
    if (isOpen) {
      // Store the selection callback and context in sessionStorage
      // This will be picked up by the search page
      sessionStorage.setItem('memberSelectionMode', 'true');
      sessionStorage.setItem('memberSelectionCallback', JSON.stringify({
        currentAddress,
        currentIsland,
        familyName,
        excludePids,
        sourceFamilyEditor: true // 2025-01-10: NEW - Flag to indicate this came from family editor
      }));
      
      // Navigate to search page
      navigate('/search');
      
      // Close the modal since we're navigating away
      onClose();
    }
  }, [isOpen, navigate, onClose, currentAddress, currentIsland, excludePids]);

  // This component doesn't render anything - it just redirects
  return null;
};

export default MemberSearchModal;
