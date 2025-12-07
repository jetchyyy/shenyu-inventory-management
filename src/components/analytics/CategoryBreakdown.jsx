import React from 'react';
import { PieChart } from 'lucide-react';

const CategoryBreakdown = ({ data }) => {
  const formatCurrency = (value) => {
    return `₱${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  // Generate colors for pie chart
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#EC4899', '#14B8A6', '#F97316', '#6366F1'
  ];

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  // Calculate SVG path for pie chart
  const generatePieSegments = () => {
    let currentAngle = -90;
    return data.map((item, index) => {
      const percentage = (item.amount / total) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = 100 + 80 * Math.cos(startRad);
      const y1 = 100 + 80 * Math.sin(startRad);
      const x2 = 100 + 80 * Math.cos(endRad);
      const y2 = 100 + 80 * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;

      const path = [
        `M 100 100`,
        `L ${x1} ${y1}`,
        `A 80 80 0 ${largeArc} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');

      currentAngle = endAngle;

      return {
        path,
        color: colors[index % colors.length],
        percentage,
        index
      };
    });
  };

  const segments = data.length > 0 ? generatePieSegments() : [];

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <div className="flex items-center space-x-2 mb-6">
        <PieChart className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg md:text-xl font-bold text-gray-800">Expense Categories</h2>
      </div>

      {data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="flex items-center justify-center">
            <svg width="200" height="200" viewBox="0 0 200 200" className="filter drop-shadow-sm">
              {segments.map((segment) => (
                <path
                  key={segment.index}
                  d={segment.path}
                  fill={segment.color}
                  stroke="white"
                  strokeWidth="2"
                  className="hover:opacity-80 cursor-pointer transition-opacity"
                />
              ))}
              <circle cx="100" cy="100" r="45" fill="white" />
              <text
                x="100"
                y="105"
                textAnchor="middle"
                fontSize="14"
                fontWeight="bold"
                fill="#374151"
              >
                {data.length} Categories
              </text>
            </svg>
          </div>

          {/* Legend */}
          <div className="space-y-3 overflow-y-auto max-h-72">
            {data.map((item, index) => {
              const percentage = ((item.amount / total) * 100).toFixed(1);
              const capitalizedCategory = item.category.charAt(0).toUpperCase() + item.category.slice(1);
              
              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      />
                      <span className="text-sm font-medium text-gray-700">{capitalizedCategory}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{item.count} transaction(s)</span>
                    <span>{formatCurrency(item.amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No expense categories data available
        </div>
      )}

      {/* Total */}
      {data.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-indigo-600">{formatCurrency(total)}</p>
        </div>
      )}
    </div>
  );
};

export default CategoryBreakdown;
