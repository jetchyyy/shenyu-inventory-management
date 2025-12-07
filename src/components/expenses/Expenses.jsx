import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, set, push, get } from 'firebase/database';
import { database } from '../../config/firebase';
import ExpensesForm from './ExpensesForm';
import ExpensesTable from './ExpensesTable';
import EditExpenseModal from './EditExpenseModal';
import SuccessModal from '../shared/SuccessModal';
import { Search, TrendingDown } from 'lucide-react';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' or 'giveaways'
  const [editModal, setEditModal] = useState({
    isOpen: false,
    item: null
  });
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  // Load expenses and giveaways
  useEffect(() => {
    const expensesRef = ref(database, 'expenses');
    const unsubscribe = onValue(expensesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const expensesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setExpenses(expensesArray.sort((a, b) => b.date - a.date));
        setFilteredExpenses(expensesArray.sort((a, b) => b.date - a.date));
      } else {
        setExpenses([]);
        setFilteredExpenses([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Filter expenses based on search and tab
  useEffect(() => {
    let filtered = expenses.filter(expense =>
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter by type (expense or giveaway)
    if (activeTab === 'expenses') {
      filtered = filtered.filter(e => e.type === 'expense');
    } else if (activeTab === 'giveaways') {
      filtered = filtered.filter(e => e.type === 'giveaway');
    }

    setFilteredExpenses(filtered);
  }, [searchTerm, expenses, activeTab]);

  const handleExpenseComplete = () => {
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
      const expenseRef = ref(database, `expenses/${item.id}`);
      await set(expenseRef, {
        ...item,
        description: formData.description,
        category: formData.category,
        amount: parseFloat(formData.amount),
        notes: formData.notes || '',
        updatedAt: Date.now()
      });

      setSuccessModal({
        isOpen: true,
        title: 'Expense Updated',
        message: 'Expense has been successfully updated.'
      });

      setEditModal({
        isOpen: false,
        item: null
      });
    } catch (error) {
      console.error('Error updating expense:', error);
      setSuccessModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to update expense. Please try again.',
        autoClose: false
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await remove(ref(database, `expenses/${id}`));
        setSuccessModal({
          isOpen: true,
          title: 'Deleted',
          message: 'Item has been successfully deleted.'
        });
      } catch (error) {
        console.error('Error deleting item:', error);
        setSuccessModal({
          isOpen: true,
          title: 'Error',
          message: 'Failed to delete item. Please try again.',
          autoClose: false
        });
      }
    }
  };

  // Calculate totals
  const expensesTotals = expenses.filter(e => e.type === 'expense');
  const giveawayTotals = expenses.filter(e => e.type === 'giveaway');
  const totalExpenses = expensesTotals.reduce((sum, e) => sum + e.amount, 0);
  const totalGiveaways = giveawayTotals.reduce((sum, e) => sum + e.cost, 0);
  const overallTotal = totalExpenses + totalGiveaways;

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Expenses & Giveaways</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-3 md:p-4 border-l-4 border-red-500">
          <p className="text-xs md:text-sm font-medium text-red-600 uppercase">Total Expenses</p>
          <p className="text-lg md:text-2xl font-bold text-red-900 mt-2">₱{totalExpenses.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow p-3 md:p-4 border-l-4 border-orange-500">
          <p className="text-xs md:text-sm font-medium text-orange-600 uppercase">Free Giveaways</p>
          <p className="text-lg md:text-2xl font-bold text-orange-900 mt-2">₱{totalGiveaways.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg shadow p-3 md:p-4 border-l-4 border-pink-500">
          <p className="text-xs md:text-sm font-medium text-pink-600 uppercase">Total Cost</p>
          <p className="text-lg md:text-2xl font-bold text-pink-900 mt-2">₱{overallTotal.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Form */}
        <div>
          <ExpensesForm onExpenseComplete={handleExpenseComplete} />
        </div>

        {/* Table with Tabs */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow border-b">
            <div className="flex gap-0">
              <button
                onClick={() => setActiveTab('expenses')}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 font-medium text-sm md:text-base transition border-b-2 ${
                  activeTab === 'expenses'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <TrendingDown className="w-5 h-5" />
                <span>Expenses</span>
              </button>
              <button
                onClick={() => setActiveTab('giveaways')}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 font-medium text-sm md:text-base transition border-b-2 ${
                  activeTab === 'giveaways'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <span>🎁</span>
                <span>Free Giveaways</span>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by description or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow">
            <ExpensesTable
              items={filteredExpenses}
              expenseType={activeTab}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>

      <EditExpenseModal
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

export default Expenses;
