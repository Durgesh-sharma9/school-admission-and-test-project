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
    <div className="space-y-6">
      {/* Back button header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/enquiries"
          className="p-2 bg-white border border-slate-100 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition-colors shadow-xs"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Manual Enquiry Entry</h2>
          <p className="text-slate-500 text-sm mt-0.5">
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
