import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../school/services/schoolApi';
import Loader from '../../../shared/components/Loader';
import Button from '../../../shared/components/Button';
import CollapsibleFilters, { FilterRow, SelectFilter, DateFilter, TimelineFilter } from '../../../shared/components/CollapsibleFilters';
import DeleteConfirmationModal from '../../../shared/components/DeleteConfirmationModal';
import toast from 'react-hot-toast';
import AdmissionJourneyTimeline from '../../../shared/components/AdmissionJourneyTimeline';
import CRMProfileModal from '../../../shared/components/CRMProfileModal';
import ContactModal from '../../../shared/components/ContactModal';
import AssessmentPortalModal from '../../school/components/AssessmentPortalModal';
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
  MessageSquare,
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
  GitCommit,
  Trash2
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
  const [timelineFilter, setTimelineFilter] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Details Modal state
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedEnquiryForAssessment, setSelectedEnquiryForAssessment] = useState(null);
  const [newNote, setNewNote] = useState('');

  // Contact Modal state
  const [contactApp, setContactApp] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Delete Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Handle select all rows
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredApplications.map((app) => app._id));
    } else {
      setSelectedIds([]);
    }
  };

  // Handle single row selection
  const handleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Get selected applications details
  const getSelectedApplicationsDetails = () => {
    return filteredApplications.filter((app) => selectedIds.includes(app._id));
  };

  const getPersonalizedMessage = (template, app) => {
    return template
      .replace(/\[Parent Name\]/g, app.parentName)
      .replace(/\[Student Name\]/g, app.studentName)
      .replace(/\[Application ID\]/g, app.applicationId);
  };

  const launchCommunication = (app) => {
    const text = getPersonalizedMessage(messageBody, app);
    const encodedText = encodeURIComponent(text);

    if (messageType === 'whatsapp') {
      const number = app.whatsapp || app.parentMobile || app.mobile;
      const cleanNumber = number.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanNumber}?text=${encodedText}`, '_blank');
    } else {
      const subject = encodeURIComponent(messageSubject || 'College Admission Follow-up');
      window.open(`mailto:${app.email}?subject=${subject}&body=${encodedText}`, '_blank');
    }
  };

  const launchBulkEmail = () => {
    const selectedList = getSelectedApplicationsDetails().filter((a) => a.email);
    if (selectedList.length === 0) {
      toast.error('None of the selected applications have valid email addresses.');
      return;
    }
    
    const bccList = selectedList.map((a) => a.email).join(',');
    const subject = encodeURIComponent(messageSubject || 'Admission Follow-up');
    const firstApp = selectedList[0];
    const text = messageBody
      .replace(/\[Parent Name\]/g, 'Parent')
      .replace(/\[Student Name\]/g, 'your child')
      .replace(/\[Application ID\]/g, 'Application ID');
    const encodedText = encodeURIComponent(text);

    window.open(`mailto:?bcc=${bccList}&subject=${subject}&body=${encodedText}`, '_blank');
    toast.success('Mail client opened with BCC list!');
    setMessageModalOpen(false);
  };

  // Communication Modal States
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageType, setMessageType] = useState('whatsapp');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const handleDeleteClick = (app) => {
    setAppToDelete(app);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!appToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await api.delete(`/college/applications/${appToDelete._id}`);
      if (response.success) {
        toast.success('Application deleted successfully');
        setApplications(prev => prev.filter(app => app._id !== appToDelete._id));
        setDeleteModalOpen(false);
        setAppToDelete(null);
        window.dispatchEvent(new CustomEvent('crm-tasks-updated'));
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete application');
    } finally {
      setIsDeleting(false);
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
        window.dispatchEvent(new CustomEvent('crm-tasks-updated'));
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleSaveJourney = async (appId, updatedJourney, journeyStatus, closedMetadata) => {
    try {
      const payload = { journey: updatedJourney };
      if (journeyStatus) payload.journeyStatus = journeyStatus;
      if (closedMetadata) {
        payload.closedBy = closedMetadata.closedBy;
        payload.closedAt = closedMetadata.closedAt;
        payload.closedStage = closedMetadata.closedStage;
      } else if (journeyStatus === 'ACTIVE') {
        payload.closedBy = '';
        payload.closedAt = null;
        payload.closedStage = '';
      }
      const response = await api.put(`/college/applications/${appId}/stage`, payload);
      if (response.success) {
        toast.success('Admission journey updated successfully!');
        setApplications(prev => prev.map(app => app._id === appId ? { 
          ...app, 
          journey: response.data.journey, 
          stage: response.data.stage, 
          journeyStatus: response.data.journeyStatus,
          closedBy: response.data.closedBy,
          closedAt: response.data.closedAt,
          closedStage: response.data.closedStage
        } : app));
        window.dispatchEvent(new CustomEvent('crm-tasks-updated'));
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

    // 6. Timeline filter (based on latest journey stage)
    if (timelineFilter) {
      const latestStage = app.journey && app.journey.length > 0 
        ? app.journey[app.journey.length - 1].stage 
        : null;
      if (latestStage !== timelineFilter) return false;
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
    <div className="min-h-screen bg-[#FFF4F8] px-3 md:px-5 lg:px-6 pb-6 pt-8 font-sans text-gray-800">
      <div className="max-w-[1400px] mx-auto space-y-5">

      {/* Page Header (No Card) */}
      <div className="mb-5">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-[24px] font-bold text-[#1F2937] tracking-tight leading-[1.2]">Applications CRM Desk</h1>
          <div className="flex items-center h-[36px] px-[16px] bg-[#FCE7F3] border border-[#F9A8D4] text-[#DB2777] font-semibold text-xs rounded-[12px] shrink-0">
            {filteredApplications.length} Records
          </div>
        </div>
        <p className="text-[#64748B] text-[15px] font-medium mt-1.5">
          Filter, track status, verify documents, and log counseling details.
        </p>
      </div>

      {/* Advanced Filter Section */}
      <CollapsibleFilters
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onExport={handleExportCSV}
        isExpanded={filtersExpanded}
        onToggleExpand={() => setFiltersExpanded(!filtersExpanded)}
        searchPlaceholder="Search by ID, name, email, mobile..."
      >
        <FilterRow>
          {/* Status Filter */}
          <SelectFilter
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '', label: 'All Statuses' },
              ...STATUS_OPTIONS.map(opt => ({ value: opt, label: opt }))
            ]}
            placeholder="All Statuses"
          />

          {/* Department Filter */}
          <SelectFilter
            label="Department"
            value={departmentFilter}
            onChange={setDepartmentFilter}
            options={[
              { value: '', label: 'All Departments' },
              ...uniqueDepts.map(dept => ({ value: dept.id, label: dept.name }))
            ]}
            placeholder="All Departments"
          />

          {/* Course Filter */}
          <SelectFilter
            label="Course"
            value={courseFilter}
            onChange={setCourseFilter}
            options={[
              { value: '', label: 'All Courses' },
              ...uniqueCourses.map(course => ({ value: course.id, label: course.name }))
            ]}
            placeholder="All Courses"
          />
        </FilterRow>

        <FilterRow>
          {/* Start Date */}
          <DateFilter
            label="Start Date"
            value={startDate}
            onChange={setStartDate}
          />

          {/* End Date */}
          <DateFilter
            label="End Date"
            value={endDate}
            onChange={setEndDate}
          />

          {/* Sort By */}
          <SelectFilter
            label="Sort By"
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'newest', label: 'Newest First' },
              { value: 'oldest', label: 'Oldest First' },
            ]}
            placeholder="Sort By"
          />
        </FilterRow>

        <FilterRow>
          {/* Timeline Filter */}
          <TimelineFilter
            value={timelineFilter}
            onChange={setTimelineFilter}
          />
        </FilterRow>
      </CollapsibleFilters>

      {/* Selected Action floating bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-gradient-to-r from-[#7E63F6] to-[#9781F8] text-white rounded-xl px-5 py-3 card-flat flex items-center justify-between flex-wrap gap-3"
          >
            <span className="text-xs font-semibold">
              {selectedIds.length} applications selected
            </span>
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 border-none shadow-xs text-white"
                onClick={() => {
                  setMessageType('whatsapp');
                  setMessageModalOpen(true);
                }}
              >
                <MessageSquare size={16} className="mr-1.5" />
                WhatsApp Selected
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 border-none shadow-xs text-white"
                onClick={() => {
                  setMessageType('email');
                  setMessageModalOpen(true);
                }}
              >
                <Mail size={16} className="mr-1.5" />
                Email Selected
              </Button>
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs font-bold text-slate-300 hover:text-white"
              >
                Clear Selection
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Table Card */}
      <div className="bg-white border border-[#E8ECF3] rounded-[18px] card-elevated overflow-hidden" style={{ boxShadow: '0 14px 35px rgba(233, 30, 99, 0.08)' }}>
        <div className="h-[4px] w-full bg-[#E91E63] rounded-t-[18px]" />
        {loading ? (
          <div className="py-20 text-center">
            <Loader message="Fetching applications..." />
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#7E63F6]/10 flex items-center justify-center mx-auto mb-4">
              <ClipboardList size={28} className="text-[#7E63F6]" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm">No Applications Found</h3>
            <p className="text-xs text-gray-400 font-medium mt-1">Try modifying your filter options or add a manual admission entry.</p>
            <div className="pt-4">
              <Button onClick={() => navigate('/college/admission-form')} className="bg-gradient-to-r from-[#7E63F6] to-[#9781F8] text-white rounded-xl px-5 py-2.5 shadow-md">
                <Plus size={16} className="mr-1.5" />
                Create Manual Admission
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="text-[13px] text-[#5A3345] font-bold uppercase tracking-[0.6px] border-b border-[#F2C8DA] sticky top-0 shadow-[0_3px_10px_rgba(233,30,99,0.08)]" style={{ background: 'linear-gradient(90deg, #FFF5F8 0%, #FCE8F1 45%, #FFF7FA 100%)', height: '56px' }}>
                <tr style={{ height: '56px' }}>
                  <th className="py-0 px-5 w-12 text-center border-r border-[rgba(233,30,99,0.08)] last:border-r-0 align-middle">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        filteredApplications.length > 0 && selectedIds.length === filteredApplications.length
                      }
                      className="rounded-md text-[#E91E63] border-[#F2C8DA] bg-white focus:ring-[#E91E63]/20 focus:border-[#E91E63] h-4.5 w-4.5 cursor-pointer"
                    />
                  </th>
                  <th className="py-0 px-5 border-r border-[rgba(233,30,99,0.08)] last:border-r-0 align-middle">App ID</th>
                  <th className="py-0 px-5 border-r border-[rgba(233,30,99,0.08)] last:border-r-0 align-middle">Student</th>
                  <th className="py-0 px-5 border-r border-[rgba(233,30,99,0.08)] last:border-r-0 align-middle">Department</th>
                  <th className="py-0 px-5 border-r border-[rgba(233,30,99,0.08)] last:border-r-0 align-middle">Course</th>
                  <th className="py-0 px-5 border-r border-[rgba(233,30,99,0.08)] last:border-r-0 align-middle">Status</th>
                  <th className="py-0 px-5 border-r border-[rgba(233,30,99,0.08)] last:border-r-0 align-middle">Created Date</th>
                  <th className="py-0 px-5 text-center w-[180px] last:border-r-0 align-middle">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8ECF3]">
                {filteredApplications.map((app, index) => {
                  const currentStatus = STAGE_MAP_TO_STATUS[app.stage] || 'New';
                  return (
                    <React.Fragment key={app._id}>
                      <tr 
                        className={`transition-all duration-200 ease-out hover:bg-[#FFF7FA] ${
                          expandedAppId === app._id 
                            ? 'bg-[#FFF7FA] border-l-4 border-l-[#E91E63] shadow-xs' 
                            : 'border-l-4 border-l-transparent'
                        }`}
                      >
                        <td className="px-5 py-2.5 text-center border-r border-[rgba(233,30,99,0.04)] last:border-r-0" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(app._id)}
                            onChange={() => handleSelectRow(app._id)}
                            className="rounded-md text-[#E91E63] border-[#F2C8DA] bg-white focus:ring-[#E91E63]/20 focus:border-[#E91E63] h-4.5 w-4.5 cursor-pointer"
                          />
                        </td>
                        <td className="px-5 py-2.5 font-bold text-gray-900 whitespace-nowrap text-sm border-r border-[rgba(233,30,99,0.04)] last:border-r-0">{app.applicationId}</td>
                        <td className="px-5 py-2.5 text-gray-800 border-r border-[rgba(233,30,99,0.04)] last:border-r-0">
                          <div className="font-semibold text-gray-900 text-[13px] leading-tight">{app.studentName}</div>
                          <span className="block text-[10px] text-gray-400 font-semibold mt-0.5">
                            {app.email} | {app.parentMobile || app.mobile}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 border-r border-[rgba(233,30,99,0.04)] last:border-r-0">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#5091F8]/10 text-[#5091F8]">
                            {app.departmentId?.name || 'N/A'}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 border-r border-[rgba(233,30,99,0.04)] last:border-r-0">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7E63F6]/10 text-[#7E63F6]">
                            {app.courseId?.name || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-2 font-bold text-center border-r border-[rgba(233,30,99,0.04)] last:border-r-0" onClick={(e) => e.stopPropagation()}>
                          
                          {/* Colorful Status Dropdown */}
                          <div className="relative inline-block w-[140px]">
                            <select
                              value={currentStatus}
                              onChange={(e) => handleStatusChangeDirectly(app._id, e.target.value)}
                              className={`w-full text-[10px] font-black uppercase rounded-lg pl-3 pr-7 py-1.5 cursor-pointer appearance-none transition-all outline-none border shadow-sm focus:ring-2 focus:ring-offset-1 ${
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
                        <td className="px-5 py-2.5 text-xs text-gray-700 font-semibold whitespace-nowrap border-r border-[rgba(233,30,99,0.04)] last:border-r-0">
                          {new Date(app.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-5 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              className={`h-10 w-10 p-0 flex items-center justify-center border rounded-xl shadow-[0_3px_10px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_15px_rgba(15,23,42,0.08)] ${
                                expandedAppId === app._id 
                                  ? 'bg-[#6366F1]/15 border-[#6366F1]/30 text-[#6366F1]' 
                                  : 'bg-[#EEF2FF] border-[#E8ECF3] text-[#6366F1] hover:bg-[#6366F1] hover:text-white hover:border-[#6366F1]'
                              }`}
                              onClick={() => setExpandedAppId(expandedAppId === app._id ? null : app._id)}
                              title={expandedAppId === app._id ? "Hide Timeline" : "Timeline"}
                            >
                              <GitCommit size={16} strokeWidth={2} />
                            </button>

                            <button
                              className="h-10 w-10 p-0 flex items-center justify-center border border-[#E8ECF3] rounded-xl bg-[#EFF6FF] text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white hover:border-[#3B82F6] shadow-[0_3px_10px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 hover:shadow-[0_6px_15px_rgba(15,23,42,0.08)] transition-all duration-200"
                              onClick={() => handleViewDetails(app._id)}
                              title="View Details"
                            >
                              <Eye size={16} strokeWidth={2} />
                            </button>

                            <button
                              className={`h-10 w-10 p-0 flex items-center justify-center border border-[#E8ECF3] rounded-xl bg-[#ECFDF5] text-[#10B981] hover:bg-[#10B981] hover:text-white hover:border-[#10B981] shadow-[0_3px_10px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 hover:shadow-[0_6px_15px_rgba(15,23,42,0.08)] transition-all duration-200 ${app.journeyStatus === 'CLOSED' ? 'opacity-50 cursor-not-allowed' : ''}`}
                              onClick={() => {
                                if (app.journeyStatus === 'CLOSED') {
                                  toast.error('This journey has been closed. Contact blocked.');
                                  return;
                                }
                                handleOpenContactModal(app);
                              }}
                              title={app.journeyStatus === 'CLOSED' ? "Journey Closed - Contact Blocked" : "Contact"}
                            >
                              <Phone size={16} strokeWidth={2} />
                            </button>

                            <button
                              className="h-10 w-10 p-0 flex items-center justify-center border border-[#E8ECF3] rounded-xl bg-[#FEF2F2] text-[#EF4444] hover:bg-[#EF4444] hover:text-white hover:border-[#EF4444] shadow-[0_3px_10px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 hover:shadow-[0_6px_15px_rgba(15,23,42,0.08)] transition-all duration-200"
                              onClick={() => handleDeleteClick(app)}
                              title="Delete"
                            >
                              <Trash2 size={16} strokeWidth={2} />
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
                                className="m-4 lg:m-6 bg-white border border-indigo-100 rounded-xl shadow-sm overflow-hidden"
                              >
                                
                                {/* Gradient Header */}
                                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex justify-between items-center text-white">
                                  <h4 className="font-black flex items-center gap-2 tracking-wide uppercase text-xs">
                                    <GitCommit size={18} /> CRM Application Journey
                                  </h4>
                                  <button onClick={() => setExpandedAppId(null)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-all">
                                    <X size={16} />
                                  </button>
                                </div>

                                <div className="p-4 space-y-4">
                                  
                                  {/* Student Info Top Bar */}
                                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                                    <div className="space-y-1 text-left">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-sm font-black text-gray-900 leading-none">{app.studentName}</h3>
                                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-purple-100 text-purple-700">
                                          {app.applicationId}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-500 font-bold">
                                        <span>Course: <strong className="text-gray-700">{app.courseId?.name || 'N/A'} ({app.departmentId?.name || 'N/A'})</strong></span>
                                        <span className="h-1 w-1 rounded-full bg-gray-300" />
                                        <span>City: <strong className="text-gray-700">{app.city}</strong></span>
                                        <span className="h-1 w-1 rounded-full bg-gray-300" />
                                        <span>Parent: <strong className="text-gray-700">{app.parentName} ({app.parentMobile})</strong></span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 font-bold text-xs" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={() => handleViewDetails(app._id)}
                                        className="h-7 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-all text-[10px]"
                                      >
                                        View Profile
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (app.journeyStatus === 'CLOSED') {
                                            toast.error('This journey has been closed. Contact blocked.');
                                            return;
                                          }
                                          handleOpenContactModal(app);
                                        }}
                                        className={`h-7 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition-all text-[10px] ${app.journeyStatus === 'CLOSED' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title={app.journeyStatus === 'CLOSED' ? "Journey Closed - Contact Blocked" : "Quick Contact"}
                                      >
                                        Quick Contact
                                      </button>
                                    </div>
                                  </div>

                                  {/* CRM Admissions Journey Timeline */}
                                  <div className="bg-[#f8f9fe] rounded-xl p-4 border border-gray-100">
                                    <AdmissionJourneyTimeline
                                      enquiry={app}
                                      stageOptions={['Call', 'WhatsApp', 'Email', 'Meeting', 'Documents Requested', 'Documents Submitted', 'Counselling Session', 'Department Discussion', 'Course Selection', 'Scholarship Discussion', 'Admission Confirmed', 'Rejected', 'Closed', 'Other']}
                                      onSaveJourney={(updatedJourney, journeyStatus, closedMetadata) => handleSaveJourney(app._id, updatedJourney, journeyStatus, closedMetadata)}
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
        onSaveJourney={async (updatedJourney, journeyStatus, closedMetadata) => {
          await handleSaveJourney(selectedApp._id, updatedJourney, journeyStatus, closedMetadata);
          setSelectedApp(prev => ({
            ...prev,
            journey: updatedJourney,
            journeyStatus: journeyStatus || prev.journeyStatus,
            closedBy: closedMetadata ? closedMetadata.closedBy : (journeyStatus === 'ACTIVE' ? '' : prev.closedBy),
            closedAt: closedMetadata ? closedMetadata.closedAt : (journeyStatus === 'ACTIVE' ? null : prev.closedAt),
            closedStage: closedMetadata ? closedMetadata.closedStage : (journeyStatus === 'ACTIVE' ? '' : prev.closedStage),
            stage: ['Admission Confirmed', 'Rejected', 'Closed'].includes(updatedJourney[updatedJourney.length - 1].stage) ? updatedJourney[updatedJourney.length - 1].stage : prev.stage
          }));
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
        onAssessments={() => {
          setSelectedEnquiryForAssessment(selectedApp);
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


      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setAppToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Application"
        itemType="application"
        itemInfo={appToDelete ? {
          'Application ID': appToDelete.applicationId,
          'Student Name': appToDelete.studentName,
          'Department': appToDelete.departmentId?.name || 'N/A',
          'Course': appToDelete.courseId?.name || 'N/A',
        } : {}}
        isDeleting={isDeleting}
      />

      {/* Bulk Communication Modal */}
      <AnimatePresence>
        {messageModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  {messageType === 'whatsapp' ? (
                    <MessageSquare size={18} className="text-emerald-600" />
                  ) : (
                    <Mail size={18} className="text-blue-600" />
                  )}
                  Draft Personalized Message
                </h3>
                <button
                  onClick={() => setMessageModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Customize your template message below. Placeholders like{' '}
                  <code className="bg-slate-100 text-indigo-600 px-1 py-0.5 rounded font-semibold">
                    [Parent Name]
                  </code>
                  ,{' '}
                  <code className="bg-slate-100 text-indigo-600 px-1 py-0.5 rounded font-semibold">
                    [Student Name]
                  </code>
                  , and{' '}
                  <code className="bg-slate-100 text-indigo-600 px-1 py-0.5 rounded font-semibold">
                    [Application ID]
                  </code>{' '}
                  will automatically populate with each contact's custom details.
                </p>

                {messageType === 'email' && (
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="block text-xs font-semibold text-slate-700 uppercase">
                      Email Subject
                    </label>
                    <input
                      type="text"
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Enter email subject..."
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5 text-left">
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Message Body
                  </label>
                  <textarea
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    rows={5}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="Enter your message..."
                  />
                </div>

                {/* Recipient list */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase text-left">
                    Recipients ({selectedIds.length})
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 divide-y divide-slate-100 text-xs">
                    {getSelectedApplicationsDetails().map((app) => (
                      <div key={app._id} className="py-2 flex items-center justify-between">
                        <div className="text-left">
                          <span className="font-semibold text-slate-800 block">
                            {app.parentName} ({app.studentName})
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {messageType === 'whatsapp' ? app.whatsapp || app.parentMobile || app.mobile : app.email || 'No email provided'}
                          </span>
                        </div>
                        
                        {messageType === 'whatsapp' ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => launchCommunication(app)}
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none px-2.5 py-1 text-[10px]"
                          >
                            Send WhatsApp
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => launchCommunication(app)}
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none px-2.5 py-1 text-[10px]"
                            isDisabled={!app.email}
                          >
                            Send Email
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                {messageType === 'email' ? (
                  <Button
                    variant="primary"
                    onClick={launchBulkEmail}
                    className="bg-indigo-600 hover:bg-indigo-700 border-none text-white"
                  >
                    <Mail size={16} className="mr-1.5" />
                    Send Bulk Email (BCC)
                  </Button>
                ) : (
                  <div className="text-xs text-slate-500">
                    Click individual WhatsApp buttons above to send messages
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => setMessageModalOpen(false)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedEnquiryForAssessment && (
        <AssessmentPortalModal
          enquiry={selectedEnquiryForAssessment}
          onClose={() => setSelectedEnquiryForAssessment(null)}
        />
      )}
    </div>
    </div>
  );
};

export default Applications;