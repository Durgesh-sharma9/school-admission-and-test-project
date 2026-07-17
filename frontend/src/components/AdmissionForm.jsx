import React from 'react';
import { useForm } from 'react-hook-form';
import Input from './Input';
import Button from './Button';
import { User, Users, MapPin, FileText } from 'lucide-react';

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

  const [stateSearch, setStateSearch] = React.useState('');
  const [showStateDropdown, setShowStateDropdown] = React.useState(false);
  const dropdownRef = React.useRef(null);

  const [sourceSearch, setSourceSearch] = React.useState('');
  const [showSourceDropdown, setShowSourceDropdown] = React.useState(false);
  const sourceDropdownRef = React.useRef(null);

  // Sync state search input on load/change
  React.useEffect(() => {
    setStateSearch(watchState || '');
  }, [watchState]);

  // Sync source search input on load/change
  React.useEffect(() => {
    setSourceSearch(watchSource || '');
  }, [watchSource]);

  // Click outside listener for dropdowns
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowStateDropdown(false);
      }
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(event.target)) {
        setShowSourceDropdown(false);
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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 max-w-4xl mx-auto">
      {/* Section 1: Student Information */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
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
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
        <div className="flex items-center space-x-2 pb-4 border-b border-slate-55">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="h-4.5 w-4.5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">
            Parent / Guardian Information
          </h3>
        </div>

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
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
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
              className={`w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                errors.state ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''
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

          <Input
            label="Locality / Area"
            name="area"
            placeholder="e.g. Andheri West"
            required
            error={errors.area}
            {...register('area', { required: 'Locality/Area is required' })}
          />

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
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
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
              className={`w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                errors.source ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''
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
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
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
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
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
  );
};

export default AdmissionForm;
