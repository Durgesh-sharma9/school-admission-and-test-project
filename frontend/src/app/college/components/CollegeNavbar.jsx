import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../school/contexts/AuthContext';
import { Menu, User, Settings, LogOut, ChevronDown, CheckSquare, ClipboardCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../school/services/schoolApi';

const CollegeNavbar = ({ toggleSidebar, title }) => {
  const { school, logout } = useAuth();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const profileRef = useRef(null);

  const fetchPendingTasksCount = async () => {
    try {
      const res = await api.get('/college/applications');
      if (res.success && res.data) {
        let count = 0;
        const now = new Date();
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        res.data.forEach(item => {
          (item.journey || []).forEach(stage => {
            if (stage.followUpDate) {
              const isCompleted = !!stage.completedAt || stage.status === 'Completed';
              const isCancelled = stage.status === 'Cancelled';
              if (!isCompleted && !isCancelled) {
                const fDate = new Date(stage.followUpDate);
                if (fDate <= endOfToday) {
                  count++;
                }
              }
            }
          });
        });
        setPendingTasksCount(count);
      }
    } catch (err) {
      console.error('Failed to load college pending tasks count:', err);
    }
  };

  useEffect(() => {
    if (school) {
      fetchPendingTasksCount();
      const interval = setInterval(() => {
        fetchPendingTasksCount();
      }, 30000);

      window.addEventListener('crm-tasks-updated', fetchPendingTasksCount);

      return () => {
        clearInterval(interval);
        window.removeEventListener('crm-tasks-updated', fetchPendingTasksCount);
      };
    }
  }, [school]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/login');
    }
  };

  // Wait, let's fix the fetchPendingPendingTasksCount typo below in the original code, let's write fetchPendingTasksCount:
  const fetchPendingPendingTasksCount = fetchPendingTasksCount;

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30 shadow-[0_3px_12px_rgba(236,72,153,0.08),0_1px_4px_rgba(15,23,42,0.04)] animate-[slide-down_0.3s_ease_both] transition-all duration-300">
      {/* Left section */}
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 lg:hidden focus:outline-none"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold text-slate-800 tracking-tight">{title}</h1>
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-4">
        {/* Tasks Badge */}
        <Link
          to="/college/tasks"
          className="relative p-2 rounded-lg text-gray-400 hover:bg-purple-50 hover:text-purple-600 transition-colors shrink-0 group flex items-center"
        >
          <ClipboardCheck className="h-5 w-5" />
          {pendingTasksCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white px-1 leading-none">
              {pendingTasksCount}
            </span>
          )}

          {/* Hover Tooltip */}
          <div className="absolute right-0 top-10 hidden group-hover:flex flex-col items-center bg-slate-950 text-white text-[10px] rounded-lg py-1.5 px-2.5 shadow-lg border border-slate-800 z-50 pointer-events-none w-36 whitespace-normal leading-tight text-center font-bold">
            <div>Today's Tasks</div>
            <div className="text-rose-400 text-[9px] font-extrabold mt-0.5">
              {pendingTasksCount} Pending Tasks
            </div>
          </div>
        </Link>

        {/* User profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center space-x-2.5 p-1.5 hover:bg-slate-50 rounded-xl transition-all focus:outline-none"
          >
            {school?.logo ? (
              <img
                src={school.logo}
                alt="Profile"
                className="h-8 w-8 rounded-lg object-cover bg-white p-0.5 border border-slate-100"
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                {school?.name?.charAt(0).toUpperCase() || 'C'}
              </div>
            )}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {school?.name || 'College Admin'}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                {school?.email}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 text-left z-50">
              <Link
                to="/college/settings"
                onClick={() => setProfileDropdownOpen(false)}
                className="flex items-center px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings className="h-4 w-4 mr-2.5 text-slate-400" />
                Settings
              </Link>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none"
              >
                <LogOut className="h-4 w-4 mr-2.5 text-rose-500" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default CollegeNavbar;
