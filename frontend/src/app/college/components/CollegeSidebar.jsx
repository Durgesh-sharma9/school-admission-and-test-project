import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../school/contexts/AuthContext';
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
  CreditCard,
  Layers,
  BookOpen,
  Users,
  Compass,
  FileCheck,
  DollarSign
} from 'lucide-react';

const CollegeSidebar = ({ isOpen, toggleSidebar }) => {
  const { school, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/college/dashboard', icon: LayoutDashboard },
    { name: 'Applications', path: '/college/applications', icon: ClipboardList },
    { name: "Today's Tasks", path: '/college/tasks', icon: CheckSquare },
    { name: 'Admission Form', path: '/college/admission-form', icon: FileText },
    { name: 'Academic Configuration', path: '/college/academic-config', icon: Layers },
    // { name: 'Counselling', path: '/college/counselling', icon: Compass },
    // { name: 'Documents', path: '/college/documents', icon: FileCheck },
    { name: 'QR Code / Links', path: '/college/qr-links', icon: QrCode },
    { name: 'Enquiry Banner', path: '/college/thank-you-cms', icon: Sparkles },
    { name: 'Subscription', path: '/college/subscription', icon: CreditCard },
    { name: 'Settings', path: '/college/settings', icon: Settings },
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center px-4 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 group ${
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
        className={`fixed top-0 bottom-0 left-0 z-45 flex flex-col w-64 bg-slate-955 text-slate-100 border-r border-slate-900 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: '#090d16' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-900">
          <div className="flex items-center space-x-3">
            {school?.logo ? (
              <img
                src={school.logo}
                alt="Logo"
                className="h-9 w-9 rounded-lg object-cover bg-white p-0.5"
              />
            ) : (
              <div className="flex items-center justify-center h-9 w-9 bg-indigo-600/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                <GraduationCap className="h-5 w-5" />
              </div>
            )}
            <div className="flex flex-col truncate max-w-[150px] text-left">
              <span className="font-bold text-sm tracking-wide text-white truncate">
                {school?.name || 'College CRM'}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                College Admin
              </span>
            </div>
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
          <div className="mx-4 mt-4 p-3 bg-indigo-950/40 rounded-lg border border-indigo-900/30 text-xs text-left">
            <span className="font-semibold text-indigo-400 block mb-0.5">Free Trial Mode</span>
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
                key={item.name}
                to={item.path}
                onClick={toggleSidebar}
                className={navLinkClass}
              >
                <Icon className="h-4 w-4 mr-2.5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-slate-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2.5 text-xs font-semibold text-slate-400 rounded-lg hover:bg-rose-950/30 hover:text-rose-400 transition-colors duration-200"
          >
            <LogOut className="h-4 w-4 mr-2.5" />
            <span>Logout Account</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default CollegeSidebar;
