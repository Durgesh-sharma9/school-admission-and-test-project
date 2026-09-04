import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSuperAdminAuth } from '../../super-admin/contexts/SuperAdminAuthContext';
import toast from 'react-hot-toast';
import { GraduationCap, Target, Activity, Star, Zap, CheckCircle2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import GoogleLoginButton from '../components/GoogleLoginButton';
import CampusCrmLogo, { CampusCrmIcon } from '../../../shared/components/CampusCrmLogo';

const Login = () => {
  const { login, school } = useAuth();
  const { checkAuth: checkSuperAdminAuth, superAdmin } = useSuperAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  // Update browser window title
  useEffect(() => {
    document.title = 'Campus CRM - Sign In';
  }, []);

  // Redirect if already logged in
  React.useEffect(() => {
    if (superAdmin) {
      navigate('/super-admin/dashboard', { replace: true });
    } else if (school) {
      const defaultOrigin = school.institutionType === 'college' ? '/college/dashboard' : '/dashboard';
      const origin = location.state?.from?.pathname || defaultOrigin;
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
          const defaultOrigin = result.school?.institutionType === 'college' ? '/college/dashboard' : '/dashboard';
          const origin = location.state?.from?.pathname || defaultOrigin;
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

  const features = [
    {
      icon: <Target className="w-5 h-5 text-white" />,
      iconBg: "bg-blue-500",
      title: "Admission CRM",
      description: "Track enquiries and convert leads automatically."
    },
    {
      icon: <Activity className="w-5 h-5 text-white" />,
      iconBg: "bg-emerald-500",
      title: "Assessment Engine",
      description: "Automate online entrance tests, grading and feedback."
    },
    {
      icon: <Star className="w-5 h-5 text-white" />,
      iconBg: "bg-amber-500",
      title: "Counselling Pipeline",
      description: "Manage applicant counselling, interviews and admissions."
    },
    {
      icon: <Zap className="w-5 h-5 text-white" />,
      iconBg: "bg-rose-500",
      title: "Reports & Analytics",
      description: "Generate visual scorecards and detailed enrollment insights."
    }
  ];

  const bgImage = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=90';

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between font-sans bg-slate-50 overflow-y-auto">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('" + bgImage + "')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      />
      {/* Overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: 'rgba(248, 250, 252, 0.7)',
          backdropFilter: 'blur(6px)',
        }}
      />

      {/* Back to Home Button */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-8 z-30">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-700 bg-white/90 hover:bg-white hover:text-blue-600 rounded-xl border border-slate-200/90 shadow-sm backdrop-blur-md transition-all duration-200 group hover:shadow-md cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-blue-600 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="relative z-10 flex flex-col-reverse lg:flex-row min-h-screen w-full max-w-7xl mx-auto items-center justify-center">
        {/* Left Side: Branding & Features (Hidden on mobile for clean focused login, shown on desktop) */}
        <div className="hidden lg:flex w-full lg:w-3/5 flex-col p-5 sm:p-8 lg:pr-12 text-slate-900 justify-center">

          {/* Main content vertically centered */}
          <div className="flex flex-col justify-center">

            <div className="mb-4 sm:mb-5">
              <div className="mb-5">
                <CampusCrmLogo variant="full" size="normal" />
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-1">
                One Platform for <br className="hidden lg:block" />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">School & College</span>
              </h1>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-700 mt-1 mb-3">
                Admissions
              </h2>

              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-lg font-medium">
                Manage enquiries, admissions, counselling, assessments, communication, analytics and student records from one modern platform.
              </p>
            </div>

            {/* Feature cards grid */}
            <div className="grid grid-cols-2 gap-3">
              {features.map((feat, idx) => (
                <div key={idx} className="bg-white/85 backdrop-blur-md border border-white/80 rounded-xl p-3.5 hover:bg-white transition-all duration-300 group shadow-sm flex items-start gap-3">
                  <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center shadow-sm ${feat.iconBg}`}>
                    {feat.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 mb-0.5">{feat.title}</h4>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{feat.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer branding fixed at bottom */}
          <div className="pt-4 text-left">
            <p className="text-xs text-slate-400 font-medium">
              © {new Date().getFullYear()} Campus CRM. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="w-full lg:w-2/5 flex items-center justify-center px-4 py-16 sm:py-20 lg:py-8 my-auto">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 flex flex-col justify-between">
            <div>
              {/* Card Header */}
              <div className="mb-6 space-y-1.5">
                <CampusCrmLogo variant="full" size="normal" />
                <p className="text-xs font-bold text-slate-500">Administrator Portal</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-1">Welcome Back 👋</h3>
                <p className="text-slate-500 text-[13px]">Please sign in to your administrator dashboard</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* Google OAuth Login */}
                <div className="mb-5">
                  <GoogleLoginButton />
                </div>

                <div className="relative">
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                    Admin Email Address
                  </label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="admin@school.com"
                    required
                    error={errors.email}
                    className="!rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium placeholder:text-slate-400 py-2.5 px-3 text-sm"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                        message: 'Please enter a valid email address',
                      },
                    })}
                  />
                </div>

                <div className="relative">
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      required
                      className={`w-full rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium placeholder:text-slate-400 py-2.5 pl-3 pr-10 text-sm transition-all outline-none ${
                        errors.password ? 'border-red-500' : ''
                      }`}
                      {...register('password', { required: 'Password is required' })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition-colors cursor-pointer"
                      tabIndex={-1}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>
                  )}
                  <div className="flex justify-end mt-1.5">
                    <Link
                      to="/forgot-password"
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                </div>

                <div className="pt-1">
                  <Button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                    isLoading={loading}
                  >
                    Sign In
                  </Button>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="mt-5 text-center text-[12px] text-slate-600 font-medium border-t border-slate-100 pt-4">
              New admin?{' '}
              <Link to="/signup" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;