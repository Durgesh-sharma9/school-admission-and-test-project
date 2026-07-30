import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, CreditCard } from 'lucide-react';
import Button from './Button';

const UpgradePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white border border-[#E8ECF3] rounded-[24px] p-8 md:p-12 max-w-lg shadow-[0_10px_28px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-200 space-y-6">
        <div className="h-16 w-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto animate-bounce">
          <ShieldAlert className="h-8 w-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-800 uppercase tracking-wide">
            School Premium Feature
          </h2>
          <p className="text-slate-500 font-semibold text-xs leading-relaxed">
            Assessment Module is available only in School Premium. Upgrade your subscription to access this feature.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={() => navigate('/subscription')}
            className="flex items-center justify-center gap-1.5 px-6 py-2.5 text-xs font-bold bg-[#E91E63] hover:bg-[#D81B60] text-white rounded-xl shadow-md transition-colors"
          >
            <CreditCard className="h-4 w-4" /> Go to Subscription
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2.5 text-xs font-semibold"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpgradePage;
