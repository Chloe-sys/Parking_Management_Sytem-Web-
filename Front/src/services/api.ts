// services/api.ts
import axios from 'axios';

const API_URL = 'https://parking-management-sytem-web.onrender.com';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Request headers:', config.headers);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      // Clear all auth data on unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Types
interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    admin?: {
      id: number;
      name: string;
      email: string;
      role: string;
      status: string;
    };
    user?: {
      id: number;
      name: string;
      email: string;
      role: string;
      status: string;
    };
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  plateNumber: string;
  role: 'user' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface ParkingSlot {
  id: number;
  slotNumber: string;
  status: 'available' | 'occupied' | 'maintenance';
  userId?: string;
  userName?: string;
  userEmail?: string;
  plateNumber?: string;
  assignedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface DashboardResponse {
  userStats: {
    totalUsers: number;
    pendingUsers: string;
  };
  slotStats: {
    totalSlots: number;
    availableSlots: string;
    occupiedSlots: string;
  };
  recentActivities: Array<{
    id: number;
    userId: number;
    type: string;
    message: string;
    isRead: number;
    createdAt: string;
    userName: string;
  }>;
}

interface DashboardData {
  user: {
    name: string;
    email: string;
  };
  assignedSlot: {
    id: number;
    slotNumber: string;
    status: string;
    assignedAt: string;
  } | null;
  totalSlots: number;
  availableSlots: number;
}

interface ProfileUpdateData {
  name: string;
  email: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

interface SlotCreateData {
  slotNumber: string;
  location?: string;
  status?: 'available' | 'occupied' | 'maintenance';
}

interface SlotUpdateData {
  slotNumber?: string;
  location?: string;
  status?: 'available' | 'occupied' | 'maintenance';
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface SlotRequestData {
  slotId: number;
  requestedEntryTime: string;
  requestedExitTime: string;
  reason?: string;
}

// Auth API
export const authAPI = {
  // User Auth
  userRegister: async (userData: { name: string; email: string; password: string }) => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  userLogin: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      console.log('Attempting user login with:', credentials.email);
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      console.log('User login response:', response.data);
      
      if (response.data.success && response.data.data?.token) {
        console.log('Storing token and user data');
        localStorage.setItem('token', response.data.data.token);
        if (response.data.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.data.user));
          localStorage.setItem('role', 'user');
        }
      }
      return response.data;
    } catch (error) {
      console.error('User login error:', error);
      throw error;
    }
  },

  userVerifyOTP: async (data: { email: string; code: string }) => {
    try {
      const response = await api.post('/auth/verify-email', data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  userResendOTP: async (email: string) => {
    try {
      const response = await api.post('/auth/resend-otp', { email });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Admin Auth
  adminRegister: async (adminData: { name: string; email: string; password: string }) => {
    const response = await api.post<AuthResponse>('/auth/admin/register', adminData);
    return response.data;
  },

  adminLogin: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      console.log('Attempting admin login with:', credentials.email);
      const response = await api.post<AuthResponse>('/auth/admin/login', credentials);
      console.log('Admin login response:', response.data);
      
      if (response.data.success && response.data.data?.token) {
        console.log('Storing token and admin data');
        localStorage.setItem('token', response.data.data.token);
        if (response.data.data.admin) {
          localStorage.setItem('user', JSON.stringify(response.data.data.admin));
          localStorage.setItem('role', 'admin');
        }
      }
      return response.data;
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    }
  },

  adminVerifyOTP: async (data: { email: string; otp: string }) => {
    const response = await api.post('/auth/admin/verify-email', {
      email: data.email,
      code: data.otp
    });
    return response.data;
  },

  adminResendOTP: async (email: string) => {
    const response = await api.post<{ status: string; message: string }>('/auth/admin/resend-otp', { email });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    window.location.href = '/';
  },

  getUserDashboard: () => {
    return api.get<{ data: DashboardData }>('/user/dashboard');
  },

  updateProfile: (data: ProfileUpdateData) => {
    return api.put<{ status: string; message: string }>('/user/profile', data);
  },

  changePassword: (data: PasswordChangeData) => {
    return api.put<{ status: string; message: string }>('/user/change-password', data);
  },

  // Forgot Password
  forgotPassword: async (data: { email: string; role: 'user' | 'admin' }) => {
    const response = await api.post<ApiResponse<void>>('/auth/forgot-password', data);
    return response.data;
  },

  // Reset Password
  resetPassword: async (data: { email: string; code: string; newPassword: string; role: 'user' | 'admin' }) => {
    const response = await api.post<ApiResponse<void>>('/auth/reset-password', data);
    return response.data;
  },
};

// User API
export const userAPI = {
  // Dashboard
  getDashboard: async () => {
    try {
      const response = await api.get<{ success: boolean; data: { slots: ParkingSlot[]; notifications: Notification[] } }>('/user/dashboard');
      console.log('Dashboard response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching dashboard:', error);
      throw error;
    }
  },

  // Profile
  updateProfile: async (profileData: { name: string; plateNumber: string }) => {
    const response = await api.put<{ status: string; data: User; message?: string }>('/user/profile', profileData);
    return response.data;
  },

  changePassword: async (passwordData: { currentPassword: string; newPassword: string }) => {
    const response = await api.put<{ status: string; message: string }>('/user/change-password', passwordData);
    return response.data;
  },

  // Notifications
  getNotifications: async () => {
    try {
      const response = await api.get<{ success: boolean; data: Notification[] }>('/user/notifications');
      console.log('Notifications response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  markNotificationAsRead: async (notificationId: string) => {
    const response = await api.post<{ status: string; message: string }>(`/user/notifications/${notificationId}/read`);
    return response.data;
  },

  // Slot Requests
  getAvailableSlots: async (params?: { page?: number; limit?: number; search?: string }) => {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', String(params.page));
      if (params?.limit) query.append('limit', String(params.limit));
      if (params?.search) query.append('search', params.search);
      const response = await api.get(`/parking-slots/available${query.toString() ? `?${query.toString()}` : ''}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching available slots:', error);
      throw error;
    }
  },
  requestSlot: async (slotId: number, requestData: Omit<SlotRequestData, 'slotId'>) => {
    try {
      const response = await api.post('/user/slot-requests', {
        slotId,
        ...requestData
      });
      return response.data;
    } catch (error: any) {
      console.error('Error requesting slot:', error);
      throw error;
    }
  },
  getSlotRequests: async (params?: { page?: number; limit?: number; search?: string }) => {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', String(params.page));
      if (params?.limit) query.append('limit', String(params.limit));
      if (params?.search) query.append('search', params.search);
      const response = await api.get(`/user/slot-requests${query.toString() ? `?${query.toString()}` : ''}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching slot requests:', error);
      throw error;
    }
  },

  getActiveTicket: async () => {
    try {
      const response = await api.get('/tickets/my/active');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching active ticket:', error);
      throw error;
    }
  },

  calculateEstimatedAmount: async (data: { requestedEntryTime: string; requestedExitTime: string }) => {
    try {
      const response = await api.post('/tickets/calculate-amount', data);
      return response.data;
    } catch (error: any) {
      console.error('Error calculating estimated amount:', error);
      throw error;
    }
  },
};

// Admin API
export const adminAPI = {
  getDashboard: async () => {
    const response = await api.get<DashboardResponse>('/admin/dashboard');
    return response.data;
  },

  getUsers: async (params) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
      const response = await api.get(`/admin/users?${queryParams.toString()}`);
      console.log('Users response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error in getUsers:', error);
      throw error;
    }
  },

  approveUser: async (userId: string) => {
    try {
      if (!userId || typeof userId !== 'string') {
        console.error('Invalid user ID:', userId);
        throw new Error('User ID is required');
      }
      console.log('Approving user with ID:', userId);
      const response = await api.post(`/admin/users/${userId}/approve`);
      console.log('Approve user response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error in approveUser:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  rejectUser: async (userId: string, reason: string) => {
    try {
      const response = await api.post(`/admin/users/${userId}/reject`, {
        reason: reason || 'Invalid Plate Number (Only Rwandan Plate Numbers are allowed)'
      });
      return {
        data: {
          status: 'success',
          message: response.data.message
        }
      };
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  getSlots: async () => {
    try {
      const response = await api.get('/admin/parking-slots/all');
      return response.data;
    } catch (error: any) {
      console.error('Error in getSlots:', error);
      throw error;
    }
  },

  createSlot: async (data: SlotCreateData) => {
    try {
      const response = await api.post('/admin/parking-slots', {
        slotNumber: data.slotNumber,
        status: data.status || 'available'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error in createSlot:', error);
      throw error;
    }
  },

  updateSlot: async (slotId: string, data: SlotUpdateData) => {
    try {
      const response = await api.put(`/admin/parking-slots/${slotId}`, {
        slotNumber: data.slotNumber,
        status: data.status
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating slot:', error);
      throw error;
    }
  },

  deleteSlot: async (slotId: string) => {
    try {
      const response = await api.delete(`/admin/parking-slots/${slotId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error in deleteSlot:', error);
      throw error;
    }
  },

  updateProfile: async (data: { name: string; email: string }) => {
    try {
      const response = await api.put('/admin/profile-change', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    try {
      const response = await api.put('/admin/change-password', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  markNotificationAsRead: async (notificationId: string) => {
    try {
      const response = await api.post(`/admin/notifications/${notificationId}/read`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  // Slot Requests
  getSlotRequests: async (params?: { page?: number; limit?: number; search?: string }) => {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', String(params.page));
      if (params?.limit) query.append('limit', String(params.limit));
      if (params?.search) query.append('search', params.search);
      const response = await api.get(`/admin/slot-requests${query.toString() ? `?${query.toString()}` : ''}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching admin slot requests:', error);
      throw error;
    }
  },

  handleSlotRequest: async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const response = await api.post(`/admin/slot-requests/${requestId}/handle`, { status });
      return response.data;
    } catch (error: any) {
      console.error('Error handling slot request:', error);
      throw error;
    }
  },

  getSlotsPaginated: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', String(params.page));
      if (params?.limit) query.append('limit', String(params.limit));
      if (params?.search) query.append('search', params.search);
      if (params?.status) query.append('status', params.status);
      const response = await api.get(`/admin/parking-slots${query.toString() ? `?${query.toString()}` : ''}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching paginated slots:', error);
      throw error;
    }
  },
};

// Ticket API functions
export const ticketAPI = {
    // Create a new ticket (admin only)
    createTicket: async (data: { userId: number; slotId: number }) => {
        const response = await api.post<ApiResponse<{ ticketId: number }>>('/tickets/create', data);
        return response.data;
    },

    // Complete a ticket (admin only)
    completeTicket: async (ticketId: number) => {
        const response = await api.patch<ApiResponse<{ duration: number; amount: number; exitTime: string }>>(`/tickets/${ticketId}/complete`);
        return response.data;
    },

    // Get user's active ticket
    getActiveTicket: async () => {
        const response = await api.get<ApiResponse<Ticket>>('/tickets/my/active');
        return response.data;
    },

    // Get user's ticket history
    getUserTickets: async (page: number = 1, limit: number = 10) => {
        const response = await api.get<ApiResponse<{ tickets: Ticket[]; total: number }>>('/tickets/my/history', {
            params: { page, limit }
        });
        return response.data;
    },

    // Get all active tickets (admin only)
    getActiveTickets: async () => {
        const response = await api.get<ApiResponse<Ticket[]>>('/tickets/active');
        return response.data;
    },

    // Get all tickets with pagination and filtering (admin only)
    getAllTickets: async (page: number = 1, limit: number = 10, status?: string) => {
        const response = await api.get<ApiResponse<{ tickets: Ticket[]; total: number }>>('/tickets/all', {
            params: { page, limit, status }
        });
        return response.data;
    }
};

// Ticket interface
export interface Ticket {
    id: number;
    userId: number;
    slotId: number;
    entryTime: string;
    exitTime?: string;
    duration?: number;
    amount?: number;
    status: 'active' | 'completed';
    createdAt: string;
    updatedAt: string;
    user?: {
        id: number;
        name: string;
        email: string;
        plateNumber: string;
    };
    slot?: {
        id: number;
        slotNumber: string;
        status: string;
    };
}

export default api;
