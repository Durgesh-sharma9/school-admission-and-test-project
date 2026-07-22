import React, { useState, useEffect } from 'react';
import api from '../../school/services/schoolApi';
import Loader from '../../../shared/components/Loader';
import toast from 'react-hot-toast';
import { DollarSign, Check, X, CreditCard } from 'lucide-react';

const FeeVerification = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/college/applications');
      if (res.success) {
        // filter those that paid something or initiated payment
        setApplications(res.data.filter(app => app.feeAmountPaid > 0 || app.transactionId));
      }
    } catch (error) {
      toast.error('Failed to load transaction data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleVerify = async (id, status, amount) => {
    try {
      const res = await api.put(`/college/applications/${id}/fee`, { paymentStatus: status, amount });
      if (res.success) {
        toast.success(`Transaction marked as ${status}`);
        fetchApplications();
      }
    } catch (error) {
      toast.error('Failed to verify fee transaction');
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Fee Verification Desk</h2>
        <p className="text-slate-500 text-xs mt-0.5">Reconcile offline registrations payments, cash receipts, and verify online payment transactions.</p>
      </div>

      {loading ? (
        <Loader message="Loading transaction registries..." />
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 text-xs">
          No fee payment logs submitted for verification.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400 bg-slate-50/50">
                  <th className="py-3 px-4">Application ID</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app._id} className="border-b border-slate-50 text-xs text-slate-600 hover:bg-slate-50/55 transition-colors">
                    <td className="py-3 px-4 font-bold text-indigo-600">{app.applicationId}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{app.studentName}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{app.transactionId || 'No receipt reference'}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">${app.feeAmountPaid}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide ${
                        app.paymentStatus === 'Verified' ? 'bg-emerald-50 text-emerald-600' : app.paymentStatus === 'Failed' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {app.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end space-x-1.5">
                        <button
                          onClick={() => handleVerify(app._id, 'Verified', app.feeAmountPaid)}
                          className="h-7 w-7 rounded-lg bg-emerald-55 bg-emerald-650 text-white flex items-center justify-center shadow-xs"
                          title="Verify Receipt"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleVerify(app._id, 'Failed', app.feeAmountPaid)}
                          className="h-7 w-7 rounded-lg bg-rose-55 bg-rose-650 text-white flex items-center justify-center shadow-xs"
                          title="Flag Transaction Failed"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeVerification;
