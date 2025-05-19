import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { AdminNavbarLayout } from '@/components/admin/AdminNavbar';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ParkingSquare, LayoutDashboard, Users, LogOut, Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { theme } from '../../styles/theme';

interface SlotRequest {
  id: number;
  userId: number;
  slotId: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  userName: string;
  userEmail: string;
  slotNumber: string;
}

const PAGE_SIZE = 10;

const AdminSlotRequests: React.FC = () => {
  const [requests, setRequests] = useState<SlotRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line
  }, [page, search]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getSlotRequests({ page, limit: PAGE_SIZE, search });
      let requestsData = [];
      let totalData = total;
      if (Array.isArray(response.data)) {
        requestsData = response.data;
        totalData = response.data.length;
      } else if (response.data?.slotRequests) {
        requestsData = response.data.slotRequests;
        totalData = response.data.total || response.data.slotRequests.length;
      }
      setRequests(requestsData);
      setTotal(totalData);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch slot requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId: number, status: 'approved' | 'rejected') => {
    try {
      await adminAPI.handleSlotRequest(String(requestId), status);
      toast.success(`Request ${status}`);
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${status} request`);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Sanitize input: allow only alphanumeric, space, dash
    const sanitized = searchInput.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    setPage(1);
    setSearch(sanitized);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

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
            <motion.h1 style={{ color: theme.colors.primary }} className="text-3xl font-bold">
              Slot Requests
            </motion.h1>
            <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto justify-end">
              <Input
                type="text"
                placeholder="Search by user, email, or slot number..."
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
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="pb-2 border-b bg-park-secondary rounded-t-2xl">
                <CardTitle className="text-sm font-medium text-park-primary flex items-center gap-2"><Bell className="w-4 h-4" />Total Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-park-primary">{total}</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="pb-2 border-b bg-park-secondary rounded-t-2xl">
                <CardTitle className="text-sm font-medium text-park-primary flex items-center gap-2"><Bell className="w-4 h-4" />Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-park-primary">{requests.filter(r => r.status === 'pending').length}</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="pb-2 border-b bg-park-secondary rounded-t-2xl">
                <CardTitle className="text-sm font-medium text-park-primary flex items-center gap-2"><Bell className="w-4 h-4" />Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-park-primary">{requests.filter(r => r.status === 'approved').length}</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="pb-2 border-b bg-park-secondary rounded-t-2xl">
                <CardTitle className="text-sm font-medium text-park-primary flex items-center gap-2"><Bell className="w-4 h-4" />Rejected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-park-primary">{requests.filter(r => r.status === 'rejected').length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Requests Table */}
          <Card className="rounded-2xl shadow-lg border-0 bg-white">
            <CardHeader className="border-b bg-park-secondary rounded-t-2xl">
              <CardTitle className="flex items-center gap-2 text-park-primary"><Bell className="w-5 h-5" />All Slot Requests</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Slot Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>
                    ) : requests.length === 0 ? (
                      <TableRow><TableCell colSpan={6}>No slot requests found.</TableCell></TableRow>
                    ) : (
                      requests.map((req, idx) => (
                        <TableRow key={req.id ? String(req.id) : `${req.userEmail}-${idx}`}>
                          <TableCell>{req.userName}</TableCell>
                          <TableCell>{req.userEmail}</TableCell>
                          <TableCell>{req.slotNumber}</TableCell>
                          <TableCell className="capitalize">
                            <Badge variant={
                              req.status === 'pending' ? 'secondary' :
                              req.status === 'approved' ? 'default' : 'destructive'
                            }>
                              {req.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(req.createdAt).toLocaleString()}</TableCell>
                          <TableCell className="space-x-2">
                            {req.status === 'pending' && (
                              <>
                                <Button size="sm" onClick={() => handleAction(req.id, 'approved')}>Approve</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleAction(req.id, 'rejected')}>Reject</Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination Controls */}
              <div className="flex justify-between items-center mt-4 px-4 pb-4">
                <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <Button disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </AdminNavbarLayout>
  );
};

export default AdminSlotRequests; 