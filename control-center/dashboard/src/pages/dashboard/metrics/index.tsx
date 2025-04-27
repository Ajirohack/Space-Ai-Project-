import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { 
  ArrowPathIcon,
  ClockIcon,
  ServerIcon 
} from '@heroicons/react/24/outline';

// Mock data generation for charts - in a real app this would come from API
const generateTimeSeriesData = (points: number, baseline: number, variance: number) => {
  const now = new Date();
  return Array.from({ length: points }).map((_, i) => {
    const timestamp = new Date(now.getTime() - (points - i) * 60000); // 1 minute intervals
    const value = baseline + (Math.random() * variance * 2 - variance);
    return {
      timestamp: timestamp.toISOString(),
      value: parseFloat(value.toFixed(2))
    };
  });
};

const MetricsPage = () => {
  const [timeRange, setTimeRange] = useState('1h');
  const [refreshInterval, setRefreshInterval] = useState<number | null>(30); // in seconds, null means no auto-refresh
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  
  // Mock metrics data - in a real app this would come from API
  const [metricsData, setMetricsData] = useState({
    cpu: {
      usage: 42,
      trend: generateTimeSeriesData(60, 40, 15),
    },
    memory: {
      usage: 64,
      total: 32, // GB
      trend: generateTimeSeriesData(60, 65, 10),
    },
    disk: {
      usage: 58,
      total: 500, // GB
      trend: generateTimeSeriesData(60, 55, 5),
    },
    network: {
      incoming: 24.5, // MB/s
      outgoing: 12.2, // MB/s
      trend: generateTimeSeriesData(60, 20, 10),
    },
    services: [
      { name: 'API Gateway', status: 'healthy', responseTime: 120 }, // ms
      { name: 'Authentication Service', status: 'healthy', responseTime: 85 },
      { name: 'RAG System', status: 'degraded', responseTime: 350 },
      { name: 'AI Council', status: 'healthy', responseTime: 210 },
      { name: 'Database', status: 'healthy', responseTime: 45 },
      { name: 'Redis Cache', status: 'healthy', responseTime: 15 },
    ],
    models: [
      { name: 'GPT-5', status: 'active', latency: 230, usage: 78 },
      { name: 'Claude 3', status: 'active', latency: 310, usage: 45 },
      { name: 'Llama 3', status: 'standby', latency: 180, usage: 12 },
      { name: 'Gemini Pro', status: 'active', latency: 270, usage: 65 },
    ]
  });

  // Function to refresh metrics data
  const refreshMetrics = () => {
    // In a real app, this would fetch data from the API
    setMetricsData({
      cpu: {
        usage: Math.floor(Math.random() * 30) + 30, // Between 30-60%
        trend: generateTimeSeriesData(60, 40, 15),
      },
      memory: {
        usage: Math.floor(Math.random() * 20) + 55, // Between 55-75%
        total: 32,
        trend: generateTimeSeriesData(60, 65, 10),
      },
      disk: {
        usage: Math.floor(Math.random() * 10) + 55, // Between 55-65%
        total: 500,
        trend: generateTimeSeriesData(60, 55, 5),
      },
      network: {
        incoming: parseFloat((Math.random() * 10 + 20).toFixed(1)), // Between 20-30 MB/s
        outgoing: parseFloat((Math.random() * 5 + 10).toFixed(1)), // Between 10-15 MB/s
        trend: generateTimeSeriesData(60, 20, 10),
      },
      services: metricsData.services.map(service => ({
        ...service,
        responseTime: service.name === 'RAG System'
          ? Math.floor(Math.random() * 200) + 300 // RAG is slower
          : Math.floor(Math.random() * 100) + 50, // Others between 50-150ms
        status: service.name === 'RAG System' && Math.random() > 0.7 
          ? 'degraded' 
          : 'healthy'
      })),
      models: metricsData.models.map(model => ({
        ...model,
        latency: Math.floor(Math.random() * 100) + 200,
        usage: Math.floor(Math.random() * 40) + 30
      }))
    });
    setLastRefreshed(new Date());
  };

  // Auto refresh effect
  useEffect(() => {
    if (!refreshInterval) return;
    
    const intervalId = setInterval(() => {
      refreshMetrics();
    }, refreshInterval * 1000);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  // Status badge styling
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'error':
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'standby':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Progress bar styling
  const getProgressBarColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">System Metrics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor system performance and health status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <ClockIcon className="h-4 w-4 mr-1" />
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </div>
          <select
            className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="1h">Last Hour</option>
            <option value="3h">Last 3 Hours</option>
            <option value="12h">Last 12 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          <button
            onClick={refreshMetrics}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Refresh
          </button>
        </div>
      </div>

      {/* System Resources */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">System Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* CPU Usage */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">CPU Usage</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{metricsData.cpu.usage}%</p>
              </div>
              <ServerIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${getProgressBarColor(metricsData.cpu.usage)}`}
                  style={{ width: `${metricsData.cpu.usage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {metricsData.cpu.trend[metricsData.cpu.trend.length - 1].value > metricsData.cpu.trend[0].value ? 
                  '↑ Increasing' : '↓ Decreasing'} trend over the last hour
              </p>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Memory Usage</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{metricsData.memory.usage}%</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${getProgressBarColor(metricsData.memory.usage)}`}
                  style={{ width: `${metricsData.memory.usage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {Math.round((metricsData.memory.usage / 100) * metricsData.memory.total)} GB of {metricsData.memory.total} GB used
              </p>
            </div>
          </div>

          {/* Disk Usage */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Disk Usage</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{metricsData.disk.usage}%</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${getProgressBarColor(metricsData.disk.usage)}`}
                  style={{ width: `${metricsData.disk.usage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {Math.round((metricsData.disk.usage / 100) * metricsData.disk.total)} GB of {metricsData.disk.total} GB used
              </p>
            </div>
          </div>

          {/* Network Usage */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Network Traffic</p>
                <div className="flex items-end gap-2 mt-2">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{metricsData.network.incoming}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">MB/s in</p>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-xl font-bold text-gray-500 dark:text-gray-400">{metricsData.network.outgoing}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">MB/s out</p>
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Peak: {Math.max(...metricsData.network.trend.map(d => d.value)).toFixed(1)} MB/s
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Health */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Services Health</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Service
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Response Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Health
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {metricsData.services.map((service, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {service.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(service.status)}`}>
                      {service.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {service.responseTime} ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div 
                        className={service.responseTime < 100 ? 'bg-green-500' : service.responseTime < 200 ? 'bg-yellow-500' : 'bg-red-500'}
                        style={{ width: `${Math.min(100, service.responseTime / 5)}%`, height: '0.375rem', borderRadius: '9999px' }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Models Performance */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">AI Models Performance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricsData.models.map((model, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{model.name}</p>
                  <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(model.status)}`}>
                    {model.status}
                  </span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <p className="text-gray-500 dark:text-gray-400">Latency:</p>
                  <p className="text-gray-900 dark:text-white font-medium">{model.latency} ms</p>
                </div>
                <div className="flex justify-between text-sm mb-3">
                  <p className="text-gray-500 dark:text-gray-400">Usage:</p>
                  <p className="text-gray-900 dark:text-white font-medium">{model.usage}%</p>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div 
                    className={getProgressBarColor(model.usage)}
                    style={{ width: `${model.usage}%`, height: '0.375rem', borderRadius: '9999px' }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MetricsPage;