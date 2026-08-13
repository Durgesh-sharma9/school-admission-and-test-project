import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import {
  Check, X, ShieldAlert, Award, Calendar, CreditCard, Sparkles,
  Zap, Clock
} from 'lucide-react';
import schoolApi from '../services/schoolApi';

// ─── Exact Image Match Plan Definitions ──────────────────────────────────────
const SCHOOL_PLAN_META = {
  'school-basic': {
    badge: null,
    price: '₹1,999',
    period: '/ year',
    subtitle: 'Ideal for growing institutes',
    buttonClass: 'bg-[#1E293B] hover:bg-slate-800 text-white',
    cardClass: 'border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
    featuresDisplay: [
      { label: 'Up to 200 Students', enabled: true },
      { label: 'Parent Portal Access', enabled: true },
      { label: 'Daily Test Management', enabled: true },
      { label: 'Easy Plan Upgrade', enabled: true },
      { label: 'Email support', enabled: true },
      { label: 'Assessments & Analytics', enabled: false },
    ],
  },
  'school-premium': {
    badge: 'MOST POPULAR',
    badgeClass: 'bg-[#8B5CF6] text-white',
    price: '₹2,999',
    period: '/ year',
    subtitle: 'Ideal for growing institutes',
    buttonClass: 'bg-[#8B5CF6] hover:bg-purple-600 text-white',
    cardClass: 'border-2 border-[#8B5CF6] shadow-[0_8px_30px_rgb(139,92,246,0.12)]',
    featuresDisplay: [
      { label: 'Up to 500 Students', enabled: true },
      { label: 'Ideal for Growing Schools', enabled: true },
      { label: 'Priority Email Support', enabled: true },
      { label: 'Flexible Upgrade Options', enabled: true },
      { label: 'Parents portal & download result', enabled: true },
      { label: 'Full Assessment Suite', enabled: true },
    ],
  },
};

// ─── Purchase Confirmation Modal ─────────────────────────────────────────────
const PurchaseModal = ({ plan, planMeta, onConfirm, onClose, isLoading }) => {
  if (!plan) return null;
  const meta = planMeta[plan.planCode] || SCHOOL_PLAN_META['school-basic'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" style={{ animation: 'scale-in 0.2s ease-out' }}>
        <div className="bg-[#8B5CF6] p-5 text-white">
          <h3 className="font-bold text-lg">Confirm Purchase</h3>
          <p className="text-xs opacity-90 mt-0.5">Your request will be sent for approval</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan Selected</span>
              <span className="text-sm font-extrabold text-slate-800">{plan.planName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pricing</span>
              <span className="text-base font-black text-slate-800">
                {plan.price !== undefined ? `₹${new Intl.NumberFormat('en-IN').format(plan.price)}` : meta.price}{' '}
                <span className="text-xs text-slate-500 font-medium">{meta.period}</span>
              </span>
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center disabled:opacity-60 bg-[#8B5CF6] hover:bg-purple-600`}
          >
            {isLoading ? 'Processing...' : 'Request Plan'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Exact Plan Card Component ───────────────────────────────────────────────
const PlanCard = ({ plan, planMeta, isCurrent, isPending, isLoading, onBuy }) => {
  const meta = planMeta[plan.planCode] || SCHOOL_PLAN_META['school-basic'];

  return (
    <div className={`relative bg-white rounded-2xl flex flex-col w-[320px] transition-transform duration-300 hover:-translate-y-1 ${meta.cardClass}`}>

      {/* Top Overlapping Badge */}
      {meta.badge && (
        <div className="absolute -top-3.5 w-full flex justify-center">
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${meta.badgeClass}`}>
            {meta.badge}
          </span>
        </div>
      )}

      <div className="p-8 pb-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-[22px] font-bold text-[#1E293B]">{plan.planName}</h3>
          <div className="mt-4 flex items-baseline justify-center">
            <span className="text-[40px] font-black text-[#0F172A] leading-none tracking-tight">
              {plan.price !== undefined ? `₹${new Intl.NumberFormat('en-IN').format(plan.price)}` : meta.price}
            </span>
            <span className="text-sm font-medium text-slate-500 ml-1">{meta.period}</span>
          </div>
          <p className="text-xs text-slate-500 mt-3 pb-6 border-b border-slate-100">{meta.subtitle}</p>
        </div>

        {/* Features */}
        <div className="space-y-4 flex-1">
          {(meta.featuresDisplay || plan.features.map(f => ({ label: f, enabled: true }))).map((feat, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {feat.enabled ? (
                <Check className="h-4 w-4 text-[#10B981] shrink-0" strokeWidth={3} />
              ) : (
                <Check className="h-4 w-4 text-slate-200 shrink-0" strokeWidth={3} />
              )}
              <span className={`text-[13px] ${feat.enabled ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                {feat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Button */}
        <div className="mt-8">
          {isCurrent ? (
            <div className="w-full py-3 rounded-xl border border-[#10B981] text-[#10B981] bg-white font-semibold text-sm flex items-center justify-center gap-2">
              <Check className="h-4 w-4" strokeWidth={2.5} /> Current Plan
            </div>
          ) : (
            <button
              onClick={() => onBuy(plan)}
              disabled={isPending || isLoading}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${meta.buttonClass} disabled:opacity-60`}
            >
              {isLoading ? 'Processing...' : isPending ? '⏳ Pending Approval' : 'View Details'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const Subscription = () => {
  const { school, updateSchoolState } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [lastProcessedRequest, setLastProcessedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestingCode, setRequestingCode] = useState(null);
  const [modalPlan, setModalPlan] = useState(null);
  const [downgradeDialog, setDowngradeDialog] = useState(null); // { planCode, planName, expiryDate }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const plansRes = await schoolApi.get('/plans/public?organizationType=school');
      if (plansRes.success || plansRes.plans) setPlans(plansRes.plans || []);
      const subRes = await schoolApi.get('/subscription/current');
      if (subRes.success) {
        setCurrentSub(subRes.subscription);
        setPendingRequest(subRes.pendingRequest);
        setLastProcessedRequest(subRes.lastProcessedRequest);
        if (updateSchoolState && school) updateSchoolState({ ...school, subscription: subRes.subscription });
      }
    } catch (error) {
      console.error('Failed to fetch subscription data:', error);
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBuyPlan = async (planCode) => {
    setRequestingCode(planCode);
    setModalPlan(null);
    setDowngradeDialog(null);
    try {
      const response = await schoolApi.post('/subscription/create-razorpay-order', { planCode });
      if (!response.success || !response.orderId) {
        throw new Error(response.message || 'Failed to create payment order');
      }

      const { orderId, amount, keyId, planName } = response;

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Razorpay SDK failed to load. Are you connected to the internet?');
        setRequestingCode(null);
        return;
      }

      const options = {
        key: keyId,
        amount: amount,
        currency: 'INR',
        name: 'School Admission CRM',
        description: `Upgrade to ${planName}`,
        order_id: orderId,
        prefill: {
          name: school?.name || '',
          email: school?.email || '',
          contact: school?.phone || ''
        },
        theme: { color: '#8B5CF6' },
        handler: async function (paymentRes) {
          setLoading(true);
          try {
            const verifyRes = await schoolApi.post('/subscription/verify-razorpay-payment', {
              razorpay_payment_id: paymentRes.razorpay_payment_id,
              razorpay_order_id: paymentRes.razorpay_order_id,
              razorpay_signature: paymentRes.razorpay_signature,
              planCode
            });
            if (verifyRes.success) {
              // 🎉 Party popper confetti burst!
              confetti({
                particleCount: 180, spread: 100, origin: { y: 0.55 },
                colors: ['#8B5CF6', '#A855F7', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'],
                ticks: 300, zIndex: 9999
              });
              setTimeout(() => {
                confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0, y: 0.6 }, colors: ['#8B5CF6', '#10B981', '#F59E0B'], zIndex: 9999 });
                confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1, y: 0.6 }, colors: ['#8B5CF6', '#10B981', '#EC4899'], zIndex: 9999 });
              }, 250);

              if (verifyRes.needsDowngradeChoice) {
                // Payment done ✅ — now ask what to do with assessment
                toast.success('🎉 Payment confirmed! One more step...');
                setDowngradeDialog({
                  planCode,
                  planName: verifyRes.newPlanName || planName,
                  expiryDate: verifyRes.currentPlanExpiry ? new Date(verifyRes.currentPlanExpiry) : null,
                });
              } else {
                toast.success('🎉 Plan activated successfully! Welcome aboard!');
              }
              fetchData();
            } else {
              toast.error(verifyRes.message || 'Payment verification failed');
            }
          } catch (err) {
            console.error('Razorpay verification error:', err);
            toast.error(err.message || 'Failed to verify payment');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => { toast.error('Payment cancelled'); }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Purchase request failed:', error);
      toast.error(error.message || 'Failed to initiate checkout');
    } finally {
      setRequestingCode(null);
    }
  };

  // Called when user picks their downgrade choice after payment
  const handleDowngradeChoice = async (choice) => {
    try {
      const res = await schoolApi.post('/subscription/confirm-downgrade-choice', { choice });
      if (res.success) {
        toast.success(choice === 'now' ? '✅ Assessment removed. New plan is active!' : '✅ Assessment stays until your current plan expires.');
        setDowngradeDialog(null);
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to confirm choice. Please try again.');
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="h-8 w-8 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const plan = currentSub?.plan || 'free-trial';
  const status = currentSub?.status || 'active';
  const isTrial = plan === 'free-trial';
  const trialEnd = currentSub?.trialEnd ? new Date(currentSub.trialEnd) : null;
  const expiryDate = currentSub?.expiryDate ? new Date(currentSub.expiryDate) : null;
  const isSubscriptionActive = isTrial ? (trialEnd && trialEnd >= new Date()) : (status === 'active' && expiryDate && expiryDate >= new Date());

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10 flex flex-col justify-between">

      <div>
        {/* ── Exact Header ────────────────────────────────────────────────────── */}
        <div className="text-center pt-8 pb-10 px-4">
          <h1 className="text-3xl md:text-[32px] font-bold text-[#A855F7] tracking-tight">
            Choose the Perfect Plan
          </h1>
          <p className="text-slate-500 text-[13px] mt-2 max-w-md mx-auto">
            Scale your school's records management with yearly plans.
          </p>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto px-4 mb-6 flex flex-col gap-3">
          {lastProcessedRequest && lastProcessedRequest.status === 'rejected' && !pendingRequest && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-rose-800">Request Rejected: "{lastProcessedRequest.planCode}"</h4>
              </div>
            </div>
          )}
          {pendingRequest && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <p className="text-xs font-bold text-amber-800">Request for "{pendingRequest.planCode}" is under review.</p>
              </div>
              <span className="bg-amber-500 text-white font-bold text-[9px] uppercase px-2 py-0.5 rounded-md">Pending</span>
            </div>
          )}
        </div>

        {/* ── Centered Plan Cards ────────────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto px-4 mb-10">
          <div className="flex flex-wrap justify-center gap-8 lg:gap-12">
            {plans.map((p) => {
              const isCurrent = plan === p.planCode && isSubscriptionActive;
              return (
                <PlanCard
                  key={p._id}
                  plan={p}
                  planMeta={SCHOOL_PLAN_META}
                  isCurrent={isCurrent}
                  isPending={!!pendingRequest}
                  isLoading={requestingCode === p.planCode}
                  onBuy={(selectedPlan) => setModalPlan(selectedPlan)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Full Detailed Bottom Section ────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 w-full">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className={`absolute top-0 left-0 h-1 w-full ${isSubscriptionActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />

          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Current Subscription Details</h3>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${isSubscriptionActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
              }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isSubscriptionActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              {isSubscriptionActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Current Plan', value: plan.replace(/-/g, ' '), icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Status', value: status === 'active' ? 'Active' : 'Suspended', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: isTrial ? 'Trial Ends' : 'Expires On', value: isTrial ? (trialEnd?.toLocaleDateString('en-IN') || 'N/A') : (expiryDate?.toLocaleDateString('en-IN') || 'N/A'), icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Assessments', value: currentSub?.assessmentEnabled ? 'Enabled' : 'Disabled', icon: Sparkles, color: currentSub?.assessmentEnabled ? 'text-emerald-600' : 'text-slate-400', bg: currentSub?.assessmentEnabled ? 'bg-emerald-50' : 'bg-slate-100' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-3 ${bg}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{label}</span>
                <p className="font-extrabold text-slate-800 text-sm capitalize mt-0.5 truncate">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Purchase Modal ─────────────────────────────────────────── */}
      {modalPlan && (
        <PurchaseModal
          plan={modalPlan}
          planMeta={SCHOOL_PLAN_META}
          isLoading={requestingCode === modalPlan.planCode}
          onConfirm={() => handleBuyPlan(modalPlan.planCode)}
          onClose={() => setModalPlan(null)}
        />
      )}

      {/* ── Downgrade Assessment Choice Dialog (shown AFTER payment) ─── */}
      {downgradeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" style={{ animation: 'scale-in 0.2s ease-out' }}>
            {/* Header */}
            <div className="bg-amber-500 p-5 text-white">
              <div className="flex items-center gap-3 mb-1">
                <Sparkles className="h-5 w-5" />
                <h3 className="font-bold text-base">Payment Successful! 🎉</h3>
              </div>
              <p className="text-xs opacity-90">You have an active assessment plan. When should we switch?</p>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-500 font-medium">
                Your assessment plan is active until{' '}
                <strong className="text-slate-700">{downgradeDialog.expiryDate?.toLocaleDateString('en-IN')}</strong>.
                You've purchased <strong>"{downgradeDialog.planName}"</strong> (no assessment) — choose when to switch:
              </p>

              {/* Option A: Keep assessment until current plan expires */}
              <button
                onClick={() => handleDowngradeChoice('after_expiry')}
                className="w-full text-left p-4 border-2 border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100 rounded-xl transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-800 text-sm">Keep Assessment Until Plan Expires</p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Assessment stays active until <strong>{downgradeDialog.expiryDate?.toLocaleDateString('en-IN')}</strong>.
                      "{downgradeDialog.planName}" activates automatically after. <strong>+1 year</strong> validity added.
                    </p>
                  </div>
                </div>
              </button>

              {/* Option B: Remove assessment right now */}
              <button
                onClick={() => handleDowngradeChoice('now')}
                className="w-full text-left p-4 border-2 border-rose-200 bg-rose-50 hover:border-rose-400 hover:bg-rose-100 rounded-xl transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-rose-500 flex items-center justify-center shrink-0">
                    <X className="h-3 w-3 text-white" strokeWidth={3} />
                  </div>
                  <div>
                    <p className="font-bold text-rose-800 text-sm">Remove Assessment Right Now</p>
                    <p className="text-xs text-rose-600 mt-0.5">
                      Assessment stops now. "{downgradeDialog.planName}" activates today with fresh <strong>1-year validity</strong>.
                      Remaining time on current plan is forfeited.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
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