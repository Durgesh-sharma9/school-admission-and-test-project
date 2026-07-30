import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/schoolApi';
import toast from 'react-hot-toast';
import AdmissionForm from '../components/AdmissionForm';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdmissionFormPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleManualSubmit = async (formData, resetForm) => {
    setLoading(true);
    try {
      const response = await api.post('/enquiries', formData);
      if (response.success) {
        toast.success(`Enquiry saved! ID: ${response.data.enquiryId}`);
        resetForm(); // Clear form fields
        navigate('/enquiries'); // Return to list view
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save enquiry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto text-left">
      {/* Back button header */}
      <div className="flex items-center space-x-4 mb-5 mt-2">
        <Link
          to="/enquiries"
          className="h-10 w-10 flex items-center justify-center bg-white border border-[#E8ECF3] hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition-all duration-200 shadow-[0_3px_10px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 cursor-pointer"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Link>
        <div>
          <h1 className="text-[24px] font-bold text-[#1F2937] tracking-tight leading-[1.2]">Manual Enquiry Entry</h1>
          <p className="text-[#64748B] text-[15px] font-medium mt-1.5">
            Manually register walk-in parent enquiries or reception logs into the CRM database.
          </p>
        </div>
      </div>

      {/* Render shared form */}
      <div className="pt-2">
        <AdmissionForm
          onSubmit={handleManualSubmit}
          isLoading={loading}
          isPublic={false}
        />
      </div>
    </div>
  );
};

export default AdmissionFormPage;
