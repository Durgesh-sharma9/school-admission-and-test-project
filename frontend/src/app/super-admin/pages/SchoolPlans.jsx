import React, { useState, useEffect } from 'react';
import { Plus, Edit, Check, X, Trash2, Award, ShieldCheck, DollarSign } from 'lucide-react';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Modal from '../../../shared/components/Modal';
import superAdminApi from '../services/superAdminApi';
import toast from 'react-hot-toast';

const SchoolPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  
  // Edit Form Fields
  const [planName, setPlanName] = useState('');
  const [price, setPrice] = useState(0);
  const [status, setStatus] = useState('active');
  const [assessmentEnabled, setAssessmentEnabled] = useState(false);
  const [features, setFeatures] = useState([]);
  const [newFeature, setNewFeature] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await superAdminApi.get('/plans?organizationType=school');
      if (response.data.success) {
        setPlans(response.data.plans);
      }
    } catch (error) {
      console.error('Failed to fetch school plans:', error);
      toast.error('Failed to fetch school plans');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setPlanName(plan.planName);
    setPrice(plan.price);
    setStatus(plan.status);
    setAssessmentEnabled(plan.assessmentEnabled);
    setFeatures([...plan.features]);
    setNewFeature('');
    setModalOpen(true);
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!planName) {
      toast.error('Plan Name is required');
      return;
    }
    setSaving(true);
    try {
      const response = await superAdminApi.put(`/plans/${editingPlan._id}`, {
        planName,
        price: Number(price),
        status,
        assessmentEnabled,
        features
      });
      if (response.data.success) {
        toast.success('Plan updated successfully!');
        setModalOpen(false);
        fetchPlans();
      }
    } catch (error) {
      console.error('Failed to update plan:', error);
      toast.error(error.response?.data?.message || 'Failed to update plan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 font-semibold text-slate-600">Loading School Plans...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto text-left pb-12">
      {/* Page Header */}
      <div className="mb-6 mt-2">
        <h1 className="text-[24px] font-bold text-slate-800 tracking-tight leading-[1.2]">School CRM Subscription Plans</h1>
        <p className="text-slate-500 text-[15px] font-medium mt-1">
          Configure prices, statuses, and features for School Basic and School Premium subscriptions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((plan) => (
          <div 
            key={plan._id} 
            className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)] transition-all flex flex-col justify-between"
          >
            {/* Card Header Gradient */}
            <div className={`p-6 bg-gradient-to-r ${plan.planCode === 'school-premium' ? 'from-[#E91E63] to-[#F43F7A]' : 'from-slate-700 to-slate-900'} text-white`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                    {plan.planCode === 'school-premium' ? 'Premium' : 'Basic'}
                  </span>
                  <h3 className="text-xl font-extrabold mt-1">{plan.planName}</h3>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black">₹{plan.price}</p>
                  <p className="text-[10px] opacity-80 uppercase font-bold">Per Year</p>
                </div>
              </div>
            </div>

            {/* Features list */}
            <div className="p-6 space-y-6 flex-1 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase">Assessment Status</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  plan.assessmentEnabled 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {plan.assessmentEnabled ? '✓ Enabled' : '✗ Disabled'}
                </span>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase block">Included Features ({plan.features.length})</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {plan.features.map((feat, index) => (
                    <div key={index} className="flex items-center space-x-2 text-slate-600 text-xs">
                      <span className="text-emerald-500 font-extrabold font-sans">✓</span>
                      <span className="font-medium truncate" title={feat}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                plan.status === 'active' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {plan.status === 'active' ? 'Active' : 'Disabled'}
              </span>

              <Button 
                variant="outline"
                size="sm"
                onClick={() => handleEdit(plan)}
                className="flex items-center gap-1.5 bg-white shadow-xs"
              >
                <Edit className="h-3.5 w-3.5" /> Edit Configuration
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit configuration modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Edit Plan: ${editingPlan?.planName}`}
        >
          <form onSubmit={handleSave} className="space-y-6 text-left">
            <Input
              label="Plan Name"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              required
            />

            <Input
              label="Yearly Price (₹)"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase">Plan Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/15 transition-all cursor-pointer"
              >
                <option value="active">Active (Visible to Admins)</option>
                <option value="inactive">Inactive (Hidden from Admins)</option>
              </select>
            </div>

            <div className="flex items-center space-x-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <input
                type="checkbox"
                id="assessmentEnabled"
                checked={assessmentEnabled}
                onChange={(e) => setAssessmentEnabled(e.target.checked)}
                className="rounded-md text-indigo-600 border-[#F2C8DA] bg-white h-4.5 w-4.5 cursor-pointer"
              />
              <div>
                <label htmlFor="assessmentEnabled" className="text-xs font-bold text-slate-800 cursor-pointer uppercase block">
                  Enable Assessment Module
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Allows creation of Question Banks, Tests and Student Assessments.</span>
              </div>
            </div>

            {/* Features Editor */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase">Configure Features</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add custom feature description... e.g. 5GB Cloud Storage"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/15"
                />
                <Button type="button" onClick={handleAddFeature} className="px-4 py-2 text-xs">
                  Add
                </Button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-100 rounded-xl p-3 bg-slate-50/20">
                {features.length === 0 ? (
                  <p className="text-[10px] text-slate-400 font-semibold text-center py-4">No features listed. Add some above.</p>
                ) : (
                  features.map((feat, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-100 text-xs font-medium text-slate-700">
                      <span>{feat}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={saving}>
                Save Configuration
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SchoolPlans;
