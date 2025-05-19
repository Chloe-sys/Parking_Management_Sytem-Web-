import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { authAPI, userAPI } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { ParkingSquare, Bell, MapPin, Settings, LogOut, User, LayoutDashboard, Check, Ticket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { theme } from '../../styles/theme';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import UserTickets from './UserTickets';

interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface DashboardData {
  notifications: Notification[];
  slots: {
    id: number;
    slotNumber: string;
    status: string;
    assignedAt?: string;
    createdAt: string;
  }[];
}

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getDashboard();
      console.log('Dashboard response:', response);
      
      if (response.success && response.data) {
        setDashboardData({
          notifications: response.data.notifications || [],
          slots: response.data.slots || []
        });
      } else {
        console.error('Invalid dashboard response:', response);
        toast.error('Failed to fetch dashboard data: Invalid response format');
      }
    } catch (error: any) {
      console.error('Error fetching dashboard:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch dashboard data');
      if (error.response?.status === 401) {
        navigate('/signin');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSlot = async (slotId: number) => {
    navigate('/user/available-slots');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    navigate('/');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await userAPI.markNotificationAsRead(notificationId);
      if (response.status === 'success') {
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        );
        toast.success('Notification marked as read');
      }
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      toast.error(error.response?.data?.message || 'Failed to mark notification as read');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
        toast.error('New password must be at least 8 characters long');
        return;
    }
    if (newPassword !== currentPassword) {
        toast.error('New passwords do not match');
        return;
    }
    setLoading(true);
    try {
        const response = await authAPI.changePassword({
            currentPassword: currentPassword,
            newPassword: newPassword
        });
        if (response.data.status === 'success') {
            toast.success('Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
        } else {
            toast.error(response.data.message || 'Failed to change password');
        }
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
        setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-park-secondary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-park-primary"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-park-secondary flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center text-gray-600">Failed to load dashboard data</p>
            <Button 
              onClick={() => navigate('/signin')}
              className="w-full mt-4 bg-park-primary hover:bg-park-accent"
            >
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const unreadNotifications = dashboardData.notifications?.filter(n => !n.isRead) || [];

  return (
    <div className="min-h-screen flex bg-park-secondary">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="hidden md:flex flex-col w-64 bg-park-primary text-white py-8 px-6 rounded-r-3xl shadow-lg"
      >
        <div className="flex flex-col items-center mb-12">
          <ParkingSquare className="h-12 w-12 mb-2" />
          <h2 className="text-2xl font-bold tracking-wide">ParkEase</h2>
          <span className="text-sm tracking-widest mt-1">USER</span>
        </div>
        <nav className="flex-1 flex flex-col gap-4">
          <button 
            className="flex items-center gap-3 py-2 px-4 rounded-lg bg-park-secondary/20 transition-colors" 
            onClick={() => navigate('/user/dashboard')}
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button 
            className="flex items-center gap-3 py-2 px-4 rounded-lg hover:bg-park-secondary/20 transition-colors" 
            onClick={() => navigate('/user/profile')}
          >
            <User className="w-5 h-5" /> Profile
          </button>
          <button 
            className="flex items-center gap-3 py-2 px-4 rounded-lg hover:bg-park-secondary/20 transition-colors" 
            onClick={() => navigate('/user/slot-requests')}
          >
            <Bell className="w-5 h-5" /> Slot Requests
          </button>
          <button 
            className="flex items-center gap-3 py-2 px-4 rounded-lg hover:bg-park-secondary/20 transition-colors" 
            onClick={() => navigate('/user/tickets')}
          >
            <Ticket className="w-5 h-5" /> My Tickets
          </button>
          <button 
            className="flex items-center gap-3 py-2 px-4 rounded-lg hover:bg-park-secondary/20 transition-colors" 
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </nav>
        <div className="mt-auto flex flex-col items-center">
          <span className="text-xs text-park-secondary">&copy; {new Date().getFullYear()} ParkEase</span>
        </div>
      </motion.aside>
      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <motion.h1 className="text-3xl font-bold text-park-primary">Welcome to your Dashboard</motion.h1>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/user/profile')}
                className="flex items-center gap-2 border-park-primary text-park-primary hover:bg-park-primary hover:text-white transition-all"
              >
                <User className="w-4 h-4" />
                Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/user/tickets')}
                className="flex items-center gap-2 border-park-primary text-park-primary hover:bg-park-primary hover:text-white transition-all"
              >
                <Ticket className="w-4 h-4" />
                Tickets
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNotifications(!showNotifications)}
                className="flex items-center gap-2 border-park-primary text-park-primary hover:bg-park-primary hover:text-white transition-all"
              >
                <Bell className="w-4 h-4" />
                Notifications
                {unreadNotifications.length > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">{unreadNotifications.length}</Badge>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center gap-2 border-park-primary text-park-primary hover:bg-park-primary hover:text-white transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 border-0 bg-white">
                <CardHeader className="border-b bg-park-secondary rounded-t-2xl">
                  <CardTitle className="flex items-center gap-2 text-park-primary">
                    <User className="w-5 h-5" />
                    Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <p className="text-sm text-park-primary">
                      <span className="font-medium">Name:</span> {JSON.parse(localStorage.getItem('user') || '{}').name}
                    </p>
                    <p className="text-sm text-park-primary">
                      <span className="font-medium">Email:</span> {JSON.parse(localStorage.getItem('user') || '{}').email}
                    </p>
                    <Button
                      onClick={() => navigate('/user/profile')}
                      className="w-full mt-4 bg-park-primary hover:bg-park-accent"
                    >
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            {/* Tickets Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 border-0 bg-white">
                <CardHeader className="border-b bg-park-secondary rounded-t-2xl">
                  <CardTitle className="flex items-center gap-2 text-park-primary">
                    <Ticket className="w-5 h-5" />
                    Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <p className="text-sm text-park-primary">
                      View your active ticket and ticket history
                    </p>
                    <Button
                      onClick={() => navigate('/user/tickets')}
                      className="w-full mt-4 bg-park-primary hover:bg-park-accent"
                    >
                      View Tickets
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            {/* Parking Slot Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 border-0 bg-white">
                <CardHeader className="border-b bg-park-secondary rounded-t-2xl">
                  <CardTitle className="flex items-center gap-2 text-park-primary">
                    <MapPin className="w-5 h-5" />
                    Parking Slots
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {dashboardData.slots && dashboardData.slots.length > 0 ? (
                    <div className="space-y-3">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Slot Number</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Assigned At</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dashboardData.slots.map((slot) => (
                            <TableRow key={slot.id}>
                              <TableCell>{slot.slotNumber}</TableCell>
                              <TableCell className="capitalize">{slot.status}</TableCell>
                              <TableCell>{formatDate(slot.assignedAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-center py-4 text-park-primary">
                      No parking slots assigned yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            {/* Notifications Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 border-0 bg-white">
                <CardHeader className="border-b bg-park-secondary rounded-t-2xl">
                  <CardTitle className="flex items-center gap-2 text-park-primary">
                    <Bell className="w-5 h-5" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 max-h-64 overflow-y-auto">
                  {dashboardData.notifications.length === 0 ? (
                    <p className="text-center text-gray-500">No notifications</p>
                  ) : (
                    dashboardData.notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border mb-3 ${
                          notification.isRead ? 'bg-gray-50' : 'bg-park-primary/5'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-park-primary">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsRead(notification.id)}
                              className="ml-4 h-8 px-2"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
          {/* Available Slots Table */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Available Parking Slots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-2xl mx-auto flex flex-col gap-4 mt-8">
                <Link to="/user/available-slots">
                  <Button variant="outline" className="w-full">View Available Slots</Button>
                </Link>
                <Link to="/user/slot-requests">
                  <Button variant="outline" className="w-full">View My Slot Requests</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default UserDashboard;
