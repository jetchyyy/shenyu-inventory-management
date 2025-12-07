import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, database } from './config/firebase';
import SuperAdminSetup from './components/users/SuperAdminSetup';
import LoginPage from './components/auth/LoginPage';
import Navigation from './components/layout/Navigation';
import Dashboard from './components/dashboard/Dashboard';
import Inventory from './components/inventory/Inventory';
import Sales from './components/sales/Sales';
import CreditItems from './components/credits/CreditItems';
import Expenses from './components/expenses/Expenses';
import Approvals from './components/approvals/Approvals';
import ProfitAnalytics from './components/profit/ProfitAnalytics';
import UserManagement from './components/users/UserManagement';

const App = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [systemInitialized, setSystemInitialized] = useState(false);
  const [checkingSystem, setCheckingSystem] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Check if system is initialized
  useEffect(() => {
    const checkSystemInit = async () => {
      try {
        const configRef = ref(database, 'systemConfig/initialized');
        const snapshot = await get(configRef);
        setSystemInitialized(snapshot.val() === true);
      } catch (error) {
        console.error('Error checking system initialization:', error);
        setSystemInitialized(false);
      } finally {
        setCheckingSystem(false);
      }
    };

    checkSystemInit();
  }, []);

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const roleRef = ref(database, `users/${currentUser.uid}/role`);
          const roleSnapshot = await get(roleRef);
          setUserRole(roleSnapshot.val());
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole(null);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSetupComplete = () => {
    setSystemInitialized(true);
  };

  // Show loading screen
  if (checkingSystem || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show super admin setup if system not initialized
  if (!systemInitialized) {
    return <SuperAdminSetup onSetupComplete={handleSetupComplete} />;
  }

  // Show login page if no user
  if (!user) {
    return <LoginPage />;
  }

  // Show main application
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        userEmail={user.email}
      />
      <main className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'sales' && <Sales />}
        {activeTab === 'credits' && <CreditItems />}
        {activeTab === 'expenses' && <Expenses />}
        {activeTab === 'approvals' && (userRole === 'admin' || userRole === 'superadmin') && <Approvals />}
        {activeTab === 'profit' && <ProfitAnalytics />}
        {activeTab === 'users' && userRole === 'superadmin' && <UserManagement />}
      </main>
    </div>
  );
};

export default App;