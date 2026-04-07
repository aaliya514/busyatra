import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('busyatra_token');
    const savedUser = localStorage.getItem('busyatra_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
      
      // Verify token is still valid and refresh user data from server
      // BUGFIX: setLoading(false) must be INSIDE .then/.catch so the role
      // is known before App.js renders — otherwise driver/admin see 'dashboard'
      authAPI.verifyToken()
        .then((res) => {
          const freshUser = res.data.user;
          setUser(freshUser);
          localStorage.setItem('busyatra_user', JSON.stringify(freshUser));
          setLoading(false);
        })
        .catch(() => {
          // Token expired or invalid — clean up without calling logout() to avoid loops
          localStorage.removeItem('busyatra_token');
          localStorage.removeItem('busyatra_user');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
        });
      return; // loading stays true until verify finishes
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token: newToken, user: newUser } = response.data;
      
      localStorage.setItem('busyatra_token', newToken);
      localStorage.setItem('busyatra_user', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token: newToken, user: newUser } = response.data;
      
      localStorage.setItem('busyatra_token', newToken);
      localStorage.setItem('busyatra_user', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    // Clear local state first so UI updates immediately
    localStorage.removeItem('busyatra_token');
    localStorage.removeItem('busyatra_user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Best-effort server logout (ignore errors — token may already be gone)
    authAPI.logout().catch(() => {});
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('busyatra_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
