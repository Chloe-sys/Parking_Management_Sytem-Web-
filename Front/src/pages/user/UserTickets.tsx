import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Ticket, Clock, Calendar, Car, AlertCircle, Download } from 'lucide-react';
import ticketService from '@/services/ticketService';
import { TICKET_STATUS, TICKET_STATUS_LABELS, TICKET_STATUS_COLORS } from '@/config/constants';
import { toast } from 'sonner';

interface TicketData {
    id: number;
    userId: number;
    userName: string;
    plateNumber: string;
    slotNumber: string;
    requestedEntryTime: string;
    requestedExitTime: string;
    actualEntryTime: string | null;
    actualExitTime: string | null;
    duration: number | null;
    amount: number | null;
    status: typeof TICKET_STATUS[keyof typeof TICKET_STATUS];
}

interface TicketsResponse {
    tickets: TicketData[];
    total: number;
    page: number;
    limit: number;
}

const UserTickets: React.FC = () => {
    const [activeTicket, setActiveTicket] = useState<TicketData | null>(null);
    const [ticketHistory, setTicketHistory] = useState<TicketsResponse>({
        tickets: [],
        total: 0,
        page: 1,
        limit: 10
    });
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const ticketsPerPage = 10;

    const fetchActiveTicket = async () => {
        try {
            const response = await ticketService.getUserActiveTicket();
            if (response.success && response.data?.ticket) {
                setActiveTicket(response.data.ticket);
            } else {
                setActiveTicket(null);
            }
        } catch (error: any) {
            console.error('Error fetching active ticket:', error);
            if (error.response?.status === 401) {
                toast.error('Please log in again');
            } else {
                toast.error('Failed to fetch active ticket');
            }
            setActiveTicket(null);
        }
    };

    const fetchTicketHistory = async (page: number) => {
        try {
            const response = await ticketService.getUserTickets(page, ticketsPerPage);
            if (response.success && response.data) {
                setTicketHistory({
                    tickets: response.data.tickets,
                    total: response.data.total,
                    page: response.data.page,
                    limit: response.data.limit
                });
            } else {
                setTicketHistory(prev => ({ ...prev, tickets: [] }));
            }
        } catch (error: any) {
            console.error('Error fetching ticket history:', error);
            if (error.response?.status === 401) {
                toast.error('Please log in again');
            } else {
                toast.error('Failed to fetch ticket history');
            }
            setTicketHistory(prev => ({ ...prev, tickets: [] }));
        }
    };

    const exportTicketHistory = async () => {
        try {
            const response = await ticketService.exportUserTickets();
            if (response.success && response.data) {
                // Create a blob from the CSV data
                const blob = new Blob([response.data], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ticket-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success('Ticket history exported successfully');
            } else {
                toast.error('Failed to export ticket history');
            }
        } catch (error: any) {
            console.error('Error exporting ticket history:', error);
            toast.error('Failed to export ticket history');
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchActiveTicket(),
                    fetchTicketHistory(currentPage)
                ]);
            } catch (error) {
                console.error('Error loading ticket data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [currentPage]);

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    };

    const formatDuration = (minutes: number | null) => {
        if (!minutes) return 'N/A';
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    };

    const formatAmount = (amount: number | null) => {
        if (!amount) return 'N/A';
        return `${amount.toLocaleString()} RWF`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-park-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Active Ticket Section */}
            <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Ticket className="w-5 h-5" />
                    Active Ticket
                </h2>
                {activeTicket ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg shadow-md p-6"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-medium">Slot {activeTicket.slotNumber}</h3>
                                <p className="text-sm text-gray-600">Plate: {activeTicket.plateNumber}</p>
                                <span className={`inline-block px-2 py-1 rounded-full text-sm mt-2 ${TICKET_STATUS_COLORS[activeTicket.status]}`}>
                                    {TICKET_STATUS_LABELS[activeTicket.status]}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>Requested Entry: {formatDateTime(activeTicket.requestedEntryTime)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>Requested Exit: {formatDateTime(activeTicket.requestedExitTime)}</span>
                            </div>
                            {activeTicket.actualEntryTime && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Car className="w-4 h-4" />
                                    <span>Actual Entry: {formatDateTime(activeTicket.actualEntryTime)}</span>
                                </div>
                            )}
                            {activeTicket.actualExitTime && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Car className="w-4 h-4" />
                                    <span>Actual Exit: {formatDateTime(activeTicket.actualExitTime)}</span>
                                </div>
                            )}
                            {activeTicket.duration && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <span>Duration: {formatDuration(activeTicket.duration)}</span>
                                </div>
                            )}
                            {activeTicket.amount && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Ticket className="w-4 h-4" />
                                    <span>Amount: {formatAmount(activeTicket.amount)}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center text-gray-500">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        No active ticket found
                    </div>
                )}
            </section>

            {/* Ticket History Section */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Ticket History</h2>
                    <button
                        onClick={exportTicketHistory}
                        className="flex items-center gap-2 px-4 py-2 bg-park-primary text-white rounded-md hover:bg-park-primary/90 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export History
                    </button>
                </div>
                {ticketHistory.tickets.length > 0 ? (
                    <div className="space-y-4">
                        {ticketHistory.tickets.map((ticket) => (
                            <motion.div
                                key={ticket.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-lg shadow-md p-6"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-medium">Slot {ticket.slotNumber}</h3>
                                        <p className="text-sm text-gray-600">Plate: {ticket.plateNumber}</p>
                                        <span className={`inline-block px-2 py-1 rounded-full text-sm mt-2 ${TICKET_STATUS_COLORS[ticket.status]}`}>
                                            {TICKET_STATUS_LABELS[ticket.status]}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {formatDateTime(ticket.requestedEntryTime)}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Calendar className="w-4 h-4" />
                                        <span>Requested Entry: {formatDateTime(ticket.requestedEntryTime)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Calendar className="w-4 h-4" />
                                        <span>Requested Exit: {formatDateTime(ticket.requestedExitTime)}</span>
                                    </div>
                                    {ticket.actualEntryTime && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Car className="w-4 h-4" />
                                            <span>Actual Entry: {formatDateTime(ticket.actualEntryTime)}</span>
                                        </div>
                                    )}
                                    {ticket.actualExitTime && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Car className="w-4 h-4" />
                                            <span>Actual Exit: {formatDateTime(ticket.actualExitTime)}</span>
                                        </div>
                                    )}
                                    {ticket.duration && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Clock className="w-4 h-4" />
                                            <span>Duration: {formatDuration(ticket.duration)}</span>
                                        </div>
                                    )}
                                    {ticket.amount && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Ticket className="w-4 h-4" />
                                            <span>Amount: {formatAmount(ticket.amount)}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        {/* Pagination */}
                        {ticketHistory.total > 0 && (
                            <div className="flex justify-center gap-2 mt-6">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-md bg-park-primary text-white disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="px-4 py-2">
                                    Page {currentPage} of {Math.ceil(ticketHistory.total / ticketsPerPage)}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(ticketHistory.total / ticketsPerPage), p + 1))}
                                    disabled={currentPage === Math.ceil(ticketHistory.total / ticketsPerPage)}
                                    className="px-4 py-2 rounded-md bg-park-primary text-white disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center text-gray-500">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        No ticket history found
                    </div>
                )}
            </section>
        </div>
    );
};

export default UserTickets; 