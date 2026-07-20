import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSuperAdminAuth } from '../../../shared/contexts/SuperAdminAuthContext';
import toast from 'react-hot-toast';
import { Shield } from 'lucide-react';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';

const SuperAdminLogin = () => {
  const { login, superAdmin } = useSuperAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    }
  });

  // Redirect if already logged in and coming from protected route
  React.useEffect(() => {
    if (superAdmin && location.state?.from?.pathname) {
      navigate(location.state.from.pathname, { replace: true });
    }
  }, [superAdmin, navigate, location]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await login(data.email, data.password);
      if (response.success) {
        toast.success('Logged in successfully!');
        const origin = location.state?.from?.pathname || '/super-admin/dashboard';
        navigate(origin, { replace: true });
      }
    } catch (error) {
      toast.error(error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center h-12 w-12 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/20 mb-3">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Super Admin Portal</h2>
          <p className="text-slate-400 text-sm mt-1">Manage the SaaS platform</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="superadmin@platform.com"
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
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 tracking-wide uppercase">
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

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full py-3"
              isLoading={loading}
            >
              Sign In
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-400">
          <Link to="/" className="text-indigo-400 hover:text-indigo-300">
            ← Back to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
