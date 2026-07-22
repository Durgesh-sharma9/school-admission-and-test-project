import React, { useState, useEffect } from 'react';
import { useAuth } from '../../school/contexts/AuthContext';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import toast from 'react-hot-toast';
import api from '../../school/services/schoolApi';
import { Sparkles, FileText } from 'lucide-react';

const ThankYouCmsPage = () => {
  const { school, updateSchoolState } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState('');
  const [brochureUrl, setBrochureUrl] = useState('');

  useEffect(() => {
    if (school?.thankYouCms) {
      setBannerUrl(school.thankYouCms.banner || '');
      setBrochureUrl(school.thankYouCms.admissionBrochure?.url || '');
    }
  }, [school]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        thankYouCms: {
          banner: bannerUrl,
          admissionBrochure: {
            url: brochureUrl,
            type: brochureUrl.endsWith('.pdf') ? 'pdf' : 'image'
          }
        }
      };

      const res = await api.put('/settings/thankyou-cms', payload);
      if (res.success) {
        toast.success('Thank You CMS settings updated!');
        if (updateSchoolState) updateSchoolState(res.data);
      }
    } catch (error) {
      toast.error('Failed to update Thank You CMS settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Thank You Page Customizer</h2>
        <p className="text-slate-500 text-xs mt-0.5">Customize the public screen layout applicants see after submitting their college form.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b pb-1">CMS Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Post-Submission Welcome Banner Image URL"
            value={bannerUrl}
            onChange={e => setBannerUrl(e.target.value)}
            placeholder="e.g. https://images.unsplash.com/photo-university-campus"
          />
          <Input
            label="Prospectus / Brochure Download Link"
            value={brochureUrl}
            onChange={e => setBrochureUrl(e.target.value)}
            placeholder="e.g. https://college.edu/prospectus.pdf"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <Button type="submit" isLoading={loading} className="py-3 px-6 text-xs font-semibold inline-flex items-center">
            <Sparkles className="h-4.5 w-4.5 mr-1.5" /> Save CMS Layout
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ThankYouCmsPage;
