import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, set, push, get } from 'firebase/database';
import { database } from '../../config/firebase';
import CreditItemsForm from './CreditItemsForm';
import CreditItemsTable from './CreditItemsTable';
import PaymentModal from './PaymentModal';
import EditCreditItemModal from './EditCreditItemModal';
import PaymentHistory from './PaymentHistory';
import SuccessModal from '../shared/SuccessModal';
import { Search, List, History } from 'lucide-react';

const CreditItems = () => {
  const [creditItems, setCreditItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('items'); // 'items' or 'history'
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    item: null
  });
  const [editModal, setEditModal] = useState({
    isOpen: false,
    item: null
  });
  const [payments, setPayments] = useState({});
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  // Load credit items
  useEffect(() => {
    const creditItemsRef = ref(database, 'creditItems');
    const unsubscribe = onValue(creditItemsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const itemsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setCreditItems(itemsArray);
        setFilteredItems(itemsArray);
        
        // Load payment history for each item
        itemsArray.forEach(item => {
          const paymentsRef = ref(database, `creditItemPayments/${item.id}`);
          onValue(paymentsRef, (paymentSnapshot) => {
            if (paymentSnapshot.exists()) {
              const paymentsData = paymentSnapshot.val();
              const paymentsArray = Object.keys(paymentsData).map(key => ({
                id: key,
                ...paymentsData[key]
              }));
              setPayments(prev => ({
                ...prev,
                [item.id]: paymentsArray
              }));
            }
          });
        });
      } else {
        setCreditItems([]);
        setFilteredItems([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Filter items based on search
  useEffect(() => {
    const filtered = creditItems.filter(item =>
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productSku.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchTerm, creditItems]);

  const handlePayment = (item) => {
    setPaymentModal({
      isOpen: true,
      item: item
    });
  };

  const handlePaymentSave = async (paymentData) => {
    const item = paymentModal.item;
    
    try {
      // Add payment record
      const paymentRef = push(ref(database, `creditItemPayments/${item.id}`));
      await set(paymentRef, paymentData);

      // Calculate new remaining value
      const newRemainingValue = item.remainingValue - paymentData.amount;
      const isFullPayment = newRemainingValue <= 0;

      // Update credit item
      const creditItemRef = ref(database, `creditItems/${item.id}`);
      await set(creditItemRef, {
        ...item,
        remainingValue: newRemainingValue,
        lastPaymentDate: paymentData.paymentDate,
        status: isFullPayment ? 'completed' : 'active',
        updatedAt: Date.now()
      });

      // If full payment, add back to inventory
      if (isFullPayment) {
        const productRef = ref(database, `inventory/${item.productId}`);
        const productSnapshot = await get(productRef);
        if (productSnapshot.exists()) {
          await set(productRef, {
            ...productSnapshot.val(),
            quantity: productSnapshot.val().quantity + item.quantity,
            updatedAt: Date.now()
          });
        }
      }

      setSuccessModal({
        isOpen: true,
        title: 'Payment Recorded',
        message: isFullPayment 
          ? `Full payment completed! Item returned to inventory.`
          : `Payment of ₱${paymentData.amount.toFixed(2)} recorded. Remaining: ₱${newRemainingValue.toFixed(2)}`
      });

      setPaymentModal({
        isOpen: false,
        item: null
      });
    } catch (error) {
      console.error('Error recording payment:', error);
      setSuccessModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to record payment. Please try again.',
        autoClose: false
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this credit item?')) {
      try {
        const item = creditItems.find(i => i.id === id);
        
        // Delete credit item
        await remove(ref(database, `creditItems/${id}`));

        // Delete payment history
        await remove(ref(database, `creditItemPayments/${id}`));

        // Return remaining quantity to inventory if active
        if (item.status === 'active') {
          const productRef = ref(database, `inventory/${item.productId}`);
          const productSnapshot = await get(productRef);
          if (productSnapshot.exists()) {
            await set(productRef, {
              ...productSnapshot.val(),
              quantity: productSnapshot.val().quantity + item.quantity,
              updatedAt: Date.now()
            });
          }
        }

        setSuccessModal({
          isOpen: true,
          title: 'Credit Item Deleted',
          message: 'Credit item has been deleted and inventory has been updated.'
        });
      } catch (error) {
        console.error('Error deleting credit item:', error);
        setSuccessModal({
          isOpen: true,
          title: 'Error',
          message: 'Failed to delete credit item. Please try again.',
          autoClose: false
        });
      }
    }
  };

  const handleCreditComplete = () => {
    // Refresh is handled by Firebase listener
  };

  const handleEdit = (item) => {
    setEditModal({
      isOpen: true,
      item: item
    });
  };

  const handleEditSave = async (formData) => {
    const item = editModal.item;

    try {
      // Calculate new next due date if schedule changed
      let nextDueDate = item.nextDueDate;
      
      if (
        formData.paymentSchedule !== item.paymentSchedule ||
        (formData.paymentSchedule === 'weekly' && formData.weeklyDay !== item.weeklyDay) ||
        (formData.paymentSchedule === 'monthly' && formData.monthlyDate !== item.monthlyDate)
      ) {
        nextDueDate = calculateNextDueDate(
          item.startDate,
          formData.paymentSchedule,
          formData.weeklyDay,
          formData.monthlyDate
        );
      }

      // Recalculate interest and total value if interest percentage changed
      const baseValue = item.baseValue || (item.retailPrice * item.quantity);
      const newInterestPercentage = parseFloat(formData.interestPercentage);
      const newInterestAmount = (baseValue * newInterestPercentage) / 100;
      const newTotalValue = baseValue + newInterestAmount;
      const paidAmount = (item.totalValue || 0) - item.remainingValue;
      const newRemainingValue = newTotalValue - paidAmount;

      // Update credit item
      const creditItemRef = ref(database, `creditItems/${item.id}`);
      await set(creditItemRef, {
        ...item,
        customerName: formData.customerName,
        interestPercentage: newInterestPercentage,
        interestAmount: newInterestAmount,
        baseValue: baseValue,
        totalValue: newTotalValue,
        remainingValue: Math.max(0, newRemainingValue),
        paymentSchedule: formData.paymentSchedule,
        weeklyDay: formData.paymentSchedule === 'weekly' ? formData.weeklyDay : null,
        monthlyDate: formData.paymentSchedule === 'monthly' ? parseInt(formData.monthlyDate) : null,
        nextDueDate: nextDueDate,
        updatedAt: Date.now()
      });

      setSuccessModal({
        isOpen: true,
        title: 'Credit Item Updated',
        message: 'Credit item has been successfully updated.'
      });

      setEditModal({
        isOpen: false,
        item: null
      });
    } catch (error) {
      console.error('Error updating credit item:', error);
      setSuccessModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to update credit item. Please try again.',
        autoClose: false
      });
    }
  };

  const calculateNextDueDate = (startDate, schedule, weeklyDay, monthlyDate) => {
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
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

  const totalCreditValue = creditItems.reduce((sum, item) => sum + item.totalValue, 0);
  const totalRemainingValue = creditItems.reduce((sum, item) => sum + item.remainingValue, 0);
  const totalPaidValue = totalCreditValue - totalRemainingValue;

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Credit Items Management</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-3 md:p-4 border-l-4 border-blue-500">
          <p className="text-xs md:text-sm font-medium text-blue-600 uppercase">Total Credit Value</p>
          <p className="text-lg md:text-2xl font-bold text-blue-900 mt-2">₱{totalCreditValue.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-3 md:p-4 border-l-4 border-green-500">
          <p className="text-xs md:text-sm font-medium text-green-600 uppercase">Paid Amount</p>
          <p className="text-lg md:text-2xl font-bold text-green-900 mt-2">₱{totalPaidValue.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow p-3 md:p-4 border-l-4 border-orange-500">
          <p className="text-xs md:text-sm font-medium text-orange-600 uppercase">Remaining</p>
          <p className="text-lg md:text-2xl font-bold text-orange-900 mt-2">₱{totalRemainingValue.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Form */}
        <div>
          <CreditItemsForm onCreditComplete={handleCreditComplete} />
        </div>

        {/* Table and History with Tabs */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow border-b">
            <div className="flex gap-0">
              <button
                onClick={() => setActiveTab('items')}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 font-medium text-sm md:text-base transition border-b-2 ${
                  activeTab === 'items'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <List className="w-5 h-5" />
                <span>Credit Items</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 font-medium text-sm md:text-base transition border-b-2 ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <History className="w-5 h-5" />
                <span>Payment History</span>
              </button>
            </div>
          </div>

          {/* Credit Items Tab */}
          {activeTab === 'items' && (
            <>
              {/* Search */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by customer name, product, or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-lg shadow">
                <CreditItemsTable
                  items={filteredItems}
                  onPayment={handlePayment}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            </>
          )}

          {/* Payment History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {creditItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {creditItems.map(item => (
                    <PaymentHistory
                      key={item.id}
                      creditItem={item}
                      payments={payments[item.id] || []}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No payment history available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, item: null })}
        onSave={handlePaymentSave}
        item={paymentModal.item}
      />

      <EditCreditItemModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, item: null })}
        onSave={handleEditSave}
        item={editModal.item}
      />

      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
        title={successModal.title}
        message={successModal.message}
        autoClose={successModal.autoClose !== false}
      />
    </div>
  );
};

export default CreditItems;
