import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import schoolApi from '../services/schoolApi';
import { useAuth } from '../contexts/AuthContext';
import { useSuperAdminAuth } from '../../super-admin/contexts/SuperAdminAuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const GoogleLoginButton = () => {
  const { updateSchoolState } = useAuth();
  const { checkAuth: checkSuperAdminAuth } = useSuperAdminAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isConfigured = Boolean(googleClientId && googleClientId.trim() !== '' && googleClientId !== 'YOUR_GOOGLE_CLIENT_ID');

  const handleGoogleAuthResponse = async (authPayload) => {
    setLoading(true);
    try {
      const data = await schoolApi.post('/auth/google', authPayload);

      if (data.success) {
        if (data.isRegistered === false && data.googleData) {
          // New user: Google identity verified, redirect to /signup with prefilled name & email
          toast.success('Google identity verified! Please fill in your school details.');
          navigate('/signup', { state: { googleData: data.googleData } });
        } else if (data.token) {
          // Existing user: Direct Login
          if (data.role === 'super-admin') {
            localStorage.setItem('superAdminToken', data.token);
            localStorage.setItem('token', data.token);
            if (checkSuperAdminAuth) await checkSuperAdminAuth();
            toast.success('Logged in successfully as Super Admin!');
            navigate('/super-admin/dashboard', { replace: true });
          } else {
            localStorage.setItem('token', data.token);
            if (updateSchoolState && data.school) {
              updateSchoolState(data.school);
            }
            toast.success('Logged in successfully with Google!');
            navigate('/dashboard', { replace: true });
          }
        }
      } else {
        toast.error(data.message || 'Google verification failed');
      }
    } catch (error) {
      toast.error(error.message || 'Google verification failed');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      handleGoogleAuthResponse({ access_token: tokenResponse.access_token });
    },
    onError: (errorResponse) => {
      console.warn('Google login popup cancelled or failed:', errorResponse);
      if (errorResponse?.error === 'popup_closed_by_user') {
        toast.error('Google Sign-In was cancelled.');
      } else {
        toast.error('Google Sign-In failed or popup was closed.');
      }
    },
  });

  const handleClick = () => {
    if (!isConfigured) {
      toast.error('Google Login is not configured.');
      return;
    }
    loginWithGoogle();
  };

  return (
    <div className="w-full space-y-4">
      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-white text-slate-400 font-medium">Or continue with</span>
        </div>
      </div>

      {/* Button */}
      <button
        type="button"
        disabled={loading}
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 rounded-xl py-3 px-4 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-xs disabled:opacity-50"
      >
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="font-medium text-slate-700 text-sm">
          {loading ? 'Authenticating...' : 'Continue with Google'}
        </span>
      </button>
    </div>
  );
};

export default GoogleLoginButton;
