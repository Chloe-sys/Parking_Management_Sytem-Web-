export const API_URL = 'http://localhost:8082/api';

export const TICKET_STATUS = {
    PENDING: 'pending',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
} as const;

export const TICKET_STATUS_LABELS = {
    [TICKET_STATUS.PENDING]: 'Pending',
    [TICKET_STATUS.ACTIVE]: 'Active',
    [TICKET_STATUS.COMPLETED]: 'Completed',
    [TICKET_STATUS.CANCELLED]: 'Cancelled'
} as const;

export const TICKET_STATUS_COLORS = {
    [TICKET_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
    [TICKET_STATUS.ACTIVE]: 'bg-green-100 text-green-800',
    [TICKET_STATUS.COMPLETED]: 'bg-blue-100 text-blue-800',
    [TICKET_STATUS.CANCELLED]: 'bg-red-100 text-red-800'
} as const;

export const HOURLY_RATE = 1000; // RWF per hour
export const MAX_PARKING_DURATION = 24; // hours 