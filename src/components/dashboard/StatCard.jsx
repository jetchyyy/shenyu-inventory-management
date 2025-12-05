import React from 'react';

const StatCard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    indigo: 'bg-indigo-500'
  };

  return (
    <div className="bg-white rounded-lg shadow p-3 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-gray-600 text-xs md:text-sm">{title}</p>
          <p className="text-xl md:text-2xl font-bold text-gray-800 mt-1 md:mt-2 truncate">{value}</p>
        </div>
        <div className={`${colors[color]} p-2 md:p-3 rounded-lg flex-shrink-0`}>
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;