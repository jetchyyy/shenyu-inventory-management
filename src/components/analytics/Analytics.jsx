import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../config/firebase';
import AnalyticsCards from './AnalyticsCards';
import SalesChart from './SalesChart';
import TopProductsChart from './TopProductsChart';
import ExpensesChart from './ExpensesChart';
import CategoryBreakdown from './CategoryBreakdown';
import TopResellersChart from './TopResellersChart';
import ResellerPerformanceChart from './ResellerPerformanceChart';
import { TrendingUp, Calendar } from 'lucide-react';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('30'); // 7, 30, 90 days
  const [analytics, setAnalytics] = useState({
    totalSales: 0,
    totalProfit: 0,
    totalExpenses: 0,
    averageOrderValue: 0,
    profitMargin: 0,
    salesData: [],
    topProducts: [],
    expensesData: [],
    categoryData: [],
    topResellers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const daysInRange = parseInt(timeRange);
    const cutoffDate = Date.now() - (daysInRange * 24 * 60 * 60 * 1000);

    let salesLoaded = false;
    let expensesLoaded = false;

    // Fetch sales data
    const salesRef = ref(database, 'sales');
    const unsubSales = onValue(salesRef, (snapshot) => {
      if (snapshot.exists()) {
        const salesData = snapshot.val();
        const sales = Object.keys(salesData)
          .map(key => ({
            id: key,
            ...salesData[key]
          }))
          .filter(sale => sale.status === 'approved' && sale.timestamp >= cutoffDate)
          .sort((a, b) => a.timestamp - b.timestamp);

        // Calculate metrics
        const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
        const totalProfit = sales.reduce((sum, sale) => sum + (sale.totalProfit || 0), 0);
        const avgOrderValue = sales.length > 0 ? totalSales / sales.length : 0;
        const profitMargin = totalSales > 0 ? (totalProfit / totalSales * 100) : 0;

        // Group sales by date
        const salesByDate = {};
        sales.forEach(sale => {
          const dateStr = new Date(sale.timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
          if (!salesByDate[dateStr]) {
            salesByDate[dateStr] = { date: dateStr, sales: 0, profit: 0, orders: 0 };
          }
          salesByDate[dateStr].sales += sale.total || 0;
          salesByDate[dateStr].profit += sale.totalProfit || 0;
          salesByDate[dateStr].orders += 1;
        });

        // Get last 15 days of data, or all data if less than 15 days exist
        const allDates = Object.values(salesByDate).sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateA - dateB;
        });
        const salesChartData = allDates.slice(-15);

        // Get top products
        const productSales = {};
        sales.forEach(sale => {
          if (sale.items) {
            sale.items.forEach(item => {
              if (!productSales[item.productId]) {
                productSales[item.productId] = {
                  name: item.name,
                  sku: item.sku,
                  quantity: 0,
                  revenue: 0,
                  profit: 0
                };
              }
              productSales[item.productId].quantity += item.quantity;
              productSales[item.productId].revenue += item.subtotal;
              productSales[item.productId].profit += item.profit || 0;
            });
          }
        });

        const topProducts = Object.values(productSales)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10);

        // Get top resellers
        const resellerSales = {};
        sales.forEach(sale => {
          // Only track reseller sales
          if (sale.customerType === 'reseller' && sale.customerName) {
            if (!resellerSales[sale.customerName]) {
              resellerSales[sale.customerName] = {
                name: sale.customerName,
                totalSales: 0,
                totalProfit: 0,
                totalItems: 0,
                transactionCount: 0
              };
            }
            resellerSales[sale.customerName].totalSales += sale.total || 0;
            resellerSales[sale.customerName].totalProfit += sale.totalProfit || 0;
            resellerSales[sale.customerName].transactionCount += 1;

            // Count items
            if (sale.items) {
              sale.items.forEach(item => {
                resellerSales[sale.customerName].totalItems += item.quantity || 0;
              });
            }
          }
        });

        const topResellers = Object.values(resellerSales)
          .map(reseller => ({
            ...reseller,
            averageSale: reseller.transactionCount > 0 ? reseller.totalSales / reseller.transactionCount : 0,
            profitMargin: reseller.totalSales > 0 ? (reseller.totalProfit / reseller.totalSales * 100) : 0
          }))
          .sort((a, b) => b.totalSales - a.totalSales);

        setAnalytics(prev => ({
          ...prev,
          totalSales,
          totalProfit,
          averageOrderValue: avgOrderValue,
          profitMargin,
          salesData: salesChartData,
          topProducts,
          topResellers
        }));

        salesLoaded = true;
        if (expensesLoaded) {
          setLoading(false);
        }
      }
    });

    // Fetch expenses data
    const expensesRef = ref(database, 'expenses');
    const unsubExpenses = onValue(expensesRef, (snapshot) => {
      if (snapshot.exists()) {
        const expensesData = snapshot.val();
        const expenses = Object.keys(expensesData)
          .map(key => ({
            id: key,
            ...expensesData[key]
          }))
          .filter(exp => exp.date >= cutoffDate)
          .sort((a, b) => a.date - b.date);

        // Group expenses by date
        const expensesByDate = {};
        expenses.forEach(exp => {
          const dateStr = new Date(exp.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
          if (!expensesByDate[dateStr]) {
            expensesByDate[dateStr] = { date: dateStr, expenses: 0, giveaways: 0 };
          }
          if (exp.type === 'expense') {
            expensesByDate[dateStr].expenses += exp.amount || 0;
          } else {
            expensesByDate[dateStr].giveaways += exp.cost || 0;
          }
        });

        const expensesChartData = Object.values(expensesByDate)
          .sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA - dateB;
          })
          .slice(-15);

        // Group expenses by category
        const categoryData = {};
        expenses.forEach(exp => {
          if (!categoryData[exp.category]) {
            categoryData[exp.category] = { category: exp.category, amount: 0, count: 0 };
          }
          categoryData[exp.category].amount += (exp.type === 'expense' ? exp.amount : exp.cost) || 0;
          categoryData[exp.category].count += 1;
        });

        const totalExpenses = expenses.reduce((sum, exp) => {
          return sum + ((exp.type === 'expense' ? exp.amount : exp.cost) || 0);
        }, 0);

        setAnalytics(prev => ({
          ...prev,
          totalExpenses,
          expensesData: expensesChartData,
          categoryData: Object.values(categoryData).sort((a, b) => b.amount - a.amount)
        }));

        expensesLoaded = true;
        if (salesLoaded) {
          setLoading(false);
        }
      } else {
        // No expenses data yet
        expensesLoaded = true;
        if (salesLoaded) {
          setLoading(false);
        }
      }
    });

    return () => {
      unsubSales();
      unsubExpenses();
    };
  }, [timeRange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Analytics & Reports</h1>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Analytics Cards */}
      {!loading && (
        <>
          <AnalyticsCards analytics={analytics} />

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Trend Chart */}
            <SalesChart data={analytics.salesData} />

            {/* Expenses Chart */}
            <ExpensesChart data={analytics.expensesData} />
          </div>

          {/* Top Products and Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <TopProductsChart products={analytics.topProducts} />

            {/* Category Breakdown */}
            <CategoryBreakdown data={analytics.categoryData} />
          </div>

          {/* Reseller Analytics */}
          {analytics.topResellers.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Resellers */}
              <TopResellersChart resellers={analytics.topResellers} />

              {/* Reseller Performance */}
              <ResellerPerformanceChart resellers={analytics.topResellers} />
            </div>
          )}
        </>
      )}

      {loading && (
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
