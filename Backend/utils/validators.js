const validateRequest = ({ requestedEntryTime, requestedExitTime, reason }) => {
    if (!requestedEntryTime || !requestedExitTime) {
        return 'Entry and exit times are required';
    }

    const entryTime = new Date(requestedEntryTime);
    const exitTime = new Date(requestedExitTime);
    const now = new Date();

    // Validate entry time is in the future
    if (entryTime <= now) {
        return 'Entry time must be in the future';
    }

    // Validate exit time is after entry time
    if (exitTime <= entryTime) {
        return 'Exit time must be after entry time';
    }

    // Validate duration is not too long (e.g., max 24 hours)
    const durationHours = (exitTime - entryTime) / (1000 * 60 * 60);
    if (durationHours > 24) {
        return 'Parking duration cannot exceed 24 hours';
    }

    // Validate reason if provided
    if (reason && (typeof reason !== 'string' || reason.length > 500)) {
        return 'Reason must be a string with maximum length of 500 characters';
    }

    return null;
};

const validateTicket = ({ ticketId }) => {
    if (!ticketId || typeof ticketId !== 'number') {
        return 'Valid ticket ID is required';
    }
    return null;
};

const validateUser = ({ name, email, password, plateNumber }) => {
    if (!name || typeof name !== 'string' || name.length < 2) {
        return 'Name must be at least 2 characters long';
    }

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return 'Valid email address is required';
    }

    if (!password || password.length < 6) {
        return 'Password must be at least 6 characters long';
    }

    if (!plateNumber || !plateNumber.match(/^[A-Z0-9]{3,10}$/)) {
        return 'Valid plate number is required (3-10 alphanumeric characters)';
    }

    return null;
};

const validateAdmin = ({ name, email, password }) => {
    if (!name || typeof name !== 'string' || name.length < 2) {
        return 'Name must be at least 2 characters long';
    }

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return 'Valid email address is required';
    }

    if (!password || password.length < 6) {
        return 'Password must be at least 6 characters long';
    }

    return null;
};

module.exports = {
    validateRequest,
    validateTicket,
    validateUser,
    validateAdmin
}; 