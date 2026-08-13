import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './app/school/contexts/AuthContext';
import { SuperAdminAuthProvider } from './app/super-admin/contexts/SuperAdminAuthContext';
import { Toaster } from 'react-hot-toast';
import Loader from './shared/components/Loader';
import ErrorBoundary from './shared/components/ErrorBoundary';
import FeatureGate from './shared/components/FeatureGate';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'unconfigured';

// Landing Page (Lazy Loaded)
const LandingPage = lazy(() => import('./app/landing/pages/LandingPage'));

// School Admin Pages (Lazy Loaded)
const SchoolLogin = lazy(() => import('./app/school/pages/Login'));
const SchoolSignup = lazy(() => import('./app/school/pages/Signup'));
const SchoolVerifyOTP = lazy(() => import('./app/school/pages/VerifyOTP'));
const SchoolForgotPassword = lazy(() => import('./app/school/pages/ForgotPassword'));
const SchoolResetPassword = lazy(() => import('./app/school/pages/ResetPassword'));
import SchoolDashboard from './app/school/pages/Dashboard';
const SchoolEnquiries = lazy(() => import('./app/school/pages/Enquiries'));
const SchoolAdmissionFormPage = lazy(() => import('./app/school/pages/AdmissionFormPage'));
const SchoolQrLinksPage = lazy(() => import('./app/school/pages/QrLinksPage'));
const SchoolThankYouCmsPage = lazy(() => import('./app/school/pages/ThankYouCmsPage'));
const SchoolSettingsPage = lazy(() => import('./app/school/pages/SettingsPage'));
const SchoolAssessmentList = lazy(() => import('./app/school/pages/AssessmentList'));
const SchoolAssessmentBuilder = lazy(() => import('./app/school/pages/AssessmentBuilder'));
const SchoolSubscription = lazy(() => import('./app/school/pages/Subscription'));
const SchoolPublicAdmissionPage = lazy(() => import('./app/school/pages/PublicAdmissionPage'));
const SchoolPublicThankYouPage = lazy(() => import('./app/school/pages/PublicThankYouPage'));
const SchoolStudentTest = lazy(() => import('./app/school/pages/StudentTest'));
const SchoolNotFound = lazy(() => import('./app/school/pages/NotFound'));
const SchoolTasksPage = lazy(() => import('./app/school/pages/TasksPage'));

const SchoolLayout = lazy(() => import('./app/school/layouts/DashboardLayout'));

// College Admin Layout
const CollegeLayout = lazy(() => import('./app/college/layouts/CollegeDashboardLayout'));

// College Admin Pages
const CollegeDashboard = lazy(() => import('./app/college/pages/Dashboard'));
const CollegeApplications = lazy(() => import('./app/college/pages/Applications'));
const CollegeTasksPage = lazy(() => import('./app/college/pages/TasksPage'));
const CollegeAdmissionForm = lazy(() => import('./app/college/pages/AdmissionForm'));
const CollegeAcademicConfigPage = lazy(() => import('./app/college/pages/AcademicConfigPage'));
const CollegeCounselling = lazy(() => import('./app/college/pages/Counselling'));
const CollegeDocuments = lazy(() => import('./app/college/pages/Documents'));
const CollegeQrLinks = lazy(() => import('./app/college/pages/QrLinksPage'));
const CollegeThankYouCms = lazy(() => import('./app/college/pages/ThankYouCmsPage'));
const CollegeSubscription = lazy(() => import('./app/college/pages/Subscription'));
const CollegeSettings = lazy(() => import('./app/college/pages/SettingsPage'));

// College Public Pages
const CollegePublicAdmission = lazy(() => import('./app/college/pages/PublicAdmissionPage'));
const CollegePublicThankYou = lazy(() => import('./app/college/pages/PublicThankYouPage'));

// Super Admin Pages (Lazy Loaded)
const SuperAdminLogin = lazy(() => import('./app/super-admin/pages/Login'));
const SuperAdminDashboard = lazy(() => import('./app/super-admin/pages/Dashboard'));
const SuperAdminSchools = lazy(() => import('./app/super-admin/pages/Schools'));
const SuperAdminColleges = lazy(() => import('./app/super-admin/pages/Colleges'));
const SuperAdminSchoolPlans = lazy(() => import('./app/super-admin/pages/SchoolPlans'));
const SuperAdminCollegePlans = lazy(() => import('./app/super-admin/pages/CollegePlans'));
const SuperAdminSubscriptionRequests = lazy(() => import('./app/super-admin/pages/SubscriptionRequests'));
const SuperAdminPayments = lazy(() => import('./app/super-admin/pages/Payments'));
const SuperAdminAnnouncements = lazy(() => import('./app/super-admin/pages/Announcements'));
const SuperAdminNotifications = lazy(() => import('./app/super-admin/pages/Notifications'));
const SuperAdminSettings = lazy(() => import('./app/super-admin/pages/Settings'));
const SuperAdminProfile = lazy(() => import('./app/super-admin/pages/Profile'));
const SuperAdminAcademicMasters = lazy(() => import('./app/super-admin/pages/AcademicMasters'));

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

                  {/* Public Admission Form & QR Code Public Link Routes */}
                  <Route path="/public/school/admission/:schoolId" element={<SchoolPublicAdmissionPage />} />
                  <Route path="/public/school/thank-you/:schoolId" element={<SchoolPublicThankYouPage />} />
                  <Route path="/public/admission/:schoolId" element={<SchoolPublicAdmissionPage />} />
                  <Route path="/public/admission/:token" element={<SchoolPublicAdmissionPage />} />
                  <Route path="/public/qr/:schoolId" element={<SchoolPublicAdmissionPage />} />
                  <Route path="/public/qr/:token" element={<SchoolPublicAdmissionPage />} />
                  <Route path="/public/form/:schoolId" element={<SchoolPublicAdmissionPage />} />
                  <Route path="/public/form/:token" element={<SchoolPublicAdmissionPage />} />

                  <Route path="/admission/:schoolId" element={<SchoolPublicAdmissionPage />} />
                  <Route path="/admission/:token" element={<SchoolPublicAdmissionPage />} />
                  <Route path="/qr/:schoolId" element={<SchoolPublicAdmissionPage />} />
                  <Route path="/qr/:token" element={<SchoolPublicAdmissionPage />} />

                  {/* Public Thank You Routes */}
                  <Route path="/public/thankyou/:schoolId" element={<SchoolPublicThankYouPage />} />
                  <Route path="/public/thankyou/:token" element={<SchoolPublicThankYouPage />} />
                  <Route path="/public/thank-you/:schoolId" element={<SchoolPublicThankYouPage />} />
                  <Route path="/public/thank-you/:token" element={<SchoolPublicThankYouPage />} />

                  <Route path="/thankyou/:schoolId" element={<SchoolPublicThankYouPage />} />
                  <Route path="/thankyou/:token" element={<SchoolPublicThankYouPage />} />
                  <Route path="/thank-you/:schoolId" element={<SchoolPublicThankYouPage />} />
                  <Route path="/thank-you/:token" element={<SchoolPublicThankYouPage />} />

                  {/* Student Assessment Test Portal Routes */}
                  <Route path="/public/test/:assignmentId" element={<SchoolStudentTest />} />
                  <Route path="/public/test/:token" element={<SchoolStudentTest />} />
                  <Route path="/public/assessment/:assignmentId" element={<SchoolStudentTest />} />
                  <Route path="/public/assessment/:token" element={<SchoolStudentTest />} />

                  <Route path="/test/:assignmentId" element={<SchoolStudentTest />} />
                  <Route path="/test/:token" element={<SchoolStudentTest />} />
                  <Route path="/assessment/:assignmentId" element={<SchoolStudentTest />} />
                  <Route path="/assessment/:token" element={<SchoolStudentTest />} />

                  {/* Protected School Admin Routes */}
                  <Route element={<SchoolLayout />}>
                    <Route path="/dashboard" element={<SchoolDashboard />} />
                    <Route path="/dashboard/admission-form" element={<SchoolAdmissionFormPage />} />
                    <Route path="/dashboard/qr-links" element={<SchoolQrLinksPage />} />
                    <Route path="/dashboard/thank-you-cms" element={<SchoolThankYouCmsPage />} />
                    <Route path="/dashboard/enquiries" element={<SchoolEnquiries />} />
                    <Route path="/dashboard/tasks" element={<SchoolTasksPage />} />
                    <Route path="/dashboard/settings" element={<SchoolSettingsPage />} />
                    <Route path="/dashboard/subscription" element={<SchoolSubscription />} />
                    <Route path="/dashboard/assessments" element={<FeatureGate><SchoolAssessmentList /></FeatureGate>} />
                    <Route path="/dashboard/assessments/create" element={<FeatureGate><SchoolAssessmentBuilder /></FeatureGate>} />
                    <Route path="/dashboard/assessments/new" element={<FeatureGate><SchoolAssessmentBuilder /></FeatureGate>} />
                    <Route path="/dashboard/assessments/edit/:id" element={<FeatureGate><SchoolAssessmentBuilder /></FeatureGate>} />

                    <Route path="/enquiries" element={<SchoolEnquiries />} />
                    <Route path="/tasks" element={<SchoolTasksPage />} />
                    <Route path="/admission-form" element={<SchoolAdmissionFormPage />} />
                    <Route path="/admission-form-builder" element={<SchoolAdmissionFormPage />} />
                    <Route path="/qr-code" element={<SchoolQrLinksPage />} />
                    <Route path="/qr-links" element={<SchoolQrLinksPage />} />
                    <Route path="/thankyou-cms" element={<SchoolThankYouCmsPage />} />
                    <Route path="/thank-you-cms" element={<SchoolThankYouCmsPage />} />
                    <Route path="/settings" element={<SchoolSettingsPage />} />
                    <Route path="/subscription" element={<SchoolSubscription />} />
                    <Route path="/assessments" element={<FeatureGate><SchoolAssessmentList /></FeatureGate>} />
                    <Route path="/assessments/create" element={<FeatureGate><SchoolAssessmentBuilder /></FeatureGate>} />
                    <Route path="/assessments/new" element={<FeatureGate><SchoolAssessmentBuilder /></FeatureGate>} />
                    <Route path="/assessments/builder" element={<FeatureGate><SchoolAssessmentBuilder /></FeatureGate>} />
                    <Route path="/assessments/edit/:id" element={<FeatureGate><SchoolAssessmentBuilder /></FeatureGate>} />
                  </Route>

                  {/* College Public Routes */}
                  <Route path="/public/college/admission/:schoolId" element={<CollegePublicAdmission />} />
                  <Route path="/public/college/thank-you/:schoolId" element={<CollegePublicThankYou />} />

                  {/* Protected College Admin Routes */}
                  <Route element={<CollegeLayout />}>
                    <Route path="/college/dashboard" element={<CollegeDashboard />} />
                    <Route path="/college/applications" element={<CollegeApplications />} />
                    <Route path="/college/tasks" element={<CollegeTasksPage />} />
                    <Route path="/college/admission-form" element={<CollegeAdmissionForm />} />
                    <Route path="/college/academic-config" element={<CollegeAcademicConfigPage />} />
                    <Route path="/college/counselling" element={<Navigate to="/college/dashboard" replace />} />
                    <Route path="/college/documents" element={<Navigate to="/college/dashboard" replace />} />
                    <Route path="/college/qr-links" element={<CollegeQrLinks />} />
                    <Route path="/college/thank-you-cms" element={<CollegeThankYouCms />} />
                    <Route path="/college/subscription" element={<CollegeSubscription />} />
                    <Route path="/college/settings" element={<CollegeSettings />} />
                  </Route>

                  {/* Super Admin Authentication & Protected Routes */}
                  <Route path="/super-admin/login" element={<SuperAdminLogin />} />
                  <Route element={<SuperAdminLayout />}>
                    <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
                    <Route path="/super-admin/schools" element={<SuperAdminSchools />} />
                    <Route path="/super-admin/colleges" element={<SuperAdminColleges />} />
                    <Route path="/super-admin/school-plans" element={<SuperAdminSchoolPlans />} />
                    <Route path="/super-admin/college-plans" element={<SuperAdminCollegePlans />} />
                    <Route path="/super-admin/subscription-requests" element={<SuperAdminSubscriptionRequests />} />
                    <Route path="/super-admin/payments" element={<SuperAdminPayments />} />
                    <Route path="/super-admin/announcements" element={<SuperAdminAnnouncements />} />
                    <Route path="/super-admin/notifications" element={<SuperAdminNotifications />} />
                    <Route path="/super-admin/settings" element={<SuperAdminSettings />} />
                    <Route path="/super-admin/profile" element={<SuperAdminProfile />} />
                    <Route path="/super-admin/academic-masters" element={<SuperAdminAcademicMasters />} />
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
