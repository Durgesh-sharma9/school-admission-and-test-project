import React, { useState, useEffect } from 'react';
import { Eye, Check, X, ShieldAlert, Calendar, User, Mail, Phone, Building } from 'lucide-react';
import Button from '../../../shared/components/Button';
import Modal from '../../../shared/components/Modal';
import superAdminApi from '../services/superAdminApi';
import toast from 'react-hot-toast';

const SubscriptionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [processingId, setProcessingId] = useState(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 border-4 border-[#E91E63] border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 font-semibold text-slate-600">Loading Subscription Requests...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto text-left pb-12 space-y-5">
      {/* Page Header */}
      <div className="mb-5 mt-2">
        <h1 className="text-[24px] font-bold text-slate-800 tracking-tight leading-[1.2]">Subscription Requests Queue</h1>
        <p className="text-slate-500 text-[15px] font-medium mt-1.5">
          Review, approve or reject pending school and college subscription purchases.
        </p>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-[#E8ECF3] rounded-[18px] card-elevated overflow-hidden" style={{ boxShadow: '0 10px 28px rgba(15, 23, 42, 0.08)' }}>
        <div className="h-[4px] w-full bg-[#E91E63] rounded-t-[18px]" />

        {requests.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4 text-indigo-600">
              <Building size={28} />
            </div>
            <p className="font-bold text-gray-800 text-sm">No subscription requests found</p>
            <p className="text-xs text-gray-400 font-semibold mt-1">
              All client purchase logs will appear here in chronological order.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="text-[11px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 bg-white" style={{ height: '48px' }}>
                <tr style={{ height: '48px' }}>
                  <th className="px-5 py-0 border-r border-slate-100 align-middle">Organization</th>
                  <th className="px-5 py-0 border-r border-slate-100 align-middle">Type</th>
                  <th className="px-5 py-0 border-r border-slate-100 align-middle">Admin</th>
                  <th className="px-5 py-0 border-r border-slate-100 align-middle">Plan</th>
                  <th className="px-5 py-0 border-r border-slate-100 align-middle">Amount</th>
                  <th className="px-5 py-0 border-r border-slate-100 align-middle">Requested Date</th>
                  <th className="px-5 py-0 border-r border-slate-100 align-middle">Status</th>
                  <th className="px-5 py-0 text-center w-[260px] align-middle">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8ECF3]">
                {requests.map((reqItem) => {
                  const org = reqItem.organizationId || {};
                  return (
                    <tr key={reqItem._id} className="transition-all duration-200 hover:bg-slate-50/80">
                      <td className="px-5 py-3 border-r border-slate-100">
                        <div className="font-bold text-slate-900 text-xs">{org.name || 'N/A'}</div>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{org.email || 'N/A'}</span>
                      </td>
                      <td className="px-5 py-3 border-r border-slate-100 font-bold text-xs uppercase text-slate-500">
                        {org.institutionType || 'school'}
                      </td>
                      <td className="px-5 py-3 border-r border-slate-100">
                        <span className="font-semibold text-slate-700 text-xs">{reqItem.requestedBy}</span>
                      </td>
                      <td className="px-5 py-3 border-r border-slate-100">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                          {reqItem.planCode.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3 border-r border-slate-100 font-extrabold text-slate-800 text-xs">
                        ₹{reqItem.price}
                      </td>
                      <td className="px-5 py-3 border-r border-slate-100 text-xs font-semibold text-slate-500">
                        {new Date(reqItem.requestedAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 border-r border-slate-100">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          reqItem.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          reqItem.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {reqItem.status}
                        </span>
                      </td>
                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleView(reqItem)}
                            className="px-2 py-1 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-[10px] flex items-center gap-1 shadow-xs"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>

                          {reqItem.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(reqItem._id)}
                                disabled={processingId === reqItem._id}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors text-[10px] flex items-center gap-1 shadow-xs"
                                title="Approve Plan"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => handleOpenReject(reqItem)}
                                disabled={processingId === reqItem._id}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors text-[10px] flex items-center gap-1 shadow-xs"
                                title="Reject Plan"
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
      </div>

      {/* View Modal */}
      {viewModalOpen && selectedRequest && (
        <Modal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          title="Subscription Request Details"
        >
          <div className="space-y-6 text-left text-xs">
            <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 font-semibold uppercase block">Institution Name</span>
                <span className="font-bold text-slate-800 text-sm">{(selectedRequest.organizationId || {}).name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase block">Institution Type</span>
                <span className="font-bold text-slate-800 text-sm uppercase">{(selectedRequest.organizationId || {}).institutionType}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase block">Admin Email</span>
                <span className="font-bold text-slate-800">{selectedRequest.requestedBy}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase block">Contact Number</span>
                <span className="font-bold text-slate-800">{(selectedRequest.organizationId || {}).phone || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase block">Plan Summary</span>
              <div className="border border-slate-100 rounded-xl p-4 grid grid-cols-3 gap-4">
                <div>
                  <span className="text-slate-400 font-semibold uppercase block text-[10px]">Plan Requested</span>
                  <span className="font-bold text-indigo-700 text-sm uppercase">{selectedRequest.planCode.replace('-', ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase block text-[10px]">Amount Price</span>
                  <span className="font-extrabold text-slate-800 text-sm">₹{selectedRequest.price}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase block text-[10px]">Billing Cycle</span>
                  <span className="font-bold text-slate-800 text-sm uppercase">Yearly</span>
                </div>
              </div>
            </div>

            {selectedRequest.status !== 'pending' && (
              <div className="space-y-1 bg-slate-50 p-4 border border-slate-100 rounded-xl">
                <span className="text-slate-400 font-semibold uppercase block text-[10px]">Processing Log</span>
                <p className="font-bold text-slate-700">
                  Status: <span className="uppercase">{selectedRequest.status}</span>
                </p>
                {selectedRequest.approvedAt && (
                  <p className="text-slate-500 font-medium mt-1">
                    Approved at: {new Date(selectedRequest.approvedAt).toLocaleString()} by {selectedRequest.approvedBy}
                  </p>
                )}
                {selectedRequest.remarks && (
                  <p className="text-rose-600 font-semibold mt-1">
                    Remarks: "{selectedRequest.remarks}"
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button onClick={() => setViewModalOpen(false)}>Close Details</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedRequest && (
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          title="Reject Subscription Request"
        >
          <form onSubmit={handleRejectSubmit} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase">
                Rejection Reason / Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Please enter the reason for rejection (e.g. invalid bank proof, details mismatch)... This will be shown to the client admin."
                value={rejectionRemarks}
                onChange={(e) => setRejectionRemarks(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#E91E63] focus:ring-4 focus:ring-[#E91E63]/15 transition-all"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white" isLoading={processingId === selectedRequest._id}>
                Confirm Reject
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SubscriptionRequests;
