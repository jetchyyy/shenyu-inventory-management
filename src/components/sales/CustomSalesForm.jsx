import React, { useState, useEffect } from 'react';
import { ref, onValue, get, set, push } from 'firebase/database';
import { database, auth } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import SuccessModal from '../shared/SuccessModal';
import { Plus, Trash2, DollarSign, AlertCircle } from 'lucide-react';

const CustomSalesForm = ({ onSaleComplete }) => {
  const { userRole } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  const isStaff = userRole === 'staff';
  const isSuperAdmin = userRole === 'superadmin';

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

  const handleAddToCart = () => {
    setError('');
    
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    if (!customPrice || parseFloat(customPrice) <= 0) {
      setError('Please enter a selling price greater than zero');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) {
      setError('Product not found');
      return;
    }

    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    const cartItem = cart.find(item => item.productId === selectedProduct);
    const totalQuantity = cartItem ? cartItem.quantity + parseInt(quantity) : parseInt(quantity);

    if (totalQuantity > product.quantity) {
      setError(`Only ${product.quantity} units available in stock`);
      return;
    }

    const sellingPrice = parseFloat(customPrice);
    const quantityInt = parseInt(quantity);
    const subtotal = quantityInt * sellingPrice;
    const profit = (sellingPrice - product.costPrice) * quantityInt;
    const profitMargin = ((profit / subtotal) * 100).toFixed(2);

    if (cartItem) {
      setCart(cart.map(item =>
        item.productId === selectedProduct
          ? { 
              ...item, 
              quantity: totalQuantity, 
              customPrice: sellingPrice,
              subtotal: totalQuantity * sellingPrice,
              profit: (sellingPrice - product.costPrice) * totalQuantity,
              profitMargin: (((sellingPrice - product.costPrice) * totalQuantity) / (totalQuantity * sellingPrice) * 100).toFixed(2)
            }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        costPrice: product.costPrice,
        retailPrice: product.retailPrice,
        resellerPrice: product.resellerPrice || 0,
        customPrice: sellingPrice,
        quantity: quantityInt,
        subtotal: subtotal,
        profit: profit,
        profitMargin: profitMargin,
        isCustomSale: true
      }]);
    }

    setSelectedProduct('');
    setCustomPrice('');
    setQuantity(1);
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateTotalProfit = () => {
    return cart.reduce((sum, item) => sum + (item.profit || 0), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    if (!customerName.trim()) {
      setError('Please enter customer name or identifier');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // Validate stock availability
      for (const item of cart) {
        const productRef = ref(database, `inventory/${item.productId}`);
        const snapshot = await get(productRef);
        
        if (!snapshot.exists()) {
          throw new Error(`Product ${item.name} no longer exists`);
        }

        const currentStock = snapshot.val().quantity;
        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name}. Available: ${currentStock}`);
        }
      }

      const total = calculateTotal();
      const profit = calculateTotalProfit();

      // If staff, create pending approval record in separate "pendingApprovals" node
      if (isStaff) {
        const approvalRef = push(ref(database, 'pendingApprovals'));
        await set(approvalRef, {
          items: cart,
          total: total,
          totalProfit: profit,
          customerName: customerName,
          saleType: 'custom',
          requestedBy: auth.currentUser.uid,
          status: 'pending',
          createdAt: Date.now(),
          approvalId: approvalRef.key
        });

        setCart([]);
        setCustomerName('');
        setSuccessModal({
          isOpen: true,
          title: 'Sale Submitted for Approval',
          message: `Custom sale for ${customerName} (₱${total.toFixed(2)}) has been submitted to superadmin for approval.`,
          autoClose: false
        });
      } else {
        // If superadmin or admin, create sale immediately (no approval needed)
        const saleRef = push(ref(database, 'sales'));
        await set(saleRef, {
          items: cart,
          total: total,
          totalProfit: profit,
          customerName: customerName,
          saleType: 'custom',
          status: 'approved',
          soldBy: auth.currentUser.uid,
          timestamp: Date.now()
        });

        // Update inventory immediately
        for (const item of cart) {
          const productRef = ref(database, `inventory/${item.productId}`);
          const snapshot = await get(productRef);
          const currentQuantity = snapshot.val().quantity;
          
          await set(productRef, {
            ...snapshot.val(),
            quantity: currentQuantity - item.quantity,
            updatedAt: Date.now()
          });
        }

        setCart([]);
        setCustomerName('');
        setSuccessModal({
          isOpen: true,
          title: 'Custom Sale Completed',
          message: `Sale to ${customerName} completed! Total: ₱${total.toFixed(2)} | Profit: ₱${profit.toFixed(2)} | Margin: ${((profit / total) * 100).toFixed(2)}%`
        });
      }

      if (onSaleComplete) onSaleComplete();
    } catch (error) {
      console.error('Error processing sale:', error);
      setError(error.message || 'Failed to process sale. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-2 mb-6">
        <DollarSign className="w-6 h-6 text-green-600" />
        <h2 className="text-xl font-bold text-gray-800">Custom Sale</h2>
      </div>

      {isStaff && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg text-sm mb-4 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Approval Required</p>
            <p className="text-xs mt-1">Custom sales by staff require superadmin approval before completion.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Name/ID
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g., John Doe, Store Name, Order #123"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={processing}
          />
        </div>

        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

          <div className="w-24">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Qty
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={processing}
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sell Price (₱)
            </label>
            <input
              type="number"
              step="0.01"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={processing}
              min="0"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAddToCart}
              disabled={processing}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:bg-green-300"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-800 mb-4">Cart Items</h3>
        {cart.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No items in cart</p>
        ) : (
          <div className="space-y-2 mb-4">
            {cart.map(item => (
              <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    {item.quantity} x ₱{item.customPrice.toFixed(2)}
                  </p>
                  <div className="text-xs text-gray-500 mt-1">
                    <span>Cost: ₱{item.costPrice.toFixed(2)} | Retail: ₱{item.retailPrice.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-green-600 font-semibold mt-1">
                    Profit: ₱{(item.profit || 0).toFixed(2)} ({item.profitMargin}%)
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">₱{item.subtotal.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveFromCart(item.productId)}
                    className="text-red-600 hover:text-red-800"
                    disabled={processing}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700">Subtotal:</span>
            <span className="text-lg font-semibold text-gray-800">
              ₱{calculateTotal().toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-4 pb-4 border-b">
            <span className="text-gray-700">Total Profit:</span>
            <span className="text-lg font-semibold text-green-600">
              ₱{calculateTotalProfit().toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-bold text-gray-800">Total:</span>
            <span className="text-2xl font-bold text-green-600">
              ₱{calculateTotal().toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || processing || !customerName.trim()}
            className="w-full flex items-center justify-center space-x-2 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
          >
            <DollarSign className="w-5 h-5" />
            <span>
              {processing 
                ? 'Processing...' 
                : isStaff 
                ? 'Submit for Approval' 
                : 'Complete Custom Sale'
              }
            </span>
          </button>
        </div>
      </div>

      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
        title={successModal.title}
        message={successModal.message}
      />
    </div>
  );
};

export default CustomSalesForm;
