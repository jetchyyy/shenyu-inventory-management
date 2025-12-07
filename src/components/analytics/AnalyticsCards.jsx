import React from 'react';
import { ShoppingCart, TrendingUp, TrendingDown, Percent } from 'lucide-react';

const AnalyticsCards = ({ analytics }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(value);
  };

  const cards = [
    {
      title: 'Total Sales',
      value: formatCurrency(analytics.totalSales),
      icon: ShoppingCart,
      color: 'blue',
      trend: '+12%'
    },
    {
      title: 'Total Profit',
      value: formatCurrency(analytics.totalProfit),
      icon: TrendingUp,
      color: 'green',
      trend: '+8%'
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(analytics.totalExpenses),
      icon: TrendingDown,
      color: 'red',
      trend: '-5%'
    },
    {
      title: 'Profit Margin',
      value: `${analytics.profitMargin.toFixed(2)}%`,
      icon: Percent,
      color: 'purple',
      trend: '+2%'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200'
    };
    return colors[color];
  };

  const getIconBgColor = (color) => {
    const colors = {
      blue: 'bg-blue-100',
      green: 'bg-green-100',
      red: 'bg-red-100',
      purple: 'bg-purple-100'
    };
    return colors[color];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className={`border rounded-lg p-4 md:p-6 ${getColorClasses(card.color)}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium opacity-75 mb-2">{card.title}</p>
                <h3 className="text-lg md:text-2xl font-bold">{card.value}</h3>
                {card.trend && (
                  <p className="text-xs mt-2 opacity-75">{card.trend} from last period</p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${getIconBgColor(card.color)}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AnalyticsCards;
