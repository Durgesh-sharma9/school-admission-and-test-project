import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu, X, GraduationCap, Check, ArrowRight, Star, Mail, Phone, MapPin, ChevronDown,
  Users, BarChart3, QrCode, ClipboardList, Bell, Shield, Sparkles, CheckCircle2,
  HelpCircle, MessageSquare, Settings, Play, ArrowUpRight, Zap, RefreshCw,
  FileText, Calendar, Lock, Globe, Clock, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../../shared/components/Button';

// Animation Variants
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState(null);
  const [activeScreenshotTab, setActiveScreenshotTab] = useState('dashboard');
  const [stats, setStats] = useState({ admissions: 0, followUps: 0, satisfaction: 0, campuses: 0 });

  useEffect(() => {
    const duration = 2000;
    const steps = 50;
    const stepTime = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setStats({
        admissions: Math.min(Math.floor((50000 / steps) * step), 50000),
        followUps: Math.min(Math.floor((98 / steps) * step), 98),
        satisfaction: Math.min(Math.floor((95 / steps) * step), 95),
        campuses: Math.min(Math.floor((350 / steps) * step), 350)
      });

      if (step >= steps) clearInterval(timer);
    }, stepTime);

    return () => clearInterval(timer);
  }, []);

  const featuresList = [
    { title: 'CRM Enquiry Management', description: 'Capture, organize and track applicant/parent enquiries automatically.', icon: Users, color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/30' },
    { title: 'Lead Pipeline', description: 'Visualize admission stages clearly with drag-and-drop workflow lanes.', icon: Layers, color: 'from-cyan-500 to-blue-500', shadow: 'shadow-cyan-500/30' },
    { title: 'WhatsApp Integration', description: 'Send instant updates, brochures, and reminders directly on WhatsApp.', icon: MessageSquare, color: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-500/30' },
    { title: 'Applicant Portal', description: 'Give applicants a secure portal to apply, submit docs, and book slots.', icon: Globe, color: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-500/30' },
    { title: 'Online Assessments', description: 'Schedule, host and score entrance assessments online easily.', icon: ClipboardList, color: 'from-orange-400 to-red-500', shadow: 'shadow-orange-500/30' },
    { title: 'QR Admission Forms', description: 'Generate unique QR codes for banners to receive quick applications.', icon: QrCode, color: 'from-purple-500 to-indigo-500', shadow: 'shadow-purple-500/30' },
    { title: 'Follow-up Reminders', description: 'System triggers smart alerts and tasks dynamically for your team.', icon: Clock, color: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-500/30' },
    { title: 'Admission Timeline', description: 'Review the chronological interaction history of every lead.', icon: RefreshCw, color: 'from-violet-500 to-fuchsia-500', shadow: 'shadow-violet-500/30' },
    { title: 'Analytics Dashboard', description: 'Track conversion rates and department speeds in real time.', icon: BarChart3, color: 'from-fuchsia-500 to-pink-600', shadow: 'shadow-fuchsia-500/30' },
    { title: 'Fee Tracking', description: 'Monitor application fee receipts and invoice approvals centrally.', icon: Zap, color: 'from-yellow-400 to-amber-500', shadow: 'shadow-yellow-500/30' },
    { title: 'Document Management', description: 'Verify identity documents and certificates with custom queues.', icon: FileText, color: 'from-sky-400 to-blue-500', shadow: 'shadow-sky-500/30' },
    { title: 'Role-Based Access', description: 'Secure student records. Grant tailored permissions to staff.', icon: Lock, color: 'from-rose-500 to-red-600', shadow: 'shadow-rose-500/30' }
  ];

  const workflowSteps = [
    { step: 1, title: 'QR Form Scan', desc: 'Applicant scans campus flyer QR to open custom admission portal.', badge: 'QR Enabled' },
    { step: 2, title: 'Enquiry Created', desc: 'System auto-creates enquiry card with applicant profiles instantly.', badge: '100% Cloud' },
    { step: 3, title: 'Smart Follow-up', desc: 'Counselor receives auto-scheduled calls queue on the dashboard.', badge: 'Real-time' },
    { step: 4, title: 'Assessment', desc: 'Applicant participates in evaluation; scores record instantly.', badge: 'Auto Scored' },
    { step: 5, title: 'Admission Decision', desc: 'Verify documents online, accept fees, and confirm admission.', badge: '1-Click Approve' },
    { step: 6, title: 'Student Activation', desc: 'Student portal updates credentials with official receipts.', badge: 'Secure Access' }
  ];

  const modulesList = [
    { title: 'Inquiries CRM', desc: 'Organize high-volume student walk-ins and web inquiries.', img: '🏢', color: 'bg-purple-100 text-purple-600' },
    { title: 'Assessments', desc: 'Create and map customized question banks for different courses.', img: '📝', color: 'bg-blue-100 text-blue-600' },
    { title: 'QR Form Builder', desc: 'Design branded public registration pages requiring no password.', img: '📱', color: 'bg-emerald-100 text-emerald-600' },
    { title: 'Reports & Logs', desc: 'Evaluate application funnels, counselor efficacy, and pipeline.', img: '📊', color: 'bg-pink-100 text-pink-600' },
    { title: 'Applicant Experience', desc: 'Zero friction application tracking, messaging, and confirmation.', img: '✨', color: 'bg-amber-100 text-amber-600' },
    { title: 'Broadcasts & Alerts', desc: 'Automate high-priority WhatsApp templates, SMS alerts, and emails.', img: '🔔', color: 'bg-indigo-100 text-indigo-600' }
  ];

  const automationsList = [
    { title: 'Auto Follow-up Engine', detail: 'Assigns follow-up task queues based on department routes.', icon: RefreshCw, color: 'text-blue-500' },
    { title: 'Auto WhatsApp Alerts', detail: 'Dispatches registration details, and welcome notes dynamically.', icon: MessageSquare, color: 'text-emerald-500' },
    { title: 'Auto Reminders', detail: 'Alerts counseling teams about overdue calls before day finishes.', icon: Clock, color: 'text-amber-500' },
    { title: 'Auto Performance Reports', detail: 'Emails daily analytics metrics and conversion logs to admin.', icon: BarChart3, color: 'text-purple-500' }
  ];

  const screenshotTabs = [
    { id: 'dashboard', name: 'Dashboard', title: 'Complete overview of admissions', desc: 'Review conversion metrics, active enquiries, pending calls, and sources. All widgets update in real-time.', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80' },
    { id: 'enquiry', name: 'Pipeline', title: 'Track stages from contact to enrollment', desc: 'Manage pipeline stages via beautiful Zoho-style columns. Move applications, add notes, and reschedule followups.', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80' },
    { id: 'timeline', name: 'Timeline', title: 'Chronological timeline of applicant journey', desc: 'Track every conversation log, documents verified list, assessment scores, and reminder schedules.', image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80' },
    { id: 'assessment', name: 'Assessments', title: 'Configure entrance tests digitally', desc: 'Design course-specific MCQ or assignments. Auto-evaluate submissions and generate PDF scorecards.', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80' },
    { id: 'reports', name: 'Analytics', title: 'Visualize admission performance data', desc: 'Identify which marketing sources drive conversions. Review response speeds and payment receipts.', image: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=1200&q=80' }
  ];

  const faqList = [
    { q: 'Is this suitable for both Schools and Colleges?', a: 'Yes! The platform is highly customizable. You can configure parameters for K-12 grades or Higher-Ed college courses easily.' },
    { q: 'How long does the setup process take?', a: 'Setup takes less than 10 minutes. Sign up, input your courses/grades, download your QR code, and start capturing registrations.' },
    { q: 'Can we customize the admission form fields?', a: 'Yes! Our visual form builder lets you toggle fields, require document uploads, and set program-specific parameters.' },
    { q: 'Does it support payment integrations?', a: 'Yes. You can collect application fees online via integrated gateways or log cash receipts directly in the CRM database.' },
    { q: 'How does the WhatsApp notification system work?', a: 'The system triggers templates via official WhatsApp business APIs based on workflow actions like Form Submitted or Call Rescheduled.' },
    { q: 'Is our student data private and secure?', a: 'Security is our core priority. All applicant files, scorecards, and contacts are protected with secure cloud encryption.' }
  ];

  const activeTabContent = screenshotTabs.find(t => t.id === activeScreenshotTab);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">

      {/* 1. STICKY COMPACT NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-50 transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-black bg-gradient-to-r from-slate-900 to-indigo-900 bg-clip-text text-transparent tracking-tight">
                CampusCRM
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              {['Features', 'Modules', 'Workflow', 'Pricing'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">
                  {item}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center space-x-3">
              <Link to="/login" className="text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors px-3 py-1.5">
                Log in
              </Link>
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-md active:scale-95">
                  Start Free Trial
                </Button>
              </Link>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-md">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 px-4 py-4 space-y-3 shadow-xl absolute w-full"
            >
              {['Features', 'Modules', 'Workflow', 'Pricing'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-slate-700 hover:text-indigo-600">{item}</a>
              ))}
              <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-center text-sm font-bold text-slate-700 hover:text-indigo-600 py-1.5">Log in</Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold py-2 rounded-lg shadow-md">Start Free Trial</Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* 2. COMPACT HERO SECTION */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/15 blur-[100px]" />
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-[20%] right-[-5%] w-[30%] h-[50%] rounded-full bg-fuchsia-500/15 blur-[100px]" />
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] rounded-full bg-cyan-400/15 blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">

          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="lg:col-span-6 text-left space-y-6">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-50 text-purple-700 border border-purple-200/50 shadow-sm">
              <Sparkles className="w-3 h-3 text-purple-500" />
              <span>AI-Powered Education CRM</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Grow Admissions With One <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">Complete CRM</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-sm sm:text-base text-slate-600 max-w-lg font-medium leading-relaxed">
              Manage student enquiries, admissions, follow-ups, QR forms, and applicant communication from one integrated dashboard. Built for Schools & Colleges.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-3 pt-2">
              <Link to="/signup">
                <Button className="relative group bg-slate-900 text-white text-xs font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg active:scale-95 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center gap-1.5">Start Free Trial <ArrowRight className="w-4 h-4" /></span>
                </Button>
              </Link>
              <a href="#workflow">
                <Button variant="ghost" className="text-xs font-bold px-6 py-3 rounded-xl border border-slate-200 bg-white/50 backdrop-blur-md hover:bg-slate-50 transition-all text-slate-800 shadow-sm flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 fill-slate-800" /> Watch Workflow
                </Button>
              </a>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-x-4 gap-y-2 pt-4 border-t border-slate-100">
              {['100% Cloud', 'For Schools & Colleges', 'Role-Based Access', 'QR Enabled'].map((b) => (
                <div key={b} className="flex items-center gap-1.5 text-slate-500 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span>{b}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="lg:col-span-6 relative flex justify-center items-center mt-8 lg:mt-0"
          >
            <div className="w-full max-w-[500px] aspect-[4/3] rounded-3xl bg-white/80 backdrop-blur-2xl border border-white shadow-[0_15px_40px_rgba(79,70,229,0.1)] p-3 relative">
              <div className="h-8 flex items-center space-x-1.5 px-3 rounded-t-xl bg-slate-50 border-b border-slate-100">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="p-3 bg-slate-50/50 rounded-b-xl h-[calc(100%-32px)] flex flex-col gap-3 shadow-inner">
                <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                  <div>
                    <div className="font-black text-slate-900 text-xs">Campus Admissions</div>
                    <div className="text-[10px] text-slate-500 font-bold">Today's CRM Work Queue</div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md font-black text-[9px] border border-emerald-100">Live</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['Admissions (50K+)', 'WhatsApp (98%)', 'Avg. Score (82)'].map((metric, i) => (
                    <div key={i} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                      <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider">{metric}</span>
                      <span className="text-sm font-black text-slate-800 block mt-0.5">
                        {i === 0 ? '54,230' : i === 1 ? '98.6%' : '84.2'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-1.5 flex-1 overflow-hidden">
                  {[
                    { n: 'Aarav Patel', t: 'Follow-up Call', c: 'bg-blue-50 text-blue-600', s: 'Pending' },
                    { n: 'Samantha M.', t: 'WhatsApp Sent', c: 'bg-emerald-50 text-emerald-600', s: 'Done' }
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center p-2 border-b border-slate-50 last:border-0">
                      <div>
                        <div className="text-xs font-black text-slate-900">{row.n}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{row.t}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${row.c}`}>{row.s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute top-8 -left-4 sm:-left-8 bg-white/90 backdrop-blur-xl p-3 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 block uppercase tracking-widest">Conversion</span>
                <span className="text-sm font-black text-slate-900">94.8%</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 3. KEY METRICS */}
      <section className="py-10 bg-[#F8FAFC] border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-center">
            {[
              { val: `${stats.admissions / 1000}K+`, label: 'Admissions Managed', color: 'from-indigo-600 to-blue-500' },
              { val: `${stats.followUps}%`, label: 'Follow-up Success', color: 'from-purple-600 to-fuchsia-500' },
              { val: `${stats.satisfaction}%`, label: 'Customer Satisfaction', color: 'from-emerald-500 to-teal-400' },
              { val: `${stats.campuses}+`, label: 'Campuses Live', color: 'from-rose-500 to-pink-500' }
            ].map((stat, i) => (
              <div key={i} className="p-2">
                <span className={`text-3xl sm:text-4xl font-black bg-gradient-to-br ${stat.color} bg-clip-text text-transparent tracking-tight block mb-1`}>{stat.val}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PREMIUM FEATURES GRID */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-white relative">
        <div className="max-w-7xl mx-auto space-y-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>Comprehensive Toolkit</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              12 Premium Features For Campuses
            </h2>
            <p className="text-sm text-slate-500 font-medium">Everything you need to automate inquiries, organize documents, and coordinate communications.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {featuresList.map((feat, i) => {
              const IconComp = feat.icon;
              return (
                <motion.div
                  key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.4 }}
                  className="group p-5 bg-[#F8FAFC] rounded-2xl border border-slate-100 hover:bg-white hover:border-indigo-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feat.color} text-white flex items-center justify-center mb-4 ${feat.shadow} shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">{feat.title}</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{feat.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. DYNAMIC MODULES */}
      <section id="modules" className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto space-y-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Built-in Dynamic Modules</h2>
            <p className="text-sm text-slate-500 font-medium">Everything in one application context to eliminate multi-app context switches.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modulesList.map((mod, i) => (
              <motion.div
                key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex items-start gap-4 text-left"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${mod.color} shadow-inner`}>
                  {mod.img}
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-slate-900">{mod.title}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{mod.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. WORKFLOW & APPLICANT TIMELINE */}
      <section id="workflow" className="py-16 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden relative">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-80 h-80 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative z-10">

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="space-y-6">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">The Smooth Applicant Journey</motion.h2>
            <motion.p variants={fadeUp} className="text-sm text-slate-500 font-medium max-w-md">A seamless, zero-friction path from offline campus scan to complete enrollment.</motion.p>

            <div className="relative pl-6 border-l-2 border-indigo-100 space-y-8 pt-2">
              {workflowSteps.map((step, idx) => (
                <motion.div key={idx} variants={fadeUp} className="relative group">
                  <div className="absolute -left-[41px] top-0 w-10 h-10 bg-white border-2 border-indigo-500 rounded-full flex items-center justify-center font-black text-indigo-600 shadow-sm group-hover:bg-indigo-50 transition-colors">
                    {step.step}
                  </div>
                  <div className="ml-5 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">{step.title}</h3>
                      <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{step.badge}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium max-w-sm">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="bg-[#F8FAFC] p-6 rounded-3xl border border-slate-200 shadow-lg space-y-5">
            <h3 className="text-xl font-black text-slate-900 mb-2">Automated Operations Engine</h3>
            {automationsList.map((aut, idx) => {
              const Icon = aut.icon;
              return (
                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-4 hover:border-indigo-200 transition-colors">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100 ${aut.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{aut.title}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">{aut.detail}</p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* 7. INTERACTIVE SCREENSHOTS CAROUSEL */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] border-y border-slate-200/50 overflow-hidden relative">
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-200/60 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-200/60 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-6xl mx-auto space-y-10 relative z-10 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-xl mx-auto space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Explore the Platform</h2>
            <p className="text-sm text-slate-500 font-medium">Take an interactive tour of the actual CRM layouts used by administrative personnel.</p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm backdrop-blur-md">
            {screenshotTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveScreenshotTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex-1 min-w-[120px] ${activeScreenshotTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          <motion.div
            key={activeScreenshotTab}
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-xl p-4 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left"
          >
            <div className="lg:col-span-8 overflow-hidden rounded-xl border border-slate-100 group">
              <img src={activeTabContent.image} alt={activeTabContent.name} className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="lg:col-span-4 space-y-4 px-2">
              <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">
                {activeTabContent.name}
              </span>
              <h3 className="text-2xl font-black text-slate-900 leading-tight">{activeTabContent.title}</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">{activeTabContent.desc}</p>
              <Button className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 mt-2 shadow-md active:scale-95 transition-all">
                Try Dashboard Live <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 8. PRICING PLANS */}
      <section id="pricing" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto space-y-10 text-center">

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-xl mx-auto space-y-3">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Simple Pricing Options</h2>
            <p className="text-sm text-slate-500 font-medium">Start with a 7-day free trial. Select the plan configured for your registration volume.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-[#F8FAFC] p-6 rounded-2xl border border-slate-200 shadow-sm text-left flex flex-col h-[95%]">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Starter</span>
                <h3 className="text-3xl font-black text-slate-900 mt-1">$29<span className="text-sm text-slate-400">/mo</span></h3>
                <p className="text-xs text-slate-500 mt-2 h-8">Ideal for schools and small colleges.</p>
              </div>
              <ul className="space-y-3 pt-4 mt-4 border-t border-slate-200 flex-1">
                {['Up to 100 Enquiries/mo', 'Basic CRM Enquiry Desk', 'Standard QR Form', '5 Online Assessments'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 rounded-lg mt-6">Start Starter Trial</Button>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-white p-8 rounded-2xl border-2 border-indigo-500 shadow-xl text-left flex flex-col relative lg:scale-105 z-10 h-full">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">Most Popular</div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-indigo-600">Professional</span>
                <h3 className="text-4xl font-black text-slate-900 mt-1">$79<span className="text-sm text-slate-400">/mo</span></h3>
                <p className="text-xs text-slate-500 mt-2 h-8">Perfect for active schools and higher-ed institutes.</p>
              </div>
              <ul className="space-y-3 pt-4 mt-4 border-t border-slate-100 flex-1">
                {['Up to 500 Enquiries/mo', 'Advanced CRM & Followups', 'Custom Multi-stage Forms', 'Unlimited Assessments', 'WhatsApp Broadcasts'].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs font-bold text-slate-800">
                    <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold py-3 rounded-lg mt-6 shadow-md active:scale-95 transition-transform">Get Professional Now</Button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="bg-[#F8FAFC] p-6 rounded-2xl border border-slate-200 shadow-sm text-left flex flex-col h-[95%]">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Enterprise</span>
                <h3 className="text-3xl font-black text-slate-900 mt-1">$199<span className="text-sm text-slate-400">/mo</span></h3>
                <p className="text-xs text-slate-500 mt-2 h-8">For multi-branch campuses and universities.</p>
              </div>
              <ul className="space-y-3 pt-4 mt-4 border-t border-slate-200 flex-1">
                {['Unlimited Enquiries', 'Multiple Accounts Mapping', 'Custom ERP API Integration', 'Dedicated Account Mgr'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Check className="w-4 h-4 text-slate-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button variant="ghost" className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold py-3 rounded-lg mt-6">Contact Sales</Button>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 9. FAQ ACCORDION */}
      <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] border-y border-slate-200/50">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
          </div>
          <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
            {faqList.map((faq, i) => (
              <div key={i} className="py-4 text-left">
                <button onClick={() => setActiveFAQ(activeFAQ === i ? null : i)} className="w-full flex justify-between items-center py-1 text-slate-800 hover:text-indigo-600 transition-colors font-bold text-sm text-left focus:outline-none cursor-pointer">
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${activeFAQ === i ? 'rotate-180 text-indigo-600' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeFAQ === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <p className="text-xs text-slate-500 leading-relaxed pt-2 pb-1 font-medium">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. FINAL CALL TO ACTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-slate-900 relative overflow-hidden text-center border-b border-slate-200">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 15, repeat: Infinity }} className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-200/40 rounded-full blur-[100px]" />
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity }} className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[300px] h-[300px] bg-purple-200/30 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest bg-indigo-100 text-indigo-700 border border-indigo-200 backdrop-blur-md shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-500" /> <span>Admissions Pro Platform</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">Ready to Digitize Your <br /> Admission Process?</h2>
          <p className="text-sm text-slate-600 font-medium max-w-xl mx-auto leading-relaxed">Invite your team, configure courses or grades, and track conversions today.</p>
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <Link to="/signup">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg active:scale-95 transition-transform">Start Free Trial</Button>
            </Link>
            <a href="#pricing">
              <Button variant="ghost" className="bg-white text-slate-800 hover:bg-slate-50 text-xs font-bold px-6 py-3 rounded-xl border border-slate-200 transition-all shadow-sm">Contact Sales</Button>
            </a>
          </div>
        </div>
      </section>

      {/* 11. DETAILED FOOTER */}
      <footer className="bg-white text-slate-500 py-12 px-4 sm:px-6 lg:px-8 text-left text-xs relative z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md"><GraduationCap className="w-4 h-4 text-white" /></div>
              <span className="text-sm font-black text-slate-900 tracking-tight">CampusCRM</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-xs">SaaS education CRM platform coordinates applicant follow-ups, schedules entrance assessments, and records receipts.</p>
          </div>
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Company</h4>
            <ul className="space-y-2 font-semibold text-slate-500">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Blog</a></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Product</h4>
            <ul className="space-y-2 font-semibold text-slate-500">
              <li><a href="#features" className="hover:text-indigo-600 transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Resources</h4>
            <ul className="space-y-2 font-semibold text-slate-500">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">API Docs</a></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Legal</h4>
            <ul className="space-y-2 font-semibold text-slate-500">
              <li><a href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy</a></li>
              <li><a href="/terms" className="hover:text-indigo-600 transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-slate-200 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500 font-bold text-[10px]">
          <p>© 2026 CampusCRM. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Systems Operational</span>
            <span>·</span><span>v2.5.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;