import React, { useState, useEffect } from 'react';
import { useAuth } from '../../school/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Check, X, ShieldAlert, Award, Calendar, CreditCard, Sparkles } from 'lucide-react';
import Button from '../../../shared/components/Button';
import schoolApi from '../../school/services/schoolApi';

const Subscription = () => {
  const { school, updateSchoolState } = useAuth();
  
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [activePlanDetails, setActivePlanDetails] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [lastProcessedRequest, setLastProcessedRequest] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [requestingCode, setRequestingCode] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch available plans for college
      const plansRes = await schoolApi.get('/plans/public?organizationType=college');
      if (plansRes.success || plansRes.plans) {
        setPlans(plansRes.plans || []);
      }

      // 2. Fetch current subscription details
      const subRes = await schoolApi.get('/subscription/current');
      if (subRes.success) {
        setCurrentSub(subRes.subscription);
        setActivePlanDetails(subRes.plan);
        setPendingRequest(subRes.pendingRequest);
        setLastProcessedRequest(subRes.lastProcessedRequest);

        // Update local context school subscription if changes detected
        if (updateSchoolState && school) {
          updateSchoolState({
            ...school,
            subscription: subRes.subscription
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch college subscription data:', error);
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPlan = async (planCode) => {
    setRequestingCode(planCode);
    try {
      const response = await schoolApi.post('/subscription/request', { planCode });
      if (response.success) {
        toast.success(response.message || 'Subscription request submitted successfully!');
        fetchData(); // Reload status
      }
    } catch (error) {
      console.error('Purchase request failed:', error);
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setRequestingCode(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 font-semibold text-slate-650">Loading college subscription portal...</span>
      </div>
    );
  }

  // Helper check for active plan status
  const plan = currentSub?.plan || 'free-trial';
  const status = currentSub?.status || 'active';
  const isTrial = plan === 'free-trial';
  const trialEnd = currentSub?.trialEnd ? new Date(currentSub.trialEnd) : null;
  const expiryDate = currentSub?.expiryDate ? new Date(currentSub.expiryDate) : null;
  
  const isSubscriptionActive = isTrial 
    ? (trialEnd && trialEnd >= new Date()) 
    : (status === 'active' && expiryDate && expiryDate >= new Date());

  return (
    <div className="max-w-4xl mx-auto text-left pb-12 space-y-6">
      {/* Page Header */}
      <div className="mb-5 mt-2">
        <h1 className="text-[24px] font-bold text-[#1F2937] tracking-tight leading-[1.2]">Subscription & Billing</h1>
        <p className="text-[#64748B] text-[15px] font-medium mt-1">
          Manage your College CRM subscription tier, review request logs, and buy features.
        </p>
      </div>

      {/* Rejection Remarks Notification Bar */}
      {lastProcessedRequest && lastProcessedRequest.status === 'rejected' && !pendingRequest && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-4.5 w-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wide">Subscription Request Rejected</h4>
            <p className="text-xs text-rose-700 font-semibold mt-0.5">
              Your subscription request for plan "{lastProcessedRequest.planCode.replace('-', ' ').toUpperCase()}" was rejected.
            </p>
            {lastProcessedRequest.remarks && (
              <p className="text-xs text-rose-600 italic mt-1 font-medium bg-rose-100/50 p-2 rounded-lg border border-rose-100/50">
                Reason: "{lastProcessedRequest.remarks}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* Active Subscription Summary Panel */}
      <div className="bg-white border border-[#E8ECF3] rounded-[18px] p-6 shadow-[0_10px_28px_rgba(15, 23, 42, 0.08)] hover:-translate-y-0.5 transition-all duration-200 space-y-6">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wide border-b pb-2">
          Current Subscription Status
        </h3>

        {!isSubscriptionActive ? (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="font-extrabold text-slate-800 text-sm uppercase">No Active Plan</p>
              <p className="text-xs text-slate-400 font-semibold mt-1">Your free trial or subscription has expired. Please select a plan below to renew.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-slate-50/50 border border-[#E8ECF3] p-4 rounded-2xl space-y-2">
              <div className="h-8 w-8 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center shrink-0">
                <Award className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Current Plan</span>
                <p className="font-extrabold text-slate-855 capitalize mt-0.5">{plan.replace('-', ' ')}</p>
              </div>
            </div>

            <div className="bg-slate-50/50 border border-[#E8ECF3] p-4 rounded-2xl space-y-2">
              <div className="h-8 w-8 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center shrink-0">
                <CreditCard className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Payment Status</span>
                <p className="font-extrabold text-slate-800 capitalize mt-0.5">{status === 'active' ? 'Active' : 'Suspended'}</p>
              </div>
            </div>

            <div className="bg-slate-50/50 border border-[#E8ECF3] p-4 rounded-2xl space-y-2">
              <div className="h-8 w-8 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center shrink-0">
                <Calendar className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                  {isTrial ? 'Trial Expiry Date' : 'Plan Expiration'}
                </span>
                <p className="font-extrabold text-slate-800 mt-0.5">
                  {isTrial 
                    ? (trialEnd ? trialEnd.toLocaleDateString() : 'N/A')
                    : (expiryDate ? expiryDate.toLocaleDateString() : 'N/A')
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Request Indicator */}
        {pendingRequest && (
          <div className="bg-amber-50/80 border border-amber-100 rounded-2xl p-4 flex items-center justify-between text-left">
            <div>
              <p className="text-xs font-bold text-amber-800 block uppercase tracking-wide">
                ⏳ Upgrade Approval Pending
              </p>
              <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
                Your purchase request for plan "{pendingRequest.planCode.replace('-', ' ').toUpperCase()}" is currently pending Super Admin review.
              </p>
            </div>
            <span className="bg-amber-100 text-amber-800 font-bold text-[10px] uppercase px-3 py-1 rounded-full border border-amber-250">
              Pending
            </span>
          </div>
        )}
      </div>

      {/* Plan Card Pricing Panels */}
      <div className="space-y-4 max-w-md mx-auto pt-4">
        <h3 className="text-xs font-extrabold text-slate-450 uppercase tracking-wider text-center block">
          Available Subscription Plan
        </h3>
        
        {plans.map((p) => {
          const isCurrent = plan === p.planCode && isSubscriptionActive;
          const isButtonDisabled = isCurrent || pendingRequest;

          return (
            <div 
              key={p._id} 
              className="bg-white border border-[#E8ECF3] rounded-[24px] overflow-hidden flex flex-col justify-between shadow-[0_10px_28px_rgba(15,23,42,0.05)] hover:-translate-y-1 transition-all duration-200"
            >
              {/* Header Gradient */}
              <div className="p-6 text-white text-left relative bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA]">
                <span className="text-[9px] font-bold uppercase tracking-widest block bg-white/25 w-max px-2 py-0.5 rounded-full mb-1">
                  Enterprise Tier
                </span>
                <h4 className="text-lg font-black">{p.planName}</h4>
                <div className="flex items-baseline mt-4 gap-1">
                  <span className="text-2xl font-black">₹{p.price}</span>
                  <span className="text-[10px] opacity-80 uppercase font-bold">/ Year</span>
                </div>
              </div>

              {/* Features List */}
              <div className="p-6 space-y-6 flex-1 text-left">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Included CRM Modules</span>
                  <div className="space-y-2.5">
                    {p.features.map((feat, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Purchase Button */}
              <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                <Button
                  onClick={() => handleBuyPlan(p.planCode)}
                  disabled={isButtonDisabled}
                  isLoading={requestingCode === p.planCode}
                  className={`w-full py-3 text-xs font-extrabold tracking-wide uppercase rounded-xl transition-all ${
                    isCurrent 
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-none hover:bg-emerald-50 cursor-default' 
                      : 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-md'
                  }`}
                >
                  {isCurrent 
                    ? 'Current Active Plan' 
                    : pendingRequest 
                      ? 'Pending Approval' 
                      : 'Buy Now'
                  }
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Subscription;
