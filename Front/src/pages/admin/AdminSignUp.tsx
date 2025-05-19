import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { authAPI } from '../../services/api';
import { ParkingSquare } from 'lucide-react';

const AdminSignUp = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await authAPI.adminRegister(formData);
            toast.success('Registration successful! Please verify your email.');
            navigate('/admin/verify-email', { state: { email: formData.email } });
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
                <span className="text-lg tracking-widest mb-12">ADMIN</span>
                <div className="mt-auto mb-8 w-full flex flex-col items-center">
                    <p className="mb-4 text-lg">Already have Account? Sign In now.</p>
                    <button
                        onClick={() => navigate('/admin/signin')}
                        className="w-56 py-3 border-2 border-white rounded-xl text-lg font-semibold hover:bg-white hover:text-park-primary transition-colors"
                    >
                        SIGN IN
                    </button>
                </div>
            </div>
            {/* Right form panel */}
            <div className="flex flex-col justify-center items-center w-full md:w-1/2 bg-park-secondary rounded-l-[3rem] p-8">
                <div className="w-full max-w-lg">
                    <div className="flex items-center justify-center mb-8">
                        <h2 className="text-4xl font-bold text-park-primary mr-4">Admin Sign Up</h2>
                        <ParkingSquare className="h-10 w-10 text-park-primary" />
                    </div>
                    <p className="text-center text-park-primary mb-8">Please provide your information to sign up as an admin.</p>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Full Name"
                                className="rounded-xl border-2 border-park-primary bg-transparent px-4 py-3 text-park-primary placeholder:text-park-primary/60 focus:border-park-primary focus:ring-park-primary w-full mb-2"
                            />
                        </div>
                        <div className="col-span-2">
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="Email"
                                className="rounded-xl border-2 border-park-primary bg-transparent px-4 py-3 text-park-primary placeholder:text-park-primary/60 focus:border-park-primary focus:ring-park-primary w-full mb-2"
                            />
                        </div>
                        <div className="col-span-1">
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Password"
                                className="rounded-xl border-2 border-park-primary bg-transparent px-4 py-3 text-park-primary placeholder:text-park-primary/60 focus:border-park-primary focus:ring-park-primary w-full mb-2"
                            />
                        </div>
                        <div className="col-span-1">
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                placeholder="Confirm Password"
                                className="rounded-xl border-2 border-park-primary bg-transparent px-4 py-3 text-park-primary placeholder:text-park-primary/60 focus:border-park-primary focus:ring-park-primary w-full mb-2"
                            />
                        </div>
                        <div className="col-span-2 mt-4">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-xl bg-park-primary text-white text-lg font-bold hover:bg-park-accent transition-colors"
                            >
                                {loading ? 'Registering...' : 'SIGN UP'}
                            </motion.button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminSignUp;
