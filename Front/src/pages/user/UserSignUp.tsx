import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../../services/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ParkingSquare } from 'lucide-react';

const UserSignUp: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    plateNumber: '',
    preferredEntryTime: '',
    preferredExitTime: ''
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
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Please enter a valid email');
      return false;
    }
    if (!formData.password || formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return false;
    }
    if (!formData.plateNumber.trim()) {
      toast.error('Please enter your plate number');
      return false;
    }
    if (!formData.preferredEntryTime) {
      toast.error('Please select your preferred entry time');
      return false;
    }
    if (!formData.preferredExitTime) {
      toast.error('Please select your preferred exit time');
      return false;
    }
    if (new Date(formData.preferredExitTime) <= new Date(formData.preferredEntryTime)) {
      toast.error('Exit time must be after entry time');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setLoading(true);

    try {
      const response = await authAPI.userRegister(formData);
      toast.success('Registration successful! Please verify your email.');
      navigate('/verify-email', { 
        state: { 
          email: formData.email,
          message: 'Please check your email for the verification code.'
        }
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
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
        <span className="text-lg tracking-widest mb-12">USER</span>
        <div className="mt-auto mb-8 w-full flex flex-col items-center">
          <p className="mb-4 text-lg">Already have Account? Sign In now.</p>
          <button
            onClick={() => navigate('/signin')}
            className="w-56 py-3 border-2 border-white rounded-xl text-lg font-semibold hover:bg-white hover:text-park-primary transition-colors"
          >
            SIGN IN
          </button>
        </div>
      </div>
      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-center mb-8">
            <h2 className="text-4xl font-bold text-park-primary mr-4">User Sign Up</h2>
            <ParkingSquare className="h-10 w-10 text-park-primary" />
          </div>
          <p className="text-center text-park-primary mb-8">Please provide your information to sign up.</p>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
                className="rounded-xl border-2 border-park-primary bg-transparent px-4 py-3 text-park-primary placeholder:text-park-primary/60 focus:border-park-primary focus:ring-park-primary"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                className="rounded-xl border-2 border-park-primary bg-transparent px-4 py-3 text-park-primary placeholder:text-park-primary/60 focus:border-park-primary focus:ring-park-primary"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                className="rounded-xl border-2 border-park-primary bg-transparent px-4 py-3 text-park-primary placeholder:text-park-primary/60 focus:border-park-primary focus:ring-park-primary"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="plateNumber">License Plate Number</Label>
              <Input
                id="plateNumber"
                name="plateNumber"
                type="text"
                placeholder="Enter your license plate number"
                value={formData.plateNumber}
                onChange={handleChange}
                required
                className="rounded-xl border-2 border-park-primary bg-transparent px-4 py-3 text-park-primary placeholder:text-park-primary/60 focus:border-park-primary focus:ring-park-primary"
              />
            </div>
            <div className="col-span-1">
              <Label htmlFor="preferredEntryTime">Preferred Entry Time</Label>
              <Input
                id="preferredEntryTime"
                name="preferredEntryTime"
                type="datetime-local"
                value={formData.preferredEntryTime}
                onChange={handleChange}
                required
                className="rounded-xl border-2 border-park-primary bg-transparent px-4 py-3 text-park-primary placeholder:text-park-primary/60 focus:border-park-primary focus:ring-park-primary"
              />
            </div>
            <div className="col-span-1">
              <Label htmlFor="preferredExitTime">Preferred Exit Time</Label>
              <Input
                id="preferredExitTime"
                name="preferredExitTime"
                type="datetime-local"
                value={formData.preferredExitTime}
                onChange={handleChange}
                required
                className="rounded-xl border-2 border-park-primary bg-transparent px-4 py-3 text-park-primary placeholder:text-park-primary/60 focus:border-park-primary focus:ring-park-primary"
              />
            </div>
            <div className="col-span-2 mt-4">
              <Button
                type="submit"
                className="w-full py-3 rounded-xl bg-park-primary text-white text-lg font-bold hover:bg-park-accent transition-colors"
                disabled={loading}
              >
                {loading ? 'Signing Up...' : 'SIGN UP'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserSignUp;
