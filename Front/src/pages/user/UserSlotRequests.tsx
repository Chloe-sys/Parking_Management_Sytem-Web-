import React, { useEffect, useState } from 'react';
import { userAPI } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ParkingSquare, LayoutDashboard, User, LogOut, Bell, Ticket } from 'lucide-react';

const PAGE_SIZE = 10;

const UserSlotRequests: React.FC = () => {
  const [slotRequests, setSlotRequests] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSlotRequests();
    // eslint-disable-next-line
  }, [page, search]);

  const fetchSlotRequests = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getSlotRequests({ page, limit: PAGE_SIZE, search });
      setSlotRequests(response.data?.slotRequests || []);
      setTotal(response.data?.total || 0);
    } catch (error: any) {
      toast.error('Failed to fetch slot requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    navigate('/');
  };

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
            className="flex items-center gap-3 py-2 px-4 rounded-lg hover:bg-park-secondary/20 transition-colors" 
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
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <motion.h1 className="text-3xl font-bold text-park-primary flex items-center gap-2">
              <Bell className="w-7 h-7" /> My Slot Requests
            </motion.h1>
            <Button
              variant="outline"
              onClick={() => navigate('/user/dashboard')}
              className="flex items-center gap-2 border-park-primary text-park-primary hover:bg-park-primary hover:text-white transition-all"
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Button>
          </div>
          <Card className="rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 border-0 bg-white">
            <CardHeader className="border-b bg-park-secondary rounded-t-2xl">
              <CardTitle className="flex items-center gap-2 text-park-primary">
                <Bell className="w-5 h-5" /> Slot Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="mb-4 flex gap-2">
                <Input
                  placeholder="Search by slot number..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="max-w-xs"
                />
                <Button type="submit">Search</Button>
              </form>
              {loading ? (
                <div>Loading requests...</div>
              ) : slotRequests.length === 0 ? (
                <div>No slot requests found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Slot Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slotRequests.map((req: any) => (
                        <TableRow key={req.id}>
                          <TableCell>{req.slotNumber}</TableCell>
                          <TableCell className="capitalize">{req.status}</TableCell>
                          <TableCell>{new Date(req.createdAt).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {/* Pagination Controls */}
              <div className="flex justify-between items-center mt-4">
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
    </div>
  );
};

export default UserSlotRequests; 