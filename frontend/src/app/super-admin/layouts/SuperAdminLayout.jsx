import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useSuperAdminAuth } from '../contexts/SuperAdminAuthContext';
import { Shield, Menu, X, LogOut, Settings, Building2, CreditCard, DollarSign, FileText, MessageSquare, LayoutDashboard, BarChart3, Bell, ChevronDown } from 'lucide-react';
import Button from '../../../shared/components/Button';
import Loader from '../../../shared/components/Loader';

const SuperAdminLayout = () => {
  const { superAdmin, loading, logout } = useSuperAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return <Loader fullPage />;
  }

  if (!superAdmin) {
    return <Navigate to="/super-admin/login" replace state={{ from: location }} />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/super-admin/dashboard', icon: LayoutDashboard },
    { name: 'Schools', href: '/super-admin/schools', icon: Building2 },
    { name: 'Plans', href: '/super-admin/plans', icon: CreditCard },
    { name: 'Payments', href: '/super-admin/payments', icon: DollarSign },
    { name: 'Announcements', href: '/super-admin/announcements', icon: MessageSquare },
    { name: 'Landing CMS', href: '/super-admin/landing-cms', icon: FileText },
    { name: 'Settings', href: '/super-admin/settings', icon: Settings },
    { name: 'Profile', href: '/super-admin/profile', icon: BarChart3 },
  ];

  const handleLogout = () => {
    logout();
    navigate('/super-admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700 shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Super Admin</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-slate-700 shrink-0">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {superAdmin?.name?.charAt(0) || 'S'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {superAdmin?.name || 'Super Admin'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {superAdmin?.email || 'admin@platform.com'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top navbar */}
        <header className="sticky top-0 z-30 bg-slate-800 border-b border-slate-700 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-200"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">
              {navigation.find(item => location.pathname === item.href)?.name || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-400 hover:text-slate-200 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="relative">
              <button className="flex items-center space-x-2 p-2 text-slate-300 hover:bg-slate-700 rounded-lg">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {superAdmin?.name?.charAt(0) || 'S'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
