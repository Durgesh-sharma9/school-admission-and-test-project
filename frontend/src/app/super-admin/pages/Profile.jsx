import React, { useState } from 'react';
import { User, Mail, Lock, LogOut, Camera, Save } from 'lucide-react';
import { useSuperAdminAuth } from '../contexts/SuperAdminAuthContext';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-slate-400">Manage your account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {superAdmin?.name?.charAt(0) || 'S'}
                </span>
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-slate-700 rounded-full hover:bg-slate-600">
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
            <h2 className="text-xl font-bold text-white">{superAdmin?.name || 'Super Admin'}</h2>
            <p className="text-slate-400">{superAdmin?.email || 'admin@platform.com'}</p>
            <div className="mt-4 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-sm font-medium">
              Super Admin
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <User className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Basic Information</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Input
                label="Full Name"
                name="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  isLoading={loading}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Lock className="w-5 h-5 text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Change Password</h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="Current Password"
                name="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              />

              <Input
                label="New Password"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              />

              <Input
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  isLoading={loading}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
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
