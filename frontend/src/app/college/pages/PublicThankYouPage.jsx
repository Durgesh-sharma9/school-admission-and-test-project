import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import Loader from '../../../shared/components/Loader';
import EnquiryBannerPreview from '../../../shared/components/EnquiryBannerPreview';
import { 
  CheckCircle2, 
  Download, 
  Phone, 
  Mail, 
  Globe, 
  MessageSquare,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube
} from 'lucide-react';

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

  // Social icons helper
  const getSocialIcon = (platform) => {
    const name = platform.toLowerCase();
    if (name.includes('facebook')) return <Facebook className="h-5 w-5" />;
    if (name.includes('instagram')) return <Instagram className="h-5 w-5" />;
    if (name.includes('linkedin')) return <Linkedin className="h-5 w-5" />;
    if (name.includes('twitter') || name.includes('x.com')) return <Twitter className="h-5 w-5" />;
    if (name.includes('youtube')) return <Youtube className="h-5 w-5" />;
    return <Globe className="h-5 w-5" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-left">
      <div className="max-w-xl w-full">
        <EnquiryBannerPreview
          logo={collegeInfo.logo}
          name={collegeInfo.name}
          cms={collegeInfo.thankYouCms}
          submissionData={{ studentName, applicationId }}
          type="college"
          isMock={false}
        />
      </div>
    </div>
  );
};

export default PublicThankYouPage;
