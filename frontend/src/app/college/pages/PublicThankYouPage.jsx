import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import Loader from '../../../shared/components/Loader';
import { CheckCircle2, Download, HelpCircle } from 'lucide-react';

const PublicThankYouPage = () => {
  const { schoolId } = useParams();
  const location = useLocation();
  const [collegeInfo, setCollegeInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const { studentName, applicationId } = location.state || {
    studentName: 'Applicant',
    applicationId: 'N/A'
  };

  useEffect(() => {
    const fetchCollegeInfo = async () => {
      try {
        setLoading(true);
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
        const res = await axios.get(`${apiBaseUrl}/auth/public/school/${schoolId}`);
        if (res.data.success) {
          setCollegeInfo(res.data.school);
        }
      } catch (error) {
        console.error('Failed to load college details:', error);
      } finally {
        setLoading(false);
      }
    };
    if (schoolId) {
      fetchCollegeInfo();
    }
  }, [schoolId]);

  if (loading) {
    return <Loader fullPage message="Loading confirmation details..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-left">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl space-y-6 text-center">
        <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-800">Application Submitted!</h2>
          <p className="text-xs text-slate-500 leading-normal">
            Thank you, <span className="font-bold text-slate-700">{studentName}</span>. Your application for admission has been registered successfully.
          </p>
        </div>

        {/* Application ID Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Your Application ID</span>
          <span className="text-lg font-mono font-bold text-indigo-600 tracking-wide mt-1 block">{applicationId}</span>
          <p className="text-[10px] text-slate-400 mt-2">Please keep this ID safe for counseling updates and status lookups.</p>
        </div>

        {/* Custom Brochure download from CMS settings */}
        {collegeInfo?.thankYouCms?.admissionBrochure?.url && (
          <a
            href={collegeInfo.thankYouCms.admissionBrochure.url}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 px-4 bg-slate-150 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all flex items-center justify-center space-x-2"
          >
            <Download className="h-4 w-4 text-slate-550" />
            <span>Download Admission Prospectus</span>
          </a>
        )}

        <div className="pt-2">
          <p className="text-[10px] text-slate-400 font-medium">Managed by {collegeInfo?.name || 'College Admin'}</p>
        </div>
      </div>
    </div>
  );
};

export default PublicThankYouPage;
