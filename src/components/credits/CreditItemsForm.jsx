import React, { useState, useEffect } from 'react';
import { ref, onValue, get, set, push } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import SuccessModal from '../shared/SuccessModal';
import { Plus, AlertCircle, Info } from 'lucide-react';
import { creditApprovalService } from '../../services/creditApprovalService';

const CreditItemsForm = ({ onCreditComplete }) => {
  const { user, userRole } = useAuth();
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    customerName: '',
    selectedProduct: '',
    quantity: 1,
    interestPercentage: 0, // Interest percentage to add as profit
    paymentSchedule: 'weekly', // 'weekly' or 'monthly'
    weeklyDay: 'Monday', // Day of week for weekly payments
    monthlyDate: 1, // Date of month for monthly payments
    startDate: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    const inventoryRef = ref(database, 'inventory');
    const unsubscribe = onValue(inventoryRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const productsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).filter(p => p.quantity > 0);
        setProducts(productsArray);
      } else {
        setProducts([]);
      }
    });

    return () => unsubscribe();
  }, []);

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
    if (!formData.customerName.trim()) {
      setError('Customer name is required');
      return;
    }

    if (!formData.selectedProduct) {
      setError('Please select a product');
      return;
    }

    if (formData.quantity <= 0) {
      setError('Quantity must be greater than 0');
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

    setProcessing(true);

    try {
      const product = products.find(p => p.id === formData.selectedProduct);

      if (!product) {
        setError('Product not found');
        return;
      }

      if (formData.quantity > product.quantity) {
        setError(`Only ${product.quantity} units available`);
        return;
      }

      const baseValue = product.retailPrice * parseInt(formData.quantity);
      const interestAmount = (baseValue * parseFloat(formData.interestPercentage)) / 100;
      const totalWithInterest = baseValue + interestAmount;

      const creditItemData = {
        customerName: formData.customerName.trim(),
        productId: formData.selectedProduct,
        productName: product.name,
        productSku: product.sku,
        quantity: parseInt(formData.quantity),
        costPrice: product.costPrice,
        retailPrice: product.retailPrice,
        interestPercentage: parseFloat(formData.interestPercentage),
        interestAmount: interestAmount,
        paymentSchedule: formData.paymentSchedule,
        weeklyDay: formData.paymentSchedule === 'weekly' ? formData.weeklyDay : null,
        monthlyDate: formData.paymentSchedule === 'monthly' ? parseInt(formData.monthlyDate) : null,
        startDate: formData.startDate,
        status: 'active', // active, completed, overdue
        baseValue: baseValue,
        totalValue: totalWithInterest,
        remainingValue: totalWithInterest,
        lastPaymentDate: null,
        nextDueDate: calculateNextDueDate(formData.startDate, formData.paymentSchedule, formData.weeklyDay, formData.monthlyDate)
      };

      // Check if user is staff - if so, create approval request instead
      if (userRole === 'staff') {
        const result = await creditApprovalService.createApprovalRequest(creditItemData, user.uid);
        
        if (result.success) {
          setSuccessModal({
            isOpen: true,
            title: 'Approval Request Sent',
            message: `Credit request for ${product.name} to ${formData.customerName} has been submitted for approval. Base Value: ₱${baseValue.toFixed(2)}, Interest: ₱${interestAmount.toFixed(2)}, Total: ₱${totalWithInterest.toFixed(2)}. Please wait for admin/superadmin approval.`
          });
        } else {
          setError(result.error || 'Failed to submit approval request');
        }
      } else {
        // Admin/Superadmin - create credit item directly
        const creditItemRef = push(ref(database, 'creditItems'));

        await set(creditItemRef, {
          ...creditItemData,
          createdAt: Date.now()
        });

        // Update inventory - reduce quantity
        const productRef = ref(database, `inventory/${formData.selectedProduct}`);
        const productSnapshot = await get(productRef);
        await set(productRef, {
          ...productSnapshot.val(),
          quantity: productSnapshot.val().quantity - parseInt(formData.quantity),
          updatedAt: Date.now()
        });

        setSuccessModal({
          isOpen: true,
          title: 'Credit Item Created',
          message: `${product.name} loaned to ${formData.customerName}. Base Value: ₱${baseValue.toFixed(2)}, Interest: ₱${interestAmount.toFixed(2)}, Total: ₱${totalWithInterest.toFixed(2)}. Inventory updated.`
        });
      }

      // Reset form
      setFormData({
        customerName: '',
        selectedProduct: '',
        quantity: 1,
        interestPercentage: 0,
        paymentSchedule: 'weekly',
        weeklyDay: 'Monday',
        monthlyDate: 1,
        startDate: new Date().toISOString().split('T')[0]
      });

      if (onCreditComplete) onCreditComplete();
    } catch (error) {
      console.error('Error creating credit item:', error);
      setError(error.message || 'Failed to create credit item. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const calculateNextDueDate = (startDate, schedule, weeklyDay, monthlyDate) => {
    const date = new Date(startDate);
    
    if (schedule === 'weekly') {
      const dayIndex = weekDays.indexOf(weeklyDay);
      const currentDay = date.getDay();
      const daysUntilPaymentDay = (dayIndex - currentDay + 7) % 7 || 7;
      date.setDate(date.getDate() + daysUntilPaymentDay);
    } else if (schedule === 'monthly') {
      date.setMonth(date.getMonth() + 1);
      date.setDate(monthlyDate);
    }
    
    return date.getTime();
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <div className="flex items-center space-x-2 mb-4 md:mb-6">
        <Plus className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
        <h2 className="text-lg md:text-xl font-bold text-gray-800">New Credit Item</h2>
      </div>

      {userRole === 'staff' && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-lg text-xs md:text-sm mb-4 flex items-start space-x-2">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>As a staff member, credit items you create will require approval from an admin or superadmin before they are finalized.</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs md:text-sm mb-4 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
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
            disabled={processing}
          />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
            Select Product
          </label>
          <select
            name="selectedProduct"
            value={formData.selectedProduct}
            onChange={handleChange}
            className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={processing}
          >
            <option value="">Choose a product...</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name} - {product.sku} (Stock: {product.quantity})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={processing}
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={processing}
            />
          </div>
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
            disabled={processing}
          />
          <p className="text-xs text-gray-600 mt-1">This interest will be counted as profit on the credit item</p>
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
                disabled={processing}
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
                  disabled={processing}
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
                disabled={processing}
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
                  disabled={processing}
                />
                <p className="text-xs text-gray-600 mt-1">Enter date 1-31</p>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={processing}
          className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white py-2 md:py-3 rounded-lg hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed text-sm md:text-base font-medium mt-6"
        >
          <Plus className="w-5 h-5" />
          <span>{processing ? 'Creating...' : 'Create Credit Item'}</span>
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

export default CreditItemsForm;
