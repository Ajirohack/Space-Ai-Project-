import React from 'react';

// Sample data - in a real application, this would come from an API
const activityData = [
  {
    id: 1,
    type: 'user_login',
    description: 'Admin user logged in',
    timestamp: '2025-04-25T08:45:23',
    user: 'admin@nexus.com',
    details: { ip: '192.168.1.100', device: 'Chrome/MacOS' },
  },
  {
    id: 2,
    type: 'module_update',
    description: 'RAG System module updated to v2.3.0',
    timestamp: '2025-04-25T08:30:10',
    user: 'system',
    details: { previousVersion: 'v2.2.5', newVersion: 'v2.3.0' },
  },
  {
    id: 3,
    type: 'request_error',
    description: 'Failed request to AI Council',
    timestamp: '2025-04-25T08:15:42',
    user: 'nexus_backend',
    details: { error: 'Timeout', requestId: '8a7b6c5d4e3f' },
  },
  {
    id: 4,
    type: 'system_alert',
    description: 'Memory usage exceeded 80% threshold',
    timestamp: '2025-04-25T07:55:30',
    user: 'system_monitor',
    details: { value: '83%', threshold: '80%', duration: '5 min' },
  },
  {
    id: 5,
    type: 'user_action',
    description: 'New API key generated for Browser Extension',
    timestamp: '2025-04-25T07:40:15',
    user: 'admin@nexus.com',
    details: { service: 'BrowserExt', expires: '2026-04-25' },
  },
];

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ActivityIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'user_login':
      return <span className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">👤</span>;
    case 'module_update':
      return <span className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">🔄</span>;
    case 'request_error':
      return <span className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">❌</span>;
    case 'system_alert':
      return <span className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">⚠️</span>;
    case 'user_action':
      return <span className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">🔑</span>;
    default:
      return <span className="bg-gray-100 dark:bg-gray-900/30 p-2 rounded-full">📝</span>;
  }
};

const RecentActivityCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">Today</span>
      </div>
      <div className="p-6">
        <div className="flow-root">
          <ul className="-mb-8">
            {activityData.map((activity, activityIdx) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {activityIdx !== activityData.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                      aria-hidden="true"
                    ></span>
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <ActivityIcon type={activity.type} />
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                          {activity.description}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {activity.user} ·{' '}
                          {Object.keys(activity.details).map(key => (
                            <span key={key} className="mr-2">
                              {key}: {activity.details[key]}
                            </span>
                          ))}
                        </p>
                      </div>
                      <div className="text-right text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {formatTimestamp(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 text-center">
          <button className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecentActivityCard;
