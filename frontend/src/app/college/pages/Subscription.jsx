import React from 'react';
import { useAuth } from '../../school/contexts/AuthContext';
import { CreditCard, Award, Calendar } from 'lucide-react';

const Subscription = () => {
  const { school } = useAuth();
  const sub = school?.subscription || { plan: 'free-trial', status: 'active', trialEnd: new Date() };

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Subscription & Billing</h2>
        <p className="text-slate-500 text-xs mt-0.5">Manage your College CRM enterprise plan subscription status.</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b pb-1">Active Plan details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-650 flex items-center justify-center shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Plan Classification</span>
              <p className="font-bold text-slate-800 capitalize mt-0.5">{sub.plan.replace('-', ' ')}</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-650 flex items-center justify-center shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Payment Status</span>
              <p className="font-bold text-slate-800 capitalize mt-0.5">{sub.status}</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-650 flex items-center justify-center shrink-0">
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
