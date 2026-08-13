import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Globe, Mail, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import superAdminApi from '../services/superAdminApi';
import toast from 'react-hot-toast';

const Settings = () => {
  const [settings, setSettings] = useState({
    applicationName: '',
    applicationLogo: '',
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPassword: '',
    smtpFrom: '',
    maintenanceMode: false,
  });
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await superAdminApi.get('/settings');
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setSettings({
          applicationName: data.applicationName || 'School Admission CRM',
          applicationLogo: data.applicationLogo || '',
          smtpHost: data.smtpHost || 'smtp.gmail.com',
          smtpPort: data.smtpPort || '587',
          smtpUser: data.smtpUser || 'noreply@schoolcrm.com',
          smtpPassword: data.smtpPassword || '',
          smtpFrom: data.smtpFrom || 'noreply@schoolcrm.com',
          maintenanceMode: !!data.maintenanceMode,
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings from server');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaveLoading(true);
    try {
      const response = await superAdminApi.put('/settings', settings);
      if (response.data.success) {
        toast.success('System settings saved successfully!');
        if (response.data.data) {
          const data = response.data.data;
          setSettings({
            applicationName: data.applicationName || '',
            applicationLogo: data.applicationLogo || '',
            smtpHost: data.smtpHost || '',
            smtpPort: data.smtpPort || '',
            smtpUser: data.smtpUser || '',
            smtpPassword: data.smtpPassword || '',
            smtpFrom: data.smtpFrom || '',
            maintenanceMode: !!data.maintenanceMode,
          });
        }
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleToggle = (field) => {
    setSettings(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-900 rounded-2xl">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          <p className="text-slate-400 text-sm font-medium">Loading system configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left bg-slate-900 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
          <p className="text-slate-400 text-xs mt-0.5">Configure platform branding, SMTP mailer configurations, and operations mode</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* General Settings */}
        <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <Globe className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-lg font-bold text-white">General Settings</h2>
          </div>

          <div className="space-y-4">
            <Input
              label="Application Name"
              name="applicationName"
              type="text"
              value={settings.applicationName}
              onChange={(e) => setSettings({ ...settings, applicationName: e.target.value })}
            />

            <div>
              <label className="block text-xs font-bold text-slate-400 tracking-wide uppercase mb-2">
                Application Logo URL
              </label>
              <input
                name="applicationLogo"
                type="text"
                value={settings.applicationLogo}
                onChange={(e) => setSettings({ ...settings, applicationLogo: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* SMTP Settings */}
        <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <Mail className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white">SMTP Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="SMTP Host"
                  name="smtpHost"
                  type="text"
                  value={settings.smtpHost}
                  onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                />
              </div>
              <div>
                <Input
                  label="SMTP Port"
                  name="smtpPort"
                  type="text"
                  value={settings.smtpPort}
                  onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                />
              </div>
            </div>

            <Input
              label="SMTP Username"
              name="smtpUser"
              type="text"
              value={settings.smtpUser}
              onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
            />

            <Input
              label="SMTP Password"
              name="smtpPassword"
              type="password"
              value={settings.smtpPassword}
              onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
            />

            <Input
              label="From Email"
              name="smtpFrom"
              type="email"
              value={settings.smtpFrom}
              onChange={(e) => setSettings({ ...settings, smtpFrom: e.target.value })}
            />
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-lg font-bold text-white">System Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <div>
                <p className="font-bold text-white text-sm">Maintenance Mode</p>
                <p className="text-xs text-slate-400 mt-0.5">Disable the platform temporarily for database operations or updates</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('maintenanceMode')}
                className="p-1 rounded-lg hover:bg-slate-800 transition"
              >
                {settings.maintenanceMode ? (
                  <ToggleRight className="w-9 h-9 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-slate-500" />
                )}
              </button>
            </div>

            {settings.maintenanceMode && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-amber-400 text-xs font-medium">
                  ⚠️ Maintenance mode is active. Public signups and client access features will display a platform downtime banner.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            isLoading={saveLoading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wide transition shadow-md shadow-indigo-600/10 px-5 py-2.5"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
