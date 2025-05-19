import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Ticket, Clock, Calendar, Car, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
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

const AdminTickets: React.FC = () => {
    const [activeTickets, setActiveTickets] = useState<TicketData[]>([]);
    const [allTickets, setAllTickets] = useState<TicketsResponse>({
        tickets: [],
        total: 0,
        page: 1,
        limit: 10
    });
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const ticketsPerPage = 10;

    const fetchActiveTickets = async () => {
        try {
            const response = await ticketService.getActiveTickets();
            setActiveTickets(response);
        } catch (error) {
            console.error('Error fetching active tickets:', error);
            toast.error('Failed to fetch active tickets');
        }
    };

    const fetchAllTickets = async (page: number, status?: string) => {
        try {
            const response = await ticketService.getAllTickets(page, ticketsPerPage, status);
            setAllTickets(response);
        } catch (error) {
            console.error('Error fetching all tickets:', error);
            toast.error('Failed to fetch tickets');
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([
                fetchActiveTickets(),
                fetchAllTickets(currentPage, statusFilter)
            ]);
            setLoading(false);
        };
        loadData();
    }, [currentPage, statusFilter]);

    const handleActivateTicket = async (ticketId: number) => {
        try {
            await ticketService.activateTicket(ticketId);
            toast.success('Ticket activated successfully');
            fetchActiveTickets();
            fetchAllTickets(currentPage, statusFilter);
        } catch (error) {
            console.error('Error activating ticket:', error);
            toast.error('Failed to activate ticket');
        }
    };

    const handleCompleteTicket = async (ticketId: number) => {
        try {
            await ticketService.completeTicket(ticketId);
            toast.success('Ticket completed successfully');
            fetchActiveTickets();
            fetchAllTickets(currentPage, statusFilter);
        } catch (error) {
            console.error('Error completing ticket:', error);
            toast.error('Failed to complete ticket');
        }
    };

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
            {/* Active Tickets Section */}
            <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Ticket className="w-5 h-5" />
                    Active Tickets
                </h2>
                {activeTickets && activeTickets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeTickets.map((ticket) => (
                            <motion.div
                                key={ticket.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-lg shadow-md p-6"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-medium">Slot {ticket.slotNumber}</h3>
                                        <p className="text-sm text-gray-600">{ticket.userName}</p>
                                        <p className="text-sm text-gray-600">Plate: {ticket.plateNumber}</p>
                                        <span className={`inline-block px-2 py-1 rounded-full text-sm mt-2 ${TICKET_STATUS_COLORS[ticket.status]}`}>
                                            {TICKET_STATUS_LABELS[ticket.status]}
                                        </span>
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
                                <div className="mt-4 flex gap-2">
                                    {ticket.status === 'pending' && (
                                        <button
                                            onClick={() => handleActivateTicket(ticket.id)}
                                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Activate
                                        </button>
                                    )}
                                    {ticket.status === 'active' && (
                                        <button
                                            onClick={() => handleCompleteTicket(ticket.id)}
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Complete
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center text-gray-500">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        No active tickets found
                    </div>
                )}
            </section>

            {/* All Tickets Section */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">All Tickets</h2>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-park-primary"
                    >
                        <option value="">All Status</option>
                        {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
                {allTickets.tickets && allTickets.tickets.length > 0 ? (
                    <div className="space-y-4">
                        {allTickets.tickets.map((ticket) => (
                            <motion.div
                                key={ticket.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-lg shadow-md p-6"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-medium">Slot {ticket.slotNumber}</h3>
                                        <p className="text-sm text-gray-600">{ticket.userName}</p>
                                        <p className="text-sm text-gray-600">Plate: {ticket.plateNumber}</p>
                                        <span className={`inline-block px-2 py-1 rounded-full text-sm mt-2 ${TICKET_STATUS_COLORS[ticket.status]}`}>
                                            {TICKET_STATUS_LABELS[ticket.status]}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {formatDateTime(ticket.requestedEntryTime)}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    </div>
                                    <div className="space-y-2">
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
                                </div>
                                {ticket.status === 'pending' && (
                                    <div className="mt-4">
                                        <button
                                            onClick={() => handleActivateTicket(ticket.id)}
                                            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Activate Ticket
                                        </button>
                                    </div>
                                )}
                                {ticket.status === 'active' && (
                                    <div className="mt-4">
                                        <button
                                            onClick={() => handleCompleteTicket(ticket.id)}
                                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Complete Ticket
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                        {/* Pagination */}
                        {allTickets.total > 0 && (
                            <div className="flex justify-center gap-2 mt-6">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-md bg-park-primary text-white disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="px-4 py-2">
                                    Page {currentPage} of {Math.ceil(allTickets.total / ticketsPerPage)}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(allTickets.total / ticketsPerPage), p + 1))}
                                    disabled={currentPage === Math.ceil(allTickets.total / ticketsPerPage)}
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
                        No tickets found
                    </div>
                )}
            </section>
        </div>
    );
};

export default AdminTickets; 