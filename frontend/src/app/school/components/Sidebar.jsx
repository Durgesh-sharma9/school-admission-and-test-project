import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  QrCode,
  Sparkles,
  Settings,
  User,
  LogOut,
  X,
  GraduationCap,
  FileQuestion
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { school, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Enquiries', path: '/enquiries', icon: ClipboardList },
    { name: 'Assessments', path: '/assessments', icon: FileQuestion },
    { name: 'Admission Form', path: '/admission-form', icon: FileText },
    { name: 'QR Code / Links', path: '/qr-code', icon: QrCode },
    { name: 'Thank You CMS', path: '/thankyou-cms', icon: Sparkles },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
      isActive
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
    }`;

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-45 flex flex-col w-64 bg-slate-950 text-slate-100 border-r border-slate-900 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-900">
          <div className="flex items-center space-x-3">
            {school?.logo ? (
              <img
                src={school.logo}
                alt="School Logo"
                className="h-9 w-9 rounded-lg object-cover bg-white p-0.5"
              />
            ) : (
              <div className="flex items-center justify-center h-9 w-9 bg-indigo-600/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                <GraduationCap className="h-5 w-5" />
              </div>
            )}
            <span className="font-semibold text-base tracking-wide text-white truncate max-w-[150px]">
              {school?.name || 'School CRM'}
            </span>
          </div>

          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Free Trial Banner */}
        {school?.subscription?.plan === 'free-trial' && (
          <div className="mx-4 mt-4 p-3 bg-indigo-950/40 rounded-lg border border-indigo-900/30 text-xs">
            <span className="font-semibold text-indigo-400 block mb-0.5">Free Trial Mode</span>
            <span className="text-slate-400">
              Ends {new Date(school.subscription.trialEnd).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={navLinkClass}
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-slate-900">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-semibold text-indigo-400">
              {school?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="truncate flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{school?.email}</p>
              <p className="text-[10px] text-slate-500 font-medium">School Admin</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
