import React from 'react';
import { useForm } from 'react-hook-form';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import { User, Users, MapPin, FileText, ChevronLeft, ChevronRight, X, Eye, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useParams } from 'react-router-dom';

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

const MARKETING_SOURCES = [
  "Google Search",
  "Facebook",
  "Instagram",
  "YouTube",
  "School Website",
  "Friend / Relative",
  "Existing Parent",
  "Teacher Reference",
  "Newspaper",
  "Banner / Hoarding",
  "Pamphlet",
  "Walk-in",
  "Reception",
  "Education Fair",
  "WhatsApp",
  "Other"
];

const AdmissionForm = ({
  onSubmit,
  isLoading = false,
  isPublic = false,
  schoolName = '',
  initialData = null,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      studentName: '',
      gender: '',
      dob: '',
      classSeeking: '',
      previousSchool: '',
      previousClass: '',
      parentName: '',
      mobile: '',
      whatsapp: '',
      email: '',
      state: '',
      area: '',
      city: '',
      society: '',
      fullAddress: '',
      source: '',
      sourceOtherSpecify: '',
      expectations: '',
      notes: '',
      status: 'New Enquiry',
    },
  });

  const watchMobile = watch('mobile');
  const watchState = watch('state');
  const watchSource = watch('source');

  const authContext = useAuth ? useAuth() : null;
  const school = authContext?.school;
  const { schoolId: paramSchoolId } = useParams();
  const schoolId = paramSchoolId || school?._id || school?.id || '';

  const [recognitionLoading, setRecognitionLoading] = React.useState(false);
  const [parentHistory, setParentHistory] = React.useState(null);
  const [showHistoryModal, setShowHistoryModal] = React.useState(false);
  const [showPreviousList, setShowPreviousList] = React.useState(false);
  const [hasSelectedOptionForMobile, setHasSelectedOptionForMobile] = React.useState('');
  const [selectedEnquiryForView, setSelectedEnquiryForView] = React.useState(null);

  // Real-time parent recognition lookup on 10 digits
  React.useEffect(() => {
    const checkParentRecognition = async () => {
      const digitsOnly = (watchMobile || '').replace(/\D/g, '');
      if (digitsOnly.length === 10) {
        if (hasSelectedOptionForMobile === digitsOnly) {
          return;
        }
        setRecognitionLoading(true);
        try {
          const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
          const res = await fetch(`${apiBaseUrl}/enquiries/parent-recognition/${digitsOnly}?schoolId=${schoolId}`);
          const data = await res.json();
          if (res.ok && data.success && data.exists) {
            setParentHistory(data);
            setShowHistoryModal(true); // Open the modal automatically!
          } else {
            setParentHistory(null);
            setShowHistoryModal(false);
            setShowPreviousList(false);
          }
        } catch (err) {
          console.error('Parent recognition check failed:', err);
          setParentHistory(null);
          setShowHistoryModal(false);
          setShowPreviousList(false);
        } finally {
          setRecognitionLoading(false);
        }
      } else {
        setParentHistory(null);
        setShowHistoryModal(false);
        setShowPreviousList(false);
        setHasSelectedOptionForMobile('');
      }
    };
    if (!initialData) {
      checkParentRecognition();
    }
  }, [watchMobile, schoolId, initialData, hasSelectedOptionForMobile]);

  // Autofill parent details
  const handleCreateNewEnquiry = () => {
    if (!parentHistory || !parentHistory.parent) return;
    const p = parentHistory.parent;

    // Set values
    setValue('parentName', p.parentName || '');
    setValue('whatsapp', p.whatsapp || '');
    setValue('email', p.email || '');
    setValue('state', p.state || '');
    setValue('city', p.city || '');
    setValue('area', p.area || '');
    setValue('society', p.society || '');
    setValue('fullAddress', p.fullAddress || '');

    // Clear student fields
    setValue('studentName', '');
    setValue('gender', '');
    setValue('dob', '');
    setValue('classSeeking', '');
    setValue('previousSchool', '');
    setValue('previousClass', '');
    setValue('notes', '');
    setValue('expectations', '');

    const digitsOnly = (watchMobile || '').replace(/\D/g, '');
    setHasSelectedOptionForMobile(digitsOnly);
    setShowHistoryModal(false);
    setShowPreviousList(false);

    toast.success('Parent details auto-filled! Please enter student information.');
  };

  const watchArea = watch('area');

  const [stateSearch, setStateSearch] = React.useState('');
  const [showStateDropdown, setShowStateDropdown] = React.useState(false);
  const dropdownRef = React.useRef(null);

  const [sourceSearch, setSourceSearch] = React.useState('');
  const [showSourceDropdown, setShowSourceDropdown] = React.useState(false);
  const sourceDropdownRef = React.useRef(null);

  const [activeLocalities, setActiveLocalities] = React.useState([]);
  const [areaSearch, setAreaSearch] = React.useState('');
  const [showLocalityDropdown, setShowLocalityDropdown] = React.useState(false);
  const localityDropdownRef = React.useRef(null);

  // Fetch active localities for dropdown suggestions
  React.useEffect(() => {
    const fetchActiveLocalities = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
        const targetSchoolId = schoolId || '';
        const res = await fetch(`${apiBaseUrl}/localities/active?schoolId=${targetSchoolId}`);
        const data = await res.json();
        if (data.success) {
          setActiveLocalities(data.data || []);
        }
      } catch (err) {
        console.error('Failed to load active localities:', err);
      }
    };
    fetchActiveLocalities();
  }, [schoolId]);

  // Sync state search input on load/change
  React.useEffect(() => {
    setStateSearch(watchState || '');
  }, [watchState]);

  // Sync source search input on load/change
  React.useEffect(() => {
    setSourceSearch(watchSource || '');
  }, [watchSource]);

  // Sync area search input on load/change
  React.useEffect(() => {
    setAreaSearch(watchArea || '');
  }, [watchArea]);

  // Click outside listener for dropdowns
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowStateDropdown(false);
      }
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(event.target)) {
        setShowSourceDropdown(false);
      }
      if (localityDropdownRef.current && !localityDropdownRef.current.contains(event.target)) {
        setShowLocalityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync initialData in Edit mode
  React.useEffect(() => {
    if (initialData) {
      const formattedData = { ...initialData };
      if (formattedData.dob) {
        formattedData.dob = new Date(formattedData.dob).toISOString().split('T')[0];
      }
      // Populate previous fields from current fields for old records
      if (formattedData.currentSchool && !formattedData.previousSchool) {
        formattedData.previousSchool = formattedData.currentSchool;
      }
      if (formattedData.currentClass && !formattedData.previousClass) {
        formattedData.previousClass = formattedData.currentClass;
      }
      reset(formattedData);
    } else {
      reset({
        studentName: '',
        gender: '',
        dob: '',
        classSeeking: '',
        previousSchool: '',
        previousClass: '',
        parentName: '',
        mobile: '',
        whatsapp: '',
        email: '',
        state: '',
        area: '',
        city: '',
        society: '',
        fullAddress: '',
        source: '',
        sourceOtherSpecify: '',
        expectations: '',
        notes: '',
        status: 'New Enquiry',
      });
    }
  }, [initialData, reset]);

  // Copy mobile number to WhatsApp number if requested
  const copyMobileToWhatsapp = () => {
    if (watchMobile) {
      setValue('whatsapp', watchMobile);
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      // 10-digit quick check block
      const digitsOnly = (data.mobile || '').replace(/\D/g, '');
      if (digitsOnly.length === 10 && !initialData) {
        if (hasSelectedOptionForMobile !== digitsOnly) {
          const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
          const res = await fetch(`${apiBaseUrl}/enquiries/parent-recognition/${digitsOnly}?schoolId=${schoolId}`);
          const result = await res.json();
          if (res.ok && result.success && result.exists) {
            setParentHistory(result);
            setShowHistoryModal(true);
            toast.error('We found previous enquiries for this parent. Please select an option to proceed.');
            return; // BLOCKS SUBMISSION!
          }
        }
      }
      await onSubmit(data, reset);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredStates = INDIAN_STATES.filter(st =>
    st.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const filteredSources = MARKETING_SOURCES.filter(src =>
    src.toLowerCase().includes(sourceSearch.toLowerCase())
  );

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 max-w-4xl mx-auto">
        {/* Section 1: Student Information */}
        <div className="bg-white rounded-[18px] border border-[#E8ECF3] p-6 shadow-[0_10px_28px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-200 space-y-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-55">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <User className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">
              Student Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Input
              label="Student Full Name"
              name="studentName"
              placeholder="e.g. John Doe"
              required
              error={errors.studentName}
              {...register('studentName', { required: 'Student name is required' })}
            />

            <Input
              label="Gender"
              name="gender"
              type="select"
              placeholder="Select Gender"
              required
              error={errors.gender}
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' },
              ]}
              {...register('gender', { required: 'Gender selection is required' })}
            />

            <Input
              label="Date of Birth"
              name="dob"
              type="date"
              required
              error={errors.dob}
              {...register('dob', { required: 'Date of Birth is required' })}
            />

            <Input
              label="Class Seeking Admission"
              name="classSeeking"
              placeholder="e.g. Grade 5, Kindergarten"
              required
              error={errors.classSeeking}
              {...register('classSeeking', { required: 'Admission class is required' })}
            />

            <Input
              label="Previous School *"
              name="previousSchool"
              placeholder="e.g. Greenwood Nursery"
              required
              error={errors.previousSchool}
              {...register('previousSchool', { required: 'Previous school is required' })}
            />

            <Input
              label="Previous Class *"
              name="previousClass"
              placeholder="e.g. Grade 4"
              required
              error={errors.previousClass}
              {...register('previousClass', { required: 'Previous class is required' })}
            />
          </div>
        </div>

        {/* Section 2: Parent / Guardian Information */}
        <div className="bg-white rounded-[18px] border border-[#E8ECF3] p-6 shadow-[0_10px_28px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-200 space-y-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-55">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">
              Parent / Guardian Information
            </h3>
          </div>

          {/* Welcome Back Card for Parent Recognition */}
          {recognitionLoading && (
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-2">
              <div className="h-3 w-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              Checking parent history...
            </div>
          )}

          {parentHistory && parentHistory.exists && (
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 space-y-4 text-left">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-base font-extrabold text-slate-850">👋 Welcome Back!</span>
                  <p className="text-xs text-indigo-950 font-medium">We found your previous enquiry history.</p>
                </div>
                <span className="bg-indigo-100 border border-indigo-200 text-indigo-750 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Existing Parent
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block">Parent Name</span>
                  <span className="font-bold text-slate-800">{parentHistory.parent?.parentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Mobile</span>
                  <span className="font-bold text-slate-800">{parentHistory.parent?.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Previous Enquiries</span>
                  <span className="font-bold text-slate-800">{parentHistory.enquiriesCount}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Children</span>
                  <span className="font-bold text-slate-800">
                    {parentHistory.children?.join(', ') || 'None'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors"
                >
                  View Previous Enquiries
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewEnquiry}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                >
                  Create New Enquiry
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Parent / Guardian Name"
              name="parentName"
              placeholder="e.g. Robert Doe"
              required
              error={errors.parentName}
              {...register('parentName', { required: 'Parent name is required' })}
            />

            <Input
              label="Mobile Number"
              name="mobile"
              placeholder="e.g. 9876543210"
              required
              error={errors.mobile}
              {...register('mobile', {
                required: 'Mobile number is required',
                pattern: {
                  value: /^[0-9+() -]{10,15}$/,
                  message: 'Enter a valid 10-15 digit mobile number',
                },
              })}
            />

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="whatsapp" className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                  WhatsApp Number (Optional)
                </label>
                {watchMobile && (
                  <button
                    type="button"
                    onClick={copyMobileToWhatsapp}
                    className="text-[10px] text-indigo-600 hover:text-indigo-500 font-bold tracking-wide"
                  >
                    Same as Mobile
                  </button>
                )}
              </div>
              <Input
                name="whatsapp"
                placeholder="e.g. 9876543210"
                error={errors.whatsapp}
                {...register('whatsapp', {
                  pattern: {
                    value: /^[0-9+() -]{10,15}$/ || '',
                    message: 'Enter a valid WhatsApp number',
                  },
                })}
              />
            </div>

            <Input
              label="Email Address (Optional)"
              name="email"
              type="email"
              placeholder="e.g. parent@example.com"
              error={errors.email}
              {...register('email', {
                pattern: {
                  value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                  message: 'Please enter a valid email address',
                },
              })}
            />
          </div>
        </div>

        {/* Section 3: Address Details */}
        <div className="bg-white rounded-[18px] border border-[#E8ECF3] p-6 shadow-[0_10px_28px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-200 space-y-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-55">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <MapPin className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">
              Address Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Autocomplete State Input */}
            <div className="relative flex flex-col gap-1.5 text-left" ref={dropdownRef}>
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Type to search State... e.g. Rajasthan"
                value={stateSearch}
                onChange={(e) => {
                  const val = e.target.value;
                  setStateSearch(val);
                  setValue('state', val, { shouldValidate: true });
                  setShowStateDropdown(true);
                }}
                onFocus={() => setShowStateDropdown(true)}
                className={`w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${errors.state ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''
                  }`}
              />
              <input
                type="hidden"
                {...register('state', { required: 'State is required' })}
              />
              {showStateDropdown && filteredStates.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50 divide-y divide-slate-100">
                  {filteredStates.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setValue('state', st, { shouldValidate: true });
                        setStateSearch(st);
                        setShowStateDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors font-semibold"
                    >
                      {st}
                    </button>
                  ))}
                </div>
              )}
              {errors.state && (
                <span className="text-xs text-red-500 font-medium mt-0.5">
                  {errors.state.message}
                </span>
              )}
            </div>

            {/* Searchable Creatable Locality Input */}
            <div className="relative flex flex-col gap-1.5 text-left" ref={localityDropdownRef}>
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                Locality / Area <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Type or select locality... e.g. Mahapura"
                value={areaSearch}
                onChange={(e) => {
                  const val = e.target.value;
                  setAreaSearch(val);
                  setValue('area', val, { shouldValidate: true });
                  setShowLocalityDropdown(true);
                }}
                onFocus={() => setShowLocalityDropdown(true)}
                className={`w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${errors.area ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''
                  }`}
              />
              <input
                type="hidden"
                {...register('area', { required: 'Locality/Area is required' })}
              />
              {showLocalityDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50 divide-y divide-slate-100">
                  {/* Matching localities */}
                  {activeLocalities
                    .filter(loc => loc.name.toLowerCase().includes((areaSearch || '').toLowerCase()))
                    .map((loc) => (
                      <button
                        key={loc._id}
                        type="button"
                        onClick={() => {
                          setValue('area', loc.name, { shouldValidate: true });
                          setAreaSearch(loc.name);
                          setShowLocalityDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors font-semibold flex items-center gap-2"
                      >
                        <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        {loc.name}
                      </button>
                    ))}

                  {/* Creatable option if typed locality is not an exact match */}
                  {areaSearch.trim() && !activeLocalities.some(loc => loc.name.toLowerCase() === areaSearch.trim().toLowerCase()) && (
                    <button
                      type="button"
                      onClick={() => {
                        setValue('area', areaSearch.trim(), { shouldValidate: true });
                        setShowLocalityDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-amber-700 bg-amber-50/60 hover:bg-amber-100/60 transition-colors font-extrabold flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4 text-amber-600 shrink-0" />
                      Add "{areaSearch.trim()}"
                    </button>
                  )}
                </div>
              )}
              {errors.area && (
                <span className="text-xs text-red-500 font-medium mt-0.5">
                  {errors.area.message}
                </span>
              )}
            </div>

            <Input
              label="City"
              name="city"
              placeholder="e.g. Mumbai"
              required
              error={errors.city}
              {...register('city', { required: 'City is required' })}
            />

            <Input
              label="Society / Township (Optional)"
              name="society"
              placeholder="e.g. Mahima Panorama"
              error={errors.society}
              {...register('society')}
            />

            <div className="sm:col-span-2">
              <Input
                label="Full Address (Optional)"
                name="fullAddress"
                type="textarea"
                placeholder="e.g. House No, Apartment Name, Street details"
                error={errors.fullAddress}
                {...register('fullAddress')}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Where did you hear about us? */}
        <div className="bg-white rounded-[18px] border border-[#E8ECF3] p-6 shadow-[0_10px_28px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-200 space-y-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-55">
            <div className="p-1.5 bg-purple-50 text-purple-605 rounded-lg">
              <Users className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">
              Where did you hear about us? *
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Autocomplete Source Input */}
            <div className="relative flex flex-col gap-1.5 text-left animate-in fade-in duration-200" ref={sourceDropdownRef}>
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                Source <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Type to search Source... e.g. Facebook"
                value={sourceSearch}
                onChange={(e) => {
                  const val = e.target.value;
                  setSourceSearch(val);
                  setValue('source', val, { shouldValidate: true });
                  setShowSourceDropdown(true);
                }}
                onFocus={() => setShowSourceDropdown(true)}
                className={`w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${errors.source ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''
                  }`}
              />
              <input
                type="hidden"
                {...register('source', {
                  required: 'Source selection is required',
                  validate: value => MARKETING_SOURCES.includes(value) || 'Please select a valid option from the dropdown'
                })}
              />
              {showSourceDropdown && filteredSources.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50 divide-y divide-slate-100">
                  {filteredSources.map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => {
                        setValue('source', src, { shouldValidate: true });
                        setSourceSearch(src);
                        setShowSourceDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors font-semibold"
                    >
                      {src}
                    </button>
                  ))}
                </div>
              )}
              {errors.source && (
                <span className="text-xs text-red-500 font-medium mt-0.5">
                  {errors.source.message}
                </span>
              )}
            </div>

            {/* Conditional "Other" specify field */}
            {watchSource === 'Other' && (
              <div className="text-left animate-in slide-in-from-top-2 duration-200">
                <Input
                  label="Please specify *"
                  name="sourceOtherSpecify"
                  placeholder="e.g. Local Ad Campaign"
                  required
                  error={errors.sourceOtherSpecify}
                  {...register('sourceOtherSpecify', { required: 'Please specify the source details' })}
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 5: Parent Expectations */}
        <div className="bg-white rounded-[18px] border border-[#E8ECF3] p-6 shadow-[0_10px_28px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-200 space-y-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-55">
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">
              Parent Expectations
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-6 text-left">
            <Input
              label="What do you expect from the school? (Optional)"
              name="expectations"
              type="textarea"
              placeholder="Please tell us what you expect from the school... e.g. Academic Excellence, Sports, Discipline, Transportation, Activities, Safety, Good Teachers, Other expectations"
              error={errors.expectations}
              {...register('expectations')}
            />
          </div>
        </div>

        {/* Section 6: Admin Options or Additional Notes */}
        <div className="bg-white rounded-[18px] border border-[#E8ECF3] p-6 shadow-[0_10px_28px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-200 space-y-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-55">
            <div className="p-1.5 bg-slate-50 text-slate-600 rounded-lg">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">
              Additional Information
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {!isPublic && (
              <div className="max-w-xs">
                <Input
                  label="Enquiry Status"
                  name="status"
                  type="select"
                  required
                  error={errors.status}
                  options={[
                    { value: 'New Enquiry', label: 'New Enquiry' },
                    { value: 'Hold', label: 'Hold' },
                    { value: 'Not Interested', label: 'Not Interested' },
                    { value: 'Admission Confirmed', label: 'Admission Confirmed' },
                  ]}
                  {...register('status', { required: 'Status is required' })}
                />
              </div>
            )}

            <Input
              label="Notes / Special Instructions (Optional)"
              name="notes"
              type="textarea"
              placeholder="e.g. Requires transport facilities, requested fee installment schedule"
              error={errors.notes}
              {...register('notes')}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            className="px-8 py-3"
            isLoading={isLoading}
          >
            {isPublic ? 'Submit Admission Enquiry' : 'Save CRM Enquiry'}
          </Button>
        </div>
      </form>

      {/* Existing Parent Recognition Automatic Modal */}
      {showHistoryModal && parentHistory && parentHistory.exists && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 bg-indigo-50 border-b border-indigo-105 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-indigo-755">
                <span className="text-xl">👋</span>
                <h3 className="text-sm font-extrabold uppercase tracking-wide">
                  Welcome Back!
                </h3>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
              <p className="text-xs text-slate-500 font-semibold leading-normal">
                We found your previous enquiry history in our database.
              </p>

              {/* Parent Summary Card */}
              <div className="bg-slate-50 border border-slate-105 rounded-2xl p-4 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block">Parent Name</span>
                  <span className="font-bold text-slate-805">{parentHistory.parent?.parentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Mobile</span>
                  <span className="font-bold text-slate-805">{parentHistory.parent?.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Previous Enquiries</span>
                  <span className="font-bold text-slate-805">{parentHistory.enquiriesCount}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Children</span>
                  <span className="font-bold text-slate-805">
                    {parentHistory.children?.join(', ') || 'None'}
                  </span>
                </div>
              </div>

              {/* Choice options */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  What would you like to do?
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPreviousList(true)}
                    className="flex flex-col items-center justify-center p-4 border border-slate-205 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-2xl transition-all space-y-1 group"
                  >
                    <span className="text-xs font-extrabold text-slate-800 group-hover:text-indigo-755">
                      View Previous Enquiries
                    </span>
                    <span className="text-[10px] text-slate-400">Review status, dates or details</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateNewEnquiry}
                    className="flex flex-col items-center justify-center p-4 border border-slate-205 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-2xl transition-all space-y-1 group"
                  >
                    <span className="text-xs font-extrabold text-slate-850 group-hover:text-indigo-755">
                      Create New Enquiry
                    </span>
                    <span className="text-[10px] text-slate-400">Prefills parent, empty student</span>
                  </button>
                </div>
              </div>

              {/* Embedded past enquiries if toggled */}
              {showPreviousList && (
                <div className="border-t border-slate-100 pt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Select enquiry to view details
                  </span>
                  <div className="space-y-3">
                    {(parentHistory.enquiries || []).map((enq) => (
                      <div key={enq._id} className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-xs text-indigo-650 block">{enq.enquiryId}</span>
                          <span className="text-[10px] font-semibold text-slate-600 block mt-0.5">
                            👦 {enq.studentName} ({enq.classSeeking})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedEnquiryForView(enq)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors text-[10px]"
                        >
                          Open Details
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Read-Only Details View Modal */}
      {selectedEnquiryForView && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Enquiry Details: {selectedEnquiryForView.enquiryId}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedEnquiryForView(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-405 hover:text-slate-650 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
              {/* Student info */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Student Details</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block">Full Name</span>
                    <span className="font-bold text-slate-800">{selectedEnquiryForView.studentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Gender</span>
                    <span className="font-bold text-slate-800">{selectedEnquiryForView.gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Date of Birth</span>
                    <span className="font-bold text-slate-800">
                      {selectedEnquiryForView.dob ? new Date(selectedEnquiryForView.dob).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Seeking Class</span>
                    <span className="font-bold text-slate-800">{selectedEnquiryForView.classSeeking}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Previous School</span>
                    <span className="font-bold text-slate-800">{selectedEnquiryForView.previousSchool || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Previous Class</span>
                    <span className="font-bold text-slate-800">{selectedEnquiryForView.previousClass || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Parent info */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Parent details</span>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block">Guardian Name</span>
                    <span className="font-bold text-slate-800">{selectedEnquiryForView.parentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Mobile Number</span>
                    <span className="font-bold text-slate-800">{selectedEnquiryForView.mobile}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">WhatsApp Number</span>
                    <span className="font-bold text-slate-800">{selectedEnquiryForView.whatsapp || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Email Address</span>
                    <span className="font-bold text-slate-800">{selectedEnquiryForView.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Address info */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Address Details</span>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block">City & State</span>
                    <span className="font-bold text-slate-800">
                      {selectedEnquiryForView.city || 'N/A'}, {selectedEnquiryForView.state || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Area / Locality</span>
                    <span className="font-bold text-slate-800">{selectedEnquiryForView.area || 'N/A'}</span>
                  </div>
                  {selectedEnquiryForView.fullAddress && (
                    <div className="col-span-2">
                      <span className="text-slate-400 font-semibold block">Full Address</span>
                      <span className="font-bold text-slate-800">{selectedEnquiryForView.fullAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Source & Expectations */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Other details</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block">Source Info</span>
                    <span className="font-bold text-slate-800">
                      {selectedEnquiryForView.source} {selectedEnquiryForView.sourceOtherSpecify ? `(${selectedEnquiryForView.sourceOtherSpecify})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Expectations</span>
                    <span className="font-bold text-slate-800">{selectedEnquiryForView.expectations || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedEnquiryForView(null)}
              >
                Back to History
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdmissionForm;
