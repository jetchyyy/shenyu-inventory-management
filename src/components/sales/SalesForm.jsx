import React, { useState, useEffect } from 'react';
import { ref, onValue, get, set, push } from 'firebase/database';
import { database, auth } from '../../config/firebase';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';

const SalesForm = ({ onSaleComplete }) => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [useSalePrice, setUseSalePrice] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

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

    // Determine selling price: use custom sale price if provided and enabled, otherwise retail price
    const sellingPrice = useSalePrice && product.customSalePrice > 0 ? product.customSalePrice : product.retailPrice;
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
        customSalePrice: product.customSalePrice || 0,
        salePrice: sellingPrice,
        quantity: quantityInt,
        subtotal: subtotal,
        profit: profit,
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

      // Clear cart and notify
      setCart([]);
      alert('Sale completed successfully!');
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
      <h2 className="text-xl font-bold text-gray-800 mb-6">New Sale</h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={processing}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAddToCart}
              disabled={processing}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-blue-300"
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
          <label htmlFor="useSalePrice" className="text-sm font-medium text-gray-700">
            Use custom negotiated price for this sale
          </label>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-800 mb-4">Cart Items</h3>
        {cart.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No items in cart</p>
        ) : (
          <div className="space-y-2 mb-4">
            {cart.map(item => (
              <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    {item.quantity} x ₱{item.salePrice.toFixed(2)}
                    {item.usedCustomPrice && <span className="ml-2 text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded">Custom Price</span>}
                  </p>
                  <div className="text-xs text-gray-500 mt-1">
                    <span>Cost: ₱{item.costPrice.toFixed(2)} | Retail: ₱{item.retailPrice.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Profit: ₱{(item.profit || 0).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <p className="font-semibold text-gray-800">₱{item.subtotal.toFixed(2)}</p>
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
            <span className="text-2xl font-bold text-blue-600">
              ₱{calculateTotal().toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || processing}
            className="w-full flex items-center justify-center space-x-2 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>{processing ? 'Processing...' : 'Complete Sale'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesForm;