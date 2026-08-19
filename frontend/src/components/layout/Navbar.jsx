import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, LogOut, User as UserIcon } from 'lucide-react';
import api from '../../services/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications?unread_only=true');
        setNotifications(res.data);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };
    if (user) {
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 10000); // Poll every 10s
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-extrabold text-green-600 tracking-tight">ApartmentHub</span>
        <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded font-semibold hidden md:inline-block">Smart Living</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Drawer Toggle */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full relative transition-colors"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4.5 h-4.5 flex items-center justify-center rounded-full font-bold">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-lg shadow-lg z-50 py-2 max-h-96 overflow-y-auto">
              <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center">
                <span className="font-semibold text-sm text-gray-700">Notifications</span>
                {notifications.length > 0 && (
                  <button onClick={markAllRead} className="text-xs text-green-600 hover:underline font-semibold">Mark read</button>
                )}
              </div>
              <div className="divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-gray-400">No unread notifications</div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-gray-800">{notif.title}</span>
                      <span className="text-xs text-gray-500">{notif.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 border-l border-gray-100 pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-700">{user?.first_name} {user?.last_name}</p>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{user?.roles?.[0]?.name || 'RESIDENT'}</p>
          </div>
          
          <button 
            onClick={logout} 
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Log Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
