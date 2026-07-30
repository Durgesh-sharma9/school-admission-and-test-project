import React from 'react';
import { useAuth } from '../../school/contexts/AuthContext';
import { CreditCard, Award, Calendar } from 'lucide-react';

const Subscription = () => {
  const { school } = useAuth();
  const sub = school?.subscription || { plan: 'free-trial', status: 'active', trialEnd: new Date() };

  return (
    <div className="max-w-[1400px] mx-auto text-left relative pb-12">
      {/* Page Header (No Card) */}
      <div className="mb-5 mt-2">
        <h1 className="text-[24px] font-bold text-[#1F2937] tracking-tight leading-[1.2]">Subscription & Billing</h1>
        <p className="text-[#64748B] text-[15px] font-medium mt-1.5 font-semibold">Manage your College CRM enterprise plan subscription status.</p>
      </div>

      <div className="bg-white border border-[#E8ECF3] rounded-[18px] p-6 shadow-[0_10px_28px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-200 space-y-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b pb-1">Active Plan details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50/50 border border-[#E8ECF3] p-5 rounded-[14px] space-y-3">
            <div className="h-8 w-8 rounded-lg bg-pink-50 text-[#E91E63] flex items-center justify-center shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Plan Classification</span>
              <p className="font-bold text-slate-800 capitalize mt-0.5">{sub.plan.replace('-', ' ')}</p>
            </div>
          </div>

          <div className="bg-slate-50/50 border border-[#E8ECF3] p-5 rounded-[14px] space-y-3">
            <div className="h-8 w-8 rounded-lg bg-pink-50 text-[#E91E63] flex items-center justify-center shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Payment Status</span>
              <p className="font-bold text-slate-800 capitalize mt-0.5">{sub.status}</p>
            </div>
          </div>

          <div className="bg-slate-50/50 border border-[#E8ECF3] p-5 rounded-[14px] space-y-3">
            <div className="h-8 w-8 rounded-lg bg-pink-50 text-[#E91E63] flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Trial Expiry Date</span>
              <p className="font-bold text-slate-800 mt-0.5">{new Date(sub.trialEnd).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
