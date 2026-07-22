import React, { useState } from 'react';
import { useAuth } from '../../school/contexts/AuthContext';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import toast from 'react-hot-toast';
import api from '../../school/services/schoolApi';
import { Settings } from 'lucide-react';

const SettingsPage = () => {
  const { school, updateSchoolState } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(school?.name || '');
  const [phone, setPhone] = useState(school?.phone || '');
  const [address, setAddress] = useState(school?.address || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/settings', { name, phone, address });
      if (res.success) {
        toast.success('College profile settings saved!');
        if (updateSchoolState) updateSchoolState(res.data);
      }
    } catch (error) {
      toast.error('Failed to save settings details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800">College Settings</h2>
        <p className="text-slate-500 text-xs mt-0.5">Manage administrative credentials and university profile configurations.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b pb-1">University Profile Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="College/University Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <Input
            label="Contact Helpline Number"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
          />
          <div className="md:col-span-2">
            <Input
              label="Permanent Campus Address"
              value={address}
              onChange={e => setAddress(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button type="submit" isLoading={loading} className="py-3 px-6 text-xs font-semibold inline-flex items-center">
            <Settings className="h-4.5 w-4.5 mr-1.5" /> Save Profile Details
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
