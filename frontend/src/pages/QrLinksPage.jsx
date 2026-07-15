import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import { QrCode, Copy, Download, Link, ExternalLink, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">QR Code & Public Links</h2>
        <p className="text-slate-500 text-sm mt-0.5">
          Share your permanent admission form with parents. Download your QR code or share links directly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Permanent QR Display */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col items-center justify-between text-center space-y-4 md:col-span-1">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
            Admission QR Code
          </span>

          {school?.qrCodeUrl ? (
            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
              <img
                src={school.qrCodeUrl}
                alt="Admission QR Code"
                className="w-48 h-48 rounded-xl object-contain shadow-xs bg-white p-1"
              />
            </div>
          ) : (
            <div className="w-48 h-48 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
              <QrCode className="h-10 w-10 animate-pulse" />
            </div>
          )}

          <div className="w-full space-y-2 pt-2">
            <a
              href={school?.qrCodeUrl}
              download={`${school?.name?.replace(/\s+/g, '_')}_Admission_QR.png`}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download QR Image
            </a>
          </div>
        </div>

        {/* Card 2: Links and Details */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6 md:col-span-2 flex flex-col justify-between">
          <div className="space-y-5 text-left">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Admission Registration Links
            </span>

            {/* Parent QR admission link */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                1. Public Admission Form Link (Parent Scan)
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-100 rounded-lg p-1.5 pl-3">
                <span className="text-xs font-medium text-slate-500 truncate flex-1 pr-3">
                  {school?.admissionFormLink}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleCopyLink(school.admissionFormLink, setCopyingLink)}
                    className="p-2 hover:bg-slate-200/50 rounded-md text-slate-500 hover:text-slate-800 transition-colors"
                    title="Copy Link"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <a
                    href={school?.admissionFormLink}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 hover:bg-slate-200/50 rounded-md text-slate-500 hover:text-slate-800 transition-colors"
                    title="Open Link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Perfect for websites, social media descriptions, or print campaigns.
              </p>
            </div>

            {/* Receptionist desk link */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                2. Public Reception Link (Front Desk / Admin Terminal)
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-100 rounded-lg p-1.5 pl-3">
                <span className="text-xs font-medium text-slate-500 truncate flex-1 pr-3">
                  {receptionLink}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleCopyLink(receptionLink, setCopyingReception)}
                    className="p-2 hover:bg-slate-200/50 rounded-md text-slate-500 hover:text-slate-800 transition-colors"
                    title="Copy Link"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <a
                    href={receptionLink}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 hover:bg-slate-200/50 rounded-md text-slate-500 hover:text-slate-800 transition-colors"
                    title="Open Link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Includes receptionist mode optimizations. If receptionist submissions succeed, the CRM offers a single-click "Register Another Student" shortcut for subsequent walk-ins.
              </p>
            </div>
          </div>

          {/* Quick instructions alert */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex gap-3 text-left">
            <HelpCircle className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-700">How QR-flow works:</h4>
              <ol className="list-decimal pl-4 text-[10px] text-slate-400 leading-relaxed space-y-1">
                <li>Parents scan the physical QR code with their mobile cameras.</li>
                <li>The responsive mobile form loads instantly without requiring application install.</li>
                <li>Upon submitting, enquiries log in the CRM dashboard in real-time, and the parents see your customized CMS Thank You configuration.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrLinksPage;
