import React, { useState, useEffect } from 'react';
import { IndianRupee, CreditCard, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import superAdminApi from '../services/superAdminApi';

const formatINR = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const Payments = () => {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
  });
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await superAdminApi.get('/payments');
      if (response.data.success) {
        setStats(response.data.stats);
        setPayments(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'failed': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'refunded': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'pending': return <Clock className="w-3.5 h-3.5" />;
      case 'failed': return <XCircle className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-900 rounded-2xl">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          <p className="text-slate-400 text-sm font-medium">Retrieving transaction ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Payments Ledger</h1>
          <p className="text-slate-400 text-xs mt-0.5">Track real subscription receipts and revenue splits</p>
        </div>
        <button 
          onClick={fetchPayments}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold tracking-wide border border-slate-700 transition"
        >
          Refresh Ledger
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Revenue */}
        <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                <IndianRupee className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-extrabold uppercase">Live today</span>
            </div>
            <p className="text-slate-400 text-[10px] mb-0.5 font-bold uppercase tracking-wider">Today's Revenue</p>
            <p className="text-2xl font-black text-white tracking-tight">{formatINR(stats.todayRevenue)}</p>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                <CreditCard className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-[9px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded font-extrabold uppercase">30-day window</span>
            </div>
            <p className="text-slate-400 text-[10px] mb-0.5 font-bold uppercase tracking-wider">Monthly Revenue</p>
            <p className="text-2xl font-black text-white tracking-tight">{formatINR(stats.monthlyRevenue)}</p>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded font-extrabold uppercase">Awaiting review</span>
            </div>
            <p className="text-slate-400 text-[10px] mb-0.5 font-bold uppercase tracking-wider">Pending Payments</p>
            <p className="text-2xl font-black text-white tracking-tight">{stats.pendingPayments} <span className="text-xs text-slate-500 font-normal">Txns</span></p>
          </div>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-slate-800/40 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-700/60 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white tracking-wide">Payment History</h2>
          <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-[9px] text-indigo-400 font-bold rounded-md uppercase tracking-wider">Historical Log</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/60 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/60">
              <tr>
                <th className="px-4 py-2">Institution / Organization</th>
                <th className="px-4 py-2">Subscription Plan</th>
                <th className="px-4 py-2">Amount Paid</th>
                <th className="px-4 py-2">Method</th>
                <th className="px-4 py-2">Billing Cycle</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Payment Date</th>
                <th className="px-4 py-2">Transaction ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${payment.school?.institutionType === 'college' ? 'bg-emerald-600/10 text-emerald-400' : 'bg-blue-600/10 text-blue-400'}`}>
                          <CreditCard className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs leading-tight">{payment.school?.name || 'Unknown School'}</p>
                          <span className={`px-1 py-0.2 text-[8px] font-extrabold uppercase rounded ${payment.school?.institutionType === 'college' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                            {payment.school?.institutionType || 'school'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-slate-300 text-xs font-semibold">
                      {payment.plan?.planName || payment.plan?.name || 'Starter / Pro'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap font-black text-white text-xs">
                      {formatINR(payment.amount)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-slate-400 capitalize text-[11px] font-semibold">
                      {payment.paymentMethod ? payment.paymentMethod.replace('_', ' ') : 'Card'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-slate-400 capitalize text-[11px] font-semibold">
                      {payment.billingCycle || 'Yearly'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border flex items-center gap-1 w-fit ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-[11px] text-slate-400 font-medium">
                      {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date(payment.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-[11px] text-slate-400 font-mono font-bold tracking-wide">
                      {payment.transactionId || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-455 font-semibold text-xs">
                    No payment transactions recorded in the platform ledger.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payments;
