import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import schoolApi from '../services/schoolApi';
import toast from 'react-hot-toast';
import { GraduationCap, Target, Activity, Star, Zap, CheckCircle2 } from 'lucide-react';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import GoogleLoginButton from '../components/GoogleLoginButton';

const Signup = () => {
  const { school, updateSchoolState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [institutionType, setInstitutionType] = useState('school');

  const googleData = location.state?.googleData;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: googleData?.email || '',
      phone: '',
      address: '',
      password: '',
    }
  });

  useEffect(() => {
    if (googleData?.email) {
      setValue('email', googleData.email);
    }
  }, [googleData, setValue]);

  useEffect(() => {
    document.title = (institutionType === 'school' ? 'School' : 'College') + ' Admission CRM - Sign Up';
  }, [institutionType]);

  React.useEffect(() => {
    if (school) {
      navigate(school.institutionType === 'college' ? '/college/dashboard' : '/dashboard');
    }
  }, [school, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const isGoogle = Boolean(googleData?.googleVerified);
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        googleVerified: isGoogle,
        authProvider: isGoogle ? 'google' : 'email',
        institutionType,
      };

      if (!isGoogle) {
        payload.password = data.password;
      }

      const result = await schoolApi.post('/auth/signup', payload);

      if (result.success) {
        if (result.token && result.school) {
          localStorage.setItem('token', result.token);
          if (updateSchoolState) {
            updateSchoolState(result.school);
          }
          toast.success(`${institutionType === 'school' ? 'School' : 'College'} account created successfully!`);
          navigate(result.school.institutionType === 'college' ? '/college/dashboard' : '/dashboard', { replace: true });
        } else {
          toast.success('Account created! Please enter OTP sent to your email.');
          navigate('/verify-otp', { state: { email: data.email } });
        }
      } else {
        toast.error(result.message || 'Registration failed');
      }
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const schoolFeatures = [
    {
      icon: <Target className="w-5 h-5 text-white" />,
      iconBg: "bg-blue-500",
      title: "Admission CRM",
      description: "Track enquiries and convert leads automatically."
    },
    {
      icon: <Activity className="w-5 h-5 text-white" />,
      iconBg: "bg-emerald-500",
      title: "Assessments",
      description: "Automate online entrance tests, grading and feedback."
    },
    {
      icon: <Star className="w-5 h-5 text-white" />,
      iconBg: "bg-amber-500",
      title: "Parent Portal",
      description: "Automate communications and status updates."
    },
    {
      icon: <Zap className="w-5 h-5 text-white" />,
      iconBg: "bg-rose-500",
      title: "Result Analytics",
      description: "Generate visual scorecards and detailed insights."
    }
  ];

  const collegeFeatures = [
    {
      icon: <Target className="w-5 h-5 text-white" />,
      iconBg: "bg-blue-500",
      title: "Admission Pipeline",
      description: "Streamline course registrations and validations."
    },
    {
      icon: <Activity className="w-5 h-5 text-white" />,
      iconBg: "bg-emerald-500",
      title: "Counselling Pipeline",
      description: "Manage department allocation and interview rounds."
    },
    {
      icon: <Star className="w-5 h-5 text-white" />,
      iconBg: "bg-amber-500",
      title: "Campus Visits",
      description: "Schedule campus walk-ins and guide applicant queries."
    },
    {
      icon: <Zap className="w-5 h-5 text-white" />,
      iconBg: "bg-rose-500",
      title: "Scholarships",
      description: "Administer scholarship brackets and eligibility."
    }
  ];

  const currentFeatures = institutionType === 'school' ? schoolFeatures : collegeFeatures;
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
                <span className="text-blue-800 font-semibold text-xs">Next-Gen CRM Platform</span>
              </div>

              {/* Increased heading sizes */}
              <h1 className="text-5xl sm:text-[3.5rem] leading-[1.1] font-extrabold text-slate-900 tracking-tight mb-1">
                Grow Your <br className="hidden lg:block" />
                <span className="text-blue-600">{institutionType === 'school' ? 'School Admissions' : 'College Admissions'}</span>
              </h1>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-700 mt-2 mb-4">
                {institutionType === 'school' ? 'Manage School CRM' : 'Manage College CRM'}
              </h2>

              {/* Removed mb-8 to bring boxes closer */}
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg font-medium">
                Manage enquiries, admissions, assessments, communication, analytics and student records from one modern platform.
              </p>
            </div>

            {/* Feature cards grid */}
            <div className="hidden sm:grid grid-cols-2 gap-3">
              {currentFeatures.map((feat, idx) => (
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
            <p>© 2026 {institutionType === 'school' ? 'School' : 'College'} Admission CRM. All rights reserved.</p>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="w-full lg:w-2/5 flex items-center justify-center p-4 sm:p-6 lg:p-8 h-full">
          <div className="w-full max-w-md bg-white rounded-[1.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col justify-between">
            <div>
              {/* Card Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center justify-center h-10 w-10 bg-blue-600 rounded-xl text-white shadow-md">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Create Account</h2>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Start your 30-day CRM free trial</p>
                </div>
              </div>

              {/* Institution Type Selector */}
              <div className="flex border border-slate-200/80 rounded-lg p-1 bg-slate-50 mb-4">
                <button
                  type="button"
                  onClick={() => setInstitutionType('school')}
                  className={`flex-1 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${institutionType === 'school'
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  School Mode
                </button>
                <button
                  type="button"
                  onClick={() => setInstitutionType('college')}
                  className={`flex-1 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${institutionType === 'college'
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  College Mode
                </button>
              </div>

              {/* Compact Signup Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {institutionType === 'school' ? 'School Name' : 'College Name'}
                  </label>
                  <Input
                    name="name"
                    placeholder={institutionType === 'school' ? 'Oakridge School' : 'Oakridge College'}
                    required
                    error={errors.name}
                    className="!rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium placeholder:text-slate-400 py-2 px-3 text-sm"
                    {...register('name', { required: (institutionType === 'school' ? 'School' : 'College') + ' name is required' })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Admin Email
                  </label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="admin@mail.com"
                    required
                    error={errors.email}
                    className="!rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium placeholder:text-slate-400 py-2 px-3 text-sm"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                        message: 'Valid email required',
                      },
                    })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Contact Number</label>
                    <Input
                      name="phone"
                      placeholder="9876543210"
                      required
                      error={errors.phone}
                      className="!rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium placeholder:text-slate-400 py-2 px-3 text-sm"
                      {...register('phone', {
                        required: 'Required',
                        pattern: {
                          value: /^[0-9+() -]{10,15}$/,
                          message: 'Invalid phone',
                        },
                      })}
                    />
                  </div>

                  <div>
                    {!googleData?.googleVerified ? (
                      <>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Admin Password</label>
                        <Input
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          required
                          error={errors.password}
                          className="!rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium placeholder:text-slate-400 py-2 px-3 text-sm"
                          {...register('password', {
                            required: 'Required',
                            minLength: {
                              value: 6,
                              message: 'Min 6 chars',
                            },
                          })}
                        />
                      </>
                    ) : (
                      <div className="space-y-1 text-left">
                        <label className="block text-[11px] font-semibold text-slate-700">Admin Password</label>
                        <div className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 font-medium">
                          Managed by Google
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {institutionType === 'school' ? 'School Address' : 'College Address'}
                  </label>
                  <Input
                    name="address"
                    placeholder={institutionType === 'school' ? '123 Education Lane' : '456 Univ Blvd'}
                    required
                    error={errors.address}
                    className="!rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium placeholder:text-slate-400 py-2 px-3 text-sm"
                    {...register('address', { required: 'Required' })}
                  />
                </div>

                <div className="pt-1">
                  <Button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] shadow-sm transition-all cursor-pointer"
                    isLoading={loading}
                  >
                    Sign Up & Get Started
                  </Button>
                </div>

                {/* Google OAuth Signup */}
                <div className="pt-1">
                  <GoogleLoginButton />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="mt-4 text-center text-[11px] text-slate-600 font-medium border-t border-slate-100 pt-3">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                Log In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;