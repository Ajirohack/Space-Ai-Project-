import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { NextPage } from 'next';
import Head from 'next/head';

// Dashboard summary components
import SystemHealthCard from '../../components/dashboard/SystemHealthCard';
import ModuleStatusCard from '../../components/dashboard/ModuleStatusCard';
import RecentActivityCard from '../../components/dashboard/RecentActivityCard';
import StatsOverviewCard from '../../components/dashboard/StatsOverviewCard';

const DashboardPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Dashboard | Nexus Control Center</title>
      </Head>
      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Welcome to the Nexus Control Center dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <StatsOverviewCard title="Active Users" value="183" change="+12%" isPositive={true} />
          <StatsOverviewCard title="Active Modules" value="24" change="+3" isPositive={true} />
          <StatsOverviewCard title="Failed Requests" value="12" change="-8%" isPositive={true} />
          <StatsOverviewCard title="CPU Usage" value="38%" change="+5%" isPositive={false} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <SystemHealthCard />
          <ModuleStatusCard />
        </div>

        <div className="grid grid-cols-1 gap-5">
          <RecentActivityCard />
        </div>
      </DashboardLayout>
    </>
  );
};

export default DashboardPage;
