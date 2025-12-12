import React from 'react';
import { BarChart3 } from 'lucide-react';

const ResellerPerformanceChart = ({ resellers }) => {
  const formatCurrency = (value) => {
    return `₱${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  // Get max profit for scaling
  const maxProfit = resellers.length > 0 ? Math.max(...resellers.map(r => r.totalProfit)) : 0;
  const scale = maxProfit > 0 ? 100 / maxProfit : 1;

  // Limit to top 10 for better visualization
  const displayData = resellers.slice(0, 10);

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <div className="flex items-center space-x-2 mb-6">
        <BarChart3 className="w-5 h-5 text-green-600" />
        <h2 className="text-lg md:text-xl font-bold text-gray-800">Reseller Profit Performance</h2>
      </div>

      {displayData.length > 0 ? (
        <div className="space-y-3">
          {displayData.map((reseller, index) => (
            <div key={index} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{reseller.name}</p>
                </div>
                <span className="text-sm font-bold text-green-600 ml-2">{formatCurrency(reseller.totalProfit)}</span>
              </div>

              {/* Horizontal bar chart */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all group-hover:shadow-lg"
                  style={{ width: `${reseller.totalProfit * scale}%` }}
                  title={`Profit: ${formatCurrency(reseller.totalProfit)}`}
                />
              </div>

              {/* Mini stats */}
              <div className="flex gap-4 mt-1 text-xs text-gray-600">
                <span>Sales: {formatCurrency(reseller.totalSales)}</span>
                <span>•</span>
                <span>Margin: {reseller.profitMargin.toFixed(1)}%</span>
              </div>
            </div>
          ))}

          {resellers.length > 10 && (
            <div className="mt-4 pt-4 border-t border-gray-200 text-center text-sm text-gray-600">
              +{resellers.length - 10} more resellers
            </div>
          )}
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No reseller profit data available
        </div>
      )}
    </div>
  );
};

export default ResellerPerformanceChart;
