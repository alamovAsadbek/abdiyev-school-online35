import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi } from '@/services/api';

export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'student';
  avatar?: string;
  is_blocked: boolean;
  created_at: string;
  first_name: string;
  last_name: string;
  name: string;
  createdAt?: string;
  isBlocked?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string, firstName: string, lastName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Format user data from API
  const formatUser = (userData: any): User => {
    return {
      ...userData,
      name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username,
      createdAt: userData.created_at,
      isBlocked: userData.is_blocked,
    };
  };

  // Fetch current user from API - this is the ONLY source of truth for user data including role
  const refreshUser = useCallback(async () => {
    const accessToken = localStorage.getItem('access');
    if (!accessToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await authApi.me();
      setUser(formatUser(userData));
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authApi.login(username, password);
      
      if (response.error) {
        return { success: false, error: response.error };
      }

      // Store tokens
      localStorage.setItem('access', response.access);
      localStorage.setItem('refresh', response.refresh);
      
      // Set user from response - role comes from server, NOT stored locally
      setUser(formatUser(response.user));
      
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || 'Login failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const register = async (
    username: string, 
    password: string, 
    firstName: string, 
    lastName: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authApi.register(username, password, firstName, lastName);
      
      if (response.error) {
        return { success: false, error: response.error };
      }

      // Store tokens
      localStorage.setItem('access', response.access);
      localStorage.setItem('refresh', response.refresh);
      
      // Set user from response
      setUser(formatUser(response.user));
      
      return { success: true };
    } catch (error: any) {
      console.error('Register error:', error);
      
      // Handle specific error messages
      if (error.response?.data) {
        const data = error.response.data;
        if (data.username) {
          return { success: false, error: 'Bu username allaqachon band' };
        }
        if (data.password) {
          return { success: false, error: data.password[0] };
        }
        if (data.error) {
          return { success: false, error: data.error };
        }
      }
      
      return { success: false, error: 'Ro\'yxatdan o\'tishda xatolik' };
    }
  };

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setUser(null);
  };

  const updateProfile = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      register, 
      logout, 
      updateProfile,
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
