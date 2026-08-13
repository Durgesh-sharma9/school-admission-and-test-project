import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CreditCard, 
  IndianRupee, 
  TrendingUp, 
  Users, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  ClipboardList, 
  GraduationCap, 
  AlertCircle, 
  DollarSign, 
  Activity,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
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
      <div className="flex items-center justify-center h-96 bg-slate-900 rounded-2xl">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          <p className="text-slate-400 text-sm font-medium">Aggregating platform telemetry...</p>
        </div>
      </div>
    );
  }

  const stats = analytics || {
    totalSchools: 0,
    activeSchools: 0,
    trialSchools: 0,
    expiredSchools: 0,
    totalColleges: 0,
    activeColleges: 0,
    trialColleges: 0,
    expiredColleges: 0,
    completedPaymentsCount: 0,
    pendingSubscriptionRequests: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    schoolMonthlyRevenue: 0,
    collegeMonthlyRevenue: 0,
    schoolTotalRevenue: 0,
    collegeTotalRevenue: 0,
    activeSubscriptions: 0,
    expiringTrials: 0,
    recentRegistrations: [],
    monthlyTrend: [],
    platformActivity: { 
      totalEnquiries: 0, 
      totalAdmissions: 0,
      totalCollegeApplications: 0,
      confirmedCollegeAdmissions: 0,
      totalParents: 0,
      totalStudents: 0
    }
  };

  return (
    <div className="space-y-8 text-left bg-slate-900 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Platform Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time enterprise statistics, registrations distribution, and separated revenue metrics.</p>
        </div>
        <button 
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wide transition shadow-md shadow-indigo-600/10"
        >
          Refresh Telemetry
        </button>
      </div>

      {/* Segment 1: Platform Overview Cards */}
      <div>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Active Schools */}
          <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-5 shadow-lg flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
              <Building2 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Schools</p>
              <p className="text-2xl font-black text-white tracking-tight">{stats.activeSchools || 0}</p>
            </div>
          </div>

          {/* Active Colleges */}
          <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-5 shadow-lg flex items-center space-x-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
              <GraduationCap className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Colleges</p>
              <p className="text-2xl font-black text-white tracking-tight">{stats.activeColleges || 0}</p>
            </div>
          </div>

          {/* Total Enquiries */}
          <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-5 shadow-lg flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
              <ClipboardList className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">School Enquiries</p>
              <p className="text-2xl font-black text-white tracking-tight">{stats.platformActivity?.totalEnquiries || 0}</p>
            </div>
          </div>

          {/* Total College Applications */}
          <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-5 shadow-lg flex items-center space-x-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
              <GraduationCap className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">College Applications</p>
              <p className="text-2xl font-black text-white tracking-tight">{stats.platformActivity?.totalCollegeApplications || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Segment 2: Institutions Registry Status & Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schools Card */}
        <div className="bg-slate-800/60 rounded-2xl border border-blue-500/10 p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Schools Registry</span>
              <p className="text-4xl font-black text-white tracking-tight">{stats.totalSchools}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
              <Building2 className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-6 pt-4 border-t border-slate-700/40">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Active</p>
              <p className="text-lg font-bold text-emerald-400">{stats.activeSchools}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Free Trial</p>
              <p className="text-lg font-bold text-amber-400">{stats.trialSchools}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Inactive</p>
              <p className="text-lg font-bold text-rose-500">{stats.expiredSchools}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Enquiries</p>
              <p className="text-lg font-bold text-indigo-400">{stats.platformActivity?.totalEnquiries || 0}</p>
            </div>
          </div>
          <div className="mt-4 bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex justify-between">
            <span>Confirmed School Admissions:</span>
            <span className="font-extrabold text-slate-200">{stats.platformActivity?.totalAdmissions || 0}</span>
          </div>
        </div>

        {/* Colleges Card */}
        <div className="bg-slate-800/60 rounded-2xl border border-emerald-500/10 p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Colleges Registry</span>
              <p className="text-4xl font-black text-white tracking-tight">{stats.totalColleges}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
              <GraduationCap className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-6 pt-4 border-t border-slate-700/40">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Active</p>
              <p className="text-lg font-bold text-emerald-400">{stats.activeColleges}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Free Trial</p>
              <p className="text-lg font-bold text-amber-400">{stats.trialColleges}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Inactive</p>
              <p className="text-lg font-bold text-rose-500">{stats.expiredColleges}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Applications</p>
              <p className="text-lg font-bold text-cyan-400">{stats.platformActivity?.totalCollegeApplications || 0}</p>
            </div>
          </div>
          <div className="mt-4 bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex justify-between">
            <span>Confirmed College Admissions:</span>
            <span className="font-extrabold text-slate-200">{stats.platformActivity?.confirmedCollegeAdmissions || 0}</span>
          </div>
        </div>
      </div>

      {/* Segment 3: Revenue Split Breakdown */}
      <div>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Financial Summary (Separate Income Streams)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* School Revenue */}
          <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">School Income Stream</span>
                <Building2 className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-black text-white tracking-tight">{formatINR(stats.schoolTotalRevenue)}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/30 flex justify-between text-xs text-slate-400">
              <span>MRR Contribution:</span>
              <span className="font-bold text-blue-300">{formatINR(stats.schoolMonthlyRevenue)}</span>
            </div>
          </div>

          {/* College Revenue */}
          <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">College Income Stream</span>
                <GraduationCap className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-white tracking-tight">{formatINR(stats.collegeTotalRevenue)}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/30 flex justify-between text-xs text-slate-400">
              <span>MRR Contribution:</span>
              <span className="font-bold text-emerald-300">{formatINR(stats.collegeMonthlyRevenue)}</span>
            </div>
          </div>

          {/* Combined Platform Revenue */}
          <div className="bg-slate-800/40 rounded-2xl border border-indigo-500/20 p-5 shadow-lg flex flex-col justify-between bg-gradient-to-br from-slate-800/40 to-indigo-950/20">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Combined Total Revenue</span>
                <IndianRupee className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-black text-white tracking-tight">{formatINR(stats.totalRevenue)}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/30 flex justify-between text-xs text-slate-400">
              <span>Combined MRR:</span>
              <span className="font-bold text-indigo-300">{formatINR(stats.monthlyRevenue)}</span>
            </div>
          </div>

          {/* Billing Cycles & Pending Requests */}
          <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Billing Activity</span>
                <CreditCard className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white tracking-tight">{stats.completedPaymentsCount} <span className="text-xs text-slate-500 font-normal">Txns</span></p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/30 flex justify-between text-xs text-slate-400">
              <span>Approval Requests:</span>
              <span className={`font-bold ${stats.pendingSubscriptionRequests > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {stats.pendingSubscriptionRequests} Pending
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Segment 4: Graphical Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Onboarding Trends Chart */}
        <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-6 shadow-xl">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white tracking-wide">6-Month Registration Growth</h3>
            <p className="text-xs text-slate-400 mt-0.5">Institutions signup trend breakdown (Schools vs Colleges)</p>
          </div>
          
          <div className="h-64 w-full">
            {stats.monthlyTrend && stats.monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stats.monthlyTrend} margin={{ top: 10, right: -10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                    tickLine={false} 
                    axisLine={false} 
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      borderRadius: '12px', 
                      fontSize: '11px', 
                      border: '1px solid #334155', 
                      color: '#f8fafc' 
                    }} 
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="schools" name="Schools Registered" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="colleges" name="Colleges Registered" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No trend data available.</div>
            )}
          </div>
        </div>

        {/* Separated Revenue Streams Chart */}
        <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-6 shadow-xl">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white tracking-wide">Revenue Stream Split (Trend)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Separate monthly income growth comparison</p>
          </div>
          
          <div className="h-64 w-full">
            {stats.monthlyTrend && stats.monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSchoolRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCollegeRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => `₹${val/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      borderRadius: '12px', 
                      fontSize: '11px', 
                      border: '1px solid #334155', 
                      color: '#f8fafc' 
                    }} 
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="schoolRevenue" name="School Revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSchoolRev)" strokeWidth={2} />
                  <Area type="monotone" dataKey="collegeRevenue" name="College Revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorCollegeRev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No trend data available.</div>
            )}
          </div>
        </div>
      </div>

      {/* Segment 5: Recent Registrations & Action Centre */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/40 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-wide">Recent Registered Organizations</h3>
            <span className="px-2 py-0.5 bg-slate-800 text-[10px] text-indigo-400 font-bold border border-slate-700 rounded-md">Live Stream</span>
          </div>

          {stats.recentRegistrations && stats.recentRegistrations.length > 0 ? (
            <div className="space-y-3">
              {stats.recentRegistrations.map((org, index) => (
                <div key={index} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-800/80 rounded-xl border border-slate-700/30 hover:border-indigo-500/30 transition gap-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${org.institutionType === 'college' ? 'bg-emerald-600/10' : 'bg-blue-600/10'} rounded-xl flex items-center justify-center`}>
                      {org.institutionType === 'college' ? (
                        <GraduationCap className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Building2 className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-bold text-white text-sm">{org.name}</p>
                        <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md ${org.institutionType === 'college' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                          {org.institutionType || 'school'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{org.email} • {org.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 text-right">
                    <div className="text-left md:text-right">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-900 text-indigo-400 border border-slate-700">
                        {org.plan}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">
                        {org.createdAt ? new Date(org.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm font-semibold">
              No registered organizations found in the database.
            </div>
          )}
        </div>

        {/* Action Centre */}
        <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Action Centre</h3>
              <p className="text-xs text-slate-400 mt-0.5">Critical operations requiring review</p>
            </div>

            <div className="space-y-3">
              {/* Pending Approvals Widget */}
              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/30 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-rose-500/10 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">Subscription Requests</p>
                    <p className="text-[10px] text-slate-500">Needs super admin review</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-300">
                  {stats.pendingSubscriptionRequests} Pending
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-700/40 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plan Distribution</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Free Trial / Starter</span>
                <span className="font-bold text-slate-400">{stats.trialSchools + stats.trialColleges} orgs</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Premium (Pro / Enterprise)</span>
                <span className="font-bold text-indigo-400">{stats.activeSchools + stats.activeColleges} orgs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
