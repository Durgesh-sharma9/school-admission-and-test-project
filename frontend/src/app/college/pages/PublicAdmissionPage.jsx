import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Loader from '../../../shared/components/Loader';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import { GraduationCap, HelpCircle, Sparkles } from 'lucide-react';
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
  const [sessions, setSessions] = useState([]);
  
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
    aadhaar: '',
    category: 'General',
    nationality: 'Indian',

    tenthBoard: '',
    tenthPercentage: '',
    tenthYear: '',
    twelfthBoard: '',
    twelfthPercentage: '',
    twelfthYear: '',
    graduationPercentage: '',
    graduationDegree: '',
    graduationYear: '',
    entranceExam: '',
    entranceScore: '',

    departmentId: '',
    courseId: '',
    specialization: '',
    session: '',
    modeOfStudy: 'Regular',
    hostelRequired: false,
    transportRequired: false,
    scholarshipApplied: false,
    referralSource: 'Direct',

    fatherName: '',
    motherName: '',
    parentName: '',
    parentMobile: '',
    parentEmail: '',
    parentOccupation: '',

    state: '',
    city: '',
    pinCode: '',
    address: '',
    area: '',

    docPhoto: '',
    docSign: '',
    docAadhaar: '',
    doc10th: '',
    doc12th: '',
    docMigration: '',
    docTransfer: '',
    docCharacter: '',
    docIncome: '',
    docCaste: '',
    docGrad: '',

    feeAmountPaid: '',
    discountApplied: '',
    scholarshipAmount: '',
    paymentMode: 'Online',
    transactionId: '',
    receiptUrl: ''
  });

  useEffect(() => {
    const fetchCollegeDetails = async () => {
      try {
        setLoading(true);
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
        
        const [infoRes, deptsRes, coursesRes, specsRes, sessionsRes] = await Promise.all([
          axios.get(`${apiBaseUrl}/auth/public/school/${schoolId}`),
          axios.get(`${apiBaseUrl}/college/public/departments/${schoolId}`),
          axios.get(`${apiBaseUrl}/college/public/courses/${schoolId}`),
          axios.get(`${apiBaseUrl}/college/public/specializations/${schoolId}`),
          axios.get(`${apiBaseUrl}/college/public/sessions/${schoolId}`)
        ]);

        if (infoRes.data.success) setCollegeInfo(infoRes.data.school);
        if (deptsRes.data.success) setDepartments(deptsRes.data.data);
        if (coursesRes.data.success) setCourses(coursesRes.data.data);
        if (specsRes.data.success) setSpecializations(specsRes.data.data);
        if (sessionsRes.data.success) {
          setSessions(sessionsRes.data.data);
          if (sessionsRes.data.data?.length > 0) {
            setFormData(prev => ({ ...prev, session: sessionsRes.data.data[0].name }));
          }
        }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.departmentId || !formData.courseId) {
      toast.error('Please select a Department and Course');
      return;
    }

    setSubmitting(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
      
      const payload = {
        ...formData,
        schoolId,
        documents: []
      };

      const docFields = [
        { key: 'docPhoto', label: 'Photo' },
        { key: 'docSign', label: 'Signature' },
        { key: 'docAadhaar', label: 'Aadhaar' },
        { key: 'doc10th', label: '10th Marksheet' },
        { key: 'doc12th', label: '12th Marksheet' },
        { key: 'docMigration', label: 'Migration' },
        { key: 'docTransfer', label: 'Transfer Certificate' },
        { key: 'docCharacter', label: 'Character Certificate' },
        { key: 'docIncome', label: 'Income Certificate' },
        { key: 'docCaste', label: 'Caste Certificate' },
        { key: 'docGrad', label: 'Graduation Marksheet' }
      ];

      docFields.forEach(doc => {
        if (formData[doc.key]) {
          payload.documents.push({ name: doc.label, url: formData[doc.key] });
        }
      });

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
      const msg = error.response?.data?.message || 'Failed to submit college application';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader fullPage message="Loading admission registration form..." />;
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
      <div className="max-w-4xl mx-auto space-y-8 text-left">
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
            <h1 className="text-xl font-bold text-slate-850">{collegeInfo.name}</h1>
            <p className="text-slate-400 text-xs mt-0.5">Public Admission Desk Portal</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
          {/* Section 1: Student Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b pb-1">1. Student Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Student Name"
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
                placeholder="e.g. Amit Sen"
                required
              />
              <Input
                label="DOB"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
                required
              />
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Gender</label>
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
                label="Mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
                required
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. amit@gmail.com"
                required
              />
              <Input
                label="Aadhaar"
                name="aadhaar"
                value={formData.aadhaar}
                onChange={handleChange}
                placeholder="e.g. 1234-5678-9012"
              />
              <Input
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g. General, OBC, SC, ST"
              />
              <Input
                label="Nationality"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                placeholder="e.g. Indian"
              />
            </div>
          </div>

          {/* Section 2: Academic Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b pb-1">2. Academic Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="10th Board"
                name="tenthBoard"
                value={formData.tenthBoard}
                onChange={handleChange}
                placeholder="e.g. CBSE"
                required
              />
              <Input
                label="10th %"
                name="tenthPercentage"
                type="number"
                value={formData.tenthPercentage}
                onChange={handleChange}
                placeholder="e.g. 85.5"
                required
              />
              <Input
                label="10th Year"
                name="tenthYear"
                type="number"
                value={formData.tenthYear}
                onChange={handleChange}
                placeholder="e.g. 2022"
                required
              />
              
              <Input
                label="12th Board"
                name="twelfthBoard"
                value={formData.twelfthBoard}
                onChange={handleChange}
                placeholder="e.g. CBSE"
                required
              />
              <Input
                label="12th %"
                name="twelfthPercentage"
                type="number"
                value={formData.twelfthPercentage}
                onChange={handleChange}
                placeholder="e.g. 88.2"
                required
              />
              <Input
                label="12th Year"
                name="twelfthYear"
                type="number"
                value={formData.twelfthYear}
                onChange={handleChange}
                placeholder="e.g. 2024"
                required
              />

              <Input
                label="Graduation Degree / Percentage (Optional)"
                name="graduationPercentage"
                type="number"
                value={formData.graduationPercentage}
                onChange={handleChange}
                placeholder="e.g. 78.4"
              />
              <Input
                label="Entrance Exam"
                name="entranceExam"
                value={formData.entranceExam}
                onChange={handleChange}
                placeholder="e.g. JEE Main, CAT"
              />
              <Input
                label="Entrance Score"
                name="entranceScore"
                type="number"
                value={formData.entranceScore}
                onChange={handleChange}
                placeholder="e.g. 98.4"
              />
            </div>
          </div>

          {/* Section 3: Course Selection */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b pb-1">3. Course Selection</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Department</label>
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
                <label className="block text-xs font-semibold text-slate-700">Course</label>
                <select
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
                  required
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
                >
                  <option value="">-- Select Specialization --</option>
                  {filteredSpecs.map(s => (
                    <option key={s._id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Session</label>
                <select
                  name="session"
                  value={formData.session}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
                  required
                >
                  <option value="">-- Select Session --</option>
                  {sessions.map(s => (
                    <option key={s._id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Regular / Distance</label>
                <select
                  name="modeOfStudy"
                  value={formData.modeOfStudy}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
                >
                  <option value="Regular">Regular</option>
                  <option value="Distance">Distance</option>
                </select>
              </div>

              <Input
                label="Referral Source"
                name="referralSource"
                value={formData.referralSource}
                onChange={handleChange}
                placeholder="e.g. Google Search, News, Referral"
              />
            </div>

            <div className="flex flex-wrap gap-6 py-2">
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="hostelRequired"
                  checked={formData.hostelRequired}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-650 focus:ring-indigo-500 rounded border-slate-300"
                />
                <span>Hostel Facility Request</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="transportRequired"
                  checked={formData.transportRequired}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-650 focus:ring-indigo-500 rounded border-slate-300"
                />
                <span>Transport Facility Request</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="scholarshipApplied"
                  checked={formData.scholarshipApplied}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-650 focus:ring-indigo-500 rounded border-slate-300"
                />
                <span>Scholarship Request</span>
              </label>
            </div>
          </div>

          {/* Section 4: Parent Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b pb-1">4. Parent Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Father's Name"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
                placeholder="e.g. Ramesh Sen"
              />
              <Input
                label="Mother's Name"
                name="motherName"
                value={formData.motherName}
                onChange={handleChange}
                placeholder="e.g. Sunita Sen"
              />
              <Input
                label="Guardian Name"
                name="parentName"
                value={formData.parentName}
                onChange={handleChange}
                placeholder="e.g. Sunil Sen"
                required
              />
              <Input
                label="Parent Mobile"
                name="parentMobile"
                value={formData.parentMobile}
                onChange={handleChange}
                placeholder="e.g. 9876543211"
                required
              />
              <Input
                label="Parent Email"
                name="parentEmail"
                type="email"
                value={formData.parentEmail}
                onChange={handleChange}
                placeholder="e.g. sunil@gmail.com"
              />
              <Input
                label="Occupation"
                name="parentOccupation"
                value={formData.parentOccupation}
                onChange={handleChange}
                placeholder="e.g. Government Service"
              />
            </div>
          </div>

          {/* Section 5: Address */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b pb-1">5. Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="e.g. Delhi"
              />
              <Input
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. New Delhi"
                required
              />
              <Input
                label="PIN"
                name="pinCode"
                value={formData.pinCode}
                onChange={handleChange}
                placeholder="e.g. 110001"
              />
              <div className="md:col-span-3">
                <Input
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. 123 University Marg, Sector 5"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 6: Documents */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b pb-1">6. Documents (Provide file URLs)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Photo Link" name="docPhoto" value={formData.docPhoto} onChange={handleChange} placeholder="e.g. https://cloud.com/photo.jpg" />
              <Input label="Signature Link" name="docSign" value={formData.docSign} onChange={handleChange} placeholder="e.g. https://cloud.com/sign.jpg" />
              <Input label="Aadhaar Card Link" name="docAadhaar" value={formData.docAadhaar} onChange={handleChange} placeholder="e.g. https://cloud.com/aadhaar.pdf" />
              <Input label="10th Marksheet Link" name="doc10th" value={formData.doc10th} onChange={handleChange} placeholder="e.g. https://cloud.com/10th.pdf" />
              <Input label="12th Marksheet Link" name="doc12th" value={formData.doc12th} onChange={handleChange} placeholder="e.g. https://cloud.com/12th.pdf" />
              <Input label="Migration Certificate Link" name="docMigration" value={formData.docMigration} onChange={handleChange} placeholder="e.g. https://cloud.com/migration.pdf" />
              <Input label="Transfer Certificate Link" name="docTransfer" value={formData.docTransfer} onChange={handleChange} placeholder="e.g. https://cloud.com/transfer.pdf" />
              <Input label="Character Certificate Link" name="docCharacter" value={formData.docCharacter} onChange={handleChange} placeholder="e.g. https://cloud.com/character.pdf" />
              <Input label="Income Certificate Link" name="docIncome" value={formData.docIncome} onChange={handleChange} placeholder="e.g. https://cloud.com/income.pdf" />
              <Input label="Caste Certificate Link" name="docCaste" value={formData.docCaste} onChange={handleChange} placeholder="e.g. https://cloud.com/caste.pdf" />
              <Input label="Graduation Marksheet Link (Optional)" name="docGrad" value={formData.docGrad} onChange={handleChange} placeholder="e.g. https://cloud.com/grad.pdf" />
            </div>
          </div>

          {/* Section 7: Fee Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b pb-1">7. Fee Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Registration Fee Amount"
                name="feeAmountPaid"
                type="number"
                value={formData.feeAmountPaid}
                onChange={handleChange}
                placeholder="e.g. 1000"
              />
              <Input
                label="Discount"
                name="discountApplied"
                type="number"
                value={formData.discountApplied}
                onChange={handleChange}
                placeholder="e.g. 100"
              />
              <Input
                label="Scholarship Amount"
                name="scholarshipAmount"
                type="number"
                value={formData.scholarshipAmount}
                onChange={handleChange}
                placeholder="e.g. 500"
              />
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Payment Mode</label>
                <select
                  name="paymentMode"
                  value={formData.paymentMode}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
                >
                  <option value="Online">Online</option>
                  <option value="Cash">Cash</option>
                  <option value="Demand Draft">Demand Draft</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              <Input
                label="Transaction ID"
                name="transactionId"
                value={formData.transactionId}
                onChange={handleChange}
                placeholder="e.g. TXN12345"
              />
              <Input
                label="Receipt Link"
                name="receiptUrl"
                value={formData.receiptUrl}
                onChange={handleChange}
                placeholder="e.g. https://cloud.com/receipt.pdf"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              className="py-3 px-6 text-sm font-semibold inline-flex items-center"
              isLoading={submitting}
            >
              <Sparkles className="h-4.5 w-4.5 mr-2" />
              Submit Admission Application
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PublicAdmissionPage;
