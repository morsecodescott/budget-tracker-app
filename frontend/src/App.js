import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
import PlaidTestPage from './components/PlaidTestPage';


axios.defaults.withCredentials = true;

function App() {
  return (
    <AuthProvider>
      
      <Router future={{ v7_startTransition: true , v7_relativeSplatPath: true}}>
        <Navdrawer />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginContainer />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/manage-categories" element={<CategoryManagement />} />
          <Route path="/admin/manage-users" element={<UserManagement />} />
          <Route path="/admin/manage-plaid-categories" element={<PlaidCategoryManagement />} />
          <Route path="/plaid-test" element={<PlaidTestPage />} />
        </Routes>
      </Router>
      
    </AuthProvider>
  );
}

export default App;
