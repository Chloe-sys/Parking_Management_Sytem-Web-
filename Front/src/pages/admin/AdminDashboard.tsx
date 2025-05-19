import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ParkingSquare, Clock, AlertCircle, Settings, ParkingCircle, LogOut, LayoutDashboard } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend as RechartsLegend } from 'recharts';
import { theme } from '../../styles/theme';
import { AdminNavbarLayout } from '@/components/admin/AdminNavbar';
import { useNavigate, Link } from 'react-router-dom';

interface DashboardStats {
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  totalUsers: number;
  pendingApprovals: number;
  pendingUsers: number;
  recentAssignments: Array<{
    id: number;
    userId: number;
    type: string;
    message: string;
    isRead: number;
    createdAt: string;
    assignedAt?: string;
    userName: string;
  }>;
}

interface User {
  id: string;
  name: string;
  email: string;
  plateNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const COLORS = [theme.colors.primary, theme.colors.accent, theme.colors.status?.warning || '#FFD700', theme.colors.status?.info || '#00BFFF'];

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboard();
      console.log('Dashboard response:', response);
      let statsData = null;
      if (response && response.userStats && response.slotStats) {
        statsData = {
          totalUsers: response.userStats.totalUsers || 0,
          pendingApprovals: parseInt(response.userStats.pendingUsers) || 0,
          totalSlots: response.slotStats.totalSlots || 0,
          availableSlots: parseInt(response.slotStats.availableSlots) || 0,
          occupiedSlots: parseInt(response.slotStats.occupiedSlots) || 0,
          pendingUsers: parseInt(response.userStats.pendingUsers) || 0,
          recentAssignments: response.recentActivities || []
        };
      }
      setStats(statsData);
      console.log('Stats set:', statsData);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    setProfileLoading(true);
    try {
      const response = await adminAPI.updateProfile({ name: profileName, email: profileEmail });
      if (response.data?.status === 'success') {
        toast.success('Profile updated successfully');
        setShowSettings(false);
      } else {
        toast.error(response.data?.message || 'Failed to update profile');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setProfileLoading(true);
    try {
      const response = await adminAPI.changePassword({ currentPassword, newPassword });
      if (response.data?.status === 'success') {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setShowSettings(false);
      } else {
        toast.error(response.data?.message || 'Failed to change password');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    navigate('/');
  };

  const getPieChartData = () => {
    if (!stats) return [];
    return [
      { name: 'Available', value: stats.availableSlots },
      { name: 'Occupied', value: stats.occupiedSlots },
    ];
  };

  const RecentAssignments: React.FC<{ assignments: DashboardStats['recentAssignments'] }> = ({ assignments }) => {
    if (!assignments.length) {
      return (
        <div className="text-center py-4 text-gray-500">
          No recent assignments
        </div>
      );
    }

    const formatDate = (dateString: string) => {
      try {
        if (!dateString) return 'Date not available';
        
        // Handle ISO date string
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return 'Date not available';
        }
        
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      } catch (error) {
        console.error('Error formatting date:', error);
        return 'Date not available';
      }
    };

    return (
      <div className="space-y-4">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">{assignment.userName}</h4>
                <p className="text-sm text-gray-600 mt-1">{assignment.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Assigned: {formatDate(assignment.assignedAt || assignment.createdAt)}
                </p>
              </div>
              <span className="text-xs text-gray-500">
                {formatDate(assignment.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-park-secondary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-park-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-park-secondary flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center text-gray-600">No data available</p>
            <Button 
              onClick={fetchDashboardStats}
              className="w-full mt-4 bg-park-primary hover:bg-park-accent"
            >
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AdminNavbarLayout>
      <main className="flex-1 p-6 md:p-12" style={{ background: theme.colors.secondary, minHeight: '100vh' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <motion.h1 className="text-3xl font-bold text-park-primary">Admin Dashboard</motion.h1>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2 border-park-primary text-park-primary hover:bg-park-primary hover:text-white transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate('/admin/users')}
              >
                <CardHeader className="bg-park-primary/10">
                  <CardTitle className="flex items-center gap-2 text-park-primary">
                    <Users className="w-5 h-5" />
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-3xl font-bold text-park-primary">{stats.totalUsers}</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate('/admin/parking-slots')}
              >
                <CardHeader className="bg-park-primary/10">
                  <CardTitle className="flex items-center gap-2 text-park-primary">
                    <ParkingSquare className="w-5 h-5" />
                    Total Slots
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-3xl font-bold text-park-primary">{stats.totalSlots}</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate('/admin/profile')}
              >
                <CardHeader className="bg-park-primary/10">
                  <CardTitle className="flex items-center gap-2 text-park-primary">
                    <Settings className="w-5 h-5" />
                    Profile Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-park-primary">Manage your account settings</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          {/* Pie Chart and Recent Assignments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center"
            >
              <h3 className="text-xl font-bold text-park-primary mb-4">Slot Occupancy</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={getPieChartData()}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {getPieChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <RechartsLegend />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-park-primary mb-4">Recent Assignments</h3>
              <RecentAssignments assignments={stats.recentAssignments} />
            </motion.div>
          </div>
          <div className="my-6">
            <Link to="/admin/slot-requests">
              <Button variant="outline" className="w-full">Manage Slot Requests</Button>
            </Link>
          </div>
        </motion.div>
      </main>
    </AdminNavbarLayout>
  );
};

export default AdminDashboard;
