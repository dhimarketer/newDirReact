// 2025-01-27: Creating points system settings component for admin configuration

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Coins, Search, Image, Edit, Plus, Minus, Save, RefreshCw } from 'lucide-react';

interface PointsRule {
  id: number;
  action: string;
  points: number;
  description: string;
  is_active: boolean;
  threshold?: number; // Minimum points required for action
}

interface PointsSystemSettingsProps {}

const PointsSystemSettings: React.FC<PointsSystemSettingsProps> = () => {
  const [pointsRules, setPointsRules] = useState<PointsRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRule, setEditingRule] = useState<PointsRule | null>(null);

  // Default points rules - these would typically come from the backend
  const defaultRules: PointsRule[] = [
    {
      id: 1,
      action: 'basic_search',
      points: -1,
      description: 'Basic directory search',
      is_active: true,
      threshold: 0
    },
    {
      id: 2,
      action: 'image_search',
      points: -5,
      description: 'Image-based search (visual identification)',
      is_active: true,
      threshold: 10
    },
    {
      id: 3,
      action: 'add_record',
      points: 20,
      description: 'Add new directory record (after admin approval)',
      is_active: true,
      threshold: 0
    },
    {
      id: 4,
      action: 'edit_record',
      points: 10,
      description: 'Edit existing record (after admin approval)',
      is_active: true,
      threshold: 0
    },
    {
      id: 5,
      action: 'donate_points',
      points: 0,
      description: 'Donate points to another user',
      is_active: true,
      threshold: 50
    },
    {
      id: 6,
      action: 'receive_donation',
      points: 0,
      description: 'Receive points from another user',
      is_active: true,
      threshold: 0
    },
    {
      id: 7,
      action: 'referral_bonus',
      points: 25,
      description: 'Referral bonus for new user signup',
      is_active: true,
      threshold: 0
    },
    {
      id: 8,
      action: 'daily_login',
      points: 1,
      description: 'Daily login bonus',
      is_active: true,
      threshold: 0
    }
  ];

  useEffect(() => {
    loadPointsRules();
  }, []);

  const loadPointsRules = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await settingsService.getPointsRules();
      // setPointsRules(response.data);
      
      // For now, use default rules
      setPointsRules(defaultRules);
    } catch (error: any) {
      toast.error('Failed to load points rules');
      console.error('Error loading points rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRule = (rule: PointsRule) => {
    setEditingRule(rule);
  };

  const handleSaveRule = async (rule: PointsRule) => {
    try {
      // TODO: Replace with actual API call
      // await settingsService.updatePointsRule(rule.id, rule);
      
      setPointsRules(prev => 
        prev.map(r => r.id === rule.id ? rule : r)
      );
      
      setEditingRule(null);
      toast.success('Points rule updated successfully');
    } catch (error: any) {
      toast.error('Failed to update points rule');
      console.error('Error updating points rule:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingRule(null);
  };

  const handleToggleActive = async (ruleId: number) => {
    try {
      const rule = pointsRules.find(r => r.id === ruleId);
      if (!rule) return;

      const updatedRule = { ...rule, is_active: !rule.is_active };
      
      // TODO: Replace with actual API call
      // await settingsService.updatePointsRule(ruleId, updatedRule);
      
      setPointsRules(prev => 
        prev.map(r => r.id === ruleId ? updatedRule : r)
      );
      
      toast.success(`Rule ${updatedRule.is_active ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error('Failed to update rule status');
      console.error('Error updating rule status:', error);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'basic_search':
        return <Search className="w-5 h-5" />;
      case 'image_search':
        return <Image className="w-5 h-5" />;
      case 'add_record':
      case 'edit_record':
        return <Edit className="w-5 h-5" />;
      case 'donate_points':
      case 'receive_donation':
        return <Plus className="w-5 h-5" />;
      default:
        return <Coins className="w-5 h-5" />;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('search')) return 'text-blue-600 bg-blue-100';
    if (action.includes('add') || action.includes('edit')) return 'text-green-600 bg-green-100';
    if (action.includes('donate') || action.includes('receive')) return 'text-purple-600 bg-purple-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getPointsDisplay = (points: number) => {
    if (points > 0) {
      return <span className="text-green-600 font-medium">+{points}</span>;
    } else if (points < 0) {
      return <span className="text-red-600 font-medium">{points}</span>;
    }
    return <span className="text-gray-600">0</span>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Coins className="w-6 h-6 text-yellow-500 mr-3" />
            <h3 className="text-lg font-medium text-gray-900">Points System Settings</h3>
          </div>
          <button
            onClick={loadPointsRules}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Configure how points are awarded and deducted for various actions
        </p>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {pointsRules.map((rule) => (
            <div
              key={rule.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${getActionColor(rule.action)}`}>
                    {getActionIcon(rule.action)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-gray-900 capitalize">
                        {rule.action.replace('_', ' ')}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {rule.threshold !== undefined && rule.threshold > 0 
                          ? `(Min: ${rule.threshold} pts)`
                          : ''
                        }
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {rule.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {getPointsDisplay(rule.points)} points
                    </div>
                    <div className="text-xs text-gray-500">
                      {rule.points > 0 ? 'Earned' : rule.points < 0 ? 'Cost' : 'No change'}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(rule.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        rule.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </button>
                    
                    <button
                      onClick={() => handleEditRule(rule)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              {editingRule?.id === rule.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Points
                      </label>
                      <input
                        type="number"
                        value={editingRule.points}
                        onChange={(e) => setEditingRule({
                          ...editingRule,
                          points: parseInt(e.target.value) || 0
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Threshold (Min Points Required)
                      </label>
                      <input
                        type="number"
                        value={editingRule.threshold || 0}
                        onChange={(e) => setEditingRule({
                          ...editingRule,
                          threshold: parseInt(e.target.value) || 0
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="flex items-end space-x-2">
                      <button
                        onClick={() => handleSaveRule(editingRule)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Points System Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Earning Actions:</span>
              <span className="ml-2 font-medium text-green-600">
                {pointsRules.filter(r => r.points > 0 && r.is_active).length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Cost Actions:</span>
              <span className="ml-2 font-medium text-red-600">
                {pointsRules.filter(r => r.points < 0 && r.is_active).length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Active Rules:</span>
              <span className="ml-2 font-medium text-blue-600">
                {pointsRules.filter(r => r.is_active).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsSystemSettings;

