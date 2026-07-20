import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../shared/components/Button';
import { HelpCircle } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center text-left">
      <div className="max-w-md bg-white rounded-3xl p-8 border border-slate-100 shadow-xl space-y-5">
        <div className="h-14 w-14 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
          <HelpCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">404 - Page Not Found</h2>
        <p className="text-xs text-slate-400 leading-normal">
          The URL path you are attempting to visit does not exist or has been moved.
        </p>
        <div className="pt-2">
          <Button className="w-full" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
