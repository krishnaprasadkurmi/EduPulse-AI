import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext();

export const DEMO_PERSONAS = [
  {
    role: 'student',
    name: 'Rahul Sharma (Student)',
    email: 'rahul@edupulse.edu',
    password: 'student123',
    description: 'DBMS Attendance 72% (Critical), High Risk score 78/100',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    tag: 'Primary Demo Subject',
  },
  {
    role: 'professor',
    name: 'Prof. Rajesh Sharma (Faculty)',
    email: 'prof.sharma@edupulse.edu',
    password: 'prof123',
    description: 'Instructor for CS301 (DBMS) & CS303 (DSA), Voice Marks Entry',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    tag: 'Voice Entry Lead',
  },
  {
    role: 'admin',
    name: 'Dr. Aris Thorne (Academic Dean)',
    email: 'admin@edupulse.edu',
    password: 'admin123',
    description: 'University analytics, risk distributions, audit trails',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    tag: 'Dean / Administrator',
  },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('edupulse_token') || null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('edupulse_token');
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          if (res.success) {
            setUser(res.user);
          } else {
            logout();
          }
        } catch (err) {
          console.error('[AuthContext] Session verification failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await authApi.login({ email, password });
      if (res.success) {
        localStorage.setItem('edupulse_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      setAuthError(msg);
      return { success: false, message: msg };
    }
  };

  const register = async (userData) => {
    setAuthError(null);
    try {
      const res = await authApi.register(userData);
      if (res.success) {
        localStorage.setItem('edupulse_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please check details.';
      setAuthError(msg);
      return { success: false, message: msg };
    }
  };

  const switchPersona = async (email, password) => {
    return await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('edupulse_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authError,
        login,
        register,
        logout,
        switchPersona,
        isAuthenticated: !!user,
      }}
    >
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
