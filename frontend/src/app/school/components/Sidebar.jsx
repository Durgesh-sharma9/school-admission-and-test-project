import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  FileText,
  QrCode,
  Sparkles,
  Settings,
  LogOut,
  X,
  GraduationCap,
  FileQuestion,
  CreditCard
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { school, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Enquiries', path: '/enquiries', icon: ClipboardList },
    { name: "Today's Tasks", path: '/tasks', icon: CheckSquare },
    { name: 'Assessments', path: '/assessments', icon: FileQuestion },
    { name: 'Admission Form', path: '/admission-form', icon: FileText },
    { name: 'QR Code / Links', path: '/qr-code', icon: QrCode },
    { name: 'Enquiry Banner', path: '/thankyou-cms', icon: Sparkles },
    { name: 'Subscription', path: '/subscription', icon: CreditCard },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center px-4 py-2.5 text-xs font-semibold rounded-[8px] select-none transition-all cursor-pointer ${
      isActive
        ? 'bg-[#E91E63] hover:bg-[#D81B60] active:bg-[#C2185B] text-white shadow-[0_6px_16px_rgba(233,30,99,0.25)]'
        : 'text-[#D1D5DB] hover:bg-white/6 hover:text-white'
    }`;

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden animate-fade-in"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-45 flex flex-col w-64 text-slate-100 border-r border-[#262A36] transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'linear-gradient(180deg, #1B1E28 0%, #151720 100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800/60">
          <div className="flex items-center space-x-3">
            {school?.logo ? (
              <img
                src={school.logo}
                alt="School Logo"
                className="h-9 w-9 rounded-lg object-cover bg-white p-0.5"
              />
            ) : (
              <div className="flex items-center justify-center h-9 w-9 bg-white/10 rounded-lg text-white border border-white/10">
                <GraduationCap className="h-5 w-5" />
              </div>
            )}
            <div className="flex flex-col truncate max-w-[150px] text-left">
              <span className="font-bold text-sm tracking-wide text-white truncate">
                {school?.name || 'School CRM'}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                School Admin
              </span>
            </div>
          </div>

          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white lg:hidden cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Free Trial Banner */}
        {school?.subscription?.plan === 'free-trial' && (
          <div className="mx-4 mt-4 p-3 bg-white/5 rounded-lg border border-white/10 text-xs text-left">
            <span className="font-semibold text-slate-350 block mb-0.5">Free Trial Mode</span>
            <span className="text-slate-400">
              Ends {new Date(school.subscription.trialEnd).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-0.5 overflow-y-auto">
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
                style={{ transitionDuration: '250ms' }}
              >
                {({ isActive }) => (
                  <>
                    <Icon 
                      className="h-4 w-4 mr-2.5 shrink-0" 
                      style={{ color: isActive ? '#FFFFFF' : '#BFC5D2', transitionDuration: '250ms' }} 
                    />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-slate-800/60">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2.5 text-xs font-semibold text-[#D1D5DB] rounded-[8px] hover:bg-white/6 hover:text-white transition-all cursor-pointer"
            style={{ transitionDuration: '250ms' }}
          >
            <LogOut className="h-4 w-4 mr-2.5 shrink-0" style={{ color: '#BFC5D2' }} />
            <span>Logout Account</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
