import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthSession, UserRole, UserType } from '../types';
import { api } from '../services/api';

interface RegisterData {
  name: string;
  meter_number: string;
  address: string;
  ward_number: number;
  ward_id?: string;
  user_type: UserType;
  phone_number?: string;
  password: string;
  confirm_password: string;
}

interface AdminRegisterData {
  name: string;
  meter_number: string;
  password: string;
  confirm_password: string;
  access_code: string;
}

interface AuthContextType {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (meterNumber: string, password: string) => Promise<AuthSession>;
  register: (data: RegisterData) => Promise<AuthSession>;
  registerAdmin: (data: AdminRegisterData) => Promise<AuthSession>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(() => {
    const saved = localStorage.getItem('greenpay_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setSession(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    setIsLoading(false);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const saveSession = (authData: AuthSession) => {
    setSession(authData);
    localStorage.setItem('greenpay_token', authData.access_token);
    localStorage.setItem('greenpay_refresh', authData.refresh_token);
    localStorage.setItem('greenpay_session', JSON.stringify(authData));
  };

  const login = async (meterNumber: string, password: string): Promise<AuthSession> => {
    const data = await api.post<AuthSession>('/auth/login', {
      meter_number: meterNumber,
      password,
    });
    saveSession(data);
    return data;
  };

  const register = async (data: RegisterData): Promise<AuthSession> => {
    const authData = await api.post<AuthSession>('/auth/register', data);
    saveSession(authData);
    return authData;
  };

  const registerAdmin = async (data: AdminRegisterData): Promise<AuthSession> => {
    const authData = await api.post<AuthSession>('/auth/register-admin', data);
    saveSession(authData);
    return authData;
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem('greenpay_token');
    localStorage.removeItem('greenpay_refresh');
    localStorage.removeItem('greenpay_session');
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: !!session,
        isAdmin: session?.role === 'ADMIN',
        isLoading,
        login,
        register,
        registerAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
