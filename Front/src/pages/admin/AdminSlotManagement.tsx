import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, ArrowUpDown, Settings, Car, Clock, AlertCircle, X, LogOut, Users, LayoutDashboard, Pencil, Trash2, ArrowLeft } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    slotNumber: '',
    status: 'available' as 'available' | 'occupied' | 'maintenance'
  });

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSlots();
      console.log('Fetched slots response:', response);
      
      if (Array.isArray(response)) {
        // Ensure IDs are numbers and sort slots by slot number
        const sortedSlots = response.map(slot => ({
          ...slot,
          id: Number(slot.id)
        })).sort((a, b) => 
          a.slotNumber.localeCompare(b.slotNumber, undefined, { numeric: true })
        );
        setSlots(sortedSlots);
      } else {
        console.error('Invalid slots response:', response);
        toast.error('Failed to fetch parking slots: Invalid response format');
      }
    } catch (error: any) {
      console.error('Error fetching slots:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch parking slots');
    } finally {
      setLoading(false);
    }
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

  // Filter slots based on search query and status filter
  const filteredSlots = slots.filter(slot => {
    const matchesSearch = slot.slotNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || slot.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            className="flex items-center gap-3 py-2 px-4 rounded-lg hover:bg-park-secondary/20 transition-colors text-white" 
            onClick={() => navigate('/admin/users')}
          >
            <Users className="w-5 h-5" /> Users
          </button>
          <button 
            className="flex items-center gap-3 py-2 px-4 rounded-lg bg-park-secondary/20 transition-colors text-white" 
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
                <h1 className="text-2xl md:text-3xl font-bold text-park-primary">Parking Slot Management</h1>
                <p className="text-sm md:text-base text-gray-600 mt-1">Manage parking slots and assignments</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Input
                type="text"
                placeholder="Search slots..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 text-white placeholder:text-white/60"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40 text-white">
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
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Create Slot</span>
                <span className="md:hidden">Add</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Slots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-park-primary">{slots.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Available Slots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-park-primary">{slots.filter(slot => slot.status === 'available').length}</div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Occupied Slots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-park-primary">{slots.filter(slot => slot.status === 'occupied').length}</div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-park-primary">{slots.filter(slot => slot.status === 'maintenance').length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Slots Table */}
          <Card className="bg-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] text-white">ID</TableHead>
                      <TableHead className="text-white">Slot Number</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="hidden md:table-cell text-white">Assigned To</TableHead>
                      <TableHead className="hidden md:table-cell text-white">Plate Number</TableHead>
                      <TableHead className="hidden md:table-cell text-white">Assigned At</TableHead>
                      <TableHead className="text-right text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSlots.map((slot) => (
                      <TableRow key={slot.id}>
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
                        <TableCell className="hidden md:table-cell">
                          {slot.status === 'occupied' ? (
                            <div className="space-y-1">
                              <p className="font-medium">{slot.userName || 'N/A'}</p>
                              <p className="text-sm text-gray-500">{slot.userEmail || 'N/A'}</p>
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {slot.plateNumber || '-'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {slot.assignedAt ? new Date(slot.assignedAt).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 md:px-3"
                              onClick={() => openEditDialog(slot)}
                              disabled={loading}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="hidden md:inline ml-1">Edit</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 md:px-3"
                              onClick={() => handleDeleteSlot(slot.id)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="hidden md:inline ml-1">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
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
    </div>
  );
};

export default AdminSlotManagement; 