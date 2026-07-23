import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import Loader from '../../../shared/components/Loader';
import { 
  CheckCircle2, 
  Download, 
  Phone, 
  Mail, 
  Globe, 
  MessageSquare,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube
} from 'lucide-react';

const PublicThankYouPage = () => {
  const { schoolId } = useParams();
  const location = useLocation();
  const [collegeInfo, setCollegeInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const { studentName, applicationId } = location.state || {
    studentName: 'Applicant',
    applicationId: 'N/A'
  };

  useEffect(() => {
    const fetchCollegeInfo = async () => {
      try {
        setLoading(true);
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
        const res = await axios.get(`${apiBaseUrl}/auth/public/school/${schoolId}`);
        if (res.data.success) {
          setCollegeInfo(res.data.school);
        }
      } catch (error) {
        console.error('Failed to load college details:', error);
      } finally {
        setLoading(false);
      }
    };
    if (schoolId) {
      fetchCollegeInfo();
    }
  }, [schoolId]);

  if (loading) {
    return <Loader fullPage message="Loading confirmation details..." />;
  }

  // Social icons helper
  const getSocialIcon = (platform) => {
    const name = platform.toLowerCase();
    if (name.includes('facebook')) return <Facebook className="h-5 w-5" />;
    if (name.includes('instagram')) return <Instagram className="h-5 w-5" />;
    if (name.includes('linkedin')) return <Linkedin className="h-5 w-5" />;
    if (name.includes('twitter') || name.includes('x.com')) return <Twitter className="h-5 w-5" />;
    if (name.includes('youtube')) return <Youtube className="h-5 w-5" />;
    return <Globe className="h-5 w-5" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-left">
      <div className="max-w-xl w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl space-y-6 text-center">
        {/* Animated Check Icon */}
        <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        {/* Welcome Headers */}
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-800">Application Submitted Successfully!</h2>
          <p className="text-xs text-slate-500 leading-normal">
            Thank you, <span className="font-bold text-slate-700">{studentName}</span>. Your application for admission has been registered successfully.
          </p>
        </div>

        {/* Application Reference Card */}
        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Your Application ID</span>
          <span className="text-xl font-mono font-extrabold text-indigo-650 tracking-wide mt-1 block">{applicationId}</span>
          <p className="text-[9px] text-slate-400 mt-2">Please quote this ID for counselling updates and verification lookups.</p>
        </div>

        {/* Dynamic Action Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Download Brochure (If exists) */}
          {collegeInfo?.thankYouCms?.admissionBrochure?.url && (
            <a
              href={collegeInfo.thankYouCms.admissionBrochure.url}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-xs"
            >
              <Download className="h-4 w-4" />
              <span>Download Brochure</span>
            </a>
          )}

          {/* Chat on WhatsApp */}
          {collegeInfo?.phone && (
            <a
              href={`https://wa.me/${collegeInfo.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
            >
              <MessageSquare className="h-4 w-4" />
              <span>WhatsApp Admission Help</span>
            </a>
          )}

          {/* Visit Website */}
          {collegeInfo?.website && (
            <a
              href={collegeInfo.website}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 sm:col-span-2"
            >
              <Globe className="h-4 w-4" />
              <span>Visit Website</span>
            </a>
          )}
        </div>

        {/* Contact Admission Office details */}
        {(collegeInfo?.phone || collegeInfo?.admissionEmail) && (
          <div className="border-t border-slate-100 pt-5 space-y-3 text-center">
            <h4 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Contact Admission Office</h4>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-semibold text-slate-650">
              {collegeInfo?.phone && (
                <div className="flex items-center space-x-1.5">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{collegeInfo.phone}</span>
                </div>
              )}
              {collegeInfo?.admissionEmail && (
                <div className="flex items-center space-x-1.5">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{collegeInfo.admissionEmail}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Social media connections */}
        {collegeInfo?.thankYouCms?.socialLinks?.length > 0 && (
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <h4 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Follow Us</h4>
            <div className="flex items-center justify-center gap-3">
              {collegeInfo.thankYouCms.socialLinks.map((social) => (
                <a
                  key={social._id}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-650 rounded-xl border border-slate-100 transition-colors shadow-2xs"
                  title={social.platform}
                >
                  {getSocialIcon(social.platform)}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 text-[10px] text-slate-400 font-medium">
          Powered by {collegeInfo?.name || 'College Admin'}
        </div>
      </div>
    </div>
  );
};

export default PublicThankYouPage;
