import React, { useState, useEffect } from 'react';
import {
  Eye, Check, X, ShieldAlert, Calendar, User, Mail, Building,
  Building2, Clock, Search, RefreshCw, CheckCircle2,
  XCircle
} from 'lucide-react';
import Button from '../../../shared/components/Button';
import Modal from '../../../shared/components/Modal';
import superAdminApi from '../services/superAdminApi';
import toast from 'react-hot-toast';

// ─── Status Chip ──────────────────────────────────────────────────────────────
const StatusChip = ({ status }) => {
  const styles = {
    pending:  'bg-amber-500/10  text-amber-400  border-amber-500/20',
    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rejected: 'bg-rose-500/10   text-rose-400   border-rose-500/20',
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
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
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
        { label: 'Total Requests', value: total, color: '#a855f7', bg: 'bg-purple-500/5', border: 'border-purple-500/10' },
        { label: 'Pending Review', value: pending, color: '#f59e0b', bg: 'bg-amber-500/5', border: 'border-amber-500/10' },
        { label: 'Approved', value: approved, color: '#22c55e', bg: 'bg-emerald-500/5', border: 'border-emerald-500/10' },
        { label: 'Rejected', value: rejected, color: '#ef4444', bg: 'bg-rose-500/5', border: 'border-rose-500/10' },
      ].map(({ label, value, color, bg, border }) => (
        <div key={label} className={`${bg} border ${border} rounded-2xl p-4 flex flex-col gap-1 shadow-sm`}>
          <span className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color }}>{label}</span>
          <span className="text-2xl font-black text-white">{value}</span>
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
      (r.planCode || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 text-left bg-slate-900 text-slate-100 min-h-screen">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Subscription Requests</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Review, approve or reject pending school and college subscription purchases.
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs hover:bg-slate-700 hover:text-white transition shadow-md"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* ── Stats Banner ─────────────────────────────────────────────────── */}
      <StatsBanner requests={requests} />

      {/* ── Search & Filter Bar ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by institution, email, plan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 text-xs font-semibold placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wide transition border ${
                statusFilter === s
                  ? s === 'all' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                  : s === 'pending' ? 'bg-amber-500 border-amber-500 text-white shadow-md'
                  : s === 'approved' ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                  : 'bg-rose-500 border-rose-500 text-white shadow-md'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table Card ───────────────────────────────────────────────────── */}
      <div className="bg-slate-800/40 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {/* Accent Bar */}
        <div className="h-1 w-full bg-[#8B5CF6]" />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-xs font-medium">Fetching subscription database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-4 text-slate-500">
              <Building size={28} />
            </div>
            <p className="font-bold text-slate-200 text-sm">No subscription requests found</p>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'All client purchase logs will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 border-b border-slate-800">
                <tr style={{ height: '48px' }}>
                  {['Organization', 'Type', 'Admin', 'Plan', 'Amount', 'Requested', 'Status', 'Actions'].map(col => (
                    <th key={col} className="px-5 py-0 align-middle text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-r border-slate-800/60 last:border-r-0 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((reqItem) => {
                  const org = reqItem.organizationId || {};
                  return (
                    <tr
                      key={reqItem._id}
                      className="hover:bg-slate-800/60 transition duration-150"
                    >
                      {/* Organization */}
                      <td className="px-5 py-3.5 border-r border-slate-800/60">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400 font-extrabold text-xs">
                            {(org.name || 'N')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-100 text-xs">{org.name || 'N/A'}</p>
                            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{org.email || 'N/A'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-3.5 border-r border-slate-800/60">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          org.institutionType === 'college'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {org.institutionType === 'college' ? <Building2 className="h-2.5 w-2.5" /> : <Building className="h-2.5 w-2.5" />}
                          {org.institutionType || 'school'}
                        </span>
                      </td>

                      {/* Admin */}
                      <td className="px-5 py-3.5 border-r border-slate-800/60">
                        <span className="font-semibold text-slate-300 text-xs">{reqItem.requestedBy}</span>
                      </td>

                      {/* Plan */}
                      <td className="px-5 py-3.5 border-r border-slate-800/60">
                        <PlanChip planCode={reqItem.planCode} />
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-3.5 border-r border-slate-800/60">
                        <span className="font-extrabold text-white text-sm">₹{reqItem.price?.toLocaleString('en-IN')}</span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 border-r border-slate-800/60">
                        <span className="text-xs font-semibold text-slate-400">
                          {new Date(reqItem.requestedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 border-r border-slate-800/60">
                        <StatusChip status={reqItem.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 justify-center">
                          {/* View */}
                          <button
                            onClick={() => handleView(reqItem)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-slate-700 hover:text-white text-[11px] transition shadow-sm"
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
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition shadow-md disabled:opacity-60"
                                title="Approve"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>

                              {/* Reject */}
                              <button
                                onClick={() => handleOpenReject(reqItem)}
                                disabled={processingId === reqItem._id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-[11px] transition shadow-md disabled:opacity-60"
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
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-800/60 flex items-center justify-between">
            <p className="text-[11px] text-slate-400 font-semibold">
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
              selectedRequest.status === 'pending' ? 'bg-amber-500/10 border-amber-500/20' :
              selectedRequest.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20' :
              'bg-rose-500/10 border-rose-500/20'
            }`}>
              {selectedRequest.status === 'approved' ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> :
               selectedRequest.status === 'rejected' ? <XCircle className="h-5 w-5 text-rose-400" /> :
               <Clock className="h-5 w-5 text-amber-400" />}
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-200">Request {selectedRequest.status}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Submitted on {new Date(selectedRequest.requestedAt).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Institution Info */}
            <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 grid grid-cols-2 gap-3">
              {[
                { label: 'Institution Name', value: (selectedRequest.organizationId || {}).name },
                { label: 'Institution Type', value: (selectedRequest.organizationId || {}).institutionType, upper: true },
                { label: 'Admin Email', value: selectedRequest.requestedBy },
                { label: 'Contact Number', value: (selectedRequest.organizationId || {}).phone || 'N/A' },
              ].map(({ label, value, upper }) => (
                <div key={label}>
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">{label}</span>
                  <span className={`font-bold text-slate-200 text-xs mt-0.5 block ${upper ? 'uppercase' : ''}`}>{value || 'N/A'}</span>
                </div>
              ))}
            </div>

            {/* Plan Details */}
            <div className="border border-slate-700/60 rounded-xl p-4 grid grid-cols-3 gap-4">
              <div>
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Plan</span>
                <PlanChip planCode={selectedRequest.planCode} />
              </div>
              <div>
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Amount</span>
                <span className="font-extrabold text-white text-sm mt-0.5 block">₹{selectedRequest.price?.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Billing</span>
                <span className="font-bold text-slate-200 text-xs mt-0.5 block uppercase">Yearly</span>
              </div>
            </div>

            {/* Processing Log */}
            {selectedRequest.status !== 'pending' && (
              <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 space-y-2">
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Processing Log</span>
                {selectedRequest.approvedAt && (
                  <p className="text-xs font-semibold text-slate-300">
                    ✅ Approved: {new Date(selectedRequest.approvedAt).toLocaleString('en-IN')} by {selectedRequest.approvedBy || 'Super Admin'}
                  </p>
                )}
                {selectedRequest.remarks && (
                  <p className="text-xs font-semibold text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                    ❌ Remarks: "{selectedRequest.remarks}"
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-700/60">
              <Button onClick={() => setViewModalOpen(false)} className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold px-4 py-2">Close</Button>
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
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-rose-400 shrink-0" />
              <div>
                <p className="text-xs font-extrabold text-rose-300">Rejecting plan for:</p>
                <p className="text-[11px] text-rose-450 font-medium mt-0.5">
                  {(selectedRequest.organizationId || {}).name} — <PlanChip planCode={selectedRequest.planCode} />
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-450 uppercase tracking-wide">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Enter the reason for rejection. This message will be shown to the institution admin..."
                value={rejectionRemarks}
                onChange={(e) => setRejectionRemarks(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs text-white placeholder-slate-500 font-medium focus:outline-none focus:border-indigo-500 transition resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-700/60">
              <Button variant="outline" type="button" onClick={() => setRejectModalOpen(false)} className="border-slate-700 text-slate-300 hover:bg-slate-700">
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-rose-600 hover:bg-rose-550 text-white rounded-xl font-bold px-4 py-2 shadow-md"
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
