import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';
import {
  Sparkles,
  FileText,
  Facebook,
  Globe,
  PlusCircle,
  HelpCircle,
  Home,
  Instagram,
  Twitter,
  Youtube
} from 'lucide-react';
import toast from 'react-hot-toast';

const PublicThankYouPage = () => {
  const { schoolId } = useParams();
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

  // Clean social icons mapper
  const getSocialIcon = (url) => {
    const lower = url.toLowerCase();
    if (lower.includes('facebook.com')) return <Facebook className="h-5 w-5 text-indigo-600" />;
    if (lower.includes('instagram.com')) return <Instagram className="h-5 w-5 text-pink-600" />;
    if (lower.includes('twitter.com') || lower.includes('x.com')) return <Twitter className="h-5 w-5 text-slate-800" />;
    if (lower.includes('youtube.com')) return <Youtube className="h-5 w-5 text-red-600" />;
    return <Globe className="h-5 w-5 text-slate-600" />;
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
        
        {/* Banner image if configured */}
        {cms.imageUrl ? (
          <div className="h-36 relative overflow-hidden">
            <img
              src={cms.imageUrl}
              alt="School Banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
            <div className="absolute bottom-4 left-6 flex items-center space-x-3">
              {schoolInfo.logo && (
                <img
                  src={schoolInfo.logo}
                  alt={schoolInfo.name}
                  className="h-10 w-10 rounded-lg object-cover bg-white p-0.5"
                />
              )}
              <span className="font-bold text-white text-sm tracking-wide truncate max-w-[200px]">
                {schoolInfo?.name || 'School'}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-indigo-650 p-6 flex flex-col items-center text-center space-y-2 text-white bg-indigo-600">
            {schoolInfo?.logo ? (
              <img
                src={schoolInfo.logo}
                alt={schoolInfo.name || 'School'}
                className="h-12 w-12 rounded-xl object-cover bg-white p-0.5 mb-1"
              />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center font-extrabold text-white text-xl">
                {(schoolInfo?.name || 'S').charAt(0).toUpperCase()}
              </div>
            )}
            <h3 className="font-bold text-base">{schoolInfo?.name || 'School'}</h3>
          </div>
        )}

        {/* Content body */}
        <div className="p-6 sm:p-8 space-y-6 text-center">
          
          {/* Sparkle Success Circle */}
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

          {/* Enquiry details card */}
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

          {/* Brochure PDF download option */}
          {cms.pdfUrl && (
            <a
              href={cms.pdfUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download Admission Brochure
            </a>
          )}

          {/* Social connections */}
          {(cms.socialLink1 || cms.socialLink2) && (
            <div className="space-y-3 pt-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                Stay Connected
              </span>
              <div className="flex justify-center gap-3">
                {cms.socialLink1 && (
                  <a
                    href={cms.socialLink1}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-slate-50 border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 rounded-full text-slate-600 hover:text-indigo-600 transition-all shadow-xs"
                    title="Follow Social Link 1"
                  >
                    {getSocialIcon(cms.socialLink1)}
                  </a>
                )}
                {cms.socialLink2 && (
                  <a
                    href={cms.socialLink2}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-slate-50 border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 rounded-full text-slate-600 hover:text-indigo-600 transition-all shadow-xs"
                    title="Follow Social Link 2"
                  >
                    {getSocialIcon(cms.socialLink2)}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Actions depending on role (Receptionist or normal parent) */}
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
