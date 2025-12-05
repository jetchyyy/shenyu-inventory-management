import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';

export const useSales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const salesRef = ref(database, 'sales');
    
    const unsubscribe = onValue(
      salesRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const salesArray = Object.keys(data).map(key => ({
              id: key,
              ...data[key]
            }));
            // Sort by timestamp descending
            salesArray.sort((a, b) => b.timestamp - a.timestamp);
            setSales(salesArray);
          } else {
            setSales([]);
          }
          setError(null);
        } catch (err) {
          console.error('Error processing sales data:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error fetching sales:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getTodaySales = () => {
    const today = new Date().toDateString();
    return sales.filter(sale => 
      new Date(sale.timestamp).toDateString() === today
    );
  };

  const getTotalSales = () => {
    return sales.reduce((sum, sale) => sum + sale.total, 0);
  };

  const getTodayTotal = () => {
    const todaySales = getTodaySales();
    return todaySales.reduce((sum, sale) => sum + sale.total, 0);
  };

  const getSalesByDateRange = (startDate, endDate) => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= startDate && saleDate <= endDate;
    });
  };

  return { 
    sales, 
    loading, 
    error, 
    getTodaySales, 
    getTotalSales, 
    getTodayTotal,
    getSalesByDateRange 
  };
};

export default useSales;