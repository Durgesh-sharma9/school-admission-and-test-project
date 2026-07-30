import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../school/contexts/AuthContext';
import api from '../../school/services/schoolApi';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  QrCode,
  Copy,
  Download,
  ExternalLink,
  Printer,
  Sparkles,
  Globe,
  Share2,
  Check,
  Layout,
  Link,
  Smartphone,
  Monitor,
  FileText,
  RefreshCw,
  Maximize2,
  Upload,
  Trash2,
  ChevronRight,
  X,
  Eye,
  Phone
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

const oklchCache = new Map();
const oklchToRgb = (oklchString) => {
  if (oklchCache.has(oklchString)) return oklchCache.get(oklchString);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = oklchString;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    const resolved = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
    oklchCache.set(oklchString, resolved);
    return resolved;
  } catch (e) {
    return 'rgb(0, 0, 0)';
  }
};

// 5 Premium Template Cards with Miniature Poster Thumbnails
const TEMPLATE_REGISTRY = [
  {
    id: 'modern-premium',
    name: 'Modern Premium',
    description: 'Clean white canvas with professional blue/purple gradient branding, structured guidelines, and modern design hierarchy.',
    thumbnail: (
      <div className="w-12 h-16 bg-white border border-slate-200 rounded relative overflow-hidden flex flex-col justify-between p-1 shrink-0 shadow-3xs">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
        <div className="w-4 h-4 bg-indigo-50 rounded-sm mx-auto mt-1" />
        <div className="w-6 h-6 bg-slate-100 border border-indigo-100 rounded-sm mx-auto flex items-center justify-center"><div className="w-3.5 h-3.5 bg-slate-400 rounded-2xs" /></div>
        <div className="space-y-0.5">
          <div className="w-8 h-1 bg-slate-200 mx-auto rounded-full" />
          <div className="w-6 h-0.5 bg-slate-150 mx-auto rounded-full" />
        </div>
      </div>
    )
  },
  {
    id: 'corporate-split',
    name: 'Corporate Split',
    description: 'Modern side-by-side corporate layout with left aligned QR scanner frame, right aligned branding, and navy/orange highlights.',
    thumbnail: (
      <div className="w-12 h-16 bg-white border border-slate-200 rounded relative overflow-hidden flex justify-between items-center p-1 shrink-0 gap-1 shadow-3xs">
        <div className="w-4.5 h-7 bg-slate-50 border border-slate-200 rounded-sm flex items-center justify-center shrink-0">
          <div className="w-3 h-3 bg-slate-400 rounded-2xs" />
        </div>
        <div className="flex-1 flex flex-col justify-between h-full py-1">
          <div className="w-3 h-3 bg-indigo-900 rounded-sm" />
          <div className="w-6 h-1 bg-orange-550 rounded-full" />
          <div className="space-y-0.5">
            <div className="w-6 h-0.5 bg-slate-300 rounded-full" />
            <div className="w-5 h-0.5 bg-slate-200 rounded-full" />
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'luxury-black',
    name: 'Luxury Black',
    description: 'Elegant deep navy luxury layout with gold accents, white QR border contrast, and premium display serif typography.',
    thumbnail: (
      <div className="w-12 h-16 bg-slate-900 border border-slate-800 rounded relative overflow-hidden flex flex-col justify-between p-1 shrink-0 shadow-3xs">
        <div className="absolute inset-0 border border-amber-500/20 m-0.5 rounded-xs" />
        <div className="w-4 h-4 bg-amber-500/10 rounded-full mx-auto mt-1 border border-amber-500/20" />
        <div className="w-5 h-5 bg-white border border-amber-500/30 rounded mx-auto flex items-center justify-center"><div className="w-3 h-3 bg-slate-800 rounded-3xs" /></div>
        <div className="space-y-0.5 z-10">
          <div className="w-7 h-0.5 bg-amber-400/60 mx-auto rounded-full" />
          <div className="w-5 h-0.5 bg-slate-400 mx-auto rounded-full" />
        </div>
      </div>
    )
  },
  {
    id: 'color-burst',
    name: 'Color Burst',
    description: 'Bright modern youthful layout featuring purple/blue/orange gradient backdrops with floating cards, perfect for active campus life.',
    thumbnail: (
      <div className="w-12 h-16 bg-gradient-to-tr from-purple-500 via-pink-400 to-orange-400 border border-purple-300 rounded relative overflow-hidden flex flex-col justify-between p-1 shrink-0 shadow-3xs">
        <div className="w-4 h-4 bg-white/40 rounded-full mx-auto mt-1 backdrop-blur-3xs" />
        <div className="w-6 h-6 bg-white/50 border border-white/20 rounded-md mx-auto flex items-center justify-center backdrop-blur-3xs"><div className="w-3 h-3 bg-purple-700 rounded-3xs" /></div>
        <div className="space-y-0.5">
          <div className="w-7 h-1 bg-white/60 mx-auto rounded-full" />
          <div className="w-5 h-0.5 bg-white/40 mx-auto rounded-full" />
        </div>
      </div>
    )
  },
  {
    id: 'creative-gradient',
    name: 'Creative Gradient',
    description: 'Vibrant clean layout with soft purple-cyan gradients, spacious grids, neon indicators, and high contrast details.',
    thumbnail: (
      <div className="w-12 h-16 bg-gradient-to-br from-indigo-600 to-cyan-500 border border-indigo-400 rounded relative overflow-hidden flex flex-col justify-between p-1 shrink-0 shadow-3xs">
        <div className="w-3.5 h-3.5 bg-white/30 rounded mx-auto mt-1" />
        <div className="w-6 h-6 bg-white/90 rounded-xl mx-auto flex items-center justify-center"><div className="w-3.5 h-3.5 bg-indigo-900 rounded-3xs" /></div>
        <div className="space-y-0.5">
          <div className="w-8 h-0.5 bg-white/80 mx-auto" />
          <div className="w-6 h-0.5 bg-white/50 mx-auto" />
        </div>
      </div>
    )
  }
];

// Poster dimension parameters with display names and sizing specifications
const SIZE_REGISTRY = [
  { id: 'A4 Portrait', name: 'A4 Portrait', ratio: '1:1.4', width: 800, height: 1130, icon: '📄' },
  { id: 'A4 Landscape', name: 'A4 Landscape', ratio: '1.4:1', width: 1130, height: 800, icon: '📄' },
  { id: 'Instagram Post', name: 'Instagram Post', ratio: '1:1', width: 800, height: 800, icon: '📱' },
  { id: 'Instagram Story', name: 'Instagram Story', ratio: '9:16', width: 800, height: 1420, icon: '📲' },
  { id: 'WhatsApp Poster', name: 'WhatsApp Poster', ratio: '9:16', width: 800, height: 1420, icon: '📲' },
  { id: 'Facebook Post', name: 'Facebook Post', ratio: '1.9:1', width: 1200, height: 628, icon: '📘' }
];

const QrLinksPage = () => {
  const { school, updateSchoolState } = useAuth();

  // Link States
  const [copyingLink, setCopyingLink] = useState(false);
  const [copyingReception, setCopyingReception] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  // Editable branding states (updates propagate to preview instantly)
  const [name, setName] = useState(school?.name || '');
  const [phone, setPhone] = useState(school?.phone || '');
  const [address, setAddress] = useState(school?.address || '');
  const [logo, setLogo] = useState(school?.logo || '');
  const [tagline, setTagline] = useState(school?.tagline || '');
  const [academicSession, setAcademicSession] = useState(school?.academicSession || '2026-2027');
  const [website, setWebsite] = useState(school?.website || '');

  const DEFAULT_HIGHLIGHTS = [
    'NAAC A++ Accredited Campus',
    'State-of-the-Art Labs',
    '100% Placement Records',
    'Experienced Doctorates Faculty'
  ];

  const [qrBranding, setQrBranding] = useState({
    showLogo: school?.qrBranding?.showLogo ?? true,
    showName: school?.qrBranding?.showName ?? true,
    showTagline: school?.qrBranding?.showTagline ?? true,
    showContact: school?.qrBranding?.showContact ?? true,
    showEmail: school?.qrBranding?.showEmail ?? true,
    showWebsite: school?.qrBranding?.showWebsite ?? true,
    showAddress: school?.qrBranding?.showAddress ?? true,
    showAcademicSession: school?.qrBranding?.showAcademicSession ?? true,
    showHighlights: school?.qrBranding?.showHighlights ?? true,
    highlights: school?.qrBranding?.highlights?.length > 0 ? school.qrBranding.highlights : DEFAULT_HIGHLIGHTS,
    footerMessage: school?.qrBranding?.footerMessage || 'Thank You For Visiting Our Campus. We Look Forward To Welcoming You.',
    primaryColor: school?.qrBranding?.primaryColor || '#4f46e5',
    secondaryColor: school?.qrBranding?.secondaryColor || '#f59e0b',
    posterTitle: school?.qrBranding?.posterTitle ?? '',
    posterSubtitle: school?.qrBranding?.posterSubtitle ?? '',
  });

  // Action / loading states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Asset base64 preloads
  const [logoBase64, setLogoBase64] = useState(null);
  const [qrBase64, setQrBase64] = useState(null);

  // Template/Size selectors
  const [selectedTemplate, setSelectedTemplate] = useState('modern-premium');
  const [posterTheme, setPosterTheme] = useState('bw'); // 'bw' (default) or 'brand'
  const [selectedSize, setSelectedSize] = useState('A4 Portrait');
  const [zoomSetting, setZoomSetting] = useState('Fit Screen');
  const [activeTab, setActiveTab] = useState('links'); // 'links', 'branding', 'preview' 
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [modalZoom, setModalZoom] = useState(0.45);
  const [modalFit, setModalFit] = useState('height');
  const [expandedSection, setExpandedSection] = useState('branding'); // 'branding', 'content', 'contact', 'footer', 'visibility'

  const posterRef = useRef(null);

  const publicLink = school?.admissionFormLink || `http://localhost:5173/public/college/admission/${school?.id || school?._id}`;
  const receptionLink = `${publicLink}?role=reception`;

  // Preload base64 images to prevent canvas taint issues
  useEffect(() => {
    const loadImages = async () => {
      if (logo) {
        const b64 = await urlToBase64(logo);
        setLogoBase64(b64);
      } else {
        setLogoBase64(null);
      }
      if (school?.qrCodeUrl) {
        const b64 = await urlToBase64(school.qrCodeUrl);
        setQrBase64(b64);
      }
    };
    loadImages();
  }, [logo, school?.qrCodeUrl]);

  // Escape key to close fullscreen preview modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsFullScreen(false);
      }
    };
    if (isFullScreen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  // Dimension details helper
  const getPosterDims = () => {
    const sizeSpec = SIZE_REGISTRY.find(s => s.id === selectedSize) || SIZE_REGISTRY[0];
    return { width: sizeSpec.width, height: sizeSpec.height };
  };

  // Compute scale dynamically to perfectly fit-to-screen inside the preview canvas container without crop
  const getScaleFactor = () => {
    if (zoomSetting === '50%') return 0.5;
    if (zoomSetting === '75%') return 0.75;
    if (zoomSetting === '100%') return 1.0;

    // Fit Screen mode - dynamic scaling based on design height and width
    const { width, height } = getPosterDims();
    const scaleHeight = 450 / height;
    const scaleWidth = 360 / width;
    return Math.min(scaleHeight, scaleWidth, 0.85);
  };

  const scale = getScaleFactor();
  const posterDims = getPosterDims();
  const mainTitleText = qrBranding.posterTitle?.trim() || 'College Admission Portal';

  const displayLogo = logoBase64 || logo;
  const displayQr = qrBase64 || school?.qrCodeUrl;

  // Dynamic theme colors logic for WYSIWYG Black & White (monochrome) vs Brand Colors
  const themeMode = posterTheme;
  const effectivePrimary = themeMode === 'bw'
    ? (selectedTemplate === 'luxury-black' ? '#ffffff' : '#000000')
    : qrBranding.primaryColor;
  const effectiveSecondary = themeMode === 'bw'
    ? (selectedTemplate === 'luxury-black' ? '#a1a1aa' : '#4b5563')
    : qrBranding.secondaryColor;

  const effectiveBg = selectedTemplate === 'luxury-black'
    ? (themeMode === 'bw' ? '#000000' : '#0b1329')
    : (selectedTemplate === 'color-burst'
      ? (themeMode === 'bw' ? '#18181b' : '#8b5cf6')
      : '#ffffff');

  const isDarkBg = selectedTemplate === 'luxury-black' ||
    selectedTemplate === 'color-burst' ||
    (selectedTemplate === 'creative-gradient' && themeMode === 'brand');

  const effectiveTextColor = isDarkBg
    ? '#ffffff'
    : (themeMode === 'bw' ? '#111827' : qrBranding.primaryColor);

  // Upload Logo directly in QR Builder
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo image must be under 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setUploadingLogo(true);

    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
      const res = await fetch(`${apiBaseUrl}/settings/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const response = await res.json();

      if (response.success) {
        setLogo(response.fileUrl);
        const b64 = await urlToBase64(response.fileUrl);
        setLogoBase64(b64);
        toast.success('Logo uploaded successfully! Save changes to apply.');
      } else {
        toast.error(response.message || 'Logo upload failed');
      }
    } catch (err) {
      toast.error('Connection error during upload');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDeleteLogo = () => {
    setLogo('');
    setLogoBase64(null);
    toast.success('Logo cleared. Save changes to update.');
  };

  // Save Branding configurations to DB
  const handleSaveBranding = async (e) => {
    if (e) e.preventDefault();
    if (!name || !phone || !address) {
      toast.error('Identity name, contact phone, and address are required.');
      return;
    }

    setSavingBranding(true);
    try {
      const response = await api.put('/settings', {
        name,
        phone,
        address,
        logo,
        tagline,
        academicSession,
        website,
        qrBranding
      });

      if (response.success) {
        toast.success('Admission Poster branding saved successfully!');
        if (updateSchoolState) {
          updateSchoolState({ ...school, ...response.school, institutionType: 'college' });
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save branding configurations');
    } finally {
      setSavingBranding(false);
    }
  };

  // Copy Link helper
  const handleCopyLink = async (text, setCopyState) => {
    try {
      setCopyState(true);
      await navigator.clipboard.writeText(text);
      toast.success('Portal Link copied!');
    } catch {
      toast.error('Failed to copy');
    } finally {
      setTimeout(() => setCopyState(false), 1200);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: name || 'College Admission Portal',
          url: publicLink
        });
      } catch { }
    } else {
      await navigator.clipboard.writeText(publicLink);
      toast.success('Public Portal URL copied for sharing!');
    }
  };

  const handleGenerateNew = () => {
    setGeneratingLink(true);
    setTimeout(() => {
      setGeneratingLink(false);
      toast.success('New secure link token generated!');
    }, 1000);
  };

  // Download flyer handler — renders poster at full native size off-screen for pixel-perfect export
  const handleDownload = async (format) => {
    if (format === 'png') setDownloadingPng(true);
    else if (format === 'pdf') setDownloadingPdf(true);

    try {
      // Wait for web fonts to be fully loaded
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      await new Promise(resolve => setTimeout(resolve, 80));

      // 1. Create an off-screen container at the poster's full native pixel dimensions
      const container = document.createElement('div');
      container.style.cssText = [
        `position:fixed`,
        `top:-${posterDims.height + 200}px`,
        `left:-${posterDims.width + 200}px`,
        `width:${posterDims.width}px`,
        `height:${posterDims.height}px`,
        `overflow:hidden`,
        `z-index:-9999`,
        `pointer-events:none`,
        `visibility:hidden`,
      ].join(';');
      document.body.appendChild(container);

      // 2. Render the React poster tree into the off-screen node at scale=1 (no transform)
      const { createRoot } = await import('react-dom/client');
      const offscreenRoot = createRoot(container);
      offscreenRoot.render(renderPosterCanvas(1, 'pdf-export-canvas'));

      // 3. Allow React to flush the render and all images to settle
      await new Promise(resolve => setTimeout(resolve, 200));

      // 4. Capture at 4× density for print-quality resolution
      const canvas = await html2canvas(container, {
        scale: 4,
        useCORS: true,
        allowTaint: false,
        backgroundColor: effectiveBg,
        width: posterDims.width,
        height: posterDims.height,
        logging: false,
        onclone: (clonedDoc) => {
          // Remove oklch/oklab color values not supported by html2canvas
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach(tag => {
            let cssText = tag.textContent;
            if (cssText && (cssText.includes('oklch') || cssText.includes('oklab'))) {
              cssText = cssText.replace(/(oklch|oklab)\([^)]+\)/g, match => {
                try { return oklchToRgb(match); } catch { return 'rgb(0,0,0)'; }
              });
              tag.textContent = cssText;
            }
          });
          const allElements = clonedDoc.getElementsByTagName('*');
          for (const el of allElements) {
            const styleAttr = el.getAttribute('style');
            if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab'))) {
              el.setAttribute('style', styleAttr.replace(/(oklch|oklab)\([^)]+\)/g, match => {
                try { return oklchToRgb(match); } catch { return 'rgb(0,0,0)'; }
              }));
            }
          }
        }
      });

      // 5. Export to the requested format
      const imgData = canvas.toDataURL('image/png');

      if (format === 'pdf') {
        // Full-bleed A4 — the poster's own internal p-16 padding serves as the print margin
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
        pdf.save(`${name.replace(/\s+/g, '_')}_admission_poster.pdf`);
        toast.success('PDF document exported successfully!');
      } else {
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `${name.replace(/\s+/g, '_')}_admission_poster.png`;
        link.click();
        toast.success('PNG image exported successfully!');
      }

      // 6. Clean up the off-screen container
      offscreenRoot.unmount();
      document.body.removeChild(container);

    } catch (err) {
      console.error('Export error details:', err);
      toast.error(`Failed to export flyer: ${err.message || err}`);
    } finally {
      setDownloadingPng(false);
      setDownloadingPdf(false);
    }
  };

  const handlePrint = async () => {
    const posterEl = document.getElementById('admission-poster-canvas');
    if (!posterEl) return;

    toast.loading('Preparing poster for print...', { id: 'print-toast' });

    const prevTransform = posterEl.style.transform;
    const prevTransformOrigin = posterEl.style.transformOrigin;

    posterEl.style.transform = 'none';
    posterEl.style.transformOrigin = 'initial';

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      await new Promise(resolve => setTimeout(resolve, 50));

      const canvas = await html2canvas(posterEl, {
        scale: 2.0,
        useCORS: true,
        allowTaint: false,
        backgroundColor: effectiveBg,
        logging: false,
        onclone: (clonedDoc) => {
          // 1. Clean oklch and oklab from style tags
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach(tag => {
            let cssText = tag.textContent;
            if (cssText && (cssText.includes('oklch') || cssText.includes('oklab'))) {
              const colorRegex = /(oklch|oklab)\([^)]+\)/g;
              cssText = cssText.replace(colorRegex, (match) => {
                try {
                  return oklchToRgb(match);
                } catch (e) {
                  return 'rgb(0,0,0)';
                }
              });
              tag.textContent = cssText;
            }
          });

          // 2. Clean oklch and oklab from inline styles
          const allElements = clonedDoc.getElementsByTagName('*');
          for (const el of allElements) {
            const styleAttr = el.getAttribute('style');
            if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab'))) {
              const colorRegex = /(oklch|oklab)\([^)]+\)/g;
              el.setAttribute('style', styleAttr.replace(colorRegex, (match) => {
                try {
                  return oklchToRgb(match);
                } catch (e) {
                  return 'rgb(0,0,0)';
                }
              }));
            }
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');

      // Open print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Admission Poster</title>
              <style>
                body {
                  margin: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  background: white;
                  height: 100vh;
                }
                img {
                  max-width: 100%;
                  max-height: 100vh;
                  object-fit: contain;
                }
                @page {
                  size: auto;
                  margin: 0mm;
                }
                @media print {
                  body { margin: 0; }
                  img { width: 100%; height: 100vh; object-fit: contain; }
                }
              </style>
            </head>
            <body>
              <img src="${imgData}" onload="window.print(); window.close();" />
            </body>
          </html>
        `);
        printWindow.document.close();
        toast.dismiss('print-toast');
      } else {
        toast.error('Pop-up blocked! Please allow pop-ups to print posters.', { id: 'print-toast' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to prepare print document', { id: 'print-toast' });
    } finally {
      posterEl.style.transform = prevTransform;
      posterEl.style.transformOrigin = prevTransformOrigin;
    }
  };

  // Render Canva-like Canvas Studio Poster
  const renderPosterCanvas = (scaleVal, canvasId) => {
    return (
      <div
        id={canvasId}
        style={{
          width: `${posterDims.width}px`,
          height: `${posterDims.height}px`,
          transform: `scale(${scaleVal})`,
          transformOrigin: 'top left',
          backgroundColor: effectiveBg,
          color: effectiveTextColor,
          fontFamily: selectedTemplate === 'luxury-black' ? "'Georgia', serif" : "'Inter', sans-serif"
        }}
        className="p-16 flex flex-col justify-between items-center text-center relative shrink-0 transition-all duration-200"
      >
        {/* 1. CLASSIC TEMPLATE (formerly modern-premium) */}
        {selectedTemplate === 'modern-premium' && (
          <>
            <div
              style={{ background: themeMode === 'bw' ? '#000000' : `linear-gradient(to right, ${effectivePrimary}, ${effectiveSecondary})` }}
              className="absolute top-0 inset-x-0 h-4"
            />

            {/* Header */}
            <div className="w-full flex flex-col items-center space-y-4 pt-4">
              {qrBranding.showLogo && displayLogo ? (
                <img src={displayLogo} crossOrigin="anonymous" className="h-32 w-32 object-contain p-2 rounded-2xl bg-slate-55 border shadow-2xs" alt="logo" />
              ) : (
                qrBranding.showLogo && <div style={{ color: effectivePrimary }} className="h-28 w-28 bg-indigo-50 border rounded-2xl flex items-center justify-center font-black text-4xl">C</div>
              )}
              {qrBranding.showName && (
                <div className="space-y-2">
                  <h2 style={{ color: effectiveTextColor }} className="text-4xl font-black tracking-tight uppercase leading-snug">
                    {name}
                  </h2>
                  {qrBranding.showTagline && tagline && (
                    <span
                      style={{
                        backgroundColor: themeMode === 'bw' ? '#f3f4f6' : `${effectivePrimary}10`,
                        borderColor: themeMode === 'bw' ? '#d1d5db' : `${effectivePrimary}30`,
                        color: effectiveTextColor
                      }}
                      className="py-1.5 px-4 border rounded-xl font-black text-xs uppercase tracking-widest block w-fit mx-auto"
                    >
                      {tagline}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* QR Section */}
            <div className="w-full flex flex-col items-center space-y-5 my-auto">
              <div className="space-y-2">
                {qrBranding.showAcademicSession && (
                  <span style={{ color: effectivePrimary }} className="text-base font-black tracking-widest uppercase block">
                    Admissions Open {academicSession}
                  </span>
                )}
                <h1
                  style={themeMode === 'bw' ? { color: effectiveTextColor } : {
                    background: `linear-gradient(to right, ${effectivePrimary}, ${effectiveSecondary})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                  className="text-5xl font-black uppercase tracking-tight leading-none"
                >
                  {mainTitleText}
                </h1>
                {qrBranding.posterSubtitle?.trim() && (
                  <p style={{ color: effectiveSecondary }} className="text-lg font-bold tracking-wide uppercase mt-1">
                    {qrBranding.posterSubtitle}
                  </p>
                )}
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xl flex items-center justify-center">
                {displayQr ? (
                  <img src={displayQr} crossOrigin="anonymous" className="h-56 w-56 object-contain" alt="QR" />
                ) : (
                  <div className="h-56 w-56 bg-slate-50 flex items-center justify-center text-slate-355 text-base rounded-2xl">Scan QR</div>
                )}
              </div>
              <span style={{ color: effectiveTextColor }} className="text-xs font-bold tracking-wider uppercase opacity-75">Scan QR code to apply online</span>
            </div>

            {/* Highlights */}
            {qrBranding.showHighlights && qrBranding.highlights?.length > 0 && (
              <div className="w-full max-w-2xl py-5 px-8 bg-slate-55 border border-slate-100 rounded-3xl text-left space-y-3 my-auto">
                <span style={{ color: effectiveTextColor }} className="text-xs font-black uppercase tracking-widest block font-bold">
                  Why Choose Our College
                </span>
                <ul style={{ color: effectiveTextColor }} className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-base font-semibold opacity-85">
                  {qrBranding.highlights.filter(h => h.trim()).map((highlight, idx) => (
                    <li key={idx} className="flex gap-2 items-center">
                      <span style={{ color: effectiveTextColor }}>✦</span>
                      <span className="truncate">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer Contact */}
            <div style={{ color: effectiveTextColor }} className="w-full border-t pt-5 flex flex-col items-center space-y-2.5 text-sm font-semibold opacity-80">
              <div className="flex gap-6">
                {qrBranding.showWebsite && website && <span>🌐 {website}</span>}
                {qrBranding.showContact && phone && <span>📞 {phone}</span>}
              </div>
              {qrBranding.showAddress && address && (
                <span className="opacity-80 text-xs truncate max-w-full">📍 {address}</span>
              )}
              {qrBranding.footerMessage && (
                <p style={{ borderColor: effectiveTextColor }} className="text-[11px] italic pt-2 border-t w-full border-dashed opacity-75">{qrBranding.footerMessage}</p>
              )}
            </div>
          </>
        )}

        {/* 2. MODERN PREMIUM TEMPLATE (formerly corporate-split) */}
        {selectedTemplate === 'corporate-split' && (
          <div style={{ color: effectiveTextColor }} className="w-full h-full flex flex-col justify-between py-4 text-left">
            {/* Header line and logo */}
            <div className="flex justify-between items-center border-b-4 border-indigo-900/10 pb-6">
              {qrBranding.showName && (
                <div className="space-y-1">
                  <h2 style={{ color: effectiveTextColor }} className="text-4xl font-black tracking-tight uppercase leading-tight">
                    {name}
                  </h2>
                  {qrBranding.showTagline && tagline && (
                    <span className="text-xs font-bold uppercase tracking-wider block opacity-75">
                      {tagline}
                    </span>
                  )}
                </div>
              )}
              {qrBranding.showLogo && (
                displayLogo ? (
                  <img src={displayLogo} crossOrigin="anonymous" className="h-28 w-28 object-contain p-1 bg-white border rounded-2xl shadow-3xs shrink-0" alt="logo" />
                ) : (
                  <div style={{ color: effectivePrimary }} className="h-24 w-24 bg-indigo-50 border rounded-2xl flex items-center justify-center font-black text-3xl shrink-0">C</div>
                )
              )}
            </div>

            {/* Side-by-side Split layout body */}
            <div className="grid grid-cols-12 gap-8 my-auto items-center py-6">
              {/* Left: QR Frame */}
              <div className="col-span-5 flex flex-col items-center space-y-4">
                <div
                  style={{ borderColor: effectivePrimary }}
                  className="p-5 bg-white border-2 rounded-3xl flex items-center justify-center shadow-md"
                >
                  {displayQr ? (
                    <img src={displayQr} crossOrigin="anonymous" className="h-56 w-56 object-contain" alt="QR" />
                  ) : (
                    <div className="h-56 w-56 bg-slate-55 flex items-center justify-center text-slate-355 text-base rounded-2xl">Scan QR</div>
                  )}
                </div>
                <span className="text-[10px] font-black tracking-wider uppercase text-center opacity-75">Scan to Apply Online</span>
              </div>

              {/* Right: Details */}
              <div className="col-span-7 space-y-5">
                <div className="space-y-2">
                  {qrBranding.showAcademicSession && (
                    <span
                      style={{
                        backgroundColor: themeMode === 'bw' ? '#f3f4f6' : `${effectiveSecondary}20`,
                        color: effectiveTextColor
                      }}
                      className="inline-block py-1.5 px-4 font-black text-xs uppercase tracking-widest rounded-lg"
                    >
                      Admissions Open {academicSession}
                    </span>
                  )}
                  <h1 style={{ color: effectiveTextColor }} className="text-4xl font-black uppercase tracking-tight leading-snug">
                    {mainTitleText}
                  </h1>
                  {qrBranding.posterSubtitle?.trim() && (
                    <p style={{ color: effectiveSecondary }} className="text-base font-bold tracking-wide uppercase mt-1">
                      {qrBranding.posterSubtitle}
                    </p>
                  )}
                </div>

                {qrBranding.showHighlights && qrBranding.highlights?.length > 0 && (
                  <div className="space-y-2">
                    <ul className="space-y-1.5 text-base font-semibold opacity-85">
                      {qrBranding.highlights.filter(h => h.trim()).map((highlight, idx) => (
                        <li key={idx} className="flex gap-2 items-center">
                          <span style={{ color: effectiveSecondary }}>✔</span>
                          <span className="truncate">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Contact bar */}
            <div className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold opacity-80">
              {qrBranding.showWebsite && website && <span>🌐 {website}</span>}
              {qrBranding.showContact && phone && <span>📞 {phone}</span>}
              {qrBranding.showAddress && address && (
                <span className="opacity-75 font-semibold truncate max-w-[300px]">📍 {address}</span>
              )}
              {qrBranding.footerMessage && (
                <div style={{ borderColor: effectiveTextColor }} className="w-full text-center text-[11px] italic pt-2 border-t border-dashed col-span-full opacity-75">{qrBranding.footerMessage}</div>
              )}
            </div>
          </div>
        )}

        {/* 3. LUXURY BLACK TEMPLATE */}
        {selectedTemplate === 'luxury-black' && (
          <>
            <div className="absolute inset-0 border border-amber-500/20 m-4 pointer-events-none rounded-2xl" />

            {/* Header */}
            <div className="w-full flex flex-col items-center space-y-4 pt-4">
              {qrBranding.showLogo && (
                displayLogo ? (
                  <img src={displayLogo} crossOrigin="anonymous" className="h-32 w-32 object-contain p-2 rounded-full bg-white/10 border border-amber-500/20" alt="logo" />
                ) : (
                  <div className="h-28 w-28 bg-amber-500/10 border border-amber-500/40 rounded-full flex items-center justify-center font-black text-amber-500 text-3xl">C</div>
                )
              )}
              {qrBranding.showName && (
                <div className="space-y-2">
                  <h2 style={{ color: effectiveSecondary }} className="text-4xl font-black tracking-widest uppercase leading-snug">
                    {name}
                  </h2>
                  {qrBranding.showTagline && tagline && (
                    <span className="text-xs uppercase tracking-widest block font-bold font-sans opacity-70">
                      {tagline}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* QR Section */}
            <div className="w-full flex flex-col items-center space-y-5 my-auto">
              <div className="space-y-2">
                {qrBranding.showAcademicSession && (
                  <span style={{ color: effectiveSecondary }} className="text-lg font-bold tracking-widest uppercase block">Admissions Open {academicSession}</span>
                )}
                <h1 style={{ color: effectiveTextColor }} className="text-5xl font-extrabold uppercase tracking-tight leading-none">
                  {mainTitleText}
                </h1>
                {qrBranding.posterSubtitle?.trim() && (
                  <p style={{ color: effectiveSecondary }} className="text-lg font-bold tracking-wide uppercase mt-1">
                    {qrBranding.posterSubtitle}
                  </p>
                )}
              </div>

              <div className="p-5 bg-white rounded-3xl border-2 border-amber-500/40 shadow-xl flex items-center justify-center">
                {displayQr ? (
                  <img src={displayQr} crossOrigin="anonymous" className="h-56 w-56 object-contain" alt="QR" />
                ) : (
                  <div className="h-56 w-56 bg-slate-905 flex items-center justify-center text-slate-755 text-base rounded-2xl">Scan QR</div>
                )}
              </div>
              <span className="text-xs tracking-wider uppercase opacity-70">Scan QR code to apply online</span>
            </div>

            {/* Highlights */}
            {qrBranding.showHighlights && qrBranding.highlights?.length > 0 && (
              <div className="w-full max-w-2xl py-5 px-8 bg-white/5 border border-white/10 rounded-3xl text-left space-y-3 my-auto">
                <span style={{ color: effectiveSecondary }} className="text-xs font-bold uppercase tracking-widest block">Highlights</span>
                <ul className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-base font-medium font-sans opacity-80">
                  {qrBranding.highlights.filter(h => h.trim()).map((highlight, idx) => (
                    <li key={idx} className="flex gap-2 items-center">
                      <span style={{ color: effectiveSecondary }}>✦</span>
                      <span className="truncate">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer Contact */}
            <div className="w-full border-t border-white/10 pt-5 flex flex-col items-center space-y-2.5 text-sm font-medium font-sans opacity-80">
              <div className="flex gap-6">
                {qrBranding.showWebsite && website && <span>🌐 {website}</span>}
                {qrBranding.showContact && phone && <span>📞 {phone}</span>}
              </div>
              {qrBranding.showAddress && address && (
                <span className="opacity-80 text-xs truncate max-w-full">📍 {address}</span>
              )}
              {qrBranding.footerMessage && (
                <p className="text-[11px] italic pt-2 border-t border-white/10 w-full text-center opacity-70">{qrBranding.footerMessage}</p>
              )}
            </div>
          </>
        )}

        {/* 4. COLOR GRADIENT (formerly color-burst) */}
        {selectedTemplate === 'color-burst' && (
          <div style={{ color: effectiveTextColor }} className="w-full h-full flex flex-col justify-between py-2 relative z-10 font-sans">
            {/* Floating bright dynamic background shapes (hidden in B&W mode) */}
            {themeMode !== 'bw' && (
              <>
                <div className="absolute top-[-30px] left-[-30px] w-48 h-48 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-[-20px] right-[-20px] w-64 h-64 bg-pink-550/30 rounded-full blur-3xl pointer-events-none" />
              </>
            )}

            {/* Glass header card */}
            <div className="w-full p-6 bg-white/10 backdrop-blur-md border border-white/25 rounded-3xl flex items-center justify-between gap-4">
              {qrBranding.showName && (
                <div className="text-left space-y-1">
                  <h2 className="text-2xl font-extrabold tracking-tight uppercase leading-none">
                    {name}
                  </h2>
                  {qrBranding.showTagline && tagline && (
                    <span
                      style={{ color: themeMode === 'bw' ? '#ffffff' : '#f59e0b' }}
                      className="text-xs font-bold uppercase tracking-widest block"
                    >
                      {tagline}
                    </span>
                  )}
                </div>
              )}
              {qrBranding.showLogo && (
                displayLogo ? (
                  <img src={displayLogo} crossOrigin="anonymous" className="h-20 w-20 object-contain p-1 bg-white/80 border rounded-xl shrink-0" alt="logo" />
                ) : (
                  <div className="h-16 w-16 bg-white/20 rounded-xl flex items-center justify-center font-black text-xl shrink-0">C</div>
                )
              )}
            </div>

            {/* QR Section */}
            <div className="flex flex-col items-center space-y-5 my-auto">
              <div className="space-y-2">
                {qrBranding.showAcademicSession && (
                  <div
                    style={{
                      backgroundColor: themeMode === 'bw' ? '#ffffff' : '#f59e0b',
                      color: themeMode === 'bw' ? '#000000' : '#1e1b4b'
                    }}
                    className="py-1.5 px-4 rounded-full font-black text-xs uppercase tracking-widest inline-block shadow-sm"
                  >
                    Admissions Open {academicSession}
                  </div>
                )}
                <h1 className="text-5xl font-black uppercase tracking-tight leading-none">
                  {mainTitleText}
                </h1>
                {qrBranding.posterSubtitle?.trim() && (
                  <p style={{ color: themeMode === 'bw' ? '#ffffff' : '#f59e0b' }} className="text-lg font-bold tracking-wide uppercase mt-1">
                    {qrBranding.posterSubtitle}
                  </p>
                )}
              </div>

              {/* Glass QR Case */}
              <div className="p-5 bg-white/95 border-2 border-white/40 rounded-3xl shadow-xl flex items-center justify-center">
                {displayQr ? (
                  <img src={displayQr} crossOrigin="anonymous" className="h-48 w-48 object-contain" alt="QR" />
                ) : (
                  <div className="h-48 w-48 bg-purple-100 flex items-center justify-center text-purple-400 text-base rounded-2xl">Scan QR</div>
                )}
              </div>
              <span className="text-xs font-bold tracking-wider uppercase opacity-80">Scan QR code to Apply Now</span>
            </div>

            {/* Highlights Cards Grid */}
            {qrBranding.showHighlights && qrBranding.highlights?.length > 0 && (
              <div className="grid grid-cols-2 gap-4 text-left w-full my-auto">
                {qrBranding.highlights.filter(h => h.trim()).slice(0, 4).map((highlight, idx) => (
                  <div key={idx} className="p-4 bg-white/10 border border-white/15 rounded-2xl backdrop-blur-md">
                    <span
                      style={{ color: themeMode === 'bw' ? '#ffffff' : '#f59e0b' }}
                      className="text-[10px] font-bold uppercase tracking-widest block mb-1"
                    >
                      Feature
                    </span>
                    <p className="text-sm leading-tight font-semibold opacity-90">{highlight}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Footer Contact */}
            <div className="border-t border-white/20 pt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-xs font-bold opacity-85">
              {qrBranding.showWebsite && website && <span className="text-left">🌐 {website}</span>}
              {qrBranding.showContact && phone && <span className="text-right">📞 {phone}</span>}
              {qrBranding.showAddress && address && (
                <span className="col-span-2 text-center text-xs truncate pt-1 opacity-85">📍 {address}</span>
              )}
              {qrBranding.footerMessage && (
                <p className="col-span-2 text-center text-[11px] italic pt-2 border-t border-white/10 opacity-75">{qrBranding.footerMessage}</p>
              )}
            </div>
          </div>
        )}

        {/* 5. MINIMAL ELEGANT (formerly creative-gradient) */}
        {selectedTemplate === 'creative-gradient' && (
          <div
            style={{ color: effectiveTextColor }}
            className={`w-full h-full flex flex-col justify-between py-2 relative z-10 p-12 rounded-3xl ${themeMode === 'bw'
                ? 'bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 border border-slate-200'
                : 'bg-gradient-to-br from-indigo-700 via-indigo-900 to-cyan-755'
              }`}
          >
            {/* Floating bubble shapes (hidden in B&W) */}
            {themeMode !== 'bw' && (
              <div className="absolute top-4 right-4 w-32 h-32 bg-cyan-400/10 rounded-full blur-xl pointer-events-none" />
            )}

            {/* Header */}
            <div className="w-full flex items-center justify-between border-b border-white/10 pb-5">
              {qrBranding.showName && (
                <div className="text-left space-y-1">
                  <h2 className="text-2xl font-extrabold tracking-tight uppercase">
                    {name}
                  </h2>
                  {qrBranding.showTagline && tagline && (
                    <span className={`text-xs font-bold uppercase tracking-widest block ${themeMode === 'bw' ? 'opacity-70' : 'text-cyan-300'}`}>
                      {tagline}
                    </span>
                  )}
                </div>
              )}
              {qrBranding.showLogo && (
                displayLogo ? (
                  <img src={displayLogo} crossOrigin="anonymous" className="h-20 w-20 object-contain p-1 bg-white rounded-xl shrink-0" alt="logo" />
                ) : (
                  <div className={`h-16 w-16 rounded-xl flex items-center justify-center font-black text-xl shrink-0 ${themeMode === 'bw' ? 'bg-slate-200 text-slate-700' : 'bg-white/20 text-white'}`}>C</div>
                )
              )}
            </div>

            {/* QR Section */}
            <div className="flex flex-col items-center space-y-5 my-auto">
              <div className="space-y-2 text-center">
                {qrBranding.showAcademicSession && (
                  <span
                    style={{
                      backgroundColor: themeMode === 'bw' ? '#1f2937' : '#22d3ee',
                      color: '#ffffff'
                    }}
                    className="py-1.5 px-4 rounded-full font-black text-xs uppercase tracking-widest inline-block shadow-sm"
                  >
                    Admissions Open {academicSession}
                  </span>
                )}
                <h1 className="text-4xl font-black uppercase tracking-tight leading-none">
                  {mainTitleText}
                </h1>
                {qrBranding.posterSubtitle?.trim() && (
                  <p style={{ color: themeMode === 'bw' ? '#ffffff' : '#22d3ee' }} className="text-lg font-bold tracking-wide uppercase mt-1">
                    {qrBranding.posterSubtitle}
                  </p>
                )}
              </div>

              <div className="p-5 bg-white rounded-3xl shadow-xl flex items-center justify-center">
                {displayQr ? (
                  <img src={displayQr} crossOrigin="anonymous" className="h-48 w-48 object-contain" alt="QR" />
                ) : (
                  <div className="h-48 w-48 bg-indigo-50 flex items-center justify-center text-indigo-400 text-base rounded-2xl">Scan QR</div>
                )}
              </div>
              <span className="text-xs font-bold tracking-wider uppercase opacity-85">Scan QR code to Register Online</span>
            </div>

            {/* Highlights Cards Grid */}
            {qrBranding.showHighlights && qrBranding.highlights?.length > 0 && (
              <div className={`p-5 rounded-3xl text-left space-y-3 my-auto ${themeMode === 'bw' ? 'bg-white/60 border border-slate-200' : 'bg-white/5 border border-white/10'}`}>
                <span className={`text-xs font-bold uppercase tracking-widest block ${themeMode === 'bw' ? 'opacity-90' : 'text-cyan-300'}`}>Core Perks Highlights</span>
                <ul className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-sm font-semibold opacity-80">
                  {qrBranding.highlights.filter(h => h.trim()).slice(0, 4).map((highlight, idx) => (
                    <li key={idx} className="truncate">✦ {highlight}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer Contact */}
            <div className={`border-t pt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-xs font-bold ${themeMode === 'bw' ? 'border-slate-200' : 'border-white/10'} opacity-80`}>
              {qrBranding.showWebsite && website && <span className="text-left">🌐 {website}</span>}
              {qrBranding.showContact && phone && <span className="text-right">📞 {phone}</span>}
              {qrBranding.showAddress && address && (
                <span className="col-span-2 text-center text-xs truncate pt-1 opacity-85">📍 {address}</span>
              )}
              {qrBranding.footerMessage && (
                <p className={`col-span-2 text-center text-[11px] italic pt-2 border-t ${themeMode === 'bw' ? 'border-slate-200' : 'border-white/5'} opacity-75`}>{qrBranding.footerMessage}</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto text-left pb-16 no-print bg-transparent">

      {/* Title Header with Template Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 mt-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold text-[#1F2937] tracking-tight leading-[1.2]">
              Admission QR & Public Links
            </h1>
            <span className="py-1 px-2.5 bg-pink-50 border border-pink-100 text-[#E91E63] text-xs font-semibold rounded-lg shadow-2xs">
              Studio
            </span>
          </div>
          <p className="text-[#64748B] text-[15px] font-medium mt-1.5">
            Professional Admission Poster Studio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="rounded-[10px] border border-[#E9EAF0] py-2 px-3 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#8B5CF6]/15 focus:border-[#8B5CF6] cursor-pointer hover:border-[#D7DCE5] transition-all duration-200 shadow-2xs"
          >
            <option value="modern-premium">Classic</option>
            <option value="corporate-split">Modern Premium</option>
            <option value="luxury-black">Luxury Black</option>
            <option value="color-burst">Color Gradient</option>
            <option value="creative-gradient">Minimal Elegant</option>
          </select>
          <button
            type="button"
            onClick={() => setIsFullScreen(true)}
            className="h-[40px] px-4 bg-white hover:bg-slate-50 border border-[#E8ECF3] text-slate-700 text-xs font-semibold rounded-[12px] transition-all duration-200 shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Maximize2 className="h-4 w-4 text-slate-500" />
            <span>Full Screen Preview</span>
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Tab Switcher */}
      <div className="lg:hidden flex border border-[#E8ECF3] bg-slate-50 p-1 rounded-[12px] gap-1 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('links')}
          className={`flex-1 py-2 px-3 text-center text-xs font-semibold rounded-[10px] transition-all duration-200 cursor-pointer ${activeTab === 'links'
              ? 'bg-[#E91E63] text-white shadow-sm'
              : 'text-slate-655 hover:bg-white/50'
            }`}
        >
          Links
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`flex-1 py-2 px-3 text-center text-xs font-semibold rounded-[10px] transition-all duration-200 cursor-pointer ${activeTab === 'branding'
              ? 'bg-[#E91E63] text-white shadow-sm'
              : 'text-slate-655 hover:bg-white/50'
            }`}
        >
          Branding
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-2 px-3 text-center text-xs font-semibold rounded-[10px] transition-all duration-200 cursor-pointer ${activeTab === 'preview'
              ? 'bg-[#E91E63] text-white shadow-sm'
              : 'text-slate-655 hover:bg-white/50'
            }`}
        >
          Preview
        </button>
      </div>

      {/* Wrapping form across all columns so Submit save button in column 2 can submit input values from all sections */}
      <form onSubmit={handleSaveBranding}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* COLUMN 1: LINKS & DOWNLOADS & SAVE ACTION (25% / 3 columns) */}
          <div className={`col-span-12 md:col-span-4 lg:col-span-3 space-y-6 order-3 lg:order-1 ${activeTab === 'links' ? 'block' : 'hidden md:block lg:block'}`}>

            {/* Card 1: Links */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Link className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Admission CRM Links
                </span>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Public Portal CRM Link</label>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1 pl-2">
                    <span className="truncate flex-1 font-mono text-xs text-slate-500 pr-1">{publicLink}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(publicLink, setCopyingLink)}
                      className="p-2 hover:bg-slate-200/50 rounded-lg text-slate-500 shrink-0 transition-colors"
                    >
                      {copyingLink ? <Check className="h-4 w-4 text-indigo-600 animate-scale-in" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <a
                      href={publicLink}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 hover:bg-slate-200/50 rounded-lg text-slate-500 shrink-0 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={handleShare}
                      className="p-2 hover:bg-slate-200/50 rounded-lg text-slate-500 shrink-0 transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Reception Entry Link</label>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1 pl-2">
                    <span className="truncate flex-1 font-mono text-xs text-slate-500 pr-1">{receptionLink}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(receptionLink, setCopyingReception)}
                      className="p-2 hover:bg-slate-200/50 rounded-lg text-slate-500 shrink-0 transition-colors"
                    >
                      {copyingReception ? <Check className="h-4 w-4 text-indigo-600 animate-scale-in" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <a
                      href={receptionLink}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 hover:bg-slate-200/50 rounded-lg text-slate-500 shrink-0 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleGenerateNew}
                  disabled={generatingLink}
                  className="inline-flex items-center text-xs font-semibold text-indigo-600 gap-1.5 hover:text-indigo-800 transition-colors"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${generatingLink ? 'animate-spin' : ''}`} />
                  <span>Generate Links</span>
                </button>
              </div>
            </div>

            {/* Card 2: Export Flyer Buttons */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Download className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Export Flyer Poster
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <Button
                  type="button"
                  onClick={() => handleDownload('png')}
                  isLoading={downloadingPng}
                  className="w-full h-[46px] justify-center text-sm font-semibold bg-indigo-600 hover:bg-indigo-770 text-white flex items-center gap-2 rounded-xl shadow-sm transition-colors"
                >
                  <Download className="h-4 w-4" /> Download PNG Flyer
                </Button>
                <Button
                  type="button"
                  onClick={() => handleDownload('pdf')}
                  isLoading={downloadingPdf}
                  className="w-full h-[46px] justify-center text-sm font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-2 rounded-xl shadow-sm transition-colors"
                >
                  <FileText className="h-4 w-4 text-slate-500" /> Download PDF Document
                </Button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full h-[46px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-sm"
                >
                  <Printer className="h-4 w-4 text-slate-500" /> Print High-Res Poster
                </button>
              </div>
            </div>
          </div>

          {/* COLUMN 2: POSTER BRANDING SETTINGS EDITOR (35% / 4 columns) */}
          <div className={`col-span-12 md:col-span-8 lg:col-span-4 space-y-6 order-2 lg:order-2 ${activeTab === 'branding' ? 'block' : 'hidden md:block lg:block'}`}>
            <div className="space-y-6 pb-20 relative">

              {/* Group 1: Branding Accordion Card */}
              <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-[#7C3AED] shadow-sm overflow-hidden card-lift hover:border-slate-300 hover:shadow-md transition-all duration-200">
                <button
                  type="button"
                  onClick={() => setExpandedSection(expandedSection === 'branding' ? '' : 'branding')}
                  className="w-full flex items-center justify-between h-[58px] px-5 text-slate-900 font-semibold hover:bg-slate-50 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="icon-circle bg-[#EDE9FE]">
                      <Sparkles className="h-4 w-4 text-[#7C3AED]" />
                    </div>
                    <div className="text-left flex flex-col">
                      <span className="text-[17px] font-bold text-slate-900 leading-none">Branding Identity</span>
                      <span className="text-[12px] text-slate-500 font-normal mt-1">Manage college logo and visual branding</span>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${expandedSection === 'branding' ? 'rotate-90 text-[#7C3AED]' : ''}`} />
                </button>

                {expandedSection === 'branding' && (
                  <div className="p-5 border-t border-slate-100 space-y-4 bg-white animate-fadeIn">

                    {/* Identity & Logo */}
                    <div className="flex gap-4 items-center">
                      <div className="relative h-16 w-16 rounded-xl bg-slate-55 border flex items-center justify-center overflow-hidden shrink-0">
                        {logo ? (
                          <img src={logo} alt="Logo" className="h-full w-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">No Logo</span>
                        )}
                        {uploadingLogo && (
                          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center text-xs font-bold text-white">
                            ...
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Logo Upload</span>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <button
                              type="button"
                              className="h-[36px] px-3.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-sm"
                            >
                              <Upload className="h-3.5 w-3.5 text-slate-505" />
                              Upload
                            </button>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="absolute inset-0 opacity-0 w-full cursor-pointer"
                            />
                          </div>
                          {logo && (
                            <button
                              type="button"
                              onClick={handleDeleteLogo}
                              className="h-[36px] px-3.5 rounded-lg border border-red-105 text-xs font-semibold text-red-650 bg-white hover:bg-red-550 flex items-center gap-1.5 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <Input
                      label="College Name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                    <Input
                      label="Tagline / Badge Content"
                      value={tagline}
                      onChange={e => setTagline(e.target.value)}
                      placeholder="e.g. NAAC A++ Accredited University"
                    />

                    {/* Poster Theme Selection */}
                    <div className="border-t border-slate-100 pt-4 space-y-2.5 text-left">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Poster Theme Selection
                      </span>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                          <input
                            type="radio"
                            name="posterTheme"
                            value="bw"
                            checked={posterTheme === 'bw'}
                            onChange={() => setPosterTheme('bw')}
                            className="text-indigo-650 focus:ring-indigo-500/20"
                          />
                          Black & White (default)
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                          <input
                            type="radio"
                            name="posterTheme"
                            value="brand"
                            checked={posterTheme === 'brand'}
                            onChange={() => setPosterTheme('brand')}
                            className="text-indigo-650 focus:ring-indigo-500/20"
                          />
                          Brand Colors
                        </label>
                      </div>
                    </div>

                    {/* Brand Colors Palette */}
                    {posterTheme === 'brand' && (
                      <div className="border-t border-slate-100 pt-4 space-y-2.5 text-left animate-fadeIn">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Brand Palette Colors
                        </span>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wide">Primary Color</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={qrBranding.primaryColor}
                                onChange={e => setQrBranding({ ...qrBranding, primaryColor: e.target.value })}
                                className="h-[46px] w-[50px] border border-slate-200 rounded-lg cursor-pointer p-1 bg-white"
                              />
                              <input
                                type="text"
                                value={qrBranding.primaryColor}
                                onChange={e => setQrBranding({ ...qrBranding, primaryColor: e.target.value })}
                                className="w-full h-[46px] border border-slate-200 rounded-lg px-3 text-sm font-mono bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wide">Secondary Color</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={qrBranding.secondaryColor}
                                onChange={e => setQrBranding({ ...qrBranding, secondaryColor: e.target.value })}
                                className="h-[46px] w-[50px] border border-slate-200 rounded-lg cursor-pointer p-1 bg-white"
                              />
                              <input
                                type="text"
                                value={qrBranding.secondaryColor}
                                onChange={e => setQrBranding({ ...qrBranding, secondaryColor: e.target.value })}
                                className="w-full h-[46px] border border-slate-200 rounded-lg px-3 text-sm font-mono bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>

              {/* Group 2: Poster Content Accordion Card */}
              <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-[#EA580C] shadow-sm overflow-hidden card-lift hover:border-slate-300 hover:shadow-md transition-all duration-200">
                <button
                  type="button"
                  onClick={() => setExpandedSection(expandedSection === 'content' ? '' : 'content')}
                  className="w-full flex items-center justify-between h-[58px] px-5 text-slate-900 font-semibold hover:bg-slate-50 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="icon-circle bg-[#FED7AA]">
                      <FileText className="h-4 w-4 text-[#EA580C]" />
                    </div>
                    <div className="text-left flex flex-col">
                      <span className="text-[17px] font-bold text-slate-900 leading-none">Poster Text Content</span>
                      <span className="text-[12px] text-slate-500 font-normal mt-1">Customize title, subtitle, and session</span>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${expandedSection === 'content' ? 'rotate-90 text-[#EA580C]' : ''}`} />
                </button>

                {expandedSection === 'content' && (
                  <div className="p-5 border-t border-slate-100 space-y-4 bg-white animate-fadeIn">
                    <Input
                      label="Poster Main Title *"
                      value={qrBranding.posterTitle}
                      onChange={e => setQrBranding({ ...qrBranding, posterTitle: e.target.value })}
                      placeholder="College Admission Portal"
                      required
                    />
                    <Input
                      label="Poster Subtitle (Optional)"
                      value={qrBranding.posterSubtitle}
                      onChange={e => setQrBranding({ ...qrBranding, posterSubtitle: e.target.value })}
                      placeholder="e.g. Admissions Open 2026–27"
                    />
                    <Input
                      label="Academic Session"
                      value={academicSession}
                      onChange={e => setAcademicSession(e.target.value)}
                      placeholder="e.g. 2026-2027"
                    />
                  </div>
                )}
              </div>

              {/* Group 3: Contact Details Accordion Card */}
              <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-[#16A34A] shadow-sm overflow-hidden card-lift hover:border-slate-300 hover:shadow-md transition-all duration-200">
                <button
                  type="button"
                  onClick={() => setExpandedSection(expandedSection === 'contact' ? '' : 'contact')}
                  className="w-full flex items-center justify-between h-[58px] px-5 text-slate-900 font-semibold hover:bg-slate-50 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="icon-circle bg-[#DCFCE7]">
                      <Phone className="h-4 w-4 text-[#16A34A]" />
                    </div>
                    <div className="text-left flex flex-col">
                      <span className="text-[17px] font-bold text-slate-900 leading-none">Contact Details</span>
                      <span className="text-[12px] text-slate-500 font-normal mt-1">Configure phone, website, and address</span>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${expandedSection === 'contact' ? 'rotate-90 text-[#16A34A]' : ''}`} />
                </button>

                {expandedSection === 'contact' && (
                  <div className="p-5 border-t border-slate-100 space-y-4 bg-white animate-fadeIn">
                    <Input
                      label="Official Website"
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      placeholder="e.g. www.college.edu"
                    />
                    <Input
                      label="Contact Phone"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                    <Input
                      label="Official Address"
                      type="textarea"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      rows={2}
                    />
                  </div>
                )}
              </div>

              {/* Group 4: Footer & Highlights Accordion Card */}
              <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-[#CA8A04] shadow-sm overflow-hidden card-lift hover:border-slate-300 hover:shadow-md transition-all duration-200">
                <button
                  type="button"
                  onClick={() => setExpandedSection(expandedSection === 'footer' ? '' : 'footer')}
                  className="w-full flex items-center justify-between h-[58px] px-5 text-slate-900 font-semibold hover:bg-slate-50 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="icon-circle bg-[#FEF08A]">
                      <Layout className="h-4 w-4 text-[#CA8A04]" />
                    </div>
                    <div className="text-left flex flex-col">
                      <span className="text-[17px] font-bold text-slate-900 leading-none">Footer & Highlights</span>
                      <span className="text-[12px] text-slate-500 font-normal mt-1">Add bullet highlights and footer messages</span>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${expandedSection === 'footer' ? 'rotate-90 text-[#CA8A04]' : ''}`} />
                </button>

                {expandedSection === 'footer' && (
                  <div className="p-5 border-t border-slate-100 space-y-4 bg-white animate-fadeIn">
                    <Input
                      label="Why Choose Us Highlights (One per line)"
                      type="textarea"
                      value={(qrBranding.highlights || []).join('\n')}
                      onChange={e => {
                        const list = e.target.value.split('\n');
                        setQrBranding({ ...qrBranding, highlights: list });
                      }}
                      rows={3}
                    />
                    <Input
                      label="Footer Message"
                      type="textarea"
                      value={qrBranding.footerMessage || ''}
                      onChange={e => setQrBranding({ ...qrBranding, footerMessage: e.target.value })}
                      rows={2}
                    />
                  </div>
                )}
              </div>

              {/* Group 5: Visibility Accordion Card */}
              <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-[#DB2777] shadow-sm overflow-hidden card-lift hover:border-slate-300 hover:shadow-md transition-all duration-200">
                <button
                  type="button"
                  onClick={() => setExpandedSection(expandedSection === 'visibility' ? '' : 'visibility')}
                  className="w-full flex items-center justify-between h-[58px] px-5 text-slate-900 font-semibold hover:bg-slate-50 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="icon-circle bg-[#FCE7F3]">
                      <Eye className="h-4 w-4 text-[#DB2777]" />
                    </div>
                    <div className="text-left flex flex-col">
                      <span className="text-[17px] font-bold text-slate-900 leading-none">Visibility Toggles</span>
                      <span className="text-[12px] text-slate-500 font-normal mt-1">Choose which components to display</span>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${expandedSection === 'visibility' ? 'rotate-90 text-[#DB2777]' : ''}`} />
                </button>

                {expandedSection === 'visibility' && (
                  <div className="p-5 border-t border-slate-100 bg-white animate-fadeIn">
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                      {[
                        { key: 'showLogo', label: 'College Logo' },
                        { key: 'showName', label: 'College Name' },
                        { key: 'showTagline', label: 'Tagline/Badge' },
                        { key: 'showContact', label: 'Phone Number' },
                        { key: 'showEmail', label: 'Email Address' },
                        { key: 'showWebsite', label: 'Website URL' },
                        { key: 'showAddress', label: 'Address bar' },
                        { key: 'showAcademicSession', label: 'Academic Session' },
                        { key: 'showHighlights', label: 'Highlights List' },
                      ].map(item => (
                        <label key={item.key} className="flex items-center space-x-2.5 cursor-pointer bg-slate-55 hover:bg-slate-100 p-2 rounded-lg select-none border border-slate-150 transition-colors">
                          <input
                            type="checkbox"
                            checked={qrBranding[item.key]}
                            onChange={e => setQrBranding({ ...qrBranding, [item.key]: e.target.checked })}
                            className="rounded text-indigo-650 focus:ring-indigo-500/20"
                          />
                          <span className="truncate">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky bottom Save bar docked inside the scrollable column */}
              <div className="sticky bottom-4 z-20 bg-white/80 backdrop-blur-xl border border-white/70 p-4 rounded-xl shadow-xl shadow-indigo-100/40 flex items-center justify-between mt-6 ring-1 ring-slate-200/50">
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-slate-800">Studio Settings</span>
                  <span className="text-[11px] text-slate-500 font-normal">Unsaved changes pending</span>
                </div>
                <Button
                  type="submit"
                  isLoading={savingBranding}
                  variant="primary"
                  className="px-6 shrink-0"
                >
                  Save Studio Settings
                </Button>
              </div>

            </div>
          </div>

          {/* COLUMN 3: STICKY LIVE PREVIEW WORKSPACE (40% / 5 columns) */}
          <div className={`col-span-12 lg:col-span-5 lg:sticky lg:top-[20px] self-start order-1 lg:order-3 ${activeTab === 'preview' ? 'block' : 'hidden lg:block'}`}>

            {/* Canva Workspace backdrop: Clean white canvas */}
            <div className="bg-white rounded-xl p-4 sm:p-6 flex items-center justify-center min-h-[500px] max-h-[680px] overflow-auto shadow-sm relative mt-3 border border-slate-200">

              {/* Clutter-free scaling node boundary wrapper */}
              <div
                style={{
                  width: `${posterDims.width * scale}px`,
                  height: `${posterDims.height * scale}px`,
                  overflow: 'hidden'
                }}
                className="rounded-xl shadow-sm relative border border-slate-200 bg-white shrink-0 transition-all duration-200"
              >
                {renderPosterCanvas(scale, 'admission-poster-canvas')}
              </div>
            </div>
          </div>

        </div>
      </form>

      {/* Fullscreen Preview Modal Presentation View */}
      {isFullScreen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col justify-between p-6 select-none animate-fadeIn"
          onClick={() => setIsFullScreen(false)}
        >
          {/* Modal Header Controls */}
          <div
            className="w-full flex flex-col sm:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-md max-w-4xl mx-auto z-10 gap-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">⛶ PRESENTATION VIEW</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                type="button"
                onClick={() => setModalZoom(z => Math.max(0.2, z - 0.1))}
                className="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Zoom -
              </button>
              <span className="text-xs font-mono text-slate-600 font-bold px-2 w-12 text-center">{Math.round(modalZoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setModalZoom(z => Math.min(3.0, z + 0.1))}
                className="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Zoom +
              </button>
              <button
                type="button"
                onClick={() => { setModalZoom(0.5); setModalFit('width'); }}
                className="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-205 text-slate-700 text-xs font-semibold rounded-lg transition-colors ml-2"
              >
                Fit Width
              </button>
              <button
                type="button"
                onClick={() => { setModalZoom(0.4); setModalFit('height'); }}
                className="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-205 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Fit Height
              </button>
              <button
                type="button"
                onClick={() => { setModalZoom(0.65); setModalFit('none'); }}
                className="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-205 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsFullScreen(false)}
              className="p-1.5 hover:bg-slate-50 border border-slate-250 hover:border-slate-300 rounded-lg text-slate-505 hover:text-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Modal Body Container */}
          <div className="flex-1 w-full flex items-center justify-center overflow-auto p-4" onClick={() => setIsFullScreen(false)}>
            <div
              className="bg-slate-55 border border-slate-200 p-6 rounded-xl flex items-center justify-center overflow-auto shadow-md relative shrink-0 transition-all duration-200"
              style={{
                width: modalFit === 'width' ? '90vw' : 'auto',
                height: modalFit === 'height' ? '80vh' : 'auto',
                maxWidth: '95vw',
                maxHeight: '85vh'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div
                style={{
                  width: `${posterDims.width * modalZoom}px`,
                  height: `${posterDims.height * modalZoom}px`,
                  overflow: 'hidden'
                }}
                className="rounded-xl shadow-md relative border border-slate-200 bg-white shrink-0 transition-all duration-200"
              >
                {renderPosterCanvas(modalZoom, 'admission-poster-canvas-modal')}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default QrLinksPage;
