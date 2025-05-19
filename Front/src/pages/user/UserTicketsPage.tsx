import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ParkingSquare, LayoutDashboard, User, LogOut, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserTickets from './UserTickets';

const UserTicketsPage: React.FC = () => {
    const navigate = useNavigate();

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
                        className="flex items-center gap-3 py-2 px-4 rounded-lg bg-park-secondary/20 transition-colors" 
                        onClick={() => navigate('/user/tickets')}
                    >
                        <Ticket className="w-5 h-5" /> Tickets
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
                            <Ticket className="w-7 h-7" /> My Tickets
                        </motion.h1>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/user/dashboard')}
                            className="flex items-center gap-2 border-park-primary text-park-primary hover:bg-park-primary hover:text-white transition-all"
                        >
                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Button>
                    </div>

                    <UserTickets />
                </motion.div>
            </main>
        </div>
    );
};

export default UserTicketsPage; 