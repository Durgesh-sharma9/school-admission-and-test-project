import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Globe, Mail, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';

const Settings = () => {
  const [settings, setSettings] = useState({
    applicationName: 'School Admission CRM',
    applicationLogo: '',
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    smtpFrom: '',
    maintenanceMode: false,
  });
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Mock data for now - will be replaced with actual API call
      setSettings({
        applicationName: 'School Admission CRM',
        applicationLogo: '',
        smtpHost: 'smtp.gmail.com',
        smtpPort: '587',
        smtpUser: 'noreply@schoolcrm.com',
        smtpPassword: '••••••••',
        smtpFrom: 'noreply@schoolcrm.com',
        maintenanceMode: false,
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      // await superAdminApi.put('/settings', settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleToggle = (field) => {
    setSettings(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400">Configure application settings</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Settings */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Globe className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">General Settings</h2>
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
              <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase mb-1">
                Application Logo URL
              </label>
              <input
                name="applicationLogo"
                type="text"
                value={settings.applicationLogo}
                onChange={(e) => setSettings({ ...settings, applicationLogo: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* SMTP Settings */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Mail className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">SMTP Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="SMTP Host"
                name="smtpHost"
                type="text"
                value={settings.smtpHost}
                onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
              />
              <Input
                label="SMTP Port"
                name="smtpPort"
                type="text"
                value={settings.smtpPort}
                onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
              />
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
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">System Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div>
                <p className="font-medium text-white">Maintenance Mode</p>
                <p className="text-sm text-slate-400">Disable the platform for maintenance</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('maintenanceMode')}
                className="p-2 rounded-lg"
              >
                {settings.maintenanceMode ? (
                  <ToggleRight className="w-6 h-6 text-green-400" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-400" />
                )}
              </button>
            </div>

            {settings.maintenanceMode && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  ⚠️ Maintenance mode is enabled. Users will see a maintenance page.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            isLoading={saveLoading}
            className="flex items-center gap-2"
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
