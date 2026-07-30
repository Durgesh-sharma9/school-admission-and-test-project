import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../school/contexts/AuthContext';
import CollegeSidebar from '../components/CollegeSidebar';
import Navbar from '../../school/components/Navbar';
import Loader from '../../../shared/components/Loader';

const CollegeDashboardLayout = () => {
  const { school, loading, isTrialActive } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Show loader while checking auth state
  if (loading) {
    return <Loader fullPage message="Verifying session..." />;
  }

  // Redirect to login if not authenticated
  if (!school) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If authenticated but institutionType is not college, fallback/redirect
  if (school.institutionType !== 'college') {
    return <Navigate to="/dashboard" replace />;
  }

  // Determine current page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/college/dashboard')) return 'College Dashboard';
    if (path.startsWith('/college/applications')) return 'Applications CRM Desk';
    if (path.startsWith('/college/admission-form')) return 'Manual Admission entry';
    if (path.startsWith('/college/academic-config')) return 'Academic Configuration';
    if (path.startsWith('/college/counselling')) return 'Counselling Pipeline';
    if (path.startsWith('/college/documents')) return 'Document Verification Desk';
    if (path.startsWith('/college/qr-links')) return 'QR & Admission Desk Links';
    if (path.startsWith('/college/thank-you-cms')) return 'Enquiry Banner Settings';
    if (path.startsWith('/college/subscription')) return 'Subscription & Plans';
    if (path.startsWith('/college/settings')) return 'College Profile & Settings';
    return 'College CRM Admin';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex layout-content-area">
      <style>{`
        /* Target main layout and dashboard page backgrounds to have the CRM pink tint */
        .layout-content-area,
        .layout-content-area .min-h-screen,
        .layout-content-area .bg-slate-50,
        .layout-content-area .bg-gray-50 {
          background-color: #FFF4F8 !important;
        }
      `}</style>
      {/* Sidebar navigation */}
      <CollegeSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title={getPageTitle()} module="college" />

        {/* Trial Expired Warning Banner */}
        {!isTrialActive && (
          <div className="bg-red-50 border-y border-red-100 px-6 py-2.5 flex items-center justify-between text-left">
            <p className="text-xs text-red-800 font-semibold">
              ⚠️ Your free trial has expired. New public admissions are paused. Please update your subscription plan.
            </p>
            <button className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-100 px-3 py-1 rounded-md transition-colors shrink-0">
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

export default CollegeDashboardLayout;
