import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };
    validateToken();
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);
    const authToken = data.token || data.accessToken;
    localStorage.setItem('token', authToken);
    setToken(authToken);
    
    const userData = data.user || data;
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    toast.success('Welcome back!');
    return data;
  }, []);

  const register = useCallback(async (userData) => {
    const data = await authService.register(userData);
    const authToken = data.token || data.accessToken;
    if (authToken) {
      localStorage.setItem('token', authToken);
      setToken(authToken);
      const userInfo = data.user || data;
      localStorage.setItem('user', JSON.stringify(userInfo));
      setUser(userInfo);
    }
    toast.success('Account created successfully!');
    return data;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setToken(null);
    toast.success('Logged out successfully');
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
export default AuthContext;
