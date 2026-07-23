import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../school/contexts/AuthContext';
import Button from '../../../shared/components/Button';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { QrCode, Copy, Download, ExternalLink, Printer, Sparkles, Globe } from 'lucide-react';

const urlToBase64 = async (url) => {
  if (!url) return null;
  if (url.startsWith('data:image')) return url;
  
  let targetUrl = url;
  if (targetUrl.startsWith('/')) {
    const backendBase = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
      : 'http://localhost:5001';
    targetUrl = `${backendBase}${targetUrl}`;
  }

  try {
    const response = await fetch(targetUrl, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(targetUrl);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Base64 conversion fallback:', url, err);
    return targetUrl;
  }
};

const QrLinksPage = () => {
  const { school } = useAuth();
  const [copyingLink, setCopyingLink] = useState(false);
  const [copyingReception, setCopyingReception] = useState(false);
  
  const [downloadingQrPng, setDownloadingQrPng] = useState(false);
  const [downloadingQrPdf, setDownloadingQrPdf] = useState(false);
  const [downloadingPosterPng, setDownloadingPosterPng] = useState(false);
  const [downloadingPosterPdf, setDownloadingPosterPdf] = useState(false);

  const [logoBase64, setLogoBase64] = useState(null);
  const [qrBase64, setQrBase64] = useState(null);

  const qrRef = useRef(null);
  const posterRef = useRef(null);

  const publicLink = school?.admissionFormLink || `http://localhost:5173/public/college/admission/${school?.id || school?._id}`;
  const receptionLink = `${publicLink}?role=reception`;

  useEffect(() => {
    const loadImages = async () => {
      if (school?.logo) {
        const b64 = await urlToBase64(school.logo);
        setLogoBase64(b64);
      } else {
        setLogoBase64(null);
      }
      if (school?.qrCodeUrl) {
        const b64 = await urlToBase64(school.qrCodeUrl);
        setQrBase64(b64);
      } else {
        setQrBase64(null);
      }
    };
    loadImages();
  }, [school?.logo, school?.qrCodeUrl]);

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

  const waitForImagesAndFonts = async (element) => {
    if (!element) {
      throw new Error('Element not loaded yet.');
    }
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    const imgs = Array.from(element.querySelectorAll('img'));
    await Promise.all(
      imgs.map((img) => {
        if (img.complete && img.naturalWidth > 0) {
          return Promise.resolve();
        }
        return new Promise((resolve) => {
          let timer = setTimeout(() => resolve(), 3000);
          img.onload = () => {
            clearTimeout(timer);
            resolve();
          };
          img.onerror = () => {
            clearTimeout(timer);
            resolve();
          };
        });
      })
    );
  };

  const renderCanvas = async (element) => {
    await waitForImagesAndFonts(element);
    return await html2canvas(element, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc) => {
        try {
          const styleTags = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styleTags.length; i++) {
            if (styleTags[i].innerHTML && styleTags[i].innerHTML.includes('oklch')) {
              styleTags[i].innerHTML = styleTags[i].innerHTML.replace(/oklch\([^)]+\)/gi, '#808080');
            }
          }
        } catch (e) {
          console.warn('Stylesheet OKLCH sanitization fallback:', e);
        }
      },
    });
  };

  // QR Code Downloads
  const handleDownloadQrPng = async () => {
    if (!qrRef.current) return;
    setDownloadingQrPng(true);
    try {
      const canvas = await renderCanvas(qrRef.current);
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `${(school?.name || 'College').replace(/\s+/g, '_')}_Admission_QR.png`;
      link.click();
      toast.success('Admission QR PNG downloaded!');
    } catch (err) {
      toast.error('Failed to download QR PNG');
    } finally {
      setDownloadingQrPng(false);
    }
  };

  const handleDownloadQrPdf = async () => {
    if (!qrRef.current) return;
    setDownloadingQrPdf(true);
    try {
      const canvas = await renderCanvas(qrRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      // Center on page
      pdf.addImage(imgData, 'PNG', 45, 50, 120, 120);
      pdf.save(`${(school?.name || 'College').replace(/\s+/g, '_')}_Admission_QR.pdf`);
      toast.success('Admission QR PDF downloaded!');
    } catch (err) {
      toast.error('Failed to download QR PDF');
    } finally {
      setDownloadingQrPdf(false);
    }
  };

  // Poster Downloads & Print
  const handleDownloadPosterPng = async () => {
    if (!posterRef.current) return;
    setDownloadingPosterPng(true);
    try {
      const canvas = await renderCanvas(posterRef.current);
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `${(school?.name || 'College').replace(/\s+/g, '_')}_Admission_Poster.png`;
      link.click();
      toast.success('Poster PNG downloaded!');
    } catch (err) {
      toast.error('Failed to download Poster PNG');
    } finally {
      setDownloadingPosterPng(false);
    }
  };

  const handleDownloadPosterPdf = async () => {
    if (!posterRef.current) return;
    setDownloadingPosterPdf(true);
    try {
      const canvas = await renderCanvas(posterRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${(school?.name || 'College').replace(/\s+/g, '_')}_Admission_Poster.pdf`);
      toast.success('Poster PDF downloaded!');
    } catch (err) {
      toast.error('Failed to download Poster PDF');
    } finally {
      setDownloadingPosterPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const displayLogo = logoBase64 || school?.logo;
  const displayQr = qrBase64 || school?.qrCodeUrl;

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Title */}
      <div className="no-print">
        <h2 className="text-xl font-bold text-slate-800">QR Code & Admission Links</h2>
        <p className="text-slate-500 text-xs mt-0.5">Access walk-in links, copy public admission desk paths, and print scannable registration posters.</p>
      </div>

      {/* Links & QR Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
        {/* Left: Link Cards (Span 2) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Public Admission Form Link */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Public Admission Form</h3>
              <p className="text-slate-400 text-[11px] mt-0.5">Share this URL on your university website, brochures, or social media pages.</p>
            </div>
            
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-3.5">
              <span className="text-xs font-semibold text-slate-500 truncate flex-1 pr-4">
                {publicLink}
              </span>
              <div className="flex space-x-1 shrink-0">
                <button
                  onClick={() => handleCopyLink(publicLink, setCopyingLink)}
                  className="p-2 hover:bg-slate-200/50 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                  title="Copy Link"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <a
                  href={publicLink}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 hover:bg-slate-200/50 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                  title="Open Form"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Reception Desk Admission Link */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Reception Desk Admission Link</h3>
              <p className="text-slate-400 text-[11px] mt-0.5">Pre-configured link pre-loaded for receptionist tablets or walk-in computers.</p>
            </div>
            
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-3.5">
              <span className="text-xs font-semibold text-slate-500 truncate flex-1 pr-4">
                {receptionLink}
              </span>
              <div className="flex space-x-1 shrink-0">
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
                  title="Open Terminal"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Public Admission QR */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col items-center justify-between text-center space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">Admission QR</h3>
            <p className="text-slate-400 text-[10px]">Scannable QR pointing to the Public Admission Form.</p>
          </div>

          <div 
            ref={qrRef} 
            className="p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-center"
          >
            {displayQr ? (
              <img
                src={displayQr}
                crossOrigin="anonymous"
                alt="Admission QR Code"
                className="h-36 w-36 object-contain"
              />
            ) : (
              <div className="h-36 w-36 bg-slate-50 flex items-center justify-center rounded-xl text-slate-350">
                <QrCode className="h-10 w-10 animate-pulse" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 w-full">
            <Button
              onClick={handleDownloadQrPng}
              isLoading={downloadingQrPng}
              className="py-2.5 px-3 bg-indigo-650 hover:bg-indigo-750 text-[10px] font-bold inline-flex items-center justify-center"
              disabled={!displayQr}
            >
              <Download className="h-3.5 w-3.5 mr-1" /> PNG
            </Button>
            <Button
              onClick={handleDownloadQrPdf}
              isLoading={downloadingQrPdf}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-[10px] font-bold inline-flex items-center justify-center"
              disabled={!displayQr}
            >
              <Download className="h-3.5 w-3.5 mr-1" /> PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Admission Poster Area */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print border-b pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Admission Poster</h3>
            <p className="text-slate-400 text-[11px] mt-0.5 font-semibold">Printable poster for college campus display boards or walk-in inquiry centers.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleDownloadPosterPng}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center"
              disabled={downloadingPosterPng}
            >
              <Download className="h-4 w-4 mr-1.5" /> Download PNG
            </button>
            <button
              onClick={handleDownloadPosterPdf}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center"
              disabled={downloadingPosterPdf}
            >
              <Download className="h-4 w-4 mr-1.5" /> Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 border border-slate-250 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all inline-flex items-center"
            >
              <Printer className="h-4 w-4 mr-1.5" /> Print
            </button>
          </div>
        </div>

        {/* Visual Poster Container */}
        <div className="flex justify-center bg-slate-50/50 p-4 sm:p-8 rounded-2xl border border-dashed border-slate-200 shadow-inner">
          <div
            id="printable-qr-poster"
            ref={posterRef}
            className="w-[450px] min-h-[630px] bg-white border border-slate-150 rounded-2xl p-8 flex flex-col justify-between items-center text-center shadow-md relative"
          >
            {/* Design header line */}
            <div className="h-2 w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 rounded-t-2xl absolute top-0 left-0 right-0" />
            
            {/* Top Identity Block */}
            <div className="space-y-4 pt-4 flex flex-col items-center w-full">
              {displayLogo ? (
                <img
                  src={displayLogo}
                  crossOrigin="anonymous"
                  alt="College Logo"
                  className="h-16 w-16 object-contain p-1 border border-slate-100 rounded-xl bg-white shadow-2xs"
                />
              ) : (
                <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xl">
                  {school?.name?.substring(0, 2).toUpperCase() || 'CL'}
                </div>
              )}
              
              <div className="space-y-1">
                <h1 className="text-xl font-black text-slate-850 uppercase tracking-tight">
                  {school?.name || 'Our College / University'}
                </h1>
                {school?.tagline && (
                  <p className="text-[10px] text-slate-450 italic">"{school.tagline}"</p>
                )}
              </div>
            </div>

            {/* Banner Block */}
            <div className="py-2.5 px-6 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest inline-flex items-center gap-1.5 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              <span>Admissions Open</span>
            </div>

            {/* QR Scanner Frame */}
            <div className="flex flex-col items-center space-y-2.5">
              <div className="p-4 bg-white rounded-2xl border-2 border-indigo-500/20 shadow-sm">
                {displayQr ? (
                  <img
                    src={displayQr}
                    crossOrigin="anonymous"
                    alt="Admission Poster QR"
                    className="h-44 w-44 object-contain"
                  />
                ) : (
                  <div className="h-44 w-44 bg-slate-50 flex items-center justify-center rounded-xl text-slate-300">
                    <QrCode className="h-12 w-12" />
                  </div>
                )}
              </div>
              <p className="text-[10px] font-bold text-slate-450 tracking-wider uppercase">Scan QR code to apply online</p>
            </div>

            {/* Footer / Website strip */}
            <div className="w-full space-y-3 pt-4 border-t border-slate-100 flex flex-col items-center">
              {school?.website && (
                <div className="flex items-center space-x-1.5 text-slate-600">
                  <Globe className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-semibold">{school.website}</span>
                </div>
              )}
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Powered by College Admission CRM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrLinksPage;
