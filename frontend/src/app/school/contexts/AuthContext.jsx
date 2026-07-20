import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/schoolApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user on startup
  useEffect(() => {
    const loadSchool = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.success) {
          setSchool(response.school);
        } else {
          // Token invalid, clear
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Failed to load user session:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    loadSchool();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.success && response.token) {
        if (response.role === 'super-admin') {
          localStorage.setItem('superAdminToken', response.token);
          localStorage.setItem('token', response.token);
        } else {
          localStorage.setItem('token', response.token);
          setSchool(response.school);
        }
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const signup = async (schoolData) => {
    try {
      const response = await api.post('/auth/signup', schoolData);
      if (response.success && response.token) {
        localStorage.setItem('token', response.token);
        setSchool(response.school);
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setSchool(null);
  };

  const updateSchoolState = (updatedSchool) => {
    setSchool(updatedSchool);
  };

  // Subscription/Trial check
  const isTrialActive = () => {
    if (!school) return false;
    if (school.role === 'super-admin') return true; // Super admin always active
    
    const { subscription } = school;
    if (!subscription) return false;

    if (subscription.status !== 'active') return false;

    const trialEndDate = new Date(subscription.trialEnd);
    const currentDate = new Date();
    
    return trialEndDate > currentDate;
  };

  const value = {
    school,
    loading,
    login,
    signup,
    logout,
    updateSchoolState,
    isTrialActive: isTrialActive(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
