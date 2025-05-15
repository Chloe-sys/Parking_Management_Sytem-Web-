import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car } from 'lucide-react';
import { authAPI } from '../../services/api';
import { toast } from 'sonner';
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

const AdminOtpVerification: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(600); // 10 minutes in seconds
    const [email, setEmail] = useState('');

    useEffect(() => {
        // Get email from location state
        const state = location.state as { email?: string };
        if (!state?.email) {
            navigate('/admin/signup');
            return;
        }
        setEmail(state.email);

        // Start countdown timer
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [location.state, navigate]);

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) return; // Prevent multiple characters
        if (!/^[0-9]*$/.test(value)) return; // Only allow numbers

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.querySelector(`input[name=otp-${index + 1}]`) as HTMLInputElement;
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.querySelector(`input[name=otp-${index - 1}]`) as HTMLInputElement;
            if (prevInput) prevInput.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.adminVerifyOTP({
                email,
                otp: otpString
            });

            if (response.success) {
                toast.success('Email verified successfully');
                // Redirect to sign-in page with the verified email
                navigate('/admin/signin', { 
                    state: { 
                        email,
                        message: 'Email verified successfully. Please sign in.' 
                    },
                    replace: true
                });
            } else {
                toast.error(response.message || 'Failed to verify email');
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to verify email';
            toast.error(errorMessage);
            if (errorMessage.includes('expired')) {
                setCountdown(0); // Enable resend button if OTP expired
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (countdown > 0) {
            toast.error(`Please wait ${Math.ceil(countdown / 60)} minutes before requesting a new OTP`);
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.adminResendOTP(email);
            if (response.status === 'success') {
                toast.success('New OTP sent successfully');
                setCountdown(600); // Reset countdown to 10 minutes
                setOtp(['', '', '', '', '', '']); // Clear OTP inputs
            } else {
                toast.error(response.message || 'Failed to resend OTP');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen flex">
            {/* Left branding panel */}
            <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-park-primary text-gray-800 rounded-r-[3rem] p-12">
                <Car className="h-16 w-16 mb-6" />
                <h1 className="text-5xl font-bold mb-2 tracking-wide">ParkEase</h1>
                <span className="text-lg tracking-widest mb-12">ADMIN OTP</span>
                <div className="mt-auto mb-8 w-full flex flex-col items-center">
                    <p className="mb-4 text-lg text-center">"Your premier digital parking experience"</p>
                </div>
            </div>
            {/* Right OTP form panel */}
            <div className="flex flex-col justify-center items-center w-full md:w-1/2 bg-park-secondary rounded-l-[3rem] p-8">
                <div className="w-full max-w-lg">
                    <div className="flex items-center justify-between mb-8">
                        <button
                            onClick={() => navigate(-1)}
                            className="px-4 py-2 border border-park-primary text-park-primary rounded-lg font-medium hover:bg-park-primary hover:text-white transition-colors"
                        >
                            BACK
                        </button>
                        <Car className="h-10 w-10 text-park-primary" />
                    </div>
                    <h2 className="text-3xl font-bold text-park-primary mb-2 text-center">Check your Mailbox</h2>
                    <p className="text-center text-park-primary mb-8">Please enter the OTP to proceed</p>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div className="flex justify-center gap-3 mb-4">
                            {otp.map((digit, index) => (
                                <Input
                                    key={index}
                                    name={`otp-${index}`}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-14 h-14 text-center text-2xl border-2 border-park-primary rounded-xl bg-transparent text-park-primary focus:border-park-primary focus:ring-park-primary"
                                    required
                                />
                            ))}
                        </div>
                        <Button type="submit" className="w-full py-3 rounded-xl bg-park-primary text-white text-lg font-bold hover:bg-park-accent transition-colors" disabled={loading}>
                            {loading ? 'Verifying...' : 'VERIFY'}
                        </Button>
                        <div className="text-center text-sm text-park-primary">
                            Didn't receive the code?{' '}
                            <button
                                type="button"
                                className="text-park-primary hover:underline font-semibold"
                                onClick={handleResendOTP}
                                disabled={loading || countdown > 0}
                            >
                                Resend
                            </button>
                            {countdown > 0 && (
                                <span className="ml-2 text-xs">({formatTime(countdown)})</span>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminOtpVerification; 