import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ParkingSquare, User, Lock, LayoutDashboard, LogOut, Bell, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authAPI } from '../../services/api';

const UserProfile: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState({
        name: '',
        email: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setProfileData({
            name: user.name || '',
            email: user.email || ''
        });
    }, []);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profileData.name || !profileData.email) {
            toast.error('Name and email are required');
            return;
        }
        setLoading(true);
        try {
            const response = await authAPI.updateProfile({
                name: profileData.name,
                email: profileData.email
            });
            if (response.data.status === 'success') {
                toast.success('Profile updated successfully');
                // Update local storage
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                user.name = profileData.name;
                user.email = profileData.email;
                localStorage.setItem('user', JSON.stringify(user));
            } else {
                toast.error(response.data.message || 'Failed to update profile');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword.length < 8) {
            toast.error('New password must be at least 8 characters long');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        setLoading(true);
        try {
            const response = await authAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            if (response.data.status === 'success') {
                toast.success('Password changed successfully');
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                toast.error(response.data.message || 'Failed to change password');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

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
                            <User className="w-7 h-7" /> My Profile
                        </motion.h1>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/user/dashboard')}
                            className="flex items-center gap-2 border-park-primary text-park-primary hover:bg-park-primary hover:text-white transition-all"
                        >
                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Profile Settings */}
                        <Card className="rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 border-0 bg-white">
                            <CardHeader className="border-b bg-park-secondary rounded-t-2xl">
                                <CardTitle className="flex items-center gap-2 text-park-primary">
                                    <User className="w-5 h-5" />
                                    Profile Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handleProfileUpdate} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-park-primary mb-1">
                                            Name
                                        </label>
                                        <Input
                                            type="text"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                            className="w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-park-primary mb-1">
                                            Email
                                        </label>
                                        <Input
                                            type="email"
                                            value={profileData.email}
                                            disabled
                                            className="w-full bg-gray-100"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full bg-park-primary hover:bg-park-accent"
                                        disabled={loading}
                                    >
                                        {loading ? 'Updating...' : 'Update Profile'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                        {/* Change Password */}
                        <Card className="rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 border-0 bg-white">
                            <CardHeader className="border-b bg-park-secondary rounded-t-2xl">
                                <CardTitle className="flex items-center gap-2 text-park-primary">
                                    <Lock className="w-5 h-5" />
                                    Change Password
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-park-primary mb-1">
                                            Current Password
                                        </label>
                                        <Input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-park-primary mb-1">
                                            New Password
                                        </label>
                                        <Input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-park-primary mb-1">
                                            Confirm New Password
                                        </label>
                                        <Input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="w-full"
                                            required
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full bg-park-primary hover:bg-park-accent"
                                        disabled={loading}
                                    >
                                        {loading ? 'Updating...' : 'Change Password'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default UserProfile; 