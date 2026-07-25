import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/schoolApi';
import Loader from '../../../shared/components/Loader';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Inbox,
  PauseCircle,
  CheckCircle,
  XCircle,
  FilePlus,
  QrCode,
  Sparkles,
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Award,
  FileQuestion,
  Clock,
  TrendingUp,
  FileText,
  Activity,
  MapPin,
  Calendar,
  Zap,
  BarChart3,
  PieChart as PieIcon,
  ShieldCheck,
  Layers,
  PhoneCall,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  School as SchoolIcon,
  CheckCircle2,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard = () => {
  const { school, isTrialActive } = useAuth();
  const navigate = useNavigate();

  const [enquiryStats, setEnquiryStats] = useState(null);
  const [assessmentStats, setAssessmentStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [localities, setLocalities] = useState([]);
  const [recentEnquiriesList, setRecentEnquiriesList] = useState([]);
  const [todayFollowups, setTodayFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [resEnq, resAsm, resAnl, resLoc, resEnqList, resFollowups] = await Promise.all([
        api.get('/enquiries/stats').catch(() => ({ success: false })),
        api.get('/assessments/assignments/stats').catch(() => ({ success: false })),
        api.get('/analytics/overview').catch(() => ({ success: false })),
        api.get('/localities?type=approved&limit=50').catch(() => ({ success: false })),
        api.get('/enquiries?limit=100').catch(() => ({ success: false })),
        api.get('/enquiries/followups/today').catch(() => ({ success: false }))
      ]);

      if (resEnq.success) setEnquiryStats(resEnq.stats);
      if (resAsm.success) setAssessmentStats(resAsm.stats);
      if (resAnl.success) setAnalytics(resAnl.data);
      if (resLoc.success) setLocalities(resLoc.data || []);
      if (resEnqList.success) setRecentEnquiriesList(resEnqList.data || []);
      if (resFollowups.success) setTodayFollowups(resFollowups.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute derived calculations
  const totalEnquiries = enquiryStats?.total || 0;
  const newEnquiriesCount = enquiryStats?.newEnquiry || 0;
  const holdEnquiriesCount = enquiryStats?.hold || 0;
  const confirmedAdmissions = enquiryStats?.confirmed || 0;
  const notInterestedCount = enquiryStats?.notInterested || 0;

  const conversionRate = totalEnquiries > 0
    ? Math.round((confirmedAdmissions / totalEnquiries) * 100)
    : 0;

  const totalAssigned = assessmentStats?.totalAssigned || 0;
  const completedCount = assessmentStats?.completedCount || 0;
  const completionRate = totalAssigned > 0
    ? Math.round((completedCount / totalAssigned) * 100)
    : 0;

  // Filter Today's & Pending Follow Ups
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEnquiries = useMemo(() => {
    return recentEnquiriesList.filter(e => e.saveDate === todayStr);
  }, [recentEnquiriesList, todayStr]);

  const followUpPendingCount = useMemo(() => {
    return recentEnquiriesList.filter(e => e.status === 'Hold' || e.status === 'New Enquiry').length;
  }, [recentEnquiriesList]);

  // Locality Performance Analytics aggregation
  const localityMetrics = useMemo(() => {
    if (localities.length > 0 && localities[0].stats) {
      return localities.map(l => ({
        name: l.name,
        totalEnquiries: l.stats.enquiriesCount || 0,
        confirmedAdmissions: l.stats.admissionsCount || 0,
        conversionRate: l.stats.enquiriesCount > 0
          ? Math.round((l.stats.admissionsCount / l.stats.enquiriesCount) * 100)
          : 0
      })).sort((a, b) => b.totalEnquiries - a.totalEnquiries).slice(0, 6);
    }

    // Fallback aggregation from enquiry list
    const counts = {};
    recentEnquiriesList.forEach(e => {
      const locName = e.area || e.city || 'General Area';
      if (!counts[locName]) {
        counts[locName] = { name: locName, totalEnquiries: 0, confirmedAdmissions: 0 };
      }
      counts[locName].totalEnquiries += 1;
      if (e.status === 'Admission Confirmed') {
        counts[locName].confirmedAdmissions += 1;
      }
    });

    return Object.values(counts)
      .map(l => ({
        ...l,
        conversionRate: l.totalEnquiries > 0 ? Math.round((l.confirmedAdmissions / l.totalEnquiries) * 100) : 0
      }))
      .sort((a, b) => b.totalEnquiries - a.totalEnquiries)
      .slice(0, 6);
  }, [localities, recentEnquiriesList]);

  const topLocality = useMemo(() => {
    if (localityMetrics.length === 0) return null;
    return [...localityMetrics].sort((a, b) => b.conversionRate - a.conversionRate)[0];
  }, [localityMetrics]);

  // Source analytics breakdown
  const sourceMetrics = useMemo(() => {
    const counts = {};
    recentEnquiriesList.forEach(e => {
      const src = e.source || 'Walk-in / Direct';
      counts[src] = (counts[src] || 0) + 1;
    });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [recentEnquiriesList]);

  // Monthly trend chart data formatting
  const monthlyTrendData = useMemo(() => {
    const monthlyInq = analytics?.monthlyEnquiries || [];
    const monthlyAdm = analytics?.monthlyAdmissions || [];

    const monthsSet = new Set([...monthlyInq.map(m => m._id), ...monthlyAdm.map(m => m._id)]);
    const sortedMonths = Array.from(monthsSet).sort().slice(-6);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return sortedMonths.map(m => {
      const [year, month] = m.split('-');
      const label = `${monthNames[parseInt(month, 10) - 1]} '${year ? year.slice(2) : ''}`;
      const inq = monthlyInq.find(x => x._id === m)?.count || 0;
      const adm = monthlyAdm.find(x => x._id === m)?.count || 0;
      const rate = inq > 0 ? Math.round((adm / inq) * 100) : 0;
      return { month: label, enquiries: inq, admissions: adm, conversion: rate };
    });
  }, [analytics]);

  // Class Demand chart data
  const classDemandData = useMemo(() => {
    const raw = analytics?.classDistribution || [];
    return raw.map(item => ({
      class: item._id.toString().startsWith('Class') ? item._id : `Class ${item._id}`,
      enquiries: item.count
    }));
  }, [analytics]);

  const mostRequestedClass = useMemo(() => {
    if (classDemandData.length === 0) return 'N/A';
    return classDemandData[0].class;
  }, [classDemandData]);

  if (loading) {
    return <Loader fullPage message="Aggregating enterprise CRM analytics..." />;
  }

  // Mini Sparkline Generator Data
  const sparkline1 = [{ v: 10 }, { v: 18 }, { v: 14 }, { v: 22 }, { v: 30 }, { v: 28 }, { v: 35 }];
  const sparkline2 = [{ v: 5 }, { v: 9 }, { v: 12 }, { v: 18 }, { v: 15 }, { v: 24 }, { v: 29 }];

  return (
    <div className="space-y-6 text-left pb-12 max-w-7xl mx-auto">
      {/* HEADER BAR */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black tracking-tight text-white">
              {school?.name || 'School CRM Dashboard'}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
              isTrialActive 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              {school?.subscription?.plan || 'Free Trial'}
            </span>
          </div>
          <p className="text-slate-400 text-xs font-medium">
            Real-time SaaS Decision Engine • Locality Performance • CRM Funnel • Assessment Audit
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 z-10 flex-wrap">
          <Link
            to="/admission-form"
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20"
          >
            <FilePlus className="h-4 w-4 mr-1.5" />
            + Add Enquiry
          </Link>
          <Link
            to="/qr-links"
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <QrCode className="h-4 w-4 mr-1.5 text-indigo-400" />
            QR Poster
          </Link>
          <Link
            to="/assessments/create"
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <BookOpen className="h-4 w-4 mr-1.5 text-emerald-400" />
            New Test
          </Link>
        </div>
      </div>

      {/* ROW 1: COMPACT KPI SPARKLINE CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { title: "Today's Enquiries", value: todayEnquiries.length, trend: "+12%", spark: sparkline1, icon: Users, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
          { title: "This Month", value: totalEnquiries, trend: "+18%", spark: sparkline2, icon: Inbox, color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { title: "Pending Follow-Ups", value: followUpPendingCount, trend: "Requires Call", spark: sparkline1, icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { title: "Confirmed Admissions", value: confirmedAdmissions, trend: "+24%", spark: sparkline2, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { title: "Conversion %", value: `${conversionRate}%`, trend: "High Rate", spark: sparkline1, icon: TrendingUp, color: 'text-purple-600 bg-purple-50 border-purple-100' },
          { title: "Test Completion", value: `${completionRate}%`, trend: `${completedCount}/${totalAssigned}`, spark: sparkline2, icon: ClipboardCheck, color: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
          { title: "Active Plan", value: school?.subscription?.plan || 'Trial', trend: 'Active', spark: sparkline1, icon: ShieldCheck, color: 'text-rose-600 bg-rose-50 border-rose-100' },
          { title: "Registered Students", value: confirmedAdmissions, trend: 'Enrolled', spark: sparkline2, icon: UserCheck, color: 'text-teal-600 bg-teal-50 border-teal-100' },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              className="bg-white rounded-xl border border-slate-100 p-3 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-lg border ${card.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>

              <div className="my-2">
                <span className="text-xl font-black text-slate-800 tracking-tight block truncate">
                  {card.value}
                </span>
                <span className="text-[9px] font-semibold text-emerald-600 flex items-center mt-0.5">
                  <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />
                  {card.trend}
                </span>
              </div>

              {/* Sparkline Graph */}
              <div className="h-6 w-full opacity-60 group-hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={card.spark}>
                    <Area type="monotone" dataKey="v" stroke="#6366f1" fill="#818cf8" fillOpacity={0.2} strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ROW 2: CRM PIPELINE PROGRESS BARS */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-indigo-600" />
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              CRM Admission Funnel Pipeline
            </h3>
          </div>
          <Link to="/enquiries" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center">
            View All Enquiries <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: 'Total Enquiries', count: totalEnquiries, pct: 100, color: 'bg-indigo-600', text: 'text-indigo-700', bg: 'bg-indigo-50', link: '/enquiries' },
            { label: 'New Enquiries', count: newEnquiriesCount, pct: totalEnquiries > 0 ? Math.round((newEnquiriesCount / totalEnquiries) * 100) : 0, color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', link: '/enquiries?status=New%20Enquiry' },
            { label: 'Follow Up / Hold', count: holdEnquiriesCount, pct: totalEnquiries > 0 ? Math.round((holdEnquiriesCount / totalEnquiries) * 100) : 0, color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', link: '/enquiries?status=Hold' },
            { label: 'Confirmed Admission', count: confirmedAdmissions, pct: conversionRate, color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', link: '/enquiries?status=Admission%20Confirmed' },
            { label: 'Not Interested', count: notInterestedCount, pct: totalEnquiries > 0 ? Math.round((notInterestedCount / totalEnquiries) * 100) : 0, color: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50', link: '/enquiries?status=Not%20Interested' },
            { label: 'Active Conversion', count: `${conversionRate}%`, pct: conversionRate, color: 'bg-purple-600', text: 'text-purple-700', bg: 'bg-purple-50', link: '/enquiries' },
          ].map((stage) => (
            <div
              key={stage.label}
              onClick={() => navigate(stage.link)}
              className={`p-3 rounded-xl border border-slate-100 ${stage.bg} cursor-pointer hover:shadow-md transition-all space-y-2`}
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 text-[11px] truncate">{stage.label}</span>
                <span className={`font-black text-xs ${stage.text}`}>{stage.count}</span>
              </div>

              <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-slate-100">
                <div className={`h-full rounded-full transition-all duration-500 ${stage.color}`} style={{ width: `${Math.max(stage.pct, 5)}%` }} />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>Stage Share</span>
                <span>{stage.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ROW 3 & ROW 4: LOCALITY PERFORMANCE & CLASS DEMAND */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROW 3: Locality Performance Analytics */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Top Performing Locality Analytics
                </h3>
                <p className="text-[10px] text-slate-400">High conversion geographic clusters</p>
              </div>
            </div>
            {topLocality && (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold flex items-center">
                <Award className="h-3 w-3 mr-1" />
                Best: {topLocality.name} ({topLocality.conversionRate}%)
              </span>
            )}
          </div>

          {localityMetrics.length === 0 ? (
            <div className="h-56 flex items-center justify-center border border-dashed border-slate-100 rounded-xl text-xs text-slate-400">
              No locality data logged yet. Add addresses in enquiries to enable location intelligence.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={localityMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                    <Bar dataKey="totalEnquiries" fill="#6366f1" radius={[4, 4, 0, 0]} name="Enquiries" />
                    <Bar dataKey="confirmedAdmissions" fill="#10b981" radius={[4, 4, 0, 0]} name="Admissions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-50">
                {localityMetrics.slice(0, 3).map((loc) => (
                  <div key={loc.name} className="p-2 bg-slate-50 rounded-lg text-xs space-y-0.5">
                    <span className="font-bold text-slate-700 truncate block text-[11px]">{loc.name}</span>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Admissions: <strong>{loc.confirmedAdmissions}</strong></span>
                      <span className="text-emerald-600 font-bold">{loc.conversionRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ROW 4: Class Demand Analytics */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Class-Wise Demand Analytics
                </h3>
                <p className="text-[10px] text-slate-400">Enquiries breakdown across grade levels</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-bold">
              Highest: {mostRequestedClass}
            </span>
          </div>

          {classDemandData.length === 0 ? (
            <div className="h-56 flex items-center justify-center border border-dashed border-slate-100 rounded-xl text-xs text-slate-400">
              No class demand metrics recorded.
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classDemandData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="class" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                  <Bar dataKey="enquiries" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Enquiries" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ROW 5: MONTHLY ADMISSION TRENDS & SOURCE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trends Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Monthly Admission Trends
                </h3>
                <p className="text-[10px] text-slate-400">Comparing monthly parent enquiries vs confirmed admissions</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-xs font-semibold">
              <span className="flex items-center text-indigo-600">
                <span className="h-2 w-2 rounded-full bg-indigo-600 mr-1" /> Enquiries
              </span>
              <span className="flex items-center text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-600 mr-1" /> Admissions
              </span>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAdm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="enquiries" stroke="#6366f1" fillOpacity={1} fill="url(#colorInq)" strokeWidth={2} />
                <Area type="monotone" dataKey="admissions" stroke="#10b981" fillOpacity={1} fill="url(#colorAdm)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Admission Source Analytics Pie */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <PieIcon className="h-4 w-4 text-blue-600" />
            <div>
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Admission Source Analytics
              </h3>
              <p className="text-[10px] text-slate-400">Inbound channel distribution</p>
            </div>
          </div>

          {sourceMetrics.length === 0 ? (
            <div className="h-48 flex items-center justify-center border border-dashed border-slate-100 rounded-xl text-xs text-slate-400">
              No source attributes recorded.
            </div>
          ) : (
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceMetrics} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35} paddingAngle={4}>
                    {sourceMetrics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="space-y-1.5 pt-2 border-t border-slate-50">
            {sourceMetrics.slice(0, 4).map((src, idx) => (
              <div key={src.name} className="flex justify-between items-center text-xs">
                <span className="flex items-center text-slate-600 font-medium">
                  <span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  {src.name}
                </span>
                <span className="font-extrabold text-slate-800">{src.value}</span>
              </div>
            ))}
        </div>
      </div>
    </div>

    {/* ROW 5.5: Today's Follow-ups CRM Widget */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4 text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PhoneCall className="h-4.5 w-4.5 text-indigo-650" />
            <div>
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Today's Follow-ups Reminders
              </h3>
              <p className="text-[10px] text-slate-400">Immediate follow-up schedules mapped from the admission pipeline stages</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-bold">
            {todayFollowups.length} Reminders
          </span>
        </div>

        {todayFollowups.length === 0 ? (
          <div className="py-8 text-center text-slate-400 border border-dashed border-slate-100 rounded-xl">
            <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
            <p className="font-semibold text-slate-500 text-xs">All Caught Up!</p>
            <p className="text-[10px] text-slate-400">No pending follow-ups scheduled for today.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Active Stage</th>
                  <th className="px-4 py-3">Follow-up Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-55 font-semibold text-slate-700">
                {todayFollowups.map((fup) => (
                  <tr key={fup._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{fup.studentName}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                        {fup.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(fup.followUpDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="primary"
                        onClick={() => navigate(`/dashboard/enquiries?expand=${fup.enquiryId}`)}
                        className="h-8 px-3 text-[10px] font-bold shadow-xs bg-[#4F46E5] hover:bg-[#4338CA] text-white border-transparent rounded-lg"
                      >
                        View Enquiry
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ROW 6, 7, 8: RECENT ACTIVITY, PENDING TASKS, ASSESSMENT ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ROW 6: Audit Trail & Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-rose-600" />
            <div>
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Live Audit & Activity Trail
              </h3>
              <p className="text-[10px] text-slate-400">Recent workspace actions</p>
            </div>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {(analytics?.recentActivity || []).length === 0 ? (
              <div className="text-xs text-slate-400 py-8 text-center border border-dashed border-slate-100 rounded-xl">
                No recent activity logged.
              </div>
            ) : (
              (analytics?.recentActivity || []).map((act, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100/60 text-xs">
                  <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600 shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-700 truncate">{act.title || 'System Notification'}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{act.message}</p>
                    <span className="text-[9px] text-slate-400 block mt-1">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ROW 7: Pending Action Tasks */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <div>
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Operational Pending Tasks
              </h3>
              <p className="text-[10px] text-slate-400">Immediate action items for staff</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              { label: "Today's Follow-Up Calls", count: followUpPendingCount, link: '/enquiries?status=Hold', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: PhoneCall },
              { label: "Pending Assessment Evaluations", count: totalAssigned - completedCount, link: '/assessments', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: FileQuestion },
              { label: "New Admissions to Verify", count: newEnquiriesCount, link: '/enquiries?status=New%20Enquiry', color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: Inbox },
              { label: "QR Link Downloads", count: "Ready", link: '/qr-links', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: QrCode },
            ].map((task) => {
              const TaskIcon = task.icon;
              return (
                <div
                  key={task.label}
                  onClick={() => navigate(task.link)}
                  className={`p-3 rounded-xl border ${task.color} flex items-center justify-between cursor-pointer hover:shadow-md transition-all`}
                >
                  <div className="flex items-center space-x-2.5">
                    <TaskIcon className="h-4 w-4 shrink-0" />
                    <span className="font-bold text-xs">{task.label}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-white text-slate-800 rounded-md text-xs font-black shadow-2xs">
                    {task.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ROW 8: Assessment Engine Analytics */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <Award className="h-4 w-4 text-indigo-600" />
            <div>
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Assessment Performance Engine
              </h3>
              <p className="text-[10px] text-slate-400">Student evaluation status</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <span className="text-[10px] text-indigo-600 uppercase font-extrabold block">Assigned</span>
              <span className="text-xl font-black text-indigo-900">{totalAssigned}</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-emerald-600 uppercase font-extrabold block">Completed</span>
              <span className="text-xl font-black text-emerald-900">{completedCount}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-50">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-500">Overall Completion Rate</span>
              <span className="font-bold text-slate-800">{completionRate}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ROW 9: SUBSCRIPTION & RESOURCE USAGE */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-extrabold tracking-wide uppercase text-white">
              Subscription & Usage Meter
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            Current Tier: <strong className="text-amber-400 capitalize">{school?.subscription?.plan || 'Free Trial'}</strong> • Standard Enterprise SLA • Unlimited Enquiries & Locality Mapping
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Status</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Active
            </span>
          </div>
          <Link
            to="/settings"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20"
          >
            Manage Subscription
          </Link>
        </div>
      </div>

      {/* ROW 10: QUICK ACTIONS DOCK */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
          Quick Operational Dock
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {[
            { label: 'Add Enquiry', icon: FilePlus, link: '/admission-form', color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' },
            { label: 'Generate QR', icon: QrCode, link: '/qr-links', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
            { label: 'Public Form', icon: SchoolIcon, link: `/public/admission/${school?._id}`, color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100', external: true },
            { label: 'Assign Test', icon: BookOpen, link: '/assessments', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
            { label: 'New Test', icon: FileQuestion, link: '/assessments/create', color: 'text-amber-600 bg-amber-50 hover:bg-amber-100' },
            { label: 'Enquiry Banner', icon: Sparkles, link: '/thank-you-cms', color: 'text-rose-600 bg-rose-50 hover:bg-rose-100' },
            { label: 'Settings', icon: Filter, link: '/settings', color: 'text-slate-600 bg-slate-100 hover:bg-slate-200' },
          ].map((action) => {
            const ActionIcon = action.icon;
            return action.external ? (
              <a
                key={action.label}
                href={action.link}
                target="_blank"
                rel="noreferrer"
                className={`p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center space-y-1.5 transition-all hover:shadow-sm ${action.color}`}
              >
                <ActionIcon className="h-4 w-4" />
                <span className="text-[11px] font-bold truncate w-full">{action.label}</span>
              </a>
            ) : (
              <Link
                key={action.label}
                to={action.link}
                className={`p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center space-y-1.5 transition-all hover:shadow-sm ${action.color}`}
              >
                <ActionIcon className="h-4 w-4" />
                <span className="text-[11px] font-bold truncate w-full">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
