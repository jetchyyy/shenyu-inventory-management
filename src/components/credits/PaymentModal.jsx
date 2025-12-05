import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, onSave, item }) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && item) {
      setPaymentAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setError('');
    }
  }, [isOpen, item]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setError('Payment amount must be greater than zero');
      return;
    }

    if (parseFloat(paymentAmount) > item.remainingValue) {
      setError(`Payment cannot exceed remaining value of ₱${item.remainingValue.toFixed(2)}`);
      return;
    }

    onSave({
      amount: parseFloat(paymentAmount),
      paymentDate: paymentDate,
      notes: notes.trim(),
      timestamp: Date.now()
    });

    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  };

  if (!isOpen || !item) return null;

  const newRemainingValue = item.remainingValue - (paymentAmount ? parseFloat(paymentAmount) : 0);
  const isFullPayment = parseFloat(paymentAmount) === item.remainingValue;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800">Record Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition flex-shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4 md:mb-6 p-3 md:p-4 bg-blue-50 rounded-lg text-sm">
          <p className="text-xs md:text-sm text-gray-600">Credit Item</p>
          <p className="text-base md:text-lg font-semibold text-gray-800 mt-1">{item.productName}</p>
          <p className="text-xs text-gray-500">Customer: {item.customerName}</p>
          <div className="mt-3 pt-3 border-t border-blue-200 space-y-1">
            <p className="text-xs md:text-sm text-gray-600">Total Value: <span className="font-semibold text-gray-800">₱{item.totalValue.toFixed(2)}</span></p>
            <p className="text-xs md:text-sm text-gray-600">Remaining: <span className="font-semibold text-gray-800">₱{item.remainingValue.toFixed(2)}</span></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs md:text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Payment Amount (₱)
            </label>
            <input
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              max={item.remainingValue}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              placeholder="Enter payment amount"
            />
          </div>

          {paymentAmount && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs md:text-sm text-gray-600">New Remaining Value:</span>
                <span className="text-lg md:text-xl font-bold text-green-600">₱{newRemainingValue.toFixed(2)}</span>
              </div>
              {isFullPayment && (
                <p className="text-xs text-green-700 font-semibold">✓ Full payment - Credit item will be marked as completed</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Payment Date
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm"
              rows="2"
              placeholder="Add any notes about this payment..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium text-sm"
            >
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
