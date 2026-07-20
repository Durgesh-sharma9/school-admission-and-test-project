import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Loader from '../../../shared/components/Loader';
import AdmissionForm from '../components/AdmissionForm';
import { School, HelpCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const PublicAdmissionPage = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Check if receptionist mode
  const isReception = searchParams.get('role') === 'reception';

  useEffect(() => {
    const fetchSchoolInfo = async () => {
      try {
        setLoading(true);
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
        const res = await axios.get(`${apiBaseUrl}/auth/public/school/${schoolId}`);
        if (res.data.success) {
          setSchoolInfo(res.data.school);
        }
      } catch (error) {
        console.error('Failed to fetch school details:', error);
        toast.error('Unable to verify school code');
      } finally {
        setLoading(false);
      }
    };

    if (schoolId) {
      fetchSchoolInfo();
    }
  }, [schoolId]);

  const handlePublicSubmit = async (formData, resetForm) => {
    setSubmitting(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
      const res = await axios.post(`${apiBaseUrl}/enquiries/public/${schoolId}`, formData);
      if (res.data.success) {
        // Form submitted successfully. Navigate to custom Thank You screen
        toast.success('Registration submitted successfully!');
        resetForm();
        
        // Pass info in state to display on Thank You Page
        navigate(`/public/thankyou/${schoolId}${isReception ? '?role=reception' : ''}`, {
          state: {
            studentName: res.data.data.studentName,
            parentName: res.data.data.parentName,
            enquiryId: res.data.data.enquiryId,
          },
        });
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to submit admission enquiry';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader fullPage message="Loading admission registration form..." />;
  }

  if (!schoolInfo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white rounded-2xl p-8 border border-slate-100 shadow-sm space-y-4">
          <div className="h-12 w-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Invalid Admission Code</h2>
          <p className="text-xs text-slate-400 leading-normal">
            The school admission link you are trying to access does not match any registered school. Please verify the URL or contact the school administration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 bg-gradient-to-tr from-indigo-50/20 via-slate-50 to-indigo-50/10 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* School Header Banner */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          {schoolInfo?.logo ? (
            <img
              src={schoolInfo.logo}
              alt={schoolInfo.name || 'School'}
              className="h-16 w-16 rounded-xl object-cover border border-slate-100"
            />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-2xl">
              {(schoolInfo?.name || 'S').charAt(0).toUpperCase()}
            </div>
          )}
          
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800 leading-tight">
              {schoolInfo?.name || 'School Portal'}
            </h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                Official Admission Portal
              </span>
              {isReception && (
                <span className="inline-flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                  Reception Desk Mode
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Informational intro */}
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Student Admission Enquiry
          </h1>
          <p className="text-xs text-slate-400 leading-normal">
            Please fill in the details below. Our admissions team will review your application and get in touch with you shortly.
          </p>
        </div>

        {/* Admission Form */}
        <AdmissionForm
          onSubmit={handlePublicSubmit}
          isLoading={submitting}
          isPublic={true}
          schoolName={schoolInfo?.name || ''}
        />
      </div>
    </div>
  );
};

export default PublicAdmissionPage;
