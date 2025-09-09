// 2025-01-29: NEW - Family details modal for viewing saved families
// This component simply opens the existing FamilyTreeWindow

import React from 'react';
import { FamilyGroup } from '../../types/family';
import FamilyTreeWindow from './FamilyTreeWindow';

interface FamilyDetailsModalProps {
  family: FamilyGroup | null;
  isOpen: boolean;
  onClose: () => void;
}

const FamilyDetailsModal: React.FC<FamilyDetailsModalProps> = ({ 
  family, 
  isOpen, 
  onClose 
}) => {
  if (!isOpen || !family) return null;

  // Simply render the existing FamilyTreeWindow with the family's address and island
  return (
    <FamilyTreeWindow
      key={`${family.address}-${family.island}`} // 2024-12-28: CRITICAL FIX - Force re-render when family changes
      isOpen={true}
      onClose={onClose}
      address={family.address || ''}
      island={family.island || ''}
      initialViewMode="tree"
    />
  );
};

export default FamilyDetailsModal;
