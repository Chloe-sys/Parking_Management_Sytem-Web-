import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, ParkingSquare } from 'lucide-react';

const AdminNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-4">
            <Button
              variant={isActive('/admin/dashboard') ? 'default' : 'ghost'}
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center space-x-2"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Button>
            <Button
              variant={isActive('/admin/users') ? 'default' : 'ghost'}
              onClick={() => navigate('/admin/users')}
              className="flex items-center space-x-2"
            >
              <Users className="h-5 w-5" />
              <span>Users</span>
            </Button>
            <Button
              variant={isActive('/admin/parking-slots') ? 'default' : 'ghost'}
              onClick={() => navigate('/admin/parking-slots')}
              className="flex items-center space-x-2"
            >
              <ParkingSquare className="h-5 w-5" />
              <span>Slots</span>
            </Button>
          </div>
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('role');
                navigate('/admin/signin');
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar; 