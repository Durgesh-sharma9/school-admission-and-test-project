import React, { useState, useEffect } from 'react';
import { DollarSign, CreditCard, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

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
      // Mock data for now - will be replaced with actual API call
      setStats({
        todayRevenue: 1250,
        monthlyRevenue: 15400,
        pendingPayments: 8,
      });
      setPayments([
        {
          _id: '1',
          school: { name: 'Springfield High', logo: '' },
          plan: { name: 'Professional' },
          amount: 79,
          status: 'completed',
          paymentMethod: 'card',
          billingCycle: 'monthly',
          paidAt: '2026-07-20',
          transactionId: 'TXN001234',
        },
        {
          _id: '2',
          school: { name: 'Lincoln Academy', logo: '' },
          plan: { name: 'Enterprise' },
          amount: 199,
          status: 'completed',
          paymentMethod: 'upi',
          billingCycle: 'yearly',
          paidAt: '2026-07-19',
          transactionId: 'TXN001235',
        },
        {
          _id: '3',
          school: { name: 'Washington Prep', logo: '' },
          plan: { name: 'Starter' },
          amount: 29,
          status: 'pending',
          paymentMethod: 'bank_transfer',
          billingCycle: 'monthly',
          paidAt: null,
          transactionId: null,
        },
        {
          _id: '4',
          school: { name: 'Roosevelt High', logo: '' },
          plan: { name: 'Professional' },
          amount: 79,
          status: 'completed',
          paymentMethod: 'card',
          billingCycle: 'monthly',
          paidAt: '2026-07-18',
          transactionId: 'TXN001236',
        },
        {
          _id: '5',
          school: { name: 'Jefferson Academy', logo: '' },
          plan: { name: 'Enterprise' },
          amount: 199,
          status: 'failed',
          paymentMethod: 'card',
          billingCycle: 'yearly',
          paidAt: null,
          transactionId: 'TXN001237',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-400';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400';
      case 'failed': return 'bg-red-500/10 text-red-400';
      case 'refunded': return 'bg-slate-500/10 text-slate-400';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <p className="text-slate-400">Track all payments and revenue</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-green-400 text-sm font-medium">+12%</span>
          </div>
          <p className="text-slate-400 text-sm mb-1">Today's Revenue</p>
          <p className="text-3xl font-bold text-white">${stats.todayRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-green-400 text-sm font-medium">+8%</span>
          </div>
          <p className="text-slate-400 text-sm mb-1">Monthly Revenue</p>
          <p className="text-3xl font-bold text-white">${stats.monthlyRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <span className="text-yellow-400 text-sm font-medium">{stats.pendingPayments}</span>
          </div>
          <p className="text-slate-400 text-sm mb-1">Pending Payments</p>
          <p className="text-3xl font-bold text-white">{stats.pendingPayments}</p>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Payment History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">School</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Cycle</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Transaction ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {payments.map((payment) => (
                <tr key={payment._id} className="hover:bg-slate-700/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="font-medium text-white">{payment.school.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{payment.plan.name}</td>
                  <td className="px-6 py-4 font-semibold text-white">${payment.amount}</td>
                  <td className="px-6 py-4 text-slate-300 capitalize">{payment.paymentMethod.replace('_', ' ')}</td>
                  <td className="px-6 py-4 text-slate-300 capitalize">{payment.billingCycle}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm font-mono">
                    {payment.transactionId || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payments;
