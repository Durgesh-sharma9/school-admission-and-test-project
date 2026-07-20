import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Button from './Button';
import Input from './Input';
import Loader from './Loader';
import toast from 'react-hot-toast';
import {
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const LocalityManagement = () => {
  const [activeTab, setActiveTab] = useState('approved'); // 'approved' or 'pending'
  const [localities, setLocalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editLocality, setEditLocality] = useState(null);
  const [localityName, setLocalityName] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete/Deactivate Confirmation state
  const [deleteConfirmLocality, setDeleteConfirmLocality] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch localities list
  const fetchLocalities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/localities', {
        params: {
          type: activeTab,
          search,
          status: statusFilter,
          page,
          limit: 15,
        },
      });

      if (response.success) {
        setLocalities(response.data || []);
        setTotalPages(response.pagination?.pages || 1);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load localities');
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending count for badge indicator
  const fetchPendingCount = async () => {
    try {
      const res = await api.get('/localities', {
        params: { type: 'pending', limit: 1 },
      });
      if (res.success) {
        setPendingCount(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Pending count fetch error:', err);
    }
  };

  useEffect(() => {
    fetchLocalities();
    fetchPendingCount();
  }, [activeTab, search, statusFilter, page]);

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditLocality(null);
    setLocalityName('');
    setModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (loc) => {
    setEditLocality(loc);
    setLocalityName(loc.name);
    setModalOpen(true);
  };

  // Save Add / Edit
  const handleSaveLocality = async (e) => {
    e.preventDefault();
    if (!localityName || !localityName.trim()) {
      toast.error('Locality Name is required');
      return;
    }

    setSaving(true);
    try {
      let response;
      if (editLocality) {
        response = await api.put(`/localities/${editLocality._id}`, {
          name: localityName.trim(),
        });
      } else {
        response = await api.post('/localities', {
          name: localityName.trim(),
        });
      }

      if (response.success) {
        toast.success(response.message || 'Locality saved successfully');
        setModalOpen(false);
        setLocalityName('');
        setEditLocality(null);
        fetchLocalities();
        fetchPendingCount();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save locality');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Active / Inactive Status
  const handleToggleStatus = async (loc) => {
    const newStatus = loc.status === 'active' ? 'inactive' : 'active';
    try {
      const response = await api.patch(`/localities/${loc._id}/status`, {
        status: newStatus,
      });

      if (response.success) {
        toast.success(`Locality ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        fetchLocalities();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  // Approve Pending Locality
  const handleApprove = async (locId) => {
    try {
      const response = await api.patch(`/localities/${locId}/approve`);
      if (response.success) {
        toast.success('Locality approved and moved to master list!');
        fetchLocalities();
        fetchPendingCount();
      }
    } catch (err) {
      toast.error(err.message || 'Approve failed');
    }
  };

  // Execute Delete or Deactivate
  const handleConfirmDelete = async () => {
    if (!deleteConfirmLocality) return;
    setDeleting(true);
    try {
      const response = await api.delete(`/localities/${deleteConfirmLocality._id}`);
      if (response.success) {
        if (response.deactivated) {
          toast.success(response.message, { duration: 5000 });
        } else {
          toast.success(response.message || 'Locality removed successfully');
        }
        setDeleteConfirmLocality(null);
        fetchLocalities();
        fetchPendingCount();
      }
    } catch (err) {
      toast.error(err.message || 'Delete operation failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Locality Management</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage your school's master locality directory and approve parent suggestions.
          </p>
        </div>
        <Button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 shadow-sm text-xs font-bold shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Locality
        </Button>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab('approved');
            setPage(1);
          }}
          className={`px-5 py-3 font-extrabold text-xs tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'approved'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <MapPin className="h-4 w-4" />
          Approved Localities
        </button>
        <button
          onClick={() => {
            setActiveTab('pending');
            setPage(1);
          }}
          className={`px-5 py-3 font-extrabold text-xs tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock className="h-4 w-4" />
          Pending Suggestions
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-xs">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters Row */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full text-left">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search locality name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-medium"
          />
        </div>

        {activeTab === 'approved' && (
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12">
            <Loader message="Loading locality master list..." />
          </div>
        ) : localities.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="mx-auto h-12 w-12 text-slate-300 bg-slate-50 rounded-full flex items-center justify-center">
              <MapPin className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-600">
              No {activeTab} localities found
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {activeTab === 'approved'
                ? 'Click "+ Add Locality" to register a new locality for your school.'
                : 'Pending locality suggestions entered by parents or admins will appear here for review.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                {activeTab === 'approved' ? (
                  <tr>
                    <th className="px-6 py-4">Locality Name</th>
                    <th className="px-6 py-4 text-center">Used In Enquiries</th>
                    <th className="px-6 py-4 text-center">Used In Admissions</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4">Created Date</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-6 py-4">Locality Name</th>
                    <th className="px-6 py-4">First Used By</th>
                    <th className="px-6 py-4">Created Date</th>
                    <th className="px-6 py-4 text-center">Times Used</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {activeTab === 'approved' ? (
                  localities.map((loc) => (
                    <tr key={loc._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                        {loc.name}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {loc.usedInEnquiries || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                          {loc.usedInAdmissions || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            loc.status === 'active'
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                              : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}
                        >
                          {loc.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-[11px]">
                        {new Date(loc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(loc)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
                            title="Edit Locality"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(loc)}
                            className={`p-1.5 hover:bg-slate-100 rounded-lg transition-colors ${
                              loc.status === 'active' ? 'text-emerald-600 hover:text-amber-600' : 'text-slate-400 hover:text-emerald-600'
                            }`}
                            title={loc.status === 'active' ? 'Deactivate Locality' : 'Activate Locality'}
                          >
                            {loc.status === 'active' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmLocality(loc)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete Locality"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  localities.map((loc) => (
                    <tr key={loc._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-amber-500" />
                        {loc.name}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            loc.createdBy === 'parent'
                              ? 'bg-purple-50 text-purple-700 border border-purple-100'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}
                        >
                          {loc.createdBy === 'parent' ? 'Parent Suggestion' : 'Admin'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-[11px]">
                        {new Date(loc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-800">
                        {loc.timesUsed || 1}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleApprove(loc._id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-colors shadow-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setDeleteConfirmLocality(loc)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-xs font-semibold text-slate-500 pt-2">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="py-1 px-3 text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="py-1 px-3 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add / Edit Locality Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-indigo-700">
                <MapPin className="h-5 w-5" />
                <h3 className="text-sm font-extrabold uppercase tracking-wide">
                  {editLocality ? 'Edit Locality' : 'Add New Locality'}
                </h3>
              </div>
            </div>

            <form onSubmit={handleSaveLocality} className="p-6 space-y-5">
              <Input
                label="Locality Name *"
                name="localityName"
                placeholder="e.g. Mahapura, Mansarovar, Vaishali Nagar"
                value={localityName}
                onChange={(e) => setLocalityName(e.target.value)}
                required
                autoFocus
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={saving}
                  className="px-6"
                >
                  {editLocality ? 'Update Locality' : 'Save Locality'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Deactivate Confirmation Dialog */}
      {deleteConfirmLocality && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto h-12 w-12 text-rose-600 bg-rose-50 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              {deleteConfirmLocality.isApproved ? 'Delete / Deactivate Locality' : 'Reject Pending Locality'}
            </h3>
            <p className="text-xs text-slate-500 leading-normal">
              {deleteConfirmLocality.isApproved ? (
                <>
                  Are you sure you want to remove <strong className="text-slate-800">{deleteConfirmLocality.name}</strong>?
                  <span className="block mt-2 text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                    ℹ️ Note: If this locality is already linked to enquiries or admissions, it will be automatically <strong>deactivated</strong> instead of deleted to preserve history.
                  </span>
                </>
              ) : (
                <>
                  Are you sure you want to reject the pending suggestion <strong className="text-slate-800">{deleteConfirmLocality.name}</strong>? It will be removed from the pending list.
                </>
              )}
            </p>

            <div className="flex justify-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteConfirmLocality(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDelete}
                isLoading={deleting}
                className="bg-rose-600 hover:bg-rose-700 text-white px-6"
              >
                Proceed
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocalityManagement;
