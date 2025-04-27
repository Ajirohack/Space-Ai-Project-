import React from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';

const SettingsPage = () => {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Settings Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure system settings, preferences, and integrations.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-gray-500 dark:text-gray-400">
            Settings management UI coming soon. Here you will be able to update system preferences,
            manage integrations, and configure advanced options.
          </p>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default SettingsPage;
