import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Car } from 'lucide-react';

const PendingApproval: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { email?: string; message?: string };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-park-primary text-white rounded-r-[3rem] p-12">
        <Car className="h-16 w-16 mb-6" />
        <h1 className="text-5xl font-bold mb-2 tracking-wide">ParkEase</h1>
        <span className="text-lg tracking-widest mb-12">Pending Approval</span>
        <div className="mt-auto mb-8 w-full flex flex-col items-center">
          <p className="mb-4 text-lg text-center">"Your premier digital parking experience"</p>
        </div>
      </div>

      {/* Right content panel */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 bg-park-secondary rounded-l-[3rem] p-8">
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-between mb-8">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="px-4 py-2 border border-park-primary text-park-primary rounded-lg font-medium hover:bg-park-primary hover:text-white transition-colors"
            >
              Back to Home
            </Button>
            <Car className="h-10 w-10 text-park-primary" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-park-primary mb-4">Account Pending Approval</h2>
            <p className="text-park-primary mb-8">
              {state?.message || 'Your account is currently pending approval. You will be notified via email once your account is approved.'}
            </p>
            <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
              <p className="text-gray-600 mb-4">
                While waiting for approval, you can:
              </p>
              <ul className="text-left text-gray-600 space-y-2">
                <li>• Return to the home page to learn more about our services</li>
                <li>• Check your email for approval status updates</li>
                <li>• Contact support if you have any questions</li>
              </ul>
            </div>
            <Button
              onClick={() => navigate('/')}
              className="w-full py-3 rounded-xl bg-park-primary text-white text-lg font-bold hover:bg-park-accent transition-colors"
            >
              Return to Home Page
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval; 