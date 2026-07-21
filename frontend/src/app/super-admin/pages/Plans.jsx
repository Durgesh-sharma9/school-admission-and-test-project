import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building2, Check, X, Copy, Eye, Archive, TrendingUp, Users, DollarSign, Calendar, Search, Filter, MoreVertical } from 'lucide-react';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Modal from '../../../shared/components/Modal';
import superAdminApi from '../services/superAdminApi';

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create'); // create, edit, preview
  const [editingPlan, setEditingPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly'); // monthly, yearly
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [previewPlan, setPreviewPlan] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await superAdminApi.get('/plans');
      if (response.success) {
        setPlans(response.plans);
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setModalType('create');
    setModalOpen(true);
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setModalType('edit');
    setModalOpen(true);
  };

  const handlePreview = (plan) => {
    setPreviewPlan(plan);
    setModalType('preview');
    setModalOpen(true);
  };

  const handleDuplicate = async (plan) => {
    try {
      const response = await superAdminApi.post(`/plans/${plan._id}/duplicate`);
      if (response.success) {
        fetchPlans();
      }
    } catch (error) {
      console.error('Failed to duplicate plan:', error);
    }
  };

  const handleArchive = async (plan) => {
    if (window.confirm(`Are you sure you want to archive ${plan.name}?`)) {
      try {
        const response = await superAdminApi.patch(`/plans/${plan._id}/archive`);
        if (response.success) {
          fetchPlans();
        }
      } catch (error) {
        console.error('Failed to archive plan:', error);
      }
    }
  };

  const handleDelete = async (planId) => {
    if (window.confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      try {
        await superAdminApi.delete(`/plans/${planId}`);
        fetchPlans();
      } catch (error) {
        console.error('Failed to delete plan:', error);
      }
    }
  };

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plan.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getBadgeColor = (badge) => {
    const colors = {
      basic: 'bg-slate-500',
      popular: 'bg-indigo-500',
      premium: 'bg-purple-500',
      enterprise: 'bg-amber-500',
      none: 'bg-slate-600',
    };
    return colors[badge] || 'bg-slate-600';
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-500/10 text-green-400',
      draft: 'bg-yellow-500/10 text-yellow-400',
      hidden: 'bg-slate-500/10 text-slate-400',
      archived: 'bg-red-500/10 text-red-400',
    };
    return colors[status] || 'bg-slate-500/10 text-slate-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Plan Management</h1>
          <p className="text-slate-400">Create and manage subscription plans</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2 hover:scale-105 transition-transform">
          <Plus className="w-4 h-4" />
          Create Plan
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Total Plans</p>
                <p className="text-2xl font-bold text-white">{stats.totalPlans}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Active Plans</p>
                <p className="text-2xl font-bold text-white">{stats.activePlans}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Monthly Revenue</p>
                <p className="text-2xl font-bold text-white">${stats.monthlyRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Active Schools</p>
                <p className="text-2xl font-bold text-white">{stats.activeSchools}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="hidden">Hidden</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map((plan) => (
          <div key={plan._id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors">
            {/* Plan Header */}
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {plan.badge !== 'none' && (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getBadgeColor(plan.badge)}`}>
                      {plan.badge}
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                    {plan.status}
                  </span>
                </div>
                <div className="relative">
                  <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
              <p className="text-sm text-slate-400">{plan.description}</p>
            </div>

            {/* Pricing */}
            <div className="p-6 border-b border-slate-700 bg-slate-800/50">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                </span>
                <span className="text-slate-400">/{billingCycle}</span>
              </div>
              {plan.discount > 0 && billingCycle === 'yearly' && (
                <div className="text-sm text-green-400 mt-1">
                  Save {plan.discount}% on yearly
                </div>
              )}
              <div className="text-xs text-slate-400 mt-2">
                {plan.trialDays} days trial included
              </div>
            </div>

            {/* Features Preview */}
            <div className="p-6 border-b border-slate-700">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Key Features</p>
              <div className="space-y-2">
                {plan.featuresList?.slice(0, 4).map((feature, idx) => (
                  <div key={idx} className="text-sm text-slate-300 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="line-clamp-1">{feature}</span>
                  </div>
                ))}
                {plan.featuresList?.length > 4 && (
                  <div className="text-xs text-slate-400">
                    +{plan.featuresList.length - 4} more features
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 flex items-center justify-between bg-slate-800/30">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Building2 className="w-4 h-4" />
                <span>{plan.schoolsCount || 0} schools</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePreview(plan)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(plan)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDuplicate(plan)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleArchive(plan)}
                  className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded-lg"
                  title="Archive"
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(plan._id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPlans.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No plans found</h3>
          <p className="text-slate-400 mb-4">Create your first plan to get started</p>
          <Button onClick={handleCreate}>Create Plan</Button>
        </div>
      )}

      {/* Plan Modal */}
      {modalOpen && (
        <PlanModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          type={modalType}
          plan={editingPlan || previewPlan}
          onSave={fetchPlans}
        />
      )}
    </div>
  );
};

// Plan Modal Component
const PlanModal = ({ isOpen, onClose, type, plan, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    planType: 'standard',
    badge: 'none',
    icon: 'package',
    colorTheme: '#4f46e5',
    monthlyPrice: 0,
    yearlyPrice: 0,
    lifetimePrice: 0,
    discount: 0,
    gst: 18,
    trialDays: 7,
    currency: 'INR',
    capacity: {
      maxStudents: 100,
      maxTeachers: 10,
      maxAdmins: 2,
      maxStorage: 5,
      apiRateLimit: 100,
    },
    notifications: {
      whatsappLimit: 1000,
      emailLimit: 5000,
      smsLimit: 500,
      aiCredits: 100,
    },
    features: {
      admission: { enabled: true, dailyTest: false },
      parentPortal: { enabled: false, notebookAnalysis: false, resultManagement: false },
      attendance: { enabled: true, biometric: false },
      assessment: { enabled: true, aiGrading: false, questionBank: false },
      reports: { enabled: true, unlimitedReports: false, customReports: false },
      communication: { whatsapp: false, sms: false, email: true },
      branding: { customDomain: false, whiteLabel: false, customEmail: false },
      ai: { assistant: false, insights: false, predictions: false },
      integrations: { apiAccess: false, webhooks: false, zapier: false },
      qr: { enabled: true, customBranding: false, analytics: false },
      website: { cms: false, landingPage: false, blog: false },
    },
    support: {
      prioritySupport: false,
      dedicatedManager: false,
      liveChat: false,
      sla: 'standard',
    },
    analytics: {
      advancedAnalytics: false,
      customDashboards: false,
      exportData: true,
    },
    featuresList: [],
    highlightFeatures: [],
    status: 'active',
    isPopular: false,
    isEnterpriseOnly: false,
    sortOrder: 0,
  });

  useEffect(() => {
    if (plan && (type === 'edit' || type === 'preview')) {
      setFormData(plan);
    }
  }, [plan, type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const api = type === 'edit' 
        ? superAdminApi.put(`/plans/${plan._id}`, formData)
        : superAdminApi.post('/plans', formData);
      
      if (api.success) {
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Failed to save plan:', error);
    } finally {
      setLoading(false);
    }
  };

  if (type === 'preview') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Plan Preview" size="lg">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-slate-800">{formData.name}</h3>
              <p className="text-slate-500">{formData.description}</p>
            </div>
            <div className="text-center mb-6">
              <span className="text-4xl font-bold text-indigo-600">
                ${formData.monthlyPrice}
              </span>
              <span className="text-slate-500">/month</span>
            </div>
            <ul className="space-y-3 mb-6">
              {formData.featuresList?.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-slate-700">
                  <Check className="w-5 h-5 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button className="w-full">Get Started</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={type === 'edit' ? 'Edit Plan' : 'Create Plan'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* General Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">General Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Plan Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <select
              value={formData.planType}
              onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-4">
            <select
              value={formData.badge}
              onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              <option value="none">No Badge</option>
              <option value="basic">Basic</option>
              <option value="popular">Popular</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <Input
              label="Color Theme"
              type="color"
              value={formData.colorTheme}
              onChange={(e) => setFormData({ ...formData, colorTheme: e.target.value })}
            />
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="hidden">Hidden</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Billing Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Billing</h3>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Monthly Price"
              type="number"
              value={formData.monthlyPrice}
              onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) })}
              required
            />
            <Input
              label="Yearly Price"
              type="number"
              value={formData.yearlyPrice}
              onChange={(e) => setFormData({ ...formData, yearlyPrice: parseFloat(e.target.value) })}
              required
            />
            <Input
              label="Discount (%)"
              type="number"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) })}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="GST (%)"
              type="number"
              value={formData.gst}
              onChange={(e) => setFormData({ ...formData, gst: parseFloat(e.target.value) })}
            />
            <Input
              label="Trial Days"
              type="number"
              value={formData.trialDays}
              onChange={(e) => setFormData({ ...formData, trialDays: parseInt(e.target.value) })}
            />
            <Input
              label="Currency"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            />
          </div>
        </div>

        {/* Capacity Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Capacity Limits</h3>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Max Students"
              type="number"
              value={formData.capacity.maxStudents}
              onChange={(e) => setFormData({ ...formData, capacity: { ...formData.capacity, maxStudents: parseInt(e.target.value) } })}
            />
            <Input
              label="Max Teachers"
              type="number"
              value={formData.capacity.maxTeachers}
              onChange={(e) => setFormData({ ...formData, capacity: { ...formData.capacity, maxTeachers: parseInt(e.target.value) } })}
            />
            <Input
              label="Max Admins"
              type="number"
              value={formData.capacity.maxAdmins}
              onChange={(e) => setFormData({ ...formData, capacity: { ...formData.capacity, maxAdmins: parseInt(e.target.value) } })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Storage (GB)"
              type="number"
              value={formData.capacity.maxStorage}
              onChange={(e) => setFormData({ ...formData, capacity: { ...formData.capacity, maxStorage: parseInt(e.target.value) } })}
            />
            <Input
              label="API Rate Limit (req/min)"
              type="number"
              value={formData.capacity.apiRateLimit}
              onChange={(e) => setFormData({ ...formData, capacity: { ...formData.capacity, apiRateLimit: parseInt(e.target.value) } })}
            />
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Features List</h3>
          <textarea
            value={formData.featuresList?.join('\n')}
            onChange={(e) => setFormData({ ...formData, featuresList: e.target.value.split('\n').filter(f => f.trim()) })}
            placeholder="Enter features (one per line)"
            rows={5}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : type === 'edit' ? 'Update Plan' : 'Create Plan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default Plans;
