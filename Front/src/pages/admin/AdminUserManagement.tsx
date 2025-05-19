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
import { AdminNavbarLayout } from '@/components/admin/AdminNavbar';
import { theme } from '../../styles/theme';

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
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [search, pagination.currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers({
        page: pagination.currentPage,
        limit: pagination.limit,
        search,
        status: filters.status === 'all' ? undefined : filters.status,
        plateNumber: filters.plateNumber,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });
      let usersData = [];
      let paginationData = pagination;
      if (Array.isArray(response.data)) {
        usersData = response.data;
        paginationData = {
          totalUsers: response.data.length,
          totalPages: 1,
          currentPage: 1,
          limit: response.data.length,
          hasNextPage: false,
          hasPrevPage: false
        };
      } else if (response.data?.users) {
        usersData = response.data.users;
        paginationData = response.data.pagination || pagination;
      }
      setUsers(usersData);
      setPagination(paginationData);
      console.log('Fetched users:', usersData);
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
    if (key === 'search') {
      // Sanitize input: allow only alphanumeric, space, dash
      value = value.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    }
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = searchInput.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    setSearch(sanitized);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-park-secondary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-park-primary"></div>
      </div>
    );
  }

  return (
    <AdminNavbarLayout>
      <main className="flex-1 p-4 md:p-8 lg:p-12" style={{ background: theme.colors.secondary, minHeight: '100vh' }}>
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
                style={{ color: theme.colors.primary }}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden md:inline">Back to Dashboard</span>
                <span className="md:hidden">Back</span>
              </Button>
              <div>
                <h1 style={{ color: theme.colors.primary }} className="text-2xl md:text-3xl font-bold">User Management</h1>
                <p className="text-sm md:text-base" style={{ color: theme.colors.text.secondary }}>Manage user accounts and approvals</p>
              </div>
            </div>
            <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto justify-end">
              <Input
                type="text"
                placeholder="Search users..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full md:w-64"
                style={{ color: theme.colors.primary, background: theme.colors.background }}
              />
              <Button type="submit" style={{ background: theme.colors.primary, color: theme.colors.text.light }}>
                <Search className="h-4 w-4 mr-1" /> Search
              </Button>
            </form>
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
                      <TableHead className="text-black">Name</TableHead>
                      <TableHead className="text-black">Email</TableHead>
                      <TableHead className="text-black">Plate Number</TableHead>
                      <TableHead className="text-black">Status</TableHead>
                      <TableHead className="text-black">Created At</TableHead>
                      <TableHead className="text-right text-black">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium text-green">{user.id}</TableCell>
                        <TableCell className="text-green">{user.name}</TableCell>
                        <TableCell className="text-green">{user.email}</TableCell>
                        <TableCell className="text-green">{user.plateNumber}</TableCell>
                        <TableCell className="text-green">
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

          {!loading && users.length === 0 && (
            <div className="text-center text-gray-500 py-4">No users found.</div>
          )}
        </motion.div>
      </main>
    </AdminNavbarLayout>
  );
};

export default AdminUserManagement;
