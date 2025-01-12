import React, { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import socket from './utils/socket';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import Navdrawer from './components/Navdrawer';
import LandingPage from './components/LandingPage';
import LoginContainer from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import CategoryManagement from './components/CategoryManagement';
import UserManagement from './components/UserManagement';
import PlaidCategoryManagement from './components/PlaidCategoryManagement';
import TransactionsPage from './components/Transactions';
import Trends from './components/Trends';
import PlaidTestPage from './components/PlaidTestPage';
import ThemeDemo from './components/themedemo';
import Accounts from './components/Accounts';




axios.defaults.withCredentials = true;

function App() {
  const { isLoggedIn, user } = useAuth();

  useEffect(() => {
    let socketInitialized = false;

    const initializeWebSocket = () => {
      console.log('Initializing WebSocket...');
      if (socketInitialized) {
        console.log('WebSocket already initialized');
        return;
      }

      const token = localStorage.getItem('token');

      if (token && user) {
        const { authenticateSocket, setupSocketListeners } = require('./utils/socket');
        authenticateSocket(token);

        setupSocketListeners({
          onTransactionsUpdate: (data) => {
            console.log('New transactions update:', data);
            // TODO: Update state with new transactions
          },
          onConnect: () => {
            console.log('WebSocket connected');
            // Update connection status in UI
          },
          onDisconnect: () => {
            console.log('WebSocket disconnected');
            // Update connection status in UI
          }
        });

        socketInitialized = true;
      }
    };

    // Initialize WebSocket when logged in
    if (isLoggedIn && user) {
      initializeWebSocket();
    }

    return () => {
      if (socketInitialized) {
        socket.disconnect();
      }
    };
  }, [isLoggedIn, user]);
  return (



    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Navdrawer />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginContainer />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/trends" element={<Trends />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/manage-categories" element={<CategoryManagement />} />
        <Route path="/admin/manage-users" element={<UserManagement />} />
        <Route path="/admin/manage-plaid-categories" element={<PlaidCategoryManagement />} />
        <Route path="/plaid-test" element={<PlaidTestPage />} />
        <Route path="/themedemo" element={<ThemeDemo />} />
        <Route path="/linked-accounts" element={<Accounts />} />
      </Routes>
    </Router>

  );
}

export default App;
