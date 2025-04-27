import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';

// Sample data for modules
const modulesData = [
  {
    id: 1,
    name: 'RAG System',
    status: 'active',
    version: '2.3.0',
    lastUpdated: '2025-04-24T15:30:00',
    type: 'internal',
  },
  {
    id: 2,
    name: 'AI Council',
    status: 'active',
    version: '1.8.5',
    lastUpdated: '2025-04-23T12:45:20',
    type: 'internal',
  },
  {
    id: 3,
    name: 'Tools & Packages',
    status: 'active',
    version: '3.1.2',
    lastUpdated: '2025-04-22T09:15:45',
    type: 'internal',
  },
  {
    id: 4,
    name: 'Telegram Bot Engine',
    status: 'inactive',
    version: '2.0.1',
    lastUpdated: '2025-04-20T17:22:10',
    type: 'external',
  },
  {
    id: 5,
    name: 'Mobile App Bridge',
    status: 'warning',
    version: '1.5.0',
    lastUpdated: '2025-04-21T11:30:15',
    type: 'external',
  },
  {
    id: 6,
    name: 'Browser Extension',
    status: 'active',
    version: '2.2.4',
    lastUpdated: '2025-04-19T14:40:30',
    type: 'external',
  },
  {
    id: 7,
    name: 'Nexus',
    status: 'active',
    version: '4.0.0',
    lastUpdated: '2025-04-18T10:05:50',
    type: 'external',
  },
  {
    id: 8,
    name: 'MIS',
    status: 'active',
    version: '1.1.3',
    lastUpdated: '2025-04-17T16:25:00',
    type: 'external',
  },
];

const ModulesPage: NextPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  // Filter and search modules
  const filteredModules = modulesData.filter(module => {
    const matchesSearch = module.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || module.status === filter || module.type === filter;
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ProtectedRoute requiredPermission="modules_manage">
      <Head>
        <title>Module Management | Nexus Control Center</title>
      </Head>
      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Module Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Manage and monitor all system modules</p>
        </div>

        {/* Filter and Search */}
        <div className="flex flex-col md:flex-row md:justify-between mb-6 gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'inactive'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              Inactive
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'warning'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              Warning
            </button>
            <button
              onClick={() => setFilter('internal')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'internal'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              Internal
            </button>
            <button
              onClick={() => setFilter('external')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'external'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              External
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search modules..."
              className="pl-10 pr-4 py-2 border rounded-md w-full md:w-64 lg:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500">🔍</span>
            </div>
          </div>
        </div>

        {/* Add Module Button */}
        <div className="flex justify-end mb-6">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center">
            <span className="mr-2">+</span> Add Module
          </button>
        </div>

        {/* Modules Table */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Module Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Version
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Last Updated
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredModules.map(module => (
                  <tr key={module.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {module.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          module.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : module.status === 'warning'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {module.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {module.version}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <span
                        className={`px-2 py-1 text-xs rounded-md ${
                          module.type === 'internal'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                        }`}
                      >
                        {module.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(module.lastUpdated)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4">
                        Edit
                      </button>
                      <button
                        className={`${
                          module.status === 'active'
                            ? 'text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300'
                            : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                        }`}
                      >
                        {module.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default ModulesPage;
