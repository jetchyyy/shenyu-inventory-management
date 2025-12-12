import React from 'react';
import { Users, TrendingUp } from 'lucide-react';

const TopResellersChart = ({ resellers }) => {
  const formatCurrency = (value) => {
    return `₱${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  // Get max value for scaling
  const maxSales = resellers.length > 0 ? Math.max(...resellers.map(r => r.totalSales)) : 0;
  const scale = maxSales > 0 ? 100 / maxSales : 1;

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Users className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg md:text-xl font-bold text-gray-800">Top Resellers</h2>
      </div>

      {resellers.length > 0 ? (
        <div className="space-y-4">
          {resellers.map((reseller, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-600 bg-gray-100 rounded-full w-7 h-7 flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm md:text-base">{reseller.name}</p>
                      <p className="text-xs text-gray-500">{reseller.transactionCount} transaction(s)</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-600">{formatCurrency(reseller.totalSales)}</p>
                  <p className="text-xs text-gray-600">Profit: {formatCurrency(reseller.totalProfit)}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${reseller.totalSales * scale}%` }}
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                <div>
                  <p className="text-gray-500">Avg Sale</p>
                  <p className="font-semibold text-gray-800">{formatCurrency(reseller.averageSale)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Items Sold</p>
                  <p className="font-semibold text-gray-800">{reseller.totalItems}</p>
                </div>
                <div>
                  <p className="text-gray-500">Margin</p>
                  <p className="font-semibold text-gray-800">{reseller.profitMargin.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          ))}

          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Reseller Sales</p>
                <p className="text-lg font-bold text-indigo-600">
                  {formatCurrency(resellers.reduce((sum, r) => sum + r.totalSales, 0))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Resellers</p>
                <p className="text-lg font-bold text-indigo-600">{resellers.length}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No reseller sales data available
        </div>
      )}
    </div>
  );
};

export default TopResellersChart;
