/**
 * @fileoverview This file provides an authentication context for the application.
 * It includes a context, a provider component, and a custom hook for accessing the context.
 * The context manages the user's authentication state, including the user object and login/logout functions.
 * @module frontend/src/context/AuthContext
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * @typedef {Object} AuthContextType
 * @property {Object|null} user - The authenticated user object.
 * @property {boolean} isLoggedIn - A flag indicating if the user is logged in.
 * @property {function(Object, string): Promise<void>} login - A function to log the user in.
 * @property {function(): void} logout - A function to log the user out.
 */

/**
 * The authentication context.
 * @type {React.Context<AuthContextType>}
 */
const AuthContext = createContext({
  user: null,
  isLoggedIn: false,
  login: () => { },
  logout: () => { },
});

/**
 * A custom hook for accessing the authentication context.
 * @returns {AuthContextType} The authentication context.
 */
export const useAuth = () => useContext(AuthContext);

/**
 * The authentication provider component.
 * It wraps the application and provides the authentication context to its children.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to render.
 * @returns {JSX.Element} The rendered provider component.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Effect to initialize the authentication state from localStorage
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');
      if (storedUser && token) {
        setUser(storedUser);
        setIsLoggedIn(true);
      }
    } catch {
      setUser(null);
      setIsLoggedIn(false);
    }
  }, []);

  /**
   * Logs the user in and stores the user data and token in localStorage.
   * @param {Object} userData - The user data to store.
   * @param {string} token - The authentication token to store.
   * @returns {Promise<void>} A promise that resolves when the login is complete.
   */
  const login = (userData, token) => {
    return new Promise((resolve) => {
      console.log('Logging in user:', userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
      console.log('Setting user state...');
      // Force state update by creating new object
      setUser({ ...userData });
      setIsLoggedIn(true);
      console.log('Login complete - current user:', userData);
      resolve();
    });
  };

  /**
   * Logs the user out and removes the user data and token from localStorage.
   */
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  // Sync with localStorage across tabs
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        setUser(JSON.parse(localStorage.getItem('user')));
      } catch {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
