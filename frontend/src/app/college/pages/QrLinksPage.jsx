import React, { useState } from 'react';
import { useAuth } from '../../school/contexts/AuthContext';
import Button from '../../../shared/components/Button';
import toast from 'react-hot-toast';
import { QrCode, Copy, Download, Link, ExternalLink } from 'lucide-react';

const QrLinksPage = () => {
  const { school } = useAuth();
  const [copyingLink, setCopyingLink] = useState(false);

  const handleCopyLink = async (text, setCopyState) => {
    try {
      setCopyState(true);
      await navigator.clipboard.writeText(text);
      toast.success('Public Admission Desk link copied!');
    } catch (err) {
      toast.error('Failed to copy link');
    } finally {
      setTimeout(() => setCopyState(false), 1500);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800">QR Code & Public Links</h2>
        <p className="text-slate-500 text-xs mt-0.5">Share your public college registration portal links, QR printouts, and desk codes.</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Copy Links */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800">College Admission Desk Links</h3>
            <p className="text-slate-400 text-[11px] mt-0.5">Copy and share these links on your university website, brochures, or social media handles.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">1. Public Applicant Admission Link</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-2 pl-3">
                <span className="text-xs font-semibold text-slate-500 truncate flex-1 pr-3">
                  {school?.admissionFormLink || `http://localhost:5173/public/college/admission/${school?.id}`}
                </span>
                <div className="flex space-x-1 shrink-0">
                  <button
                    onClick={() => handleCopyLink(school?.admissionFormLink || `http://localhost:5173/public/college/admission/${school?.id}`, setCopyingLink)}
                    className="p-1.5 hover:bg-slate-200/50 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <a
                    href={school?.admissionFormLink || `http://localhost:5173/public/college/admission/${school?.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 hover:bg-slate-200/50 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: QR Code Visualizer */}
        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-center">
          {school?.qrCodeUrl ? (
            <div className="space-y-4">
              <img
                src={school.qrCodeUrl}
                alt="Admission Link QR Code"
                className="h-44 w-44 bg-white p-2.5 rounded-2xl shadow-xs border border-slate-100 object-contain"
              />
              <div>
                <h4 className="text-xs font-bold text-slate-850">Public Registration QR Code</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Let applicants scan to apply instantly.</p>
              </div>
              <a
                href={school.qrCodeUrl}
                download="College_Admission_QR_Code.png"
                className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <Download className="h-4 w-4 mr-1.5" /> Download QR Image
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              <QrCode className="h-10 w-10 text-slate-300" />
              <p className="text-xs text-slate-500 font-semibold">QR Code Not Generated</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QrLinksPage;
