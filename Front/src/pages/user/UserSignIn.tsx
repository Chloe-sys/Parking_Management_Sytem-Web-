import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../../services/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Car } from 'lucide-react';

const UserSignIn: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      toast.error('Please enter your email');
      return false;
    }
    if (!formData.email.includes('@')) {
      toast.error('Please enter a valid email');
      return false;
    }
    if (!formData.password) {
      toast.error('Please enter your password');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    try {
      setLoading(true);
      const response = await authAPI.userLogin({
        email: formData.email,
        password: formData.password
      });
      console.log('Login response:', response);
      
      if (response.success && response.data?.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
          localStorage.setItem('role', 'user');
        }
        toast.success('Login successful!');
        navigate('/user/dashboard');
      } else {
        toast.error('Login failed: Invalid response format');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed';
      if (errorMessage.includes('verify your email')) {
        navigate('/verify-email', { 
          state: { 
            email: formData.email,
            message: 'Please verify your email first'
          }
        });
      } else if (errorMessage.includes('pending approval')) {
        navigate('/user/pending-approval', { 
          state: { 
            email: formData.email,
            message: 'Your account is pending approval'
          }
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="hidden md:flex flex-col justify-center items-center w-1/2 bg-park-primary text-white rounded-r-[3rem] p-12"
      >
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
          <Car className="h-16 w-16 mb-6" />
        </motion.div>
        <motion.h1 initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }} className="text-5xl font-bold mb-2 tracking-wide">ParkEase</motion.h1>
        <span className="text-lg tracking-widest mb-12">USER</span>
        <div className="mt-auto mb-8 w-full flex flex-col items-center">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }} className="mb-4 text-lg">New to our platform? Sign Up now.</motion.p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/signup')}
            className="w-56 py-3 border-2 border-white rounded-xl text-lg font-semibold hover:bg-white hover:text-park-primary transition-colors"
          >
            SIGN UP
          </motion.button>
        </div>
      </motion.div>
      {/* Right form panel */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="flex flex-col justify-center items-center w-full md:w-1/2 bg-park-secondary rounded-l-[3rem] p-8"
      >
        <div className="w-full max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="flex items-center justify-center mb-8">
            <h2 className="text-4xl font-bold text-park-primary mr-4">Welcome Back !!</h2>
            <Car className="h-10 w-10 text-park-primary" />
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="text-center text-park-primary mb-8">Please enter your credentials to log in</motion.p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-park-primary mb-1">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-park-primary mb-1">
                Password
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 text-park-primary border-gray-300 rounded focus:ring-park-primary"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-600">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="text-sm font-medium text-park-primary hover:text-park-accent"
              >
                Don't have an account? Sign up
              </button>
            </div>
            <Button
              type="submit"
              className="w-full bg-park-primary hover:bg-park-accent"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default UserSignIn;
