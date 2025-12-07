import React, { useState } from 'react';
import { ref, push, set, get } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { expenseApprovalService } from '../../services/expenseApprovalService';
import SuccessModal from '../shared/SuccessModal';
import { Plus, AlertCircle, Info } from 'lucide-react';

const ExpensesForm = ({ onExpenseComplete }) => {
  const { user, userRole } = useAuth();
  const [formData, setFormData] = useState({
    type: 'expense', // 'expense' or 'giveaway'
    description: '',
    category: 'operational', // operational, utilities, supplies, marketing, other
    amount: '',
    cost: '', // for giveaways - cost of product given
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  const expenseCategories = [
    { id: 'operational', label: 'Operational' },
    { id: 'utilities', label: 'Utilities (Water, Electric)' },
    { id: 'supplies', label: 'Supplies & Materials' },
    { id: 'marketing', label: 'Marketing & Advertising' },
    { id: 'maintenance', label: 'Maintenance & Repairs' },
    { id: 'other', label: 'Other' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (!formData.category) {
      setError('Category is required');
      return;
    }

    if (formData.type === 'expense') {
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setError('Amount must be greater than 0');
        return;
      }
    } else {
      if (!formData.cost || parseFloat(formData.cost) <= 0) {
        setError('Cost must be greater than 0');
        return;
      }
    }

    setProcessing(true);

    try {
      const expenseData = {
        type: formData.type,
        description: formData.description.trim(),
        category: formData.category,
        ...(formData.type === 'expense' 
          ? { amount: parseFloat(formData.amount) }
          : { cost: parseFloat(formData.cost) }
        ),
        date: new Date(formData.date).getTime(),
        notes: formData.notes || ''
      };

      // Check if user is staff - if so, create approval request instead
      if (userRole === 'staff') {
        const result = await expenseApprovalService.createApprovalRequest(expenseData, user.uid);
        
        if (result.success) {
          const amount = formData.type === 'expense' 
            ? parseFloat(formData.amount).toFixed(2)
            : parseFloat(formData.cost).toFixed(2);

          setSuccessModal({
            isOpen: true,
            title: formData.type === 'expense' ? 'Expense Approval Requested' : 'Giveaway Approval Requested',
            message: `${formData.type === 'expense' ? 'Expense' : 'Giveaway'} of ₱${amount} has been submitted for approval. Please wait for admin/superadmin approval.`
          });
        } else {
          setError(result.error || 'Failed to submit approval request');
        }
      } else {
        // Admin/Superadmin - create directly
        const expenseRef = push(ref(database, 'expenses'));

        await set(expenseRef, {
          ...expenseData,
          createdAt: Date.now()
        });

        const amount = formData.type === 'expense' 
          ? parseFloat(formData.amount).toFixed(2)
          : parseFloat(formData.cost).toFixed(2);

        setSuccessModal({
          isOpen: true,
          title: formData.type === 'expense' ? 'Expense Recorded' : 'Free Giveaway Recorded',
          message: `₱${amount} ${formData.type === 'expense' ? 'expense' : 'giveaway'} has been recorded.`
        });
      }

      // Reset form
      setFormData({
        type: 'expense',
        description: '',
        category: 'operational',
        amount: '',
        cost: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });

      if (onExpenseComplete) onExpenseComplete();
    } catch (error) {
      console.error('Error creating expense:', error);
      setError(error.message || 'Failed to create expense. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <div className="flex items-center space-x-2 mb-4 md:mb-6">
        <Plus className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
        <h2 className="text-lg md:text-xl font-bold text-gray-800">Record {formData.type === 'expense' ? 'Expense' : 'Giveaway'}</h2>
      </div>

      {userRole === 'staff' && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-lg text-xs md:text-sm mb-4 flex items-start space-x-2">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>As a staff member, expense and giveaway records you create will require approval from an admin or superadmin before they are finalized.</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs md:text-sm mb-4 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
        {/* Type Selection */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
            Record Type
          </label>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="expense"
                name="type"
                value="expense"
                checked={formData.type === 'expense'}
                onChange={handleChange}
                className="w-4 h-4 text-red-600"
                disabled={processing}
              />
              <label htmlFor="expense" className="text-sm font-medium text-gray-700 cursor-pointer">
                Business Expense
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="giveaway"
                name="type"
                value="giveaway"
                checked={formData.type === 'giveaway'}
                onChange={handleChange}
                className="w-4 h-4 text-orange-600"
                disabled={processing}
              />
              <label htmlFor="giveaway" className="text-sm font-medium text-gray-700 cursor-pointer">
                Free Giveaway (Track Product Cost)
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
            Description
          </label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="e.g., Monthly rent, Free sample giveaway"
            className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={processing}
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
            disabled={processing}
          >
            {expenseCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
            Date
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={processing}
          />
        </div>

        {formData.type === 'expense' ? (
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Amount (₱)
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
              disabled={processing}
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Product Cost (₱)
            </label>
            <input
              type="number"
              name="cost"
              value={formData.cost}
              onChange={handleChange}
              placeholder="Cost of the product given away"
              step="0.01"
              min="0"
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={processing}
            />
          </div>
        )}

        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
            Notes (Optional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Additional details..."
            rows="2"
            className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            disabled={processing}
          />
        </div>

        <button
          type="submit"
          disabled={processing}
          className="w-full flex items-center justify-center space-x-2 bg-red-500 text-white py-2 md:py-3 rounded-lg hover:bg-red-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed text-sm md:text-base font-medium mt-6"
        >
          <Plus className="w-5 h-5" />
          <span>{processing ? 'Recording...' : 'Record ' + (formData.type === 'expense' ? 'Expense' : 'Giveaway')}</span>
        </button>
      </form>

      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
        title={successModal.title}
        message={successModal.message}
      />
    </div>
  );
};

export default ExpensesForm;
