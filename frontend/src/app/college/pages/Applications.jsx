import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../school/services/schoolApi';
import Loader from '../../../shared/components/Loader';
import Button from '../../../shared/components/Button';
import toast from 'react-hot-toast';
import AdmissionJourneyTimeline from '../../../shared/components/AdmissionJourneyTimeline';
import CRMProfileModal from '../../../shared/components/CRMProfileModal';
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
  'Admission Confirmed': 'bg-green-50 text-green-700 border-green-200 focus:ring-green-500/20'
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
    <div className="space-y-6 text-left relative">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Applications CRM Desk</h2>
          <p className="text-slate-500 text-xs mt-0.5">Filter, track status, verify documents, and log counseling details.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="text-xs py-2 px-4 bg-white" onClick={handleExportCSV}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Advanced Filter Section */}
      <div className="bg-white rounded-2xl border border-slate-100 p-3.5 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Search Term */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Search Applicant</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name, email, mobile, ID..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Department Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="">All Departments</option>
              {uniqueDepts.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Course Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Course</label>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="">All Courses</option>
              {uniqueCourses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>

          {/* Date Range - Start */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            />
          </div>

          {/* Date Range - End */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            />
          </div>

          {/* Sorting */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
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
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Table or Empty State */}
      {loading ? (
        <div className="py-12">
          <Loader message="Fetching applications dashboard..." />
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <ClipboardList className="h-8 w-8 text-slate-350" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No Applications Found</h3>
            <p className="text-slate-500 text-xs mt-1">Try modifying your filter options or add a manual admission entry.</p>
          </div>
          <div className="pt-2">
            <Button onClick={() => navigate('/college/admission-form')} className="px-5 py-2.5 text-xs font-bold shadow-md shadow-indigo-600/10">
              <Plus className="h-4 w-4 mr-1.5" />
              Create Manual Admission
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400 bg-slate-50/50">
                  <th className="py-2.5 px-6">App ID</th>
                  <th className="py-2.5 px-6">Student</th>
                  <th className="py-2.5 px-6">Department</th>
                  <th className="py-2.5 px-6">Course</th>
                  <th className="py-2.5 px-6">Status</th>
                  <th className="py-2.5 px-6">Created Date</th>
                  <th className="py-2.5 px-6 text-right w-[220px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.map((app, index) => {
                  const currentStatus = STAGE_MAP_TO_STATUS[app.stage] || 'New';
                  return (
                    <React.Fragment key={app._id}>
                      <tr 
                        className={`border-b border-slate-50 text-xs text-slate-600 hover:bg-slate-50/75 transition-colors ${
                          expandedAppId === app._id ? 'bg-indigo-50/30 font-semibold' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                        }`}
                      >
                        <td className="py-2.5 px-6 font-bold text-indigo-650 whitespace-nowrap">{app.applicationId}</td>
                        <td className="py-2.5 px-6">
                          <div>
                            <p className="font-semibold text-slate-850">{app.studentName}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{app.email} | {app.parentMobile || app.mobile}</p>
                          </div>
                        </td>
                        <td className="py-2.5 px-6 font-semibold text-slate-700">
                          {app.departmentId?.name || 'N/A'}
                        </td>
                        <td className="py-2.5 px-6 font-semibold text-slate-700">
                          {app.courseId?.name || 'N/A'}
                        </td>
                        <td className="py-2.5 px-6" onClick={(e) => e.stopPropagation()}>
                          {/* Inline status dropdown */}
                          <select
                            value={currentStatus}
                            onChange={(e) => handleStatusChangeDirectly(app._id, e.target.value)}
                            className={`px-3 py-1.5 rounded-full font-bold text-[10px] uppercase border cursor-pointer focus:outline-none transition-all ${STATUS_COLOR_MAP[currentStatus]}`}
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt} value={opt} className="bg-white text-slate-800 uppercase font-semibold">
                                {opt}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-6 font-semibold text-slate-555">
                          {new Date(app.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-2.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2 font-bold">
                            {/* Timeline Toggle Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              className={`border-[#E5E7EB] hover:bg-slate-100 text-slate-700 h-10 px-3.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                                expandedAppId === app._id ? 'bg-indigo-50 border-[#6D5DF6] text-[#6D5DF6] hover:bg-indigo-100' : ''
                              }`}
                              onClick={() => setExpandedAppId(expandedAppId === app._id ? null : app._id)}
                              title={expandedAppId === app._id ? "Hide Timeline Accordion" : "View Timeline Accordion"}
                            >
                              <GitCommit className="h-4 w-4 text-current" />
                              <span>{expandedAppId === app._id ? "Hide Timeline" : "Timeline"}</span>
                            </Button>

                            {/* View Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-slate-200 text-slate-650 hover:bg-slate-100 rounded-lg h-10 w-10 flex items-center justify-center transition-all"
                              onClick={() => handleViewDetails(app._id)}
                              title="View Complete Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {/* Contact Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-emerald-250 text-emerald-705 hover:bg-emerald-100 rounded-lg h-10 w-10 flex items-center justify-center transition-all"
                              onClick={() => handleOpenContactModal(app)}
                              title="Quick Contact CRM"
                            >
                              <PhoneCall className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                    {/* Expandable CRM Journey Timeline Row */}
                    <AnimatePresence>
                      {expandedAppId === app._id && (
                        <tr className="bg-[#F8FAFC]">
                          <td colSpan={7} className="px-6 py-6 border-b border-[#E5E7EB]">
                            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-xs space-y-6">
                              {/* Top Information Bar / Application Header */}
                              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
                                <div className="space-y-1.5 text-left">
                                  <div className="flex flex-wrap items-center gap-2.5">
                                    <h3 className="text-[18px] font-semibold text-slate-800 leading-none">{app.studentName}</h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-[#6D5DF6] border border-indigo-100">
                                      {app.applicationId}
                                    </span>
                                    {/* Status Badge */}
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border tracking-wider ${
                                      app.stage === 'Counselling Assigned' || app.stage === 'New'
                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                        : app.stage === 'Call Scheduled' || app.stage === 'Hold'
                                        ? 'bg-amber-50 border-amber-250 text-amber-700'
                                        : app.stage === 'Rejected' || app.stage === 'Not Interested'
                                        ? 'bg-rose-50 border-rose-250 text-rose-750'
                                        : app.stage === 'Admission Confirmed' || app.stage === 'Confirmed'
                                        ? 'bg-emerald-50 border-emerald-250 text-emerald-700'
                                        : 'bg-purple-50 border-purple-250 text-purple-750'
                                    }`}>
                                      {STAGE_MAP_TO_STATUS[app.stage] ? STAGE_MAP_TO_STATUS[app.stage].toUpperCase() : 'NEW'}
                                    </span>
                                  </div>

                                  {/* Metadata Line */}
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-semibold">
                                    <span>Course Seeking: <strong>{app.courseId?.name || 'N/A'} ({app.departmentId?.name || 'N/A'})</strong></span>
                                    <span className="h-1 w-1 rounded-full bg-slate-350" />
                                    <span>City: <strong>{app.city}</strong></span>
                                    <span className="h-1 w-1 rounded-full bg-slate-355" />
                                    <span>Parent: <strong>{app.parentName} ({app.parentMobile})</strong></span>
                                    <span className="h-1 w-1 rounded-full bg-slate-355" />
                                    <span>Submitted: <strong>{new Date(app.createdAt).toLocaleDateString()}</strong></span>
                                  </div>
                                </div>

                                {/* Action Buttons Header Right */}
                                <div className="flex items-center gap-2 font-bold text-xs" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleViewDetails(app._id)}
                                    className="border-[#E5E7EB] hover:bg-slate-50 text-slate-700 h-8 px-3 text-xs font-bold rounded-lg transition-all"
                                  >
                                    View Profile
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleOpenContactModal(app)}
                                    className="border-emerald-250 hover:bg-emerald-50 text-emerald-700 h-8 px-3 text-xs font-bold rounded-lg transition-all"
                                  >
                                    Quick Contact
                                  </Button>
                                </div>
                              </div>

                              {/* CRM Admissions Journey Timeline */}
                              <AdmissionJourneyTimeline
                                enquiry={app}
                                stageOptions={['Call', 'WhatsApp', 'Email', 'Meeting', 'Documents Requested', 'Documents Submitted', 'Counselling Session', 'Department Discussion', 'Course Selection', 'Scholarship Discussion', 'Admission Confirmed', 'Rejected', 'Closed', 'Other']}
                                onSaveJourney={(updatedJourney) => handleSaveJourney(app._id, updatedJourney)}
                                counselorName="Admin"
                              />
                            </div>
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
        </div>
      )}

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

      {/* ── Contact Applicant Modal ── */}
      <AnimatePresence>
        {contactModalOpen && contactApp && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setContactModalOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            {/* Centered Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-55 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col text-left">
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-50 to-white">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <PhoneCall className="h-4 w-4 text-emerald-600" />
                      </div>
                      Contact Applicant
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>
                        <span className="font-bold text-slate-700">{contactApp.studentName}</span>
                      </span>
                      <span className="h-1 w-1 rounded-full bg-slate-300 inline-block" />
                      <span className="font-semibold text-indigo-600">{contactApp.applicationId}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300 inline-block" />
                      <span>{contactApp.courseId?.name || 'N/A'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setContactModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Applicant Info Summary */}
                <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Student Mobile</p>
                      <p className="font-semibold text-slate-700">{contactApp.mobile || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Parent Mobile</p>
                      <p className="font-semibold text-slate-700">{contactApp.parentMobile || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Email</p>
                      <p className="font-semibold text-slate-700 truncate">{contactApp.email || contactApp.parentEmail || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Current Status</p>
                      <span className="px-2 py-0.5 rounded-full font-bold text-[9px] bg-indigo-50 text-indigo-600 uppercase tracking-wide">
                        {STAGE_MAP_TO_STATUS[contactApp.stage] || 'New'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Action Cards */}
                <div className="px-6 py-6 overflow-y-auto">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-4">Quick Contact Actions</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* 📞 Call Student */}
                    <a
                      href={contactApp.mobile ? `tel:${contactApp.mobile}` : '#'}
                      onClick={(e) => { if (!contactApp.mobile) { e.preventDefault(); toast.error('Student mobile number not available'); } }}
                      className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer"
                    >
                      <div className="h-12 w-12 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center shrink-0 transition-colors">
                        <Phone className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">Call Student</p>
                        <p className="text-xs text-slate-400 mt-0.5">{contactApp.mobile || 'No number'}</p>
                      </div>
                    </a>

                    {/* 📞 Call Parent */}
                    <a
                      href={contactApp.parentMobile ? `tel:${contactApp.parentMobile}` : '#'}
                      onClick={(e) => { if (!contactApp.parentMobile) { e.preventDefault(); toast.error('Parent mobile number not available'); } }}
                      className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:bg-violet-50 hover:border-violet-300 transition-all cursor-pointer"
                    >
                      <div className="h-12 w-12 rounded-xl bg-violet-100 group-hover:bg-violet-200 flex items-center justify-center shrink-0 transition-colors">
                        <Users className="h-5 w-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-violet-700 transition-colors">Call Parent</p>
                        <p className="text-xs text-slate-400 mt-0.5">{contactApp.parentName ? `${contactApp.parentName} — ` : ''}{contactApp.parentMobile || 'No number'}</p>
                      </div>
                    </a>

                    {/* 💬 WhatsApp Student */}
                    <a
                      href={contactApp.mobile ? `https://wa.me/${formatWhatsApp(contactApp.mobile)}` : '#'}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => { if (!contactApp.mobile) { e.preventDefault(); toast.error('Student mobile number not available'); } }}
                      className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:bg-green-50 hover:border-green-300 transition-all cursor-pointer"
                    >
                      <div className="h-12 w-12 rounded-xl bg-green-100 group-hover:bg-green-200 flex items-center justify-center shrink-0 transition-colors">
                        <MessageCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-green-700 transition-colors">WhatsApp Student</p>
                        <p className="text-xs text-slate-400 mt-0.5">{contactApp.mobile || 'No number'}</p>
                      </div>
                    </a>

                    {/* 💬 WhatsApp Parent */}
                    <a
                      href={contactApp.parentMobile ? `https://wa.me/${formatWhatsApp(contactApp.parentMobile)}` : '#'}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => { if (!contactApp.parentMobile) { e.preventDefault(); toast.error('Parent mobile number not available'); } }}
                      className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer"
                    >
                      <div className="h-12 w-12 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center shrink-0 transition-colors">
                        <MessageCircle className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">WhatsApp Parent</p>
                        <p className="text-xs text-slate-400 mt-0.5">{contactApp.parentName ? `${contactApp.parentName} — ` : ''}{contactApp.parentMobile || 'No number'}</p>
                      </div>
                    </a>

                    {/* 📧 Send Email Student */}
                    <a
                      href={`mailto:${contactApp.email || contactApp.parentEmail || ''}`}
                      onClick={(e) => {
                        if (!contactApp.email && !contactApp.parentEmail) {
                          e.preventDefault();
                          toast.error('No email address available');
                        }
                      }}
                      className="group sm:col-span-2 flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-300 transition-all cursor-pointer"
                    >
                      <div className="h-12 w-12 rounded-xl bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center shrink-0 transition-colors">
                        <Mail className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-amber-700 transition-colors">Email Student</p>
                        <p className="text-xs text-slate-400 mt-0.5">{contactApp.email || contactApp.parentEmail || 'No email'}</p>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setContactModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Applications;
