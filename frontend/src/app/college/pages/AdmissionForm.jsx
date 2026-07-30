import React, { useState, useEffect } from 'react';
import api from '../../school/services/schoolApi';
import { useAuth } from '../../school/contexts/AuthContext';
import Loader from '../../../shared/components/Loader';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import toast from 'react-hot-toast';
import { FilePlus, ShieldCheck } from 'lucide-react';

const AdmissionForm = () => {
  const { school } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    studentName: '',
    dob: '',
    gender: 'Male',
    mobile: '',
    email: '',
    category: 'General',
    nationality: 'Indian',

    tenthBoard: '',
    tenthPercentage: '',
    tenthYear: '',
    twelfthBoard: '',
    twelfthPercentage: '',
    twelfthYear: '',
    graduationPercentage: '',
    graduationYear: '',
    entranceExam: '',
    entranceScore: '',

    departmentId: '',
    courseId: '',
    specialization: '',
    referralSource: 'Google Search',

    fatherName: '',
    fatherMobile: '',
    motherName: '',
    motherMobile: '',
    parentEmail: '',

    state: '',
    city: '',
    pinCode: '',
    address: '',

    docPhoto: '',
    doc10th: '',
    doc12th: '',
    docGrad: '',
    docTransfer: '',
    docCaste: ''
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true);
        const configRes = await api.get('/college/academic/config');
        if (configRes.success && configRes.data) {
          const config = configRes.data;
          setDepartments(config.selectedDepartments || []);
          setCourses(config.selectedCourses || []);
          setSpecializations(config.selectedSpecializations || []);
        }
      } catch (error) {
        toast.error('Failed to load academic configuration');
      } finally {
        setLoading(false);
      }
    };
    fetchMetadata();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.mobile)) {
      toast.error('Student mobile number must be exactly 10 digits');
      return false;
    }
    if (formData.fatherMobile && !phoneRegex.test(formData.fatherMobile)) {
      toast.error('Father mobile number must be exactly 10 digits');
      return false;
    }
    if (formData.motherMobile && !phoneRegex.test(formData.motherMobile)) {
      toast.error('Mother mobile number must be exactly 10 digits');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid student email address');
      return false;
    }
    if (formData.parentEmail && !emailRegex.test(formData.parentEmail)) {
      toast.error('Please enter a valid parent email address');
      return false;
    }

    const p10 = parseFloat(formData.tenthPercentage);
    if (isNaN(p10) || p10 < 0 || p10 > 100) {
      toast.error('10th percentage must be between 0 and 100');
      return false;
    }
    const p12 = parseFloat(formData.twelfthPercentage);
    if (isNaN(p12) || p12 < 0 || p12 > 100) {
      toast.error('12th percentage must be between 0 and 100');
      return false;
    }
    if (formData.graduationPercentage) {
      const pGrad = parseFloat(formData.graduationPercentage);
      if (isNaN(pGrad) || pGrad < 0 || pGrad > 100) {
        toast.error('Graduation percentage must be between 0 and 100');
        return false;
      }
    }

    const yearRegex = /^[0-9]{4}$/;
    if (!yearRegex.test(formData.tenthYear)) {
      toast.error('10th passing year must be a 4-digit number');
      return false;
    }
    if (!yearRegex.test(formData.twelfthYear)) {
      toast.error('12th passing year must be a 4-digit number');
      return false;
    }
    if (formData.graduationYear && !yearRegex.test(formData.graduationYear)) {
      toast.error('Graduation passing year must be a 4-digit number');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.departmentId || !formData.courseId) {
      toast.error('Please select Department and Course');
      return;
    }

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Map to backward-compatible structure matching Mongoose requirements
      const payload = {
        ...formData,
        schoolId: school?._id || school?.id,
        parentName: formData.fatherName || formData.motherName || 'Parent',
        parentMobile: formData.fatherMobile || formData.motherMobile || formData.mobile || '9999999999',
        parentOccupation: 'N/A',
        modeOfStudy: 'Regular',
        hostelRequired: false,
        transportRequired: false,
        scholarshipApplied: false,
        feeAmountPaid: 0,
        discountApplied: 0,
        scholarshipAmount: 0,
        paymentMode: 'Online',
        transactionId: '',
        receiptUrl: '',
        documents: []
      };



      const res = await api.post('/college/applications/submit', payload);
      if (res.success) {
        toast.success('Manual admission application registered successfully!');
        window.dispatchEvent(new CustomEvent('crm-tasks-updated'));
        // Reset form
        setFormData({
          studentName: '',
          dob: '',
          gender: 'Male',
          mobile: '',
          email: '',
          category: 'General',
          nationality: 'Indian',
          tenthBoard: '',
          tenthPercentage: '',
          tenthYear: '',
          twelfthBoard: '',
          twelfthPercentage: '',
          twelfthYear: '',
          graduationPercentage: '',
          graduationYear: '',
          entranceExam: '',
          entranceScore: '',
          departmentId: '',
          courseId: '',
          specialization: '',
          referralSource: 'Google Search',
          fatherName: '',
          fatherMobile: '',
          motherName: '',
          motherMobile: '',
          parentEmail: '',
          state: '',
          city: '',
          pinCode: '',
          address: '',
          docPhoto: '',
          doc10th: '',
          doc12th: '',
          docGrad: '',
          docTransfer: '',
          docCaste: ''
        });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to register manual entry application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader message="Loading form metadata configuration..." />;
  }
  const filteredCourses = courses.filter(c => c.departmentId?._id === formData.departmentId || c.departmentId === formData.departmentId);
  const filteredSpecs = specializations.filter(s => s.courseId?._id === formData.courseId || s.courseId === formData.courseId);

  return (
    <div className="max-w-3xl mx-auto text-left pb-12">
      {/* Page Header (No Card) */}
      <div className="mb-5 mt-2">
        <h1 className="text-[24px] font-bold text-[#1F2937] tracking-tight leading-[1.2]">Manual Admission Entry</h1>
        <p className="text-[#64748B] text-[15px] font-medium mt-1.5">Register a walk-in university applicant directly into the CRM system.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Student Information */}
        <div className="bg-white border border-[#E8ECF3] rounded-[18px] p-6 shadow-[0_10px_28px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-200 space-y-4">
          <div className="border-l-4 border-[#8B5CF6] pl-3 py-0.5 mb-2.5">
            <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">
              Student Information
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Input
              label="Student Name *"
              name="studentName"
              value={formData.studentName}
              onChange={handleChange}
              placeholder="e.g. Amit Sen"
              required
            />
            <Input
              label="Date of Birth *"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleChange}
              required
            />
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/15 transition-all cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <Input
              label="Mobile Number *"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="10-digit number"
              required
            />
            <Input
              label="Email Address *"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. amit@gmail.com"
              required
            />
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/15 transition-all cursor-pointer"
              >
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="OBC-NCL">OBC-NCL</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
                <option value="Minority">Minority</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Nationality *</label>
              <select
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/15 transition-all cursor-pointer"
              >
                <option value="Indian">Indian</option>
                <option value="Nepalese">Nepalese</option>
                <option value="Bhutanese">Bhutanese</option>
                <option value="Bangladeshi">Bangladeshi</option>
                <option value="Sri Lankan">Sri Lankan</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: Academic Program Seeking */}
        <div className="bg-white border border-[#E8ECF3] rounded-[18px] p-6 shadow-[0_10px_28px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-200 space-y-4">
          <div className="border-l-4 border-[#3B82F6] pl-3 py-0.5 mb-2.5">
            <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">
              Academic Program Seeking
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Input
              label="10th Board *"
              name="tenthBoard"
              value={formData.tenthBoard}
              onChange={handleChange}
              placeholder="e.g. CBSE / State Board"
              required
            />
            <Input
              label="10th Percentage *"
              name="tenthPercentage"
              type="number"
              value={formData.tenthPercentage}
              onChange={handleChange}
              placeholder="e.g. 84.5"
              required
            />
            <Input
              label="10th Passing Year *"
              name="tenthYear"
              type="number"
              value={formData.tenthYear}
              onChange={handleChange}
              placeholder="e.g. 2022"
              required
            />
            <Input
              label="12th Board *"
              name="twelfthBoard"
              value={formData.twelfthBoard}
              onChange={handleChange}
              placeholder="e.g. CBSE / State Board"
              required
            />
            <Input
              label="12th Percentage *"
              name="twelfthPercentage"
              type="number"
              value={formData.twelfthPercentage}
              onChange={handleChange}
              placeholder="e.g. 87.2"
              required
            />
            <Input
              label="12th Passing Year *"
              name="twelfthYear"
              type="number"
              value={formData.twelfthYear}
              onChange={handleChange}
              placeholder="e.g. 2024"
              required
            />
            <Input
              label="Graduation Percentage (Optional)"
              name="graduationPercentage"
              type="number"
              value={formData.graduationPercentage}
              onChange={handleChange}
              placeholder="e.g. 75.6"
            />
            <Input
              label="Graduation Passing Year (Optional)"
              name="graduationYear"
              type="number"
              value={formData.graduationYear}
              onChange={handleChange}
              placeholder="e.g. 2027"
            />
            <Input
              label="Entrance Exam Name (Optional)"
              name="entranceExam"
              value={formData.entranceExam}
              onChange={handleChange}
              placeholder="e.g. JEE, CAT, MAT"
            />
            {formData.entranceExam && (
              <Input
                label="Entrance Score *"
                name="entranceScore"
                type="number"
                value={formData.entranceScore}
                onChange={handleChange}
                placeholder="Percentile / Rank"
                required
              />
            )}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Department *</label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/15 transition-all cursor-pointer"
                required
              >
                <option value="">-- Select Department --</option>
                {departments.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Course *</label>
              <select
                name="courseId"
                value={formData.courseId}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/15 transition-all cursor-pointer"
                required
                disabled={!formData.departmentId}
              >
                <option value="">-- Select Course --</option>
                {filteredCourses.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Specialization</label>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/15 transition-all cursor-pointer"
                disabled={!formData.courseId}
              >
                <option value="">-- Select Specialization --</option>
                {filteredSpecs.map(s => (
                  <option key={s._id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Reference Source</label>
              <select
                name="referralSource"
                value={formData.referralSource}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/15 transition-all cursor-pointer"
              >
                <option value="Google Search">Google Search</option>
                <option value="College Website">College Website</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="YouTube">YouTube</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Friend / Relative">Friend / Relative</option>
                <option value="School">School</option>
                <option value="Education Fair">Education Fair</option>
                <option value="Newspaper">Newspaper</option>
                <option value="Counsellor">Counsellor</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: Parent / Guardian Details */}
        <div className="bg-white border border-[#E8ECF3] rounded-[18px] p-6 shadow-[0_10px_28px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-200 space-y-4">
          <div className="border-l-4 border-[#22C55E] pl-3 py-0.5 mb-2.5">
            <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">
              Parent / Guardian Details
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Input
              label="Father's Name"
              name="fatherName"
              value={formData.fatherName}
              onChange={handleChange}
              placeholder="e.g. Ramesh Sen"
            />
            <Input
              label="Father's Mobile"
              name="fatherMobile"
              value={formData.fatherMobile}
              onChange={handleChange}
              placeholder="10-digit number"
            />
            <Input
              label="Mother's Name"
              name="motherName"
              value={formData.motherName}
              onChange={handleChange}
              placeholder="e.g. Sunita Sen"
            />
            <Input
              label="Mother's Mobile"
              name="motherMobile"
              value={formData.motherMobile}
              onChange={handleChange}
              placeholder="10-digit number"
            />
            <Input
              label="Parent Email (Optional)"
              name="parentEmail"
              type="email"
              value={formData.parentEmail}
              onChange={handleChange}
              placeholder="e.g. parent@gmail.com"
            />
          </div>
        </div>

        {/* SECTION 4: Address & Location Details */}
        <div className="bg-white border border-[#E8ECF3] rounded-[18px] p-6 shadow-[0_10px_28px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-200 space-y-4">
          <div className="border-l-4 border-[#F59E0B] pl-3 py-0.5 mb-2.5">
            <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">
              Address & Location Details
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Input
              label="State *"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="e.g. Delhi"
              required
            />
            <Input
              label="City *"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="e.g. New Delhi"
              required
            />
            <Input
              label="PIN Code *"
              name="pinCode"
              value={formData.pinCode}
              onChange={handleChange}
              placeholder="e.g. 110001"
              required
            />
            <div className="sm:col-span-2 md:col-span-3">
              <Input
                label="Full Address *"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="House No, Building, Street, Area details..."
                required
              />
            </div>
          </div>
        </div>



        {/* Section 7: Submit Button */}
        <div className="flex items-center justify-between bg-slate-50/50 rounded-[18px] border border-[#E8ECF3] p-5">
          <div className="hidden sm:flex items-center text-xs text-slate-500 gap-2 font-semibold">
            <ShieldCheck className="h-5 w-5 text-slate-400 shrink-0" />
            <span>Encrypted transmission. Direct entry into CRM.</span>
          </div>
          <Button
            type="submit"
            className="py-3 px-6 text-xs font-bold inline-flex items-center"
            isLoading={submitting}
          >
            <FilePlus className="h-4 w-4 mr-1.5 shrink-0" /> Submit Application Entry
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdmissionForm;
