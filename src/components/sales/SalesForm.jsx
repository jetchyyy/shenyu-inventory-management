import React, { useState, useEffect } from 'react';
import { ref, onValue, get, set, push } from 'firebase/database';
import { database, auth } from '../../config/firebase';
import SuccessModal from '../shared/SuccessModal';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';

const SalesForm = ({ onSaleComplete }) => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customerType, setCustomerType] = useState('retail');
  const [useSalePrice, setUseSalePrice] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

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

    // Determine selling price based on customer type and custom sale price
    let sellingPrice;
    let priceSource = '';
    
    if (useSalePrice && product.customSalePrice > 0) {
      sellingPrice = product.customSalePrice;
      priceSource = 'custom';
    } else if (customerType === 'reseller' && product.resellerPrice > 0) {
      sellingPrice = product.resellerPrice;
      priceSource = 'reseller';
    } else {
      sellingPrice = product.retailPrice;
      priceSource = 'retail';
    }
    
    const quantityInt = parseInt(quantity);
    const subtotal = quantityInt * sellingPrice;
    const profit = (sellingPrice - product.costPrice) * quantityInt;

    if (cartItem) {
      setCart(cart.map(item =>
        item.productId === selectedProduct
          ? { 
              ...item, 
              quantity: totalQuantity, 
              subtotal: totalQuantity * sellingPrice,
              profit: (sellingPrice - product.costPrice) * totalQuantity,
              salePrice: sellingPrice,
              customerType: customerType,
              priceSource: priceSource,
              usedCustomPrice: useSalePrice && product.customSalePrice > 0
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
        customSalePrice: product.customSalePrice || 0,
        salePrice: sellingPrice,
        quantity: quantityInt,
        subtotal: subtotal,
        profit: profit,
        customerType: customerType,
        priceSource: priceSource,
        usedCustomPrice: useSalePrice && product.customSalePrice > 0
      }]);
    }

    setSelectedProduct('');
    setQuantity(1);
    setUseSalePrice(false);
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

      // Create sale record
      const saleRef = push(ref(database, 'sales'));
      await set(saleRef, {
        items: cart,
        total: calculateTotal(),
        totalProfit: calculateTotalProfit(),
        customerType: customerType,
        soldBy: auth.currentUser.uid,
        timestamp: Date.now()
      });

      // Update inventory
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

      // Clear cart and show success modal
      setCart([]);
      setSuccessModal({
        isOpen: true,
        title: 'Sale Completed',
        message: `Sale completed successfully! Total: ₱${calculateTotal().toFixed(2)} | Profit: ₱${calculateTotalProfit().toFixed(2)}`
      });
      if (onSaleComplete) onSaleComplete();
    } catch (error) {
      console.error('Error processing sale:', error);
      setError(error.message || 'Failed to process sale. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-6">New Sale</h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs md:text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-3 md:space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3">
          <div className="flex-1">
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Select Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
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

          <div className="w-full sm:w-24 md:w-28">
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={processing}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAddToCart}
              disabled={processing}
              className="w-full sm:w-auto px-3 md:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-blue-300 text-sm md:text-base"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="useSalePrice"
            checked={useSalePrice}
            onChange={(e) => setUseSalePrice(e.target.checked)}
            className="w-4 h-4 rounded"
            disabled={processing}
          />
          <label htmlFor="useSalePrice" className="text-xs md:text-sm font-medium text-gray-700">
            Use custom negotiated price
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex-1">
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Customer Type
            </label>
            <select
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value)}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={processing}
            >
              <option value="retail">Retail Customer</option>
              <option value="reseller">Reseller</option>
            </select>
          </div>
          <div className="text-xs md:text-sm text-gray-600 p-2 md:p-3 bg-white rounded flex items-center justify-center whitespace-nowrap">
            <p>{customerType === 'reseller' ? '💜 Reseller' : '💙 Retail'}</p>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm md:text-base">Cart Items</h3>
        {cart.length === 0 ? (
          <p className="text-gray-500 text-center py-6 md:py-8 text-sm">No items in cart</p>
        ) : (
          <div className="space-y-2 mb-4">
            {cart.map(item => (
              <div key={item.productId} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-600">
                      {item.quantity} x ₱{item.salePrice.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800 text-sm">₱{item.subtotal.toFixed(2)}</p>
                    <button
                      onClick={() => handleRemoveFromCart(item.productId)}
                      className="text-red-600 hover:text-red-800 flex-shrink-0"
                      disabled={processing}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.usedCustomPrice && <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded">Custom</span>}
                  {item.priceSource === 'reseller' && <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2 py-1 rounded">Reseller</span>}
                  <span className="text-xs text-green-600 font-medium">Profit: ₱{(item.profit || 0).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-3 md:pt-4 mt-4">
          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-gray-700">Subtotal:</span>
            <span className="font-semibold text-gray-800">
              ₱{calculateTotal().toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-3 md:mb-4 pb-3 md:pb-4 border-b text-sm">
            <span className="text-gray-700">Total Profit:</span>
            <span className="font-semibold text-green-600">
              ₱{calculateTotalProfit().toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-gray-800 text-sm">Total:</span>
            <span className="text-lg md:text-2xl font-bold text-blue-600">
              ₱{calculateTotal().toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || processing}
            className="w-full flex items-center justify-center space-x-2 bg-green-500 text-white py-2 md:py-3 rounded-lg hover:bg-green-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed text-sm md:text-base"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>{processing ? 'Processing...' : 'Complete Sale'}</span>
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

export default SalesForm;