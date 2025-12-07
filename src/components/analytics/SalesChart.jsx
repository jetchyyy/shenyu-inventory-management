import React from 'react';

const SalesChart = ({ data }) => {
  const formatCurrency = (value) => {
    return `₱${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  // Get max value for scaling
  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.sales)) : 0;
  const scale = maxValue > 0 ? 100 / maxValue : 1;

  // Limit to last 15 days for better visualization
  const displayData = data.slice(-15);

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-800">Sales Trend</h2>
        <p className="text-sm text-gray-600">Daily sales revenue over time</p>
      </div>

      {displayData.length > 0 ? (
        <div className="space-y-4">
          {/* Chart */}
          <div className="h-64 flex items-end justify-around gap-1 md:gap-2 bg-gray-50 rounded-lg p-4">
            {displayData.map((item, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group"
              >
                <div
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-600 hover:to-blue-500 cursor-pointer relative"
                  style={{
                    height: `${Math.max(item.sales * scale, 5)}%`
                  }}
                  title={`${item.date}: ${formatCurrency(item.sales)}`}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatCurrency(item.sales)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between gap-1 md:gap-2 px-4 text-xs text-gray-600">
            {displayData.map((item, index) => (
              <div
                key={index}
                className="flex-1 text-center truncate"
                title={item.date}
              >
                {item.date.split('/')[0]}/{item.date.split('/')[1]}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(displayData.reduce((sum, d) => sum + d.sales, 0))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-lg font-bold text-blue-600">
                {displayData.reduce((sum, d) => sum + d.orders, 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Avg Order Value</p>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(
                  displayData.reduce((sum, d) => sum + d.sales, 0) /
                  Math.max(displayData.reduce((sum, d) => sum + d.orders, 0), 1)
                )}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No sales data available for this period
        </div>
      )}
    </div>
  );
};

export default SalesChart;
