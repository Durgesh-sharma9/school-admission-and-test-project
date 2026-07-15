import React from 'react';
import { useForm } from 'react-hook-form';
import Input from './Input';
import Button from './Button';
import { User, Users, MapPin, FileText } from 'lucide-react';

const AdmissionForm = ({
  onSubmit,
  isLoading = false,
  isPublic = false,
  schoolName = '',
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
      currentSchool: '',
      currentClass: '',
      parentName: '',
      mobile: '',
      whatsapp: '',
      email: '',
      city: '',
      area: '',
      fullAddress: '',
      notes: '',
      status: 'New Enquiry',
    },
  });

  const watchMobile = watch('mobile');

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

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 max-w-4xl mx-auto">
      {/* Section 1: Student Information */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
        <div className="flex items-center space-x-2 pb-4 border-b border-slate-50">
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
            label="Current School (Optional)"
            name="currentSchool"
            placeholder="e.g. Greenwood Nursery"
            error={errors.currentSchool}
            {...register('currentSchool')}
          />

          <Input
            label="Current Class (Optional)"
            name="currentClass"
            placeholder="e.g. Grade 4"
            error={errors.currentClass}
            {...register('currentClass')}
          />
        </div>
      </div>

      {/* Section 2: Parent / Guardian Information */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
        <div className="flex items-center space-x-2 pb-4 border-b border-slate-50">
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
        <div className="flex items-center space-x-2 pb-4 border-b border-slate-50">
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <MapPin className="h-4.5 w-4.5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">
            Address Details
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Input
            label="City"
            name="city"
            placeholder="e.g. Mumbai"
            required
            error={errors.city}
            {...register('city', { required: 'City is required' })}
          />

          <Input
            label="Area / Locality"
            name="area"
            placeholder="e.g. Andheri West"
            required
            error={errors.area}
            {...register('area', { required: 'Area/Locality is required' })}
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

      {/* Section 4: Admin Options or Additional Notes */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
        <div className="flex items-center space-x-2 pb-4 border-b border-slate-50">
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
                label="Enquiry Initial Status"
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
