import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({
  user: null,
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  });

  const login = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
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

  const isLoggedIn = Boolean(user);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
