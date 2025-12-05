import { ref, get, set, push } from 'firebase/database';
import { database, auth } from '../config/firebase';
import { inventoryService } from './inventoryService';

export const salesService = {
  // Get all sales
  getAllSales: async () => {
    try {
      const salesRef = ref(database, 'sales');
      const snapshot = await get(salesRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => b.timestamp - a.timestamp);
      }
      return [];
    } catch (error) {
      console.error('Error getting sales:', error);
      return [];
    }
  },

  // Get sales by date range
  getSalesByDateRange: async (startDate, endDate) => {
    try {
      const sales = await salesService.getAllSales();
      return sales.filter(sale => {
        const saleDate = new Date(sale.timestamp);
        return saleDate >= startDate && saleDate <= endDate;
      });
    } catch (error) {
      console.error('Error getting sales by date:', error);
      return [];
    }
  },

  // Get today's sales
  getTodaySales: async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return await salesService.getSalesByDateRange(today, tomorrow);
    } catch (error) {
      console.error('Error getting today sales:', error);
      return [];
    }
  },

  // Process sale
  processSale: async (cartItems) => {
    try {
      if (!cartItems || cartItems.length === 0) {
        return { success: false, error: 'Cart is empty' };
      }

      // Validate stock availability
      for (const item of cartItems) {
        const product = await inventoryService.getItemById(item.productId);
        
        if (!product) {
          return { success: false, error: `Product ${item.name} not found` };
        }

        if (product.quantity < item.quantity) {
          return { 
            success: false, 
            error: `Insufficient stock for ${item.name}. Available: ${product.quantity}` 
          };
        }
      }

      // Calculate total
      const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

      // Create sale record
      const saleRef = push(ref(database, 'sales'));
      await set(saleRef, {
        items: cartItems,
        total,
        soldBy: auth.currentUser?.uid,
        timestamp: Date.now()
      });

      // Update inventory
      for (const item of cartItems) {
        const product = await inventoryService.getItemById(item.productId);
        await inventoryService.updateQuantity(
          item.productId, 
          product.quantity - item.quantity
        );
      }

      return { success: true, saleId: saleRef.key };
    } catch (error) {
      console.error('Error processing sale:', error);
      return { success: false, error: error.message };
    }
  },

  // Get sales statistics
  getSalesStats: async () => {
    try {
      const sales = await salesService.getAllSales();
      const todaySales = await salesService.getTodaySales();

      const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
      const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);

      return {
        totalSales,
        todayTotal,
        totalTransactions: sales.length,
        todayTransactions: todaySales.length
      };
    } catch (error) {
      console.error('Error getting sales stats:', error);
      return {
        totalSales: 0,
        todayTotal: 0,
        totalTransactions: 0,
        todayTransactions: 0
      };
    }
  }
};

export default salesService;