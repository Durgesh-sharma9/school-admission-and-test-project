import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import api from '../services/api';
import Button from './Button';
import toast from 'react-hot-toast';
import {
  Download,
  Printer,
  FileText,
  Phone,
  Mail,
  Globe,
  MapPin,
  Sparkles,
  QrCode,
  CheckCircle2,
  GraduationCap,
  Award,
  BookOpen,
  ShieldCheck,
  Building2
} from 'lucide-react';

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

const BrandedQrPoster = ({ school }) => {
  const posterRef = useRef(null);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [availableClasses, setAvailableClasses] = useState([]);

  const [logoBase64, setLogoBase64] = useState(null);
  const [qrBase64, setQrBase64] = useState(null);

  // Pre-load images as Base64 to avoid CORS canvas tainting
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

  // Fetch unique classes available in the school system
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/assessments');
        if (res.success && Array.isArray(res.data)) {
          const classesList = [...new Set(res.data.map(item => item.className).filter(Boolean))];
          if (classesList.length > 0) {
            setAvailableClasses(classesList);
          } else {
            setAvailableClasses(['Nursery', 'LKG', 'UKG', 'Grade 1–12']);
          }
        }
      } catch (err) {
        setAvailableClasses(['Nursery', 'LKG', 'UKG', 'Grade 1–12']);
      }
    };
    fetchClasses();
  }, []);

  if (!school) return null;

  // Extract settings & branding rules
  const qrBranding = school.qrBranding || {};
  const showLogo = qrBranding.showLogo ?? true;
  const showName = qrBranding.showName ?? true;
  const showTagline = qrBranding.showTagline ?? true;
  const showContact = qrBranding.showContact ?? true;
  const showEmail = qrBranding.showEmail ?? true;
  const showWebsite = qrBranding.showWebsite ?? true;
  const showAddress = qrBranding.showAddress ?? true;
  const showAcademicSession = qrBranding.showAcademicSession ?? true;
  const showHighlights = qrBranding.showHighlights ?? true;
  
  const highlights = (qrBranding.highlights && qrBranding.highlights.length > 0)
    ? qrBranding.highlights.filter(h => h.trim() !== '')
    : [
        'Experienced & Caring Faculty',
        'Smart Classrooms & Modern Labs',
        'Holistic Sports & Activity Program',
        'Safe Campus & GPS Transport'
      ];

  const featureIcons = [GraduationCap, BookOpen, Award, ShieldCheck];

  const primaryColor = qrBranding.primaryColor || '#4f46e5';
  const secondaryColor = qrBranding.secondaryColor || '#f59e0b';
  const footerMessage = qrBranding.footerMessage || 'Thank You For Visiting Our School. We Look Forward To Welcoming Your Child.';

  const schoolLogo = showLogo && (logoBase64 || school.logo) ? (logoBase64 || school.logo) : null;
  const schoolQrCode = qrBase64 || school.qrCodeUrl;
  const schoolName = showName && school.name ? school.name : null;
  const tagline = showTagline && school.tagline ? school.tagline : null;
  const academicSession = showAcademicSession && school.academicSession ? school.academicSession : null;
  const phone = showContact && school.phone ? school.phone : null;
  const email = showEmail && school.email ? school.email : null;
  const website = showWebsite && school.website ? school.website : null;
  const address = showAddress && school.address ? school.address : null;

  // Ensure fonts and images are fully loaded before canvas capture
  const waitForImagesAndFonts = async () => {
    if (!posterRef.current) {
      throw new Error('Poster element is still loading. Please wait.');
    }

    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const imgs = Array.from(posterRef.current.querySelectorAll('img'));
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

  // Render high quality canvas safely with OKLCH color sanitization
  const renderCanvas = async () => {
    await waitForImagesAndFonts();

    return await html2canvas(posterRef.current, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc) => {
        // Purge OKLCH expressions from all style tags in cloned document head
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

        // Purge inline styles on poster elements
        const poster = clonedDoc.getElementById('printable-qr-poster');
        if (poster) {
          const elements = [poster, ...poster.querySelectorAll('*')];
          elements.forEach((el) => {
            const styleAttr = el.getAttribute('style');
            if (styleAttr && styleAttr.includes('oklch')) {
              el.setAttribute('style', styleAttr.replace(/oklch\([^)]+\)/gi, '#808080'));
            }
          });
        }
      },
    });
  };

  // Handle Download PNG
  const handleDownloadPng = async () => {
    if (!posterRef.current) {
      toast.error('Poster is still rendering. Please wait.');
      return;
    }
    setDownloadingPng(true);
    try {
      const canvas = await renderCanvas();
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      const fileName = `${(schoolName || 'School').replace(/\s+/g, '_')}_Admission_Poster.png`;
      link.download = fileName;
      link.click();
      toast.success('High-resolution PNG poster downloaded!');
    } catch (err) {
      console.error('PNG download error:', err);
      toast.error(`Unable to generate PNG poster: ${err.message || 'Asset rendering error'}`);
    } finally {
      setDownloadingPng(false);
    }
  };

  // Handle Download PDF
  const handleDownloadPdf = async () => {
    if (!posterRef.current) {
      toast.error('Poster is still rendering. Please wait.');
      return;
    }
    setDownloadingPdf(true);
    try {
      const canvas = await renderCanvas();
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const fileName = `${(schoolName || 'School').replace(/\s+/g, '_')}_Admission_Poster.pdf`;
      pdf.save(fileName);
      toast.success('Professional A4 PDF poster downloaded!');
    } catch (err) {
      console.error('PDF download error:', err);
      toast.error(`Unable to generate PDF poster: ${err.message || 'Asset rendering error'}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Handle Print Poster
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
            Branded Admission Marketing Poster
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-semibold">
            Print-ready poster for school reception, WhatsApp sharing, social media & A4 printing.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
          <Button
            onClick={handleDownloadPng}
            isLoading={downloadingPng}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          >
            <Download className="h-4 w-4" />
            Download PNG
          </Button>

          <Button
            onClick={handleDownloadPdf}
            isLoading={downloadingPdf}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 shadow-sm"
          >
            <FileText className="h-4 w-4" />
            Download PDF
          </Button>

          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white"
          >
            <Printer className="h-4 w-4" />
            Print Poster
          </Button>
        </div>
      </div>

      {/* Printable Poster Canvas Container */}
      <div className="flex justify-center bg-slate-100/60 p-4 sm:p-8 rounded-3xl border border-slate-200/50 shadow-inner">
        <div
          id="printable-qr-poster"
          ref={posterRef}
          className="w-full max-w-[595px] min-h-[842px] overflow-hidden flex flex-col justify-between p-8 space-y-6 relative font-sans"
          style={{
            backgroundColor: '#ffffff',
            border: `2px solid ${primaryColor}20`,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Top Decorative Header Accent Bar */}
          <div
            className="h-3 w-full absolute top-0 left-0 right-0"
            style={{
              background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
            }}
          />

          {/* School Identity Header */}
          <div className="text-center space-y-3 pt-3">
            {/* School Logo */}
            {schoolLogo && (
              <div
                className="mx-auto h-24 w-24 p-2 flex items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '20px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                }}
              >
                <img
                  src={schoolLogo}
                  crossOrigin="anonymous"
                  alt={schoolName || 'School Logo'}
                  className="h-full w-full object-contain"
                />
              </div>
            )}

            {/* School Name & Tagline */}
            <div className="space-y-1">
              {schoolName && (
                <h1
                  className="text-2xl sm:text-3xl font-black tracking-tight uppercase leading-tight"
                  style={{ color: primaryColor }}
                >
                  {schoolName}
                </h1>
              )}

              {tagline && (
                <p className="text-xs sm:text-sm font-bold italic" style={{ color: '#64748b' }}>
                  "{tagline}"
                </p>
              )}
            </div>

            {/* Full-width Admissions Open Banner */}
            <div
              className="w-full py-2.5 px-4 rounded-2xl flex items-center justify-center gap-2"
              style={{
                backgroundColor: primaryColor,
                color: '#ffffff',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
              }}
            >
              <Sparkles className="h-4 w-4 shrink-0" style={{ color: '#fcd34d' }} />
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
                ADMISSIONS OPEN {academicSession ? `(${academicSession})` : ''}
              </span>
            </div>
          </div>

          {/* Hero QR Code Section */}
          <div className="flex flex-col items-center justify-center text-center space-y-4 my-1">
            <div
              className="p-6 rounded-3xl relative flex flex-col items-center justify-center"
              style={{
                backgroundColor: '#ffffff',
                border: `2px solid ${primaryColor}30`,
                boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.08)',
              }}
            >
              {schoolQrCode ? (
                <img
                  src={schoolQrCode}
                  crossOrigin="anonymous"
                  alt="Scannable Admission QR Code"
                  className="w-56 h-56 object-contain"
                />
              ) : (
                <div
                  className="w-56 h-56 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: '#f8fafc', color: '#cbd5e1' }}
                >
                  <QrCode className="h-20 w-20" />
                </div>
              )}

              {/* Prominent CTA */}
              <div
                className="mt-3 px-6 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2"
                style={{
                  backgroundColor: secondaryColor,
                  color: '#ffffff',
                  boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.08)',
                }}
              >
                <QrCode className="h-4 w-4 shrink-0" />
                <span>Scan to Apply Online</span>
              </div>
            </div>

            {/* Classes Offered Pills Row */}
            {availableClasses.length > 0 && (
              <div className="space-y-1.5 max-w-md w-full">
                <span className="text-[10px] font-extrabold uppercase tracking-widest block" style={{ color: '#94a3b8' }}>
                  CLASSES OFFERED FOR ADMISSION
                </span>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {availableClasses.map((cls, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        color: '#1e293b',
                      }}
                    >
                      {cls}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Feature Highlights Grid */}
          {showHighlights && highlights.length > 0 && (
            <div
              className="p-4 rounded-2xl space-y-2.5"
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #f1f5f9',
              }}
            >
              <div className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
                <span className="text-[10px] font-extrabold uppercase tracking-widest block" style={{ color: '#94a3b8' }}>
                  WHY CHOOSE OUR SCHOOL
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {highlights.map((item, idx) => {
                  const IconComp = featureIcons[idx % featureIcons.length];
                  return (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                      <div className="p-1 rounded-lg shrink-0" style={{ backgroundColor: `${secondaryColor}15` }}>
                        <IconComp className="h-3.5 w-3.5" style={{ color: secondaryColor }} />
                      </div>
                      <span className="font-bold text-[11px] truncate" style={{ color: '#334155' }}>
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contact Information & Footer Strip */}
          <div className="space-y-4 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
            <div
              className="p-4 rounded-2xl space-y-3"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
              }}
            >
              <span className="text-[10px] font-extrabold uppercase tracking-widest block" style={{ color: '#94a3b8' }}>
                FOR ENQUIRIES & CAMPUS VISIT
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {phone && (
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg shrink-0" style={{ backgroundColor: `${primaryColor}10` }}>
                      <Phone className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                    </div>
                    <span className="font-bold text-[11px] truncate" style={{ color: '#1e293b' }}>
                      {phone}
                    </span>
                  </div>
                )}

                {email && (
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg shrink-0" style={{ backgroundColor: `${primaryColor}10` }}>
                      <Mail className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                    </div>
                    <span className="font-bold text-[11px] truncate" style={{ color: '#1e293b' }}>
                      {email}
                    </span>
                  </div>
                )}

                {website && (
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg shrink-0" style={{ backgroundColor: `${primaryColor}10` }}>
                      <Globe className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                    </div>
                    <span className="font-bold text-[11px] truncate" style={{ color: '#1e293b' }}>
                      {website}
                    </span>
                  </div>
                )}

                {address && (
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg shrink-0" style={{ backgroundColor: `${primaryColor}10` }}>
                      <MapPin className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                    </div>
                    <span className="font-bold text-[11px] truncate" style={{ color: '#1e293b' }}>
                      {address}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Thank You Message */}
            {footerMessage && (
              <p className="text-[11px] text-center font-bold italic max-w-lg mx-auto" style={{ color: '#64748b' }}>
                "{footerMessage}"
              </p>
            )}

            {/* Application Branding */}
            <div className="text-center pt-1" style={{ borderTop: '1px solid #f1f5f9' }}>
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                Powered by School Admission CRM
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandedQrPoster;
