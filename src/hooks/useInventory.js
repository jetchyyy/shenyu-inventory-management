import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';

export const useInventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const inventoryRef = ref(database, 'inventory');
    
    const unsubscribe = onValue(
      inventoryRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const itemsArray = Object.keys(data).map(key => ({
              id: key,
              ...data[key]
            }));
            setItems(itemsArray);
          } else {
            setItems([]);
          }
          setError(null);
        } catch (err) {
          console.error('Error processing inventory data:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error fetching inventory:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getLowStockItems = () => {
    return items.filter(item => item.quantity <= item.minStock);
  };

  const getTotalValue = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  return { 
    items, 
    loading, 
    error, 
    getLowStockItems, 
    getTotalValue 
  };
};

export default useInventory;