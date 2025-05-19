import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bell, LogOut, LayoutDashboard, Users, ParkingSquare } from 'lucide-react';
import { theme } from '../../styles/theme';

const AdminNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside
      style={{ background: theme.colors.primary, color: theme.colors.text.light, minHeight: '100vh' }}
      className="hidden md:flex flex-col w-64 py-8 px-6 rounded-r-3xl shadow-lg"
    >
      <div className="flex flex-col items-center mb-12">
        <span className="text-3xl font-extrabold tracking-wide" style={{ letterSpacing: 2 }}>ParkEase Admin</span>
      </div>
      <nav className="flex-1 flex flex-col gap-4">
        <button
          className={`flex items-center gap-3 py-2 px-4 rounded-lg transition-colors ${isActive('/admin/dashboard') ? 'bg-white/10 font-bold' : 'hover:bg-white/10'}`}
          onClick={() => navigate('/admin/dashboard')}
          style={{ color: theme.colors.text.light }}
        >
          <LayoutDashboard className="w-5 h-5" /> Dashboard
        </button>
        <button
          className={`flex items-center gap-3 py-2 px-4 rounded-lg transition-colors ${isActive('/admin/users') ? 'bg-white/10 font-bold' : 'hover:bg-white/10'}`}
          onClick={() => navigate('/admin/users')}
          style={{ color: theme.colors.text.light }}
        >
          <Users className="w-5 h-5" /> Users
        </button>
        <button
          className={`flex items-center gap-3 py-2 px-4 rounded-lg transition-colors ${isActive('/admin/parking-slots') ? 'bg-white/10 font-bold' : 'hover:bg-white/10'}`}
          onClick={() => navigate('/admin/parking-slots')}
          style={{ color: theme.colors.text.light }}
        >
          <ParkingSquare className="w-5 h-5" /> Parking Slots
        </button>
        <button
          className={`flex items-center gap-3 py-2 px-4 rounded-lg transition-colors ${isActive('/admin/slot-requests') ? 'bg-white/10 font-bold' : 'hover:bg-white/10'}`}
          onClick={() => navigate('/admin/slot-requests')}
          style={{ color: theme.colors.text.light }}
        >
          <Bell className="w-5 h-5" /> Slot Requests
        </button>
        <button
          className="flex items-center gap-3 py-2 px-4 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => {
            localStorage.clear();
            navigate('/');
          }}
          style={{ color: theme.colors.text.light }}
        >
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </nav>
      <div className="mt-auto flex flex-col items-center">
        <span className="text-xs text-white/70">&copy; {new Date().getFullYear()} ParkEase</span>
      </div>
    </aside>
  );
};

const AdminNavbarLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      <AdminNavbar />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export { AdminNavbar, AdminNavbarLayout }; 