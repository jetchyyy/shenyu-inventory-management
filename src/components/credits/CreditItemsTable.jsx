import React from 'react';
import { CheckCircle, Clock, AlertCircle, Trash2, Edit2 } from 'lucide-react';

const CreditItemsTable = ({ items, onPayment, onEdit, onDelete }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 md:py-12">
        <p className="text-gray-500 text-sm md:text-base">No credit items found</p>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600" />;
      case 'active':
      default:
        return <Clock className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'active':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const isOverdue = (nextDueDate) => {
    return new Date(nextDueDate) < new Date() && nextDueDate !== null;
  };

  return (
    <div className="overflow-x-auto -mx-4 md:mx-0">
      <table className="w-full min-w-[900px] text-sm md:text-base">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th className="hidden sm:table-cell px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Qty
            </th>
            <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Value
            </th>
            <th className="hidden md:table-cell px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Interest (Profit)
            </th>
            <th className="hidden md:table-cell px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Schedule
            </th>
            <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Next Due
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
          {items.map(item => {
            const nextDueDate = item.nextDueDate ? new Date(item.nextDueDate) : null;
            const isItemOverdue = nextDueDate && isOverdue(item.nextDueDate);
            const status = isItemOverdue ? 'overdue' : item.status;

            return (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                  <p className="font-medium text-gray-900 text-xs md:text-sm">{item.customerName}</p>
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                  <div>
                    <p className="font-medium text-gray-900 text-xs md:text-sm">{item.productName}</p>
                    <p className="text-xs text-gray-500">{item.productSku}</p>
                  </div>
                </td>
                <td className="hidden sm:table-cell px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                  {item.quantity}
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                  <p className="font-semibold text-gray-900 text-xs md:text-sm">₱{item.totalValue.toFixed(2)}</p>
                  <p className="text-xs text-gray-600">Remaining: ₱{item.remainingValue.toFixed(2)}</p>
                </td>
                <td className="hidden md:table-cell px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                  <div className="text-xs md:text-sm">
                    <p className="font-medium text-green-700">₱{(item.interestAmount || 0).toFixed(2)}</p>
                    <p className="text-gray-600">{(item.interestPercentage || 0).toFixed(1)}%</p>
                  </div>
                </td>
                <td className="hidden md:table-cell px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                  {item.paymentSchedule === 'weekly' ? (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Weekly ({item.weeklyDay})</span>
                  ) : (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Monthly (Day {item.monthlyDate})</span>
                  )}
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm">
                  {nextDueDate ? (
                    <div>
                      <p className="font-medium text-gray-900">{nextDueDate.toLocaleDateString()}</p>
                      <p className={`text-xs ${isItemOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                        {isItemOverdue && '⚠️ Overdue'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">—</p>
                  )}
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}`}>
                      {status === 'active' ? 'Active' : status === 'completed' ? 'Completed' : 'Overdue'}
                    </span>
                  </div>
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                  <div className="flex gap-2 flex-wrap">
                    {item.status === 'active' && (
                      <button
                        onClick={() => onPayment(item)}
                        className="px-2 py-1 text-xs md:text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded transition"
                        title="Record Payment"
                      >
                        💰
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(item)}
                      className="text-blue-600 hover:text-blue-800 transition p-1"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="text-red-600 hover:text-red-800 transition p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CreditItemsTable;
