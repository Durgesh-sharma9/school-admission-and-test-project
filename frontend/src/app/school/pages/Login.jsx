import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSuperAdminAuth } from '../../super-admin/contexts/SuperAdminAuthContext';
import toast from 'react-hot-toast';
import { GraduationCap, Target, Activity, Star, Zap, CheckCircle2 } from 'lucide-react';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import GoogleLoginButton from '../components/GoogleLoginButton';

const Login = () => {
  const { login, school } = useAuth();
  const { checkAuth: checkSuperAdminAuth, superAdmin } = useSuperAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

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
    document.title = 'Admission Management CRM - Sign In';
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
    <div className="relative h-screen w-full flex flex-col justify-between overflow-hidden font-sans bg-slate-50">
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
          background: 'rgba(248, 250, 252, 0.65)',
          backdropFilter: 'blur(4px)',
        }}
      />

      <div className="relative z-10 flex flex-col-reverse lg:flex-row h-screen w-full max-w-7xl mx-auto">
        {/* Left Side: Branding & Features */}
        <div className="w-full lg:w-3/5 flex flex-col p-6 sm:p-8 lg:pr-12 text-slate-900 h-full">

          {/* Main content vertically centered */}
          <div className="flex-1 flex flex-col justify-center">

            {/* Reduced mb-6 to mb-5, and removed large margins from paragraph */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-4 w-fit bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-blue-100/50 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-blue-800 font-semibold text-xs">Admission Management CRM</span>
              </div>

              {/* Increased heading sizes */}
              <h1 className="text-5xl sm:text-[3.5rem] leading-[1.1] font-extrabold text-slate-900 tracking-tight mb-1">
                One Platform for <br className="hidden lg:block" />
                <span className="text-blue-600">School & College</span>
              </h1>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-700 mt-2 mb-4">
                Admissions
              </h2>

              {/* Removed mb-8 to bring boxes closer */}
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg font-medium">
                Manage enquiries, admissions, counselling, assessments, communication, analytics and student records from one modern platform.
              </p>
            </div>

            {/* Feature cards grid */}
            <div className="hidden sm:grid grid-cols-2 gap-3">
              {features.map((feat, idx) => (
                <div key={idx} className="bg-white/80 backdrop-blur-md border border-white/60 rounded-xl p-4 hover:bg-white transition-all duration-300 group shadow-sm flex items-start gap-3">
                  <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${feat.iconBg}`}>
                    {feat.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 mb-0.5">{feat.title}</h4>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{feat.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer branding fixed at the bottom */}
          <div className="text-[10px] text-slate-400 font-semibold py-2">
            <p>© 2026 Admission Management CRM. All rights reserved.</p>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="w-full lg:w-2/5 flex items-center justify-center p-4 sm:p-6 lg:p-8 h-full">
          <div className="w-full max-w-md bg-white rounded-[1.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col justify-between">
            <div>
              {/* Card Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center h-12 w-12 bg-blue-600 rounded-xl text-white shadow-md">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Administrator Portal</h2>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Admission Management CRM</p>
                </div>
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
                  <Input
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    error={errors.password}
                    className="!rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium placeholder:text-slate-400 py-2.5 px-3 text-sm"
                    {...register('password', { required: 'Password is required' })}
                  />
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