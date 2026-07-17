import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Input from '../components/Input';
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
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AssessmentPortalModal from '../components/AssessmentPortalModal';

const Enquiries = () => {
  const { school } = useAuth();
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
  const [selectedIds, setSelectedIds] = useState([]);

  
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
  const handleDeleteEnquiry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enquiry? This action supports soft delete auditing.')) return;
    try {
      const response = await api.delete(`/enquiries/${id}`);
      if (response.success) {
        toast.success('Enquiry soft-deleted successfully');
        fetchEnquiries();
      }
    } catch (error) {
      toast.error(error.message || 'Delete failed');
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

        const headers = ['Enquiry ID', 'Student Name', 'Parent Name', 'Mobile', 'Email', 'Class Seeking', 'State', 'Locality', 'City', 'Society', 'Previous School', 'Previous Class', 'Source', 'Expectations', 'Status', 'Registered Date', 'Registered Time', 'Converted to Admission'];
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
  }, [search, statusFilter, classFilter, startDate, endDate, sortBy, limit]);

  useEffect(() => {
    fetchEnquiries();
  }, [page, search, statusFilter, classFilter, startDate, endDate, sortBy, limit]);

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
      <div className="bg-white rounded-2xl border border-slate-105 p-5 shadow-xs space-y-4">
        {/* Row 1: Search and Export */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full text-left">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Search className="h-4.5 w-4.5" />
            </span>
            <input
              type="text"
              placeholder="Search by ID, candidate name, parent name, mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>
          <Button
            variant="outline"
            className="flex items-center justify-center gap-1.5 shrink-0 px-4 py-2.5 w-full md:w-auto text-xs font-semibold text-slate-700 bg-white"
            onClick={handleExportCSV}
          >
            Export CSV / Excel
          </Button>
        </div>

        {/* Row 2: Selectors */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-xs">
          {/* Status Filter */}
          <div className="text-left">
            <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 rounded-lg border border-slate-100 px-3 py-2 text-slate-750 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
            >
              <option value="">All Statuses</option>
              <option value="New Enquiry">New Enquiry</option>
              <option value="Hold">On Hold</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Admission Confirmed">Admission Confirmed</option>
            </select>
          </div>

          {/* Class Filter */}
          <div className="text-left">
            <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">Class Seeking</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full bg-slate-50 rounded-lg border border-slate-100 px-3 py-2 text-slate-750 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
            >
              <option value="">All Classes</option>
              {['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(c => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="text-left">
            <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 rounded-lg border border-slate-100 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium focus:bg-white"
            />
          </div>

          {/* End Date */}
          <div className="text-left">
            <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 rounded-lg border border-slate-100 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium focus:bg-white"
            />
          </div>

          {/* Sort By */}
          <div className="text-left">
            <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-50 rounded-lg border border-slate-100 px-3 py-2 text-slate-755 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="class">Class Seeking</option>
            </select>
          </div>

          {/* Page Size */}
          <div className="text-left">
            <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Page Size</label>
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value, 10))}
              className="w-full bg-slate-50 rounded-lg border border-slate-100 px-3 py-2 text-slate-750 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>
      </div>

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
                <MessageSquare className="h-4 w-4 mr-1.5" />
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
                <Mail className="h-4 w-4 mr-1.5" />
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
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <Loader message="Loading enquiries..." />
        ) : enquiries.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <AlertCircle className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-500">No enquiries found</p>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search criteria or register a new form submission.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="text-xs text-slate-400 font-bold uppercase tracking-wider bg-slate-50 border-b border-slate-100 sticky top-0">
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
                  <th className="px-6 py-4">Enquiry ID</th>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Parent Details</th>
                  <th className="px-6 py-4">Class</th>
                  <th className="px-6 py-4">City</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date Submited</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {enquiries.map((enq) => (
                  <tr key={enq._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(enq._id)}
                        onChange={() => handleSelectRow(enq._id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500/20"
                      />
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">{enq.enquiryId}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {enq.studentName}
                      <span className="block text-[10px] text-slate-400 font-medium">
                        {enq.gender}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-700 block">{enq.parentName}</span>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        📞 {enq.mobile}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{enq.classSeeking}</td>
                    <td className="px-6 py-4 font-medium">{enq.city}</td>
                    <td className="px-6 py-4">
                      {/* Interactive inline status change */}
                      <select
                        value={enq.status}
                        onChange={(e) => handleStatusChange(enq._id, e.target.value)}
                        className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 rounded border-none hover:bg-slate-100 px-1 py-0.5"
                      >
                        <option value="New Enquiry">New Enquiry</option>
                        <option value="Hold">Hold</option>
                        <option value="Not Interested">Not Interested</option>
                        <option value="Admission Confirmed">Admission Confirmed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                      {enq.saveDate}
                      <span className="block text-[10px]">{enq.saveTime}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md p-1.5"
                          onClick={() => {
                            setSelectedEnquiryForView(enq);
                            setViewModalOpen(true);
                          }}
                          title="View Complete Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>

                        {/* Edit Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md p-1.5"
                          onClick={() => {
                            setSelectedEnquiryForEdit(enq);
                            setEditStatus(enq.status);
                            setEditModalOpen(true);
                          }}
                          title="Edit Status"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>

                        {/* Assign Assessment Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-md p-1.5"
                          onClick={() => setSelectedEnquiryForAssessment(enq)}
                          title="Assign/Manage Assessments"
                        >
                          <FileQuestion className="h-3.5 w-3.5 text-indigo-500" />
                        </Button>

                        {/* Convert to Admission Button */}
                        {!enq.isConvertedToAdmission ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-md p-1.5"
                            onClick={() => handleConvertAdmission(enq._id)}
                            title="Convert to Registered Admission"
                          >
                            <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                          </Button>
                        ) : (
                          <span className="inline-flex items-center text-xs font-bold text-emerald-650 bg-emerald-50/70 p-1.5 rounded-md border border-emerald-100/50" title="Admission Confirmed">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          </span>
                        )}

                        {/* Soft Delete Enquiry Action */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-rose-100 hover:bg-rose-50 text-rose-650 rounded-md p-1.5"
                          onClick={() => handleDeleteEnquiry(enq._id)}
                          title="Delete Enquiry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-slate-100 px-6 py-4 rounded-2xl shadow-xs">
          <p className="text-xs font-medium text-slate-500">
            Showing Page <span className="font-semibold text-slate-800">{page}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalPages}</span> ({totalRecords} records)
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4.5 w-4.5" />
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
            className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
          >
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                {messageType === 'whatsapp' ? (
                  <MessageSquare className="h-4.5 w-4.5 text-emerald-600" />
                ) : (
                  <Mail className="h-4.5 w-4.5 text-blue-600" />
                )}
                Draft Personalized Message
              </h3>
              <button
                onClick={() => setMessageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
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
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-950 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Recipient list */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase text-left">
                  Recipients ({selectedIds.length})
                </label>
                <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-lg p-2 divide-y divide-slate-50 text-xs">
                  {getSelectedEnquiriesDetails().map((enq) => (
                    <div key={enq._id} className="py-2 flex items-center justify-between">
                      <div className="text-left">
                        <span className="font-semibold text-slate-800 block">
                          {enq.parentName} ({enq.studentName})
                        </span>
                        <span className="text-[10px] text-slate-400">
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

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              {messageType === 'email' ? (
                <Button
                  variant="primary"
                  onClick={launchBulkEmail}
                  className="bg-indigo-600 hover:bg-indigo-700 border-none"
                >
                  <Send className="h-4 w-4 mr-1.5" />
                  BCC Mail All Recipients
                </Button>
              ) : (
                <p className="text-[10px] text-slate-400 italic">
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

      {/* View Enquiry Details Modal */}
      {viewModalOpen && selectedEnquiryForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden my-8 animate-in fade-in-50 duration-200"
          >
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Eye className="h-4.5 w-4.5 text-indigo-650" />
                Enquiry Details: {selectedEnquiryForView.enquiryId}
              </h3>
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  setSelectedEnquiryForView(null);
                }}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto text-left">
              {/* Category 1: Student Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <User className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                    Student Information
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase">Student Name</span>
                    <span className="font-bold text-slate-700 text-sm mt-0.5 block">{selectedEnquiryForView.studentName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase">Gender</span>
                    <span className="font-bold text-slate-700 text-sm mt-0.5 block">{selectedEnquiryForView.gender || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase">Date of Birth</span>
                    <span className="font-bold text-slate-700 text-sm mt-0.5 block">
                      {selectedEnquiryForView.dob ? new Date(selectedEnquiryForView.dob).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase">Class Seeking</span>
                    <span className="font-bold text-slate-700 text-sm mt-0.5 block">{selectedEnquiryForView.classSeeking || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase">Previous School</span>
                    <span className="font-bold text-slate-700 text-sm mt-0.5 block">{selectedEnquiryForView.previousSchool || selectedEnquiryForView.currentSchool || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase">Previous Class</span>
                    <span className="font-bold text-slate-700 text-sm mt-0.5 block">{selectedEnquiryForView.previousClass || selectedEnquiryForView.currentClass || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Category 2: Parent / Guardian Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Users className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                    Parent / Guardian Information
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase">Parent Name</span>
                    <span className="font-bold text-slate-700 text-sm mt-0.5 block">{selectedEnquiryForView.parentName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase">Mobile Number</span>
                    <span className="font-bold text-slate-700 text-sm mt-0.5 block">{selectedEnquiryForView.mobile || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase">WhatsApp Number</span>
                    <span className="font-bold text-slate-700 text-sm mt-0.5 block">{selectedEnquiryForView.whatsapp || '—'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 font-semibold block uppercase">Email Address</span>
                    <span className="font-bold text-slate-700 text-sm mt-0.5 block">{selectedEnquiryForView.email || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Category 3: Address Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                    Address Details
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase">State</span>
                    <span className="font-bold text-slate-700 text-sm mt-0.5 block">{selectedEnquiryForView.state || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase">Locality / Area</span>
                    <span className="font-bold text-slate-700 text-sm mt-0.5 block">{selectedEnquiryForView.area || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase">City</span>
                    <span className="font-bold text-slate-700 text-sm mt-0.5 block">{selectedEnquiryForView.city || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase">Society / Township</span>
                    <span className="font-bold text-slate-700 text-sm mt-0.5 block">{selectedEnquiryForView.society || '—'}</span>
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-slate-400 font-semibold block uppercase">Full Address</span>
                    <span className="font-bold text-slate-700 text-sm mt-0.5 block">{selectedEnquiryForView.fullAddress || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Category 4: Other / Metadata */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                    Enquiry Metadata & Info
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase">Source</span>
                    <span className="font-bold text-slate-700 text-sm mt-0.5 block">{selectedEnquiryForView.source || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase">Current Status</span>
                    <div className="mt-0.5">
                      <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {selectedEnquiryForView.status || 'New Enquiry'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase">Submission Date</span>
                    <span className="font-bold text-slate-700 text-sm mt-0.5 block">
                      {selectedEnquiryForView.saveDate || '—'} ({selectedEnquiryForView.saveTime || '—'})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase">Created Date</span>
                    <span className="font-bold text-slate-700 text-sm mt-0.5 block">
                      {selectedEnquiryForView.createdAt ? new Date(selectedEnquiryForView.createdAt).toLocaleString() : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase">Updated Date</span>
                    <span className="font-bold text-slate-700 text-sm mt-0.5 block">
                      {selectedEnquiryForView.updatedAt ? new Date(selectedEnquiryForView.updatedAt).toLocaleString() : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase">Enquiry ID</span>
                    <span className="font-bold text-slate-700 text-sm mt-0.5 block">{selectedEnquiryForView.enquiryId || '—'}</span>
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-slate-400 font-semibold block uppercase">Parent Expectations</span>
                    <p className="font-semibold text-slate-700 text-sm mt-1 p-3 bg-slate-50 border border-slate-100 rounded-xl leading-relaxed whitespace-pre-wrap">
                      {selectedEnquiryForView.expectations || 'No expectations provided.'}
                    </p>
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-slate-400 font-semibold block uppercase">Notes</span>
                    <p className="font-semibold text-slate-700 text-sm mt-1 p-3 bg-slate-50 border border-slate-100 rounded-xl leading-relaxed whitespace-pre-wrap">
                      {selectedEnquiryForView.notes || 'No notes added for this enquiry.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Category 5: Automatically Detected Future/Custom Fields */}
              {(() => {
                const knownKeys = ['_id', 'schoolId', 'studentName', 'gender', 'dob', 'classSeeking', 'currentSchool', 'currentClass', 'previousSchool', 'previousClass', 'parentName', 'mobile', 'whatsapp', 'email', 'state', 'city', 'area', 'society', 'fullAddress', 'notes', 'source', 'expectations', 'enquiryId', 'saveDate', 'saveTime', 'status', 'isConvertedToAdmission', 'convertedAt', 'isDeleted', 'createdAt', 'updatedAt', '__v'];
                const customFields = Object.keys(selectedEnquiryForView).filter(key => !knownKeys.includes(key));
                if (customFields.length === 0) return null;
                return (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                      <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                        Custom / Dynamic Fields
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {customFields.map(key => (
                        <div key={key}>
                          <span className="text-slate-400 font-semibold block uppercase">{key}</span>
                          <span className="font-bold text-slate-700 text-sm mt-0.5 block text-left">
                            {typeof selectedEnquiryForView[key] === 'object' 
                              ? JSON.stringify(selectedEnquiryForView[key]) 
                              : String(selectedEnquiryForView[key]) || '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setViewModalOpen(false);
                  setSelectedEnquiryForView(null);
                }}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Enquiry Modal */}
      {editModalOpen && selectedEnquiryForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden my-8"
          >
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Edit className="h-4.5 w-4.5 text-indigo-650" />
                Edit Enquiry: {selectedEnquiryForEdit.studentName}
              </h3>
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedEnquiryForEdit(null);
                }}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
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

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
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
