import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import schoolApi from '../services/schoolApi';
import toast from 'react-hot-toast';
import { GraduationCap, Mail, Lock, Phone, MapPin, School as SchoolIcon } from 'lucide-react';
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

  // Redirect if already logged in
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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-gradient-to-tr from-indigo-50/50 via-slate-50 to-indigo-50/30">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center h-12 w-12 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/20 mb-3">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Create {institutionType === 'school' ? 'School' : 'College'} Account</h2>
          <p className="text-slate-400 text-sm mt-1">Start your 30-day CRM free trial</p>
        </div>

        {/* Institution Type Selector */}
        <div className="flex border border-slate-200 rounded-xl p-1 bg-slate-50 mb-6">
          <button
            type="button"
            onClick={() => setInstitutionType('school')}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${
              institutionType === 'school'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Signup as School
          </button>
          <button
            type="button"
            onClick={() => setInstitutionType('college')}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${
              institutionType === 'college'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Signup as College
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={institutionType === 'school' ? 'School Name' : 'College Name'}
            name="name"
            placeholder={institutionType === 'school' ? 'e.g. Oakridge Public School' : 'e.g. Oakridge University College'}
            required
            error={errors.name}
            {...register('name', { required: `${institutionType === 'school' ? 'School' : 'College'} name is required` })}
          />

          <Input
            label="Admin Email Address"
            name="email"
            type="email"
            placeholder="e.g. admin@institution.com"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Number"
              name="phone"
              placeholder="e.g. 9876543210"
              required
              error={errors.phone}
              {...register('phone', {
                required: 'Phone number is required',
                pattern: {
                  value: /^[0-9+() -]{10,15}$/,
                  message: 'Enter a valid phone number (10-15 digits)',
                },
              })}
            />

            {!googleData?.googleVerified ? (
              <Input
                label="Admin Password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                error={errors.password}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
              />
            ) : (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Admin Password</label>
                <div className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium">
                  Managed by Google
                </div>
              </div>
            )}
          </div>

          <Input
            label={institutionType === 'school' ? 'School Address' : 'College Address'}
            name="address"
            placeholder={institutionType === 'school' ? 'e.g. 123 Education Lane, Sector 4' : 'e.g. 456 University Boulevard'}
            required
            error={errors.address}
            {...register('address', { required: `${institutionType === 'school' ? 'School' : 'College'} address is required` })}
          />

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full py-3"
              isLoading={loading}
            >
              Sign Up & Get Started
            </Button>
          </div>

          {/* Google OAuth Login / Signup */}
          <GoogleLoginButton />
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-500">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
