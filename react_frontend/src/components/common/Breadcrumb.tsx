// 2025-01-27: Creating breadcrumb navigation component for better page navigation

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  href: string;
  current?: boolean;
}

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  
  // Generate breadcrumb items based on current location
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', href: '/' }
    ];

    if (pathSegments.length === 0) {
      return breadcrumbs;
    }

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Convert segment to readable name
      let name = segment;
      if (segment === 'premium-image-search') {
        name = 'Image Search';
      } else if (segment === 'search') {
        name = 'Search';
      } else if (segment === 'directory') {
        name = 'Directory';
      } else if (segment === 'family') {
        name = 'Family';
      } else if (segment === 'admin') {
        name = 'Admin';
      } else if (segment === 'settings') {
        name = 'Settings';
      } else if (segment === 'profile') {
        name = 'Profile';
      }

      breadcrumbs.push({
        name,
        href: currentPath,
        current: index === pathSegments.length - 1
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
            )}
            {item.current ? (
              <span className="text-sm font-medium text-gray-900">
                {item.name}
              </span>
            ) : (
              <Link
                to={item.href}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
              >
                {item.href === '/' ? (
                  <Home className="h-4 w-4 mr-1" />
                ) : null}
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
