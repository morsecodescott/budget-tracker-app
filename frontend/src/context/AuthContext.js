import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({
  user: null,
  isLoggedIn: false,
  login: () => { },
  logout: () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
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
