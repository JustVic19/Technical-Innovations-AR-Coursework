import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authClient } from '@/api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  // On mount, check if we have a stored token and validate it
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('sentinel_token');
    if (!token) {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      return;
    }

    try {
      const currentUser = await authClient.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (err) {
      // Token is invalid or expired — clear it
      localStorage.removeItem('sentinel_token');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const login = useCallback(async (email, password) => {
    setAuthError(null);
    try {
      const { token, user: loggedInUser } = await authClient.login(email, password);
      localStorage.setItem('sentinel_token', token);
      setUser(loggedInUser);
      setIsAuthenticated(true);
      return loggedInUser;
    } catch (err) {
      const message = err?.data?.error || err.message || 'Login failed';
      setAuthError(message);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sentinel_token');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      login,
      logout,
      checkAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
