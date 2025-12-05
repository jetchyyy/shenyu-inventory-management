import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const PaymentHistory = ({ creditItem, payments = [] }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!creditItem) return null;

  const sortedPayments = [...payments].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6 border-l-4 border-green-500">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between hover:bg-gray-50 p-2 rounded transition"
      >
        <div className="text-left">
          <h3 className="font-semibold text-gray-800 text-sm md:text-base">{creditItem.customerName} - {creditItem.productName}</h3>
          <p className="text-xs md:text-sm text-gray-600">SKU: {creditItem.productSku} | Qty: {creditItem.quantity}</p>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Total Value</p>
              <p className="text-lg md:text-xl font-bold text-gray-900">₱{creditItem.totalValue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-600">Remaining Value</p>
              <p className="text-lg md:text-xl font-bold text-blue-600">₱{creditItem.remainingValue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-600">Paid Amount</p>
              <p className="text-lg md:text-xl font-bold text-green-600">₱{(creditItem.totalValue - creditItem.remainingValue).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-600">Progress</p>
              <p className="text-lg md:text-xl font-bold text-purple-600">{((creditItem.totalValue - creditItem.remainingValue) / creditItem.totalValue * 100).toFixed(1)}%</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs md:text-sm font-medium text-gray-700">Payment Progress</p>
              <p className="text-xs md:text-sm font-medium text-gray-600">
                ₱{(creditItem.totalValue - creditItem.remainingValue).toFixed(2)} of ₱{creditItem.totalValue.toFixed(2)}
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{
                  width: `${((creditItem.totalValue - creditItem.remainingValue) / creditItem.totalValue * 100) || 0}%`
                }}
              ></div>
            </div>
          </div>

          {/* Payment Schedule Info */}
          <div className="bg-gray-50 p-3 rounded-lg mt-4">
            <p className="text-xs md:text-sm font-semibold text-gray-800 mb-2">Payment Schedule</p>
            {creditItem.paymentSchedule === 'weekly' ? (
              <p className="text-xs md:text-sm text-gray-700">Weekly on <span className="font-semibold">{creditItem.weeklyDay}</span></p>
            ) : (
              <p className="text-xs md:text-sm text-gray-700">Monthly on day <span className="font-semibold">{creditItem.monthlyDate}</span></p>
            )}
            <p className="text-xs text-gray-600 mt-1">
              Started: {new Date(creditItem.startDate).toLocaleDateString()}
            </p>
          </div>

          {/* Payment History */}
          <div className="mt-4">
            <h4 className="font-semibold text-gray-800 text-sm md:text-base mb-3">Payment Records</h4>
            {sortedPayments.length === 0 ? (
              <p className="text-xs md:text-sm text-gray-500 text-center py-4">No payments recorded yet</p>
            ) : (
              <div className="space-y-2">
                {sortedPayments.map((payment, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border-l-2 border-green-500">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">₱{payment.amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </p>
                        {payment.notes && (
                          <p className="text-xs text-gray-500 mt-1 italic">{payment.notes}</p>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(payment.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
