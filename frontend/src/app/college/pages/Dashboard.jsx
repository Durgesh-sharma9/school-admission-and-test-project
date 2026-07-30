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
  Sparkles,
  ArrowRight
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
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'framer-motion';

// Soft, Premium Color Palette
const CHART_COLORS = ['#7E63F6', '#EE5EAA', '#34D06D', '#F6A928', '#5091F8', '#25C5B5', '#9B86F8'];

// Animation Variants for Premium Staggered Effect
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
};

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
      .filter(act => act.type !== 'Counselling Scheduled' && act.type !== 'Document Uploaded')
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

  // Fake sparkline data for background visual
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

        {/* ==================== HEADER SECTION (COMPACT SAAS) ==================== */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl p-3 md:p-4 shadow-sm border border-[#E8ECF3] flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-[10px] md:gap-3 min-w-0">
            {school?.logo ? (
              <img
                src={school.logo}
                alt="Logo"
                className="h-10 w-10 rounded-lg object-contain bg-white border border-[#ECECEC] shadow-xs p-0.5 shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm border border-[#ECECEC] shadow-xs shrink-0">
                {school?.name?.charAt(0) || 'C'}
              </div>
            )}
            <div className="space-y-0.5 min-w-0 text-left">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight truncate">
                {school?.name || 'Global College'}
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Real-time College Admission CRM • Applications • Admissions
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link to="/college/admission-form" className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#7E63F6] to-[#9781F8] hover:shadow-md hover:shadow-[#7E63F6]/20 text-white transition-all duration-200">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Application
            </Link>
            <Link to="/college/qr-links" className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-semibold bg-white text-gray-700 border border-[#E8ECF3] hover:bg-gray-50 hover:shadow-sm transition-all duration-200">
              <QrCode className="h-3.5 w-3.5 mr-1.5 text-[#EE5EAA]" /> QR Poster
            </Link>
          </div>
        </motion.div>

        {/* ==================== ROW 1: COMPACT FLOATING KPI CARDS ==================== */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-x-4 gap-y-6 pt-4">
          {[
            { title: "Today's Apps", val: computedMetrics.todayApps, desc: "Created today", spark: sparkline1, icon: Clock, color: "from-[#7E63F6] to-[#9781F8]", line: "#7E63F6" },
            { title: "Monthly Apps", val: computedMetrics.thisMonthApps, desc: "Created this month", spark: sparkline2, icon: ClipboardList, color: "from-[#5091F8] to-[#78AAF9]", line: "#5091F8" },
            { title: "Today's Follow-ups", val: todayFollowups.length, desc: "Scheduled today", spark: sparkline1, icon: PhoneCall, color: "from-[#F6A928] to-[#F8C15D]", line: "#F6A928" },
            { title: "Admissions", val: computedMetrics.confirmedCount, desc: "Finalized", spark: sparkline2, icon: CheckCircle2, color: "from-[#34D06D] to-[#60DF8F]", line: "#34D06D" },
            { title: "Conversion %", val: computedMetrics.conversionPercent, desc: "Lead to admit ratio", spark: sparkline1, icon: TrendingUp, color: "from-[#EE5EAA] to-[#F488C2]", line: "#EE5EAA" },
            { title: "Entrance Tests", val: computedMetrics.entranceTestCount, desc: "Registered tests", spark: sparkline2, icon: FileText, color: "from-[#25C5B5] to-[#53D7C9]", line: "#25C5B5" }
          ].map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)" }}
                className="bg-white rounded-xl border border-[#E8ECF3] shadow-sm p-3 relative flex flex-col group transition-all duration-300"
              >
                <div className="flex justify-between items-start">
                  <div className={`absolute -top-3 left-3 w-10 h-10 rounded-lg shadow-md flex items-center justify-center bg-gradient-to-br ${kpi.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="w-full text-right pl-14 pt-0.5">
                    <p className="text-[11px] font-semibold text-gray-500 mb-0.5 truncate">{kpi.title}</p>
                    <h4 className="text-xl font-bold text-gray-800 leading-tight">{kpi.val}</h4>
                  </div>
                </div>
                <hr className="my-2.5 border-[#E8ECF3]" />
                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] font-medium text-gray-400 truncate">{kpi.desc}</span>
                </div>
                <div className="absolute bottom-0 left-0 h-8 w-full opacity-20 group-hover:opacity-40 transition-opacity rounded-b-xl overflow-hidden pointer-events-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={kpi.spark}>
                      <Area type="monotone" dataKey="v" stroke={kpi.line} fill={kpi.line} strokeWidth={0} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ==================== ROW 2: ADMISSION FUNNEL PIPELINE ==================== */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl border border-[#E8ECF3] shadow-sm relative mt-6">
          <div className="absolute -top-4 left-4 right-4 px-4 py-2.5 rounded-lg shadow-md bg-gradient-to-br from-[#7E63F6] to-[#9781F8] text-white flex justify-between items-center z-10">
            <div>
              <h6 className="text-sm font-bold tracking-wide">Horizontal Admission Funnel Pipeline</h6>
              <p className="text-[10px] opacity-90 font-medium">Real-time stage distribution</p>
            </div>
            <Link to="/college/applications" className="text-white hover:text-gray-100 transition-colors bg-white/20 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center">
              View All <ArrowRight className="h-3 w-3 ml-1.5" />
            </Link>
          </div>

          <div className="p-4 pt-12">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { stage: 'Applications', count: computedMetrics.funnel.applications, color: 'bg-[#7E63F6]' },
                { stage: 'Department Assigned', count: computedMetrics.funnel.deptAssigned, color: 'bg-[#5091F8]' },
                { stage: 'Fee Pending', count: computedMetrics.funnel.feePending, color: 'bg-[#F6A928]' },
                { stage: 'Admission Confirmed', count: computedMetrics.funnel.confirmed, color: 'bg-[#34D06D]' },
                { stage: 'Not Interested', count: computedMetrics.funnel.notInterested, color: 'bg-[#EE5EAA]' }
              ].map((item, idx) => {
                const percentage = computedMetrics.funnel.applications > 0
                  ? Math.round((item.count / computedMetrics.funnel.applications) * 100)
                  : 0;

                return (
                  <div key={idx} onClick={() => navigate('/college/applications')} className="space-y-2 cursor-pointer group p-2 rounded-lg hover:bg-gray-50 transition-colors relative">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-500 text-xs truncate max-w-[75%]">{item.stage}</span>
                      <span className="text-[10px] font-bold text-gray-400">{percentage}%</span>
                    </div>
                    <h4 className="font-bold text-xl text-gray-800">{item.count}</h4>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(percentage, 2)}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                        className={`h-full rounded-full ${item.color}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ==================== ROW 3: CHARTS ==================== */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Applications by Course */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-[#E8ECF3] shadow-sm relative pt-12 px-5 pb-4 mt-4 hover:shadow-md transition-shadow duration-300">
            <div className="absolute -top-4 left-4 right-4 px-4 py-2.5 rounded-lg shadow-md bg-gradient-to-br from-[#EE5EAA] to-[#F488C2] text-white flex justify-between items-center z-10">
              <div>
                <h6 className="text-sm font-bold tracking-wide">Applications by Course</h6>
                <p className="text-[10px] opacity-90 font-medium mt-0.5">Program distribution statistics</p>
              </div>
            </div>

            {courseDistribution.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-xs font-medium text-gray-400">
                <AlertCircle className="h-6 w-6 text-gray-300 mb-2" />
                No active courses configured
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-60 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={courseDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECF3" />
                      <XAxis dataKey="code" tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 500 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 500 }} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: '#F6F8FC' }} contentStyle={{ borderRadius: '8px', fontSize: '11px', border: '1px solid #E8ECF3', padding: '8px' }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={30} animationDuration={1500}>
                        {courseDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Lead Source Analytics */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-[#E8ECF3] shadow-sm relative pt-12 px-5 pb-4 mt-4 hover:shadow-md transition-shadow duration-300">
            <div className="absolute -top-4 left-4 right-4 px-4 py-2.5 rounded-lg shadow-md bg-gradient-to-br from-[#5091F8] to-[#78AAF9] text-white flex justify-between items-center z-10">
              <div>
                <h6 className="text-sm font-bold tracking-wide">Application Source</h6>
                <p className="text-[10px] opacity-90 font-medium mt-0.5">Inbound channels</p>
              </div>
            </div>

            {leadSourceDistribution.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-xs font-medium text-gray-400">
                <AlertCircle className="h-6 w-6 text-gray-300 mb-2" />
                No lead source statistics
              </div>
            ) : (
              <div className="flex flex-col h-full justify-center">
                <div className="h-44 w-full flex items-center justify-center mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={leadSourceDistribution} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={70} innerRadius={45} paddingAngle={4} animationDuration={1500}>
                        {leadSourceDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="transparent" />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px', border: '1px solid #E8ECF3', padding: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ==================== ROW 4: TRENDS & TOP COURSES ==================== */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Monthly Admission Trends */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-[#E8ECF3] shadow-sm relative pt-12 px-5 pb-4 mt-4 hover:shadow-md transition-shadow duration-300">
            <div className="absolute -top-4 left-4 right-4 px-4 py-2.5 rounded-lg shadow-md bg-gradient-to-br from-[#34D06D] to-[#60DF8F] text-white flex justify-between items-center z-10">
              <div>
                <h6 className="text-sm font-bold tracking-wide">Monthly Admission Trends</h6>
                <p className="text-[10px] opacity-90 font-medium mt-0.5">Historical pipeline data</p>
              </div>
            </div>

            <div className="h-60 w-full mt-2">
              {computedMetrics.monthlyTrends.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-xs font-medium text-gray-400">
                  <AlertCircle className="h-6 w-6 text-gray-300 mb-2" />
                  No trend timeline registered
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={computedMetrics.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECF3" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 500 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 500 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px', border: '1px solid #E8ECF3', padding: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="Applications" stroke="#7E63F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={1500} />
                    <Line type="monotone" dataKey="Admissions" stroke="#34D06D" strokeWidth={3} dot={{ r: 4 }} animationDuration={1500} />
                    <Line type="monotone" dataKey="Rejected" stroke="#EE5EAA" strokeWidth={3} dot={{ r: 4 }} animationDuration={1500} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top Performing Courses */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-[#E8ECF3] shadow-sm relative pt-12 px-5 pb-4 mt-4 hover:shadow-md transition-shadow duration-300">
            <div className="absolute -top-4 left-4 right-4 px-4 py-2.5 rounded-lg shadow-md bg-gradient-to-br from-[#F6A928] to-[#F8C15D] text-white flex justify-between items-center z-10">
              <div>
                <h6 className="text-sm font-bold tracking-wide">Top Performing Courses</h6>
                <p className="text-[10px] opacity-90 font-medium mt-0.5">Highest application volume</p>
              </div>
            </div>

            <div className="space-y-3 mt-2 h-56 overflow-y-auto pr-2 custom-scrollbar">
              {computedMetrics.topCourses.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-xs font-medium text-gray-400">
                  <Award className="h-6 w-6 text-gray-300 mb-2" />
                  No course ranking stats
                </div>
              ) : (
                computedMetrics.topCourses.map((course, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50/80 hover:bg-gray-100 rounded-lg transition-colors border border-[#E8ECF3]">
                    <div className="flex items-center space-x-3">
                      <span className={`h-6 w-6 rounded-md text-xs font-bold flex items-center justify-center ${idx === 0 ? 'bg-[#7E63F6]/10 text-[#7E63F6]' :
                          idx === 1 ? 'bg-[#5091F8]/10 text-[#5091F8]' :
                            idx === 2 ? 'bg-[#F6A928]/10 text-[#F6A928]' :
                              'bg-gray-200 text-gray-600'
                        }`}>
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-gray-800 truncate max-w-[120px]">{course.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#7E63F6] bg-[#7E63F6]/10 px-2 py-1 rounded">
                      {course.count} apps
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* ==================== ROW 5 & 6 (COMMENTED OUT IN ORIGINAL) ==================== */}
        {/*
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
            ... Today's Counselling Schedule ...
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
            ... Pending Documents verification ...
          </div>
        */}

        {/* ==================== ROW 7 & 8: OPERATIONAL & ACTIVITY ==================== */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">

          {/* Operational Panel */}
          <div className="bg-white rounded-xl border border-[#E8ECF3] shadow-sm p-4 space-y-4 hover:shadow-md transition-shadow duration-300 lg:col-span-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-[#5091F8]/10 text-[#5091F8]">
                <Settings className="h-4 w-4 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Operational Status</h3>
                <p className="text-[10px] text-gray-500 font-medium">Immediate action items</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { title: "Today's Calls", val: computedMetrics.opTodayCalls, color: "text-[#5091F8] border-[#5091F8]/20 bg-[#5091F8]/5" },
                { title: "Pending Fee", val: computedMetrics.opPendingFee, color: "text-[#F6A928] border-[#F6A928]/20 bg-[#F6A928]/5" },
                { title: "Tests Today", val: computedMetrics.opEntranceToday, color: "text-[#34D06D] border-[#34D06D]/20 bg-[#34D06D]/5" }
              ].map((op, idx) => (
                <div key={idx} className={`p-4 border rounded-xl flex flex-col justify-between transition-colors hover:shadow-sm ${op.color}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wide opacity-80 block">{op.title}</span>
                  <span className="text-3xl font-black block mt-2">{op.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities Feed */}
          <div className="bg-white rounded-xl border border-[#E8ECF3] shadow-sm p-4 space-y-4 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-[#EE5EAA]/10 text-[#EE5EAA]">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Recent Campus Log</h3>
                <p className="text-[10px] text-gray-500 font-medium">Real-time activities</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {computedMetrics.sortedActivities.length === 0 ? (
                <div className="text-xs font-medium text-gray-400 py-6 text-center">No recent actions recorded.</div>
              ) : (
                computedMetrics.sortedActivities.map((act, idx) => (
                  <div key={act.id} className="flex items-start space-x-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="mt-0.5 flex-shrink-0">
                      <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${act.type === 'Admission Confirmed' ? 'bg-[#34D06D]/10 text-[#34D06D]' :
                          act.type === 'Counselling Scheduled' ? 'bg-[#7E63F6]/10 text-[#7E63F6]' :
                            act.type === 'Fee Received' ? 'bg-[#F6A928]/10 text-[#F6A928]' :
                              act.type === 'Document Uploaded' ? 'bg-[#5091F8]/10 text-[#5091F8]' :
                                'bg-gray-100 text-gray-600'
                        }`}>
                        {act.type === 'Admission Confirmed' ? '🎓' :
                          act.type === 'Counselling Scheduled' ? '📅' :
                            act.type === 'Fee Received' ? '💳' :
                              act.type === 'Document Uploaded' ? '📄' : '📝'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-gray-800 truncate">{act.type}</p>
                      <p className="text-[10px] text-gray-500 font-medium mt-0.5 line-clamp-2">{act.detail}</p>
                      <span className="text-[9px] font-semibold text-gray-400 block mt-1">{act.time.toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* ==================== BOTTOM: QUICK ACTION DOCK ==================== */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl border border-[#E8ECF3] shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow duration-300 mt-6">
          <h3 className="text-sm font-bold text-gray-900">Quick Action Dock</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {[
              { label: "Add Application", path: "/college/admission-form", icon: Plus, color: "text-[#7E63F6] bg-[#7E63F6]/10 hover:bg-[#7E63F6] hover:text-white" },
              { label: "Generate QR", path: "/college/qr-links", icon: QrCode, color: "text-[#5091F8] bg-[#5091F8]/10 hover:bg-[#5091F8] hover:text-white" },
              { label: "Admission Link", path: "/college/qr-links", icon: FileSpreadsheet, color: "text-[#34D06D] bg-[#34D06D]/10 hover:bg-[#34D06D] hover:text-white" },
              { label: "Entrance Config", path: "/college/academic-config", icon: Layers, color: "text-[#EE5EAA] bg-[#EE5EAA]/10 hover:bg-[#EE5EAA] hover:text-white" },
              { label: "CRM Settings", path: "/college/settings", icon: Settings, color: "text-gray-600 bg-gray-100 hover:bg-gray-800 hover:text-white" }
            ].map((dock, idx) => {
              const Icon = dock.icon;
              return (
                <motion.div whileHover={{ y: -3 }} key={idx}>
                  <Link to={dock.path} className={`p-3 rounded-lg flex flex-col items-center justify-center text-center space-y-2 transition-all duration-200 group shadow-sm hover:shadow-md h-full w-full ${dock.color}`}>
                    <Icon className="h-5 w-5" />
                    <span className="text-[11px] font-bold truncate w-full">{dock.label}</span>
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