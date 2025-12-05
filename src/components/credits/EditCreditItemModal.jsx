import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const EditCreditItemModal = ({ isOpen, onClose, onSave, item }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    interestPercentage: 0,
    paymentSchedule: 'weekly',
    weeklyDay: 'Monday',
    monthlyDate: 1
  });
  const [error, setError] = useState('');

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (isOpen && item) {
      setFormData({
        customerName: item.customerName,
        interestPercentage: item.interestPercentage || 0,
        paymentSchedule: item.paymentSchedule,
        weeklyDay: item.weeklyDay || 'Monday',
        monthlyDate: item.monthlyDate || 1
      });
      setError('');
    }
  }, [isOpen, item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.customerName.trim()) {
      setError('Customer name is required');
      return;
    }

    if (formData.paymentSchedule === 'weekly' && !formData.weeklyDay) {
      setError('Please select a payment day');
      return;
    }

    if (formData.paymentSchedule === 'monthly' && (formData.monthlyDate < 1 || formData.monthlyDate > 31)) {
      setError('Monthly date must be between 1 and 31');
      return;
    }

    if (formData.interestPercentage < 0 || formData.interestPercentage > 100) {
      setError('Interest percentage must be between 0 and 100');
      return;
    }

    onSave(formData);
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800">Edit Credit Item</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition flex-shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4 md:mb-6 p-3 md:p-4 bg-blue-50 rounded-lg text-sm">
          <p className="text-xs md:text-sm text-gray-600">Product</p>
          <p className="text-base md:text-lg font-semibold text-gray-800 mt-1">{item.productName}</p>
          <p className="text-xs text-gray-500">SKU: {item.productSku} | Qty: {item.quantity}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs md:text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Customer Name/ID
            </label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="e.g., John Doe, Store Name"
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Interest Percentage (Profit) %
            </label>
            <input
              type="number"
              name="interestPercentage"
              value={formData.interestPercentage}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.5"
              placeholder="e.g., 10 for 10% interest"
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <p className="text-xs text-gray-600 mt-1">Adjust the interest percentage for this credit item</p>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm md:text-base">Payment Schedule</h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="weekly"
                  name="paymentSchedule"
                  value="weekly"
                  checked={formData.paymentSchedule === 'weekly'}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="weekly" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Weekly Payment
                </label>
              </div>

              {formData.paymentSchedule === 'weekly' && (
                <div className="ml-7 md:ml-8 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Payment Day
                  </label>
                  <select
                    name="weeklyDay"
                    value={formData.weeklyDay}
                    onChange={handleChange}
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {weekDays.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="monthly"
                  name="paymentSchedule"
                  value="monthly"
                  checked={formData.paymentSchedule === 'monthly'}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="monthly" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Monthly Payment
                </label>
              </div>

              {formData.paymentSchedule === 'monthly' && (
                <div className="ml-7 md:ml-8 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Payment Date of Month
                  </label>
                  <input
                    type="number"
                    name="monthlyDate"
                    value={formData.monthlyDate}
                    onChange={handleChange}
                    min="1"
                    max="31"
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <p className="text-xs text-gray-600 mt-1">Enter date 1-31</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium text-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCreditItemModal;
