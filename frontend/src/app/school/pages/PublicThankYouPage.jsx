import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Loader from '../../../shared/components/Loader';
import EnquiryBannerPreview from '../../../shared/components/EnquiryBannerPreview';
import {
  Sparkles,
  FileText,
  Facebook,
  Globe,
  PlusCircle,
  HelpCircle,
  Instagram,
  Twitter,
  Youtube,
  MessageCircle,
  Linkedin,
  Send
} from 'lucide-react';
import toast from 'react-hot-toast';

const formatExternalUrl = (url) => {
  if (!url) return '#';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const formatFileUrl = (url) => {
  if (!url) return '#';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const backendBase = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
    : 'http://localhost:5001';
  return `${backendBase}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
};

const PublicThankYouPage = () => {
  const params = useParams();
  const schoolId = params.schoolId || params.token || params.id;
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const isReception = searchParams.get('role') === 'reception';

  // Get details from form submit state redirects
  const submissionData = location.state || {
    studentName: 'Student',
    parentName: 'Parent',
    enquiryId: 'ENQ-XXXX-XXXX',
  };

  useEffect(() => {
    const fetchSchoolInfo = async () => {
      try {
        setLoading(true);
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
        const res = await axios.get(`${apiBaseUrl}/auth/public/school/${schoolId}`);
        if (res.data.success) {
          setSchoolInfo(res.data.school);
        }
      } catch (error) {
        console.error('Failed to fetch school CMS details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (schoolId) {
      fetchSchoolInfo();
    }
  }, [schoolId]);

  // Social icon mapper based on URL (legacy backup)
  const getSocialIconByUrl = (url) => {
    const lower = url.toLowerCase();
    if (lower.includes('facebook.com')) return <Facebook className="h-5 w-5 text-indigo-650" />;
    if (lower.includes('instagram.com')) return <Instagram className="h-5 w-5 text-pink-600" />;
    if (lower.includes('twitter.com') || lower.includes('x.com')) return <Twitter className="h-5 w-5 text-slate-800" />;
    if (lower.includes('youtube.com')) return <Youtube className="h-5 w-5 text-red-650" />;
    return <Globe className="h-5 w-5 text-slate-600" />;
  };

  // Social icon mapper based on Platform names (new standard)
  const getSocialIconByPlatform = (platform) => {
    switch (platform) {
      case 'Instagram':
        return <Instagram className="h-5 w-5 text-pink-600" />;
      case 'Facebook':
        return <Facebook className="h-5 w-5 text-indigo-650" />;
      case 'YouTube':
        return <Youtube className="h-5 w-5 text-red-600" />;
      case 'WhatsApp':
        return <MessageCircle className="h-5 w-5 text-emerald-600" />;
      case 'LinkedIn':
        return <Linkedin className="h-5 w-5 text-blue-700" />;
      case 'X (Twitter)':
        return <Twitter className="h-5 w-5 text-slate-800" />;
      case 'Telegram':
        return <Send className="h-5 w-5 text-sky-500" />;
      case 'School Website':
        return <Globe className="h-5 w-5 text-indigo-500" />;
      default:
        return <Globe className="h-5 w-5 text-slate-500" />;
    }
  };

  if (loading) {
    return <Loader fullPage message="Loading confirmation..." />;
  }

  if (!schoolInfo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white rounded-2xl p-8 border border-slate-100 shadow-sm space-y-4">
          <div className="h-12 w-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Invalid Page</h2>
          <p className="text-xs text-slate-400">
            This school admission page does not exist.
          </p>
        </div>
      </div>
    );
  }

  const cms = schoolInfo.thankYouCms || {};

  return (
    <div className="min-h-screen bg-slate-50 bg-gradient-to-tr from-indigo-50/20 via-slate-50 to-indigo-50/10 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <EnquiryBannerPreview
          logo={schoolInfo.logo}
          name={schoolInfo.name}
          cms={schoolInfo.thankYouCms}
          submissionData={submissionData}
          type="school"
          isMock={false}
        />
      </div>
    </div>
  );
};

export default PublicThankYouPage;
