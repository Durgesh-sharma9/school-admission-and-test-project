import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../school/contexts/AuthContext';
import { Menu, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const CollegeNavbar = ({ toggleSidebar, title }) => {
  const { school, logout } = useAuth();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef(null);

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

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-30">
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
