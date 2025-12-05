import React from 'react';
import { Edit2, Trash2, Lock, Plus } from 'lucide-react';

const InventoryTable = ({ items, onEdit, onDelete, onStockIn, canEdit = true }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 md:py-12">
        <p className="text-gray-500 text-sm md:text-base">No products found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 md:mx-0">
      <table className="w-full min-w-[900px] text-sm md:text-base">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              SKU
            </th>
            <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product Name
            </th>
            <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Qty
            </th>
            <th className="hidden sm:table-cell px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cost Price
            </th>
            <th className="hidden lg:table-cell px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Retail Price
            </th>
            <th className="hidden lg:table-cell px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Reseller Price
            </th>
            <th className="hidden xl:table-cell px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Custom Sale
            </th>
            <th className="hidden lg:table-cell px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Profit/Unit
            </th>
            <th className="hidden md:table-cell px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Min Stock
            </th>
            <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map(item => (
            <tr key={item.id} className="hover:bg-gray-50 text-xs md:text-sm">
              <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap font-medium text-gray-900">
                {item.sku}
              </td>
              <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-gray-900">
                <span className="font-medium">{item.name}</span>
              </td>
              <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-gray-900 font-semibold">
                {item.quantity}
              </td>
              <td className="hidden sm:table-cell px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-gray-900">
                ₱{item.costPrice ? item.costPrice.toFixed(2) : '0.00'}
              </td>
              <td className="hidden lg:table-cell px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-gray-900">
                ₱{item.retailPrice ? item.retailPrice.toFixed(2) : '0.00'}
              </td>
              <td className="hidden lg:table-cell px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-gray-900">
                {item.resellerPrice > 0 ? (
                  <span className="font-semibold text-purple-600">₱{item.resellerPrice.toFixed(2)}</span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="hidden xl:table-cell px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-gray-900">
                {item.customSalePrice > 0 ? (
                  <span className="font-semibold text-blue-600">₱{item.customSalePrice.toFixed(2)}</span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="hidden lg:table-cell px-3 md:px-6 py-3 md:py-4 whitespace-nowrap font-medium text-green-600">
                ₱{item.profit ? item.profit.toFixed(2) : '0.00'}
                {item.profitMargin && (
                  <span className="text-xs text-gray-500 ml-1">({item.profitMargin}%)</span>
                )}
              </td>
              <td className="hidden md:table-cell px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-gray-900">
                {item.minStock}
              </td>
              <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    item.quantity <= item.minStock
                      ? 'bg-red-100 text-red-800'
                      : item.quantity <= item.minStock * 2
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {item.quantity <= item.minStock
                    ? 'Low'
                    : item.quantity <= item.minStock * 2
                    ? 'Med'
                    : 'OK'}
                </span>
              </td>
              <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-gray-500">
                <div className="flex space-x-1 md:space-x-2">
                  <button
                    onClick={() => onStockIn(item)}
                    className="text-green-600 hover:text-green-800 transition p-1"
                    title="Stock In"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  {canEdit ? (
                    <>
                      <button
                        onClick={() => onEdit(item)}
                        className="text-blue-600 hover:text-blue-800 transition p-1"
                        title="Edit product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="text-red-600 hover:text-red-800 transition p-1"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center space-x-0.5 text-gray-400 cursor-not-allowed" title="Only Admin or Superadmin can edit">
                      <Lock className="w-4 h-4" />
                      <span className="text-xs hidden sm:inline">Locked</span>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;