import React, { useState, useEffect } from 'react';
import { Building2, CreditCard, IndianRupee, TrendingUp, Users, Calendar, ArrowUpRight, ArrowDownRight, ClipboardList } from 'lucide-react';
import superAdminApi from '../services/superAdminApi';

const formatINR = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const SuperAdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await superAdminApi.get('/analytics');
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const stats = analytics || {
    totalSchools: 0,
    activeSchools: 0,
    trialSchools: 0,
    expiredSchools: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    expiringTrials: 0,
    recentRegistrations: [],
    platformActivity: { totalEnquiries: 0, totalAdmissions: 0 }
  };

  const metricCards = [
    {
      title: 'Total Registered Schools',
      value: stats.totalSchools,
      icon: Building2,
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-400',
    },
    {
      title: 'Active Schools',
      value: stats.activeSchools,
      icon: Users,
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-400',
    },
    {
      title: 'Trial Schools',
      value: stats.trialSchools,
      icon: Calendar,
      bgColor: 'bg-yellow-500/10',
      textColor: 'text-yellow-400',
    },
    {
      title: 'Expired / Suspended',
      value: stats.expiredSchools,
      icon: ArrowDownRight,
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-400',
    },
    {
      title: 'Monthly Revenue',
      value: formatINR(stats.monthlyRevenue),
      icon: IndianRupee,
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-400',
    },
    {
      title: 'Total Platform Revenue',
      value: formatINR(stats.totalRevenue),
      icon: CreditCard,
      bgColor: 'bg-indigo-500/10',
      textColor: 'text-indigo-400',
    },
    {
      title: 'Total Enquiries Received',
      value: stats.platformActivity?.totalEnquiries || 0,
      icon: ClipboardList,
      bgColor: 'bg-pink-500/10',
      textColor: 'text-pink-400',
    },
    {
      title: 'Confirmed Admissions',
      value: stats.platformActivity?.totalAdmissions || 0,
      icon: TrendingUp,
      bgColor: 'bg-cyan-500/10',
      textColor: 'text-cyan-400',
    },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Analytics & Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Real-time SaaS system performance from MongoDB database</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {metricCards.map((metric, index) => (
          <div key={index} className="bg-slate-800 rounded-2xl border border-slate-700/60 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 ${metric.bgColor} rounded-xl flex items-center justify-center`}>
                <metric.icon className={`w-5 h-5 ${metric.textColor}`} />
              </div>
            </div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{metric.title}</p>
            <p className="text-2xl font-black text-white tracking-tight">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Registered Schools */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700/60 p-6 space-y-4">
        <h2 className="text-base font-extrabold text-white uppercase tracking-wider">
          Recent Registered Schools
        </h2>
        
        {stats.recentRegistrations && stats.recentRegistrations.length > 0 ? (
          <div className="space-y-3">
            {stats.recentRegistrations.map((school, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-700/40">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{school.name}</p>
                    <p className="text-xs text-slate-400">{school.email} • {school.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-indigo-400 border border-slate-700">
                    {school.plan}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">
                    {school.createdAt ? new Date(school.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-sm font-semibold">
            No registered schools found in the database.
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
