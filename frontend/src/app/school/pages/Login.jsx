import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSuperAdminAuth } from '../../super-admin/contexts/SuperAdminAuthContext';
import toast from 'react-hot-toast';
import { GraduationCap } from 'lucide-react';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import GoogleLoginButton from '../components/GoogleLoginButton';

const Login = () => {
  const { login, school } = useAuth();
  const { checkAuth: checkSuperAdminAuth, superAdmin } = useSuperAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [showResendOTP, setShowResendOTP] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  
  // Check for auto-login state from OTP verification
  const { email: autoEmail, autoLogin } = location.state || {};

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: autoEmail || '',
      password: '',
    }
  });

  // Redirect if already logged in
  React.useEffect(() => {
    if (superAdmin) {
      navigate('/super-admin/dashboard', { replace: true });
    } else if (school) {
      const origin = location.state?.from?.pathname || '/dashboard';
      navigate(origin, { replace: true });
    }
  }, [school, superAdmin, navigate, location]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await login(data.email, data.password);

      if (result.success) {
        toast.success('Logged in successfully!');
        if (result.role === 'super-admin') {
          if (checkSuperAdminAuth) await checkSuperAdminAuth();
          navigate('/super-admin/dashboard', { replace: true });
        } else {
          const origin = location.state?.from?.pathname || '/dashboard';
          navigate(origin, { replace: true });
        }
      }
    } catch (error) {
      if (error.data?.requiresVerification) {
        toast.error(error.message || 'Please verify your email to login.');
        navigate('/verify-otp', { state: { email: data.email } });
      } else {
        toast.error(error.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/v1/otp/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail, purpose: 'EMAIL_VERIFICATION' })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('OTP sent successfully');
        navigate('/verify-otp', { state: { email: resendEmail } });
      } else {
        toast.error(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('Failed to send OTP');
    }
  };



  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-gradient-to-tr from-indigo-50/50 via-slate-50 to-indigo-50/30">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center h-12 w-12 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/20 mb-3">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Welcome Back</h2>
          <p className="text-slate-400 text-sm mt-1">Manage school admissions & enquiries</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Admin Email Address"
            name="email"
            type="email"
            placeholder="e.g. admin@school.com"
            required
            error={errors.email}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                message: 'Please enter a valid email address',
              },
            })}
          />

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                Password
              </label>
            </div>
            <Input
              name="password"
              type="password"
              placeholder="••••••••"
              required
              error={errors.password}
              {...register('password', { required: 'Password is required' })}
            />
          </div>

          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-xs text-indigo-600 hover:text-indigo-500 font-semibold"
            >
              Forgot Password?
            </Link>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full py-3"
              isLoading={loading}
            >
              Sign In
            </Button>
          </div>

          {/* Google OAuth Login */}
          <GoogleLoginButton />
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-500">
          New school admin?{' '}
          <Link to="/signup" className="text-indigo-600 font-semibold hover:text-indigo-500">
            Create school account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
