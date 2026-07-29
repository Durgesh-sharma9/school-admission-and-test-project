import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../school/contexts/AuthContext';
import Loader from '../../../shared/components/Loader';
import api from '../../school/services/schoolApi';
import toast from 'react-hot-toast';
import {
  ClipboardList,
  Clock,
  FileText,
  UserCheck,
  CheckCircle,
  Compass,
  DollarSign,
  PhoneCall,
  CheckCircle2,
  Calendar,
  Layers,
  QrCode,
  Plus,
  Users,
  Activity,
  Award,
  BookOpen,
  ChevronRight,
  TrendingUp,
  FileCheck,
  AlertCircle,
  HelpCircle,
  FileSpreadsheet,
  Settings,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';

const CHART_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

const Dashboard = () => {
  const { school } = useAuth();
  const navigate = useNavigate();

  // Loading & Data States
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [todayFollowups, setTodayFollowups] = useState([]);

  // Fetch Dashboard Analytics (Backend stats)
  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/college/dashboard/analytics');
      if (response.success) {
        setAnalyticsData(response.data);
      }
    } catch (error) {
      console.error('Failed to load college analytics:', error);
      toast.error(error.message || 'Failed to load college analytics');
    }
  };

  // Fetch Full Applications (for local dashboard metrics compilation)
  const fetchApplications = async () => {
    try {
      const response = await api.get('/college/applications');
      if (response.success) {
        setApplications(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load college applications:', error);
    }
  };

  // Fetch Today's Follow-ups
  const fetchTodayFollowups = async () => {
    try {
      const res = await api.get('/college/applications?todayFollowups=true');
      if (res.success) {
        const mapped = res.data.map(app => {
          const activeIndex = (app.journey || []).findIndex(s => !s.completedAt);
          const activeStage = activeIndex !== -1 ? app.journey[activeIndex] : null;
          return {
            _id: app._id,
            studentName: app.studentName,
            applicationId: app.applicationId,
            stage: activeStage ? activeStage.stage : app.stage,
            followUpDate: activeStage ? activeStage.followUpDate : null
          };
        });
        setTodayFollowups(mapped);
      }
    } catch (error) {
      console.error('Failed to load today followups:', error);
    }
  };

  // Aggregated Initializer
  const initDashboard = async () => {
    setLoading(true);
    await Promise.all([
      fetchDashboardData(),
      fetchApplications(),
      fetchTodayFollowups()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    initDashboard();

    const handleUpdate = () => {
      fetchDashboardData();
      fetchApplications();
      fetchTodayFollowups();
    };

    window.addEventListener('crm-tasks-updated', handleUpdate);
    return () => {
      window.removeEventListener('crm-tasks-updated', handleUpdate);
    };
  }, []);

  // Compute metrics dynamically from full applications array
  const computedMetrics = useMemo(() => {
    if (!applications || applications.length === 0) {
      return {
        todayApps: 0,
        thisMonthApps: 0,
        confirmedCount: 0,
        conversionPercent: '0%',
        entranceTestCount: 0,
        registeredCount: 0,
        funnel: {
          applications: 0,
          docVerification: 0,
          counselling: 0,
          deptAssigned: 0,
          feePending: 0,
          confirmed: 0,
          notInterested: 0
        },
        todayCounsellingList: [],
        pendingDocsList: [],
        monthlyTrends: [],
        topCourses: [],
        sortedActivities: [],
        opTodayCalls: 0,
        opPendingCounselling: 0,
        opPendingFee: 0,
        opPendingVerification: 0,
        opEntranceToday: 0
      };
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    let todayApps = 0;
    let thisMonthApps = 0;
    let confirmedCount = 0;
    let entranceTestCount = 0;
    let registeredCount = 0;

    // Funnel stages counters
    let funnelApplications = applications.length;
    let funnelDocVerification = 0;
    let funnelCounselling = 0;
    let funnelDeptAssigned = 0;
    let funnelFeePending = 0;
    let funnelConfirmed = 0;
    let funnelNotInterested = 0;

    // Today's Counselling Table List
    const todayCounsellingList = [];

    // Pending Documents Table List
    const pendingDocsList = [];

    // Operational Metrics
    let opTodayCalls = 0;
    let opPendingCounselling = 0;
    let opPendingFee = 0;
    let opPendingVerification = 0;
    let opEntranceToday = 0;

    // Monthly trends (past 6 months)
    const monthlyDataMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString(undefined, { month: 'short' });
      monthlyDataMap[label] = { month: label, Applications: 0, Admissions: 0, Rejected: 0, sortKey: d.getTime() };
    }

    // Top Courses tracking
    const courseMap = {};

    // Activities Feed list
    const activityFeed = [];

    applications.forEach(app => {
      const appDate = new Date(app.createdAt);

      // KPI counts
      if (appDate >= startOfToday) todayApps++;
      if (appDate >= startOfThisMonth) thisMonthApps++;
      if (app.stage === 'Admission Confirmed') confirmedCount++;
      if (app.entranceExam && app.entranceExam.trim() !== '') entranceTestCount++;
      if (app.paymentStatus === 'Verified') registeredCount++;

      // Funnel mapping (based on college stage definitions)
      if (app.stage === 'Admission Confirmed') {
        funnelConfirmed++;
      } else if (app.stage === 'Rejected') {
        funnelNotInterested++;
      } else if (app.stage === 'Documents Verified') {
        funnelDocVerification++;
      } else if (app.stage === 'Counselling Assigned' || app.stage === 'Call Scheduled' || app.stage === 'Call Completed' || app.stage === 'Campus Visit') {
        funnelCounselling++;
      } else if (app.stage === 'Documents Pending') {
        funnelDocVerification++; // document processing funnel
      }

      // If department or course is assigned
      if (app.departmentId) {
        funnelDeptAssigned++;
      }

      // Fee pending condition
      if (app.paymentStatus === 'Pending' && (app.stage === 'Selected' || app.stage === 'Documents Verified')) {
        funnelFeePending++;
      }

      // Today's calls & counselling checks
      (app.journey || []).forEach(stage => {
        const stageDate = new Date(stage.followUpDate || stage.createdAt);
        const isToday = stageDate >= startOfToday && stageDate <= endOfToday;

        if (isToday) {
          if (stage.stage === 'Call') opTodayCalls++;
          if (stage.stage === 'Counselling Session') opEntranceToday++; // counselling schedules today
        }

        // Check for today's active counselling session
        if (stage.stage === 'Counselling Session' && stage.followUpDate) {
          const followUpTime = new Date(stage.followUpDate);
          if (followUpTime >= startOfToday && followUpTime <= endOfToday && !stage.completedAt && stage.status !== 'Completed') {
            todayCounsellingList.push({
              _id: app._id,
              studentName: app.studentName,
              course: app.courseId?.name || 'BCA',
              counselor: stage.createdBy || 'Admissions Counselor',
              time: followUpTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
              status: stage.status || 'Scheduled'
            });
          }
        }
      });

      // Operational panel counters
      if (app.stage === 'Counselling Assigned' || app.stage === 'Call Scheduled') opPendingCounselling++;
      if (app.paymentStatus === 'Pending' && app.stage !== 'Rejected') opPendingFee++;
      if (app.stage === 'Documents Pending') opPendingVerification++;
      if (app.entranceExam && app.entranceScore === undefined && app.stage !== 'Rejected') opEntranceToday++;

      // Pending Documents lists
      const missingDocs = (app.documents || []).filter(d => d.status === 'Pending').map(d => d.name);
      if (missingDocs.length > 0 && app.stage === 'Documents Pending') {
        const days = Math.floor((now.getTime() - appDate.getTime()) / (24 * 60 * 60 * 1000));
        pendingDocsList.push({
          _id: app._id,
          studentName: app.studentName,
          missingDocs: missingDocs.slice(0, 3).join(', ') + (missingDocs.length > 3 ? '...' : ''),
          daysPending: days > 0 ? days : 0
        });
      }

      // Fill monthly trends
      const monthLabel = appDate.toLocaleDateString(undefined, { month: 'short' });
      if (monthlyDataMap[monthLabel]) {
        monthlyDataMap[monthLabel].Applications++;
        if (app.stage === 'Admission Confirmed') {
          monthlyDataMap[monthLabel].Admissions++;
        }
        if (app.stage === 'Rejected') {
          monthlyDataMap[monthLabel].Rejected++;
        }
      }

      // Course RANK counters
      if (app.courseId && app.courseId.name) {
        const cName = app.courseId.name;
        courseMap[cName] = (courseMap[cName] || 0) + 1;
      }

      // Activity Feed extraction
      activityFeed.push({
        id: `${app._id}-reg`,
        type: 'Application Created',
        detail: `Application ${app.applicationId} registered for ${app.studentName}`,
        time: appDate
      });

      (app.journey || []).forEach(stage => {
        let type = 'Application Updated';
        if (stage.status === 'Completed' || stage.completedAt) {
          if (stage.stage === 'Admission Confirmed') type = 'Admission Confirmed';
          else if (stage.stage === 'Counselling Session') type = 'Counselling Scheduled';
          else if (stage.stage === 'Registration Fee') type = 'Fee Received';
          else if (stage.stage === 'Documents Submitted') type = 'Document Uploaded';
        }
        activityFeed.push({
          id: `${app._id}-${stage._id || Math.random()}`,
          type,
          detail: `${stage.stage}: ${stage.notes || 'Status updated'}`,
          time: new Date(stage.completedAt || stage.createdAt || app.createdAt)
        });
      });
    });

    // Formatting outputs
    const conversionPercent = applications.length > 0
      ? ((confirmedCount / applications.length) * 100).toFixed(1) + '%'
      : '0%';

    const monthlyTrends = Object.values(monthlyDataMap).sort((a, b) => a.sortKey - b.sortKey);

    const topCourses = Object.entries(courseMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const sortedActivities = activityFeed
      .sort((a, b) => b.time - a.time)
      .slice(0, 10);

    return {
      todayApps,
      thisMonthApps,
      confirmedCount,
      conversionPercent,
      entranceTestCount,
      registeredCount,
      funnel: {
        applications: funnelApplications,
        docVerification: Math.max(funnelDocVerification, confirmedCount),
        counselling: funnelCounselling,
        deptAssigned: funnelDeptAssigned,
        feePending: funnelFeePending,
        confirmed: funnelConfirmed,
        notInterested: funnelNotInterested
      },
      todayCounsellingList,
      pendingDocsList: pendingDocsList.slice(0, 5),
      monthlyTrends,
      topCourses,
      sortedActivities,
      opTodayCalls: Math.max(opTodayCalls, todayFollowups.length),
      opPendingCounselling,
      opPendingFee,
      opPendingVerification,
      opEntranceToday
    };
  }, [applications, todayFollowups]);

  if (loading) {
    return <Loader message="Aggregating premium college CRM metrics..." />;
  }

  // Fallback structures if charts are completely empty
  const stats = analyticsData?.stats || {
    totalApplications: applications.length,
    todayApplications: computedMetrics.todayApps,
    confirmedAdmissions: computedMetrics.confirmedCount
  };

  const courseDistribution = analyticsData?.courseDistribution || [];
  const leadSourceDistribution = analyticsData?.leadSourceDistribution || [];

  return (
    <div className="space-y-6 text-left max-w-[1600px] mx-auto pb-12">
      
      {/* ==================== HEADER SECTION ==================== */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
              {school?.name || 'Global College'}
            </h2>
            <span className="bg-purple-50 text-purple-700 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-purple-100 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-purple-600 animate-pulse" />
              Free Trial
            </span>
          </div>
          <p className="text-slate-500 text-xs font-semibold mt-1">
            Real-time College Admission CRM & Pipeline • Applications • Counselling • Departments • Admissions
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/college/admission-form')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/10 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Application
          </button>
          <button
            onClick={() => navigate('/college/qr-links')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <QrCode className="h-4 w-4 text-slate-550" />
            QR Poster
          </button>
          <button
            onClick={() => navigate('/college/counselling')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Calendar className="h-4 w-4 text-slate-550" />
            New Entrance Test
          </button>
        </div>
      </div>

      {/* ==================== ROW 1: 8 COMPACT KPI CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {[
          { title: "Today's Apps", val: computedMetrics.todayApps, desc: "Applications today", icon: Clock, trend: "+12% vs yesterday", color: "indigo" },
          { title: "This Month Apps", val: computedMetrics.thisMonthApps, desc: "Applications month", trend: "+8% vs last month", icon: ClipboardList, color: "purple" },
          { title: "Today Follow-ups", val: todayFollowups.length, desc: "Actionable tasks", trend: "0 overdue tasks", icon: PhoneCall, color: "amber" },
          { title: "Confirmed Adm", val: computedMetrics.confirmedCount, desc: "Admissions finalized", trend: "+5 new today", icon: CheckCircle2, color: "emerald" },
          { title: "Conversion %", val: computedMetrics.conversionPercent, desc: "Admissions/Apps", trend: "Steady conversion", icon: TrendingUp, color: "fuchsia" },
          { title: "Entrance Tests", val: computedMetrics.entranceTestCount, desc: "Tests registered", trend: "14 scheduled today", icon: FileText, color: "cyan" },
          { title: "Active Plan", val: school?.subscription?.plan?.toUpperCase() || "FREE TRIAL", desc: "Enterprise plan", trend: "Pro version features", icon: Award, color: "purple" },
          { title: "Registered Std", val: computedMetrics.registeredCount, desc: "Paid registration fees", trend: "Verified students", icon: Users, color: "indigo" }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-[0_4px_20px_rgb(0,0,0,0.01)] hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-slate-400 leading-none truncate max-w-[80%]">{kpi.title}</span>
                <span className={`h-6 w-6 rounded-lg bg-${kpi.color}-50 text-${kpi.color}-600 flex items-center justify-center shrink-0`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="mt-3">
                <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none">{kpi.val}</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-tight">{kpi.desc}</p>
                <div className="mt-2.5 pt-2 border-t border-slate-50 flex items-center gap-1 text-[8px] font-bold text-slate-550">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span className="truncate">{kpi.trend}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ==================== ROW 2: ADMISSION FUNNEL ==================== */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-purple-500 animate-bounce" />
          Horizontal Admission Funnel & Pipeline
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {[
            { stage: 'Applications', count: computedMetrics.funnel.applications, color: 'bg-purple-600' },
            { stage: 'Doc Verification', count: computedMetrics.funnel.docVerification, color: 'bg-indigo-600' },
            { stage: 'Counselling Scheduled', count: computedMetrics.funnel.counselling, color: 'bg-pink-600' },
            { stage: 'Department Assigned', count: computedMetrics.funnel.deptAssigned, color: 'bg-fuchsia-600' },
            { stage: 'Fee Pending', count: computedMetrics.funnel.feePending, color: 'bg-amber-600' },
            { stage: 'Admission Confirmed', count: computedMetrics.funnel.confirmed, color: 'bg-emerald-600' },
            { stage: 'Not Interested', count: computedMetrics.funnel.notInterested, color: 'bg-rose-600' }
          ].map((item, idx) => {
            const percentage = computedMetrics.funnel.applications > 0
              ? Math.round((item.count / computedMetrics.funnel.applications) * 100)
              : 0;

            return (
              <div key={idx} className="relative p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-500 tracking-tight leading-tight uppercase block max-w-[70%]">{item.stage}</span>
                  <span className="text-[11px] font-black text-slate-800">{percentage}%</span>
                </div>
                <div className="mt-2.5">
                  <span className="text-base font-extrabold text-slate-850 block">{item.count}</span>
                  <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">Applicants</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className={`${item.color} h-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                {idx < 6 && (
                  <div className="hidden lg:block absolute -right-3 top-[40%] z-10 text-slate-300">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================== ROW 3: CHARTS ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Applications by Course */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
          <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <BookOpen className="h-4.5 w-4.5 text-purple-500" />
            Applications by Course
          </h3>
          <div className="h-72">
            {courseDistribution.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4">
                <AlertCircle className="h-8 w-8 text-slate-300 mb-1.5" />
                <span className="text-xs font-bold uppercase tracking-wider">No active courses configured</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                  <XAxis dataKey="code" stroke="#94a3b8" fontSize={10} fontStyle="bold" />
                  <YAxis stroke="#94a3b8" fontSize={10} fontStyle="bold" />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgb(0,0,0,0.05)' }} />
                  <Bar dataKey="count" fill="#818cf8" radius={[6, 6, 0, 0]} barSize={36}>
                    {courseDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Lead Source Analytics */}
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
          <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <TrendingUp className="h-4.5 w-4.5 text-purple-500" />
            Application Source Analytics
          </h3>
          <div className="h-72 flex items-center justify-center relative">
            {leadSourceDistribution.length === 0 ? (
              <div className="text-slate-400 text-xs flex flex-col items-center justify-center p-4">
                <AlertCircle className="h-8 w-8 text-slate-300 mb-1.5" />
                <span className="text-xs font-bold uppercase tracking-wider">No lead source statistics</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadSourceDistribution}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {leadSourceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ==================== ROW 4: TRENDS & TOP COURSES ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Admission Trends */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
          <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Activity className="h-4.5 w-4.5 text-purple-500" />
            Monthly Admission Trends
          </h3>
          <div className="h-72">
            {computedMetrics.monthlyTrends.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4">
                <AlertCircle className="h-8 w-8 text-slate-300 mb-1.5" />
                <span className="text-xs font-bold uppercase tracking-wider">No trend timeline registered</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={computedMetrics.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="Applications" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Admissions" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Rejected" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Performing Courses Rank Cards */}
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
          <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Award className="h-4.5 w-4.5 text-purple-500" />
            Top Performing Courses
          </h3>
          <div className="space-y-3.5 h-72 overflow-y-auto pr-1">
            {computedMetrics.topCourses.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4">
                <Award className="h-8 w-8 text-slate-300 mb-1.5" />
                <span className="text-xs font-bold uppercase tracking-wider">No course ranking stats</span>
              </div>
            ) : (
              computedMetrics.topCourses.map((course, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all">
                  <div className="flex items-center space-x-3">
                    <span className={`h-6 w-6 rounded-lg text-xs font-black flex items-center justify-center ${
                      idx === 0 ? 'bg-purple-100 text-purple-700' :
                      idx === 1 ? 'bg-indigo-100 text-indigo-700' :
                      'bg-slate-150 text-slate-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-850 truncate max-w-[150px]">{course.name}</span>
                  </div>
                  <span className="text-xs font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                    {course.count} applications
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ==================== ROW 5: TODAY'S COUNSELLING SCHEDULE ==================== */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Calendar className="h-4.5 w-4.5 text-purple-500" />
          Today's Counselling Schedule
        </h3>
        <div className="overflow-x-auto border border-slate-50 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Counsellor</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {computedMetrics.todayCounsellingList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No counselling sessions scheduled for today
                  </td>
                </tr>
              ) : (
                computedMetrics.todayCounsellingList.map((c, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 text-xs transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-850">{c.studentName}</td>
                    <td className="py-3 px-4 font-semibold text-slate-500">{c.course}</td>
                    <td className="py-3 px-4 text-slate-600 font-semibold">{c.counselor}</td>
                    <td className="py-3 px-4 font-black text-purple-600">{c.time}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full font-black text-[9px] uppercase border tracking-wider ${
                        c.status === 'Completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        c.status === 'Cancelled' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                        'bg-purple-50 border-purple-200 text-purple-700'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate(`/college/counselling?expand=${c._id}`)}
                        className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-black rounded-lg transition-colors cursor-pointer text-[10px] uppercase border border-purple-200"
                      >
                        Launch
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== ROW 6: PENDING DOCUMENTS ==================== */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <FileCheck className="h-4.5 w-4.5 text-purple-500" />
          Pending Documents verification
        </h3>
        <div className="overflow-x-auto border border-slate-50 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Missing Documents</th>
                <th className="py-3 px-4 text-center">Days Pending</th>
                <th className="py-3 px-4 text-right">View</th>
              </tr>
            </thead>
            <tbody>
              {computedMetrics.pendingDocsList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                    All document verifications are up-to-date
                  </td>
                </tr>
              ) : (
                computedMetrics.pendingDocsList.map((d, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 text-xs transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-850">{d.studentName}</td>
                    <td className="py-3 px-4 font-semibold text-rose-600 bg-rose-50/20 px-2 py-0.5 rounded border border-rose-100 max-w-sm truncate inline-block mt-2">
                      {d.missingDocs}
                    </td>
                    <td className="py-3 px-4 text-center font-black text-slate-600">{d.daysPending} days</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate(`/college/documents?expand=${d._id}`)}
                        className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-lg transition-colors cursor-pointer text-[10px] uppercase border border-slate-200"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== ROW 7: OPERATIONAL PANEL ==================== */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Activity className="h-4.5 w-4.5 text-purple-500 animate-pulse" />
          Operational CRM Status Panel
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { title: "Today's Calls", val: computedMetrics.opTodayCalls, color: "border-indigo-100 bg-indigo-50/20 text-indigo-700" },
            { title: "Pending Counselling", val: computedMetrics.opPendingCounselling, color: "border-purple-100 bg-purple-50/20 text-purple-700" },
            { title: "Pending Fee Collection", val: computedMetrics.opPendingFee, color: "border-amber-100 bg-amber-50/20 text-amber-700" },
            { title: "Pending Verification", val: computedMetrics.opPendingVerification, color: "border-pink-100 bg-pink-50/20 text-pink-700" },
            { title: "Entrance Tests Today", val: computedMetrics.opEntranceToday, color: "border-emerald-100 bg-emerald-50/20 text-emerald-700" }
          ].map((op, idx) => (
            <div key={idx} className={`p-4 border rounded-xl flex flex-col justify-between ${op.color} shadow-xs`}>
              <span className="text-[10px] font-bold uppercase tracking-tight block">{op.title}</span>
              <span className="text-3xl font-black block mt-3">{op.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ==================== ROW 8: RECENT ACTIVITIES ==================== */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Activity className="h-4.5 w-4.5 text-purple-500" />
          Recent Campus Activities Log
        </h3>
        <div className="space-y-4 max-h-72 overflow-y-auto pr-2 divide-y divide-slate-50">
          {computedMetrics.sortedActivities.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">No recent actions recorded.</div>
          ) : (
            computedMetrics.sortedActivities.map((act, idx) => (
              <div key={act.id} className="flex items-start gap-4.5 pt-3.5 first:pt-0">
                <span className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  act.type === 'Admission Confirmed' ? 'bg-emerald-50 border border-emerald-150 text-emerald-700' :
                  act.type === 'Counselling Scheduled' ? 'bg-purple-50 border border-purple-150 text-purple-700' :
                  act.type === 'Fee Received' ? 'bg-amber-50 border border-amber-150 text-amber-700' :
                  act.type === 'Document Uploaded' ? 'bg-blue-50 border border-blue-150 text-blue-700' :
                  'bg-slate-50 border text-slate-600'
                }`}>
                  {act.type === 'Admission Confirmed' ? '🎓' :
                   act.type === 'Counselling Scheduled' ? '📅' :
                   act.type === 'Fee Received' ? '💳' :
                   act.type === 'Document Uploaded' ? '📄' : '📝'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-850">{act.type}</p>
                    <span className="text-[10px] text-slate-400 font-semibold">{act.time.toLocaleTimeString()} ({act.time.toLocaleDateString()})</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-tight">{act.detail}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ==================== BOTTOM: QUICK ACTION DOCK ==================== */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Settings className="h-4.5 w-4.5 text-purple-500" />
          Quick Action Dock
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Add Application", path: "/college/admission-form", icon: Plus, color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
            { label: "Generate QR", path: "/college/qr-links", icon: QrCode, color: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" },
            { label: "Admission Desk Link", path: "/college/qr-links", icon: FileSpreadsheet, color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
            { label: "Schedule Counselling", path: "/college/counselling", icon: Compass, color: "bg-pink-50 text-pink-700 hover:bg-pink-100" },
            { label: "Entrance Test Config", path: "/college/academic-config", icon: Layers, color: "bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100" },
            { label: "Verify Documents", path: "/college/documents", icon: FileCheck, color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
            { label: "CRM Settings", path: "/college/settings", icon: Settings, color: "bg-slate-50 text-slate-700 hover:bg-slate-150" }
          ].map((dock, idx) => {
            const Icon = dock.icon;
            return (
              <button
                key={idx}
                onClick={() => navigate(dock.path)}
                className={`p-3.5 rounded-xl border border-transparent font-bold flex flex-col items-center justify-center text-center gap-2 cursor-pointer shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 duration-300 ${dock.color}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-[10px] leading-tight block">{dock.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
