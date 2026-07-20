import React, { createContext, useContext, useState, useEffect } from 'react';
import superAdminApi from '../services/superAdminApi';

const SuperAdminAuthContext = createContext();

export const useSuperAdminAuth = () => {
  const context = useContext(SuperAdminAuthContext);
  if (!context) {
    throw new Error('useSuperAdminAuth must be used within SuperAdminAuthProvider');
  }
  return context;
};

export const SuperAdminAuthProvider = ({ children }) => {
  const [superAdmin, setSuperAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('superAdminToken');
    if (token) {
      try {
        const response = await superAdminApi.get('/me');
        if (response.data.success) {
          setSuperAdmin(response.data.data);
        }
      } catch (error) {
        localStorage.removeItem('superAdminToken');
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const response = await superAdminApi.post('/login', { email, password });
    if (response.data.success) {
      localStorage.setItem('superAdminToken', response.data.token);
      setSuperAdmin(response.data.data);
      return response.data;
    }
    throw new Error(response.data.message || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('superAdminToken');
    setSuperAdmin(null);
  };

  return (
    <SuperAdminAuthContext.Provider value={{ superAdmin, loading, login, logout, checkAuth, setSuperAdmin }}>
      {children}
    </SuperAdminAuthContext.Provider>
  );
};
