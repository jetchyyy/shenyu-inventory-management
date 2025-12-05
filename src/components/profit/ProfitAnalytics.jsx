import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../config/firebase';
import { ShoppingCart, Zap, TrendingUp, Calendar } from 'lucide-react';

const ProfitAnalytics = () => {
  const [profitData, setProfitData] = useState({
    totalSalesProfit: 0,
    totalLoanProfit: 0,
    totalProfit: 0,
    salesCount: 0,
    completedLoans: 0,
    monthlyData: {}
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [monthlyBreakdown, setMonthlyBreakdown] = useState({
    salesProfit: 0,
    loanProfit: 0,
    totalProfit: 0
  });

  useEffect(() => {
    const salesRef = ref(database, 'sales');
    const creditItemsRef = ref(database, 'creditItems');

    const unsubSales = onValue(salesRef, (snapshot) => {
      if (snapshot.exists()) {
        const salesData = snapshot.val();
        const sales = Object.keys(salesData).map(key => ({
          id: key,
          ...salesData[key]
        }));

        const totalSalesProfit = sales.reduce((sum, sale) => sum + (sale.totalProfit || 0), 0);
        const monthlyData = {};

        // Group sales by month
        sales.forEach(sale => {
          const saleDate = new Date(sale.timestamp);
          const monthKey = saleDate.toISOString().slice(0, 7);
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              salesProfit: 0,
              loanProfit: 0
            };
          }
          
          monthlyData[monthKey].salesProfit += sale.totalProfit || 0;
        });

        setProfitData(prev => ({
          ...prev,
          totalSalesProfit,
          salesCount: sales.length,
          monthlyData
        }));

        // Update selected month breakdown
        updateMonthlyBreakdown(monthlyData[selectedMonth]);
      }
    });

    const unsubCreditItems = onValue(creditItemsRef, (snapshot) => {
      if (snapshot.exists()) {
        const creditData = snapshot.val();
        const creditItems = Object.keys(creditData).map(key => ({
          id: key,
          ...creditData[key]
        }));

        const completedLoans = creditItems.filter(item => item.status === 'completed').length;
        const totalLoanProfit = creditItems
          .filter(item => item.status === 'completed')
          .reduce((sum, item) => sum + (item.interestAmount || 0), 0);

        const monthlyData = {};

        // Group completed loans by month
        creditItems.forEach(item => {
          if (item.status === 'completed' && item.lastPaymentDate) {
            const completionDate = new Date(item.lastPaymentDate);
            const monthKey = completionDate.toISOString().slice(0, 7);
            
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = {
                salesProfit: monthlyData[monthKey]?.salesProfit || 0,
                loanProfit: 0
              };
            }
            
            monthlyData[monthKey].loanProfit += item.interestAmount || 0;
          }
        });

        // Merge with sales data
        setProfitData(prev => {
          const merged = { ...prev.monthlyData };
          Object.keys(monthlyData).forEach(month => {
            merged[month] = {
              salesProfit: merged[month]?.salesProfit || 0,
              loanProfit: monthlyData[month].loanProfit
            };
          });

          return {
            ...prev,
            totalLoanProfit,
            completedLoans,
            monthlyData: merged,
            totalProfit: prev.totalSalesProfit + totalLoanProfit
          };
        });

        // Update selected month breakdown
        const currentMonth = selectedMonth;
        if (monthlyData[currentMonth]) {
          setMonthlyBreakdown(prev => ({
            ...prev,
            loanProfit: monthlyData[currentMonth].loanProfit,
            totalProfit: (prev.salesProfit || 0) + monthlyData[currentMonth].loanProfit
          }));
        }
      }
    });

    return () => {
      unsubSales();
      unsubCreditItems();
    };
  }, [selectedMonth]);

  const updateMonthlyBreakdown = (monthData) => {
    if (monthData) {
      setMonthlyBreakdown({
        salesProfit: monthData.salesProfit || 0,
        loanProfit: monthData.loanProfit || 0,
        totalProfit: (monthData.salesProfit || 0) + (monthData.loanProfit || 0)
      });
    } else {
      setMonthlyBreakdown({
        salesProfit: 0,
        loanProfit: 0,
        totalProfit: 0
      });
    }
  };

  const getAvailableMonths = () => {
    const months = Object.keys(profitData.monthlyData).sort().reverse();
    return months.slice(0, 12); // Last 12 months
  };

  const getSalesPercentage = () => {
    if (profitData.totalProfit === 0) return 0;
    return ((profitData.totalSalesProfit / profitData.totalProfit) * 100).toFixed(1);
  };

  const getLoanPercentage = () => {
    if (profitData.totalProfit === 0) return 0;
    return ((profitData.totalLoanProfit / profitData.totalProfit) * 100).toFixed(1);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Profit Analytics</h1>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-3 md:p-6 text-white">
          <h3 className="text-xs md:text-lg font-semibold mb-2">Total Profit</h3>
          <p className="text-xl md:text-3xl font-bold">₱{profitData.totalProfit.toFixed(2)}</p>
          <p className="text-green-100 text-xs md:text-sm mt-2">All-time</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-lg p-3 md:p-6 text-white">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <h3 className="text-xs md:text-lg font-semibold">Sales Profit</h3>
            <ShoppingCart className="w-4 h-4 md:w-6 md:h-6 flex-shrink-0" />
          </div>
          <p className="text-xl md:text-3xl font-bold">₱{profitData.totalSalesProfit.toFixed(2)}</p>
          <p className="text-emerald-100 text-xs mt-1 md:text-sm">{getSalesPercentage()}% • {profitData.salesCount} sales</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-lg p-3 md:p-6 text-white">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <h3 className="text-xs md:text-lg font-semibold">Loan Profit</h3>
            <Zap className="w-4 h-4 md:w-6 md:h-6 flex-shrink-0" />
          </div>
          <p className="text-xl md:text-3xl font-bold">₱{profitData.totalLoanProfit.toFixed(2)}</p>
          <p className="text-amber-100 text-xs mt-1 md:text-sm">{getLoanPercentage()}% • {profitData.completedLoans} loans</p>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 md:w-6 md:h-6" />
            Monthly Breakdown
          </h2>
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              const monthData = profitData.monthlyData[e.target.value];
              updateMonthlyBreakdown(monthData);
            }}
            className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {getAvailableMonths().map(month => {
              const date = new Date(month + '-01');
              return (
                <option key={month} value={month}>
                  {date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </option>
              );
            })}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border-l-4 border-emerald-500">
            <p className="text-xs md:text-sm text-gray-600 mb-1">Sales Profit</p>
            <p className="text-2xl md:text-3xl font-bold text-emerald-600">₱{monthlyBreakdown.salesProfit.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border-l-4 border-amber-500">
            <p className="text-xs md:text-sm text-gray-600 mb-1">Loan Profit (Interest)</p>
            <p className="text-2xl md:text-3xl font-bold text-amber-600">₱{monthlyBreakdown.loanProfit.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-l-4 border-green-500">
            <p className="text-xs md:text-sm text-gray-600 mb-1">Total Profit</p>
            <p className="text-2xl md:text-3xl font-bold text-green-600">₱{monthlyBreakdown.totalProfit.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Profit Distribution Chart Info */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
          Profit Distribution
        </h2>
        
        <div className="space-y-4">
          {/* Sales Profit Bar */}
          <div>
            <div className="flex justify-between mb-2">
              <p className="text-sm md:text-base font-medium text-gray-700">Sales Profit</p>
              <p className="text-sm md:text-base font-bold text-emerald-600">₱{profitData.totalSalesProfit.toFixed(2)} ({getSalesPercentage()}%)</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 md:h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full transition-all duration-500"
                style={{ width: `${getSalesPercentage()}%` }}
              ></div>
            </div>
          </div>

          {/* Loan Profit Bar */}
          <div>
            <div className="flex justify-between mb-2">
              <p className="text-sm md:text-base font-medium text-gray-700">Loan Profit (Interest)</p>
              <p className="text-sm md:text-base font-bold text-amber-600">₱{profitData.totalLoanProfit.toFixed(2)} ({getLoanPercentage()}%)</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 md:h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-400 to-amber-600 h-full transition-all duration-500"
                style={{ width: `${getLoanPercentage()}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs md:text-sm text-blue-900">
            <strong>Total Profit Breakdown:</strong> Your profit comes from {profitData.salesCount} sales transactions and {profitData.completedLoans} completed loan interests. This includes all earnings from product sales markup and interest collected from credit/loan items.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfitAnalytics;
