import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/services/api';

export interface User {
  id: string;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'student';
  avatar?: string;
  created_at: string;
  createdAt?: string;
  is_blocked: boolean;
  isBlocked?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved tokens and user
    const accessToken = localStorage.getItem('access');
    const savedUser = localStorage.getItem('abdiyev_user');
    
    if (accessToken && savedUser) {
      setUser(JSON.parse(savedUser));
      // Optionally verify token by fetching current user
      authApi.me()
        .then(userData => {
          setUser(userData);
          localStorage.setItem('abdiyev_user', JSON.stringify(userData));
        })
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          localStorage.removeItem('abdiyev_user');
          setUser(null);
        });
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login(username, password);
      
      if (response.access) {
        localStorage.setItem('access', response.access);
        localStorage.setItem('refresh', response.refresh);
        localStorage.setItem('abdiyev_user', JSON.stringify(response.user));
        setUser(response.user);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authApi.register(username, password);
      
      if (response.access) {
        localStorage.setItem('access', response.access);
        localStorage.setItem('refresh', response.refresh);
        localStorage.setItem('abdiyev_user', JSON.stringify(response.user));
        setUser(response.user);
        return { success: true };
      }
      return { success: false, error: 'Ro\'yxatdan o\'tishda xatolik' };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Ro\'yxatdan o\'tishda xatolik';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('abdiyev_user');
    localStorage.removeItem('abdiyev_progress');
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('abdiyev_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, isLoading }}>
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
