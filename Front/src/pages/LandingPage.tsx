import React from 'react';
import { Link } from 'react-router-dom';
import { ParkingSquare } from 'lucide-react';

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col bg-park-secondary">
            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <div className="flex flex-col items-center gap-6">
                    <ParkingSquare className="h-20 w-20 text-park-primary mb-4" />
                    <h1 className="text-5xl font-extrabold text-park-primary mb-2">ParkEase</h1>
                    <p className="text-lg text-park-accent mb-8 max-w-xl">
                        Effortless parking management for users and admins. Book, manage, and monitor parking slots with ease.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs mx-auto">
                        <Link to="/signin" className="flex-1 py-3 rounded-xl bg-park-primary text-white text-lg font-bold hover:bg-park-accent transition-colors text-center">
                            User Login
                        </Link>
                        <Link to="/admin/signin" className="flex-1 py-3 rounded-xl border-2 border-park-primary text-park-primary text-lg font-bold hover:bg-park-primary hover:text-white transition-colors text-center">
                            Admin Login
                        </Link>
                    </div>
                </div>
            </main>
            {/* Footer */}
            <footer className="bg-park-primary text-white py-6 text-center">
                <div className="flex flex-col items-center">
                    <ParkingSquare className="h-8 w-8 mb-2 text-white" />
                    <span className="font-bold text-lg">ParkEase</span>
                    <span className="text-xs mt-1">&copy; {new Date().getFullYear()} ParkEase. All rights reserved.</span>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage; 