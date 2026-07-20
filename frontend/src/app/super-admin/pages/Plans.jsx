import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building2, Check, X } from 'lucide-react';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Modal from '../../../shared/components/Modal';

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    monthlyPrice: '',
    yearlyPrice: '',
    trialDays: '7',
    description: '',
    features: '',
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      // Mock data for now - will be replaced with actual API call
      setPlans([
        {
          _id: '1',
          name: 'Starter',
          monthlyPrice: 29,
          yearlyPrice: 290,
          trialDays: 7,
          description: 'Perfect for small schools',
          features: ['Up to 100 students', 'Basic assessments', 'Email support'],
          isActive: true,
        },
        {
          _id: '2',
          name: 'Professional',
          monthlyPrice: 79,
          yearlyPrice: 790,
          trialDays: 14,
          description: 'For growing schools',
          features: ['Up to 500 students', 'Advanced assessments', 'Priority support', 'Custom branding'],
          isActive: true,
        },
        {
          _id: '3',
          name: 'Enterprise',
          monthlyPrice: 199,
          yearlyPrice: 1990,
          trialDays: 30,
          description: 'For large institutions',
          features: ['Unlimited students', 'All features', '24/7 support', 'Dedicated account manager'],
          isActive: true,
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      monthlyPrice: '',
      yearlyPrice: '',
      trialDays: '7',
      description: '',
      features: '',
    });
    setModalOpen(true);
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      trialDays: plan.trialDays,
      description: plan.description,
      features: plan.features.join(', '),
    });
    setModalOpen(true);
  };

  const handleDelete = async (planId) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        // await superAdminApi.delete(`/plans/${planId}`);
        setPlans(plans.filter(p => p._id !== planId));
      } catch (error) {
        console.error('Failed to delete plan:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const planData = {
        ...formData,
        monthlyPrice: parseFloat(formData.monthlyPrice),
        yearlyPrice: parseFloat(formData.yearlyPrice),
        trialDays: parseInt(formData.trialDays),
        features: formData.features.split(',').map(f => f.trim()).filter(f => f),
      };

      if (editingPlan) {
        // Update existing plan
        setPlans(plans.map(p => p._id === editingPlan._id ? { ...p, ...planData } : p));
      } else {
        // Create new plan
        setPlans([...plans, { ...planData, _id: Date.now().toString(), isActive: true }]);
      }

      setModalOpen(false);
    } catch (error) {
      console.error('Failed to save plan:', error);
    }
  };

  const handleToggleActive = async (planId) => {
    try {
      setPlans(plans.map(p => p._id === planId ? { ...p, isActive: !p.isActive } : p));
    } catch (error) {
      console.error('Failed to toggle plan status:', error);
    }
  };

  const getSchoolsCount = (planId) => {
    // Mock data - will be replaced with actual count from backend
    const counts = { '1': 45, '2': 32, '3': 12 };
    return counts[planId] || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Plans</h1>
          <p className="text-slate-400">Manage subscription plans</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Plan
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan._id} className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-sm text-slate-400">{plan.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(plan)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(plan._id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-white">${plan.monthlyPrice}</span>
                <span className="text-slate-400">/month</span>
              </div>
              <div className="text-sm text-slate-400">
                ${plan.yearlyPrice}/year (save {Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)}%)
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase">Features</p>
              <ul className="space-y-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="text-sm text-slate-300 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Building2 className="w-4 h-4" />
                <span>{getSchoolsCount(plan._id)} schools</span>
              </div>
              <button
                onClick={() => handleToggleActive(plan._id)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  plan.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}
              >
                {plan.isActive ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingPlan ? 'Edit Plan' : 'Create Plan'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Plan Name"
              name="name"
              type="text"
              placeholder="e.g. Professional"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Monthly Price ($)"
                name="monthlyPrice"
                type="number"
                placeholder="79"
                required
                value={formData.monthlyPrice}
                onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
              />
              <Input
                label="Yearly Price ($)"
                name="yearlyPrice"
                type="number"
                placeholder="790"
                required
                value={formData.yearlyPrice}
                onChange={(e) => setFormData({ ...formData, yearlyPrice: e.target.value })}
              />
            </div>

            <Input
              label="Trial Days"
              name="trialDays"
              type="number"
              placeholder="7"
              value={formData.trialDays}
              onChange={(e) => setFormData({ ...formData, trialDays: e.target.value })}
            />

            <Input
              label="Description"
              name="description"
              type="text"
              placeholder="For growing schools"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase mb-1">
                Features (comma separated)
              </label>
              <textarea
                name="features"
                placeholder="Up to 500 students, Advanced assessments, Priority support"
                rows={3}
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Plans;
