import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Loader from './components/Loader';
import ErrorBoundary from './components/ErrorBoundary';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Admin Pages (Lazy Loaded)
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Enquiries = lazy(() => import('./pages/Enquiries'));
const AdmissionFormPage = lazy(() => import('./pages/AdmissionFormPage'));
const QrLinksPage = lazy(() => import('./pages/QrLinksPage'));
const ThankYouCmsPage = lazy(() => import('./pages/ThankYouCmsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AssessmentList = lazy(() => import('./pages/AssessmentList'));
const AssessmentBuilder = lazy(() => import('./pages/AssessmentBuilder'));

// Public Pages (Lazy Loaded)
const PublicAdmissionPage = lazy(() => import('./pages/PublicAdmissionPage'));
const PublicThankYouPage = lazy(() => import('./pages/PublicThankYouPage'));
const StudentTest = lazy(() => import('./pages/StudentTest'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<Loader fullPage message="Loading workspace components..." />}>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Public Form Submission Routes (Parent Flow) */}
              <Route path="/public/admission/:schoolId" element={<PublicAdmissionPage />} />
              <Route path="/public/thankyou/:schoolId" element={<PublicThankYouPage />} />
              <Route path="/public/test/:assignmentId" element={<StudentTest />} />

              {/* Protected Dashboard Admin Routes */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/enquiries" element={<Enquiries />} />
                <Route path="/admission-form" element={<AdmissionFormPage />} />
                <Route path="/qr-code" element={<QrLinksPage />} />
                <Route path="/thankyou-cms" element={<ThankYouCmsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/assessments" element={<AssessmentList />} />
                <Route path="/assessments/new" element={<AssessmentBuilder />} />
                <Route path="/assessments/:id/edit" element={<AssessmentBuilder />} />
                
                {/* Fallback inside dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Route>

              {/* 404 Route */}
              <Route path="/404" element={<NotFound />} />

              {/* Global Fallback Route */}
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </Suspense>
          <Toaster position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
