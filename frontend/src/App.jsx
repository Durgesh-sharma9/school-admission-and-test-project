import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './app/school/contexts/AuthContext';
import { SuperAdminAuthProvider } from './app/super-admin/contexts/SuperAdminAuthContext';
import { Toaster } from 'react-hot-toast';
import Loader from './shared/components/Loader';
import ErrorBoundary from './shared/components/ErrorBoundary';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'unconfigured';

// Landing Page (Lazy Loaded)
const LandingPage = lazy(() => import('./app/landing/pages/LandingPage'));

// School Admin Pages (Lazy Loaded)
const SchoolLogin = lazy(() => import('./app/school/pages/Login'));
const SchoolSignup = lazy(() => import('./app/school/pages/Signup'));
const SchoolVerifyOTP = lazy(() => import('./app/school/pages/VerifyOTP'));
const SchoolForgotPassword = lazy(() => import('./app/school/pages/ForgotPassword'));
const SchoolResetPassword = lazy(() => import('./app/school/pages/ResetPassword'));
const SchoolDashboard = lazy(() => import('./app/school/pages/Dashboard'));
const SchoolEnquiries = lazy(() => import('./app/school/pages/Enquiries'));
const SchoolAdmissionFormPage = lazy(() => import('./app/school/pages/AdmissionFormPage'));
const SchoolQrLinksPage = lazy(() => import('./app/school/pages/QrLinksPage'));
const SchoolThankYouCmsPage = lazy(() => import('./app/school/pages/ThankYouCmsPage'));
const SchoolSettingsPage = lazy(() => import('./app/school/pages/SettingsPage'));
const SchoolAssessmentList = lazy(() => import('./app/school/pages/AssessmentList'));
const SchoolAssessmentBuilder = lazy(() => import('./app/school/pages/AssessmentBuilder'));
const SchoolPublicAdmissionPage = lazy(() => import('./app/school/pages/PublicAdmissionPage'));
const SchoolPublicThankYouPage = lazy(() => import('./app/school/pages/PublicThankYouPage'));
const SchoolStudentTest = lazy(() => import('./app/school/pages/StudentTest'));
const SchoolNotFound = lazy(() => import('./app/school/pages/NotFound'));

// School Admin Layout
const SchoolLayout = lazy(() => import('./app/school/layouts/DashboardLayout'));

// Super Admin Pages (Lazy Loaded)
const SuperAdminLogin = lazy(() => import('./app/super-admin/pages/Login'));
const SuperAdminDashboard = lazy(() => import('./app/super-admin/pages/Dashboard'));
const SuperAdminSchools = lazy(() => import('./app/super-admin/pages/Schools'));
const SuperAdminPlans = lazy(() => import('./app/super-admin/pages/Plans'));
const SuperAdminPayments = lazy(() => import('./app/super-admin/pages/Payments'));
const SuperAdminLandingCMS = lazy(() => import('./app/super-admin/pages/LandingCMS'));
const SuperAdminAnnouncements = lazy(() => import('./app/super-admin/pages/Announcements'));
const SuperAdminNotifications = lazy(() => import('./app/super-admin/pages/Notifications'));
const SuperAdminSettings = lazy(() => import('./app/super-admin/pages/Settings'));
const SuperAdminProfile = lazy(() => import('./app/super-admin/pages/Profile'));

// Super Admin Layout
const SuperAdminLayout = lazy(() => import('./app/super-admin/layouts/SuperAdminLayout'));

function App() {
  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthProvider>
          <SuperAdminAuthProvider>
            <BrowserRouter>
              <Suspense fallback={<Loader fullPage message="Loading workspace components..." />}>
                <Routes>
                  {/* Landing Page */}
                  <Route path="/" element={<LandingPage />} />

                  {/* School Admin Public & Authentication Routes */}
                  <Route path="/login" element={<SchoolLogin />} />
                  <Route path="/signup" element={<SchoolSignup />} />
                  <Route path="/verify-otp" element={<SchoolVerifyOTP />} />
                  <Route path="/forgot-password" element={<SchoolForgotPassword />} />
                  <Route path="/reset-password" element={<SchoolResetPassword />} />

                  {/* Public Admission Form & Thank You Routes */}
                  <Route path="/admission/:schoolId" element={<SchoolPublicAdmissionPage />} />
                  <Route path="/thank-you/:schoolId" element={<SchoolPublicThankYouPage />} />

                  {/* Student Assessment Test Portal */}
                  <Route path="/test/:assessmentId" element={<SchoolStudentTest />} />

                  {/* Protected School Admin Routes */}
                  <Route element={<SchoolLayout />}>
                    <Route path="/dashboard" element={<SchoolDashboard />} />
                    <Route path="/enquiries" element={<SchoolEnquiries />} />
                    <Route path="/admission-form-builder" element={<SchoolAdmissionFormPage />} />
                    <Route path="/qr-links" element={<SchoolQrLinksPage />} />
                    <Route path="/thank-you-cms" element={<SchoolThankYouCmsPage />} />
                    <Route path="/settings" element={<SchoolSettingsPage />} />
                    <Route path="/assessments" element={<SchoolAssessmentList />} />
                    <Route path="/assessments/create" element={<SchoolAssessmentBuilder />} />
                    <Route path="/assessments/edit/:id" element={<SchoolAssessmentBuilder />} />
                  </Route>

                  {/* Super Admin Authentication & Protected Routes */}
                  <Route path="/super-admin/login" element={<SuperAdminLogin />} />
                  <Route element={<SuperAdminLayout />}>
                    <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
                    <Route path="/super-admin/schools" element={<SuperAdminSchools />} />
                    <Route path="/super-admin/plans" element={<SuperAdminPlans />} />
                    <Route path="/super-admin/payments" element={<SuperAdminPayments />} />
                    <Route path="/super-admin/announcements" element={<SuperAdminAnnouncements />} />
                    <Route path="/super-admin/landing-cms" element={<SuperAdminLandingCMS />} />
                    <Route path="/super-admin/notifications" element={<SuperAdminNotifications />} />
                    <Route path="/super-admin/settings" element={<SuperAdminSettings />} />
                    <Route path="/super-admin/profile" element={<SuperAdminProfile />} />
                  </Route>

                  {/* 404 Route */}
                  <Route path="/404" element={<SchoolNotFound />} />

                  {/* Global Fallback Route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
              <Toaster position="top-right" />
            </BrowserRouter>
          </SuperAdminAuthProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}

export default App;
