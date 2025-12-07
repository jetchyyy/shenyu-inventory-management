import React from 'react';
import { Trash2, Edit2 } from 'lucide-react';

const ExpensesTable = ({ items, expenseType, onEdit, onDelete }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 md:py-12">
        <p className="text-gray-500 text-sm md:text-base">
          No {expenseType === 'expenses' ? 'expenses' : 'giveaways'} found
        </p>
      </div>
    );
  }

  const getCategoryLabel = (category) => {
    const labels = {
      'operational': 'Operational',
      'utilities': 'Utilities',
      'supplies': 'Supplies',
      'marketing': 'Marketing',
      'maintenance': 'Maintenance',
      'other': 'Other'
    };
    return labels[category] || category;
  };

  return (
    <div className="overflow-x-auto -mx-4 md:mx-0">
      <table className="w-full min-w-[600px] text-sm md:text-base">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="hidden sm:table-cell px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {expenseType === 'expenses' ? 'Amount' : 'Cost'}
            </th>
            <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map(item => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                <p className="text-xs md:text-sm font-medium text-gray-900">
                  {new Date(item.date).toLocaleDateString()}
                </p>
              </td>
              <td className="px-3 md:px-6 py-3 md:py-4">
                <div>
                  <p className="font-medium text-gray-900 text-xs md:text-sm">{item.description}</p>
                  {item.notes && (
                    <p className="text-xs text-gray-600 mt-1">{item.notes}</p>
                  )}
                </div>
              </td>
              <td className="hidden sm:table-cell px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {getCategoryLabel(item.category)}
                </span>
              </td>
              <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                <p className="font-semibold text-gray-900 text-xs md:text-sm">
                  ₱{(item.amount || item.cost).toFixed(2)}
                </p>
              </td>
              <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(item)}
                    className="text-blue-600 hover:bg-blue-50 p-2 rounded transition"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-red-600 hover:bg-red-50 p-2 rounded transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExpensesTable;
