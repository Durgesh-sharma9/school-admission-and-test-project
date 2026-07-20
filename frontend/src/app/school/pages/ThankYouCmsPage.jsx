import React, { useState } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import api from '../services/api';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import toast from 'react-hot-toast';
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
      case 'School Website':
        return <Globe className={className} />;
      default:
        return <LinkIcon className={className} />;
    }
  };

  // 1. Initial State Sync supporting backward compatibility mapping
  const getInitialSocialLinks = () => {
    if (school?.thankYouCms?.socialLinks && school.thankYouCms.socialLinks.length > 0) {
      return school.thankYouCms.socialLinks;
    }
    const legacy = [];
    if (school?.thankYouCms?.socialLink1) {
      legacy.push({ platform: 'School Website', url: school.thankYouCms.socialLink1 });
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

  const getInitialFeeStructure = () => {
    return school?.thankYouCms?.feeStructure || { url: '', type: '', mimeType: '', filename: '' };
  };

  // Form State hooks
  const [socialLinks, setSocialLinks] = useState(getInitialSocialLinks());
  const [admissionBrochure, setAdmissionBrochure] = useState(getInitialBrochure());
  const [feeStructure, setFeeStructure] = useState(getInitialFeeStructure());
  const [banner, setBanner] = useState(school?.thankYouCms?.banner || school?.thankYouCms?.imageUrl || '');

  const [saving, setSaving] = useState(false);
  const [uploadingBrochure, setUploadingBrochure] = useState(false);
  const [uploadingFee, setUploadingFee] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

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
    else if (type === 'fee') setUploadingFee(true);
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
          toast.success('Admission brochure uploaded!');
        } else if (type === 'fee') {
          setFeeStructure({
            url: response.fileUrl,
            type: response.type,
            mimeType: response.mimeType,
            filename: response.filename
          });
          toast.success('Fee structure uploaded!');
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
      setUploadingFee(false);
      setUploadingBanner(false);
    }
  };

  // Delete uploaded items
  const handleDeleteItem = (type) => {
    if (type === 'brochure') {
      setAdmissionBrochure({ url: '', type: '', mimeType: '', filename: '' });
      toast.success('Admission brochure cleared. Save changes to confirm.');
    } else if (type === 'fee') {
      setFeeStructure({ url: '', type: '', mimeType: '', filename: '' });
      toast.success('Fee structure cleared. Save changes to confirm.');
    } else if (type === 'banner') {
      setBanner('');
      toast.success('Banner cleared. Save changes to confirm.');
    }
  };

  // Social Links mutations
  const handleAddSocial = () => {
    if (socialLinks.length >= 4) return;
    setSocialLinks([...socialLinks, { platform: 'School Website', url: '' }]);
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
      const response = await api.put('/settings/thankyou-cms', {
        socialLinks,
        admissionBrochure,
        feeStructure,
        banner,
        // Sync legacy parameters for backend backward compatibility
        socialLink1: socialLinks[0]?.url || '',
        socialLink2: socialLinks[1]?.url || '',
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

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Thank You Page CMS Settings</h2>
        <p className="text-slate-500 text-sm mt-0.5">
          Customize the files, fee structures, and updates parents receive upon successfully submitting registration forms.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left pane: Configurations Forms */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
          <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">
            CMS Layout Assets
          </span>

          {/* Social Links CRUD */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <LinkIcon className="h-4 w-4 text-indigo-500" />
                Follow Us Links ({socialLinks.length}/4)
              </h4>
              <button
                type="button"
                onClick={handleAddSocial}
                disabled={socialLinks.length >= 4}
                className="inline-flex items-center px-2 py-1 text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Link
              </button>
            </div>

            <div className="space-y-3">
              {socialLinks.map((link, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <div className="flex items-center justify-center h-10 w-10 bg-slate-50 rounded-xl text-slate-500 border border-slate-100 flex-shrink-0">
                    {getPlatformIcon(link.platform, "h-5 w-5")}
                  </div>

                  <select
                    value={link.platform}
                    onChange={(e) => handleUpdateSocial(idx, 'platform', e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {['Instagram', 'Facebook', 'YouTube', 'WhatsApp', 'LinkedIn', 'X (Twitter)', 'Telegram', 'School Website', 'Other'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) => handleUpdateSocial(idx, 'url', e.target.value)}
                    placeholder="https://yoursocial.com/url"
                    className="flex-1 rounded-lg border border-slate-200 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />

                  <button
                    type="button"
                    onClick={() => handleDeleteSocial(idx)}
                    className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 hover:bg-rose-100/50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {socialLinks.length === 0 && (
                <div className="py-4 text-center text-xs text-slate-400 border border-dashed border-slate-150 rounded-xl">
                  No social follow channels configured. Use the button above to add up to 4 updates links.
                </div>
              )}
            </div>
          </div>

          {/* Admission Brochure Upload */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-blue-500" />
              Admission Brochure File (Max 1)
            </h4>

            {admissionBrochure?.url ? (
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <div className="flex items-center space-x-2 truncate pr-4">
                  <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-600 truncate">
                    {admissionBrochure.filename || 'Admission Brochure'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={admissionBrochure.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 hover:bg-slate-200/50 rounded-md text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem('brochure')}
                    className="p-2 hover:bg-red-50 rounded-md text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400/80 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all bg-slate-50/50">
                <Upload className="h-6 w-6 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-600 block">
                  {uploadingBrochure ? 'Uploading...' : 'Upload Brochure File'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">PDF or Image up to 5MB</span>
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

          {/* Fee Structure Upload */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-amber-500" />
              Fee Structure File (Max 1)
            </h4>

            {feeStructure?.url ? (
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <div className="flex items-center space-x-2 truncate pr-4">
                  <FileText className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-600 truncate">
                    {feeStructure.filename || 'Fee Structure'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={feeStructure.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 hover:bg-slate-200/50 rounded-md text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem('fee')}
                    className="p-2 hover:bg-red-50 rounded-md text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400/80 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all bg-slate-50/50">
                <Upload className="h-6 w-6 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-600 block">
                  {uploadingFee ? 'Uploading...' : 'Upload Fee Structure file'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">PDF or Image up to 5MB</span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => handleFileUpload(e, 'fee')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploadingFee}
                />
              </div>
            )}
          </div>

          {/* Banner Upload */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-emerald-500" />
              Thank You Banner Image (Max 1)
            </h4>

            {banner ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="flex items-center space-x-2 truncate pr-4">
                    <ImageIcon className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-slate-600 truncate">
                      {banner.split('/').pop() || 'Thank_You_Banner.jpg'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteItem('banner')}
                      className="p-2 hover:bg-red-50 rounded-md text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <img
                  src={banner}
                  alt="Banner preview"
                  className="h-28 w-full object-cover rounded-lg border border-slate-100"
                />
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400/80 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all bg-slate-50/50">
                <Upload className="h-6 w-6 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-600 block">
                  {uploadingBanner ? 'Uploading...' : 'Upload Banner Image'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP up to 5MB</span>
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

          <div className="pt-4 border-t border-slate-50">
            <Button
              className="w-full py-3"
              onClick={handleSaveCms}
              isLoading={saving}
            >
              Save CMS Changes
            </Button>
          </div>
        </div>

        {/* Right pane: Phone Mockup Display */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Parent View Live Mockup
          </span>

          <div className="w-full max-w-sm border-8 border-slate-800 rounded-[2.5rem] shadow-2xl h-[580px] bg-slate-50 overflow-hidden relative flex flex-col">
            {/* Phone speaker notch */}
            <div className="absolute top-0 inset-x-0 h-5 bg-slate-800 flex justify-center items-start z-20">
              <div className="w-24 h-3.5 bg-black rounded-b-xl" />
            </div>

            {/* Browser layout content */}
            <div className="flex-1 overflow-y-auto px-5 pt-8 pb-6 text-center space-y-4 bg-white">
              <div className="flex flex-col items-center space-y-1 pt-4">
                <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-650 text-xs">
                  {school?.name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <h4 className="text-xs font-extrabold text-slate-800">{school?.name}</h4>
              </div>

              {/* Thank You Box */}
              <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/30 space-y-2.5">
                <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-sm font-bold text-indigo-950">Thank You!</h3>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Your admission enquiry for <span className="font-semibold text-slate-700">John Doe</span> has been registered successfully. Our team will contact you shortly.
                </p>
              </div>

              {/* Banner image */}
              {banner && (
                <div className="rounded-xl overflow-hidden border border-slate-100">
                  <img
                    src={banner}
                    alt="Mockup Banner"
                    className="w-full h-24 object-cover"
                  />
                </div>
              )}

              {/* Brochure Downloader (with PDF/Image extension detection) */}
              {admissionBrochure?.url && (
                <a
                  href={admissionBrochure.url}
                  download={admissionBrochure.filename || 'Brochure'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow-sm hover:bg-indigo-750 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 mr-2" />
                  Download Admission Brochure ({admissionBrochure.type === 'pdf' ? 'PDF' : 'Image'})
                </a>
              )}

              {/* Fee Structure Downloader */}
              {feeStructure?.url && (
                <a
                  href={feeStructure.url}
                  download={feeStructure.filename || 'Fee_Structure'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-amber-500 text-white rounded-lg font-bold text-xs shadow-sm hover:bg-amber-600 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 mr-2" />
                  Download Fee Structure ({feeStructure.type === 'pdf' ? 'PDF' : 'Image'})
                </a>
              )}

              {/* Social Channels follow section */}
              {socialLinks.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    Follow Our Updates
                  </span>
                  <div className="flex justify-center gap-3">
                    {socialLinks.map((link, lIdx) => (
                      <a
                        key={lIdx}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-slate-50 border border-slate-100 hover:bg-indigo-50 rounded-full text-slate-650 hover:text-indigo-600 transition-all"
                        title={link.platform}
                      >
                        {getPlatformIcon(link.platform, "h-4 w-4")}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom handle bar */}
            <div className="h-4 bg-slate-800 flex justify-center items-center">
              <div className="w-28 h-1 bg-slate-600 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYouCmsPage;
