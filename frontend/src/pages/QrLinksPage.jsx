import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import BrandedQrPoster from '../components/BrandedQrPoster';
import toast from 'react-hot-toast';
import { QrCode, Copy, Download, Link, ExternalLink, HelpCircle } from 'lucide-react';

const QrLinksPage = () => {
  const { school } = useAuth();
  const [copyingLink, setCopyingLink] = useState(false);
  const [copyingReception, setCopyingReception] = useState(false);

  const receptionLink = school ? `${school.admissionFormLink}?role=reception` : '';

  const handleCopyLink = async (text, setCopyState) => {
    try {
      setCopyState(true);
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    } finally {
      setTimeout(() => setCopyState(false), 1500);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl text-left">
      <div className="no-print">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">QR Code & Public Links</h2>
        <p className="text-slate-500 text-sm mt-0.5">
          Share your permanent admission form with parents. Download your branded QR poster or copy links.
        </p>
      </div>

      {/* Public Registration Links Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6 no-print">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Permanent Admission Links
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Parent QR admission link */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              1. Public Admission Form Link (Parent Scan)
            </label>
            <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl p-2 pl-3">
              <span className="text-xs font-medium text-slate-500 truncate flex-1 pr-3">
                {school?.admissionFormLink}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => handleCopyLink(school.admissionFormLink, setCopyingLink)}
                  className="p-2 hover:bg-slate-200/50 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                  title="Copy Link"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <a
                  href={school?.admissionFormLink}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 hover:bg-slate-200/50 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                  title="Open Link"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Share on website, WhatsApp broadcasts, or social media pages.
            </p>
          </div>

          {/* Receptionist desk link */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              2. Reception Desk Terminal Link (Staff / Front Desk)
            </label>
            <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl p-2 pl-3">
              <span className="text-xs font-medium text-slate-500 truncate flex-1 pr-3">
                {receptionLink}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => handleCopyLink(receptionLink, setCopyingReception)}
                  className="p-2 hover:bg-slate-200/50 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                  title="Copy Link"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <a
                  href={receptionLink}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 hover:bg-slate-200/50 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                  title="Open Link"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Pre-configured for receptionist tablets or walk-in computers.
            </p>
          </div>
        </div>
      </div>

      {/* Branded Marketing QR Poster Section */}
      <BrandedQrPoster school={school} />
    </div>
  );
};

export default QrLinksPage;
