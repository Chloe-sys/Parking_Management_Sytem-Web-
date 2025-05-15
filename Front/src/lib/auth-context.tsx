// lib/auth-context.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { toast } from 'sonner';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  plateNumber?: string;
  status?: 'pending' | 'approved' | 'rejected';
  slotId?: number;
  slotNumber?: string;
}

interface ApiResponse {
  data: {
    token: string;
    user?: {
      id: number;
      name: string;
      email: string;
      role: string;
      status: string;
      plateNumber?: string;
      slotId?: number;
      slotNumber?: string;
    };
    admin?: {
      id: number;
      name: string;
      email: string;
      role: string;
      status: string;
    };
    status?: string;
    message?: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, role: 'user' | 'admin') => Promise<void>;
  register: (userData: { name: string; email: string; password: string; role: 'user' | 'admin' }) => Promise<ApiResponse['data']>;
  logout: () => void;
  isAuthenticated: boolean;
  updateProfile: (data: { name: string; email: string }) => Promise<void>;
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error initializing auth:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string, role: 'user' | 'admin') => {
    setLoading(true);
    try {
      const response = (role === 'admin' 
        ? await authAPI.adminLogin({ email, password })
        : await authAPI.userLogin({ email, password })) as ApiResponse;
      
      if (response.data?.token) {
        const userData: User = {
          id: response.data.user?.id || 0,
          name: response.data.user?.name || '',
          email: response.data.user?.email || '',
          role: role,
          plateNumber: response.data.user?.plateNumber,
          status: response.data.user?.status as 'pending' | 'approved' | 'rejected',
          slotId: response.data.user?.slotId,
          slotNumber: response.data.user?.slotNumber
        };

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('role', role);
        
        setToken(response.data.token);
        setUser(userData);
        
        toast.success('Login successful!');
      } else if (response.data?.message === 'Account pending approval') {
        throw new Error('Account pending approval');
      } else {
        throw new Error(response.data?.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message === 'Account pending approval') {
        throw error;
      }
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: { name: string; email: string; password: string; role: 'user' | 'admin' }) => {
    setLoading(true);
    try {
      const response = (userData.role === 'admin'
        ? await authAPI.adminRegister(userData)
        : await authAPI.userRegister(userData)) as ApiResponse;
      
      if (response.data?.status === 'success') {
        toast.success('Registration successful! Please verify your email.');
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: { name: string; email: string }) => {
    try {
      const response = await authAPI.updateProfile(data);
      if (response.data?.status === 'success') {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        toast.success('Profile updated successfully');
      } else {
        throw new Error(response.data?.message || 'Failed to update profile');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
      throw error;
    }
  };

  const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
    try {
      const response = await authAPI.changePassword(data);
      if (response.data?.status === 'success') {
        toast.success('Password changed successfully');
      } else {
        throw new Error(response.data?.message || 'Failed to change password');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    updateProfile,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
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