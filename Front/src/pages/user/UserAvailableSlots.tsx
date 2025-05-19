import React, { useEffect, useState } from 'react';
import { userAPI } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ParkingSquare, LayoutDashboard, User, LogOut, MapPin, Bell, Ticket, AlertCircle, Info, Calendar, Clock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';

const PAGE_SIZE = 10;

const UserAvailableSlots: React.FC = () => {
  const [slots, setSlots] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestEntryTime, setRequestEntryTime] = useState('');
  const [requestExitTime, setRequestExitTime] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState<{ duration: number; amount: number } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSlots();
    checkActiveTicketAndRequest();
    // eslint-disable-next-line
  }, [page, search]);

  const checkActiveTicketAndRequest = async () => {
    try {
      // Check for active ticket
      const ticketResponse = await userAPI.getActiveTicket();
      if (ticketResponse.success && ticketResponse.data?.ticket) {
        setActiveTicket(ticketResponse.data.ticket);
        return;
      }

      // Check for active request
      const requestResponse = await userAPI.getSlotRequests({ limit: 1 });
      if (requestResponse.success && requestResponse.data?.slotRequests?.length > 0) {
        const latestRequest = requestResponse.data.slotRequests[0];
        if (['pending', 'approved'].includes(latestRequest.status)) {
          setActiveRequest(latestRequest);
        }
      }
    } catch (error) {
      console.error('Error checking active ticket/request:', error);
    }
  };

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getAvailableSlots({ page, limit: PAGE_SIZE, search });
      setSlots(response.slots || []);
      setTotal(response.total || 0);
    } catch (error: any) {
      toast.error('Failed to fetch available slots');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSlot = async (slotId: number) => {
    setSelectedSlot(slots.find(s => s.id === slotId));
    setIsRequestDialogOpen(true);
  };

  const handleSubmitRequest = async () => {
    try {
      // Validate times
      if (!requestEntryTime || !requestExitTime) {
        toast.error('Please select both entry and exit times');
        return;
      }

      const entryDateTime = new Date(requestEntryTime);
      const exitDateTime = new Date(requestExitTime);

      if (entryDateTime >= exitDateTime) {
        toast.error('Exit time must be after entry time');
        return;
      }

      if (entryDateTime < new Date()) {
        toast.error('Entry time cannot be in the past');
        return;
      }

      // Check if user already has an active ticket or request
      if (activeTicket) {
        toast.error('You already have an active ticket');
        return;
      }
      if (activeRequest) {
        toast.error('You already have an active slot request');
        return;
      }

      const response = await userAPI.requestSlot(selectedSlot.id, {
        requestedEntryTime: entryDateTime.toISOString(),
        requestedExitTime: exitDateTime.toISOString(),
        reason: requestReason
      });

      if (response.success) {
        toast.success('Slot request submitted successfully');
        setIsRequestDialogOpen(false);
        setRequestEntryTime('');
        setRequestExitTime('');
        setRequestReason('');
        setEstimatedAmount(null);
        // Refresh the slots list and check for active request
        await Promise.all([fetchSlots(), checkActiveTicketAndRequest()]);
      } else {
        toast.error(response.message || 'Failed to request slot');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to request slot');
    }
  };

  const calculateEstimatedAmount = async () => {
    if (!requestEntryTime || !requestExitTime) {
      setEstimatedAmount(null);
      return;
    }

    try {
      const entryDateTime = new Date(requestEntryTime);
      const exitDateTime = new Date(requestExitTime);

      if (entryDateTime >= exitDateTime) {
        setEstimatedAmount(null);
        return;
      }

      const response = await userAPI.calculateEstimatedAmount({
        requestedEntryTime: entryDateTime.toISOString(),
        requestedExitTime: exitDateTime.toISOString()
      });

      if (response.success) {
        setEstimatedAmount(response.data);
      }
    } catch (error) {
      console.error('Error calculating estimated amount:', error);
      setEstimatedAmount(null);
    }
  };

  useEffect(() => {
    calculateEstimatedAmount();
  }, [requestEntryTime, requestExitTime]);

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
              <MapPin className="w-7 h-7" /> Available Parking Slots
            </motion.h1>
            <Button
              variant="outline"
              onClick={() => navigate('/user/dashboard')}
              className="flex items-center gap-2 border-park-primary text-park-primary hover:bg-park-primary hover:text-white transition-all"
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Button>
          </div>
          {/* Status Alert */}
          {(activeTicket || activeRequest) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md"
            >
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
                <p className="text-yellow-700">
                  {activeTicket 
                    ? 'You currently have an active ticket. You cannot request a new slot until your current ticket is completed.'
                    : activeRequest?.status === 'pending'
                    ? 'You have a pending slot request. You cannot request a new slot until your current request is processed.'
                    : 'You have an approved slot request. You cannot request a new slot until your current request is completed.'}
                </p>
              </div>
            </motion.div>
          )}
          <Card className="rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 border-0 bg-white">
            <CardHeader className="border-b bg-park-secondary rounded-t-2xl">
              <CardTitle className="flex items-center gap-2 text-park-primary">
                <MapPin className="w-5 h-5" /> Available Slots
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
                <div className="flex flex-col items-center justify-center py-8 space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-park-primary"></div>
                  <p className="text-gray-500">Loading available slots...</p>
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {search ? 'No slots found matching your search.' : 'No available slots at the moment.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Slot Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slots.map((slot) => (
                        <TableRow key={slot.id}>
                          <TableCell>{slot.slotNumber}</TableCell>
                          <TableCell className="capitalize">{slot.status}</TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      size="sm"
                                      onClick={() => handleRequestSlot(slot.id)}
                                      disabled={!!activeTicket || !!activeRequest}
                                      className={activeTicket || activeRequest ? 'opacity-50 cursor-not-allowed' : ''}
                                    >
                                      Request
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {activeTicket 
                                    ? 'You have an active ticket. Complete it first to request a new slot.'
                                    : activeRequest?.status === 'pending'
                                    ? 'You have a pending request. Wait for it to be processed.'
                                    : activeRequest?.status === 'approved'
                                    ? 'You have an approved request. Complete it first to request a new slot.'
                                    : 'Click to request this slot'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {/* Pagination */}
              {total > 0 && (
                <div className="flex justify-between items-center mt-4">
                  <Button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="bg-park-primary hover:bg-park-primary/90"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="bg-park-primary hover:bg-park-primary/90"
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Request Slot Dialog */}
          <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Request Parking Slot</DialogTitle>
                <DialogDescription>
                  Please specify when you plan to use the parking slot.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="entryTime" className="text-right">
                    Entry Time
                  </Label>
                  <Input
                    id="entryTime"
                    type="datetime-local"
                    className="col-span-3"
                    value={requestEntryTime}
                    onChange={(e) => setRequestEntryTime(e.target.value)}
                    min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="exitTime" className="text-right">
                    Exit Time
                  </Label>
                  <Input
                    id="exitTime"
                    type="datetime-local"
                    className="col-span-3"
                    value={requestExitTime}
                    onChange={(e) => setRequestExitTime(e.target.value)}
                    min={requestEntryTime || format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  />
                </div>
                {estimatedAmount && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right text-park-primary">
                      Estimated Cost
                    </Label>
                    <div className="col-span-3">
                      <p className="text-sm font-medium text-park-primary">
                        {estimatedAmount.duration} minutes ({Math.ceil(estimatedAmount.duration / 60)} hours)
                      </p>
                      <p className="text-lg font-bold text-park-primary">
                        {estimatedAmount.amount.toLocaleString()} RWF
                      </p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="reason" className="text-right">
                    Reason
                  </Label>
                  <Input
                    id="reason"
                    placeholder="Optional reason for request"
                    className="col-span-3"
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsRequestDialogOpen(false);
                  setRequestEntryTime('');
                  setRequestExitTime('');
                  setRequestReason('');
                  setEstimatedAmount(null);
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitRequest}
                  disabled={!requestEntryTime || !requestExitTime || !estimatedAmount}
                >
                  Submit Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
      </main>
    </div>
  );
};

export default UserAvailableSlots; 