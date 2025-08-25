import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, LoginCredentials, AuthContextType } from '../types/index';
import { login as authLogin } from '../services/authService';
import { toast } from 'react-toastify';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data on app load
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const result = await authLogin(credentials);

      if (!result.success) {
        throw new Error(result.message || 'Login failed');
      }

      // Extract user data and token from response
      const { token, user: backendUser } = result.data;

      // Map backend user data to frontend User type
      const user: User = {
        id: backendUser.id || backendUser._id,
        email: backendUser.email,
        role: backendUser.role,
        name: backendUser.name || `${backendUser.firstName || ''} ${backendUser.lastName || ''}`.trim() || backendUser.email,
        schoolId: backendUser.schoolId,
      };

      // Store user data and token
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);

      // Show success toast
      toast.success(`Welcome back, ${user.name}!`);

      // Return user for redirect handling
      return user;
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 