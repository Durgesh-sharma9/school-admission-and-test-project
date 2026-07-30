import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Loader from '../../../shared/components/Loader';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import { GraduationCap, ShieldCheck, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PublicAdmissionPage = () => {
  const params = useParams();
  const schoolId = params.schoolId || params.token || params.id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [collegeInfo, setCollegeInfo] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [specializations, setSpecializations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Check if receptionist mode
  const isReception = searchParams.get('role') === 'reception';

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
    const fetchCollegeDetails = async () => {
      try {
        setLoading(true);
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

        const [infoRes, deptsRes, coursesRes, specsRes] = await Promise.all([
          axios.get(`${apiBaseUrl}/auth/public/school/${schoolId}`),
          axios.get(`${apiBaseUrl}/college/public/departments/${schoolId}`),
          axios.get(`${apiBaseUrl}/college/public/courses/${schoolId}`),
          axios.get(`${apiBaseUrl}/college/public/specializations/${schoolId}`)
        ]);

        if (infoRes.data.success) setCollegeInfo(infoRes.data.school);
        if (deptsRes.data.success) setDepartments(deptsRes.data.data);
        if (coursesRes.data.success) setCourses(coursesRes.data.data);
        if (specsRes.data.success) setSpecializations(specsRes.data.data);
      } catch (error) {
        console.error('Failed to fetch college details:', error);
        toast.error('Unable to verify college code');
      } finally {
        setLoading(false);
      }
    };

    if (schoolId) {
      fetchCollegeDetails();
    }
  }, [schoolId]);

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
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

      // Map to backward-compatible structure matching Mongoose requirements
      const payload = {
        ...formData,
        schoolId,
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



      const res = await axios.post(`${apiBaseUrl}/college/applications/submit`, payload);
      if (res.data.success) {
        toast.success('Registration submitted successfully!');
        navigate(`/public/college/thank-you/${schoolId}${isReception ? '?role=reception' : ''}`, {
          state: {
            studentName: res.data.data.studentName,
            parentName: res.data.data.parentName,
            applicationId: res.data.data.applicationId
          }
        });
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to submit registration application';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader fullPage message="Loading registration form..." />;
  }

  if (!collegeInfo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white rounded-2xl p-8 border border-slate-100 shadow-sm space-y-4">
          <div className="h-12 w-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Invalid Admission Link</h2>
          <p className="text-xs text-slate-400 leading-normal">
            The college admission link you are trying to access does not match any registered campus. Please contact the administration.
          </p>
        </div>
      </div>
    );
  }

  const filteredCourses = courses.filter(c => c.departmentId?._id === formData.departmentId || c.departmentId === formData.departmentId);
  const filteredSpecs = specializations.filter(s => s.courseId?._id === formData.courseId || s.courseId === formData.courseId);

  return (
    <div className="min-h-screen bg-slate-50 bg-gradient-to-tr from-indigo-50/20 via-slate-50 to-indigo-50/10 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6 text-left">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          {collegeInfo?.logo ? (
            <img
              src={collegeInfo.logo}
              alt={collegeInfo.name}
              className="h-16 w-16 rounded-xl object-cover border border-slate-100"
            />
          ) : (
            <div className="h-16 w-16 bg-indigo-50 text-indigo-650 rounded-xl flex items-center justify-center font-bold text-lg border border-indigo-100">
              <GraduationCap className="h-8 w-8" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-extrabold text-slate-850">{collegeInfo.name}</h1>
            <p className="text-slate-400 text-xs mt-0.5">{collegeInfo.tagline || 'Public Admission Registration Portal'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: Student Information */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-indigo-650 uppercase tracking-wider pb-1 border-b">
              1. Student Information
            </h3>
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
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

          {/* SECTION 2: Academic Details */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-indigo-650 uppercase tracking-wider pb-1 border-b">
              2. Academic Details
            </h3>
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
            </div>
          </div>

          {/* SECTION 3: Course Selection */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-indigo-650 uppercase tracking-wider pb-1 border-b">
              3. Course Selection
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Department *</label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
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

          {/* SECTION 4: Parent Details */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-indigo-650 uppercase tracking-wider pb-1 border-b">
              4. Parent Details
            </h3>
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

          {/* SECTION 5: Address */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-indigo-650 uppercase tracking-wider pb-1 border-b">
              5. Address Details
            </h3>
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
          <div className="flex items-center justify-between bg-indigo-50/50 rounded-2xl border border-indigo-100 p-5">
            <div className="hidden sm:flex items-center text-xs text-indigo-850 gap-2 font-semibold">
              <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0" />
              <span>Encrypted transmission. Secure Portal Submission.</span>
            </div>
            <Button
              type="submit"
              className="py-3 px-6 text-xs font-bold inline-flex items-center"
              isLoading={submitting}
            >
              Submit Application Registration
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PublicAdmissionPage;
