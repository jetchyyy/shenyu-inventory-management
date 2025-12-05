import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const SalesHistory = ({ sales }) => {
  const [expandedSale, setExpandedSale] = useState(null);

  const toggleExpand = (saleId) => {
    setExpandedSale(expandedSale === saleId ? null : saleId);
  };

  if (sales.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Sales History</h2>
        <p className="text-gray-500 text-center py-8">No sales recorded yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Sales History</h2>
      
      <div className="space-y-3">
        {sales.map(sale => (
          <div key={sale.id} className="border rounded-lg overflow-hidden">
            <div
              className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
              onClick={() => toggleExpand(sale.id)}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium text-gray-800">
                        {new Date(sale.timestamp).toLocaleDateString()} - {new Date(sale.timestamp).toLocaleTimeString()}
                      </p>
                      {sale.saleType === 'custom' && (
                        <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded">CUSTOM</span>
                      )}
                      {sale.customerType && (
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${sale.customerType === 'reseller' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {sale.customerType === 'reseller' ? 'RESELLER' : 'RETAIL'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {sale.items.length} item{sale.items.length > 1 ? 's' : ''}
                    </p>
                    {sale.customerName && (
                      <p className="text-sm text-gray-600">
                        Customer: {sale.customerName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">₱{sale.total.toFixed(2)}</p>
                  {sale.totalProfit && (
                    <p className="text-sm font-medium text-green-600">
                      Profit: ₱{sale.totalProfit.toFixed(2)}
                    </p>
                  )}
                </div>
                {expandedSale === sale.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </div>
            </div>

            {expandedSale === sale.id && (
              <div className="p-4 bg-white border-t">
                <h4 className="font-semibold text-gray-800 mb-3">Items Sold:</h4>
                <div className="space-y-2">
                  {sale.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} x ₱{(item.customPrice || item.salePrice || item.retailPrice || item.price || 0).toFixed(2)}
                        </p>
                        {item.profit && (
                          <p className="text-xs text-green-600">
                            Profit: ₱{item.profit.toFixed(2)}
                            {item.profitMargin && <span> ({item.profitMargin}%)</span>}
                          </p>
                        )}
                      </div>
                      <p className="font-semibold text-gray-800">
                        ₱{item.subtotal.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  {sale.totalProfit && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-700">Total Profit:</span>
                      <span className="text-lg font-bold text-green-600">
                        ₱{sale.totalProfit.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800">Total:</span>
                    <span className="text-xl font-bold text-blue-600">
                      ₱{sale.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesHistory;