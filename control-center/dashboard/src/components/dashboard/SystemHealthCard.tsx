import React from 'react';

// Sample data - in a real application, this would come from an API
const systemHealthData = [
  { name: 'CPU', value: 38, status: 'normal' },
  { name: 'Memory', value: 65, status: 'warning' },
  { name: 'Disk', value: 42, status: 'normal' },
  { name: 'Network', value: 28, status: 'normal' },
];

const SystemHealthCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">System Health</h3>
      </div>
      <div className="p-6">
        {systemHealthData.map(item => (
          <div key={item.name} className="mb-4 last:mb-0">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.name}
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.value}%
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    item.status === 'normal'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : item.status === 'warning'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {item.status}
                </span>
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className={`h-2.5 rounded-full ${
                  item.status === 'normal'
                    ? 'bg-green-500'
                    : item.status === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${item.value}%` }}
              ></div>
            </div>
          </div>
        ))}
        <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="w-full px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50">
            View Detailed Metrics
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthCard;
