import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, ArrowUpDown, Settings, ParkingSquare, Clock, AlertCircle, X, LogOut, Users, LayoutDashboard, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useNavigate } from 'react-router-dom';
import { AdminNavbarLayout } from '@/components/admin/AdminNavbar';
import { theme } from '../../styles/theme';

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

const PAGE_SIZE = 10;

const AdminSlotManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    slotNumber: '',
    status: 'available' as 'available' | 'occupied' | 'maintenance'
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchSlots();
    // eslint-disable-next-line
  }, [page, search, statusFilter]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSlotsPaginated({ page, limit: PAGE_SIZE, search, status: statusFilter });
      let slotsData = [];
      let totalData = total;
      if (Array.isArray(response.data)) {
        slotsData = response.data;
        totalData = response.data.length;
      } else if (response.data?.slots) {
        slotsData = response.data.slots;
        totalData = response.data.total || response.data.slots.length;
      }
      setSlots(slotsData);
      setTotal(totalData);
      console.log('Fetched slots:', slotsData);
    } catch (error: any) {
      console.error('Error fetching slots:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch parking slots');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Sanitize input: allow only alphanumeric, space, dash
    const sanitized = searchQuery.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    setPage(1);
    setSearch(sanitized);
  };

  const handleCreateSlot = async () => {
    if (!formData.slotNumber.trim()) {
      toast.error('Please enter a slot number');
      return;
    }

    try {
      const response = await adminAPI.createSlot({
        slotNumber: formData.slotNumber,
        status: 'available'
      });

      if (response.slot) {
        // Add the new slot to the existing slots array
        setSlots(prevSlots => {
          const newSlots = [...prevSlots, response.slot];
          // Sort slots by slot number
          return newSlots.sort((a, b) => 
            a.slotNumber.localeCompare(b.slotNumber, undefined, { numeric: true })
          );
        });
        toast.success(response.message || 'Parking slot created successfully');
        setFormData({ slotNumber: '', status: 'available' });
        setIsCreateDialogOpen(false);
      } else {
        toast.error('Failed to create parking slot: Invalid response');
      }
    } catch (error: any) {
      console.error('Error creating slot:', error);
      if (error.response?.status === 400) {
        toast.error('This slot number already exists');
      } else {
        toast.error(error.response?.data?.message || 'Failed to create parking slot');
      }
    }
  };

  const handleEditSlot = async () => {
    if (!editingSlotId || !formData.slotNumber.trim()) {
      toast.error('Please enter a slot number');
      return;
    }

    try {
      const response = await adminAPI.updateSlot(editingSlotId.toString(), {
        slotNumber: formData.slotNumber,
        status: formData.status
      });

      toast.success(response.message || 'Parking slot updated successfully');
      setFormData({ slotNumber: '', status: 'available' });
      setEditingSlotId(null);
      setIsEditDialogOpen(false);
      await fetchSlots();
    } catch (error: any) {
      console.error('Error updating slot:', error);
      if (error.response?.status === 404) {
        toast.error('Parking slot not found');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'This slot number already exists');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update parking slot');
      }
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (!confirm('Are you sure you want to delete this parking slot?')) {
      return;
    }

    try {
      const response = await adminAPI.deleteSlot(slotId.toString());
      toast.success(response.message || 'Parking slot deleted successfully');
      await fetchSlots();
    } catch (error: any) {
      console.error('Error deleting slot:', error);
      if (error.response?.status === 400) {
        toast.error('Cannot delete an occupied slot');
      } else if (error.response?.status === 404) {
        toast.error('Parking slot not found');
      } else {
        toast.error(error.response?.data?.message || 'Failed to delete parking slot');
      }
    }
  };

  const openEditDialog = (slot: ParkingSlot) => {
    setEditingSlotId(slot.id);
    setFormData({
      slotNumber: slot.slotNumber,
      status: slot.status
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      available: 'bg-green-100 text-green-800',
      occupied: 'bg-red-100 text-red-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-park-secondary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-park-primary"></div>
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
            <motion.h1 style={{ color: theme.colors.primary }} className="text-3xl font-bold">
              Parking Slot Management
            </motion.h1>
            <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto justify-end">
              <Input
                type="text"
                placeholder="Search slots..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full md:w-64"
                style={{ color: theme.colors.primary, background: theme.colors.background }}
              />
              <Button type="submit" style={{ background: theme.colors.primary, color: theme.colors.text.light }}>
                <Search className="h-4 w-4 mr-1" /> Search
              </Button>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Slots</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="w-full md:w-auto"
                style={{ background: theme.colors.accent, color: theme.colors.text.light }}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Create Slot</span>
                <span className="md:hidden">Add</span>
              </Button>
            </form>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="pb-2 border-b bg-park-secondary rounded-t-2xl">
                <CardTitle className="text-sm font-medium text-park-primary flex items-center gap-2"><ParkingSquare className="w-4 h-4" />Total Slots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-park-primary">{total}</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="pb-2 border-b bg-park-secondary rounded-t-2xl">
                <CardTitle className="text-sm font-medium text-park-primary flex items-center gap-2"><ParkingSquare className="w-4 h-4" />Available Slots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-park-primary">{slots.filter(slot => slot.status === 'available').length}</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="pb-2 border-b bg-park-secondary rounded-t-2xl">
                <CardTitle className="text-sm font-medium text-park-primary flex items-center gap-2"><ParkingSquare className="w-4 h-4" />Occupied Slots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-park-primary">{slots.filter(slot => slot.status === 'occupied').length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Slots Table */}
          <Card className="rounded-2xl shadow-lg border-0 bg-white">
            <CardHeader className="border-b bg-park-secondary rounded-t-2xl">
              <CardTitle className="flex items-center gap-2 text-park-primary"><ParkingSquare className="w-5 h-5" />All Parking Slots</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] text-black">ID</TableHead>
                      <TableHead className='text-black'>Slot Number</TableHead>
                      <TableHead className='text-black'>Status</TableHead>
                      <TableHead className='text-black'>Assigned To</TableHead>
                      <TableHead className='text-black'>Plate Number</TableHead>
                      <TableHead className='text-black'>Assigned At</TableHead>
                      <TableHead className="text-right text-black">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slots.map((slot, idx) => (
                      <TableRow key={slot.id ? String(slot.id) : `${slot.slotNumber}-${idx}`}>
                        <TableCell className="font-medium">{slot.id}</TableCell>
                        <TableCell>{slot.slotNumber}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              slot.status === 'available'
                                ? 'default'
                                : slot.status === 'occupied'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {slot.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {slot.status === 'occupied' ? (
                            <div className="space-y-1">
                              <p className="font-medium">{slot.userName || 'N/A'}</p>
                              <p className="text-sm text-gray-500">{slot.userEmail || 'N/A'}</p>
                              <p className="text-xs text-gray-400">ID: {slot.userId || 'N/A'}</p>
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {slot.status === 'occupied' ? (
                            <Badge variant="outline" className="font-mono">
                              {slot.plateNumber || 'N/A'}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {slot.assignedAt ? (
                            <div className="space-y-1">
                              <p>{new Date(slot.assignedAt).toLocaleDateString()}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(slot.assignedAt).toLocaleTimeString()}
                              </p>
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 md:px-3"
                              onClick={() => openEditDialog(slot)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 px-2 md:px-3"
                              onClick={() => handleDeleteSlot(slot.id)}
                              disabled={slot.status === 'occupied'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
          {!loading && slots.length === 0 && (
            <div className="text-center text-gray-500 py-4">No slots found.</div>
          )}
        </motion.div>
      </main>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Slot</DialogTitle>
            <DialogDescription>Add a new parking slot to the system.</DialogDescription>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); handleCreateSlot(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slotNumber">Slot Number</Label>
              <Input
                id="slotNumber"
                value={formData.slotNumber}
                onChange={(e) => setFormData({ ...formData, slotNumber: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as 'available' | 'occupied' | 'maintenance' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Create Slot'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Slot</DialogTitle>
            <DialogDescription>Update the parking slot details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); handleEditSlot(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editSlotNumber">Slot Number</Label>
              <Input
                id="editSlotNumber"
                value={formData.slotNumber}
                onChange={(e) => setFormData({ ...formData, slotNumber: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editStatus">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as 'available' | 'occupied' | 'maintenance' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Update Slot'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminNavbarLayout>
  );
};

export default AdminSlotManagement; 