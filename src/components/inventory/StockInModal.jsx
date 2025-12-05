import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const StockInModal = ({ isOpen, onClose, onSave, item }) => {
  const [quantity, setQuantity] = useState(0);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuantity(0);
      setNotes('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!quantity || quantity <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }

    onSave({
      quantity: parseInt(quantity),
      notes: notes.trim(),
      timestamp: Date.now()
    });

    setQuantity(0);
    setNotes('');
  };

  if (!isOpen || !item) return null;

  const totalCost = (item.costPrice || 0) * quantity;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800">Stock In</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition flex-shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4 md:mb-6 p-3 md:p-4 bg-blue-50 rounded-lg text-sm">
          <p className="text-xs md:text-sm text-gray-600">Product</p>
          <p className="text-base md:text-lg font-semibold text-gray-800 mt-1">{item.name}</p>
          <p className="text-xs text-gray-500">SKU: {item.sku}</p>
          <div className="mt-3 pt-3 border-t border-blue-200 space-y-1">
            <p className="text-xs md:text-sm text-gray-600">Current Quantity: <span className="font-semibold text-gray-800">{item.quantity}</span></p>
            <p className="text-xs md:text-sm text-gray-600">Cost Price: <span className="font-semibold text-gray-800">₱{(item.costPrice || 0).toFixed(2)}</span></p>
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
              Quantity to Add
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              placeholder="Enter quantity"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Total Cost for This Stock In
            </label>
            <div className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
              <p className="text-lg md:text-xl font-semibold text-green-600">₱{totalCost.toFixed(2)}</p>
            </div>
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
              placeholder="Add any notes about this stock in..."
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
              Complete Stock In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockInModal;
