import React, { useState, useEffect } from 'react';
import { Edit, Check, X, Trash2, Award, Settings, ClipboardCheck, RefreshCw, Plus } from 'lucide-react';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Modal from '../../../shared/components/Modal';
import superAdminApi from '../services/superAdminApi';
import toast from 'react-hot-toast';

// ─── Plan Card ────────────────────────────────────────────────────────────────
const PlanCard = ({ plan, onEdit }) => {
  const isPremium = plan.planCode === 'school-premium';

  return (
    <div className={`relative bg-white rounded-2xl flex flex-col overflow-hidden transition-all duration-250 hover:-translate-y-1 ${
      isPremium
        ? 'border-2 border-[#E91E63] shadow-[0_8px_32px_rgba(233,30,99,0.12)] hover:shadow-[0_16px_40px_rgba(233,30,99,0.16)]'
        : 'border border-[#E8ECF3] shadow-[0_4px_20px_rgba(15,23,42,0.06)] hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
    }`}>

      {/* Card Header */}
      <div className="p-5 border-b border-[#E8ECF3]">
        <div className="flex items-start justify-between">
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
              isPremium
                ? 'bg-pink-50 text-[#E91E63] border-pink-100'
                : 'bg-blue-50 text-blue-600 border-blue-100'
            }`}>
              {isPremium ? 'Premium' : 'Basic'}
            </span>
            <h3 className="text-lg font-extrabold text-slate-800 mt-1.5">{plan.planName}</h3>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-black ${isPremium ? 'text-[#E91E63]' : 'text-slate-700'}`}>
              ₹{plan.price?.toLocaleString('en-IN')}
            </span>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Per Year</p>
          </div>
        </div>
      </div>

      {/* Features + Meta */}
      <div className="p-5 flex-1 space-y-4">
        {/* Assessment Status */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Assessment Module</span>
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
            plan.assessmentEnabled
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : 'bg-rose-50 text-rose-600 border-rose-100'
          }`}>
            {plan.assessmentEnabled ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
            {plan.assessmentEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {/* Features */}
        <div>
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2.5">
            Features ({plan.features.length})
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {plan.features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                <div className="h-4 w-4 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 text-emerald-500" />
                </div>
                <span className="truncate">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-5 flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
          plan.status === 'active'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-slate-100 text-slate-500 border-slate-200'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${plan.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {plan.status === 'active' ? 'Active' : 'Inactive'}
        </span>

        <button
          onClick={() => onEdit(plan)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-[11px] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs hover:shadow-sm"
        >
          <Edit className="h-3.5 w-3.5" /> Edit Config
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const SchoolPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

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

  const handleFeatureKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); }
  };

  const handleRemoveFeature = (index) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!planName) { toast.error('Plan Name is required'); return; }
    setSaving(true);
    try {
      const response = await superAdminApi.put(`/plans/${editingPlan._id}`, {
        planName, price: Number(price), status, assessmentEnabled, features
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="h-9 w-9 border-[3px] border-[#E91E63] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Loading School Plans...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 bg-pink-50 border border-pink-100 text-[#E91E63] text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full mb-2">
            <Settings className="h-3 w-3" /> Plan Configuration
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">School CRM Plans</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Configure prices, features, and statuses for School subscriptions.
          </p>
        </div>
        <button
          onClick={fetchPlans}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* ── Plan Cards Grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
        {plans.map((plan) => (
          <PlanCard key={plan._id} plan={plan} onEdit={handleEdit} />
        ))}
      </div>

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Edit Plan: ${editingPlan?.planName}`}
        >
          <form onSubmit={handleSave} className="space-y-5 text-left">

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

            {/* Status */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">Plan Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#E91E63] focus:ring-4 focus:ring-[#E91E63]/10 transition-all cursor-pointer"
              >
                <option value="active">Active (Visible to Admins)</option>
                <option value="inactive">Inactive (Hidden from Admins)</option>
              </select>
            </div>

            {/* Assessment Toggle */}
            <div
              onClick={() => setAssessmentEnabled(!assessmentEnabled)}
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                assessmentEnabled
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className={`h-5 w-9 rounded-full flex items-center px-0.5 transition-all ${assessmentEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'}`}>
                <div className="h-4 w-4 rounded-full bg-white shadow-sm" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Assessment Module</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  {assessmentEnabled ? 'Assessment module is enabled for this plan.' : 'Assessment module is disabled. Click to enable.'}
                </p>
              </div>
            </div>

            {/* Features Editor */}
            <div className="space-y-3">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                Plan Features ({features.length})
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a feature, e.g. 5GB Cloud Storage"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={handleFeatureKeyDown}
                  className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#E91E63] focus:ring-4 focus:ring-[#E91E63]/10 transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-4 py-2.5 rounded-xl bg-[#E91E63] hover:bg-[#D81B60] text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-100 rounded-xl p-2.5 bg-slate-50">
                {features.length === 0 ? (
                  <p className="text-[10px] text-slate-400 font-semibold text-center py-4">No features added yet.</p>
                ) : (
                  features.map((feat, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-100 text-xs font-medium text-slate-700 group">
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" isLoading={saving}>Save Configuration</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SchoolPlans;
