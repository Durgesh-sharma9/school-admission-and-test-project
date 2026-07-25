import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/schoolApi';
import Loader from '../../../shared/components/Loader';
import Badge from '../components/Badge';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import CollapsibleFilters, { FilterRow, SelectFilter, DateFilter, TimelineFilter } from '../../../shared/components/CollapsibleFilters';
import DeleteConfirmationModal from '../../../shared/components/DeleteConfirmationModal';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import AdmissionForm from '../components/AdmissionForm';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Send,
  MessageSquare,
  Mail,
  UserCheck,
  MoreVertical,
  Check,
  FileQuestion,
  Trash2,
  AlertCircle,
  Eye,
  Edit,
  X,
  User,
  Users,
  MapPin,
  Calendar,
  Sparkles,
  GitCommit,
  Phone,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AssessmentPortalModal from '../components/AssessmentPortalModal';
import AdmissionJourneyTimeline from '../../../shared/components/AdmissionJourneyTimeline';
import CRMProfileModal from '../../../shared/components/CRMProfileModal';
import ContactModal from '../../../shared/components/ContactModal';

const Enquiries = () => {
  const { school } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const expandId = searchParams.get('expand');

  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [timelineFilter, setTimelineFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Admission Journey Timeline States
  const [expandedEnquiryId, setExpandedEnquiryId] = useState(null);

  // Handle deep-linking query parameter: ?expand=ID
  useEffect(() => {
    if (expandId) {
      setSearch(expandId);
      setExpandedEnquiryId(expandId);
    }
  }, [expandId]);

  const handleSaveJourney = async (enquiryId, updatedJourney) => {
    try {
      const response = await api.put(`/enquiries/${enquiryId}`, {
        journey: updatedJourney
      });
      if (response.success) {
        toast.success('Admission journey updated successfully!');
        setEnquiries(prev => prev.map(enq => enq._id === enquiryId ? { ...enq, journey: response.data.journey } : enq));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update journey');
      throw err;
    }
  };


  // Communication Modal States
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageType, setMessageType] = useState('whatsapp'); // whatsapp or email
  const [messageTemplate, setMessageTemplate] = useState(
    'Dear [Parent Name], thank you for your admission enquiry for [Student Name] (ID: [Enquiry ID]) at our school. We would love to discuss the details further. Please let us know a suitable time to connect. Regards.'
  );
  const [selectedEnquiryForAssessment, setSelectedEnquiryForAssessment] = useState(null);

  // View & Edit Modal States
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEnquiryForView, setSelectedEnquiryForView] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEnquiryForEdit, setSelectedEnquiryForEdit] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedEnquiryForContact, setSelectedEnquiryForContact] = useState(null);

  // Delete Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [enquiryToDelete, setEnquiryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Parent History States
  const [viewingParentMobile, setViewingParentMobile] = useState(null);
  const [parentHistoryData, setParentHistoryData] = useState(null);
  const [parentHistoryLoading, setParentHistoryLoading] = useState(false);

  const formatSubmissionDate = (saveDate, saveTime) => {
    if (!saveDate) return '—';
    try {
      const parts = saveDate.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);

        let hour = 0;
        let minute = 0;
        if (saveTime) {
          const timeParts = saveTime.split(':');
          if (timeParts.length >= 2) {
            hour = parseInt(timeParts[0], 10);
            minute = parseInt(timeParts[1], 10);
          }
        }

        const d = new Date(year, month, day, hour, minute);
        const formattedDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const formattedTime = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        return (
          <>
            <span className="block font-semibold text-slate-800">{formattedDate}</span>
            <span className="block text-[10px] text-slate-450 mt-0.5">{formattedTime}</span>
          </>
        );
      }
      return <span className="block font-semibold text-slate-800">{saveDate} {saveTime || ''}</span>;
    } catch {
      return <span className="block font-semibold text-slate-800">{saveDate} {saveTime || ''}</span>;
    }
  };

  useEffect(() => {
    const fetchParentHistory = async () => {
      if (!viewingParentMobile) return;
      setParentHistoryLoading(true);
      try {
        const response = await api.get(`/enquiries/parent-recognition/${viewingParentMobile}`);
        if (response.success) {
          setParentHistoryData(response);
        } else {
          toast.error('Failed to load parent history details');
        }
      } catch (error) {
        toast.error(error.message || 'Error fetching parent history');
      } finally {
        setParentHistoryLoading(false);
      }
    };
    fetchParentHistory();
  }, [viewingParentMobile]);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/enquiries', {
        params: {
          page,
          limit,
          search,
          status: statusFilter,
          classFilter,
          startDate,
          endDate,
          sortBy,
          timeline: timelineFilter,
        },
      });
      if (response.success) {
        setEnquiries(response.data);
        setTotalPages(response.pagination.pages);
        setTotalRecords(response.pagination.total);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch enquiries');
    } finally {
      setLoading(false);
    }
  };

  // Soft Delete Enquiry Handler
  const handleDeleteClick = (enq) => {
    setEnquiryToDelete(enq);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!enquiryToDelete) return;

    setIsDeleting(true);
    try {
      const response = await api.delete(`/enquiries/${enquiryToDelete._id}`);
      if (response.success) {
        toast.success('Enquiry deleted successfully');
        setEnquiries(prev => prev.filter(enq => enq._id !== enquiryToDelete._id));
        setDeleteModalOpen(false);
        setEnquiryToDelete(null);
      }
    } catch (error) {
      toast.error(error.message || 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV/Excel Offline Export Generator
  const handleExportCSV = async () => {
    try {
      toast.loading('Preparing report export...', { id: 'csv-export' });
      const res = await api.get('/enquiries', {
        params: {
          page: 1,
          limit: 10000,
          search,
          status: statusFilter,
          classFilter,
          startDate,
          endDate,
          sortBy
        }
      });

      if (res.success) {
        const data = res.data;
        if (data.length === 0) {
          toast.error('No enquiries found matching active filters.', { id: 'csv-export' });
          return;
        }

        const headers = ['Enquiry ID', 'Student Name', 'Parent Name', 'Mobile', 'Email', 'Class Seeking', 'State', 'Locality', 'City', 'Society', 'Previous School', 'Previous Class', 'Source', 'Source Details', 'Expectations', 'Status', 'Registered Date', 'Registered Time', 'Converted to Admission'];
        const csvRows = [headers.join(',')];

        data.forEach(item => {
          const row = [
            `"${item.enquiryId || ''}"`,
            `"${item.studentName || ''}"`,
            `"${item.parentName || ''}"`,
            `"${item.mobile || ''}"`,
            `"${item.email || ''}"`,
            `"${item.classSeeking || ''}"`,
            `"${item.state || ''}"`,
            `"${item.area || ''}"`,
            `"${item.city || ''}"`,
            `"${item.society || ''}"`,
            `"${item.previousSchool || item.currentSchool || ''}"`,
            `"${item.previousClass || item.currentClass || ''}"`,
            `"${item.source || ''}"`,
            `"${item.sourceOtherSpecify || ''}"`,
            `"${(item.expectations || '').replace(/"/g, '""')}"`,
            `"${item.status || ''}"`,
            `"${item.saveDate || ''}"`,
            `"${item.saveTime || ''}"`,
            item.isConvertedToAdmission ? 'Yes' : 'No'
          ];
          csvRows.push(row.join(','));
        });

        const csvContent = '\uFEFF' + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Enquiry_Report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Report downloaded successfully!', { id: 'csv-export' });
      }
    } catch (err) {
      toast.error('Failed to export CSV: ' + err.message, { id: 'csv-export' });
    }
  };

  useEffect(() => {
    setPage(1); // Reset page on filter/search change
  }, [search, statusFilter, classFilter, startDate, endDate, sortBy, limit, timelineFilter]);

  useEffect(() => {
    fetchEnquiries();
  }, [page, search, statusFilter, classFilter, startDate, endDate, sortBy, limit, timelineFilter]);

  // Handle select all rows
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(enquiries.map((enq) => enq._id));
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

  // Update Status directly from Table
  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await api.patch(`/enquiries/${id}/status`, { status: newStatus });
      if (response.success) {
        toast.success(`Status updated to: ${newStatus}`);
        setEnquiries(enquiries.map((enq) => (enq._id === id ? { ...enq, status: newStatus } : enq)));
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  // Save full enquiry changes from Edit modal
  const handleEditEnquiry = async (formData) => {
    try {
      setSaving(true);
      // Clean up previous/current fields mapping before sending
      const payload = { ...formData };
      const response = await api.put(`/enquiries/${selectedEnquiryForEdit._id}`, payload);
      if (response.success) {
        toast.success('Enquiry updated successfully!');
        setEditModalOpen(false);
        setSelectedEnquiryForEdit(null);
        fetchEnquiries();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update enquiry');
    } finally {
      setSaving(false);
    }
  };

  // Convert Enquiry -> Admission
  const handleConvertAdmission = async (id) => {
    if (!window.confirm('Confirm conversion of this enquiry to a registered admission?')) return;
    try {
      const response = await api.post(`/enquiries/${id}/convert`);
      if (response.success) {
        toast.success('Successfully converted enquiry to Admission!');
        setEnquiries(
          enquiries.map((enq) =>
            enq._id === id
              ? { ...enq, status: 'Admission Confirmed', isConvertedToAdmission: true }
              : enq
          )
        );
      }
    } catch (error) {
      toast.error(error.message || 'Failed to convert to admission');
    }
  };

  // Prepare and Launch Communications
  const getSelectedEnquiriesDetails = () => {
    return enquiries.filter((enq) => selectedIds.includes(enq._id));
  };

  const getPersonalizedMessage = (template, enquiry) => {
    return template
      .replace(/\[Parent Name\]/g, enquiry.parentName)
      .replace(/\[Student Name\]/g, enquiry.studentName)
      .replace(/\[Enquiry ID\]/g, enquiry.enquiryId);
  };

  const launchCommunication = (enq) => {
    const text = getPersonalizedMessage(messageTemplate, enq);
    const encodedText = encodeURIComponent(text);

    if (messageType === 'whatsapp') {
      const number = enq.whatsapp || enq.mobile;
      // Remove symbols for WhatsApp API link
      const cleanNumber = number.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanNumber}?text=${encodedText}`, '_blank');
    } else {
      const subject = encodeURIComponent('School Admission Follow-up');
      window.open(`mailto:${enq.email}?subject=${subject}&body=${encodedText}`, '_blank');
    }
  };

  const launchBulkEmail = () => {
    const selectedList = getSelectedEnquiriesDetails().filter((e) => e.email);
    if (selectedList.length === 0) {
      toast.error('None of the selected enquiries have valid email addresses.');
      return;
    }

    // Draft bulk email with BCC
    const bccList = selectedList.map((e) => e.email).join(',');
    const subject = encodeURIComponent('Admission Follow-up');
    const firstEnq = selectedList[0];
    const text = messageTemplate
      .replace(/\[Parent Name\]/g, 'Parent')
      .replace(/\[Student Name\]/g, 'your child')
      .replace(/\[Enquiry ID\]/g, 'Registration ID');
    const encodedText = encodeURIComponent(text);

    window.open(`mailto:?bcc=${bccList}&subject=${subject}&body=${encodedText}`, '_blank');
    toast.success('Mail client opened with BCC list!');
    setMessageModalOpen(false);
  };

  if (viewingParentMobile) {
    if (parentHistoryLoading) {
      return <Loader message="Loading Parent History Profile..." />;
    }

    const parent = parentHistoryData?.parent || {};
    const enquiriesList = parentHistoryData?.enquiries || [];
    const childrenList = parentHistoryData?.children || [];

    return (
      <div className="space-y-6 text-left">
        {/* Header with back trigger */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              setViewingParentMobile(null);
              setParentHistoryData(null);
            }}
            className="p-2 bg-white border border-slate-100 hover:bg-slate-50 rounded-xl text-slate-550 hover:text-slate-800 transition-colors shadow-xs"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Parent Family History Profile</h2>
            <p className="text-slate-500 text-sm mt-0.5 font-semibold">
              Comprehensive registry of family members, siblings, and academic applications.
            </p>
          </div>
        </div>

        {/* Parent Information Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Parent Name</span>
            <span className="text-sm font-bold text-slate-800">{parent.parentName || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mobile Number</span>
            <span className="text-sm font-bold text-slate-800">{parent.mobile || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">WhatsApp Number</span>
            <span className="text-sm font-bold text-slate-800">{parent.whatsapp || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email Address</span>
            <span className="text-sm font-bold text-slate-800">{parent.email || 'N/A'}</span>
          </div>
          {parent.fullAddress && (
            <div className="md:col-span-4 border-t border-slate-50 pt-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Address</span>
              <span className="text-xs font-semibold text-slate-650">
                {parent.fullAddress}, {parent.area}, {parent.city}, {parent.state}
              </span>
            </div>
          )}
        </div>

        {/* Children Tagged list */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase">Children Registered</h4>
          <div className="flex flex-wrap gap-2">
            {childrenList.map((child, cIdx) => (
              <span
                key={cIdx}
                className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold"
              >
                👦 {child}
              </span>
            ))}
            {childrenList.length === 0 && (
              <span className="text-xs text-slate-400 italic">No child profiles linked yet.</span>
            )}
          </div>
        </div>

        {/* Enquiries history table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase">Previous Enquiries History</h3>
            <span className="text-xs font-bold text-indigo-650 bg-indigo-50/50 px-2 py-0.5 rounded-lg border border-indigo-100">
              {enquiriesList.length} Applications
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-455 font-bold uppercase">
                <tr>
                  <th className="px-6 py-4">Enquiry ID</th>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Class</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {enquiriesList.map((enq) => (
                  <tr key={enq._id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{enq.enquiryId}</td>
                    <td className="px-6 py-4 font-bold text-slate-850">{enq.studentName}</td>
                    <td className="px-6 py-4 text-slate-600">{enq.classSeeking}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${enq.status === 'Admission Confirmed'
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          : enq.status === 'Hold'
                            ? 'bg-amber-50 border-amber-100 text-amber-705'
                            : enq.status === 'Not Interested'
                              ? 'bg-rose-50 border-rose-100 text-rose-700'
                              : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                        }`}>
                        {enq.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{enq.saveDate}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedEnquiryForView(enq);
                          setViewModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors text-[10px]"
                      >
                        Open Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Enquiries Database</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Filter, modify statuses, convert registration stages, and send parents templated messages.
          </p>
        </div>
      </div>

      {/* Advanced Filters Block */}
      <CollapsibleFilters
        searchValue={search}
        onSearchChange={setSearch}
        onExport={handleExportCSV}
        isExpanded={filtersExpanded}
        onToggleExpand={() => setFiltersExpanded(!filtersExpanded)}
        searchPlaceholder="Search by ID, candidate name, parent name, mobile..."
      >
        <FilterRow>
          {/* Status Filter */}
          <SelectFilter
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'New Enquiry', label: 'New Enquiry' },
              { value: 'Hold', label: 'On Hold' },
              { value: 'Not Interested', label: 'Not Interested' },
              { value: 'Admission Confirmed', label: 'Admission Confirmed' },
            ]}
            placeholder="All Statuses"
          />

          {/* Class Filter */}
          <SelectFilter
            label="Class Seeking"
            value={classFilter}
            onChange={setClassFilter}
            options={[
              { value: '', label: 'All Classes' },
              ...['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(c => ({
                value: c,
                label: `Class ${c}`
              }))
            ]}
            placeholder="All Classes"
          />

          {/* Timeline Filter */}
          <TimelineFilter
            value={timelineFilter}
            onChange={setTimelineFilter}
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
              { value: 'name_asc', label: 'Name (A-Z)' },
              { value: 'name_desc', label: 'Name (Z-A)' },
              { value: 'class', label: 'Class Seeking' },
            ]}
            placeholder="Sort By"
          />
        </FilterRow>

        <FilterRow>
          {/* Page Size */}
          <SelectFilter
            label="Page Size"
            value={limit.toString()}
            onChange={(val) => setLimit(parseInt(val, 10))}
            options={[
              { value: '5', label: '5 per page' },
              { value: '10', label: '10 per page' },
              { value: '20', label: '20 per page' },
              { value: '50', label: '50 per page' },
            ]}
            placeholder="Page Size"
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
            className="bg-indigo-900 text-white rounded-xl px-5 py-3 shadow-md flex items-center justify-between flex-wrap gap-3"
          >
            <span className="text-xs font-semibold">
              {selectedIds.length} enquiries selected
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

      {/* Main Table view */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <Loader message="Loading enquiries..." />
        ) : enquiries.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <AlertCircle size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-500">No enquiries found</p>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search criteria or register a new form submission.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="text-xs text-slate-400 font-bold uppercase tracking-wider bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-6 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        enquiries.length > 0 && selectedIds.length === enquiries.length
                      }
                      className="rounded text-indigo-600 focus:ring-indigo-500/20"
                    />
                  </th>
                  <th className="px-6 py-2">Enquiry ID</th>
                  <th className="px-6 py-2">Student Name</th>
                  <th className="px-6 py-2">Parent Details</th>
                  <th className="px-6 py-2">Class</th>
                  <th className="px-6 py-2">Status</th>
                  <th className="px-6 py-2">Date Submited</th>
                  <th className="px-6 py-2 text-center w-[300px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enquiries.map((enq, index) => (
                  <React.Fragment key={enq._id}>
                    <tr
                      className={`transition-all duration-200 ${expandedEnquiryId === enq._id
                          ? 'bg-indigo-50/80 border-l-4 border-l-indigo-500 shadow-sm'
                          : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                        } ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                    >
                      <td className="px-6 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(enq._id)}
                          onChange={() => handleSelectRow(enq._id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500/20"
                        />
                      </td>
                      <td className="px-6 py-2 font-bold text-slate-900 whitespace-nowrap text-sm">{enq.enquiryId}</td>
                      <td className="px-6 py-2 text-slate-800">
                        <div className="font-semibold text-slate-900 text-[13px] leading-tight">{enq.studentName}</div>
                        <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
                          {enq.gender}
                        </span>
                      </td>
                      <td className="px-6 py-2">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingParentMobile(enq.mobile);
                          }}
                          className="font-semibold text-slate-700 block cursor-pointer hover:text-indigo-600 hover:underline leading-tight text-xs"
                          title="View Parent & Family History Profile"
                        >
                          {enq.parentName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                          📞 {enq.mobile}
                        </span>
                      </td>
                      <td className="px-6 py-2 font-medium text-slate-700 text-xs">{enq.classSeeking}</td>
                      <td className="px-6 py-2 font-bold" onClick={(e) => e.stopPropagation()}>

                        <div className="relative inline-block w-[120px]">
                          <select
                            value={enq.status}
                            onChange={(e) => handleStatusChange(enq._id, e.target.value)}
                            className={`w-full text-[10px] font-bold uppercase rounded-lg pl-3 pr-7 py-1.5 cursor-pointer appearance-none transition-all outline-none border focus:ring-2 focus:ring-offset-1
                              ${enq.status === 'New Enquiry' ? 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500' :
                                enq.status === 'Hold' ? 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-500' :
                                  enq.status === 'Not Interested' ? 'bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-500' :
                                    enq.status === 'Admission Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500' :
                                      'bg-slate-50 text-slate-700 border-slate-200'
                              }
                            `}
                          >
                            <option value="New Enquiry">NEW</option>
                            <option value="Hold">HOLD</option>
                            <option value="Not Interested">REJECTED</option>
                            <option value="Admission Confirmed">CONFIRMED</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                            <ChevronDown size={14} className="opacity-50" />
                          </div>
                        </div>

                      </td>
                      <td className="px-6 py-2 text-xs font-semibold text-slate-700 whitespace-nowrap">
                        {formatSubmissionDate(enq.saveDate, enq.saveTime)}
                      </td>
                      <td className="px-6 py-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">

                          {/* USING STANDARD HTML BUTTONS FOR ICONS */}
                          <button
                            className={`h-9 w-9 p-0 flex items-center justify-center border rounded-xl transition-all shadow-sm ${expandedEnquiryId === enq._id
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600'
                              }`}
                            onClick={() => setExpandedEnquiryId(expandedEnquiryId === enq._id ? null : enq._id)}
                            title={expandedEnquiryId === enq._id ? "Hide Timeline" : "Timeline"}
                          >
                            <GitCommit size={18} strokeWidth={2} />
                          </button>

                          <button
                            className="h-9 w-9 p-0 flex items-center justify-center border border-slate-200 rounded-xl bg-white text-slate-500 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 hover:shadow-xs transition-all shadow-sm"
                            onClick={() => {
                              setSelectedEnquiryForView(enq);
                              setViewModalOpen(true);
                            }}
                            title="View Details"
                          >
                            <Eye size={18} strokeWidth={2} />
                          </button>

                          <button
                            className="h-9 w-9 p-0 flex items-center justify-center border border-slate-200 rounded-xl bg-white text-slate-500 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 hover:shadow-xs transition-all shadow-sm"
                            onClick={() => {
                              setSelectedEnquiryForContact(enq);
                              setContactModalOpen(true);
                            }}
                            title="Contact"
                          >
                            <Phone size={18} strokeWidth={2} />
                          </button>

                          <button
                            className="h-9 w-9 p-0 flex items-center justify-center border border-slate-200 rounded-xl bg-white text-slate-500 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 hover:shadow-xs transition-all shadow-sm"
                            onClick={() => setSelectedEnquiryForAssessment(enq)}
                            title="Documents / Assessment"
                          >
                            <FileQuestion size={18} strokeWidth={2} />
                          </button>

                          <button
                            className="h-9 w-9 p-0 flex items-center justify-center border border-slate-200 rounded-xl bg-white text-slate-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 hover:shadow-xs transition-all shadow-sm"
                            onClick={() => handleDeleteClick(enq)}
                            title="Delete"
                          >
                            <Trash2 size={18} strokeWidth={2} />
                          </button>

                        </div>
                      </td>
                    </tr>

                    <AnimatePresence>
                      {expandedEnquiryId === enq._id && (
                        <tr className="bg-indigo-50/40">
                          <td colSpan={8} className="px-4 py-4 border-b border-indigo-100">

                            <div className="bg-white border border-indigo-100 rounded-xl shadow-sm overflow-hidden">

                              <div className="bg-gradient-to-r from-indigo-50 to-slate-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100">
                                <div className="space-y-1 text-left">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-sm font-bold text-slate-800 leading-none">{enq.studentName}</h3>
                                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                      {enq.enquiryId}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border tracking-wider ${enq.status === 'New Enquiry' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                        enq.status === 'Hold' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                          enq.status === 'Not Interested' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                                            enq.status === 'Admission Confirmed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                              'bg-slate-50 border-slate-200 text-slate-700'
                                      }`}>
                                      {enq.status === 'New Enquiry' ? 'NEW' : enq.status === 'Not Interested' ? 'REJECTED' : enq.status === 'Admission Confirmed' ? 'CONFIRMED' : enq.status.toUpperCase()}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 font-semibold">
                                    <span>Class: <strong>{enq.classSeeking}</strong></span>
                                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                                    <span>City: <strong>{enq.city}</strong></span>
                                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                                    <span>Parent: <strong>{enq.parentName} ({enq.mobile})</strong></span>
                                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                                    <span>Submitted: <strong>{enq.saveDate} {enq.saveTime}</strong></span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 font-bold text-xs" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedEnquiryForView(enq);
                                      setViewModalOpen(true);
                                    }}
                                    className="border-slate-200 hover:bg-slate-100 text-slate-700 h-7 px-2.5 text-[10px] font-bold rounded-lg transition-all"
                                  >
                                    View Profile
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => setSelectedEnquiryForAssessment(enq)}
                                    className="border-indigo-200 hover:bg-indigo-50 text-indigo-700 h-7 px-2.5 text-[10px] font-bold rounded-lg transition-all"
                                  >
                                    Assessments
                                  </Button>
                                </div>
                              </div>

                              <div className="p-4">
                                <AdmissionJourneyTimeline
                                  enquiry={enq}
                                  stageOptions={['Call', 'WhatsApp', 'Email', 'Meeting', 'Campus Visit', 'Documents Requested', 'Documents Submitted', 'Registration Fee', 'Admission Confirmed', 'Rejected', 'Closed', 'Other']}
                                  onSaveJourney={(updatedJourney) => handleSaveJourney(enq._id, updatedJourney)}
                                  counselorName={school?.name || 'Admin'}
                                />
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-slate-200 px-6 py-4 rounded-2xl shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            Showing Page <span className="font-semibold text-slate-800">{page}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalPages}</span> ({totalRecords} records)
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Personalized Communication Modal */}
      {messageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
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
                  [Enquiry ID]
                </code>{' '}
                will automatically populate with each contact's custom details.
              </p>

              {/* Saved templates dropdown selection */}
              {school?.communicationTemplates && school.communicationTemplates.filter(t => t.type === messageType).length > 0 && (
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Load Saved Template
                  </label>
                  <select
                    onChange={(e) => {
                      const selected = school?.communicationTemplates?.find(t => t._id === e.target.value);
                      if (selected) {
                        setMessageTemplate(selected.body);
                      }
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select a saved template blueprint</option>
                    {school?.communicationTemplates
                      ?.filter(t => t.type === messageType)
                      .map(t => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))
                    }
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1.5 text-left">
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Message Body
                </label>
                <textarea
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Recipient list */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase text-left">
                  Recipients ({selectedIds.length})
                </label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 divide-y divide-slate-100 text-xs">
                  {getSelectedEnquiriesDetails().map((enq) => (
                    <div key={enq._id} className="py-2 flex items-center justify-between">
                      <div className="text-left">
                        <span className="font-semibold text-slate-800 block">
                          {enq.parentName} ({enq.studentName})
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {messageType === 'whatsapp' ? enq.whatsapp || enq.mobile : enq.email || 'No email provided'}
                        </span>
                      </div>

                      {messageType === 'whatsapp' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => launchCommunication(enq)}
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none px-2.5 py-1 text-[10px]"
                        >
                          Send WhatsApp
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => launchCommunication(enq)}
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none px-2.5 py-1 text-[10px]"
                          isDisabled={!enq.email}
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
                  <Send size={16} className="mr-1.5" />
                  BCC Mail All Recipients
                </Button>
              ) : (
                <p className="text-[10px] text-slate-500 italic">
                  Note: WhatsApp doesn't support bulk api links. Trigger each message separately.
                </p>
              )}
              <Button variant="outline" onClick={() => setMessageModalOpen(false)}>
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {selectedEnquiryForAssessment && (
        <AssessmentPortalModal
          enquiry={selectedEnquiryForAssessment}
          onClose={() => setSelectedEnquiryForAssessment(null)}
        />
      )}

      {/* Reusable Premium CRM Profile Modal */}
      <CRMProfileModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedEnquiryForView(null);
        }}
        data={selectedEnquiryForView}
        type="school"
        onEdit={() => {
          setSelectedEnquiryForEdit(selectedEnquiryForView);
          setEditStatus(selectedEnquiryForView.status);
          setEditModalOpen(true);
        }}
        onConvert={async () => {
          if (window.confirm("Are you sure you want to convert this enquiry to registered admission?")) {
            await handleConvertAdmission(selectedEnquiryForView._id);
            setSelectedEnquiryForView(prev => ({ ...prev, isConvertedToAdmission: true }));
          }
        }}
        onSaveJourney={async (updatedJourney) => {
          await handleSaveJourney(selectedEnquiryForView._id, updatedJourney);
          setSelectedEnquiryForView(prev => ({ ...prev, journey: updatedJourney }));
        }}
        onAssessments={() => {
          setSelectedEnquiryForAssessment(selectedEnquiryForView);
        }}
        schoolName={school?.name || 'Admin'}
        stageOptions={['Call', 'WhatsApp', 'Email', 'Meeting', 'Campus Visit', 'Documents Requested', 'Documents Submitted', 'Registration Fee', 'Admission Confirmed', 'Rejected', 'Closed', 'Other']}
      />

      {/* Shared Reusable ContactModal */}
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => {
          setContactModalOpen(false);
          setSelectedEnquiryForContact(null);
        }}
        data={selectedEnquiryForContact}
        type="school"
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setEnquiryToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Enquiry"
        itemType="enquiry"
        itemInfo={enquiryToDelete ? {
          'Enquiry ID': enquiryToDelete.enquiryId,
          'Student Name': enquiryToDelete.studentName,
          'Parent Name': enquiryToDelete.parentName,
          'Class': enquiryToDelete.classSeeking,
        } : {}}
        isDeleting={isDeleting}
      />

      {/* Edit Enquiry Modal */}
      {editModalOpen && selectedEnquiryForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8"
          >
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Edit size={20} className="text-indigo-600" />
                Edit Enquiry: {selectedEnquiryForEdit.studentName}
              </h3>
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedEnquiryForEdit(null);
                }}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto bg-slate-50/30">
              <AdmissionForm
                initialData={selectedEnquiryForEdit}
                onSubmit={handleEditEnquiry}
                isLoading={saving}
                isPublic={false}
              />
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedEnquiryForEdit(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Enquiries;