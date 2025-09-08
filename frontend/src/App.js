/**
 * @fileoverview This is the root component of the application.
 * It sets up the main routing and handles WebSocket connections.
 * @module frontend/src/App
 */

import React, { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
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

/**
 * The main application component.
 * It handles routing and WebSocket connections based on authentication status.
 * @returns {JSX.Element} The rendered application.
 */
function App() {
  const { isLoggedIn, user } = useAuth();
  const { setLastMessage, socket, setIsConnected } = useSocket();

  useEffect(() => {
    // Effect to handle WebSocket connection based on user's login status
    if (isLoggedIn && user) {
      if (!socket.connected) {
        const token = localStorage.getItem('token');
        const { authenticateSocket, setupSocketListeners } = require('./utils/socket');
        if (token) {
          authenticateSocket(token);
        }
        setupSocketListeners({
          onTransactionsUpdate: (data) => {
            console.log('New transactions update:', data);
            setLastMessage(data);
          },
          onConnect: () => {
            setIsConnected(true);
          },
          onDisconnect: () => {
            setIsConnected(false);
          },
        });
      }
    } else {
      if (socket.connected) {
        socket.disconnect();
      }
    }
    return () => {
      if (socket.connected) {
        // To prevent disconnect on re-renders, you might add more logic here
        // For now, this will disconnect when the App component unmounts
      }
    };
  }, [isLoggedIn, user, setLastMessage, socket]);

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
