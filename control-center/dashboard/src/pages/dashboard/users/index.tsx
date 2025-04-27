import React, { useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import {
  UserCircleIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
  dateCreated: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

const UsersPage = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Mock user data
  const [users, setUsers] = useState<User[]>([
    {
      id: 'u1',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      role: 'Administrator',
      status: 'active',
      lastLogin: '2025-04-24 09:15',
      dateCreated: '2024-11-15',
    },
    {
      id: 'u2',
      name: 'Jamie Smith',
      email: 'jamie@example.com',
      role: 'Developer',
      status: 'active',
      lastLogin: '2025-04-23 14:30',
      dateCreated: '2025-01-03',
    },
    {
      id: 'u3',
      name: 'Riley Chen',
      email: 'riley@example.com',
      role: 'Analyst',
      status: 'active',
      lastLogin: '2025-04-20 11:45',
      dateCreated: '2025-02-18',
    },
    {
      id: 'u4',
      name: 'Taylor Wong',
      email: 'taylor@example.com',
      role: 'Developer',
      status: 'inactive',
      lastLogin: '2025-03-15 16:20',
      dateCreated: '2025-01-10',
    },
    {
      id: 'u5',
      name: 'Jordan Lee',
      email: 'jordan@example.com',
      role: 'Content Manager',
      status: 'pending',
      lastLogin: '-',
      dateCreated: '2025-04-22',
    },
  ]);

  // Mock role data
  const [roles, setRoles] = useState<Role[]>([
    {
      id: 'r1',
      name: 'Administrator',
      description: 'Full system access and control',
      permissions: [
        'users_manage',
        'roles_manage',
        'system_configure',
        'modules_manage',
        'logs_view',
        'metrics_view',
        'api_access',
      ],
    },
    {
      id: 'r2',
      name: 'Developer',
      description: 'Access to develop and test modules',
      permissions: ['modules_view', 'modules_develop', 'logs_view', 'metrics_view', 'api_access'],
    },
    {
      id: 'r3',
      name: 'Analyst',
      description: 'Access to view data and analytics',
      permissions: ['logs_view', 'metrics_view', 'api_access_read'],
    },
    {
      id: 'r4',
      name: 'Content Manager',
      description: 'Manage content and knowledge base',
      permissions: ['content_manage', 'logs_view_limited', 'api_access_limited'],
    },
  ]);

  // Filter users based on search term
  const filteredUsers = users.filter(
    user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter roles based on search term
  const filteredRoles = roles.filter(
    role =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Delete user
  const deleteUser = (id: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setUsers(users.filter(user => user.id !== id));
    }
  };

  // Delete role
  const deleteRole = (id: string) => {
    if (
      confirm(
        'Are you sure you want to delete this role? Users with this role will need to be reassigned.'
      )
    ) {
      setRoles(roles.filter(role => role.id !== id));
    }
  };

  // Toggle user status
  const toggleUserStatus = (id: string) => {
    setUsers(
      users.map(user => {
        if (user.id === id) {
          const newStatus = user.status === 'active' ? 'inactive' : 'active';
          return { ...user, status: newStatus };
        }
        return user;
      })
    );
  };

  // Get status badge style
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage users, roles, and permissions for system access.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <ul className="flex flex-wrap -mb-px">
            <li className="mr-2">
              <button
                className={`inline-block p-4 rounded-t-lg border-b-2 ${
                  activeTab === 'users'
                    ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                    : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('users')}
              >
                Users
              </button>
            </li>
            <li className="mr-2">
              <button
                className={`inline-block p-4 rounded-t-lg border-b-2 ${
                  activeTab === 'roles'
                    ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                    : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('roles')}
              >
                Roles & Permissions
              </button>
            </li>
          </ul>
        </div>

        {/* Users Tab Content */}
        {activeTab === 'users' && (
          <>
            {/* Control panel */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex flex-1 items-center">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search users..."
                      className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddUser(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add User
                  </button>
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                    Export
                  </button>
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Import
                  </button>
                </div>
              </div>
            </div>

            {/* User table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      User
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Role
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
                      Last Login
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Date Created
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
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                            <UserCircleIcon className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">{user.role}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                            user.status
                          )}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.lastLogin}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.dateCreated}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => toggleUserStatus(user.id)}
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              user.status === 'active'
                                ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800'
                                : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800'
                            }`}
                          >
                            {user.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              // This would open an edit user modal in a real app
                              alert(`Edit user ${user.name}`);
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Roles Tab Content */}
        {activeTab === 'roles' && (
          <>
            {/* Control panel */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex flex-1 items-center">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search roles..."
                      className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  onClick={() => setShowAddRole(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Role
                </button>
              </div>
            </div>

            {/* Roles list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredRoles.map(role => (
                <div
                  key={role.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {role.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {role.description}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          // This would open an edit role modal in a real app
                          alert(`Edit role ${role.name}`);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => deleteRole(role.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Permissions:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((permission, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                        >
                          {permission.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-right">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {users.filter(user => user.role === role.name).length} users with this role
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Add User Modal */}
        {showAddUser && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setShowAddUser(false)}
              ></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  Add New User
                </h3>
                <form className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="role"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Role
                    </label>
                    <select
                      name="role"
                      id="role"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    >
                      {roles.map(role => (
                        <option key={role.id} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="sendInvite"
                        id="sendInvite"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="sendInvite"
                        className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                      >
                        Send invitation email
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddUser(false)}
                      className="inline-flex justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Role Modal */}
        {showAddRole && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setShowAddRole(false)}
              ></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  Add New Role
                </h3>
                <form className="space-y-4">
                  <div>
                    <label
                      htmlFor="roleName"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Role Name
                    </label>
                    <input
                      type="text"
                      name="roleName"
                      id="roleName"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="roleDescription"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Description
                    </label>
                    <textarea
                      name="roleDescription"
                      id="roleDescription"
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Permissions
                    </label>

                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        User Management
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="users_view"
                            name="permissions"
                            value="users_view"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="users_view"
                            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                          >
                            View Users
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="users_manage"
                            name="permissions"
                            value="users_manage"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="users_manage"
                            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                          >
                            Manage Users
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="roles_manage"
                            name="permissions"
                            value="roles_manage"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="roles_manage"
                            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                          >
                            Manage Roles
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        System
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="system_configure"
                            name="permissions"
                            value="system_configure"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="system_configure"
                            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                          >
                            Configure System
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="modules_view"
                            name="permissions"
                            value="modules_view"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="modules_view"
                            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                          >
                            View Modules
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="modules_manage"
                            name="permissions"
                            value="modules_manage"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="modules_manage"
                            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                          >
                            Manage Modules
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Monitoring
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="logs_view"
                            name="permissions"
                            value="logs_view"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="logs_view"
                            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                          >
                            View Logs
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="metrics_view"
                            name="permissions"
                            value="metrics_view"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="metrics_view"
                            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                          >
                            View Metrics
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        API
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="api_access"
                            name="permissions"
                            value="api_access"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="api_access"
                            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                          >
                            Full API Access
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="api_access_read"
                            name="permissions"
                            value="api_access_read"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="api_access_read"
                            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                          >
                            Read-only API Access
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddRole(false)}
                      className="inline-flex justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Create Role
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default UsersPage;
