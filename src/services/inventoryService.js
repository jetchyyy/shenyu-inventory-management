import { ref, get, set, push, remove, update } from 'firebase/database';
import { database } from '../config/firebase';

export const inventoryService = {
  // Get all inventory items
  getAllItems: async () => {
    try {
      const inventoryRef = ref(database, 'inventory');
      const snapshot = await get(inventoryRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting inventory:', error);
      return [];
    }
  },

  // Get single item by ID
  getItemById: async (itemId) => {
    try {
      const itemRef = ref(database, `inventory/${itemId}`);
      const snapshot = await get(itemRef);
      
      if (snapshot.exists()) {
        return { id: itemId, ...snapshot.val() };
      }
      return null;
    } catch (error) {
      console.error('Error getting item:', error);
      return null;
    }
  },

  // Get item by SKU
  getItemBySku: async (sku) => {
    try {
      const items = await inventoryService.getAllItems();
      return items.find(item => item.sku === sku);
    } catch (error) {
      console.error('Error getting item by SKU:', error);
      return null;
    }
  },

  // Add new item
  addItem: async (itemData) => {
    try {
      // Check if SKU already exists
      const existingItem = await inventoryService.getItemBySku(itemData.sku);
      if (existingItem) {
        return { success: false, error: 'SKU already exists' };
      }

      const newItemRef = push(ref(database, 'inventory'));
      await set(newItemRef, {
        ...itemData,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      return { success: true, id: newItemRef.key };
    } catch (error) {
      console.error('Error adding item:', error);
      return { success: false, error: error.message };
    }
  },

  // Update item
  updateItem: async (itemId, itemData) => {
    try {
      const itemRef = ref(database, `inventory/${itemId}`);
      await update(itemRef, {
        ...itemData,
        updatedAt: Date.now()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating item:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete item
  deleteItem: async (itemId) => {
    try {
      const itemRef = ref(database, `inventory/${itemId}`);
      await remove(itemRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting item:', error);
      return { success: false, error: error.message };
    }
  },

  // Update quantity
  updateQuantity: async (itemId, quantity) => {
    try {
      const itemRef = ref(database, `inventory/${itemId}`);
      await update(itemRef, {
        quantity,
        updatedAt: Date.now()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating quantity:', error);
      return { success: false, error: error.message };
    }
  },

  // Get low stock items
  getLowStockItems: async () => {
    try {
      const items = await inventoryService.getAllItems();
      return items.filter(item => item.quantity <= item.minStock);
    } catch (error) {
      console.error('Error getting low stock items:', error);
      return [];
    }
  }
};

export default inventoryService;