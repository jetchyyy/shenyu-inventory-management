import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../config/firebase';
import StatCard from './StatCard';
import { Package, ShoppingCart, AlertTriangle, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    totalSales: 0,
    todaySales: 0,
    totalProfit: 0,
    todayProfit: 0
  });
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    const inventoryRef = ref(database, 'inventory');
    const salesRef = ref(database, 'sales');

    const unsubInventory = onValue(inventoryRef, (snapshot) => {
      if (snapshot.exists()) {
        const items = Object.values(snapshot.val());
        setStats(prev => ({
          ...prev,
          totalProducts: items.length,
          lowStock: items.filter(item => item.quantity <= item.minStock).length
        }));
      } else {
        setStats(prev => ({
          ...prev,
          totalProducts: 0,
          lowStock: 0
        }));
      }
    });

    const unsubSales = onValue(salesRef, (snapshot) => {
      if (snapshot.exists()) {
        const salesData = snapshot.val();
        const sales = Object.keys(salesData).map(key => ({
          id: key,
          ...salesData[key]
        }));
        
        // Sort by timestamp descending
        sales.sort((a, b) => b.timestamp - a.timestamp);
        
        const today = new Date().toDateString();
        const todaySales = sales.filter(sale => 
          new Date(sale.timestamp).toDateString() === today
        );

        setStats(prev => ({
          ...prev,
          totalSales: sales.reduce((sum, sale) => sum + sale.total, 0),
          todaySales: todaySales.reduce((sum, sale) => sum + sale.total, 0),
          totalProfit: sales.reduce((sum, sale) => sum + (sale.totalProfit || 0), 0),
          todayProfit: todaySales.reduce((sum, sale) => sum + (sale.totalProfit || 0), 0)
        }));

        setRecentSales(sales.slice(0, 5));
      } else {
        setStats(prev => ({
          ...prev,
          totalSales: 0,
          todaySales: 0,
          totalProfit: 0,
          todayProfit: 0
        }));
        setRecentSales([]);
      }
    });

    return () => {
      unsubInventory();
      unsubSales();
    };
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStock}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Total Sales"
          value={`₱${stats.totalSales.toFixed(2)}`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Today's Sales"
          value={`₱${stats.todaySales.toFixed(2)}`}
          icon={ShoppingCart}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-4 md:p-6 text-white">
          <h3 className="text-sm md:text-lg font-semibold mb-2">Total Profit</h3>
          <p className="text-2xl md:text-3xl font-bold">₱{stats.totalProfit.toFixed(2)}</p>
          <p className="text-green-100 text-xs md:text-sm mt-2">All-time earnings</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-4 md:p-6 text-white">
          <h3 className="text-sm md:text-lg font-semibold mb-2">Today's Profit</h3>
          <p className="text-2xl md:text-3xl font-bold">₱{stats.todayProfit.toFixed(2)}</p>
          <p className="text-blue-100 text-xs md:text-sm mt-2">Today's earnings</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 md:p-6 border-b">
          <h2 className="text-lg md:text-xl font-bold text-gray-800">Recent Sales</h2>
        </div>
        <div className="p-4 md:p-6">
          {recentSales.length === 0 ? (
            <p className="text-gray-500 text-center py-6 md:py-8 text-sm">No sales recorded yet</p>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {recentSales.map(sale => (
                <div key={sale.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 bg-gray-50 rounded-lg gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm md:text-base">
                      {sale.items.length} item{sale.items.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600">
                      {new Date(sale.timestamp).toLocaleString()}
                    </p>
                    {sale.totalProfit && (
                      <p className="text-xs text-green-600 mt-1">
                        Profit: ₱{sale.totalProfit.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600 text-sm md:text-base">₱{sale.total.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;