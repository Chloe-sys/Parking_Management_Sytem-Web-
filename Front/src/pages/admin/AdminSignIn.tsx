import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ParkingSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { authAPI } from '../../services/api';

const AdminSignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    // Get state from location if coming from OTP verification
    const state = location.state as { email?: string; message?: string };
    if (state?.email) {
      setEmail(state.email);
    }
    if (state?.message) {
      toast.success(state.message);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authAPI.adminLogin({ email, password });
      console.log('Login response:', response);
      
      if (response.success && response.data?.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.admin) {
          localStorage.setItem('user', JSON.stringify(response.data.admin));
          localStorage.setItem('role', 'admin');
        }
        toast.success('Login successful!');
        navigate('/admin/dashboard');
      } else {
        toast.error('Login failed: Invalid response format');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed';
      toast.error(errorMessage);
      if (errorMessage.includes('verify your email')) {
        navigate('/admin/verify-email', { state: { email } });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-park-primary text-white rounded-r-[3rem] p-12">
        <ParkingSquare className="h-16 w-16 mb-6 text-white" />
        <h1 className="text-5xl font-bold mb-2 tracking-wide">ParkEase</h1>
        <span className="text-lg tracking-widest mb-12">ADMIN</span>
        <div className="mt-auto mb-8 w-full flex flex-col items-center">
          <p className="mb-4 text-lg">Don't have an account? Sign Up now.</p>
          <button
            onClick={() => navigate('/admin/signup')}
            className="w-56 py-3 border-2 border-white rounded-xl text-lg font-semibold hover:bg-white hover:text-park-primary transition-colors"
          >
            SIGN UP
          </button>
        </div>
      </div>
      {/* Right form panel */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="flex flex-col justify-center items-center w-full md:w-1/2 bg-park-secondary rounded-l-[3rem] p-8"
      >
        <div className="w-full max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="flex items-center justify-center mb-8">
            <h2 className="text-4xl font-bold text-park-primary mr-4">Admin Sign In</h2>
            <ParkingSquare className="h-10 w-10 text-park-primary" />
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="text-center text-park-primary mb-8">Please enter your credentials to log in</motion.p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl border-2 border-park-primary bg-transparent px-4 py-3 text-park-primary placeholder:text-park-primary/60 focus:border-park-primary focus:ring-park-primary"
            />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-xl border-2 border-park-primary bg-transparent px-4 py-3 text-park-primary placeholder:text-park-primary/60 focus:border-park-primary focus:ring-park-primary"
            />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="mr-2"
                />
                <label htmlFor="remember" className="text-sm text-park-primary">Remember me</label>
              </div>
              <button
                onClick={() => navigate('/admin/signup')}
                className="text-sm text-park-primary hover:underline"
              >
                Don't have an account? Register
              </button>
            </div>
            <Button
              type="submit"
              className="w-full py-3 rounded-xl bg-park-primary text-white text-lg font-bold hover:bg-park-accent transition-colors"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'SIGN IN'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminSignIn;

