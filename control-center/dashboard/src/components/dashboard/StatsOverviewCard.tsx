import React from 'react';

interface StatsOverviewCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
}

const StatsOverviewCard: React.FC<StatsOverviewCardProps> = ({
  title,
  value,
  change,
  isPositive,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            isPositive
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {change}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
};

export default StatsOverviewCard;
