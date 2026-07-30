import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  Check, X, ArrowRight, TrendingUp, Users, Database, Mail, 
  MessageSquare, Zap, CreditCard, Calendar, AlertCircle, 
  ChevronRight, Star, Crown, Gem 
} from 'lucide-react';
import Button from '../../../shared/components/Button';
import schoolApi from '../services/schoolApi';

const Subscription = () => {
  const { school } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await schoolApi.get('/subscription/plans', { params: { billingCycle } });
      if (response.success) {
        setPlans(response.plans);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const response = await schoolApi.get('/subscription/current');
      if (response.success) {
        setCurrentPlan(response.plan);
        // Update usage data
        if (response.usage) {
          setUsageData(response.usage);
        }
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  };

  const [usageData, setUsageData] = useState({
    students: { used: 0, limit: 100 },
    teachers: { used: 0, limit: 10 },
    storage: { used: 0, limit: 5 },
    emails: { used: 0, limit: 5000 },
    whatsapp: { used: 0, limit: 1000 },
    aiCredits: { used: 0, limit: 100 },
  });

  const getPlanIcon = (planType) => {
    const icons = {
      basic: <Gem className="w-6 h-6" />,
      standard: <Star className="w-6 h-6" />,
      premium: <Crown className="w-6 h-6" />,
      enterprise: <Crown className="w-6 h-6" />,
    };
    return icons[planType] || <Star className="w-6 h-6" />;
  };

  const getPlanColor = (planType) => {
    const colors = {
      basic: 'from-[#64748B] to-[#94A3B8]',
      standard: 'from-[#8B5CF6] to-[#A78BFA]',
      premium: 'from-[#E91E63] to-[#F43F7A]',
      enterprise: 'from-[#F59E0B] to-[#FBBF24]',
    };
    return colors[planType] || 'from-[#64748B] to-[#94A3B8]';
  };

  const handleUpgrade = async (plan) => {
    try {
      const response = await schoolApi.post('/subscription/change-plan', {
        planId: plan._id,
        billingCycle,
      });
      if (response.success) {
        toast.success(response.message);
        fetchCurrentSubscription();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to upgrade plan');
    }
  };

  const handleDowngrade = async (plan) => {
    try {
      const response = await schoolApi.post('/subscription/change-plan', {
        planId: plan._id,
        billingCycle,
      });
      if (response.success) {
        toast.success(response.message);
        fetchCurrentSubscription();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to downgrade plan');
    }
  };

  const handleRenew = async () => {
    try {
      const response = await schoolApi.post('/subscription/renew', { billingCycle });
      if (response.success) {
        toast.success(response.message);
        fetchCurrentSubscription();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to renew subscription');
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing cycle.')) {
      try {
        const response = await schoolApi.post('/subscription/cancel');
        if (response.success) {
          toast.success(response.message);
          fetchCurrentSubscription();
        }
      } catch (error) {
        toast.error(error.message || 'Failed to cancel subscription');
      }
    }
  };

  const getUsagePercentage = (used, limit) => {
    if (!limit || limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const calculateDaysLeft = () => {
    if (!school?.subscription?.trialEnd) return 0;
    const trialEnd = new Date(school.subscription.trialEnd);
    const now = new Date();
    const diff = trialEnd - now;
    return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
  };

  const daysLeft = calculateDaysLeft();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto text-left relative pb-12">
      {/* Header */}
      <div className="mb-5 mt-2">
        <h1 className="text-[24px] font-bold text-[#1F2937] tracking-tight leading-[1.2]">Subscription</h1>
        <p className="text-[#64748B] text-[15px] font-medium mt-1.5">Manage your subscription and plan</p>
      </div>

      {/* Current Subscription Card */}
      <div className="bg-gradient-to-r from-[#E91E63] to-[#8B5CF6] rounded-[18px] p-6 text-white hover:shadow-xl hover:shadow-[#E91E63]/10 transition-all duration-300">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                {school?.subscription?.status === 'active' ? 'Active' : 'Trial'}
              </span>
              {daysLeft > 0 && (
                <span className="px-3 py-1 bg-white/10 rounded-full text-sm">
                  {daysLeft} days left
                </span>
              )}
            </div>
            <h2 className="text-3xl font-bold mb-1">
              {currentPlan?.name || 'Free Trial'}
            </h2>
            <p className="text-white/80 mb-4">
              {currentPlan?.description || 'Explore all features with our free trial'}
            </p>
            <div className="flex items-center gap-6 text-sm mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Renews: {school?.subscription?.renewalDate 
                  ? new Date(school.subscription.renewalDate).toLocaleDateString()
                  : school?.subscription?.trialEnd 
                  ? new Date(school.subscription.trialEnd).toLocaleDateString()
                  : 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>{billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} billing</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-0 hover:scale-105 transition-transform"
                onClick={handleRenew}
              >
                Renew
              </Button>
              {school?.subscription?.plan !== 'free-trial' && (
                <Button
                  variant="secondary"
                  className="bg-red-500/20 hover:bg-red-500/30 text-white border-0 hover:scale-105 transition-transform"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
          <div className="text-right ml-6">
            <div className="text-4xl font-bold mb-1">
              ${currentPlan ? (billingCycle === 'monthly' ? currentPlan.monthlyPrice : currentPlan.yearlyPrice) : '0'}
            </div>
            <div className="text-white/80 text-sm">/{billingCycle}</div>
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="bg-white rounded-[18px] border border-[#E8ECF3] p-6 shadow-[0_10px_28px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Usage Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Students */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Students
              </span>
              <span className="font-medium text-slate-800">
                {usageData.students.used} / {usageData.students.limit}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getUsageColor(getUsagePercentage(usageData.students.used, usageData.students.limit))} transition-all`}
                style={{ width: `${getUsagePercentage(usageData.students.used, usageData.students.limit)}%` }}
              />
            </div>
          </div>

          {/* Teachers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Teachers
              </span>
              <span className="font-medium text-slate-800">
                {usageData.teachers.used} / {usageData.teachers.limit}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getUsageColor(getUsagePercentage(usageData.teachers.used, usageData.teachers.limit))} transition-all`}
                style={{ width: `${getUsagePercentage(usageData.teachers.used, usageData.teachers.limit)}%` }}
              />
            </div>
          </div>

          {/* Storage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Storage
              </span>
              <span className="font-medium text-slate-800">
                {usageData.storage.used} GB / {usageData.storage.limit} GB
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getUsageColor(getUsagePercentage(usageData.storage.used, usageData.storage.limit))} transition-all`}
                style={{ width: `${getUsagePercentage(usageData.storage.used, usageData.storage.limit)}%` }}
              />
            </div>
          </div>

          {/* Emails */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Emails
              </span>
              <span className="font-medium text-slate-800">
                {usageData.emails.used} / {usageData.emails.limit}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getUsageColor(getUsagePercentage(usageData.emails.used, usageData.emails.limit))} transition-all`}
                style={{ width: `${getUsagePercentage(usageData.emails.used, usageData.emails.limit)}%` }}
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                WhatsApp
              </span>
              <span className="font-medium text-slate-800">
                {usageData.whatsapp.used} / {usageData.whatsapp.limit}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getUsageColor(getUsagePercentage(usageData.whatsapp.used, usageData.whatsapp.limit))} transition-all`}
                style={{ width: `${getUsagePercentage(usageData.whatsapp.used, usageData.whatsapp.limit)}%` }}
              />
            </div>
          </div>

          {/* AI Credits */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                AI Credits
              </span>
              <span className="font-medium text-slate-800">
                {usageData.aiCredits.used} / {usageData.aiCredits.limit}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getUsageColor(getUsagePercentage(usageData.aiCredits.used, usageData.aiCredits.limit))} transition-all`}
                style={{ width: `${getUsagePercentage(usageData.aiCredits.used, usageData.aiCredits.limit)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-4 my-6">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer ${
            billingCycle === 'monthly'
              ? 'bg-[#E91E63] text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          className={`px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors relative cursor-pointer ${
            billingCycle === 'yearly'
              ? 'bg-[#E91E63] text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Yearly
          <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase">
            Save 20%
          </span>
        </button>
      </div>

      {/* Plan Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.filter(p => p.status === 'active').map((plan, index) => {
          const isCurrent = currentPlan?._id === plan._id;
          const isUpgrade = !isCurrent && plan.monthlyPrice > (currentPlan?.monthlyPrice || 0);
          const isDowngrade = !isCurrent && plan.monthlyPrice < (currentPlan?.monthlyPrice || 0);
          
          return (
            <div
              key={plan._id}
              className={`bg-white rounded-[18px] border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                isCurrent
                  ? 'border-[#E91E63] ring-2 ring-[#E91E63]/25 shadow-lg shadow-[#E91E63]/5'
                  : 'border-[#E8ECF3] hover:border-slate-300'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Plan Header */}
              <div className={`bg-gradient-to-r ${getPlanColor(plan.planType)} p-6 text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getPlanIcon(plan.planType)}
                    <span className="text-sm font-medium uppercase tracking-wide">
                      {plan.planType}
                    </span>
                  </div>
                  {plan.badge !== 'none' && (
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                <p className="text-white/80 text-sm">{plan.description}</p>
              </div>

              {/* Pricing */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-slate-800">
                    ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                  </span>
                  <span className="text-slate-500">/{billingCycle}</span>
                </div>
                {plan.discount > 0 && billingCycle === 'yearly' && (
                  <div className="text-sm text-green-600 mb-2">
                    Save {plan.discount}% with yearly billing
                  </div>
                )}
                <div className="text-xs text-slate-500">
                  {plan.trialDays} days free trial included
                </div>
              </div>

              {/* Features */}
              <div className="p-6 border-b border-slate-100">
                <ul className="space-y-3">
                  {plan.featuresList?.slice(0, 6).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <div className="p-6">
                {isCurrent ? (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled
                    >
                      Current Plan
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-sm"
                      onClick={handleRenew}
                    >
                      Renew Subscription
                    </Button>
                  </div>
                ) : isUpgrade ? (
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(plan)}
                  >
                    Upgrade
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : isDowngrade ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleDowngrade(plan)}
                  >
                    Downgrade
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(plan)}
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Enterprise Contact */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-2">Need a Custom Plan?</h3>
          <p className="text-slate-400 mb-4">
            Contact our sales team for enterprise solutions with custom features and dedicated support.
          </p>
          <Button className="bg-white text-slate-900 hover:bg-slate-100">
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
