import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import toast from 'react-hot-toast';
import {
  School,
  ShieldAlert,
  Upload,
  Trash2,
  Eye,
  MessageSquare,
  Mail,
  Plus,
  Check
} from 'lucide-react';

const SettingsPage = () => {
  const { school, updateSchoolState } = useAuth();
  
  // Tab control: 'school', 'password', 'templates'
  const [activeTab, setActiveTab] = useState('school');

  // School Form states
  const [name, setName] = useState(school?.name || '');
  const [phone, setPhone] = useState(school?.phone || '');
  const [address, setAddress] = useState(school?.address || '');
  const [logo, setLogo] = useState(school?.logo || '');
  const [minorTypingValidation, setMinorTypingValidation] = useState(
    school?.settings?.minorTypingValidation || false
  );
  
  const [savingSchool, setSavingSchool] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Template Form states
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('whatsapp'); // whatsapp or email
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Logo upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo image must be under 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setUploadingLogo(true);

    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
      const res = await fetch(`${apiBaseUrl}/settings/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const response = await res.json();

      if (response.success) {
        setLogo(response.fileUrl);
        toast.success('Logo uploaded successfully! Save changes to apply.');
      } else {
        toast.error(response.message || 'Logo upload failed');
      }
    } catch (err) {
      toast.error('Connection error during upload');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Delete logo
  const handleDeleteLogo = () => {
    setLogo('');
    toast.success('Logo cleared. Save changes to update.');
  };

  // Save School details settings
  const handleSaveSchool = async (e) => {
    e.preventDefault();
    if (!name || !phone || !address) {
      toast.error('All school identity fields are required');
      return;
    }

    setSavingSchool(true);
    try {
      // 1. Save general profile
      const response = await api.put('/settings', {
        name,
        phone,
        address,
        logo,
      });

      // 2. Save spelling setting
      await api.put('/settings/spelling', { minorTypingValidation });

      if (response.success) {
        toast.success('School settings saved successfully!');
        
        // Sync React Auth Context state
        const syncedSchool = {
          ...response.school,
          settings: { minorTypingValidation },
          communicationTemplates: school.communicationTemplates // preserve templates
        };
        updateSchoolState(syncedSchool);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSavingSchool(false);
    }
  };

  // Change Password
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Confirm password does not match new password');
      return;
    }

    setSavingPassword(true);
    try {
      const response = await api.put('/settings/password', {
        currentPassword,
        newPassword,
      });

      if (response.success) {
        toast.success('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.message || 'Password update failed');
    } finally {
      setSavingPassword(false);
    }
  };

  // Save Communication Template
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!templateName || !templateBody) {
      toast.error('Please fill in template name and message content');
      return;
    }

    setSavingTemplate(true);
    try {
      const response = await api.post('/settings/templates', {
        name: templateName,
        type: templateType,
        subject: templateSubject,
        body: templateBody,
      });

      if (response.success) {
        toast.success('Communication template saved successfully!');
        // Update user auth state
        updateSchoolState({
          ...school,
          communicationTemplates: response.templates,
        });

        // Reset fields
        setTemplateName('');
        setTemplateSubject('');
        setTemplateBody('');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  // Delete Communication Template
  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      const response = await api.delete(`/settings/templates/${templateId}`);
      if (response.success) {
        toast.success('Template deleted successfully');
        updateSchoolState({
          ...school,
          communicationTemplates: response.templates,
        });
      }
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl text-left">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Settings</h2>
        <p className="text-slate-500 text-sm mt-0.5">
          Manage your school's public identity, evaluation criteria, communication templates, and credentials.
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('school')}
          className={`px-4 py-2.5 font-semibold text-xs tracking-wider uppercase border-b-2 transition-all ${
            activeTab === 'school'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          School Identity & Preferences
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2.5 font-semibold text-xs tracking-wider uppercase border-b-2 transition-all ${
            activeTab === 'templates'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Communication Templates
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`px-4 py-2.5 font-semibold text-xs tracking-wider uppercase border-b-2 transition-all ${
            activeTab === 'password'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Security & Password
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'school' && (
        <form onSubmit={handleSaveSchool} className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Logo upload display */}
              <div className="flex flex-col items-center space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">School Logo</span>
                <div className="relative h-28 w-28 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                  {logo ? (
                    <img src={logo} alt="School Logo" className="h-full w-full object-cover" />
                  ) : (
                    <School className="h-10 w-10 text-slate-300" />
                  )}
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center text-xs font-semibold text-white">
                      ...
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1"
                    >
                      <Upload className="h-3 w-3" />
                      Upload
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="absolute inset-0 opacity-0 w-full cursor-pointer"
                    />
                  </div>
                  {logo && (
                    <button
                      type="button"
                      onClick={handleDeleteLogo}
                      className="px-2.5 py-1.5 rounded-lg border border-red-100 text-xs font-semibold text-red-600 bg-white hover:bg-red-50 flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* School Details Inputs */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
                <Input
                  label="School Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Contact Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Official Address"
                    type="textarea"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Spelling Preferences Panel */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">
              Assessment Evaluation Settings
            </h3>
            
            <label className="flex items-start p-4 rounded-xl border border-slate-150 cursor-pointer hover:bg-slate-50 transition-colors select-none">
              <input
                type="checkbox"
                checked={minorTypingValidation}
                onChange={(e) => setMinorTypingValidation(e.target.checked)}
                className="mt-0.5 h-4.5 w-4.5 text-indigo-650 focus:ring-indigo-500/20"
              />
              <div className="ml-3 space-y-0.5">
                <span className="text-xs font-bold text-slate-800">
                  Enable Minor Typing Validation Tolerance
                </span>
                <p className="text-[10px] text-slate-400 leading-normal">
                  If checked, the auto-grading engine relaxes matching checks for **One Word** and **Fill in the Blank** questions, allowing minor typing typos (edit distance limit of up to 1 typo character).
                </p>
              </div>
            </label>
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={savingSchool}>
              Save System Preferences
            </Button>
          </div>
        </form>
      )}

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Template Creator Form */}
          <form onSubmit={handleSaveTemplate} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-5 lg:col-span-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Create Message Template
            </span>

            <Input
              label="Template Name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Admission Confirmation"
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Template Category
              </label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="whatsapp">WhatsApp Message</option>
                <option value="email">Email Message</option>
              </select>
            </div>

            {templateType === 'email' && (
              <Input
                label="Email Subject"
                value={templateSubject}
                onChange={(e) => setTemplateSubject(e.target.value)}
                placeholder="e.g. Your Admission Enquiry Update"
                required={templateType === 'email'}
              />
            )}

            <div>
              <Input
                label="Message Body Content"
                type="textarea"
                value={templateBody}
                onChange={(e) => setTemplateBody(e.target.value)}
                placeholder="Enter template body..."
                rows={6}
                required
              />
              
              {/* Placeholders Guide */}
              <div className="mt-2 bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-500 space-y-1">
                <span className="font-bold text-slate-700">Dynamic Variable Placeholders:</span>
                <p>Use variables to auto-populate CRM values:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li><code className="font-bold text-indigo-650">[Parent Name]</code> - Parent's full name</li>
                  <li><code className="font-bold text-indigo-650">[Student Name]</code> - Candidate student name</li>
                  <li><code className="font-bold text-indigo-650">[Enquiry ID]</code> - Auto-generated CRM reference</li>
                </ul>
              </div>
            </div>

            <Button type="submit" isLoading={savingTemplate} className="w-full">
              <Plus className="h-4 w-4 mr-1.5" />
              Save Template
            </Button>
          </form>

          {/* Templates Index List */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs lg:col-span-2 space-y-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Saved Templates ({school?.communicationTemplates?.length || 0})
            </span>

            {!school?.communicationTemplates || school.communicationTemplates.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-150 rounded-xl">
                No templates configured yet. Use the sidebar form to add templates.
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {school.communicationTemplates.map((tpl) => (
                  <div key={tpl._id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between hover:bg-slate-100/50 transition-colors">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-800 text-xs">{tpl.name}</h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold ${
                            tpl.type === 'whatsapp'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-blue-50 text-blue-700 border border-blue-105'
                          }`}>
                            {tpl.type === 'whatsapp' ? 'WhatsApp' : 'Email'}
                          </span>
                        </div>
                        {tpl.type === 'email' && (
                          <p className="text-[10px] font-semibold text-slate-500">
                            Subject: <span className="font-normal">{tpl.subject}</span>
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl._id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete Template"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 bg-white border border-slate-50 rounded-xl p-3 text-[11px] text-slate-600 whitespace-pre-wrap leading-relaxed font-medium">
                      {tpl.body}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {activeTab === 'password' && (
        <form onSubmit={handleSavePassword} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6 max-w-xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Change Password
          </span>

          <div className="space-y-4">
            <Input
              label="Current Administrator Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Input
              label="New Password (min 6 characters)"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="pt-4 border-t border-slate-50 flex justify-end">
            <Button type="submit" isLoading={savingPassword} variant="danger">
              Update Admin Password
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SettingsPage;
