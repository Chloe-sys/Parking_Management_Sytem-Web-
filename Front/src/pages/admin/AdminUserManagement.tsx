import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Filter, ArrowUpDown, Settings, Car, LogOut, LayoutDashboard, Check, X, ArrowLeft, Plus } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import debounce from 'lodash/debounce';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email: string;
  plateNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  slotId?: string;
  slotNumber?: string;
  slotStatus?: 'available' | 'occupied' | 'maintenance';
  assignedAt?: string;
  activeParkingCount?: number;
}

interface Pagination {
  totalUsers: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface Filters {
  search: string;
  status: string;
  plateNumber: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

const AdminUserManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    totalUsers: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    plateNumber: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showSettings, setShowSettings] = useState(false);

  // Debounced search function
  const debouncedFetchUsers = useCallback(
    debounce(() => {
      fetchUsers();
    }, 500),
    [filters, pagination.currentPage]
  );

  useEffect(() => {
    debouncedFetchUsers();
    return () => {
      debouncedFetchUsers.cancel();
    };
  }, [filters, pagination.currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers({
        page: pagination.currentPage,
        limit: pagination.limit,
        search: filters.search,
        status: filters.status === 'all' ? undefined : filters.status,
        plateNumber: filters.plateNumber,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      console.log('Fetch users response:', response);

      if (response.success && response.data?.users) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      } else {
        console.error('Invalid response format:', response);
        toast.error('Failed to fetch users: Invalid response format');
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in again');
        navigate('/admin/signin');
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch users');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string | number) => {
    try {
      const userIdStr = String(userId);
      if (!userIdStr) {
        console.error('Invalid user ID:', userId);
        throw new Error('User ID is required');
      }
      console.log('Approving user with ID:', userIdStr);
      const response = await adminAPI.approveUser(userIdStr);
      console.log('Approve user response:', response);
      
      if (response.success) {
        toast.success(response.message || 'User approved successfully');
        // Update local state immediately
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userIdStr 
              ? { 
                  ...user, 
                  status: 'approved',
                  slotNumber: response.data?.slotNumber,
                  slotStatus: response.data?.slotStatus,
                  assignedAt: response.data?.assignedAt
                }
              : user
          )
        );
        // Refresh the list to ensure data consistency
        fetchUsers();
      } else {
        toast.error(response.message || 'Failed to approve user');
      }
    } catch (err: any) {
      console.error('Error approving user:', err);
      const errorMessage = err.message || err.response?.data?.message;
      
      if (errorMessage?.includes('already has an assigned slot')) {
        toast.error('This user already has a parking slot assigned');
      } else if (errorMessage?.includes('No parking slots available')) {
        toast.error('No parking slots are currently available');
      } else if (errorMessage?.includes('Failed to assign slot')) {
        toast.error('Failed to assign slot - it may have been assigned to another user');
      } else {
        toast.error(errorMessage || 'Failed to approve user');
      }
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      const response = await adminAPI.rejectUser(userId, 'Rejected by admin');
      toast.success('User rejected successfully');
      // Update local state immediately
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, status: 'rejected' }
            : user
        )
      );
      // Refresh the list
      fetchUsers();
    } catch (err: any) {
      console.error('Error rejecting user:', err);
      const errorMessage = err.message || err.response?.data?.message;
      toast.error(errorMessage || 'Failed to reject user');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'ASC' ? 'DESC' : 'ASC'
    }));
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await adminAPI.markNotificationAsRead(notificationId);
      if (response.success) {
        toast.success('Notification marked as read');
        // Refresh notifications if needed
      }
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      toast.error(error.message || 'Failed to mark notification as read');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-park-secondary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-park-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-park-secondary">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="hidden md:flex flex-col w-64 bg-park-primary text-gray-800 py-8 px-6 rounded-r-3xl shadow-lg"
      >
        <div className="flex flex-col items-center mb-12">
          <Car className="h-12 w-12 mb-2" />
          <h2 className="text-2xl font-bold tracking-wide">ParkEase</h2>
          <span className="text-sm tracking-widest mt-1">ADMIN</span>
        </div>
        <nav className="flex-1 flex flex-col gap-4">
          <button 
            className="flex items-center gap-3 py-2 px-4 rounded-lg hover:bg-park-secondary/20 transition-colors text-white" 
            onClick={() => navigate('/admin/dashboard')}
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button 
            className="flex items-center gap-3 py-2 px-4 rounded-lg bg-park-secondary/20 transition-colors text-white" 
            onClick={() => navigate('/admin/users')}
          >
            <Users className="w-5 h-5" /> Users
          </button>
          <button 
            className="flex items-center gap-3 py-2 px-4 rounded-lg hover:bg-park-secondary/20 transition-colors text-white" 
            onClick={() => navigate('/admin/parking-slots')}
          >
            <Car className="w-5 h-5" /> Parking Slots
          </button>
          <button 
            className="flex items-center gap-3 py-2 px-4 rounded-lg hover:bg-park-secondary/20 transition-colors text-white" 
            onClick={() => { localStorage.clear(); navigate('/'); }}
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </nav>
        <div className="mt-auto flex flex-col items-center">
          <span className="text-xs text-gray-600">&copy; {new Date().getFullYear()} ParkEase</span>
        </div>
      </motion.aside>
      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden md:inline">Back to Dashboard</span>
                <span className="md:hidden">Back</span>
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">User Management</h1>
                <p className="text-sm md:text-base text-white mt-1">Manage user accounts and approvals</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Input
                type="text"
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full md:w-64 text-white placeholder:text-white/60"
              />
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="w-full md:w-40 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => setShowSettings(true)}
                className="w-full md:w-auto"
              >
                <Filter className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Filter</span>
                <span className="md:hidden">Filter</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-park-primary">{pagination.totalUsers}</div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-park-primary">{users.filter(u => u.status === 'pending').length}</div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Approved Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-park-primary">{users.filter(u => u.status === 'approved').length}</div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Rejected Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-park-primary">{users.filter(u => u.status === 'rejected').length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card className="bg-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] text-white">ID</TableHead>
                      <TableHead className="text-white">Name</TableHead>
                      <TableHead className="text-white">Email</TableHead>
                      <TableHead className="text-white">Plate Number</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Created At</TableHead>
                      <TableHead className="text-right text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium text-white">{user.id}</TableCell>
                        <TableCell className="text-white">{user.name}</TableCell>
                        <TableCell className="text-white">{user.email}</TableCell>
                        <TableCell className="text-white">{user.plateNumber}</TableCell>
                        <TableCell className="text-white">
                          <Badge
                            variant={
                              user.status === 'approved'
                                ? 'default'
                                : user.status === 'rejected'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right text-white">
                          <div className="flex justify-end gap-2">
                            {user.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2 md:px-3"
                                  onClick={() => handleApproveUser(user.id)}
                                  disabled={loading}
                                >
                                  <Check className="h-4 w-4" />
                                  <span className="hidden md:inline ml-1">Approve</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2 md:px-3"
                                  onClick={() => handleRejectUser(user.id)}
                                  disabled={loading}
                                >
                                  <X className="h-4 w-4" />
                                  <span className="hidden md:inline ml-1">Reject</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <div className="text-sm text-gray-600">
              Showing {users.length} of {pagination.totalUsers} users
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={!pagination.hasPrevPage}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={!pagination.hasNextPage}
              >
                Next
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminUserManagement;
