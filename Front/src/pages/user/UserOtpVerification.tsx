import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../../services/api';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Car } from 'lucide-react';

const UserOtpVerification: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    // Get email from location state
    const state = location.state as { email?: string };
    if (!state?.email) {
      navigate('/signup');
      return;
    }
    setEmail(state.email);
  }, [location, navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[name=otp-${index + 1}]`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    try {
      setLoading(true);
      const response = await authAPI.userVerifyOTP({ email, code: otpString });
      if (response.message) {
        toast.success('Email verified successfully');
        navigate('/user/pending-approval', { 
          state: { 
            email,
            message: 'Your account is pending approval. You will be notified once approved.'
          }
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setLoading(true);
      await authAPI.userResendOTP(email);
      toast.success('OTP resent successfully');
      setCountdown(60);
      setCanResend(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-park-primary text-white rounded-r-[3rem] p-12">
        <Car className="h-16 w-16 mb-6" />
        <h1 className="text-5xl font-bold mb-2 tracking-wide">ParkEase</h1>
        <span className="text-lg tracking-widest mb-12">OTP</span>
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
                disabled={loading || !canResend}
              >
                Resend
              </button>
              {countdown > 0 && (
                <span className="ml-2 text-xs">({countdown}s)</span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserOtpVerification; 