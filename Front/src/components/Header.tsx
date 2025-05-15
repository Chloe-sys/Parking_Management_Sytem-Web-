
import React from 'react';
import { Settings } from 'lucide-react';

interface HeaderProps {
  username: string;
  userType: 'Admin' | 'User';
  onSettingsClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ username, userType, onSettingsClick }) => {
  // Get current date in the format "Sep 02, 2023"
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });

  // Get current time in 12-hour format "12:29 PM"
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <header className="flex items-center justify-between p-4 bg-white border-b">
      <div className="flex items-center space-x-2">
        <div className="flex flex-col items-start">
          <div className="flex items-center">
            <div className="h-4 w-4 bg-gray-400 rounded-full mr-2"></div>
            <span className="font-medium">{username}</span>
          </div>
          <span className="text-sm text-gray-500">{userType}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="font-medium">{currentTime}</div>
          <div className="text-sm text-gray-500">{currentDate}</div>
        </div>
        <button 
          onClick={onSettingsClick}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <Settings size={24} />
        </button>
      </div>
    </header>
  );
};

export default Header;
