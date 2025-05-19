import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './lib/auth-context';

// Pages
import LandingPage from './pages/LandingPage';
import UserSignIn from './pages/user/UserSignIn';
import UserSignUp from './pages/user/UserSignUp';
import UserDashboard from './pages/user/UserDashboard';
import UserOtpVerification from './pages/user/UserOtpVerification';
import UserProfile from './pages/user/UserProfile';
import PendingApproval from './pages/user/PendingApproval';
import AdminSignIn from './pages/admin/AdminSignIn';
import AdminSignUp from './pages/admin/AdminSignUp';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOtpVerification from './pages/admin/AdminOtpVerification';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminSlotManagement from './pages/admin/AdminSlotManagement';
import AdminProfile from './pages/admin/AdminProfile';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import AdminSlotRequests from './pages/admin/AdminSlotRequests';
import UserAvailableSlots from './pages/user/UserAvailableSlots';
import UserSlotRequests from './pages/user/UserSlotRequests';

// Protected Route Component
const ProtectedRoute = ({ role }: { role: 'user' | 'admin' }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token || userRole !== role) {
    return <Navigate to={role === 'admin' ? '/admin/signin' : '/signin'} />;
  }

  return <Outlet />;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          
          {/* User Auth Routes */}
          <Route path="/signin" element={<UserSignIn />} />
          <Route path="/signup" element={<UserSignUp />} />
          <Route path="/verify-email" element={<UserOtpVerification />} />
          <Route path="/user/pending-approval" element={<PendingApproval />} />
          
          {/* Admin Auth Routes */}
          <Route path="/admin/signin" element={<AdminSignIn />} />
          <Route path="/admin/signup" element={<AdminSignUp />} />
          <Route path="/admin/verify-email" element={<AdminOtpVerification />} />
          
          {/* Protected User Routes */}
          <Route element={<ProtectedRoute role="user" />}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/profile" element={<UserProfile />} />
            <Route path="/user/available-slots" element={<UserAvailableSlots />} />
            <Route path="/user/slot-requests" element={<UserSlotRequests />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUserManagement />} />
            <Route path="/admin/parking-slots" element={<AdminSlotManagement />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
            <Route path="/admin/slot-requests" element={<AdminSlotRequests />} />
          </Route>

          {/* Error Routes */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;