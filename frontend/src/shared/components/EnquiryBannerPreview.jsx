import React from 'react';
import {
  Sparkles,
  FileText,
  Facebook,
  Globe,
  Instagram,
  Twitter,
  Youtube,
  MessageCircle,
  Linkedin,
  Send,
  Download,
  Phone,
  Mail,
  CheckCircle2,
  HelpCircle,
  MessageSquare
} from 'lucide-react';

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

const EnquiryBannerPreview = ({
  logo,
  name,
  cms = {},
  submissionData = {},
  type = 'school',
  isMock = false
}) => {
  const finalCms = cms || {};
  const studentName = submissionData.studentName || (type === 'school' ? 'Student' : 'Applicant');
  const parentName = submissionData.parentName || 'Parent';
  const enquiryId = submissionData.enquiryId || submissionData.applicationId || 'ENQ-2026-X83K';

  // Social icon mapper
  const getSocialIconByPlatform = (platform) => {
    switch (platform) {
      case 'Instagram':
        return <Instagram className="h-4.5 w-4.5 text-pink-600" />;
      case 'Facebook':
        return <Facebook className="h-4.5 w-4.5 text-indigo-650" />;
      case 'YouTube':
        return <Youtube className="h-4.5 w-4.5 text-red-600" />;
      case 'WhatsApp':
        return <MessageCircle className="h-4.5 w-4.5 text-emerald-600" />;
      case 'LinkedIn':
        return <Linkedin className="h-4.5 w-4.5 text-blue-700" />;
      case 'X (Twitter)':
        return <Twitter className="h-4.5 w-4.5 text-slate-800" />;
      case 'Telegram':
        return <Send className="h-4.5 w-4.5 text-sky-500" />;
      case 'School Website':
        return <Globe className="h-4.5 w-4.5 text-indigo-505" />;
      default:
        return <Globe className="h-4.5 w-4.5 text-slate-500" />;
    }
  };

  const getPlatformIcon = (platform, className = "h-4 w-4") => {
    switch (platform) {
      case 'Instagram':
        return <Instagram className={className} />;
      case 'Facebook':
        return <Facebook className={className} />;
      case 'YouTube':
        return <Youtube className={className} />;
      case 'WhatsApp':
        return <MessageCircle className={className} />;
      case 'LinkedIn':
        return <Linkedin className={className} />;
      case 'X (Twitter)':
        return <Twitter className={className} />;
      case 'Telegram':
        return <Send className={className} />;
      case 'School Website':
        return <Globe className={className} />;
      default:
        return <Globe className={className} />;
    }
  };

  const bannerUrl = finalCms.banner || finalCms.imageUrl || '';
  const brochureUrl = finalCms.admissionBrochure?.url || finalCms.pdfUrl || '';
  const brochureFilename = finalCms.admissionBrochure?.filename || 'Admission_Brochure.pdf';
  const brochureType = finalCms.admissionBrochure?.type || 'pdf';

  const feeUrl = finalCms.feeStructure?.url || '';
  const feeFilename = finalCms.feeStructure?.filename || 'Fee_Structure.pdf';
  const feeType = finalCms.feeStructure?.type || 'pdf';

  const socialLinks = finalCms.socialLinks || [];

  if (type === 'school') {
    return (
      <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col text-slate-800 text-center font-sans">
        {/* Top school branding block */}
        <div className="bg-indigo-600 p-6 flex flex-col items-center text-center space-y-2 text-white">
          {logo ? (
            <img
              src={logo}
              alt={name || 'School Logo'}
              className="h-12 w-12 rounded-xl object-cover bg-white p-0.5 mb-1"
            />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center font-extrabold text-white text-xl">
              {(name || 'S').charAt(0).toUpperCase()}
            </div>
          )}
          <h3 className="font-bold text-base">{name || 'School Name'}</h3>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-8 space-y-6 text-center overflow-y-auto">
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
                Dear <span className="font-semibold text-slate-700">{parentName}</span>, your admission enquiry for <span className="font-semibold text-slate-700">{studentName}</span> has been saved.
              </p>
            </div>

            {/* Enquiry details ID card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100/50">
                <span className="text-slate-400 font-semibold uppercase">Registration Status</span>
                <span className="font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[10px]">
                  New Enquiry
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2">
                <span className="text-slate-400 font-semibold uppercase">Enquiry ID</span>
                <span className="font-black text-slate-800 tracking-wide">
                  {enquiryId}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Banner Image */}
          {bannerUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
              <img
                src={bannerUrl}
                alt="School Banner"
                className="w-full h-36 object-cover"
              />
            </div>
          )}

          {/* 3. Download Admission Brochure (only if uploaded) */}
          {brochureUrl && (
            <a
              href={isMock ? '#' : formatFileUrl(brochureUrl)}
              download={brochureFilename}
              target={isMock ? '_self' : '_blank'}
              rel="noreferrer"
              onClick={(e) => { if (isMock) { e.preventDefault(); toast.success('Mock Brochure download clicked'); } }}
              className="w-full inline-flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download Admission Brochure ({brochureType === 'pdf' ? 'PDF' : 'Image'})
            </a>
          )}

          {/* 4. Download Fee Structure (only if uploaded) */}
          {feeUrl && (
            <a
              href={isMock ? '#' : formatFileUrl(feeUrl)}
              download={feeFilename}
              target={isMock ? '_self' : '_blank'}
              rel="noreferrer"
              onClick={(e) => { if (isMock) { e.preventDefault(); toast.success('Mock Fee Structure download clicked'); } }}
              className="w-full inline-flex items-center justify-center px-4 py-3 bg-amber-500 hover:bg-amber-605 text-white rounded-xl font-bold text-xs shadow-md transition-colors"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download Fee Structure ({feeType === 'pdf' ? 'PDF' : 'Image'})
            </a>
          )}

          {/* 5. Follow Us & Social Icons */}
          {socialLinks.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                Stay Connected
              </span>
              <div className="flex justify-center gap-3">
                {socialLinks.map((link, lIdx) => (
                  <a
                    key={lIdx}
                    href={isMock ? '#' : formatExternalUrl(link.url)}
                    target={isMock ? '_self' : '_blank'}
                    rel="noreferrer"
                    onClick={(e) => { if (isMock) { e.preventDefault(); toast.success(`Mock link to ${link.platform} clicked`); } }}
                    className="p-2.5 bg-slate-50 border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 rounded-full text-slate-650 hover:text-indigo-600 transition-all shadow-xs"
                    title={link.platform}
                  >
                    {getSocialIconByPlatform(link.platform)}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions depending on role */}
          <div className="pt-4 border-t border-slate-100">
            <div className="text-[10px] text-slate-400 italic">
              You can close this window now. We have sent a confirmation copy to our desk.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // College View Layout
  return (
    <div className="w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl space-y-6 text-slate-800 text-center font-sans">
      {/* Animated Check Icon */}
      <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
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
        <span className="text-xl font-mono font-extrabold text-indigo-650 tracking-wide mt-1 block">{enquiryId}</span>
        <p className="text-[9px] text-slate-400 mt-2">Please quote this ID for counselling updates and verification lookups.</p>
      </div>

      {/* Banner image if college banner CMS exists */}
      {bannerUrl && (
        <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
          <img
            src={bannerUrl}
            alt="College Banner"
            className="w-full h-36 object-cover"
          />
        </div>
      )}

      {/* Dynamic Action Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {/* Download Brochure (If exists) */}
        {brochureUrl && (
          <a
            href={isMock ? '#' : formatFileUrl(brochureUrl)}
            target={isMock ? '_self' : '_blank'}
            rel="noreferrer"
            onClick={(e) => { if (isMock) { e.preventDefault(); toast.success('Mock Brochure download clicked'); } }}
            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-xs"
          >
            <Download className="h-4 w-4" />
            <span>Download Brochure</span>
          </a>
        )}

        {/* Dynamic WhatsApp help / link */}
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); toast.success('Mock Chat Help clicked'); }}
          className="py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-250 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
        >
          <MessageSquare className="h-4 w-4" />
          <span>WhatsApp Admission Help</span>
        </a>
      </div>

      {/* Social links */}
      {socialLinks.length > 0 && (
        <div className="border-t border-slate-100 pt-5 space-y-3">
          <h4 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Follow Us</h4>
          <div className="flex items-center justify-center gap-3">
            {socialLinks.map((social, idx) => (
              <a
                key={idx}
                href={isMock ? '#' : formatExternalUrl(social.url)}
                target={isMock ? '_self' : '_blank'}
                rel="noreferrer"
                onClick={(e) => { if (isMock) { e.preventDefault(); toast.success(`Mock link to ${social.platform} clicked`); } }}
                className="p-2 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-650 rounded-xl border border-slate-100 transition-colors shadow-2xs"
                title={social.platform}
              >
                {getPlatformIcon(social.platform, "h-5 w-5")}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 text-[10px] text-slate-400 font-medium">
        Powered by {name || 'College Admin'}
      </div>
    </div>
  );
};

export default EnquiryBannerPreview;
