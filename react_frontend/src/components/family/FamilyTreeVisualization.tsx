// 2025-01-27: Creating FamilyTreeVisualization component for Phase 2 React frontend

import React from 'react';
import { FamilyTree, FamilyTreeNode } from '../../types';

interface FamilyTreeVisualizationProps {
  familyTree: FamilyTree | null;
  isLoading?: boolean;
  className?: string;
}

const FamilyTreeVisualization: React.FC<FamilyTreeVisualizationProps> = ({
  familyTree,
  isLoading = false,
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!familyTree) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No family tree data</h3>
          <p className="mt-1 text-sm text-gray-500">Generate a family tree to visualize relationships.</p>
        </div>
      </div>
    );
  }

  const renderTreeNode = (node: FamilyTreeNode, level: number = 0) => {
    const indent = level * 40;
    
    return (
      <div key={node.id} className="relative">
        {/* Connection Line */}
        {level > 0 && (
          <div 
            className="absolute left-0 top-0 w-px h-full bg-gray-300"
            style={{ left: `${indent - 20}px` }}
          />
        )}
        
        <div 
          className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm"
          style={{ marginLeft: `${indent}px` }}
        >
          {/* Profile Picture */}
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            {node.member.profile_picture ? (
              <img 
                src={node.member.profile_picture} 
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          
          {/* Member Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                User #{node.member.user}
              </h4>
              {node.member.is_admin && (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">
              {node.member.relationship} • Level {node.level}
            </p>
          </div>
          
          {/* Position Indicator */}
          <div className="text-xs text-gray-400">
            #{node.position}
          </div>
        </div>
        
        {/* Children */}
        {node.children.length > 0 && (
          <div className="mt-4">
            {node.children.map((childId) => {
              const childNode = familyTree.root_members.find(n => n.id === childId);
              return childNode ? renderTreeNode(childNode, level + 1) : null;
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Family Tree</h3>
            <p className="text-sm text-gray-600">
              {familyTree.root_members.length} root members • Max depth: {familyTree.max_depth}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>Created: {new Date(familyTree.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>Updated: {new Date(familyTree.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
        
        {/* Tree Visualization */}
        <div className="space-y-4">
          {familyTree.root_members.map((rootNode) => renderTreeNode(rootNode))}
        </div>
        
        {/* Legend */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Legend</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
              <span className="text-gray-600">Root Members</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-gray-600">Children</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
              <span className="text-gray-600">Admin Members</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyTreeVisualization;
