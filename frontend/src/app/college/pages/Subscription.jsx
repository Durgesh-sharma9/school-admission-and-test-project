import React, { useState, useEffect } from 'react';
import { useAuth } from '../../school/contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Check, X, ShieldAlert, Award, Calendar, CreditCard, Sparkles,
  Zap, Users, FileText, QrCode, Bell, BarChart3, ClipboardList,
  Building2, Star, BookOpen
} from 'lucide-react';
import Button from '../../../shared/components/Button';
import schoolApi from '../../school/services/schoolApi';

// ─── Feature Icon Map ──────────────────────────────────────────────────────────
const featureIcons = {
  'Applications CRM': { icon: ClipboardList, color: '#8B5CF6' },
  'Admission CRM': { icon: Building2, color: '#E91E63' },
  'Documents': { icon: FileText, color: '#3B82F6' },
  'Notifications': { icon: Bell, color: '#22C55E' },
  'QR Forms': { icon: QrCode, color: '#14B8A6' },
  'Full Access': { icon: Star, color: '#F59E0B' },
};

const COLLEGE_PLAN_META = {
  'college-premium': {
    badge: 'FULL ACCESS',
    badgeColor: 'bg-purple-50 text-[#8B5CF6] border-purple-100',
    price: '₹1,999',
    period: '/ Year',
    highlight: true,
    featuresDisplay: [
      { label: 'Applications CRM', enabled: true },
      { label: 'Admission CRM', enabled: true },
      { label: 'Documents', enabled: true },
      { label: 'Notifications', enabled: true },
      { label: 'QR Forms', enabled: true },
      { label: 'Full Access', enabled: true },
    ],
  },
};

// ─── Purchase Confirmation Modal ─────────────────────────────────────────────
const PurchaseModal = ({ plan, planMeta, onConfirm, onClose, isLoading }) => {
  if (!plan) return null;
  const meta = planMeta[plan.planCode] || {};
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: 'scale-in 0.2s ease-out' }}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">Confirm Purchase Request</h3>
              <p className="text-[11px] opacity-80 mt-0.5">Your request will be sent for approval</p>
            </div>
          </div>
        </div>

        {/* Plan Summary */}
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan</span>
              <span className="text-sm font-extrabold text-slate-800">{plan.planName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price</span>
              <span className="text-sm font-extrabold text-[#8B5CF6]">{meta.price} {meta.period}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Billing</span>
              <span className="text-xs font-bold text-slate-700">Annual Subscription</span>
            </div>
          </div>

          {/* Features */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Included Features</p>
            <div className="grid grid-cols-2 gap-1.5">
              {(meta.featuresDisplay || []).filter(f => f.enabled).map((feat, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                  <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                  {feat.label}
                </div>
              ))}
            </div>
          </div>

          {/* Status Note */}
          <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <span className="text-amber-700 text-xs">⏳</span>
            </div>
            <p className="text-[11px] font-semibold text-amber-700">
              After submission, your request will show as <strong>Pending Approval</strong> until reviewed by our team.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-extrabold text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
            ) : (
              'Request Purchase'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Plan Card Component ──────────────────────────────────────────────────────
const PlanCard = ({ plan, planMeta, isCurrent, isPending, isLoading, activeSince, expiryDate, onBuy }) => {
  const meta = planMeta[plan.planCode] || {};

  return (
    <div className="relative bg-white rounded-2xl flex flex-col overflow-hidden border-2 border-[#8B5CF6] shadow-[0_8px_32px_rgba(139,92,246,0.12)] hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(139,92,246,0.18)] transition-all duration-250">

      {/* Subtle Glow */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: 'inset 0 0 0 2px rgba(139,92,246,0.08)' }} />

      <div className="p-7 flex-1 flex flex-col">

        {/* Badge + Name */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${meta.badgeColor || 'bg-slate-50 text-slate-500 border-slate-100'}`}>
              {meta.badge || plan.planCode}
            </span>
            <h3 className="text-xl font-extrabold text-slate-800 mt-2">{plan.planName}</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Complete College CRM Suite</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-[#8B5CF6]" />
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mb-6">
          <span className="text-4xl font-black text-[#8B5CF6]">{meta.price || `₹${plan.price}`}</span>
          <span className="text-sm text-slate-400 font-semibold">{meta.period || '/ Year'}</span>
        </div>

        {/* Divider */}
        <div className="border-t border-[#E8ECF3] mb-5" />

        {/* Features */}
        <div className="space-y-3 flex-1">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Included Modules</p>
          {(meta.featuresDisplay || plan.features.map(f => ({ label: f, enabled: true }))).map((feat, idx) => {
            const iconMeta = featureIcons[feat.label];
            const IconComp = iconMeta?.icon || Check;
            return (
              <div key={idx} className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                <div className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${iconMeta?.color || '#22C55E'}15` }}>
                  <IconComp className="h-3.5 w-3.5" style={{ color: iconMeta?.color || '#22C55E' }} />
                </div>
                <span>{feat.label}</span>
              </div>
            );
          })}
        </div>

        {/* Current Plan Info */}
        {isCurrent && (activeSince || expiryDate) && (
          <div className="mt-5 bg-emerald-50 border border-emerald-100 rounded-xl p-3 space-y-1">
            {activeSince && (
              <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-700">
                <Calendar className="h-3 w-3" />
                Activated: {new Date(activeSince).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            )}
            {expiryDate && (
              <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-700">
                <Calendar className="h-3 w-3" />
                Expires: {new Date(expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-7 pb-7">
        {isCurrent ? (
          <div className="w-full py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-xs text-center flex items-center justify-center gap-2">
            <Check className="h-3.5 w-3.5" /> Current Plan
          </div>
        ) : (
          <button
            onClick={() => onBuy(plan)}
            disabled={isPending || isLoading}
            className="w-full py-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-extrabold text-xs transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
            ) : isPending ? (
              '⏳ Pending Approval'
            ) : (
              'Buy Plan'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const Subscription = () => {
  const { school, updateSchoolState } = useAuth();

  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [activePlanDetails, setActivePlanDetails] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [lastProcessedRequest, setLastProcessedRequest] = useState(null);

  const [loading, setLoading] = useState(true);
  const [requestingCode, setRequestingCode] = useState(null);
  const [modalPlan, setModalPlan] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const plansRes = await schoolApi.get('/plans/public?organizationType=college');
      if (plansRes.success || plansRes.plans) {
        setPlans(plansRes.plans || []);
      }

      const subRes = await schoolApi.get('/subscription/current');
      if (subRes.success) {
        setCurrentSub(subRes.subscription);
        setActivePlanDetails(subRes.plan);
        setPendingRequest(subRes.pendingRequest);
        setLastProcessedRequest(subRes.lastProcessedRequest);

        if (updateSchoolState && school) {
          updateSchoolState({ ...school, subscription: subRes.subscription });
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
    setModalPlan(null);
    try {
      const response = await schoolApi.post('/subscription/request', { planCode });
      if (response.success) {
        toast.success(response.message || 'Subscription request submitted successfully!');
        fetchData();
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="h-9 w-9 border-[3px] border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Loading subscription portal...</span>
      </div>
    );
  }

  const plan = currentSub?.plan || 'free-trial';
  const status = currentSub?.status || 'active';
  const isTrial = plan === 'free-trial';
  const trialEnd = currentSub?.trialEnd ? new Date(currentSub.trialEnd) : null;
  const expiryDate = currentSub?.expiryDate ? new Date(currentSub.expiryDate) : null;
  const startDate = currentSub?.startDate ? new Date(currentSub.startDate) : null;

  const isSubscriptionActive = isTrial
    ? (trialEnd && trialEnd >= new Date())
    : (status === 'active' && expiryDate && expiryDate >= new Date());

  return (
    <div className="min-h-screen pb-16">

      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className="text-center pt-8 pb-10 px-4">
        <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-100 text-[#8B5CF6] text-[11px] font-extrabold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-4">
          <Zap className="h-3.5 w-3.5" />
          College Subscription Plans
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight">
          Choose Your Perfect Plan
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-2.5 max-w-md mx-auto">
          Select the best subscription for your institution and unlock full CRM access.
        </p>
      </div>

      {/* ── Rejection Alert ──────────────────────────────────────────────── */}
      {lastProcessedRequest && lastProcessedRequest.status === 'rejected' && !pendingRequest && (
        <div className="max-w-2xl mx-auto px-4 mb-6">
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-rose-800 uppercase tracking-wide">Request Rejected</h4>
              <p className="text-xs text-rose-700 font-semibold mt-0.5">
                Your request for "{lastProcessedRequest.planCode.replace(/-/g, ' ').toUpperCase()}" was rejected.
              </p>
              {lastProcessedRequest.remarks && (
                <p className="text-xs text-rose-600 italic mt-1.5 font-medium bg-rose-100/50 px-3 py-2 rounded-lg border border-rose-100">
                  Reason: "{lastProcessedRequest.remarks}"
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Current Subscription Status ──────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <div className="bg-white border border-[#E8ECF3] rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.06)] overflow-hidden">
          <div className={`h-1 w-full ${isSubscriptionActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Current Subscription</h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                isSubscriptionActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-rose-50 text-rose-700 border-rose-100'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isSubscriptionActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {isSubscriptionActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {!isSubscriptionActive ? (
              <div className="flex flex-col items-center justify-center py-4 text-center space-y-2">
                <div className="h-10 w-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <p className="font-extrabold text-slate-700 text-xs">No Active Plan</p>
                <p className="text-xs text-slate-400 font-medium max-w-xs">Your trial or subscription has expired. Choose a plan below to continue.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Current Plan', value: plan.replace(/-/g, ' '), icon: Award, color: '#8B5CF6' },
                  { label: 'Status', value: status === 'active' ? 'Active' : 'Suspended', icon: CreditCard, color: '#22C55E' },
                  { label: isTrial ? 'Trial Ends' : 'Expires On', value: isTrial ? (trialEnd?.toLocaleDateString('en-IN') || 'N/A') : (expiryDate?.toLocaleDateString('en-IN') || 'N/A'), icon: Calendar, color: '#F59E0B' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                      <Icon className="h-3.5 w-3.5" style={{ color }} />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{label}</span>
                      <p className="font-extrabold text-slate-800 text-xs capitalize mt-0.5">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pending Request Banner */}
            {pendingRequest && (
              <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold text-amber-800 uppercase tracking-wide">⏳ Upgrade Pending</p>
                  <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                    Your request for "{pendingRequest.planCode.replace(/-/g, ' ').toUpperCase()}" is under review.
                  </p>
                </div>
                <span className="bg-amber-100 border border-amber-200 text-amber-800 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-full shrink-0">
                  Pending
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Plan Card ────────────────────────────────────────────────────── */}
      <div className="max-w-sm mx-auto px-4">
        {plans.map((p) => {
          const isCurrent = plan === p.planCode && isSubscriptionActive;
          return (
            <PlanCard
              key={p._id}
              plan={p}
              planMeta={COLLEGE_PLAN_META}
              isCurrent={isCurrent}
              isPending={!!pendingRequest}
              isLoading={requestingCode === p.planCode}
              activeSince={isCurrent ? startDate : null}
              expiryDate={isCurrent ? expiryDate : null}
              onBuy={(selectedPlan) => setModalPlan(selectedPlan)}
            />
          );
        })}
      </div>

      {/* ── Purchase Confirmation Modal ─────────────────────────────────── */}
      {modalPlan && (
        <PurchaseModal
          plan={modalPlan}
          planMeta={COLLEGE_PLAN_META}
          isLoading={requestingCode === modalPlan.planCode}
          onConfirm={() => handleBuyPlan(modalPlan.planCode)}
          onClose={() => setModalPlan(null)}
        />
      )}

      <style>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.15s ease-out; }
      `}</style>
    </div>
  );
};

export default Subscription;
