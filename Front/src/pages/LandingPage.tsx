import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, Users, Shield, ArrowRight, Clock, MapPin, CheckCircle2 } from 'lucide-react';

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-park-secondary">
            {/* Navigation */}
            <nav className="bg-white/95 backdrop-blur-md fixed w-full z-50 border-b border-park-secondary/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20">
                        <div className="flex items-center">
                            <Car className="h-10 w-10 text-park-primary" />
                            <span className="ml-3 text-2xl font-bold text-park-primary">
                                ParkEase
                            </span>
                        </div>
                        <div className="flex items-center space-x-6">
                            <Link
                                to="/signin"
                                className="text-park-primary hover:text-park-accent px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                User Login
                            </Link>
                            <Link
                                to="/admin/signin"
                                className="bg-park-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-park-accent transition-all shadow-sm hover:shadow-md"
                            >
                                Admin Login
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="pt-32 pb-20 sm:pt-40 sm:pb-28 bg-gradient-to-b from-park-secondary to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <motion.div
                            className="inline-block"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-park-primary/10 text-park-primary">
                                <Clock className="h-4 w-4 mr-2" />
                                Smart Parking Solutions
                            </span>
                        </motion.div>
                        <motion.h1
                            className="mt-8 text-5xl tracking-tight font-extrabold text-park-primary sm:text-6xl md:text-7xl"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <span className="block">Transform Your</span>
                            <span className="block mt-2">Parking Experience</span>
                        </motion.h1>
                        <motion.p
                            className="mt-8 max-w-2xl mx-auto text-xl text-park-accent"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            Streamline your parking operations with our advanced management system.
                            Book slots, manage users, and monitor occupancy in real-time.
                        </motion.p>
                        <motion.div
                            className="mt-12 flex flex-col sm:flex-row justify-center gap-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <Link
                                to="/register"
                                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-park-primary hover:bg-park-accent transition-all shadow-lg hover:shadow-xl"
                            >
                                Get Started
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                            <Link
                                to="/user/signin"
                                className="inline-flex items-center justify-center px-8 py-4 border-2 border-park-primary text-base font-medium rounded-xl text-park-primary bg-transparent hover:bg-park-primary/5 transition-all"
                            >
                                Learn More
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <motion.h2
                            className="text-base text-park-primary font-semibold tracking-wide uppercase"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            Why Choose ParkEase?
                        </motion.h2>
                        <motion.p
                            className="mt-4 text-3xl font-bold text-park-primary sm:text-4xl"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            Everything you need to manage parking
                        </motion.p>
                    </div>

                    <div className="mt-20">
                        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
                            <motion.div
                                className="relative p-8 bg-park-secondary rounded-2xl hover:shadow-xl transition-all duration-300 border border-park-secondary/20"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                <div className="absolute -top-6 left-8">
                                    <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-park-primary text-white shadow-lg">
                                        <Car className="h-7 w-7" />
                                    </div>
                                </div>
                                <div className="pt-8">
                                    <h3 className="text-xl font-bold text-park-primary">Easy Booking</h3>
                                    <p className="mt-4 text-base text-park-accent">
                                        Book parking slots in advance and manage your reservations easily with our intuitive interface.
                                    </p>
                                    <ul className="mt-6 space-y-3">
                                        <li className="flex items-center text-park-primary">
                                            <CheckCircle2 className="h-5 w-5 mr-2 text-park-primary" />
                                            Real-time availability
                                        </li>
                                        <li className="flex items-center text-park-primary">
                                            <CheckCircle2 className="h-5 w-5 mr-2 text-park-primary" />
                                            Instant confirmation
                                        </li>
                                    </ul>
                                </div>
                            </motion.div>

                            <motion.div
                                className="relative p-8 bg-park-secondary rounded-2xl hover:shadow-xl transition-all duration-300 border border-park-secondary/20"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                            >
                                <div className="absolute -top-6 left-8">
                                    <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-park-primary text-white shadow-lg">
                                        <Users className="h-7 w-7" />
                                    </div>
                                </div>
                                <div className="pt-8">
                                    <h3 className="text-xl font-bold text-park-primary">User Management</h3>
                                    <p className="mt-4 text-base text-park-accent">
                                        Comprehensive user management system with role-based access control and activity tracking.
                                    </p>
                                    <ul className="mt-6 space-y-3">
                                        <li className="flex items-center text-park-primary">
                                            <CheckCircle2 className="h-5 w-5 mr-2 text-park-primary" />
                                            Role-based access
                                        </li>
                                        <li className="flex items-center text-park-primary">
                                            <CheckCircle2 className="h-5 w-5 mr-2 text-park-primary" />
                                            Activity monitoring
                                        </li>
                                    </ul>
                                </div>
                            </motion.div>

                            <motion.div
                                className="relative p-8 bg-park-secondary rounded-2xl hover:shadow-xl transition-all duration-300 border border-park-secondary/20"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                            >
                                <div className="absolute -top-6 left-8">
                                    <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-park-primary text-white shadow-lg">
                                        <Shield className="h-7 w-7" />
                                    </div>
                                </div>
                                <div className="pt-8">
                                    <h3 className="text-xl font-bold text-park-primary">Secure System</h3>
                                    <p className="mt-4 text-base text-park-accent">
                                        Enterprise-grade security with real-time monitoring and automated threat detection.
                                    </p>
                                    <ul className="mt-6 space-y-3">
                                        <li className="flex items-center text-park-primary">
                                            <CheckCircle2 className="h-5 w-5 mr-2 text-park-primary" />
                                            End-to-end encryption
                                        </li>
                                        <li className="flex items-center text-park-primary">
                                            <CheckCircle2 className="h-5 w-5 mr-2 text-park-primary" />
                                            Secure authentication
                                        </li>
                                    </ul>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-park-primary text-white">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center">
                        <div className="flex items-center mb-6">
                            <Car className="h-8 w-8 text-white" />
                            <span className="ml-3 text-xl font-bold">ParkEase</span>
                        </div>
                        <motion.p
                            className="text-center text-park-secondary"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.8 }}
                        >
                            &copy; {new Date().getFullYear()} ParkEase. All rights reserved.
                        </motion.p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage; 