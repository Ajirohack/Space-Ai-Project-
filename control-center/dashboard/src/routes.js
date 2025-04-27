import React from 'react';
import { Navigate } from 'react-router-dom';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import MainLayout from './layouts/MainLayout';

// Components
import Dashboard from './views/Dashboard';
import UserManagement from './views/UserManagement';
import ModulesOverview from './views/ModulesOverview';
import ToolsBrowser from './components/tools/ToolsBrowser';
import SystemSettings from './views/SystemSettings';
import Login from './views/auth/Login';
import NotFound from './views/errors/NotFound';

const routes = [
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      { path: '', element: <Navigate to="/dashboard" /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'users', element: <UserManagement /> },
      { path: 'modules', element: <ModulesOverview /> },
      { path: 'tools', element: <ToolsBrowser /> },
      { path: 'settings', element: <SystemSettings /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: '/auth',
    element: <MainLayout />,
    children: [
      { path: 'login', element: <Login /> },
      { path: '*', element: <Navigate to="/auth/login" /> },
    ],
  },
];

export default routes;
