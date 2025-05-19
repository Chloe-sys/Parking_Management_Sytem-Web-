import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { authAPI } from '@/services/api';

interface LocationState {
    email: string;
    role: 'user' | 'admin';
}

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'user' | 'admin'>('user');

    useEffect(() => {
        const state = location.state as LocationState;
        if (!state?.email || !state?.role) {
            toast.error('Invalid reset password request');
            navigate('/forgot-password');
            return;
        }
        setEmail(state.email);
        setRole(state.role);
    }, [location, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        setIsLoading(true);

        try {
            const response = await authAPI.resetPassword({
                email,
                code,
                newPassword,
                role
            });

            if (response.success) {
                toast.success('Password reset successful');
                navigate(role === 'admin' ? '/admin/signin' : '/signin');
            } else {
                toast.error(response.message || 'Error resetting password');
            }
        } catch (error: any) {
            console.error('Reset password error:', error);
            toast.error(error.response?.data?.message || 'Error resetting password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackClick = () => {
        navigate('/forgot-password', { state: { role } });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
                    <CardDescription className="text-center">
                        Enter the code sent to your email and your new password
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Reset Code</Label>
                            <Input
                                id="code"
                                type="text"
                                placeholder="Enter reset code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full"
                            onClick={handleBackClick}
                        >
                            Back to Forgot Password
                        </Button>
                        <Button
                            type="button"
                            variant="link"
                            className="w-full"
                            onClick={() => navigate(role === 'admin' ? '/admin/signin' : '/signin')}
                        >
                            Back to Sign In
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default ResetPassword; 