import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import api from '../services/api';
import {
  Menu,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Bell,
  FileText,
  UserCheck,
  ClipboardCheck
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Navbar = ({ toggleSidebar, title }) => {
  const { school, logout } = useAuth();
  const navigate = useNavigate();

  // Dropdown states
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileRef = useRef(null);
  const bellRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.success) {
        setNotifications(res.data || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (school) {
      fetchNotifications();
      // Poll every 30s for real-time notifications
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [school]);

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/login');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.put('/notifications/read-all');
      if (res.success) {
        toast.success('All notifications marked as read');
        fetchNotifications();
      }
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await api.put(`/notifications/${notif._id}/read`);
      }
      setBellOpen(false);
      fetchNotifications();

      // Route navigation based on categories
      if (['new_enquiry', 'status_changed', 'admission_confirmed'].includes(notif.type)) {
        navigate('/enquiries');
      } else if (['assessment_assigned', 'assessment_completed'].includes(notif.type)) {
        navigate('/enquiries');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white border-b border-slate-100 shadow-xs">
      {/* Mobile Toggle & Title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 lg:hidden"
        >
          <Menu className="h-5.5 w-5.5" />
        </button>
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h1>
      </div>

      {/* Right Navbar elements */}
      <div className="flex items-center space-x-4">
        {/* Trial Badge */}
        {school?.subscription?.plan === 'free-trial' && (
          <div className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 animate-pulse">
            Active Free Trial
          </div>
        )}

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => {
              setBellOpen(!bellOpen);
              if (!bellOpen) fetchNotifications();
            }}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-600 rounded-full border-2 border-white" />
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2.5 z-50 text-left">
              <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-indigo-600 hover:underline font-bold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-55/40 transition-colors text-left ${
                        !notif.isRead ? 'bg-slate-50/50' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {notif.type === 'new_enquiry' && (
                          <div className="h-7 w-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                            <FileText className="h-4 w-4" />
                          </div>
                        )}
                        {notif.type === 'admission_confirmed' && (
                          <div className="h-7 w-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <UserCheck className="h-4 w-4" />
                          </div>
                        )}
                        {notif.type === 'status_changed' && (
                          <div className="h-7 w-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        )}
                        {notif.type === 'assessment_assigned' && (
                          <div className="h-7 w-7 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center">
                            <Bell className="h-4 w-4" />
                          </div>
                        )}
                        {notif.type === 'assessment_completed' && (
                          <div className="h-7 w-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                            <ClipboardCheck className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs ${!notif.isRead ? 'font-black text-slate-800' : 'text-slate-700 font-semibold'}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-405 leading-normal line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[8px] text-slate-400 italic">
                          {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600">
              {school?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <span className="hidden md:block text-sm font-semibold text-slate-700">
              {school?.name}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
              <div className="px-4 py-2 border-b border-slate-50">
                <p className="text-xs text-slate-400">Signed in as</p>
                <p className="text-sm font-semibold text-slate-800 truncate">{school?.name}</p>
              </div>

              <Link
                to="/settings"
                onClick={() => setProfileDropdownOpen(false)}
                className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings className="mr-2.5 h-4.5 w-4.5 text-slate-400" />
                Settings
              </Link>

              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left"
              >
                <LogOut className="mr-2.5 h-4.5 w-4.5 text-rose-500" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
