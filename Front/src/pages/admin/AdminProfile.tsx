import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { User, Lock, ArrowLeft, ParkingSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authAPI } from '../../services/api';
import { AdminNavbarLayout } from '@/components/admin/AdminNavbar';
import { theme } from '../../styles/theme';
import { adminAPI } from '../../services/api';

const AdminProfile: React.FC = () => {
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

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await adminAPI.updateProfile(profileData);
            if (res && (res.status === 'success' || res.message)) {
                toast.success(res.message || 'Profile updated successfully');
                localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user') || '{}'), ...profileData }));
            } else {
                toast.error(res.message || 'Failed to update profile');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            const res = await adminAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            if (res && (res.status === 'success' || res.message)) {
                toast.success(res.message || 'Password changed successfully');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                toast.error(res.message || 'Failed to change password');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminNavbarLayout>
            <main className="flex-1 p-6 md:p-12" style={{ background: theme.colors.secondary, minHeight: '100vh' }}>
                <div className="w-full max-w-lg mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="flex items-center gap-2 px-4 py-2 border border-park-primary text-park-primary rounded-lg font-medium hover:bg-park-primary hover:text-white transition-colors"
                        >
                            Back to Dashboard
                        </button>
                        {/* Logo removed for minimal design */}
                    </div>
                    <div className="space-y-8">
                        {/* Profile Update */}
                        <Card className="bg-white">
                            <CardHeader>
                                <CardTitle>Admin Profile</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleProfileSubmit} className="space-y-4">
                                    <div>
                                        <label className="block mb-1 font-medium">Name</label>
                                        <Input
                                            name="name"
                                            value={profileData.name}
                                            onChange={handleProfileChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1 font-medium">Email</label>
                                        <Input
                                            name="email"
                                            type="email"
                                            value={profileData.email}
                                            onChange={handleProfileChange}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" disabled={loading} style={{ background: theme.colors.primary, color: theme.colors.text.light }}>
                                        {loading ? 'Saving...' : 'Update Profile'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                        {/* Password Change */}
                        <Card className="bg-white">
                            <CardHeader>
                                <CardTitle>Change Password</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                    <div>
                                        <label className="block mb-1 font-medium">Current Password</label>
                                        <Input
                                            name="currentPassword"
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1 font-medium">New Password</label>
                                        <Input
                                            name="newPassword"
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1 font-medium">Confirm New Password</label>
                                        <Input
                                            name="confirmPassword"
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" disabled={loading} style={{ background: theme.colors.primary, color: theme.colors.text.light }}>
                                        {loading ? 'Saving...' : 'Change Password'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </AdminNavbarLayout>
    );
};

export default AdminProfile; 