import React from 'react';
import { Award } from 'lucide-react';

const TopProductsChart = ({ products }) => {
  const formatCurrency = (value) => {
    return `₱${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  // Get max quantity for scaling
  const maxQuantity = products.length > 0 ? Math.max(...products.map(p => p.quantity)) : 0;
  const scale = maxQuantity > 0 ? 100 / maxQuantity : 1;

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Award className="w-5 h-5 text-yellow-600" />
        <h2 className="text-lg md:text-xl font-bold text-gray-800">Top Selling Products</h2>
      </div>

      {products.length > 0 ? (
        <div className="space-y-4">
          {products.map((product, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600 w-6">#{index + 1}</span>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm md:text-base">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.sku}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">{product.quantity} units</p>
                  <p className="text-xs text-gray-600">{formatCurrency(product.revenue)}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-yellow-500 to-amber-500 h-2 rounded-full transition-all"
                  style={{ width: `${product.quantity * scale}%` }}
                />
              </div>
            </div>
          ))}

          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">Total Units Sold</p>
                <p className="text-lg font-bold text-amber-600">
                  {products.reduce((sum, p) => sum + p.quantity, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-lg font-bold text-amber-600">
                  {formatCurrency(products.reduce((sum, p) => sum + p.revenue, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No product sales data available
        </div>
      )}
    </div>
  );
};

export default TopProductsChart;
