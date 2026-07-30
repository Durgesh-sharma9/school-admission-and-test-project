import React, { useState, useEffect } from 'react';
import {
  Eye, Check, X, ShieldAlert, Calendar, User, Mail, Building,
  Building2, Clock, Search, Filter, RefreshCw, CheckCircle2,
  XCircle, AlertCircle
} from 'lucide-react';
import Button from '../../../shared/components/Button';
import Modal from '../../../shared/components/Modal';
import superAdminApi from '../services/superAdminApi';
import toast from 'react-hot-toast';

// ─── Status Chip ──────────────────────────────────────────────────────────────
const StatusChip = ({ status }) => {
  const styles = {
    pending:  'bg-amber-50  text-amber-700  border-amber-100  ',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    rejected: 'bg-rose-50   text-rose-700   border-rose-100  ',
  };
  const icons = {
    pending:  <Clock className="h-3 w-3" />,
    approved: <CheckCircle2 className="h-3 w-3" />,
    rejected: <XCircle className="h-3 w-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${styles[status] || styles.pending}`}>
      {icons[status]}
      {status}
    </span>
  );
};

// ─── Plan Chip ────────────────────────────────────────────────────────────────
const PlanChip = ({ planCode }) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
    {planCode.replace(/-/g, ' ')}
  </span>
);

// ─── Stats Banner ─────────────────────────────────────────────────────────────
const StatsBanner = ({ requests }) => {
  const total = requests.length;
  const pending = requests.filter(r => r.status === 'pending').length;
  const approved = requests.filter(r => r.status === 'approved').length;
  const rejected = requests.filter(r => r.status === 'rejected').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {[
        { label: 'Total Requests', value: total, color: '#8B5CF6', bg: 'bg-purple-50', border: 'border-purple-100' },
        { label: 'Pending Review', value: pending, color: '#F59E0B', bg: 'bg-amber-50', border: 'border-amber-100' },
        { label: 'Approved', value: approved, color: '#22C55E', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        { label: 'Rejected', value: rejected, color: '#EF4444', bg: 'bg-rose-50', border: 'border-rose-100' },
      ].map(({ label, value, color, bg, border }) => (
        <div key={label} className={`${bg} border ${border} rounded-2xl p-4 flex flex-col gap-1`}>
          <span className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color }}>{label}</span>
          <span className="text-2xl font-black text-slate-800">{value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const SubscriptionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await superAdminApi.get('/subscription/requests');
      if (response.data.success) {
        setRequests(response.data.requests);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (reqItem) => {
    setSelectedRequest(reqItem);
    setViewModalOpen(true);
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this subscription request?')) return;
    setProcessingId(id);
    try {
      const response = await superAdminApi.post(`/subscription/requests/${id}/approve`);
      if (response.data.success) {
        toast.success(response.data.message || 'Subscription request approved!');
        fetchRequests();
      }
    } catch (error) {
      console.error('Approve failed:', error);
      toast.error(error.response?.data?.message || 'Failed to approve subscription');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenReject = (reqItem) => {
    setSelectedRequest(reqItem);
    setRejectionRemarks('');
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionRemarks.trim()) {
      toast.error('Please enter a reason for rejection');
      return;
    }
    setProcessingId(selectedRequest._id);
    try {
      const response = await superAdminApi.post(`/subscription/requests/${selectedRequest._id}/reject`, {
        remarks: rejectionRemarks.trim()
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Subscription request rejected');
        setRejectModalOpen(false);
        fetchRequests();
      }
    } catch (error) {
      console.error('Reject failed:', error);
      toast.error(error.response?.data?.message || 'Failed to reject subscription');
    } finally {
      setProcessingId(null);
    }
  };

  // Filter requests
  const filtered = requests.filter(r => {
    const org = r.organizationId || {};
    const matchSearch = !searchQuery ||
      (org.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (org.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.planCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requestedBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="h-9 w-9 border-[3px] border-[#E91E63] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Loading Subscription Requests...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-12 space-y-5 text-left">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Subscription Requests</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Review, approve or reject pending school and college subscription purchases.
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* ── Stats Banner ─────────────────────────────────────────────────── */}
      <StatsBanner requests={requests} />

      {/* ── Search & Filter Bar ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by institution, email, plan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/10 transition-all bg-white"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-2.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wide transition-all border ${
                statusFilter === s
                  ? s === 'all' ? 'bg-slate-800 border-slate-800 text-white shadow-sm'
                  : s === 'pending' ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                  : s === 'approved' ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                  : 'bg-rose-500 border-rose-500 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table Card ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E8ECF3] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
        {/* Pink Accent Bar */}
        <div className="h-1 w-full bg-[#E91E63]" />

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Building size={28} />
            </div>
            <p className="font-bold text-slate-700 text-sm">No subscription requests found</p>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'All client purchase logs will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-white border-b border-slate-100">
                <tr style={{ height: '48px' }}>
                  {['Organization', 'Type', 'Admin', 'Plan', 'Amount', 'Requested', 'Status', 'Actions'].map(col => (
                    <th key={col} className="px-5 py-0 align-middle text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-r border-slate-100 last:border-r-0 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F4F8]">
                {filtered.map((reqItem) => {
                  const org = reqItem.organizationId || {};
                  return (
                    <tr
                      key={reqItem._id}
                      className="hover:bg-slate-50/60 transition-colors duration-150"
                    >
                      {/* Organization */}
                      <td className="px-5 py-3.5 border-r border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#E91E63]/10 to-[#8B5CF6]/10 flex items-center justify-center shrink-0 text-[#E91E63] font-extrabold text-xs">
                            {(org.name || 'N')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{org.name || 'N/A'}</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{org.email || 'N/A'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-3.5 border-r border-slate-100">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          org.institutionType === 'college'
                            ? 'bg-purple-50 text-purple-700 border-purple-100'
                            : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {org.institutionType === 'college' ? <Building2 className="h-2.5 w-2.5" /> : <Building className="h-2.5 w-2.5" />}
                          {org.institutionType || 'school'}
                        </span>
                      </td>

                      {/* Admin */}
                      <td className="px-5 py-3.5 border-r border-slate-100">
                        <span className="font-semibold text-slate-700 text-xs">{reqItem.requestedBy}</span>
                      </td>

                      {/* Plan */}
                      <td className="px-5 py-3.5 border-r border-slate-100">
                        <PlanChip planCode={reqItem.planCode} />
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-3.5 border-r border-slate-100">
                        <span className="font-extrabold text-slate-800 text-sm">₹{reqItem.price?.toLocaleString('en-IN')}</span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 border-r border-slate-100">
                        <span className="text-xs font-semibold text-slate-500">
                          {new Date(reqItem.requestedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 border-r border-slate-100">
                        <StatusChip status={reqItem.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 justify-center">
                          {/* View */}
                          <button
                            onClick={() => handleView(reqItem)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 text-[11px] transition-colors shadow-xs hover:shadow-sm"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>

                          {reqItem.status === 'pending' && (
                            <>
                              {/* Approve */}
                              <button
                                onClick={() => handleApprove(reqItem._id)}
                                disabled={processingId === reqItem._id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-[11px] transition-colors shadow-xs hover:shadow-sm disabled:opacity-60"
                                title="Approve"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>

                              {/* Reject */}
                              <button
                                onClick={() => handleOpenReject(reqItem)}
                                disabled={processingId === reqItem._id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg text-[11px] transition-colors shadow-xs hover:shadow-sm disabled:opacity-60"
                                title="Reject"
                              >
                                <X className="w-3.5 h-3.5" /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Row count */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[11px] text-slate-400 font-medium">
              Showing <strong>{filtered.length}</strong> of <strong>{requests.length}</strong> requests
            </p>
          </div>
        )}
      </div>

      {/* ── View Modal ───────────────────────────────────────────────────── */}
      {viewModalOpen && selectedRequest && (
        <Modal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          title="Subscription Request Details"
        >
          <div className="space-y-4 text-left">
            {/* Status Banner */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${
              selectedRequest.status === 'pending' ? 'bg-amber-50 border-amber-100' :
              selectedRequest.status === 'approved' ? 'bg-emerald-50 border-emerald-100' :
              'bg-rose-50 border-rose-100'
            }`}>
              {selectedRequest.status === 'approved' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> :
               selectedRequest.status === 'rejected' ? <XCircle className="h-5 w-5 text-rose-600" /> :
               <Clock className="h-5 w-5 text-amber-600" />}
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-700">Request {selectedRequest.status}</p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Submitted on {new Date(selectedRequest.requestedAt).toLocaleString('en-IN')}
                </p>
              </div>
              <StatusChip status={selectedRequest.status} />
            </div>

            {/* Institution Info */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 grid grid-cols-2 gap-3">
              {[
                { label: 'Institution Name', value: (selectedRequest.organizationId || {}).name },
                { label: 'Institution Type', value: (selectedRequest.organizationId || {}).institutionType, upper: true },
                { label: 'Admin Email', value: selectedRequest.requestedBy },
                { label: 'Contact Number', value: (selectedRequest.organizationId || {}).phone || 'N/A' },
              ].map(({ label, value, upper }) => (
                <div key={label}>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">{label}</span>
                  <span className={`font-bold text-slate-800 text-xs mt-0.5 block ${upper ? 'uppercase' : ''}`}>{value}</span>
                </div>
              ))}
            </div>

            {/* Plan Details */}
            <div className="border border-slate-100 rounded-xl p-4 grid grid-cols-3 gap-4">
              <div>
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Plan</span>
                <PlanChip planCode={selectedRequest.planCode} />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Amount</span>
                <span className="font-extrabold text-slate-800 text-sm mt-0.5 block">₹{selectedRequest.price?.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Billing</span>
                <span className="font-bold text-slate-800 text-xs mt-0.5 block uppercase">Yearly</span>
              </div>
            </div>

            {/* Processing Log */}
            {selectedRequest.status !== 'pending' && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Processing Log</span>
                {selectedRequest.approvedAt && (
                  <p className="text-xs font-semibold text-slate-600">
                    ✅ Approved: {new Date(selectedRequest.approvedAt).toLocaleString('en-IN')} by {selectedRequest.approvedBy}
                  </p>
                )}
                {selectedRequest.remarks && (
                  <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded-lg">
                    ❌ Remarks: "{selectedRequest.remarks}"
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button onClick={() => setViewModalOpen(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Reject Modal ─────────────────────────────────────────────────── */}
      {rejectModalOpen && selectedRequest && (
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          title="Reject Subscription Request"
        >
          <form onSubmit={handleRejectSubmit} className="space-y-4 text-left">
            {/* Request Summary */}
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-rose-500 shrink-0" />
              <div>
                <p className="text-xs font-extrabold text-rose-800">Rejecting plan for:</p>
                <p className="text-[11px] text-rose-700 font-medium mt-0.5">
                  {(selectedRequest.organizationId || {}).name} — <PlanChip planCode={selectedRequest.planCode} />
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Enter the reason for rejection. This message will be shown to the institution admin..."
                value={rejectionRemarks}
                onChange={(e) => setRejectionRemarks(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#E91E63] focus:ring-4 focus:ring-[#E91E63]/10 transition-all resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-rose-600 hover:bg-rose-700 text-white"
                isLoading={processingId === selectedRequest._id}
              >
                Confirm Rejection
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SubscriptionRequests;
