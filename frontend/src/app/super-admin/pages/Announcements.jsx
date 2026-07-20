import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Trash2,
  Users,
  Building2,
  FileText,
  Paperclip,
  CheckSquare,
  BarChart3,
  Calendar,
  X,
  Send,
  AlertCircle
} from 'lucide-react';
import superAdminApi from '../../../shared/services/superAdminApi';
import Button from '../../../shared/components/Button';
import Modal from '../../../shared/components/Modal';
import toast from 'react-hot-toast';

const CATEGORIES = ['Information', 'Update', 'Maintenance', 'Feature', 'Security', 'Billing', 'Emergency'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const SuperAdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, sent, scheduled, draft, expired
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Schools list for target selection
  const [schoolsList, setSchoolsList] = useState([]);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAnnouncementDetail, setSelectedAnnouncementDetail] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: 'Information',
    priority: 'Medium',
    targetType: 'all', // all or selected
    targetSchools: [],
    sendType: 'now', // now or later
    scheduledAt: '',
    expiresAt: '',
    requireAcknowledgement: false,
    attachmentUrl: '',
    attachmentFilename: '',
    attachmentType: 'pdf',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    fetchAnalytics();
    fetchSchools();
  }, [activeTab, categoryFilter]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== 'all') params.status = activeTab;
      if (categoryFilter) params.category = categoryFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await superAdminApi.get('/announcements', { params });
      if (res.data.success) {
        setAnnouncements(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await superAdminApi.get('/announcements-analytics');
      if (res.data.success) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const fetchSchools = async () => {
    try {
      const res = await superAdminApi.get('/schools?limit=100');
      if (res.data.success) {
        setSchoolsList(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load schools:', err);
    }
  };

  const handleOpenDetail = async (id) => {
    try {
      const res = await superAdminApi.get(`/announcements/${id}`);
      if (res.data.success) {
        setSelectedAnnouncementDetail(res.data.data);
        setDetailModalOpen(true);
      }
    } catch (err) {
      toast.error('Failed to load detail tracking');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await superAdminApi.delete(`/announcements/${id}`);
      toast.success('Announcement deleted');
      fetchAnnouncements();
      fetchAnalytics();
    } catch (err) {
      toast.error('Failed to delete announcement');
    }
  };

  const handleSchoolToggle = (schoolId) => {
    setFormData((prev) => {
      const exists = prev.targetSchools.includes(schoolId);
      return {
        ...prev,
        targetSchools: exists
          ? prev.targetSchools.filter((id) => id !== schoolId)
          : [...prev.targetSchools, schoolId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please provide a title and message');
      return;
    }

    if (formData.targetType === 'selected' && formData.targetSchools.length === 0) {
      toast.error('Please select at least one school');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        message: formData.message,
        category: formData.category,
        priority: formData.priority,
        targetType: formData.targetType,
        targetSchools: formData.targetSchools,
        sendType: formData.sendType,
        scheduledAt: formData.sendType === 'later' ? formData.scheduledAt : null,
        expiresAt: formData.expiresAt ? formData.expiresAt : null,
        requireAcknowledgement: formData.requireAcknowledgement,
        attachment: formData.attachmentUrl
          ? {
              url: formData.attachmentUrl,
              filename: formData.attachmentFilename || 'Attachment',
              fileType: formData.attachmentType,
            }
          : null,
      };

      const res = await superAdminApi.post('/announcements', payload);
      if (res.data.success) {
        toast.success(res.data.message || 'Announcement created');
        setCreateModalOpen(false);
        // Reset form
        setFormData({
          title: '',
          message: '',
          category: 'Information',
          priority: 'Medium',
          targetType: 'all',
          targetSchools: [],
          sendType: 'now',
          scheduledAt: '',
          expiresAt: '',
          requireAcknowledgement: false,
          attachmentUrl: '',
          attachmentFilename: '',
          attachmentType: 'pdf',
        });
        fetchAnnouncements();
        fetchAnalytics();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse';
      case 'High':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'Medium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-slate-700/60 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-indigo-400" />
            Announcement Platform
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Broadcast platform-wide updates, security alerts, and system notices with real-time read tracking
          </p>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Announcement
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-800 rounded-2xl border border-slate-700/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Announcements</p>
          <p className="text-2xl font-black text-white">{analytics?.totalAnnouncements || 0}</p>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Overall Read Rate</p>
          <p className="text-2xl font-black text-emerald-400">{analytics?.overallReadRate || 0}%</p>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-rose-400" />
            </div>
          </div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Unread Rate</p>
          <p className="text-2xl font-black text-rose-400">{analytics?.unreadRate || 0}%</p>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Scheduled / Drafts</p>
          <p className="text-2xl font-black text-white">
            {(analytics?.scheduledAnnouncements || 0) + (analytics?.draftAnnouncements || 0)}
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700/60 flex flex-col sm:flex-row gap-4 justify-between items-center">
        {/* Status Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto">
          {['all', 'sent', 'scheduled', 'draft', 'expired'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shrink-0 ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700/40 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Announcements Table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700/60 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/60">
                <tr>
                  <th className="px-6 py-4">Title & Message</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Audience</th>
                  <th className="px-6 py-4">Read Rate</th>
                  <th className="px-6 py-4">Status / Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {announcements.length > 0 ? (
                  announcements.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 max-w-xs">
                        <div className="flex items-start space-x-3">
                          {item.requireAcknowledgement && (
                            <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" title="Requires Read Acknowledgement" />
                          )}
                          <div>
                            <p className="font-bold text-white leading-snug line-clamp-1">{item.title}</p>
                            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{item.message.replace(/<[^>]*>?/gm, '')}</p>
                            {item.attachment?.url && (
                              <span className="inline-flex items-center text-[10px] font-semibold text-indigo-400 mt-1 bg-indigo-500/10 px-2 py-0.5 rounded">
                                <Paperclip className="w-3 h-3 mr-1" />
                                {item.attachment.filename || 'Attachment'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-900 text-slate-300 border border-slate-700">
                          {item.category}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getPriorityBadge(item.priority)}`}>
                          {item.priority}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.targetType === 'all' ? (
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                            All Schools
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md">
                            {item.targetSchools?.length || 0} Selected
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700">
                            <div
                              className="bg-indigo-500 h-full rounded-full"
                              style={{ width: `${item.recipientStats?.readRate || 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-white">
                            {item.recipientStats?.readCount}/{item.recipientStats?.totalRecipients} ({item.recipientStats?.readRate}%)
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-medium">
                        <span className="font-bold text-slate-200 uppercase block text-[10px]">{item.status}</span>
                        {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetail(item._id)}
                          className="text-indigo-400 hover:text-indigo-300"
                          title="View Read Receipts"
                        >
                          <BarChart3 className="w-4 h-4 mr-1 inline" />
                          Tracking
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item._id)}
                          className="text-red-400 hover:text-red-300"
                          title="Delete Announcement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-medium">
                      No announcements found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE ANNOUNCEMENT MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Broadcast Announcement"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Title */}
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-400 mb-1">
              Announcement Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Scheduled System Maintenance Notice"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-400 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-400 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {PRIORITIES.map((prio) => (
                  <option key={prio} value={prio}>
                    {prio}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Audience selection */}
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-400 mb-1">Target Audience</label>
            <div className="flex space-x-4 mb-2">
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="targetType"
                  value="all"
                  checked={formData.targetType === 'all'}
                  onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>All Schools</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-bold text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="targetType"
                  value="selected"
                  checked={formData.targetType === 'selected'}
                  onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>Selected Schools ({formData.targetSchools.length} selected)</span>
              </label>
            </div>

            {/* School Multi-select Checklist */}
            {formData.targetType === 'selected' && (
              <div className="max-h-40 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl p-3 space-y-2">
                {schoolsList.map((sch) => (
                  <label key={sch._id} className="flex items-center justify-between text-xs text-slate-300 hover:text-white cursor-pointer p-1 rounded hover:bg-slate-800">
                    <span className="font-bold">{sch.name} ({sch.email})</span>
                    <input
                      type="checkbox"
                      checked={formData.targetSchools.includes(sch._id)}
                      onChange={() => handleSchoolToggle(sch._id)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Message Text Area */}
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-400 mb-1">
              Message Content <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Write message content here..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Schedule & Expiry */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-400 mb-1">Delivery Schedule</label>
              <select
                value={formData.sendType}
                onChange={(e) => setFormData({ ...formData, sendType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 mb-2"
              >
                <option value="now">Send Immediately</option>
                <option value="later">Schedule Later</option>
              </select>

              {formData.sendType === 'later' && (
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-400 mb-1">Expiry Date (Optional)</label>
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Attachment & Acknowledgement toggle */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700/60">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-400 mb-1">Attachment File URL</label>
              <input
                type="url"
                placeholder="https://example.com/document.pdf"
                value={formData.attachmentUrl}
                onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2 pt-5">
              <input
                type="checkbox"
                id="requireAck"
                checked={formData.requireAcknowledgement}
                onChange={(e) => setFormData({ ...formData, requireAcknowledgement: e.target.checked })}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <label htmlFor="requireAck" className="text-xs font-bold text-slate-300 cursor-pointer">
                Require Read Acknowledgement
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="border-slate-700 text-slate-300 text-xs"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              isDisabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              <Send className="w-3.5 h-3.5 mr-1.5 inline" />
              {submitting ? 'Publishing...' : 'Publish Announcement'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* READ TRACKING DETAIL MODAL */}
      {selectedAnnouncementDetail && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title="Announcement Read Receipt Tracking"
        >
          <div className="space-y-4 text-left">
            <div>
              <h3 className="text-lg font-black text-white leading-tight">{selectedAnnouncementDetail.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{selectedAnnouncementDetail.message}</p>
            </div>

            {/* Recipient Stats Grid */}
            <div className="grid grid-cols-4 gap-3 bg-slate-900 p-3 rounded-xl border border-slate-700/60 text-center">
              <div>
                <p className="text-lg font-black text-white">{selectedAnnouncementDetail.trackingStats?.totalRecipients}</p>
                <p className="text-[10px] font-bold uppercase text-slate-400">Total</p>
              </div>
              <div>
                <p className="text-lg font-black text-emerald-400">{selectedAnnouncementDetail.trackingStats?.readCount}</p>
                <p className="text-[10px] font-bold uppercase text-slate-400">Read</p>
              </div>
              <div>
                <p className="text-lg font-black text-rose-400">{selectedAnnouncementDetail.trackingStats?.unreadCount}</p>
                <p className="text-[10px] font-bold uppercase text-slate-400">Unread</p>
              </div>
              <div>
                <p className="text-lg font-black text-indigo-400">{selectedAnnouncementDetail.trackingStats?.readRate}%</p>
                <p className="text-[10px] font-bold uppercase text-slate-400">Read Rate</p>
              </div>
            </div>

            {/* Per-School Status Table */}
            <div className="max-h-60 overflow-y-auto border border-slate-700/60 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-700/60">
                  <tr>
                    <th className="p-3">School Name</th>
                    <th className="p-3">Read Status</th>
                    <th className="p-3">Read Timestamp</th>
                    <th className="p-3">Acknowledged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {selectedAnnouncementDetail.recipientDetails?.map((rec) => (
                    <tr key={rec.schoolId}>
                      <td className="p-3 font-bold text-white">{rec.schoolName}</td>
                      <td className="p-3">
                        {rec.isRead ? (
                          <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Read</span>
                        ) : (
                          <span className="text-slate-400 font-medium bg-slate-800 px-2 py-0.5 rounded">Unread</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-400">
                        {rec.readAt ? new Date(rec.readAt).toLocaleString('en-IN') : 'N/A'}
                      </td>
                      <td className="p-3">
                        {rec.isAcknowledged ? (
                          <span className="text-indigo-400 font-bold">Acknowledged</span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SuperAdminAnnouncements;
