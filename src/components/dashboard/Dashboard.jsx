import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import StatCard from './StatCard';
import { Package, ShoppingCart, AlertTriangle, TrendingUp, Zap, TrendingDown, Clock } from 'lucide-react';

const Dashboard = () => {
  const { userRole } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    totalSales: 0,
    todaySales: 0,
    salesProfit: 0,
    todaySalesProfit: 0,
    loanProfit: 0,
    todayLoanProfit: 0,
    totalProfit: 0,
    todayProfit: 0,
    totalExpenses: 0,
    todayExpenses: 0,
    totalGiveaways: 0,
    netProfit: 0,
    todayNetProfit: 0,
    pendingApprovalsCount: 0,
    pendingExpenseApprovalsCount: 0
  });
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    const inventoryRef = ref(database, 'inventory');
    const salesRef = ref(database, 'sales');
    const creditItemsRef = ref(database, 'creditItems');
    const expensesRef = ref(database, 'expenses');
    const creditPaymentsRef = ref(database, 'creditItemPayments');

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

        const salesProfit = sales.reduce((sum, sale) => sum + (sale.totalProfit || 0), 0);
        const todaySalesProfit = todaySales.reduce((sum, sale) => sum + (sale.totalProfit || 0), 0);

        setStats(prev => ({
          ...prev,
          totalSales: sales.reduce((sum, sale) => sum + sale.total, 0),
          todaySales: todaySales.reduce((sum, sale) => sum + sale.total, 0),
          salesProfit: salesProfit,
          todaySalesProfit: todaySalesProfit,
          totalProfit: salesProfit + prev.loanProfit,
          todayProfit: todaySalesProfit + prev.todayLoanProfit
        }));

        setRecentSales(sales.slice(0, 5));
      } else {
        setStats(prev => ({
          ...prev,
          totalSales: 0,
          todaySales: 0,
          salesProfit: 0,
          todaySalesProfit: 0,
          totalProfit: prev.loanProfit,
          todayProfit: prev.todayLoanProfit
        }));
        setRecentSales([]);
      }
    });

    const unsubCreditItems = onValue(creditItemsRef, (snapshot) => {
      if (snapshot.exists()) {
        const creditData = snapshot.val();
        const creditItems = Object.keys(creditData).map(key => ({
          id: key,
          ...creditData[key]
        }));

        const today = new Date().toDateString();
        
        // Calculate loan profit from completed credits only
        let totalLoanProfit = 0;
        let todayLoanProfit = 0;

        creditItems.forEach(item => {
          if (item.status === 'completed' && item.interestAmount) {
            totalLoanProfit += item.interestAmount;
            
            // Check if completed today
            if (item.lastPaymentDate && new Date(item.lastPaymentDate).toDateString() === today) {
              todayLoanProfit += item.interestAmount;
            }
          }
        });

        setStats(prev => ({
          ...prev,
          loanProfit: totalLoanProfit,
          todayLoanProfit: todayLoanProfit,
          totalProfit: prev.salesProfit + totalLoanProfit,
          todayProfit: prev.todaySalesProfit + todayLoanProfit
        }));
      } else {
        setStats(prev => ({
          ...prev,
          loanProfit: 0,
          todayLoanProfit: 0,
          totalProfit: prev.salesProfit,
          todayProfit: prev.todaySalesProfit
        }));
      }
    });

    const unsubExpenses = onValue(expensesRef, (snapshot) => {
      if (snapshot.exists()) {
        const expenseData = snapshot.val();
        const expensesList = Object.keys(expenseData).map(key => ({
          id: key,
          ...expenseData[key]
        }));

        const today = new Date().toDateString();
        const todayExpenses = expensesList.filter(exp => 
          new Date(exp.date).toDateString() === today
        );

        let totalExpenses = 0;
        let todayExpensesTotal = 0;
        let totalGiveaways = 0;

        expensesList.forEach(exp => {
          if (exp.type === 'expense') {
            totalExpenses += exp.amount || 0;
          } else {
            totalGiveaways += exp.cost || 0;
          }
        });

        todayExpenses.forEach(exp => {
          if (exp.type === 'expense') {
            todayExpensesTotal += exp.amount || 0;
          }
        });

        setStats(prev => {
          const netProfit = prev.totalProfit - totalExpenses - totalGiveaways;
          const todayNetProfit = prev.todayProfit - todayExpensesTotal;
          
          return {
            ...prev,
            totalExpenses,
            todayExpenses: todayExpensesTotal,
            totalGiveaways,
            netProfit,
            todayNetProfit
          };
        });
      } else {
        setStats(prev => {
          const netProfit = prev.totalProfit;
          const todayNetProfit = prev.todayProfit;
          
          return {
            ...prev,
            totalExpenses: 0,
            todayExpenses: 0,
            totalGiveaways: 0,
            netProfit,
            todayNetProfit
          };
        });
      }
    });

    // Add listener for pending approvals if user is admin/superadmin
    let unsubApprovals = () => {};
    let unsubExpenseApprovals = () => {};
    if (userRole === 'admin' || userRole === 'superadmin') {
      const approvalsRef = ref(database, 'creditApprovals');
      unsubApprovals = onValue(approvalsRef, (snapshot) => {
        if (snapshot.exists()) {
          const approvalsData = snapshot.val();
          const approvals = Object.values(approvalsData);
          const pendingCount = approvals.filter(a => a.status === 'pending').length;
          
          setStats(prev => ({
            ...prev,
            pendingApprovalsCount: pendingCount
          }));
        } else {
          setStats(prev => ({
            ...prev,
            pendingApprovalsCount: 0
          }));
        }
      });

      const expenseApprovalsRef = ref(database, 'expenseApprovals');
      unsubExpenseApprovals = onValue(expenseApprovalsRef, (snapshot) => {
        if (snapshot.exists()) {
          const approvalsData = snapshot.val();
          const approvals = Object.values(approvalsData);
          const pendingCount = approvals.filter(a => a.status === 'pending').length;
          
          setStats(prev => ({
            ...prev,
            pendingExpenseApprovalsCount: pendingCount
          }));
        } else {
          setStats(prev => ({
            ...prev,
            pendingExpenseApprovalsCount: 0
          }));
        }
      });
    }

    return () => {
      unsubInventory();
      unsubSales();
      unsubCreditItems();
      unsubExpenses();
      unsubApprovals();
      unsubExpenseApprovals();
    };
  }, [userRole]);

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
        {(userRole === 'admin' || userRole === 'superadmin') && (
          <>
            <StatCard
              title="Pending Approvals"
              value={stats.pendingApprovalsCount}
              icon={Clock}
              color={stats.pendingApprovalsCount > 0 ? 'yellow' : 'gray'}
            />
            <StatCard
              title="Pending Expenses"
              value={stats.pendingExpenseApprovalsCount}
              icon={Clock}
              color={stats.pendingExpenseApprovalsCount > 0 ? 'yellow' : 'gray'}
            />
          </>
        )}
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

      {/* Expenses & Net Profit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow p-4 md:p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm md:text-base font-semibold text-gray-800">Total Expenses</h3>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <p className="text-xs md:text-sm text-gray-600">All-time</p>
              <p className="text-lg md:text-2xl font-bold text-red-600">₱{stats.totalExpenses.toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
              <p className="text-xs md:text-sm text-gray-600">Today</p>
              <p className="text-base md:text-lg font-semibold text-red-600">₱{stats.todayExpenses.toFixed(2)}</p>
            </div>
            {stats.totalGiveaways > 0 && (
              <div className="pt-2 border-t border-gray-200 text-xs md:text-sm">
                <p className="text-gray-600">Free Giveaways: <span className="font-semibold">₱{stats.totalGiveaways.toFixed(2)}</span></p>
              </div>
            )}
          </div>
        </div>

        <div className={`bg-gradient-to-br rounded-lg shadow-lg p-4 md:p-6 text-white ${
          stats.netProfit >= 0
            ? 'from-blue-500 to-blue-600'
            : 'from-red-500 to-red-600'
        }`}>
          <h3 className="text-sm md:text-lg font-semibold mb-3">Net Profit</h3>
          <div className="space-y-3">
            <div>
              <p className="text-blue-100 text-xs md:text-sm mb-1">All-time (Profit - Expenses)</p>
              <p className="text-2xl md:text-3xl font-bold">₱{stats.netProfit.toFixed(2)}</p>
            </div>
            <div className="border-t border-white border-opacity-30 pt-3">
              <p className="text-blue-100 text-xs md:text-sm mb-1">Today's Net</p>
              <p className="text-lg md:text-2xl font-bold">₱{stats.todayNetProfit.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profit Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow p-4 md:p-6 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm md:text-base font-semibold text-gray-800">Sales Profit</h3>
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <p className="text-xs md:text-sm text-gray-600">All-time</p>
              <p className="text-lg md:text-2xl font-bold text-emerald-600">₱{stats.salesProfit.toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
              <p className="text-xs md:text-sm text-gray-600">Today</p>
              <p className="text-base md:text-lg font-semibold text-emerald-600">₱{stats.todaySalesProfit.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6 border-l-4 border-amber-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm md:text-base font-semibold text-gray-800">Loan Profit (Interest)</h3>
            <Zap className="w-5 h-5 text-amber-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <p className="text-xs md:text-sm text-gray-600">All-time</p>
              <p className="text-lg md:text-2xl font-bold text-amber-600">₱{stats.loanProfit.toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
              <p className="text-xs md:text-sm text-gray-600">Today</p>
              <p className="text-base md:text-lg font-semibold text-amber-600">₱{stats.todayLoanProfit.toFixed(2)}</p>
            </div>
          </div>
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