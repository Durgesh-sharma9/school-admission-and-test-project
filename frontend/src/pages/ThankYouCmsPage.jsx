import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import toast from 'react-hot-toast';
import {
  Sparkles,
  Link as LinkIcon,
  FileText,
  Image as ImageIcon,
  Trash2,
  Upload,
  Eye,
  ExternalLink,
  Facebook,
  Globe
} from 'lucide-react';

const ThankYouCmsPage = () => {
  const { school, updateSchoolState } = useAuth();
  const [socialLink1, setSocialLink1] = useState(school?.thankYouCms?.socialLink1 || '');
  const [socialLink2, setSocialLink2] = useState(school?.thankYouCms?.socialLink2 || '');
  const [pdfUrl, setPdfUrl] = useState(school?.thankYouCms?.pdfUrl || '');
  const [imageUrl, setImageUrl] = useState(school?.thankYouCms?.imageUrl || '');

  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // File Upload handler
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

    if (type === 'pdf') {
      setUploadingPdf(true);
    } else {
      setUploadingImage(true);
    }

    try {
      // Axios request with multipart header
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
        if (type === 'pdf') {
          setPdfUrl(response.fileUrl);
          toast.success('Brochure PDF uploaded successfully!');
        } else {
          setImageUrl(response.fileUrl);
          toast.success('Thank You image uploaded successfully!');
        }
      } else {
        toast.error(response.message || 'File upload failed');
      }
    } catch (error) {
      toast.error('Upload connection error');
    } finally {
      setUploadingPdf(false);
      setUploadingImage(false);
    }
  };

  // Save full configurations
  const handleSaveCms = async () => {
    setSaving(true);
    try {
      const response = await api.put('/settings/thankyou-cms', {
        socialLink1,
        socialLink2,
        pdfUrl,
        imageUrl,
      });

      if (response.success) {
        toast.success('Thank You page CMS updated successfully!');
        // Update user context state
        const updatedSchool = {
          ...school,
          thankYouCms: response.thankYouCms,
        };
        updateSchoolState(updatedSchool);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update CMS config');
    } finally {
      setSaving(false);
    }
  };

  // Delete uploaded items
  const handleDeleteItem = (type) => {
    if (type === 'pdf') {
      setPdfUrl('');
      toast.success('Brochure PDF cleared. Save to update.');
    } else {
      setImageUrl('');
      toast.success('Thank You image cleared. Save to update.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Thank You Page CMS</h2>
        <p className="text-slate-500 text-sm mt-0.5">
          Customize the landing page parents see after submitting an admission enquiry. Make files downloadable.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Form Settings */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6 text-left">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            CMS Configurations
          </span>

          {/* Social Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
              <LinkIcon className="h-4 w-4 text-indigo-500" />
              Social Follow Links (Max 2)
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Social Link 1 (e.g., Facebook / Instagram)"
                value={socialLink1}
                onChange={(e) => setSocialLink1(e.target.value)}
                placeholder="https://facebook.com/yourschool"
              />
              <Input
                label="Social Link 2 (e.g., Twitter / School Website)"
                value={socialLink2}
                onChange={(e) => setSocialLink2(e.target.value)}
                placeholder="https://yourschool.edu"
              />
            </div>
          </div>

          {/* PDF Brochure */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-blue-500" />
              Admission Brochure / PDF (Max 1)
            </h4>

            {pdfUrl ? (
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <div className="flex items-center space-x-2 truncate pr-4">
                  <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-600 truncate">
                    {pdfUrl.split('/').pop()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 hover:bg-slate-200/50 rounded-md text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => handleDeleteItem('pdf')}
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
                  {uploadingPdf ? 'Uploading...' : 'Upload Brochure PDF'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">PDF limit 5MB</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload(e, 'pdf')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploadingPdf}
                />
              </div>
            )}
          </div>

          {/* Thank You Image */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-emerald-500" />
              Thank You Banner Image (Max 1)
            </h4>

            {imageUrl ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="flex items-center space-x-2 truncate pr-4">
                    <ImageIcon className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-slate-600 truncate">
                      {imageUrl.split('/').pop()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteItem('image')}
                      className="p-2 hover:bg-red-50 rounded-md text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <img
                  src={imageUrl}
                  alt="Thank you preview"
                  className="h-28 w-full object-cover rounded-lg border border-slate-100"
                />
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400/80 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all bg-slate-50/50">
                <Upload className="h-6 w-6 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-600 block">
                  {uploadingImage ? 'Uploading...' : 'Upload Banner Image'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG up to 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'image')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploadingImage}
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

        {/* Right Column: Live Mockup Preview */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Parent View Live Mockup
          </span>

          <div className="w-full max-w-sm border-8 border-slate-800 rounded-[2.5rem] shadow-2xl h-[560px] bg-slate-50 overflow-hidden relative flex flex-col">
            {/* Phone speaker & camera notch */}
            <div className="absolute top-0 inset-x-0 h-5 bg-slate-800 flex justify-center items-start z-20">
              <div className="w-24 h-3.5 bg-black rounded-b-xl" />
            </div>

            {/* Simulated browser content */}
            <div className="flex-1 overflow-y-auto px-5 pt-8 pb-6 text-center space-y-5 bg-white">
              {/* Header */}
              <div className="flex flex-col items-center space-y-1.5 pt-4">
                <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-xs">
                  {school?.name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <h4 className="text-xs font-extrabold text-slate-800">{school?.name}</h4>
              </div>

              {/* Thank you card */}
              <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100/30 space-y-3">
                <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-indigo-950">Thank You!</h3>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Your admission enquiry for <span className="font-semibold text-slate-700">John Doe</span> has been registered successfully under ID <span className="font-bold text-indigo-600">ENQ-2026-0012</span>. Our school team will contact you shortly.
                </p>
              </div>

              {/* CMS Image Banner */}
              {imageUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-100">
                  <img
                    src={imageUrl}
                    alt="School Banner Mockup"
                    className="w-full h-24 object-cover"
                  />
                </div>
              )}

              {/* CMS Brochure download */}
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow-sm hover:bg-indigo-700 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 mr-2" />
                  Download Admission Brochure
                </a>
              )}

              {/* CMS Social Links */}
              {(socialLink1 || socialLink2) && (
                <div className="space-y-2 pt-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    Follow Our Updates
                  </span>
                  <div className="flex justify-center gap-3">
                    {socialLink1 && (
                      <a
                        href={socialLink1}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-50 border border-slate-100 hover:bg-indigo-50 rounded-full text-slate-600 hover:text-indigo-600 transition-all"
                      >
                        <Facebook className="h-4.5 w-4.5" />
                      </a>
                    )}
                    {socialLink2 && (
                      <a
                        href={socialLink2}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-50 border border-slate-100 hover:bg-indigo-50 rounded-full text-slate-600 hover:text-indigo-600 transition-all"
                      >
                        <Globe className="h-4.5 w-4.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom screen home handle */}
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
