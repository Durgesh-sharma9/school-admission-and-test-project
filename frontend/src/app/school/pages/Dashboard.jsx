import React, { useState, useEffect } from 'react';
import api from '../services/schoolApi';
import Loader from '../../../shared/components/Loader';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
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
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { school } = useAuth();
  const [enquiryStats, setEnquiryStats] = useState(null);
  const [assessmentStats, setAssessmentStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [resEnq, resAsm, resAnl] = await Promise.all([
        api.get('/enquiries/stats'),
        api.get('/assessments/assignments/stats'),
        api.get('/analytics/overview')
      ]);

      if (resEnq.success) setEnquiryStats(resEnq.stats);
      if (resAsm.success) setAssessmentStats(resAsm.stats);
      if (resAnl.success) setAnalytics(resAnl.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <Loader fullPage message="Aggregating workspace analytics..." />;
  }

  // Calculate completion %
  const totalAssigned = assessmentStats?.totalAssigned || 0;
  const completedCount = assessmentStats?.completedCount || 0;
  const completionRate = totalAssigned > 0 
    ? Math.round((completedCount / totalAssigned) * 100) 
    : 0;

  // Calculate conversion %
  const totalEnquiries = enquiryStats?.total || 0;
  const confirmedAdmissions = enquiryStats?.confirmed || 0;
  const conversionRate = totalEnquiries > 0 
    ? Math.round((confirmedAdmissions / totalEnquiries) * 100) 
    : 0;

  // Helper: Get month label
  const getMonthLabel = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) {
      return dateStr || 'Unknown';
    }
    const [year, month] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIdx = parseInt(month, 10) - 1;
    const monthLabel = months[monthIdx] || 'Jan';
    const yearLabel = year ? year.slice(2) : '';
    return `${monthLabel} '${yearLabel}`;
  };

  // Render Monthly Registrations Bar Chart (SVG side-by-side vertical bar trend)
  const renderMonthlyTrendChart = () => {
    const monthlyInq = analytics?.monthlyEnquiries || [];
    const monthlyAdm = analytics?.monthlyAdmissions || [];

    // Merge months
    const monthsSet = new Set([
      ...monthlyInq.map(m => m._id),
      ...monthlyAdm.map(m => m._id)
    ]);
    const sortedMonths = Array.from(monthsSet).sort().slice(-6); // show recent 6 months

    if (sortedMonths.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-xs text-slate-450 border border-dashed border-slate-150 rounded-2xl">
          No monthly data records yet.
        </div>
      );
    }

    const maxCount = Math.max(
      ...sortedMonths.map(m => {
        const inq = monthlyInq.find(x => x._id === m)?.count || 0;
        const adm = monthlyAdm.find(x => x._id === m)?.count || 0;
        return Math.max(inq, adm);
      }),
      1
    );

    return (
      <div className="space-y-4">
        {/* Legends */}
        <div className="flex gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 bg-indigo-500 rounded" />
            <span className="text-slate-500">Enquiries</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 bg-emerald-500 rounded" />
            <span className="text-slate-500">Admissions</span>
          </div>
        </div>

        {/* Vertical Chart Bars */}
        <div className="h-56 flex items-end justify-between gap-2.5 pt-4 border-b border-slate-100">
          {sortedMonths.map((month) => {
            const inqCount = monthlyInq.find(x => x._id === month)?.count || 0;
            const admCount = monthlyAdm.find(x => x._id === month)?.count || 0;

            const inqHeight = (inqCount / maxCount) * 100;
            const admHeight = (admCount / maxCount) * 100;

            return (
              <div key={month} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                <div className="flex items-end gap-1.5 w-full justify-center max-w-[60px]">
                  {/* Enquiry Bar */}
                  <div className="flex-1 flex flex-col items-center justify-end h-full">
                    {inqCount > 0 && (
                      <span className="text-[9px] font-bold text-indigo-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {inqCount}
                      </span>
                    )}
                    <div
                      className="w-full bg-indigo-550 bg-gradient-to-t from-indigo-650 to-indigo-400 rounded-t transition-all duration-500"
                      style={{ height: `${Math.max(inqHeight, 3)}%` }}
                    />
                  </div>

                  {/* Admission Bar */}
                  <div className="flex-1 flex flex-col items-center justify-end h-full">
                    {admCount > 0 && (
                      <span className="text-[9px] font-bold text-emerald-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {admCount}
                      </span>
                    )}
                    <div
                      className="w-full bg-emerald-500 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t transition-all duration-500"
                      style={{ height: `${Math.max(admHeight, 3)}%` }}
                    />
                  </div>
                </div>
                {/* X Axis Label */}
                <span className="text-[10px] text-slate-400 font-semibold mt-2.5 whitespace-nowrap">
                  {getMonthLabel(month)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Class distribution horizontal progress list
  const renderClassDistribution = () => {
    const list = analytics?.classDistribution || [];
    const totalCount = list.reduce((sum, item) => sum + item.count, 0) || 1;

    if (list.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-xs text-slate-450 border border-dashed border-slate-150 rounded-2xl">
          No enquiries logged by class.
        </div>
      );
    }

    // Color gradient maps
    const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];

    return (
      <div className="space-y-4">
        {list.slice(0, 5).map((item, index) => {
          const pct = Math.round((item.count / totalCount) * 100);
          const colorClass = colors[index % colors.length];
          return (
            <div key={item._id} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Class {item._id}</span>
                <span className="text-slate-500">
                  {item.count} enquiries <span className="font-bold text-slate-400">({pct}%)</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 text-left">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Welcome to {school?.name}
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Operational SaaS analytics dashboard showing enquiries, test metrics, and enrollment conversions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admission-form"
            className="inline-flex items-center px-4 py-2.5 rounded-lg text-xs font-bold bg-indigo-650 hover:bg-indigo-700 text-white transition-colors shadow-md shadow-indigo-600/10"
          >
            <FilePlus className="h-4 w-4 mr-2" />
            Add Manual Enquiry
          </Link>
        </div>
      </div>

      {/* SECTION 1: CRM ENQUIRY COUNTERS */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest">
          CRM Admission Pipeline
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { title: 'Total Enquiries', value: totalEnquiries, desc: 'All incoming parent submissions', icon: Users, color: 'bg-indigo-50 border-indigo-100 text-indigo-700 bg-indigo-600 text-white shadow-indigo-600/10' },
            { title: 'New Enquiry', value: enquiryStats?.newEnquiry || 0, desc: 'Awaiting first follow up', icon: Inbox, color: 'bg-blue-50 border-blue-100 text-blue-700 bg-blue-650 text-white shadow-blue-600/10' },
            { title: 'Hold', value: enquiryStats?.hold || 0, desc: 'Contact saved/undecided', icon: PauseCircle, color: 'bg-amber-50 border-amber-100 text-amber-700 bg-amber-550 text-white shadow-amber-550/10' },
            { title: 'Confirmed Admissions', value: confirmedAdmissions, desc: 'Officially registered candidates', icon: CheckCircle, color: 'bg-emerald-50 border-emerald-100 text-emerald-700 bg-emerald-600 text-white shadow-emerald-600/10' },
            { title: 'Not Interested', value: enquiryStats?.notInterested || 0, desc: 'Rejected or inactive status', icon: XCircle, color: 'bg-rose-50 border-rose-100 text-rose-700 bg-rose-600 text-white shadow-rose-650/10' }
          ].map((card, idx) => {
            const Icon = card.icon;
            const styleParts = card.color.split(' ');
            return (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                key={card.title}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {card.title}
                    </span>
                    <p className="text-3xl font-extrabold text-slate-800 mt-2">
                      {card.value}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${styleParts[0]} ${styleParts[2]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50">
                  <span className="text-[10px] text-slate-400 font-medium block">
                    {card.desc}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: ASSESSMENT MANAGEMENT COUNTERS */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest">
          Assessment Metrics Dashboard
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { title: 'Blueprints Count', value: assessmentStats?.totalAssessments || 0, desc: 'Configured test templates', icon: BookOpen, color: 'bg-indigo-50 text-indigo-700' },
            { title: 'Assigned Tests', value: totalAssigned, desc: 'Tests issued to candidate', icon: FileQuestion, color: 'bg-blue-50 text-blue-700' },
            { title: 'Completed Tests', value: completedCount, desc: 'Finished exams submitted', icon: ClipboardCheck, color: 'bg-emerald-50 text-emerald-700' },
            { title: 'Pending Tests', value: assessmentStats?.pendingCount || 0, desc: 'Awaiting student lounge login', icon: Clock, color: 'bg-amber-50 text-amber-700' },
            { title: 'Average Grade', value: `${assessmentStats?.averageScore || 0}%`, desc: 'Mean grade percentage', icon: Award, color: 'bg-rose-50 text-rose-700' }
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: (idx + 5) * 0.05 }}
                key={card.title}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {card.title}
                    </span>
                    <p className="text-3xl font-extrabold text-slate-800 mt-2">
                      {card.value}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${card.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50">
                  <span className="text-[10px] text-slate-400 font-medium block">
                    {card.desc}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: KEY RATES GAUGE BAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admission Conversion Gauge */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">CRM Metrics</span>
              <h4 className="font-extrabold text-slate-800 text-sm">Admission Conversion Index</h4>
            </div>
            <span className="text-2xl font-black text-emerald-600">{conversionRate}%</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
              style={{ width: `${conversionRate}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            Confirmed registrations relative to total admissions pipeline. Conversion rate target: 35%.
          </p>
        </div>

        {/* Assessment Completion Gauge */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Exam Lounge Metrics</span>
              <h4 className="font-extrabold text-slate-800 text-sm">Assessment Completion Index</h4>
            </div>
            <span className="text-2xl font-black text-indigo-600">{completionRate}%</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-650 bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-700"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            Assessments successfully completed and evaluated against total test links assigned.
          </p>
        </div>
      </div>

      {/* SECTION 4: CHARTS TREND BLOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend line bar chart (Monthly registrations) */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm">Registration & Admission Trends</h4>
              <p className="text-[10px] text-slate-400">Monthly breakdown comparing total enquiries vs confirmed conversions.</p>
            </div>
            <TrendingUp className="h-5 w-5 text-indigo-500" />
          </div>
          {renderMonthlyTrendChart()}
        </div>

        {/* Classes seeking (Vertical progress) */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">Enquiries by Class</h4>
            <p className="text-[10px] text-slate-400">Distribution analysis of incoming admissions candidate requirements.</p>
          </div>
          {renderClassDistribution()}
        </div>
      </div>

      {/* SECTION 5: ACTIVITY & RECENT LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assessment Completions */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs flex flex-col space-y-4">
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">Recent Test Submissions</h4>
            <p className="text-[10px] text-slate-400">Latest online tests completed by candidate parents.</p>
          </div>

          <div className="flex-1 overflow-y-auto max-h-80 space-y-3 pr-2.5">
            {!analytics?.recentAssessments || analytics.recentAssessments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-100 rounded-2xl">
                No tests completed yet.
              </div>
            ) : (
              analytics.recentAssessments.map(asm => (
                <div key={asm._id} className="flex justify-between items-center p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-colors">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 text-xs">{asm.enquiryId?.studentName}</span>
                    <span className="text-[10px] text-slate-450 block">{asm.assessmentId?.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-xs text-indigo-650 block">{asm.totalScore} / {asm.assessmentId?.totalMarks}</span>
                    <span className="text-[9px] text-slate-400 block font-semibold">{asm.percentage}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real time notification system logs */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm">System Workspace Logs</h4>
              <p className="text-[10px] text-slate-400">Real-time audit trailing updates from operations.</p>
            </div>
            <Activity className="h-4.5 w-4.5 text-slate-400 animate-pulse" />
          </div>

          <div className="flex-1 overflow-y-auto max-h-80 space-y-3 pr-2.5">
            {!analytics?.recentActivity || analytics.recentActivity.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-100 rounded-2xl">
                No activity logged yet.
              </div>
            ) : (
              analytics.recentActivity.map(act => (
                <div key={act._id} className="flex gap-3 items-start p-3 bg-slate-50/30 hover:bg-slate-50/65 border border-slate-50/80 rounded-2xl transition-colors text-xs">
                  <div className="mt-0.5">
                    {act.type === 'new_enquiry' && <span className="inline-block h-2 w-2 bg-blue-500 rounded-full" />}
                    {act.type === 'admission_confirmed' && <span className="inline-block h-2 w-2 bg-emerald-500 rounded-full" />}
                    {act.type === 'status_changed' && <span className="inline-block h-2 w-2 bg-amber-500 rounded-full" />}
                    {act.type === 'assessment_assigned' && <span className="inline-block h-2 w-2 bg-indigo-500 rounded-full" />}
                    {act.type === 'assessment_completed' && <span className="inline-block h-2 w-2 bg-rose-500 rounded-full" />}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="font-bold text-slate-700">{act.title}</p>
                    <p className="text-[10px] text-slate-400 leading-normal">{act.message}</p>
                    <p className="text-[8px] text-slate-350 italic">
                      {new Date(act.createdAt).toLocaleDateString()} {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Launch Shortcuts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <Link
          to="/qr-code"
          className="bg-white rounded-2xl border border-slate-100 p-6 flex items-start gap-4 hover:shadow-md transition-shadow group"
        >
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
            <QrCode className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center group-hover:text-indigo-600 transition-colors">
              Permanent QR Code
              <ArrowRight className="h-4 w-4 ml-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-4px] group-hover:translate-x-0" />
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Open your unique school QR code to display at the front desk or share digitally with parents.
            </p>
          </div>
        </Link>

        <Link
          to="/enquiries"
          className="bg-white rounded-2xl border border-slate-100 p-6 flex items-start gap-4 hover:shadow-md transition-shadow group"
        >
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
            <Users className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center group-hover:text-blue-600 transition-colors">
              Manage Enquiries
              <ArrowRight className="h-4 w-4 ml-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-4px] group-hover:translate-x-0" />
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Access the live enquiries index. Update statuses, filter, and draft communication messages.
            </p>
          </div>
        </Link>

        <Link
          to="/thankyou-cms"
          className="bg-white rounded-2xl border border-slate-100 p-6 flex items-start gap-4 hover:shadow-md transition-shadow group"
        >
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center group-hover:text-amber-600 transition-colors">
              Configure Thank You CMS
              <ArrowRight className="h-4 w-4 ml-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-4px] group-hover:translate-x-0" />
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Upload informational brochures, configure support channels, and preview parent thank you designs.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
