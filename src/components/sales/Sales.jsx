import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../config/firebase';
import SalesForm from './SalesForm';
import SalesHistory from './SalesHistory';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const salesRef = ref(database, 'sales');
    const unsubscribe = onValue(salesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const salesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Sort by timestamp descending (newest first)
        salesArray.sort((a, b) => b.timestamp - a.timestamp);
        setSales(salesArray);
      } else {
        setSales([]);
      }
    });

    return () => unsubscribe();
  }, [refreshKey]);

  const handleSaleComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Sales Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <SalesForm onSaleComplete={handleSaleComplete} />
        </div>

        <div>
          <SalesHistory sales={sales} />
        </div>
      </div>
    </div>
  );
};

export default Sales;