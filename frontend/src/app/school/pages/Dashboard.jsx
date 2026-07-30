import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/schoolApi';
import Loader from '../../../shared/components/Loader';
import Button from '../../../shared/components/Button';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, Inbox, PauseCircle, CheckCircle, XCircle, FilePlus, QrCode, Sparkles,
  ArrowRight, BookOpen, ClipboardCheck, Award, FileQuestion, Clock, TrendingUp,
  FileText, Activity, MapPin, Calendar, Zap, BarChart3, PieChart as PieIcon,
  ShieldCheck, Layers, PhoneCall, ArrowUpRight, ArrowDownRight, Filter,
  School as SchoolIcon, CheckCircle2, AlertCircle, UserCheck, MoreVertical
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';

// Updated: Slightly lighter, softer color palette
const COLORS = ['#7E63F6', '#EE5EAA', '#34D06D', '#F6A928', '#5091F8', '#25C5B5', '#9B86F8'];

// Animation Variants for Premium Staggered Effect
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

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

    window.addEventListener('crm-tasks-updated', fetchDashboardData);
    return () => {
      window.removeEventListener('crm-tasks-updated', fetchDashboardData);
    };
  }, []);

  const totalEnquiries = enquiryStats?.total || 0;
  const newEnquiriesCount = enquiryStats?.newEnquiry || 0;
  const holdEnquiriesCount = enquiryStats?.hold || 0;
  const confirmedAdmissions = enquiryStats?.confirmed || 0;
  const notInterestedCount = enquiryStats?.notInterested || 0;

  const conversionRate = totalEnquiries > 0 ? Math.round((confirmedAdmissions / totalEnquiries) * 100) : 0;
  const totalAssigned = assessmentStats?.totalAssigned || 0;
  const completedCount = assessmentStats?.completedCount || 0;
  const completionRate = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayEnquiries = useMemo(() => recentEnquiriesList.filter(e => e.saveDate === todayStr), [recentEnquiriesList, todayStr]);
  const followUpPendingCount = useMemo(() => recentEnquiriesList.filter(e => e.status === 'Hold' || e.status === 'New Enquiry').length, [recentEnquiriesList]);

  const localityMetrics = useMemo(() => {
    if (localities.length > 0 && localities[0].stats) {
      return localities.map(l => ({
        name: l.name,
        totalEnquiries: l.stats.enquiriesCount || 0,
        confirmedAdmissions: l.stats.admissionsCount || 0,
        conversionRate: l.stats.enquiriesCount > 0 ? Math.round((l.stats.admissionsCount / l.stats.enquiriesCount) * 100) : 0
      })).sort((a, b) => b.totalEnquiries - a.totalEnquiries).slice(0, 6);
    }
    const counts = {};
    recentEnquiriesList.forEach(e => {
      const locName = e.area || e.city || 'General Area';
      if (!counts[locName]) counts[locName] = { name: locName, totalEnquiries: 0, confirmedAdmissions: 0 };
      counts[locName].totalEnquiries += 1;
      if (e.status === 'Admission Confirmed') counts[locName].confirmedAdmissions += 1;
    });
    return Object.values(counts).map(l => ({ ...l, conversionRate: l.totalEnquiries > 0 ? Math.round((l.confirmedAdmissions / l.totalEnquiries) * 100) : 0 }))
      .sort((a, b) => b.totalEnquiries - a.totalEnquiries).slice(0, 6);
  }, [localities, recentEnquiriesList]);

  const topLocality = useMemo(() => {
    if (localityMetrics.length === 0) return null;
    return [...localityMetrics].sort((a, b) => b.conversionRate - a.conversionRate)[0];
  }, [localityMetrics]);

  const sourceMetrics = useMemo(() => {
    const counts = {};
    recentEnquiriesList.forEach(e => {
      const src = e.source || 'Walk-in / Direct';
      counts[src] = (counts[src] || 0) + 1;
    });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [recentEnquiriesList]);

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
      return { month: label, enquiries: inq, admissions: adm, conversion: inq > 0 ? Math.round((adm / inq) * 100) : 0 };
    });
  }, [analytics]);

  const classDemandData = useMemo(() => {
    const raw = analytics?.classDistribution || [];
    return raw.map(item => ({ class: item._id.toString().startsWith('Class') ? item._id : `Class ${item._id}`, enquiries: item.count }));
  }, [analytics]);

  const mostRequestedClass = useMemo(() => classDemandData.length > 0 ? classDemandData[0].class : 'N/A', [classDemandData]);

  if (loading) return <Loader fullPage message="Aggregating enterprise CRM analytics..." />;

  const sparkline1 = [{ v: 10 }, { v: 18 }, { v: 14 }, { v: 22 }, { v: 30 }, { v: 28 }, { v: 35 }];
  const sparkline2 = [{ v: 5 }, { v: 9 }, { v: 12 }, { v: 18 }, { v: 15 }, { v: 24 }, { v: 29 }];

  return (
    <div className="min-h-screen bg-[#F9EEF3] px-3 md:px-5 lg:px-6 pb-6 pt-0 font-sans text-gray-800">
      <motion.div
        className="max-w-[1400px] mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >

        {/* TOPBAR / HEADER - COMPACT */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl p-3 md:p-4 card-elevated border border-[#E8ECF3] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-[10px] md:gap-3 min-w-0">
            {school?.logo ? (
              <img
                src={school.logo}
                alt="Logo"
                className="h-10 w-10 rounded-lg object-contain bg-white border border-[#ECECEC] shadow-xs p-0.5 shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm border border-[#ECECEC] shadow-xs shrink-0">
                {school?.name?.charAt(0) || 'S'}
              </div>
            )}
            <div className="space-y-0.5 min-w-0 text-left">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight truncate">{school?.name || 'Dashboard Overview'}</h1>
              <p className="text-xs text-gray-500 font-medium">Pages / Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/admission-form" className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#7E63F6] to-[#9781F8] hover:shadow-md hover:shadow-[#7E63F6]/20 text-white transition-all duration-200">
              <FilePlus className="h-3.5 w-3.5 mr-1.5" /> Add Enquiry
            </Link>
            <Link to="/qr-links" className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-semibold bg-white text-gray-700 border border-[#E8ECF3] hover:bg-gray-50 hover:shadow-sm transition-all duration-200">
              <QrCode className="h-3.5 w-3.5 mr-1.5 text-[#EE5EAA]" /> QR Poster
            </Link>
            <Link to="/assessments/create" className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-semibold bg-white text-gray-700 border border-[#E8ECF3] hover:bg-gray-50 hover:shadow-sm transition-all duration-200">
              <BookOpen className="h-3.5 w-3.5 mr-1.5 text-[#34D06D]" /> New Test
            </Link>
          </div>
        </motion.div>

        {/* ROW 1: COMPACT FLOATING KPI CARDS */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-x-4 gap-y-6 pt-4">
          {[
            { title: "Today's Enquiries", value: todayEnquiries.length, desc: "Created today", spark: sparkline1, icon: Users, color: 'from-[#7E63F6] to-[#9781F8]', line: '#7E63F6' },
            { title: "Monthly Enquiries", value: totalEnquiries, desc: "Created this month", spark: sparkline2, icon: Inbox, color: 'from-[#5091F8] to-[#78AAF9]', line: '#5091F8' },
            { title: "Pending Follow-ups", value: followUpPendingCount, desc: "Follow-ups waiting", spark: sparkline1, icon: Clock, color: 'from-[#F6A928] to-[#F8C15D]', line: '#F6A928' },
            { title: "Admissions", value: confirmedAdmissions, desc: "Finalized", spark: sparkline2, icon: CheckCircle, color: 'from-[#34D06D] to-[#60DF8F]', line: '#34D06D' },
            { title: "Conversion", value: `${conversionRate}%`, desc: "Lead to admit ratio", spark: sparkline1, icon: TrendingUp, color: 'from-[#EE5EAA] to-[#F488C2]', line: '#EE5EAA' },
            { title: "Test Completion", value: `${completionRate}%`, desc: `${completedCount}/${totalAssigned} finished`, spark: sparkline2, icon: ClipboardCheck, color: 'from-[#25C5B5] to-[#53D7C9]', line: '#25C5B5' },
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)" }}
                className="bg-white rounded-xl border border-[#E8ECF3] card-elevated p-3 relative flex flex-col group"
              >
                <div className="flex justify-between items-start">
                  {/* COMPACT FLOATING ICON */}
                  <div className={`absolute -top-3 left-3 w-10 h-10 rounded-lg shadow-md flex items-center justify-center bg-gradient-to-br ${card.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="w-full text-right pl-14 pt-0.5">
                    <p className="text-[11px] font-semibold text-gray-500 mb-0.5 truncate">{card.title}</p>
                    <h4 className="text-xl font-bold text-gray-800 leading-tight">{card.value}</h4>
                  </div>
                </div>
                <hr className="my-2.5 border-[#E8ECF3]" />
                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] font-medium text-gray-400 truncate">{card.desc}</span>
                </div>
                <div className="absolute bottom-0 left-0 h-8 w-full opacity-20 group-hover:opacity-40 transition-opacity rounded-b-xl overflow-hidden pointer-events-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={card.spark}>
                      <Area type="monotone" dataKey="v" stroke={card.line} fill={card.line} strokeWidth={0} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ROW 2: CRM PIPELINE PROGRESS */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl border border-[#E8ECF3] card-elevated relative mt-6">
          <div className="absolute -top-4 left-4 right-4 px-4 py-2.5 rounded-lg shadow-md bg-gradient-to-br from-[#7E63F6] to-[#9781F8] text-white flex justify-between items-center z-10">
            <div>
              <h6 className="text-sm font-bold tracking-wide">CRM Admission Funnel Pipeline</h6>
              <p className="text-[10px] opacity-90 font-medium">Real-time stage distribution</p>
            </div>
            <Link to="/enquiries" className="text-white hover:text-gray-100 transition-colors bg-white/20 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center">
              View All <ArrowRight className="h-3 w-3 ml-1.5" />
            </Link>
          </div>

          <div className="p-4 pt-12">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Total Enquiries', count: totalEnquiries, pct: 100, color: 'bg-[#7E63F6]' },
                { label: 'New Enquiries', count: newEnquiriesCount, pct: totalEnquiries > 0 ? Math.round((newEnquiriesCount / totalEnquiries) * 100) : 0, color: 'bg-[#5091F8]' },
                { label: 'Follow Up / Hold', count: holdEnquiriesCount, pct: totalEnquiries > 0 ? Math.round((holdEnquiriesCount / totalEnquiries) * 100) : 0, color: 'bg-[#F6A928]' },
                { label: 'Confirmed Admission', count: confirmedAdmissions, pct: conversionRate, color: 'bg-[#34D06D]' },
                { label: 'Not Interested', count: notInterestedCount, pct: totalEnquiries > 0 ? Math.round((notInterestedCount / totalEnquiries) * 100) : 0, color: 'bg-[#F26464]' },
                { label: 'Active Conversion', count: `${conversionRate}%`, pct: conversionRate, color: 'bg-[#EE5EAA]' },
              ].map((stage) => (
                <div key={stage.label} onClick={() => navigate('/enquiries')} className="space-y-2 cursor-pointer group p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-500 text-xs truncate">{stage.label}</span>
                  </div>
                  <h4 className="font-bold text-xl text-gray-800">{stage.count}</h4>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(stage.pct, 2)}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                      className={`h-full rounded-full ${stage.color}`}
                    />
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium text-right">{stage.pct}% Share</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ROW 3 & 4: CHARTS */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Locality Chart */}
          <div className="bg-white rounded-xl border border-[#E8ECF3] card-elevated relative pt-12 px-5 pb-4 mt-4">
            <div className="absolute -top-4 left-4 right-4 px-4 py-2.5 rounded-lg shadow-md bg-gradient-to-br from-[#EE5EAA] to-[#F488C2] text-white flex justify-between items-center z-10">
              <div>
                <h6 className="text-sm font-bold tracking-wide">Top Performing Locality</h6>
                <p className="text-[10px] opacity-90 font-medium mt-0.5">High conversion geographic clusters</p>
              </div>
              {topLocality && (
                <span className="px-2 py-1 bg-white/20 rounded-md text-xs font-bold flex items-center shadow-sm">
                  <Award className="h-3 w-3 mr-1" /> {topLocality.name} ({topLocality.conversionRate}%)
                </span>
              )}
            </div>

            {localityMetrics.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs font-medium text-gray-400">No locality data available.</div>
            ) : (
              <div className="space-y-4">
                <div className="h-52 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={localityMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECF3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 500 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 500 }} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: '#F6F8FC' }} contentStyle={{ borderRadius: '8px', fontSize: '11px', border: '1px solid #E8ECF3', padding: '8px' }} />
                      <Bar dataKey="totalEnquiries" fill="#7E63F6" radius={[4, 4, 0, 0]} name="Enquiries" maxBarSize={30} animationDuration={1500} />
                      <Bar dataKey="confirmedAdmissions" fill="#34D06D" radius={[4, 4, 0, 0]} name="Admissions" maxBarSize={30} animationDuration={1500} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Class Demand Chart */}
          <div className="bg-white rounded-xl border border-[#E8ECF3] card-elevated relative pt-12 px-5 pb-4 mt-4">
            <div className="absolute -top-4 left-4 right-4 px-4 py-2.5 rounded-lg shadow-md bg-gradient-to-br from-[#5091F8] to-[#78AAF9] text-white flex justify-between items-center z-10">
              <div>
                <h6 className="text-sm font-bold tracking-wide">Class-Wise Demand</h6>
                <p className="text-[10px] opacity-90 font-medium mt-0.5">Enquiries breakdown by class</p>
              </div>
              <span className="px-2 py-1 bg-white/20 rounded-md text-xs font-bold shadow-sm">
                Top: {mostRequestedClass}
              </span>
            </div>

            {classDemandData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs font-medium text-gray-400">No class demand metrics.</div>
            ) : (
              <div className="h-52 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classDemandData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECF3" />
                    <XAxis dataKey="class" tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 500 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 500 }} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: '#F6F8FC' }} contentStyle={{ borderRadius: '8px', fontSize: '11px', border: '1px solid #E8ECF3', padding: '8px' }} />
                    <Bar dataKey="enquiries" fill="#F6A928" radius={[4, 4, 0, 0]} name="Enquiries" maxBarSize={30} animationDuration={1500} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </motion.div>

        {/* ROW 5: TRENDS & SOURCES */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#E8ECF3] card-elevated relative pt-12 px-5 pb-4 mt-4">
            <div className="absolute -top-4 left-4 right-4 px-4 py-2.5 rounded-lg shadow-md bg-gradient-to-br from-[#34D06D] to-[#60DF8F] text-white flex justify-between items-center z-10">
              <div>
                <h6 className="text-sm font-bold tracking-wide">Monthly Admission Trends</h6>
                <p className="text-[10px] opacity-90 font-medium mt-0.5">Enquiries vs confirmed admissions</p>
              </div>
              <div className="flex items-center space-x-3 text-[11px] font-bold bg-white/20 px-3 py-1.5 rounded-md">
                <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-white mr-1.5" /> Enquiries</span>
                <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-[#25C5B5] mr-1.5 shadow-sm" /> Admissions</span>
              </div>
            </div>

            <div className="h-56 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7E63F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7E63F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAdm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34D06D" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#34D06D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECF3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 500 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 500 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px', border: '1px solid #E8ECF3', padding: '8px' }} />
                  <Area type="monotone" dataKey="enquiries" stroke="#7E63F6" fill="url(#colorInq)" strokeWidth={2} activeDot={{ r: 4 }} animationDuration={1500} />
                  <Area type="monotone" dataKey="admissions" stroke="#34D06D" fill="url(#colorAdm)" strokeWidth={2} activeDot={{ r: 4 }} animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E8ECF3] card-elevated relative pt-12 px-5 pb-4 mt-4">
            <div className="absolute -top-4 left-4 right-4 px-4 py-2.5 rounded-lg shadow-md bg-gradient-to-br from-[#F6A928] to-[#F8C15D] text-white flex items-center z-10">
              <div>
                <h6 className="text-sm font-bold tracking-wide">Admission Sources</h6>
                <p className="text-[10px] opacity-90 font-medium mt-0.5">Inbound channel distribution</p>
              </div>
            </div>

            {sourceMetrics.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs font-medium text-gray-400">No source attributes.</div>
            ) : (
              <div className="flex flex-col h-full justify-center">
                <div className="h-40 w-full flex items-center justify-center mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sourceMetrics} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={40} paddingAngle={4} animationDuration={1500}>
                        {sourceMetrics.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px', border: '1px solid #E8ECF3', padding: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 pt-4 border-t border-[#E8ECF3] mt-2">
                  {sourceMetrics.slice(0, 4).map((src, idx) => (
                    <div key={src.name} className="flex justify-between items-center text-xs">
                      <span className="flex items-center text-gray-600 font-medium truncate pr-2">
                        <span className="h-2 w-2 rounded-full mr-2 shadow-sm shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="truncate">{src.name}</span>
                      </span>
                      <span className="font-bold text-gray-900 shrink-0">{src.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ROW 5.5: TODAY'S FOLLOW-UPS */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl border border-[#E8ECF3] card-elevated relative pt-12 px-0 pb-2 mt-8">
          <div className="absolute -top-4 left-4 right-4 px-4 py-2.5 rounded-lg shadow-md bg-gradient-to-br from-[#25C5B5] to-[#53D7C9] text-white flex justify-between items-center z-10">
            <div>
              <h6 className="text-sm font-bold tracking-wide">Today's Follow-ups Reminders</h6>
              <p className="text-[10px] opacity-90 font-medium mt-0.5">Immediate follow-up schedules</p>
            </div>
            <span className="px-2.5 py-1 bg-white/20 rounded-md text-[11px] font-bold shadow-sm">
              {todayFollowups.length} Reminders
            </span>
          </div>

          {todayFollowups.length === 0 ? (
            <div className="py-8 text-center px-6">
              <CheckCircle2 className="h-8 w-8 mx-auto text-[#34D06D] mb-2 opacity-80" />
              <p className="font-bold text-gray-800 text-sm">All Caught Up!</p>
              <p className="text-xs text-gray-500 font-medium mt-1">No pending follow-ups scheduled for today.</p>
            </div>
          ) : (
            <div className="overflow-x-auto px-4 pb-2">
              <table className="w-full text-left text-[13px] whitespace-nowrap">
                <thead className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] border-b border-[#E8ECF3]">
                  <tr>
                    <th className="px-3 py-3">Student Name</th>
                    <th className="px-3 py-3">Active Stage</th>
                    <th className="px-3 py-3">Follow-up Date</th>
                    <th className="px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8ECF3] font-medium text-gray-700">
                  {todayFollowups.map((fup) => (
                    <tr key={fup._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#7E63F6]/20 to-[#9781F8]/20 text-[#7E63F6] flex items-center justify-center text-xs font-bold mr-2.5">
                            {fup.studentName.charAt(0)}
                          </div>
                          <span className="font-bold text-gray-900">{fup.studentName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7E63F6]/10 text-[#7E63F6] uppercase tracking-wide">
                          {fup.stage}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 font-medium text-xs">
                        {new Date(fup.followUpDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button onClick={() => navigate(`/dashboard/enquiries?expand=${fup.enquiryId}`)} className="font-semibold text-xs text-[#7E63F6] hover:text-[#6a50e0] transition-colors">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* ROW 6, 7, 8: WIDGETS */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Audit Trail */}
          <div className="bg-white rounded-xl border border-[#E8ECF3] card-elevated p-4 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-[#EE5EAA]/10 text-[#EE5EAA]">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Live Audit & Activity</h3>
                <p className="text-[10px] text-gray-500 font-medium">Recent workspace actions</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              {(analytics?.recentActivity || []).length === 0 ? (
                <div className="text-xs font-medium text-gray-400 py-6 text-center">No recent activity logged.</div>
              ) : (
                (analytics?.recentActivity || []).map((act, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="mt-1 flex-shrink-0">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#7E63F6] ring-2 ring-[#7E63F6]/20" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-gray-800 truncate">{act.title || 'System Notification'}</p>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5 line-clamp-2">{act.message}</p>
                      <span className="text-[9px] font-semibold text-gray-400 block mt-1">{new Date(act.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Action Tasks */}
          <div className="bg-white rounded-xl border border-[#E8ECF3] card-elevated p-4 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-[#F6A928]/10 text-[#F6A928]">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Operational Pending</h3>
                <p className="text-[10px] text-gray-500 font-medium">Immediate action items</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Follow-Up Calls", count: followUpPendingCount, link: '/enquiries?status=Hold', color: 'bg-[#F6A928]/10 text-[#F6A928]', icon: PhoneCall },
                { label: "Assessment Evals", count: totalAssigned - completedCount, link: '/assessments', color: 'bg-[#5091F8]/10 text-[#5091F8]', icon: FileQuestion },
                { label: "Admissions to Verify", count: newEnquiriesCount, link: '/enquiries?status=New%20Enquiry', color: 'bg-[#7E63F6]/10 text-[#7E63F6]', icon: Inbox },
                { label: "QR Link Downloads", count: "Ready", link: '/qr-links', color: 'bg-[#34D06D]/10 text-[#34D06D]', icon: QrCode },
              ].map((task) => {
                const TaskIcon = task.icon;
                return (
                  <motion.div whileHover={{ scale: 1.02 }} key={task.label} onClick={() => navigate(task.link)} className="p-3 rounded-lg border border-[#E8ECF3] hover:border-[#7E63F6]/30 hover:shadow-sm cursor-pointer transition-all duration-200 flex items-center justify-between group bg-white">
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-1.5 rounded-md ${task.color}`}>
                        <TaskIcon className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-bold text-xs text-gray-700 group-hover:text-gray-900">{task.label}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-gray-100 group-hover:bg-[#7E63F6] group-hover:text-white rounded-md text-[10px] font-bold transition-colors">{task.count}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Assessment Analytics */}
          <div className="bg-white rounded-xl border border-[#E8ECF3] card-elevated p-4 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-[#5091F8]/10 text-[#5091F8]">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Assessment Engine</h3>
                <p className="text-[10px] text-gray-500 font-medium">Student evaluation status</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-gradient-to-br from-[#F6F8FC] to-white border border-[#E8ECF3] rounded-lg flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Assigned</span>
                <span className="text-xl font-black text-[#5091F8]">{totalAssigned}</span>
              </div>
              <div className="p-3.5 bg-gradient-to-br from-[#F6F8FC] to-white border border-[#E8ECF3] rounded-lg flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Completed</span>
                <span className="text-xl font-black text-[#34D06D]">{completedCount}</span>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-[#E8ECF3]">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-bold text-gray-600">Completion Rate</span>
                <span className="font-black text-gray-900">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                  className="bg-gradient-to-r from-[#5091F8] to-[#34D06D] h-full rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ROW 9: SUBSCRIPTION BANNER */}
        <motion.div variants={itemVariants} className="bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#111827] rounded-xl p-5 card-flat flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden mt-4">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-48 h-48 rounded-full bg-[#7E63F6] opacity-20 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 rounded-full bg-[#EE5EAA] opacity-20 blur-3xl pointer-events-none"></div>

          <div className="space-y-1.5 z-10">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              <h3 className="text-sm font-bold tracking-wide text-white">Subscription & Usage Meter</h3>
            </div>
            <p className="text-[11px] font-medium text-gray-400">
              Current Tier: <strong className="text-white capitalize">{school?.subscription?.plan || 'Free Trial'}</strong> • Enterprise SLA • Unlimited Enquiries
            </p>
          </div>

          <div className="flex items-center gap-4 z-10">
            <div className="text-right">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-0.5">Status</span>
              <span className="text-[11px] font-bold text-[#34D06D] flex items-center bg-[#34D06D]/10 px-2 py-0.5 rounded border border-[#34D06D]/20">
                <ShieldCheck className="h-3 w-3 mr-1" /> Active
              </span>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/settings" className="px-4 py-2 rounded-lg bg-white hover:bg-gray-50 text-gray-900 font-bold text-xs transition-all shadow-sm block">
                Manage Sub
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* ROW 10: QUICK ACTIONS DOCK */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl border border-[#E8ECF3] card-elevated p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Quick Operational Dock</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {[
              { label: 'Add Enquiry', icon: FilePlus, link: '/admission-form', color: 'text-[#7E63F6] bg-[#7E63F6]/10 hover:bg-[#7E63F6] hover:text-white' },
              { label: 'Generate QR', icon: QrCode, link: '/qr-links', color: 'text-[#5091F8] bg-[#5091F8]/10 hover:bg-[#5091F8] hover:text-white' },
              { label: 'Public Form', icon: SchoolIcon, link: `/public/admission/${school?._id}`, color: 'text-[#34D06D] bg-[#34D06D]/10 hover:bg-[#34D06D] hover:text-white', external: true },
              { label: 'Assign Test', icon: BookOpen, link: '/assessments', color: 'text-[#F6A928] bg-[#F6A928]/10 hover:bg-[#F6A928] hover:text-white' },
              { label: 'New Test', icon: FileQuestion, link: '/assessments/create', color: 'text-[#EE5EAA] bg-[#EE5EAA]/10 hover:bg-[#EE5EAA] hover:text-white' },
              { label: 'Enquiry Banner', icon: Sparkles, link: '/thank-you-cms', color: 'text-[#25C5B5] bg-[#25C5B5]/10 hover:bg-[#25C5B5] hover:text-white' },
              { label: 'Settings', icon: Filter, link: '/settings', color: 'text-gray-600 bg-gray-100 hover:bg-gray-800 hover:text-white' },
            ].map((action) => {
              const ActionIcon = action.icon;
              return action.external ? (
                <motion.a whileHover={{ y: -3 }} key={action.label} href={action.link} target="_blank" rel="noreferrer"
                  className={`p-3 rounded-lg flex flex-col items-center justify-center text-center space-y-2 transition-all duration-200 group shadow-sm hover:shadow-md ${action.color}`}>
                  <ActionIcon className="h-5 w-5" />
                  <span className="text-[11px] font-bold truncate w-full">{action.label}</span>
                </motion.a>
              ) : (
                <motion.div whileHover={{ y: -3 }} key={action.label}>
                  <Link to={action.link}
                    className={`p-3 rounded-lg flex flex-col items-center justify-center text-center space-y-2 transition-all duration-200 group shadow-sm hover:shadow-md h-full w-full ${action.color}`}>
                    <ActionIcon className="h-5 w-5" />
                    <span className="text-[11px] font-bold truncate w-full">{action.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default Dashboard;