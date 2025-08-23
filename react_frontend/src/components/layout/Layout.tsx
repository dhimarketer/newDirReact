// 2025-01-27: Creating simplified Layout component to reduce errors

import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileMenu from './MobileMenu';
import Breadcrumb from '../common/Breadcrumb';
import FloatingActionButton from '../common/FloatingActionButton';
import { useUI } from '../../store/uiStore';

const Layout: React.FC = () => {
  const { sidebarOpen } = useUI();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />
      
      {/* Mobile Menu Overlay */}
      <MobileMenu />
      
      {/* Main Content with Sidebar */}
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
          <main className="p-4">
            {/* Breadcrumb Navigation */}
            <div className="mb-4">
              <Breadcrumb />
            </div>
            
            {/* Page Content */}
            <Outlet />
          </main>
        </div>
      </div>
      
      {/* Floating Action Button for Mobile */}
      <FloatingActionButton />
    </div>
  );
};

export default Layout;
