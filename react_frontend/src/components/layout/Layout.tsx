// 2025-01-27: Creating simplified Layout component to reduce errors
// 2025-01-27: Updated to use new styling approach and improved layout structure
// 2025-01-27: Refactored to use Pico.css for lightweight, responsive, and professional styling
// 2025-01-27: Fixed sidebar positioning and layout overlap issues

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
    <div className="app-container">
      {/* Header */}
      <Header />
      
      {/* Mobile Menu Overlay */}
      <MobileMenu />
      
      {/* Main Content with Sidebar */}
      <div className="layout-container">
        {/* Sidebar */}
        <aside className={`sidebar-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <Sidebar />
        </aside>
        
        {/* Main Content Area */}
        <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <div className="content-wrapper">
            {/* Breadcrumb Navigation */}
            <nav className="mb-3" aria-label="Breadcrumb">
              <Breadcrumb />
            </nav>
            
            {/* Page Content */}
            <article className="fade-in">
              <Outlet />
            </article>
          </div>
        </main>
      </div>
      
      {/* Floating Action Button for Mobile */}
      <FloatingActionButton />
    </div>
  );
};

export default Layout;
