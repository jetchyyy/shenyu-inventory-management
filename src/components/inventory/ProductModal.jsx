import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ProductModal = ({ isOpen, onClose, onSave, editingItem }) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    quantity: 0,
    costPrice: 0,
    retailPrice: 0,
    customSalePrice: 0,
    minStock: 10
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingItem) {
      setFormData({
        sku: editingItem.sku || '',
        name: editingItem.name || '',
        quantity: editingItem.quantity || 0,
        costPrice: editingItem.costPrice || 0,
        retailPrice: editingItem.retailPrice || 0,
        customSalePrice: editingItem.customSalePrice || 0,
        minStock: editingItem.minStock || 10
      });
    } else {
      setFormData({
        sku: '',
        name: '',
        quantity: 0,
        costPrice: 0,
        retailPrice: 0,
        customSalePrice: 0,
        minStock: 10
      });
    }
    setError('');
  }, [editingItem, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.sku.trim()) {
      setError('SKU is required');
      return;
    }
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }
    if (formData.quantity < 0) {
      setError('Quantity cannot be negative');
      return;
    }
    if (formData.costPrice <= 0) {
      setError('Cost price must be greater than zero');
      return;
    }
    if (formData.retailPrice <= 0) {
      setError('Retail price must be greater than zero');
      return;
    }
    if (formData.customSalePrice < 0) {
      setError('Custom sale price cannot be negative');
      return;
    }
    if (formData.minStock < 0) {
      setError('Minimum stock cannot be negative');
      return;
    }

    onSave({
      ...formData,
      quantity: parseInt(formData.quantity),
      costPrice: parseFloat(formData.costPrice),
      retailPrice: parseFloat(formData.retailPrice),
      customSalePrice: parseFloat(formData.customSalePrice),
      minStock: parseInt(formData.minStock)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {editingItem ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., SKU001"
              disabled={!!editingItem}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter product name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost Price (₱)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              placeholder="What you paid for this product"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retail Price (₱)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.retailPrice}
              onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              placeholder="Standard selling price"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Sale Price (₱)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.customSalePrice}
              onChange={(e) => setFormData({ ...formData, customSalePrice: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              placeholder="Negotiated price (optional - leave 0 for retail price)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Stock Alert
            </label>
            <input
              type="number"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              {editingItem ? 'Update' : 'Add'} Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;