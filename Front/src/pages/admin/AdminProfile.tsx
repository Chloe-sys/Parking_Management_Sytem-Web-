import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Car, User, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authAPI } from '../../services/api';

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

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
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
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
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
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left branding panel */}
            <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-park-primary text-gray-800 rounded-r-[3rem] p-12">
                <Car className="h-16 w-16 mb-6" />
                <h1 className="text-5xl font-bold mb-2 tracking-wide">ParkEase</h1>
                <span className="text-lg tracking-widest mb-12">ADMIN PROFILE</span>
                <div className="mt-auto mb-8 w-full flex flex-col items-center">
                    <p className="mb-4 text-lg text-center">"Your premier digital parking experience"</p>
                </div>
            </div>
            {/* Right profile panel */}
            <div className="flex flex-col w-full md:w-1/2 bg-park-secondary rounded-l-[3rem] p-8">
                <div className="w-full max-w-lg mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="flex items-center gap-2 px-4 py-2 border border-park-primary text-park-primary rounded-lg font-medium hover:bg-park-primary hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </button>
                        <Car className="h-10 w-10 text-park-primary" />
                    </div>

                    <div className="space-y-8">
                        {/* Profile Settings */}
                        <Card className="border-2 border-park-primary">
                            <CardHeader className="bg-park-primary/10">
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
                        <Card className="border-2 border-park-primary">
                            <CardHeader className="bg-park-primary/10">
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
                                        {loading ? 'Changing...' : 'Change Password'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile; 