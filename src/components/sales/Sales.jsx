import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../config/firebase';
import SalesForm from './SalesForm';
import CustomSalesForm from './CustomSalesForm';
import ApprovalsDashboard from './ApprovalsDashboard';
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
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Sales Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <div>
          <SalesForm onSaleComplete={handleSaleComplete} />
        </div>

        <div>
          <CustomSalesForm onSaleComplete={handleSaleComplete} />
        </div>

        <div className="space-y-4 md:space-y-6">
          <ApprovalsDashboard />
          <SalesHistory sales={sales} />
        </div>
      </div>
    </div>
  );
};

export default Sales;