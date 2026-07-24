import React, { useState, useEffect } from 'react';
import { useAuth } from '../../school/contexts/AuthContext';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Loader from '../../../shared/components/Loader';
import Modal from '../../../shared/components/Modal';
import toast from 'react-hot-toast';
import api from '../../school/services/schoolApi';
import { 
  Settings, 
  Layers, 
  BookOpen, 
  GraduationCap, 
  Sparkles, 
  Send, 
  Upload, 
  Trash2, 
  Mail, 
  Plus, 
  Check, 
  MessageSquare, 
  ShieldAlert, 
  Image, 
  FileText, 
  Globe, 
  MapPin, 
  Building 
} from 'lucide-react';

const SettingsPage = () => {
  const { school, updateSchoolState } = useAuth();
  
  // Tabs: 'profile', 'branding', 'templates', 'security'
  const [activeTab, setActiveTab] = useState('profile');
  
  const [loading, setLoading] = useState(false);
  const [fetchingMasters, setFetchingMasters] = useState(false);

  // Profile Form States
  const [logo, setLogo] = useState(school?.logo || '');
  const [name, setName] = useState(school?.name || '');
  const [tagline, setTagline] = useState(school?.tagline || '');
  const [website, setWebsite] = useState(school?.website || '');
  const [admissionEmail, setAdmissionEmail] = useState(school?.admissionEmail || '');
  const [phone, setPhone] = useState(school?.phone || '');
  const [address, setAddress] = useState(school?.address || '');
  const [city, setCity] = useState(school?.city || '');
  const [state, setState] = useState(school?.state || '');
  const [pincode, setPincode] = useState(school?.pincode || '');
  const [universityAffiliation, setUniversityAffiliation] = useState(school?.universityAffiliation || '');
  const [collegeType, setCollegeType] = useState(school?.collegeType || '');

  // Academic Configuration States
  const [allDepts, setAllDepts] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [allSpecs, setAllSpecs] = useState([]);

  const [selectedDepts, setSelectedDepts] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectedSpecs, setSelectedSpecs] = useState([]);

  // Requests States
  const [requestsList, setRequestsList] = useState([]);
  const [fetchingRequests, setFetchingRequests] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestType, setRequestType] = useState('Department');

  // Request form parameters
  const [reqDeptName, setReqDeptName] = useState('');
  const [reqDeptDesc, setReqDeptDesc] = useState('');
  const [reqDeptId, setReqDeptId] = useState('');
  const [reqCourseName, setReqCourseName] = useState('');
  const [reqCourseCode, setReqCourseCode] = useState('');
  const [reqDuration, setReqDuration] = useState('');
  const [reqCourseId, setReqCourseId] = useState('');
  const [reqSpecName, setReqSpecName] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);

  // Branding config states
  const [branding, setBranding] = useState({
    showLogo: school?.qrBranding?.showLogo ?? true,
    showName: school?.qrBranding?.showName ?? true,
    showTagline: school?.qrBranding?.showTagline ?? true,
    showContact: school?.qrBranding?.showContact ?? true,
    showEmail: school?.qrBranding?.showEmail ?? true,
    showWebsite: school?.qrBranding?.showWebsite ?? true,
    showAddress: school?.qrBranding?.showAddress ?? true,
    showUniversityName: school?.qrBranding?.showUniversityName ?? true,
    showAccreditation: school?.qrBranding?.showAccreditation ?? true,
    showFacilities: school?.qrBranding?.showFacilities ?? true,
    primaryColor: school?.qrBranding?.primaryColor || '#4f46e5',
    secondaryColor: school?.qrBranding?.secondaryColor || '#f59e0b',
    accentColor: school?.qrBranding?.accentColor || '#6366f1',
    footerMessage: school?.qrBranding?.footerMessage || '',
    highlights: school?.qrBranding?.highlights || []
  });

  // Notifications & Templates states
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('whatsapp'); // whatsapp, email, sms
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Documents states
  const [brochureUrl, setBrochureUrl] = useState(school?.documents?.admissionBrochureUrl || '');
  const [prospectusUrl, setProspectusUrl] = useState(school?.documents?.prospectusUrl || '');
  const [bannerUrl, setBannerUrl] = useState(school?.documents?.collegeBannerUrl || '');
  const [galleryImages, setGalleryImages] = useState(school?.documents?.galleryImages || []);
  
  const [uploadingDoc, setUploadingDoc] = useState({ logo: false, brochure: false, prospectus: false, banner: false, gallery: false });

  // Security password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    // Automatically load academic configurations when Profile is active
    if (activeTab === 'profile') {
      fetchAcademicConfig();
      fetchRequests();
    }
  }, [activeTab]);

  const fetchAcademicConfig = async () => {
    setFetchingMasters(true);
    try {
      const [mastersRes, configRes] = await Promise.all([
        api.get('/college/academic/all-masters'),
        api.get('/college/academic/config')
      ]);

      if (mastersRes.success) {
        setAllDepts(mastersRes.data.departments || []);
        setAllCourses(mastersRes.data.courses || []);
        setAllSpecs(mastersRes.data.specializations || []);
      }

      if (configRes.success && configRes.data) {
        const config = configRes.data;
        setSelectedDepts(config.selectedDepartments?.map(d => d._id || d) || []);
        setSelectedCourses(config.selectedCourses?.map(c => c._id || c) || []);
        setSelectedSpecs(config.selectedSpecializations?.map(s => s._id || s) || []);
      }
    } catch (error) {
      toast.error('Failed to load academic configuration data');
    } finally {
      setFetchingMasters(false);
    }
  };

  const fetchRequests = async () => {
    setFetchingRequests(true);
    try {
      const res = await api.get('/college/academic/requests');
      if (res.success) {
        setRequestsList(res.data || []);
      }
    } catch (error) {
      toast.error('Failed to load requests list');
    } finally {
      setFetchingRequests(false);
    }
  };

  // Upload Generic handler
  const handleUploadFile = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }

    setUploadingDoc(prev => ({ ...prev, [type]: true }));
    const formData = new FormData();
    formData.append('file', file);

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
        if (type === 'logo') {
          setLogo(response.fileUrl);
          toast.success('College Logo uploaded! Save profile changes to apply.');
        } else if (type === 'brochure') {
          setBrochureUrl(response.fileUrl);
          toast.success('Brochure uploaded successfully!');
        } else if (type === 'prospectus') {
          setProspectusUrl(response.fileUrl);
          toast.success('Prospectus uploaded successfully!');
        } else if (type === 'banner') {
          setBannerUrl(response.fileUrl);
          toast.success('Banner uploaded successfully!');
        } else if (type === 'gallery') {
          setGalleryImages(prev => [...prev, response.fileUrl]);
          toast.success('Gallery image uploaded successfully!');
        }
      } else {
        toast.error(response.message || 'File upload failed');
      }
    } catch (err) {
      toast.error('Connection error during upload');
    } finally {
      setUploadingDoc(prev => ({ ...prev, [type]: false }));
    }
  };

  // Save College details settings
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/settings', {
        name,
        tagline,
        website,
        admissionEmail,
        phone,
        address,
        city,
        state,
        pincode,
        universityAffiliation,
        collegeType,
        logo,
        documents: {
          admissionBrochureUrl: brochureUrl,
          prospectusUrl: prospectusUrl,
          collegeBannerUrl: bannerUrl,
          galleryImages: galleryImages
        }
      });
      if (res.success) {
        toast.success('College Profile details and documents saved!');
        if (updateSchoolState) updateSchoolState({ ...school, ...res.school, institutionType: 'college' });
      }
    } catch (error) {
      toast.error('Failed to save College Profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleBrandingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/settings', {
        qrBranding: branding
      });
      if (res.success) {
        toast.success('College Branding configuration updated!');
        if (updateSchoolState) updateSchoolState({ ...school, ...res.school, institutionType: 'college' });
      }
    } catch (error) {
      toast.error('Failed to save College Branding configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        selectedDepartments: selectedDepts,
        selectedCourses: selectedCourses,
        selectedSpecializations: selectedSpecs
      };

      const res = await api.post('/college/academic/config', payload);
      if (res.success) {
        toast.success('Academic course configuration saved!');
      }
    } catch (error) {
      toast.error('Failed to save course configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!reqReason) {
      toast.error('Please specify the reason for request');
      return;
    }

    setRequestLoading(true);
    try {
      const payload = {
        requestType,
        reason: reqReason,
        departmentId: reqDeptId || undefined,
        courseId: reqCourseId || undefined,
        departmentName: reqDeptName || undefined,
        courseName: reqCourseName || undefined,
        courseCode: reqCourseCode || undefined,
        specializationName: reqSpecName || undefined,
        duration: reqDuration || undefined
      };

      const res = await api.post('/college/academic/requests', payload);
      if (res.success) {
        toast.success('Academic request submitted to Super Admin!');
        setIsRequestModalOpen(false);
        resetRequestForm();
        fetchRequests();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setRequestLoading(false);
    }
  };

  const resetRequestForm = () => {
    setReqDeptName('');
    setReqDeptDesc('');
    setReqDeptId('');
    setReqCourseName('');
    setReqCourseCode('');
    setReqDuration('');
    setReqCourseId('');
    setReqSpecName('');
    setReqReason('');
  };

  // Saved Template Creator
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!templateName || !templateBody) {
      toast.error('Please fill template name and message content');
      return;
    }

    setSavingTemplate(true);
    try {
      const res = await api.post('/settings/templates', {
        name: templateName,
        type: templateType,
        subject: templateSubject,
        body: templateBody,
      });

      if (res.success) {
        toast.success('Communication template saved!');
        updateSchoolState({
          ...school,
          communicationTemplates: res.templates,
        });
        setTemplateName('');
        setTemplateSubject('');
        setTemplateBody('');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await api.delete(`/settings/templates/${templateId}`);
      if (res.success) {
        toast.success('Template deleted');
        updateSchoolState({
          ...school,
          communicationTemplates: res.templates,
        });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete template');
    }
  };

  // Password submission
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.put('/settings/password', { currentPassword, newPassword });
      if (res.success) {
        toast.success('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  // Helpers toggle handlers
  const toggleDept = (id) => {
    setSelectedDepts(prev => {
      if (prev.includes(id)) {
        const newDepts = prev.filter(d => d !== id);
        const relatedCourses = allCourses.filter(c => c.departmentId?._id === id || c.departmentId === id).map(c => c._id);
        setSelectedCourses(cPrev => cPrev.filter(cId => !relatedCourses.includes(cId)));
        
        setSelectedSpecs(sPrev => sPrev.filter(sId => {
          const specObj = allSpecs.find(s => s._id === sId);
          const courseObj = specObj ? allCourses.find(c => c._id === (specObj.courseId?._id || specObj.courseId)) : null;
          return courseObj ? (courseObj.departmentId?._id !== id && courseObj.departmentId !== id) : true;
        }));

        return newDepts;
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleCourse = (id) => {
    setSelectedCourses(prev => {
      if (prev.includes(id)) {
        const newCourses = prev.filter(c => c !== id);
        setSelectedSpecs(sPrev => sPrev.filter(sId => {
          const specObj = allSpecs.find(s => s._id === sId);
          return specObj ? (specObj.courseId?._id !== id && specObj.courseId !== id) : true;
        }));
        return newCourses;
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleSpec = (id) => {
    setSelectedSpecs(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const visibleCourses = allCourses.filter(c => {
    const deptId = c.departmentId?._id || c.departmentId;
    return selectedDepts.includes(deptId);
  });

  const visibleSpecs = allSpecs.filter(s => {
    const courseId = s.courseId?._id || s.courseId;
    return selectedCourses.includes(courseId);
  });

  const requestAvailableCourses = allCourses.filter(c => {
    const deptId = c.departmentId?._id || c.departmentId;
    return deptId === reqDeptId;
  });

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto relative pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">College Settings</h2>
          <p className="text-slate-500 text-xs mt-0.5 font-semibold">Configure details, branding templates, documents repository, and administrator credentials.</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 overflow-x-auto shrink-0 max-w-full">
          {[
            { key: 'profile', label: 'College Profile' },
            { key: 'branding', label: 'Branding' },
            { key: 'templates', label: 'Notifications & Templates' },
            { key: 'security', label: 'Security' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-white text-indigo-650 shadow-xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-850'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: College Profile */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          {/* Card 1: Identity & Affiliation */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b pb-1">College Profile Details</h3>
            
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Logo Upload Box */}
              <div className="flex flex-col items-center space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">College Logo</span>
                <div className="relative h-28 w-28 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                  {logo ? (
                    <img src={logo} alt="College Logo" className="h-full w-full object-cover" />
                  ) : (
                    <Building className="h-10 w-10 text-slate-350" />
                  )}
                  {uploadingDoc.logo && (
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center text-xs font-bold text-white">
                      ...
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1"
                    >
                      <Upload className="h-3.5 w-3.5" /> Upload
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleUploadFile(e, 'logo')}
                      className="absolute inset-0 opacity-0 w-full cursor-pointer"
                    />
                  </div>
                  {logo && (
                    <button
                      type="button"
                      onClick={() => setLogo('')}
                      className="px-2.5 py-1.5 rounded-lg border border-red-100 text-xs font-semibold text-red-600 bg-white hover:bg-red-50 flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Form Grid */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <Input
                  label="College Name *"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
                <Input
                  label="College Tagline"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="e.g. Center of Excellence"
                />
                <Input
                  label="College Website"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  placeholder="e.g. https://college.edu"
                />
                <Input
                  label="Admission Email *"
                  type="email"
                  value={admissionEmail}
                  onChange={e => setAdmissionEmail(e.target.value)}
                  placeholder="e.g. admissions@college.edu"
                  required
                />
                <Input
                  label="College Contact Number *"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">College Type</label>
                  <select
                    value={collegeType}
                    onChange={e => setCollegeType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50"
                  >
                    <option value="">-- Choose Type --</option>
                    <option value="Government">Government</option>
                    <option value="Private">Private</option>
                    <option value="Autonomous">Autonomous</option>
                    <option value="Deemed">Deemed</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="University Affiliation"
                    value={universityAffiliation}
                    onChange={e => setUniversityAffiliation(e.target.value)}
                    placeholder="e.g. Affiliated to State Technological University"
                  />
                </div>
              </div>
            </div>
            
            {/* Address fields */}
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Campuses & Address</span>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="College Address *"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    required
                  />
                </div>
                <Input
                  label="City"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="State"
                    value={state}
                    onChange={e => setState(e.target.value)}
                  />
                  <Input
                    label="Pincode"
                    value={pincode}
                    onChange={e => setPincode(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Documents Upload */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Admission Documents Repository</h3>
              <p className="text-slate-450 text-[10px] mt-0.5 font-semibold">Upload college catalogs, brochures, and media highlights.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Brochure PDF */}
              <div className="space-y-2 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-indigo-500" /> Admission Brochure PDF
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">Upload the latest course descriptions and intake details in PDF format.</p>
                </div>
                
                <div className="flex items-center justify-between gap-4 mt-3">
                  <div className="truncate flex-1">
                    {brochureUrl ? (
                      <a href={brochureUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-650 hover:underline truncate block">
                        {brochureUrl.substring(brochureUrl.lastIndexOf('/') + 1) || 'View Brochure PDF'}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No Brochure Uploaded</span>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <div className="relative">
                      <button type="button" className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Upload className="h-3.5 w-3.5" /> Upload
                      </button>
                      <input type="file" accept="application/pdf" onChange={e => handleUploadFile(e, 'brochure')} className="absolute inset-0 opacity-0 w-full cursor-pointer" />
                    </div>
                    {brochureUrl && (
                      <button type="button" onClick={() => setBrochureUrl('')} className="p-1.5 bg-white border border-red-100 rounded-lg text-red-650 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Prospectus PDF */}
              <div className="space-y-2 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-indigo-500" /> Prospectus PDF
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">Upload the university curriculum, admissions prospectus booklet.</p>
                </div>

                <div className="flex items-center justify-between gap-4 mt-3">
                  <div className="truncate flex-1">
                    {prospectusUrl ? (
                      <a href={prospectusUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-650 hover:underline truncate block">
                        {prospectusUrl.substring(prospectusUrl.lastIndexOf('/') + 1) || 'View Prospectus PDF'}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No Prospectus Uploaded</span>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <div className="relative">
                      <button type="button" className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Upload className="h-3.5 w-3.5" /> Upload
                      </button>
                      <input type="file" accept="application/pdf" onChange={e => handleUploadFile(e, 'prospectus')} className="absolute inset-0 opacity-0 w-full cursor-pointer" />
                    </div>
                    {prospectusUrl && (
                      <button type="button" onClick={() => setProspectusUrl('')} className="p-1.5 bg-white border border-red-100 rounded-lg text-red-650 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* College Banner Image */}
              <div className="space-y-2 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl md:col-span-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Image className="h-4 w-4 text-indigo-500" /> College Banner
                </h4>
                <p className="text-[10px] text-slate-400">Branded header banner used in public registration flows.</p>
                
                <div className="flex flex-col sm:flex-row gap-4 items-center mt-3 pt-2">
                  <div className="h-28 w-56 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {bannerUrl ? (
                      <img src={bannerUrl} alt="College Banner" className="h-full w-full object-cover" />
                    ) : (
                      <Image className="h-8 w-8 text-slate-350" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <div className="relative w-fit">
                      <button type="button" className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs">
                        <Upload className="h-4 w-4" /> Upload Banner
                      </button>
                      <input type="file" accept="image/*" onChange={e => handleUploadFile(e, 'banner')} className="absolute inset-0 opacity-0 w-full cursor-pointer" />
                    </div>
                    {bannerUrl && (
                      <button type="button" onClick={() => setBannerUrl('')} className="px-4 py-2 border border-red-200 bg-white rounded-xl text-xs font-bold text-red-650 hover:bg-red-50 flex items-center gap-1.5 w-fit">
                        <Trash2 className="h-4 w-4" /> Delete Banner
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* College Gallery Images */}
              <div className="space-y-2 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl md:col-span-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Image className="h-4 w-4 text-indigo-500" /> College Gallery Images
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Upload college campus view and facilities pictures.</p>
                  </div>
                  <div className="relative">
                    <button type="button" className="px-3 py-1.5 bg-indigo-650 text-white hover:bg-indigo-750 rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1">
                      <Plus className="h-3.5 w-3.5" /> Upload Image
                    </button>
                    <input type="file" accept="image/*" onChange={e => handleUploadFile(e, 'gallery')} className="absolute inset-0 opacity-0 w-full cursor-pointer" />
                  </div>
                </div>

                {galleryImages.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">No images uploaded to college gallery yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-3">
                    {galleryImages.map((img, idx) => (
                      <div key={idx} className="relative h-24 w-full bg-slate-100 rounded-xl border overflow-hidden group shadow-2xs">
                        <img src={img} alt={`Gallery ${idx}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setGalleryImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1.5 right-1.5 p-1 bg-red-650 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          title="Delete Image"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Academic Course Catalog (Configured inside profile for simplified tabs) */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Academic Configurations</h3>
                <p className="text-slate-450 text-[10px] mt-0.5">Offered Departments, Courses and Specializations selection checklist.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetRequestForm();
                  setIsRequestModalOpen(true);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Request New Course
              </button>
            </div>

            {fetchingMasters ? (
              <Loader message="Loading Global Master catalogs..." />
            ) : (
              <div className="space-y-6">
                {/* Step 1: Departments */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-slate-500" /> Step 1: Enable Departments
                  </h4>
                  {allDepts.length === 0 ? (
                    <p className="text-slate-400 text-xs italic">No global departments configured.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {allDepts.map(dept => {
                        const isChecked = selectedDepts.includes(dept._id);
                        return (
                          <label
                            key={dept._id}
                            className={`flex items-center space-x-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 font-bold'
                                : 'bg-slate-50/50 border-slate-150 text-slate-650 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleDept(dept._id)}
                              className="h-4 w-4 text-indigo-600 border-slate-350 focus:ring-indigo-500 rounded"
                            />
                            <span className="text-xs truncate">{dept.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Step 2: Courses */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-slate-500" /> Step 2: Enable Courses
                  </h4>
                  {selectedDepts.length === 0 ? (
                    <p className="text-slate-400 text-xs italic">Select at least one department above to view courses.</p>
                  ) : visibleCourses.length === 0 ? (
                    <p className="text-slate-400 text-xs italic">No courses available under selected departments.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {visibleCourses.map(course => {
                        const isChecked = selectedCourses.includes(course._id);
                        return (
                          <label
                            key={course._id}
                            className={`flex items-center space-x-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 font-bold'
                                : 'bg-slate-50/50 border-slate-150 text-slate-650 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleCourse(course._id)}
                              className="h-4 w-4 text-indigo-600 border-slate-350 focus:ring-indigo-500 rounded"
                            />
                            <span className="text-xs truncate">{course.name} ({course.code})</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Step 3: Specializations */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-slate-500" /> Step 3: Enable Specializations
                  </h4>
                  {selectedCourses.length === 0 ? (
                    <p className="text-slate-400 text-xs italic">Select at least one course above to view specializations.</p>
                  ) : visibleSpecs.length === 0 ? (
                    <p className="text-slate-400 text-xs italic">No specializations available under selected courses.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {visibleSpecs.map(spec => {
                        const isChecked = selectedSpecs.includes(spec._id);
                        return (
                          <label
                            key={spec._id}
                            className={`flex items-center space-x-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 font-bold'
                                : 'bg-slate-50/50 border-slate-150 text-slate-650 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSpec(spec._id)}
                              className="h-4 w-4 text-indigo-600 border-slate-350 focus:ring-indigo-500 rounded"
                            />
                            <span className="text-xs truncate">{spec.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-end pt-3">
                  <button
                    type="button"
                    onClick={handleConfigSubmit}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="h-4 w-4" /> Save Course Configuration
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card 4: Requested Course Submissions History */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">My Requests</h3>
              <p className="text-slate-450 text-[10px] mt-0.5">Track approvals and comments for submitted course requests.</p>
            </div>

            {fetchingRequests ? (
              <Loader message="Loading submissions..." />
            ) : requestsList.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No requested master entries submitted.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase text-slate-400">
                      <th className="py-3 px-4">Request Type</th>
                      <th className="py-3 px-4">Requested Item</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Submitted Date</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-650">
                    {requestsList.map(req => {
                      const itemDisplay = req.requestType === 'Department' ? req.departmentName :
                                          req.requestType === 'Course' ? `${req.courseName} (${req.courseCode || 'No Code'})` :
                                          `${req.specializationName} (${req.courseId?.name || 'N/A'})`;
                      
                      const statusColor = req.status === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                          req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                          'bg-rose-50 text-rose-600 border border-rose-200';

                      return (
                        <tr key={req._id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-4 px-4 font-bold text-slate-850">{req.requestType}</td>
                          <td className="py-4 px-4 font-semibold text-slate-700">{itemDisplay}</td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide ${statusColor}`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-500">
                            {new Date(req.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-4 px-4 text-slate-555 max-w-xs truncate" title={req.adminRemarks || 'N/A'}>
                            {req.adminRemarks || <span className="text-slate-400 italic">No remarks</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={loading} className="py-3 px-6 text-xs font-semibold inline-flex items-center">
              <Check className="h-4.5 w-4.5 mr-1.5" /> Save Profile & Documents
            </Button>
          </div>
        </form>
      )}

      {/* Tab 2: Branding Redirect Card */}
      {activeTab === 'branding' && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4 text-left max-w-lg">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <span className="text-base">🎨</span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Admission Poster Branding
            </h3>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            Manage admission poster branding, colors, highlights, QR templates, downloads and live preview from QR Builder.
          </p>

          <div>
            <button
              type="button"
              onClick={() => window.location.href = '/college/qr-links'}
              className="px-4 py-2 bg-indigo-650 hover:bg-indigo-755 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              Open QR Builder
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Template Creator */}
          <form onSubmit={handleSaveTemplate} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-5 lg:col-span-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Create Message Template</span>

            <Input
              label="Template Name"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              placeholder="e.g. Counselling Invitation"
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Template Category</label>
              <select
                value={templateType}
                onChange={e => setTemplateType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50"
              >
                <option value="whatsapp">WhatsApp Message</option>
                <option value="email">Email Message</option>
                <option value="sms">SMS Message</option>
              </select>
            </div>

            {templateType === 'email' && (
              <Input
                label="Email Subject"
                value={templateSubject}
                onChange={e => setTemplateSubject(e.target.value)}
                placeholder="e.g. College Verification Update"
                required={templateType === 'email'}
              />
            )}

            <div>
              <Input
                label="Message Body Content"
                type="textarea"
                value={templateBody}
                onChange={e => setTemplateBody(e.target.value)}
                placeholder="Enter template body..."
                rows={6}
                required
              />
              
              {/* Placeholder guides */}
              <div className="mt-2 bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-500 space-y-1">
                <span className="font-bold text-slate-700">Dynamic Variable Placeholders:</span>
                <p>Use variables to auto-populate CRM values:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li><code className="font-bold text-indigo-650">[Parent Name]</code> - Father's / Mother's name</li>
                  <li><code className="font-bold text-indigo-650">[Student Name]</code> - Candidate student name</li>
                  <li><code className="font-bold text-indigo-650">[Enquiry ID]</code> - Auto-generated CRM reference</li>
                </ul>
              </div>
            </div>

            <Button type="submit" isLoading={savingTemplate} className="w-full text-xs font-bold inline-flex items-center justify-center">
              <Plus className="h-4 w-4 mr-1.5" /> Save Template
            </Button>
          </form>

          {/* Templates list index */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs lg:col-span-2 space-y-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Saved Templates ({school?.communicationTemplates?.length || 0})
            </span>

            {!school?.communicationTemplates || school.communicationTemplates.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-150 rounded-xl">
                No templates configured yet. Use the sidebar form to add templates.
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {school.communicationTemplates.map(tpl => (
                  <div key={tpl._id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between hover:bg-slate-100/50 transition-colors">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-800 text-xs">{tpl.name}</h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold ${
                            tpl.type === 'whatsapp' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            tpl.type === 'email' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            'bg-purple-50 text-purple-700 border border-purple-100'
                          }`}>
                            {tpl.type === 'whatsapp' ? 'WhatsApp' : tpl.type === 'email' ? 'Email' : 'SMS'}
                          </span>
                        </div>
                        {tpl.type === 'email' && tpl.subject && (
                          <p className="text-[10px] font-semibold text-slate-500">
                            Subject: <span className="font-normal">{tpl.subject}</span>
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl._id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete Template"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 bg-white border border-slate-50 rounded-xl p-3 text-[11px] text-slate-600 whitespace-pre-wrap leading-relaxed font-medium">
                      {tpl.body}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Security */}
      {activeTab === 'security' && (
        <form onSubmit={handleSavePassword} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6 max-w-xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block border-b pb-1">Change Password</span>

          <div className="space-y-4">
            <Input
              label="Current Administrator Password"
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Input
              label="New Password (min 6 characters)"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="pt-4 border-t border-slate-50 flex justify-end">
            <Button type="submit" isLoading={savingPassword} variant="danger">
              Update Admin Password
            </Button>
          </div>
        </form>
      )}

      {/* Request Academic Master Modal */}
      <Modal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)}>
        <form onSubmit={handleRequestSubmit} className="space-y-4 text-left p-2 text-slate-850">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Request Academic Master</h3>
            <p className="text-slate-500 text-[10px] mt-0.5">Submit request to the Super Admin to add new master entities.</p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Request Type *</label>
              <select
                value={requestType}
                onChange={e => {
                  setRequestType(e.target.value);
                  resetRequestForm();
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
              >
                <option value="Department">Department</option>
                <option value="Course">Course</option>
                <option value="Specialization">Specialization</option>
              </select>
            </div>

            {requestType === 'Department' && (
              <>
                <Input
                  label="Department Name *"
                  value={reqDeptName}
                  onChange={e => setReqDeptName(e.target.value)}
                  placeholder="e.g. Pharmacy"
                  required
                />
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Department Description (optional)</label>
                  <textarea
                    value={reqDeptDesc}
                    onChange={e => setReqDeptDesc(e.target.value)}
                    placeholder="Provide brief department description details..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none h-16"
                  />
                </div>
              </>
            )}

            {requestType === 'Course' && (
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Existing Department *</label>
                  <select
                    value={reqDeptId}
                    onChange={e => setReqDeptId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
                    required
                  >
                    <option value="">-- Select Department --</option>
                    {allDepts.map(d => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Course Name *"
                  value={reqCourseName}
                  onChange={e => setReqCourseName(e.target.value)}
                  placeholder="e.g. Bachelor of Pharmacy"
                  required
                />
                <Input
                  label="Course Code (optional)"
                  value={reqCourseCode}
                  onChange={e => setReqCourseCode(e.target.value.toUpperCase())}
                  placeholder="e.g. BPHARM"
                />
                <Input
                  label="Duration (optional)"
                  value={reqDuration}
                  onChange={e => setReqDuration(e.target.value)}
                  placeholder="e.g. 4 Years"
                />
              </>
            )}

            {requestType === 'Specialization' && (
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Department *</label>
                  <select
                    value={reqDeptId}
                    onChange={e => {
                      setReqDeptId(e.target.value);
                      setReqCourseId('');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
                    required
                  >
                    <option value="">-- Select Department --</option>
                    {allDepts.map(d => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Course *</label>
                  <select
                    value={reqCourseId}
                    onChange={e => setReqCourseId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
                    required
                    disabled={!reqDeptId}
                  >
                    <option value="">-- Select Course --</option>
                    {requestAvailableCourses.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Specialization Name *"
                  value={reqSpecName}
                  onChange={e => setReqSpecName(e.target.value)}
                  placeholder="e.g. Pharmacology"
                  required
                />
              </>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Reason for Request *</label>
              <textarea
                value={reqReason}
                onChange={e => setReqReason(e.target.value)}
                placeholder="Why is this master record needed for your college?"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none h-20"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t mt-4">
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all"
            >
              Cancel
            </button>
            <Button
              type="submit"
              isLoading={requestLoading}
              className="px-4 py-2 text-xs font-bold"
            >
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SettingsPage;
