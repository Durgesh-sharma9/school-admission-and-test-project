import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Loader from '../../../shared/components/Loader';
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
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
        
        {/* Top school branding block */}
        <div className="bg-indigo-600 p-6 flex flex-col items-center text-center space-y-2 text-white">
          {schoolInfo.logo ? (
            <img
              src={schoolInfo.logo}
              alt={schoolInfo.name || 'School'}
              className="h-12 w-12 rounded-xl object-cover bg-white p-0.5 mb-1"
            />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center font-extrabold text-white text-xl">
              {(schoolInfo.name || 'S').charAt(0).toUpperCase()}
            </div>
          )}
          <h3 className="font-bold text-base">{schoolInfo.name || 'School'}</h3>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-8 space-y-6 text-center">
          
          {/* 1. Success Message */}
          <div className="space-y-4">
            <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                Enquiry Submitted!
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed px-2">
                Dear <span className="font-semibold text-slate-700">{submissionData.parentName}</span>, your admission enquiry for <span className="font-semibold text-slate-700">{submissionData.studentName}</span> has been saved.
              </p>
            </div>

            {/* Enquiry details ID card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100/50">
                <span className="text-slate-400 font-semibold uppercase">Registration Status</span>
                <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[10px]">
                  New Enquiry
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2">
                <span className="text-slate-400 font-semibold uppercase">Enquiry ID</span>
                <span className="font-black text-slate-800 tracking-wide">
                  {submissionData.enquiryId}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Banner Image */}
          {(cms.banner || cms.imageUrl) && (
            <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
              <img
                src={cms.banner || cms.imageUrl}
                alt="School Banner"
                className="w-full h-36 object-cover"
              />
            </div>
          )}

          {/* 3. Download Admission Brochure (only if uploaded) */}
          {((cms.admissionBrochure && cms.admissionBrochure.url) || cms.pdfUrl) && (
            <a
              href={formatFileUrl((cms.admissionBrochure && cms.admissionBrochure.url) || cms.pdfUrl)}
              download={(cms.admissionBrochure && cms.admissionBrochure.filename) || 'Admission_Brochure'}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download Admission Brochure ({((cms.admissionBrochure && cms.admissionBrochure.type) || 'pdf') === 'pdf' ? 'PDF' : 'Image'})
            </a>
          )}

          {/* 4. Download Fee Structure (only if uploaded) */}
          {(cms.feeStructure && cms.feeStructure.url) && (
            <a
              href={formatFileUrl(cms.feeStructure.url)}
              download={cms.feeStructure.filename || 'Fee_Structure'}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-md transition-colors"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download Fee Structure ({cms.feeStructure.type === 'pdf' ? 'PDF' : 'Image'})
            </a>
          )}

          {/* 5. Follow Us & Social Icons */}
          {(((cms.socialLinks && cms.socialLinks.length > 0) || cms.socialLink1 || cms.socialLink2)) && (
            <div className="space-y-3 pt-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                Stay Connected
              </span>
              <div className="flex justify-center gap-3">
                {cms.socialLinks && cms.socialLinks.length > 0 ? (
                  cms.socialLinks.map((link, lIdx) => (
                    <a
                      key={lIdx}
                      href={formatExternalUrl(link.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 bg-slate-50 border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 rounded-full text-slate-650 hover:text-indigo-600 transition-all shadow-xs"
                      title={link.platform}
                    >
                      {getSocialIconByPlatform(link.platform)}
                    </a>
                  ))
                ) : (
                  <>
                    {cms.socialLink1 && (
                      <a
                        href={formatExternalUrl(cms.socialLink1)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-slate-50 border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 rounded-full text-slate-600 hover:text-indigo-600 transition-all shadow-xs"
                        title="Follow Us"
                      >
                        {getSocialIconByUrl(cms.socialLink1)}
                      </a>
                    )}
                    {cms.socialLink2 && (
                      <a
                        href={formatExternalUrl(cms.socialLink2)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-slate-50 border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 rounded-full text-slate-600 hover:text-indigo-600 transition-all shadow-xs"
                        title="Follow Us"
                      >
                        {getSocialIconByUrl(cms.socialLink2)}
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Actions depending on role */}
          <div className="pt-4 border-t border-slate-100">
            {isReception ? (
              <button
                onClick={() => navigate(`/public/admission/${schoolId}?role=reception`)}
                className="w-full flex items-center justify-center px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-colors gap-2"
              >
                <PlusCircle className="h-4.5 w-4.5" />
                Register Another Student
              </button>
            ) : (
              <div className="text-[10px] text-slate-400 italic">
                You can close this window now. We have sent a confirmation copy to our desk.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default PublicThankYouPage;
