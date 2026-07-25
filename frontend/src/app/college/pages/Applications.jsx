import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../school/services/schoolApi';
import Loader from '../../../shared/components/Loader';
import Button from '../../../shared/components/Button';
import toast from 'react-hot-toast';
import AdmissionJourneyTimeline from '../../../shared/components/AdmissionJourneyTimeline';
import CRMProfileModal from '../../../shared/components/CRMProfileModal';
import ContactModal from '../../../shared/components/ContactModal';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  FileCheck,
  User,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  DollarSign,
  Plus,
  ArrowRight,
  ClipboardList,
  MessageCircle,
  PhoneCall,
  Users,
  X,
  Sparkles,
  FileText,
  Building,
  BookOpen,
  Clock,
  ChevronDown,
  Info,
  Award,
  Briefcase,
  GitCommit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Stage maps to handle database values under the hood (Do NOT change DB schema)
const STAGE_MAP_TO_STATUS = {
  'Counselling Assigned': 'New',
  'Call Scheduled': 'Hold',
  'Call Completed': 'New',
  'Campus Visit': 'New',
  'Documents Pending': 'Hold',
  'Documents Verified': 'New',
  'Selected': 'New',
  'Rejected': 'Not Interested',
  'Admission Confirmed': 'Admission Confirmed'
};

const STATUS_MAP_TO_STAGE = {
  'New': 'Counselling Assigned',
  'Hold': 'Call Scheduled',
  'Not Interested': 'Rejected',
  'Admission Confirmed': 'Admission Confirmed'
};

const STATUS_COLOR_MAP = {
  'New': 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500/20',
  'Hold': 'bg-orange-50 text-orange-700 border-orange-200 focus:ring-orange-500/20',
  'Not Interested': 'bg-red-50 text-red-700 border-red-200 focus:ring-red-500/20',
  'Admission Confirmed': 'bg-teal-50 text-teal-700 border-teal-200 focus:ring-teal-500/20'
};

const STATUS_OPTIONS = ['New', 'Hold', 'Not Interested', 'Admission Confirmed'];

const Applications = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const expandId = searchParams.get('expand');
  const [expandedAppId, setExpandedAppId] = useState(null);

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Handle deep-linking query parameter: ?expand=ID
  useEffect(() => {
    if (expandId) {
      setSearchTerm(expandId);
      setExpandedAppId(expandId);
    }
  }, [expandId]);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest

  // Details Modal state
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Contact Modal state
  const [contactApp, setContactApp] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Fetch applications
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/college/applications');
      if (res.success) {
        setApplications(res.data);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Lock body scroll when any modal is open
  useEffect(() => {
    const isModalOpen = detailsModalOpen || contactModalOpen;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [detailsModalOpen, contactModalOpen]);

  // Open details modal
  const handleViewDetails = async (id) => {
    try {
      const res = await api.get(`/college/applications/${id}`);
      if (res.success) {
        setSelectedApp(res.data);
        setDetailsModalOpen(true);
      }
    } catch (error) {
      toast.error('Failed to load application details');
    }
  };

  // Open contact modal
  const handleOpenContactModal = async (app) => {
    if (app.parentMobile !== undefined) {
      setContactApp(app);
      setContactModalOpen(true);
    } else {
      try {
        const res = await api.get(`/college/applications/${app._id}`);
        if (res.success) {
          setContactApp(res.data);
          setContactModalOpen(true);
        }
      } catch (error) {
        toast.error('Failed to load contact details');
      }
    }
  };

  // Direct status change from table or details view
  const handleStatusChangeDirectly = async (appId, newStatus) => {
    const newStage = STATUS_MAP_TO_STAGE[newStatus];
    try {
      const res = await api.put(`/college/applications/${appId}/stage`, {
        stage: newStage,
        note: `Status updated to: ${newStatus}`
      });
      if (res.success) {
        toast.success(`Application status updated to ${newStatus}`);
        
        // Refresh local items
        if (selectedApp && selectedApp._id === appId) {
          setSelectedApp(res.data);
        }
        fetchApplications();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleSaveJourney = async (appId, updatedJourney) => {
    try {
      const response = await api.put(`/college/applications/${appId}/stage`, {
        journey: updatedJourney
      });
      if (response.success) {
        toast.success('Admission journey updated successfully!');
        setApplications(prev => prev.map(app => app._id === appId ? { ...app, journey: response.data.journey, stage: response.data.stage } : app));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update journey');
      throw err;
    }
  };

  // Add Counseling remark log note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      const res = await api.post(`/college/applications/${selectedApp._id}/note`, { note: newNote });
      if (res.success) {
        toast.success('Counseling note logged successfully!');
        setSelectedApp(res.data);
        setNewNote('');
        fetchApplications();
      }
    } catch (error) {
      toast.error('Failed to add counseling note');
    }
  };

  // Document verification
  const handleDocVerify = async (docId, status) => {
    try {
      const res = await api.put(`/college/applications/${selectedApp._id}/document/${docId}`, { status });
      if (res.success) {
        toast.success(`Document marked as ${status}`);
        setSelectedApp(res.data);
        fetchApplications();
      }
    } catch (error) {
      toast.error('Failed to verify document');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const dataToExport = filteredApplications;
    if (dataToExport.length === 0) {
      toast.error('No applications found to export');
      return;
    }
    const headers = ['Application ID', 'Student Name', 'Email', 'Mobile', 'Department', 'Course', 'Status', '10%', '12%', 'Grad%', 'Created Date'];
    const rows = [headers.join(',')];
    dataToExport.forEach(app => {
      rows.push([
        app.applicationId,
        `"${app.studentName}"`,
        app.email,
        app.mobile,
        `"${app.departmentId?.name || 'N/A'}"`,
        `"${app.courseId?.name || 'N/A'}"`,
        STAGE_MAP_TO_STATUS[app.stage] || 'New',
        app.tenthPercentage,
        app.twelfthPercentage,
        app.graduationPercentage || 'N/A',
        new Date(app.createdAt).toLocaleDateString()
      ].join(','));
    });
    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `College_Applications_CRM_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Format phone number for WhatsApp
  const formatWhatsApp = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/[\s\-()]/g, '');
    if (cleaned.startsWith('+')) return cleaned.replace('+', '');
    if (cleaned.startsWith('91') && cleaned.length > 10) return cleaned;
    return `91${cleaned}`;
  };

  // Extract unique departments & courses from applications list
  const uniqueDepts = Array.from(new Set(applications.map(app => app.departmentId?._id).filter(Boolean)))
    .map(id => {
      const app = applications.find(a => a.departmentId?._id === id);
      return { id, name: app.departmentId?.name };
    });

  const uniqueCourses = Array.from(new Set(applications.map(app => app.courseId?._id).filter(Boolean)))
    .map(id => {
      const app = applications.find(a => a.courseId?._id === id);
      return { id, name: app.courseId?.name };
    });

  // Client-side filtering & sorting
  const filteredApplications = applications.filter(app => {
    // 1. Search text filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = app.studentName?.toLowerCase().includes(term);
      const matchEmail = app.email?.toLowerCase().includes(term);
      const matchMobile = app.mobile?.includes(term);
      const matchAppId = app.applicationId?.toLowerCase().includes(term);
      if (!matchName && !matchEmail && !matchMobile && !matchAppId) return false;
    }

    // 2. Status filter
    if (statusFilter) {
      const currentStatus = STAGE_MAP_TO_STATUS[app.stage] || 'New';
      if (currentStatus !== statusFilter) return false;
    }

    // 3. Department filter
    if (departmentFilter) {
      if (app.departmentId?._id !== departmentFilter) return false;
    }

    // 4. Course filter
    if (courseFilter) {
      if (app.courseId?._id !== courseFilter) return false;
    }

    // 5. Date Range filter
    if (startDate) {
      const appDate = new Date(app.createdAt);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (appDate < start) return false;
    }
    if (endDate) {
      const appDate = new Date(app.createdAt);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (appDate > end) return false;
    }

    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    if (sortBy === 'newest') {
      return dateB - dateA;
    } else {
      return dateA - dateB;
    }
  });

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-2">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Applications CRM Desk</h2>
          <p className="text-gray-500 text-sm mt-1 font-medium">Filter, track status, verify documents, and log counseling details.</p>
        </div>
      </div>

      {/* Advanced Filter Section */}
      <div className="bg-white rounded-2xl border-0 shadow-[0_2px_20px_rgb(0,0,0,0.03)] p-5 space-y-4">
        
        {/* Row 1: Search and Export */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full text-left">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, name, email, mobile..."
              className="w-full pl-11 pr-4 py-3 bg-[#f8f9fe] rounded-xl border border-transparent text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all shadow-inner"
            />
          </div>
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 shrink-0 px-5 py-3 w-full md:w-auto text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50"
            onClick={handleExportCSV}
          >
            Export CSV / Excel
          </Button>
        </div>

        {/* Row 2: Selectors */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-xs">
          
          <div className="text-left">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#f8f9fe] rounded-xl border border-transparent px-3.5 py-2.5 text-gray-700 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="text-left">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full bg-[#f8f9fe] rounded-xl border border-transparent px-3.5 py-2.5 text-gray-700 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white"
            >
              <option value="">All Departments</option>
              {uniqueDepts.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div className="text-left">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Course</label>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full bg-[#f8f9fe] rounded-xl border border-transparent px-3.5 py-2.5 text-gray-700 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white"
            >
              <option value="">All Courses</option>
              {uniqueCourses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>

          <div className="text-left">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-[#f8f9fe] rounded-xl border border-transparent px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-700 font-bold focus:bg-white"
            />
          </div>

          <div className="text-left">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[#f8f9fe] rounded-xl border border-transparent px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-700 font-bold focus:bg-white"
            />
          </div>

          <div className="text-left">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-[#f8f9fe] rounded-xl border border-transparent px-3.5 py-2.5 text-gray-700 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          <div className="md:col-span-6 flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setDepartmentFilter('');
                setCourseFilter('');
                setStartDate('');
                setEndDate('');
                setSortBy('newest');
              }}
              className="text-[11px] font-bold text-purple-600 hover:text-purple-700 hover:underline transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Table or Empty State */}
      <div className="bg-white border-0 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.03)] overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-400 bg-gray-50/50">
            <Loader message="Fetching applications dashboard..." />
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="py-20 text-center text-gray-400 bg-gray-50/50">
            <ClipboardList size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="font-bold text-gray-500 text-lg">No Applications Found</h3>
            <p className="text-sm text-gray-400 mt-1 font-medium">Try modifying your filter options or add a manual admission entry.</p>
            <div className="pt-4">
              <Button onClick={() => navigate('/college/admission-form')} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-5 py-2.5 shadow-md">
                <Plus size={16} className="mr-1.5" />
                Create Manual Admission
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="text-[11px] text-gray-400 font-black uppercase tracking-wider bg-[#f8f9fe] border-b border-gray-100">
                <tr>
                  <th className="py-5 px-6">App ID</th>
                  <th className="py-5 px-6">Student</th>
                  <th className="py-5 px-6">Department</th>
                  <th className="py-5 px-6">Course</th>
                  <th className="py-5 px-6">Status</th>
                  <th className="py-5 px-6">Created Date</th>
                  <th className="py-5 px-6 text-center w-[180px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredApplications.map((app, index) => {
                  const currentStatus = STAGE_MAP_TO_STATUS[app.stage] || 'New';
                  return (
                    <React.Fragment key={app._id}>
                      <tr 
                        className={`hover:bg-purple-50/20 transition-colors ${
                          expandedAppId === app._id ? 'bg-indigo-50/20' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        }`}
                      >
                        <td className="py-3.5 px-6 font-black text-gray-900 whitespace-nowrap">{app.applicationId}</td>
                        <td className="py-3.5 px-6 text-gray-800">
                          <div className="font-bold text-gray-900 leading-tight">{app.studentName}</div>
                          <span className="block text-[10px] text-gray-500 font-semibold mt-0.5">
                            {app.email} | {app.parentMobile || app.mobile}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 font-bold text-gray-600">
                          {app.departmentId?.name || 'N/A'}
                        </td>
                        <td className="py-3.5 px-6 font-bold text-gray-600">
                          {app.courseId?.name || 'N/A'}
                        </td>
                        <td className="py-3.5 px-6 font-bold text-center" onClick={(e) => e.stopPropagation()}>
                          
                          {/* Colorful Status Dropdown */}
                          <div className="relative inline-block w-[140px]">
                            <select
                              value={currentStatus}
                              onChange={(e) => handleStatusChangeDirectly(app._id, e.target.value)}
                              className={`w-full text-[10px] font-black uppercase rounded-lg pl-3 pr-7 py-2 cursor-pointer appearance-none transition-all outline-none border shadow-sm focus:ring-2 focus:ring-offset-1 ${
                                currentStatus === 'New' ? 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500' :
                                currentStatus === 'Hold' ? 'bg-orange-50 text-orange-700 border-orange-200 focus:ring-orange-500' :
                                currentStatus === 'Not Interested' ? 'bg-red-50 text-red-700 border-red-200 focus:ring-red-500' :
                                currentStatus === 'Admission Confirmed' ? 'bg-teal-50 text-teal-700 border-teal-200 focus:ring-teal-500' :
                                'bg-purple-50 text-purple-700 border-purple-200 focus:ring-purple-500'
                              }`}
                            >
                              {STATUS_OPTIONS.map(opt => (
                                <option key={opt} value={opt} className="bg-white text-gray-800 uppercase font-bold">
                                  {opt}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                              <ChevronDown size={14} className="opacity-50" />
                            </div>
                          </div>

                        </td>
                        <td className="py-3.5 px-6 text-xs text-gray-700 font-semibold whitespace-nowrap">
                          {new Date(app.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-3.5 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                          
                          {/* Correct Action Buttons using standard <button> tag */}
                          <div className="flex items-center justify-center gap-2">
                            <button
                              className={`h-9 w-9 p-0 flex items-center justify-center border rounded-xl transition-all shadow-sm ${
                                expandedAppId === app._id 
                                  ? 'bg-purple-600 text-white shadow-md shadow-purple-200 border-transparent' 
                                  : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600'
                              }`}
                              onClick={() => setExpandedAppId(expandedAppId === app._id ? null : app._id)}
                              title={expandedAppId === app._id ? "Hide Timeline" : "Timeline"}
                            >
                              <GitCommit size={18} strokeWidth={2} />
                            </button>

                            <button
                              className="h-9 w-9 p-0 flex items-center justify-center border border-gray-200 rounded-xl bg-gray-50 text-gray-500 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 hover:shadow-xs transition-all shadow-sm"
                              onClick={() => handleViewDetails(app._id)}
                              title="View Details"
                            >
                              <Eye size={18} strokeWidth={2} />
                            </button>

                            <button
                              className="h-9 w-9 p-0 flex items-center justify-center border border-gray-200 rounded-xl bg-gray-50 text-gray-500 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 hover:shadow-xs transition-all shadow-sm"
                              onClick={() => handleOpenContactModal(app)}
                              title="Contact"
                            >
                              <Phone size={18} strokeWidth={2} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Distinct Timeline Section Highlight */}
                      <AnimatePresence>
                        {expandedAppId === app._id && (
                          <tr className="bg-indigo-50/40">
                            <td colSpan={7} className="p-0 border-b border-indigo-100">
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} 
                                exit={{ opacity: 0, height: 0 }}
                                className="m-4 lg:m-6 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-2 border-indigo-100 overflow-hidden"
                              >
                                
                                {/* Gradient Header */}
                                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center text-white">
                                  <h4 className="font-black flex items-center gap-2 tracking-wide uppercase text-sm">
                                    <GitCommit size={20} /> CRM Application Journey
                                  </h4>
                                  <button onClick={() => setExpandedAppId(null)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-all">
                                    <X size={18} />
                                  </button>
                                </div>

                                <div className="p-6 space-y-6">
                                  
                                  {/* Student Info Top Bar */}
                                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
                                    <div className="space-y-2 text-left">
                                      <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-xl font-black text-gray-900 leading-none">{app.studentName}</h3>
                                        <span className="px-3 py-1 rounded-md text-[10px] font-black bg-purple-100 text-purple-700">
                                          {app.applicationId}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 font-bold">
                                        <span>Course Seeking: <strong className="text-gray-700">{app.courseId?.name || 'N/A'} ({app.departmentId?.name || 'N/A'})</strong></span>
                                        <span className="h-1 w-1 rounded-full bg-gray-300" />
                                        <span>City: <strong className="text-gray-700">{app.city}</strong></span>
                                        <span className="h-1 w-1 rounded-full bg-gray-300" />
                                        <span>Parent: <strong className="text-gray-700">{app.parentName} ({app.parentMobile})</strong></span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 font-bold text-xs" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={() => handleViewDetails(app._id)}
                                        className="h-9 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
                                      >
                                        View Profile
                                      </button>
                                      <button
                                        onClick={() => handleOpenContactModal(app)}
                                        className="h-9 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl transition-all"
                                      >
                                        Quick Contact
                                      </button>
                                    </div>
                                  </div>

                                  {/* CRM Admissions Journey Timeline */}
                                  <div className="bg-[#f8f9fe] rounded-2xl p-6 border border-gray-100">
                                    <AdmissionJourneyTimeline
                                      enquiry={app}
                                      stageOptions={['Call', 'WhatsApp', 'Email', 'Meeting', 'Documents Requested', 'Documents Submitted', 'Counselling Session', 'Department Discussion', 'Course Selection', 'Scholarship Discussion', 'Admission Confirmed', 'Rejected', 'Closed', 'Other']}
                                      onSaveJourney={(updatedJourney) => handleSaveJourney(app._id, updatedJourney)}
                                      counselorName="Admin"
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Center Student Details Modal (Redesigned Reusable CRMProfileModal) */}
      <CRMProfileModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedApp(null);
        }}
        data={selectedApp}
        type="college"
        onSaveJourney={async (updatedJourney) => {
          await handleSaveJourney(selectedApp._id, updatedJourney);
          setSelectedApp(prev => ({ ...prev, journey: updatedJourney }));
        }}
        onDocVerify={handleDocVerify}
        onAddNote={async (noteText) => {
          const res = await api.post(`/college/applications/${selectedApp._id}/note`, { note: noteText });
          if (res.success) {
            toast.success('Counseling note logged successfully!');
            setSelectedApp(res.data);
            fetchApplications();
          }
        }}
        schoolName="Admin"
        stageOptions={['Call', 'WhatsApp', 'Email', 'Meeting', 'Documents Requested', 'Documents Submitted', 'Counselling Session', 'Department Discussion', 'Course Selection', 'Scholarship Discussion', 'Admission Confirmed', 'Rejected', 'Closed', 'Other']}
      />

      {/* Reusable ContactModal component */}
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => {
          setContactModalOpen(false);
          setContactApp(null);
        }}
        data={contactApp}
        type="college"
      />
    </div>
  );
};

export default Applications;