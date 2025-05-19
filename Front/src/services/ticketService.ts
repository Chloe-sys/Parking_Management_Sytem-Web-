import api from './api';

const ticketService = {
    // User endpoints
    getUserActiveTicket: async () => {
        const response = await api.get('/tickets/my/active');
        return response.data;
    },

    getUserTickets: async (page = 1, limit = 10) => {
        const response = await api.get('/tickets/my/history', {
            params: { page, limit }
        });
        return response.data;
    },

    requestTicket: async (data: {
        slotId: number;
        requestedEntryTime?: string;
        requestedExitTime?: string;
    }) => {
        // If entry and exit times are not provided, get them from the user's profile
        if (!data.requestedEntryTime || !data.requestedExitTime) {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.preferredEntryTime && user.preferredExitTime) {
                    data.requestedEntryTime = user.preferredEntryTime;
                    data.requestedExitTime = user.preferredExitTime;
                }
            }
        }

        // Validate that we have entry and exit times
        if (!data.requestedEntryTime || !data.requestedExitTime) {
            throw new Error('Entry and exit times are required');
        }

        const response = await api.post('/tickets/request', data);
        return response.data;
    },

    calculateEstimatedAmount: async (requestedEntryTime: string, requestedExitTime: string) => {
        const response = await api.post('/tickets/calculate', {
            requestedEntryTime,
            requestedExitTime
        });
        return response.data;
    },

    // Admin endpoints
    getActiveTickets: async () => {
        const response = await api.get('/tickets/admin/active');
        return response.data;
    },

    getAllTickets: async (page = 1, limit = 10, status?: string) => {
        const response = await api.get('/tickets/admin/all', {
            params: { page, limit, status }
        });
        return response.data;
    },

    activateTicket: async (ticketId: number) => {
        const response = await api.post('/tickets/admin/activate', {
            ticketId
        });
        return response.data;
    },

    completeTicket: async (ticketId: number) => {
        const response = await api.post('/tickets/admin/complete', {
            ticketId
        });
        return response.data;
    },

    // User ticket export
    exportUserTickets: async () => {
        try {
            const response = await api.get('/tickets/my/export', {
                responseType: 'blob'
            });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Export user tickets error:', error);
            throw error;
        }
    },

    // Admin ticket export
    exportAllTickets: async (filters?: { status?: string; startDate?: string; endDate?: string }) => {
        try {
            const response = await api.get('/admin/tickets/export', {
                params: filters,
                responseType: 'blob'
            });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Export all tickets error:', error);
            throw error;
        }
    }
};

export default ticketService; 