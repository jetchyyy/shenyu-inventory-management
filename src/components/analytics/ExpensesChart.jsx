import React from 'react';

const ExpensesChart = ({ data }) => {
  const formatCurrency = (value) => {
    return `₱${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  // Get max value for scaling
  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.expenses + d.giveaways)) : 0;
  const scale = maxValue > 0 ? 100 / maxValue : 1;

  // Limit to last 15 days for better visualization
  const displayData = data.slice(-15);

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-800">Expenses Breakdown</h2>
        <p className="text-sm text-gray-600">Daily expenses and giveaways</p>
      </div>

      {displayData.length > 0 ? (
        <div className="space-y-4">
          {/* Stacked Bar Chart */}
          <div className="h-64 flex items-end justify-around gap-1 md:gap-2 bg-gray-50 rounded-lg p-4">
            {displayData.map((item, index) => {
              const total = item.expenses + item.giveaways;
              const expenseHeight = total > 0 ? (item.expenses / total) * 100 : 0;
              
              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col justify-end group"
                >
                  <div className="w-full flex flex-col relative" style={{ height: `${Math.max(total * scale, 5)}%` }}>
                    {/* Expenses (top) */}
                    <div
                      className="w-full bg-gradient-to-b from-red-400 to-red-500 relative"
                      style={{ flex: expenseHeight }}
                      title={`Expenses: ${formatCurrency(item.expenses)}`}
                    />
                    {/* Giveaways (bottom) */}
                    <div
                      className="w-full bg-gradient-to-b from-orange-400 to-orange-500"
                      style={{ flex: 100 - expenseHeight }}
                      title={`Giveaways: ${formatCurrency(item.giveaways)}`}
                    />
                  </div>
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatCurrency(total)}
                  </div>
                </div>
              );
            })}
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

          {/* Legend */}
          <div className="flex gap-6 justify-center mt-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600">Expenses</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-sm text-gray-600">Giveaways</span>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(displayData.reduce((sum, d) => sum + d.expenses, 0))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Giveaways</p>
              <p className="text-lg font-bold text-orange-600">
                {formatCurrency(displayData.reduce((sum, d) => sum + d.giveaways, 0))}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No expenses data available for this period
        </div>
      )}
    </div>
  );
};

export default ExpensesChart;
