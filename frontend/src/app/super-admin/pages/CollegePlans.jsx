import React, { useState, useEffect } from 'react';
import { Edit, Check, X, Trash2, Settings, RefreshCw, Plus, Building2 } from 'lucide-react';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Modal from '../../../shared/components/Modal';
import superAdminApi from '../services/superAdminApi';
import toast from 'react-hot-toast';

// ─── Plan Card ────────────────────────────────────────────────────────────────
const PlanCard = ({ plan, onEdit }) => (
  <div className="bg-white rounded-2xl flex flex-col overflow-hidden border-2 border-[#8B5CF6] shadow-[0_8px_32px_rgba(139,92,246,0.12)] hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(139,92,246,0.16)] transition-all duration-250">

    {/* Card Header */}
    <div className="p-5 border-b border-[#E8ECF3]">
      <div className="flex items-start justify-between">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border bg-purple-50 text-[#8B5CF6] border-purple-100">
            College Premium
          </span>
          <h3 className="text-lg font-extrabold text-slate-800 mt-1.5">{plan.planName}</h3>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-[#8B5CF6]">₹{plan.price?.toLocaleString('en-IN')}</span>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Per Year</p>
        </div>
      </div>
    </div>

    {/* Features */}
    <div className="p-5 flex-1">
      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
        Features ({plan.features.length})
      </p>
      <div className="space-y-2">
        {plan.features.map((feat, idx) => (
          <div key={idx} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
            <div className="h-5 w-5 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center shrink-0">
              <Check className="h-3 w-3 text-[#8B5CF6]" />
            </div>
            {feat}
          </div>
        ))}
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

// ─── Main Component ────────────────────────────────────────────────────────────
const CollegePlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [planName, setPlanName] = useState('');
  const [price, setPrice] = useState(0);
  const [status, setStatus] = useState('active');
  const [features, setFeatures] = useState([]);
  const [newFeature, setNewFeature] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await superAdminApi.get('/plans?organizationType=college');
      if (response.data.success) {
        setPlans(response.data.plans);
      }
    } catch (error) {
      console.error('Failed to fetch college plans:', error);
      toast.error('Failed to fetch college plans');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setPlanName(plan.planName);
    setPrice(plan.price);
    setStatus(plan.status);
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
        planName, price: Number(price), status, features
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
        <div className="h-9 w-9 border-[3px] border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Loading College Plans...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full mb-1.5">
            <Settings className="h-3 w-3" /> Plan Configuration
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">College CRM Plans</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Configure prices, features, and statuses for College subscriptions.
          </p>
        </div>
        <button
          onClick={fetchPlans}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs hover:bg-slate-700 hover:text-white transition shadow-md"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* ── Plan Cards ────────────────────────────────────────────────────── */}
      <div className="space-y-6">
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
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/10 transition-all cursor-pointer"
              >
                <option value="active">Active (Visible to Admins)</option>
                <option value="inactive">Inactive (Hidden from Admins)</option>
              </select>
            </div>

            {/* Features Editor */}
            <div className="space-y-3">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                Plan Features ({features.length})
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a feature, e.g. 10GB Cloud Storage"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={handleFeatureKeyDown}
                  className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/10 transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-100 rounded-xl p-2.5 bg-slate-50">
                {features.length === 0 ? (
                  <p className="text-[10px] text-slate-400 font-semibold text-center py-4">No features added yet.</p>
                ) : (
                  features.map((feat, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-100 text-xs font-medium text-slate-700">
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-[#8B5CF6] shrink-0" />
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

export default CollegePlans;
