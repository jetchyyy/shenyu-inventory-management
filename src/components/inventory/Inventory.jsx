import React, { useState, useEffect } from 'react';
import { ref, onValue, push, set, remove } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import InventoryTable from './InventoryTable';
import ProductModal from './ProductModal';
import StockInModal from './StockInModal';
import SuccessModal from '../shared/SuccessModal';
import { Plus, Search, Lock } from 'lucide-react';

const Inventory = () => {
  const { userRole } = useAuth();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [stockingItem, setStockingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  const canEdit = userRole === 'superadmin' || userRole === 'admin';

  useEffect(() => {
    const inventoryRef = ref(database, 'inventory');
    const unsubscribe = onValue(inventoryRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const itemsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setItems(itemsArray);
        setFilteredItems(itemsArray);
      } else {
        setItems([]);
        setFilteredItems([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchTerm, items]);

  const handleSave = async (productData) => {
    setLoading(true);
    try {
      if (editingItem) {
        // Update existing product
        await set(ref(database, `inventory/${editingItem.id}`), {
          ...productData,
          updatedAt: Date.now()
        });
        setSuccessModal({
          isOpen: true,
          title: 'Product Updated',
          message: 'The product has been successfully updated.'
        });
      } else {
        // Check if SKU already exists
        const existingSku = items.find(item => item.sku === productData.sku);
        if (existingSku) {
          setSuccessModal({
            isOpen: true,
            title: 'SKU Already Exists',
            message: 'This SKU is already in use. Please use a different SKU.'
          });
          setLoading(false);
          return;
        }

        // Add new product
        const newProductRef = push(ref(database, 'inventory'));
        await set(newProductRef, {
          ...productData,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        setSuccessModal({
          isOpen: true,
          title: 'Product Added',
          message: 'The new product has been successfully added to inventory.'
        });
      }

      setShowModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving product:', error);
      setSuccessModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to save product. Please try again.',
        autoClose: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    if (!canEdit) {
      setSuccessModal({
        isOpen: true,
        title: 'Access Denied',
        message: 'Only Superadmin or Admin users can edit inventory items.',
        autoClose: false
      });
      return;
    }
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!canEdit) {
      setSuccessModal({
        isOpen: true,
        title: 'Access Denied',
        message: 'Only Superadmin or Admin users can delete inventory items.',
        autoClose: false
      });
      return;
    }
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await remove(ref(database, `inventory/${id}`));
        setSuccessModal({
          isOpen: true,
          title: 'Product Deleted',
          message: 'The product has been successfully deleted from inventory.'
        });
      } catch (error) {
        console.error('Error deleting product:', error);
        setSuccessModal({
          isOpen: true,
          title: 'Error',
          message: 'Failed to delete product. Please try again.',
          autoClose: false
        });
      }
    }
  };

  const handleStockIn = (item) => {
    setStockingItem(item);
    setShowStockInModal(true);
  };

  const handleStockInSave = async (stockData) => {
    setLoading(true);
    try {
      const newQuantity = stockingItem.quantity + stockData.quantity;
      
      // Update the item quantity
      await set(ref(database, `inventory/${stockingItem.id}`), {
        ...stockingItem,
        quantity: newQuantity,
        updatedAt: Date.now()
      });

      // Store stock in history
      const stockInRef = push(ref(database, `stockInHistory/${stockingItem.id}`));
      await set(stockInRef, {
        productId: stockingItem.id,
        productName: stockingItem.name,
        productSku: stockingItem.sku,
        quantityAdded: stockData.quantity,
        costPrice: stockingItem.costPrice,
        totalCost: stockingItem.costPrice * stockData.quantity,
        notes: stockData.notes,
        timestamp: stockData.timestamp,
        previousQuantity: stockingItem.quantity,
        newQuantity: newQuantity
      });

      setSuccessModal({
        isOpen: true,
        title: 'Stock Added',
        message: `Successfully added ${stockData.quantity} units to ${stockingItem.name}. New quantity: ${newQuantity}`
      });

      setShowStockInModal(false);
      setStockingItem(null);
    } catch (error) {
      console.error('Error adding stock:', error);
      setSuccessModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to add stock. Please try again.',
        autoClose: false
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Inventory Management</h1>
        {canEdit ? (
          <button
            onClick={() => {
              setEditingItem(null);
              setShowModal(true);
            }}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Add Product</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2 bg-gray-300 text-gray-600 px-4 py-2 rounded-lg cursor-not-allowed" title="Only Admin or Superadmin can add products">
            <Lock className="w-5 h-5" />
            <span>Add Product</span>
          </div>
        )}
      </div>

      {/* Total Cost Price Card */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-6 border-l-4 border-purple-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-600 uppercase tracking-wide">Total Inventory Value</p>
            <p className="text-4xl font-bold text-purple-900 mt-2">
              ₱{filteredItems.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0).toFixed(2)}
            </p>
            <p className="text-xs text-purple-600 mt-2">Based on cost price × quantity</p>
          </div>
          <div className="text-6xl text-purple-200">📦</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <InventoryTable
          items={filteredItems}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStockIn={handleStockIn}
          canEdit={canEdit}
        />
      </div>

      <ProductModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        editingItem={editingItem}
      />

      <StockInModal
        isOpen={showStockInModal}
        onClose={() => {
          setShowStockInModal(false);
          setStockingItem(null);
        }}
        onSave={handleStockInSave}
        item={stockingItem}
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

export default Inventory;