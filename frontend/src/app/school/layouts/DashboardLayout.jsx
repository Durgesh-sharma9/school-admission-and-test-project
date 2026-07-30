import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Loader from '../../../shared/components/Loader';
import SupportModeBanner from '../components/SupportModeBanner';

const DashboardLayout = () => {
  const { school, loading, isTrialActive } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [supportMode, setSupportMode] = useState(false);
  const [supportSchoolName, setSupportSchoolName] = useState('');

  useEffect(() => {
    // Check if in support mode
    const isSupportMode = localStorage.getItem('supportMode') === 'true';
    const supportSchool = localStorage.getItem('supportSchoolName');
    setSupportMode(isSupportMode);
    setSupportSchoolName(supportSchool || '');
  }, []);

  const handleExitSupportMode = () => {
    localStorage.removeItem('supportMode');
    localStorage.removeItem('supportSchoolId');
    localStorage.removeItem('supportSchoolName');
    const superAdminToken = localStorage.getItem('superAdminToken');
    if (superAdminToken) {
      localStorage.setItem('token', superAdminToken);
    }
    window.location.href = '/super-admin/schools';
  };
  // Show loader while checking auth state
  if (loading) {
    return <Loader fullPage message="Verifying session..." />;
  }

  // Redirect to login if not authenticated (unless in support mode)
  if (!school && !supportMode) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Crossover protection: redirect college users to college dashboard
  if (school && school.institutionType === 'college') {
    return <Navigate to="/college/dashboard" replace />;
  }

  // Determine current page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/enquiries')) return 'Enquiry Management';
    if (path.startsWith('/admission-form')) return 'Manual Admission Entry';
    if (path.startsWith('/qr-code')) return 'Admission QR & Public Links';
    if (path.startsWith('/thankyou-cms')) return 'Enquiry Banner Configuration';
    if (path.startsWith('/subscription')) return 'Subscription & Billing';
    if (path.startsWith('/settings')) return 'School Settings';
    return 'CRM Admin';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex layout-content-area">
      <style>{`
        /* Target main layout and dashboard page backgrounds to have the CRM pink tint */
        .layout-content-area,
        .layout-content-area .min-h-screen,
        .layout-content-area .bg-slate-50,
        .layout-content-area .bg-gray-50 {
          background-color: #F9EEF3 !important;
        }
      `}</style>
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Support Mode Banner */}
        {supportMode && (
          <SupportModeBanner
            schoolName={supportSchoolName}
            onExit={handleExitSupportMode}
          />
        )}

        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title={getPageTitle()} />
        
        {/* Trial Expired Warning Banner */}
        {!isTrialActive && !supportMode && (
          <div className="bg-red-50 border-y border-red-100 px-6 py-2.5 flex items-center justify-between">
            <p className="text-xs text-red-800 font-semibold">
              ⚠️ Your free trial has expired. New public admissions are paused. Please update your subscription.
            </p>
            <button className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-100 px-3 py-1 rounded-md transition-colors">
              Contact Billing
            </button>
          </div>
        )}

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
