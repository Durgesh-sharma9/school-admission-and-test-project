import React, { useState } from 'react';
import { User, Mail, Lock, LogOut, Camera, Save } from 'lucide-react';
import { useSuperAdminAuth } from '../contexts/SuperAdminAuthContext';
import Button from '../../../shared/components/Button';
import toast from 'react-hot-toast';

const Profile = () => {
  const { superAdmin, logout, updateProfile } = useSuperAdminAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: superAdmin?.name || '',
    email: superAdmin?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(formData.name, formData.email);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await updateProfile(formData.name, formData.email, formData.currentPassword, formData.newPassword);
      toast.success('Password changed successfully!');
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (error) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/super-admin/login';
  };

  return (
    <div className="space-y-4 text-left bg-slate-900 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="border-b border-slate-800 pb-3">
        <h1 className="text-xl font-bold text-white tracking-tight">Profile Settings</h1>
        <p className="text-slate-400 text-[11px] mt-0.5">Manage your super admin account credentials and profile details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile Card */}
        <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="w-20 h-20 bg-indigo-605 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/10">
                <span className="text-2xl font-bold text-white uppercase">
                  {superAdmin?.name?.charAt(0) || 'S'}
                </span>
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 bg-slate-800 border border-slate-700 rounded-full hover:bg-slate-700 transition">
                <Camera className="w-3.5 h-3.5 text-slate-300" />
              </button>
            </div>
            <h2 className="text-base font-bold text-white leading-tight">{superAdmin?.name || 'Super Admin'}</h2>
            <p className="text-xs text-slate-400 mt-1">{superAdmin?.email || 'admin@platform.com'}</p>
            <div className="mt-3.5 px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
              Super Admin Role
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full text-xs py-2 text-rose-455 text-rose-400 hover:text-rose-350 hover:bg-rose-500/10 flex items-center justify-center gap-2 border border-rose-500/10 rounded-xl"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout Session
            </Button>
          </div>
        </div>

        {/* Profile Settings Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Basic Information */}
          <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <User className="w-4 h-4 text-indigo-400" />
              </div>
              <h2 className="text-base font-bold text-white">Basic Information</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-400 tracking-wide uppercase mb-1.5">
                  Full Name
                </label>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Super Admin Name"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 tracking-wide uppercase mb-1.5">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@platform.com"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  isLoading={loading}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wide transition shadow-md shadow-indigo-600/10 px-4 py-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <Lock className="w-4 h-4 text-emerald-400" />
              </div>
              <h2 className="text-base font-bold text-white">Change Password</h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-400 tracking-wide uppercase mb-1.5">
                  Current Password
                </label>
                <input
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 tracking-wide uppercase mb-1.5">
                  New Password
                </label>
                <input
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 tracking-wide uppercase mb-1.5">
                  Confirm New Password
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  isLoading={loading}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wide transition shadow-md shadow-indigo-600/10 px-4 py-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
