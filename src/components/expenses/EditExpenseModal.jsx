import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const EditExpenseModal = ({ isOpen, onClose, onSave, item }) => {
  const [formData, setFormData] = useState({
    description: '',
    category: 'operational',
    amount: ''
  });
  const [error, setError] = useState('');

  const expenseCategories = [
    { id: 'operational', label: 'Operational' },
    { id: 'utilities', label: 'Utilities (Water, Electric)' },
    { id: 'supplies', label: 'Supplies & Materials' },
    { id: 'marketing', label: 'Marketing & Advertising' },
    { id: 'maintenance', label: 'Maintenance & Repairs' },
    { id: 'other', label: 'Other' }
  ];

  useEffect(() => {
    if (isOpen && item) {
      setFormData({
        description: item.description,
        category: item.category,
        amount: item.type === 'expense' ? item.amount.toString() : item.cost.toString(),
        notes: item.notes || ''
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

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (!formData.category) {
      setError('Category is required');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    onSave(formData);
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800">Edit {item.type === 'expense' ? 'Expense' : 'Giveaway'}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition flex-shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs md:text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Description
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {expenseCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              {item.type === 'expense' ? 'Amount' : 'Cost'} (₱)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="Additional details..."
              rows="2"
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            />
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

export default EditExpenseModal;
