import React, { useState, useEffect } from 'react';
import { useAuth } from '../../school/contexts/AuthContext';
import api from '../../school/services/schoolApi';
import Button from '../../../shared/components/Button';
import toast from 'react-hot-toast';
import EnquiryBannerPreview from '../../../shared/components/EnquiryBannerPreview';
import {
  Sparkles,
  Link as LinkIcon,
  FileText,
  Image as ImageIcon,
  Trash2,
  Upload,
  Eye,
  Plus,
  Instagram,
  Facebook,
  Youtube,
  MessageCircle,
  Linkedin,
  Globe,
  Send,
  Twitter
} from 'lucide-react';

const ThankYouCmsPage = () => {
  const { school, updateSchoolState } = useAuth();

  // Platform icon helper mapping
  const getPlatformIcon = (platform, className = "h-4.5 w-4.5") => {
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
      case 'College Website':
      case 'School Website':
        return <Globe className={className} />;
      default:
        return <LinkIcon className={className} />;
    }
  };

  // 1. Initial State Sync supporting backward compatibility mapping & College terminology
  const getInitialSocialLinks = () => {
    if (school?.thankYouCms?.socialLinks && school.thankYouCms.socialLinks.length > 0) {
      return school.thankYouCms.socialLinks.map(link => ({
        ...link,
        platform: link.platform === 'School Website' ? 'College Website' : link.platform
      }));
    }
    const legacy = [];
    if (school?.thankYouCms?.socialLink1) {
      legacy.push({ platform: 'College Website', url: school.thankYouCms.socialLink1 });
    }
    if (school?.thankYouCms?.socialLink2) {
      legacy.push({ platform: 'Facebook', url: school.thankYouCms.socialLink2 });
    }
    return legacy;
  };

  const getInitialBrochure = () => {
    if (school?.thankYouCms?.admissionBrochure && school.thankYouCms.admissionBrochure.url) {
      return school.thankYouCms.admissionBrochure;
    }
    if (school?.thankYouCms?.pdfUrl) {
      return {
        url: school.thankYouCms.pdfUrl,
        type: 'pdf',
        mimeType: 'application/pdf',
        filename: school.thankYouCms.pdfUrl.split('/').pop() || 'Admission_Brochure.pdf'
      };
    }
    return { url: '', type: '', mimeType: '', filename: '' };
  };

  // Form State hooks
  const [socialLinks, setSocialLinks] = useState(getInitialSocialLinks());
  const [admissionBrochure, setAdmissionBrochure] = useState(getInitialBrochure());
  const [banner, setBanner] = useState(school?.thankYouCms?.banner || school?.thankYouCms?.imageUrl || '');

  const [saving, setSaving] = useState(false);
  const [uploadingBrochure, setUploadingBrochure] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [scale, setScale] = useState(1);
  useEffect(() => {
    const handleResize = () => {
      const availableHeight = window.innerHeight - 150;
      const calculatedScale = Math.min(1, Math.max(0.48, availableHeight / 500));
      setScale(calculatedScale);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // File Upload Handlers
  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB limit');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    if (type === 'brochure') setUploadingBrochure(true);
    else if (type === 'banner') setUploadingBanner(true);

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
        if (type === 'brochure') {
          setAdmissionBrochure({
            url: response.fileUrl,
            type: response.type,
            mimeType: response.mimeType,
            filename: response.filename
          });
          toast.success('College brochure uploaded!');
        } else if (type === 'banner') {
          setBanner(response.fileUrl);
          toast.success('Thank you banner uploaded!');
        }
      } else {
        toast.error(response.message || 'File upload failed');
      }
    } catch (error) {
      toast.error('Upload connection error');
    } finally {
      setUploadingBrochure(false);
      setUploadingBanner(false);
    }
  };

  // Delete uploaded items
  const handleDeleteItem = (type) => {
    if (type === 'brochure') {
      setAdmissionBrochure({ url: '', type: '', mimeType: '', filename: '' });
      toast.success('College brochure cleared. Save changes to confirm.');
    } else if (type === 'banner') {
      setBanner('');
      toast.success('Banner cleared. Save changes to confirm.');
    }
  };

  // Social Links mutations
  const handleAddSocial = () => {
    if (socialLinks.length >= 4) return;
    setSocialLinks([...socialLinks, { platform: 'College Website', url: '' }]);
  };

  const handleUpdateSocial = (index, key, val) => {
    const updated = [...socialLinks];
    updated[index][key] = val;
    setSocialLinks(updated);
  };

  const handleDeleteSocial = (index) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  // Save Configs
  const handleSaveCms = async () => {
    // Validate each social link has url if configured
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
    for (const link of socialLinks) {
      if (!link.url || !link.url.trim()) {
        toast.error('Please enter a URL for all added social channels');
        return;
      }
      if (!urlRegex.test(link.url)) {
        toast.error(`Invalid URL format: ${link.url}`);
        return;
      }
    }

    setSaving(true);
    try {
      // Map College Website back to School Website for API validation compatibility
      const socialLinksPayload = socialLinks.map(link => ({
        ...link,
        platform: link.platform === 'College Website' ? 'School Website' : link.platform
      }));

      // Reuse the existing thankyou-cms update API
      const response = await api.put('/settings/thankyou-cms', {
        socialLinks: socialLinksPayload,
        admissionBrochure,
        banner,
        // Sync legacy parameters for backend backward compatibility
        socialLink1: socialLinksPayload[0]?.url || '',
        socialLink2: socialLinksPayload[1]?.url || '',
        pdfUrl: admissionBrochure?.url || '',
        imageUrl: banner || ''
      });

      if (response.success) {
        toast.success('Thank You page CMS updated successfully!');
        
        // Sync context state
        const updatedSchool = {
          ...school,
          thankYouCms: response.thankYouCms,
        };
        updateSchoolState(updatedSchool);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save CMS settings');
    } finally {
      setSaving(false);
    }
  };

  const phoneWidth = 280;
  const phoneHeight = 495;

  return (
    <div className="space-y-4 text-left">
      <div>
        <h2 className="text-lg font-black text-slate-900 tracking-tight">Enquiry Banner Settings</h2>
        <p className="text-slate-500 text-xs mt-0.5">
          Configure real-time brochures and updates parents receive instantly upon submitting registration applications.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left configurations panel - 65% width */}
        <div className="w-full lg:w-[65%] space-y-4">
          
          {/* Section 1: Social Links Configuration */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <LinkIcon className="h-4 w-4 text-indigo-500" />
                Follow Us Links ({socialLinks.length}/4)
              </h4>
              <button
                type="button"
                onClick={handleAddSocial}
                disabled={socialLinks.length >= 4}
                className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Link
              </button>
            </div>

            <div className="space-y-2.5">
              {socialLinks.map((link, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <div className="flex items-center justify-center h-8 w-8 bg-slate-50 rounded-lg text-slate-500 border border-slate-100 flex-shrink-0">
                    {getPlatformIcon(link.platform, "h-4 w-4")}
                  </div>

                  <select
                    value={link.platform}
                    onChange={(e) => handleUpdateSocial(idx, 'platform', e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {['Instagram', 'Facebook', 'YouTube', 'WhatsApp', 'LinkedIn', 'X (Twitter)', 'Telegram', 'College Website', 'Other'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) => handleUpdateSocial(idx, 'url', e.target.value)}
                    placeholder="https://yoursocial.com/url"
                    className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />

                  <button
                    type="button"
                    onClick={() => handleDeleteSocial(idx)}
                    className="p-1.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 hover:bg-rose-100/50 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {socialLinks.length === 0 && (
                <div className="py-3 text-center text-xs text-slate-450 border border-dashed border-slate-200 rounded-xl">
                  No social follow links configured. Click "Add Link" to get started.
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Brochure Upload */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <FileText className="h-4 w-4 text-blue-500" />
              Admission Brochure File
            </h4>

            {admissionBrochure?.url ? (
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center space-x-3 truncate pr-4">
                  <div className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0 border border-red-100">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div className="truncate text-left">
                    <span className="text-xs font-bold text-slate-700 block truncate">
                      {admissionBrochure.filename || 'College Brochure'}
                    </span>
                    <span className="text-[9px] text-slate-400 block font-semibold uppercase">
                      {admissionBrochure.type || 'PDF'} File
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={admissionBrochure.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 hover:bg-slate-200/55 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem('brochure')}
                    className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400/80 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all bg-slate-50/40">
                <Upload className="h-5 w-5 text-slate-400 mb-1.5" />
                <span className="text-xs font-bold text-slate-655 block">
                  {uploadingBrochure ? 'Uploading File...' : 'Drag & Drop Brochure'}
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5 font-semibold">PDF or Image up to 5MB max size</span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => handleFileUpload(e, 'brochure')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploadingBrochure}
                />
              </div>
            )}
          </div>

          {/* Section 3: Banner Image Upload */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <ImageIcon className="h-4 w-4 text-emerald-500" />
              Banner Image
            </h4>

            {banner ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex items-center space-x-3 truncate pr-4">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                      <ImageIcon className="h-4.5 w-4.5" />
                    </div>
                    <div className="truncate text-left">
                      <span className="text-xs font-bold text-slate-700 block truncate">
                        {banner.split('/').pop() || 'Enquiry_Banner_Image.jpg'}
                      </span>
                      <span className="text-[9px] text-slate-400 block font-semibold uppercase">
                        Active Image
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem('banner')}
                    className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-700 transition-colors shrink-0"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
                <img
                  src={banner}
                  alt="Banner preview"
                  className="h-28 w-full object-cover rounded-xl border border-slate-200"
                />
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400/80 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all bg-slate-50/40">
                <Upload className="h-5 w-5 text-slate-400 mb-1.5" />
                <span className="text-xs font-bold text-slate-655 block">
                  {uploadingBanner ? 'Uploading Banner...' : 'Drag & Drop Banner Image'}
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5 font-semibold">PNG, JPG, WEBP formats up to 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'banner')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploadingBanner}
                />
              </div>
            )}
          </div>

          {/* Section 4: Welcome / Thank You Message Info Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              Welcome / Success Message Preview
            </h4>
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-slate-600 text-xs leading-normal text-left">
              <span className="font-semibold text-slate-700 block mb-0.5 font-bold uppercase tracking-wider text-[9px]">Post-submission message description:</span>
              Thank you, <span className="font-bold text-slate-800">John Doe</span>. Your application for admission has been registered successfully. Our team will contact you shortly.
            </div>
          </div>

          {/* Action Trigger Save */}
          <div className="pt-1">
            <Button
              className="w-full py-2.5 text-xs font-bold rounded-xl"
              onClick={handleSaveCms}
              isLoading={saving}
            >
              Save Enquiry Banner changes
            </Button>
          </div>
        </div>

        {/* Right live mobile mockup preview - 35% width, sticky and auto-scaled */}
        <div className="w-full lg:w-[35%] flex flex-col items-center sticky top-4">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Live Parent Preview</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-250 tracking-wider animate-pulse">
              LIVE
            </span>
          </div>

          <div 
            style={{ 
              width: `${phoneWidth * scale}px`, 
              height: `${phoneHeight * scale}px`,
              transition: 'all 0.15s ease-out' 
            }} 
            className="relative flex items-center justify-center overflow-hidden"
          >
            <div 
              style={{ 
                width: `${phoneWidth}px`, 
                height: `${phoneHeight}px`, 
                transform: `scale(${scale})`, 
                transformOrigin: 'center center' 
              }} 
              className="border-[6px] border-slate-800 rounded-[2rem] shadow-xl bg-slate-50 overflow-hidden relative flex flex-col flex-shrink-0"
            >
              {/* Phone speaker notch */}
              <div className="absolute top-0 inset-x-0 h-3.5 bg-slate-800 flex justify-center items-start z-20">
                <div className="w-12 h-1.5 bg-black rounded-b-md" />
              </div>

              {/* Browser layout content using true live preview component without internal scrolling */}
              <div className="flex-1 overflow-hidden pt-4 pb-1 text-xs bg-slate-50 select-none">
                <div className="scale-[0.80] origin-top p-0.5 pb-2">
                  <EnquiryBannerPreview
                    logo={school?.logo}
                    name={school?.name}
                    cms={{
                      socialLinks,
                      admissionBrochure,
                      banner
                    }}
                    type="college"
                    isMock={true}
                  />
                </div>
              </div>

              {/* Bottom handle bar */}
              <div className="h-3 bg-slate-800 flex justify-center items-center">
                <div className="w-16 h-0.5 bg-slate-600 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYouCmsPage;
