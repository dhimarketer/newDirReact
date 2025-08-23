// 2025-01-27: Creating mobile menu overlay component for mobile navigation

import React from 'react';
import { X } from 'lucide-react';
import { useUI } from '../../store/uiStore';
import Sidebar from './Sidebar';

const MobileMenu: React.FC = () => {
  const { mobileMenuOpen, setMobileMenuOpen } = useUI();

  if (!mobileMenuOpen) {
    return null;
  }

  return (
    <div className="lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40"
        onClick={() => setMobileMenuOpen(false)}
      />
      
      {/* Mobile Menu */}
      <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-xs bg-white shadow-xl">
        <Sidebar mobile={true} />
      </div>
    </div>
  );
};

export default MobileMenu;
