import React, { useState, useEffect } from 'react';
import { GraduationCap, Search, Eye, CheckCircle, XCircle, Trash2, ExternalLink, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import superAdminApi from '../services/superAdminApi';
import { useAuth } from '../../school/contexts/AuthContext';
import Button from '../../../shared/components/Button';
import Modal from '../../../shared/components/Modal';
import toast from 'react-hot-toast';

const formatINR = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const Colleges = () => {
  const navigate = useNavigate();
  const { updateSchoolState } = useAuth();

  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  useEffect(() => {
    fetchColleges();
  }, [pagination.page, statusFilter]);

  const fetchColleges = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        institutionType: 'college',
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await superAdminApi.get('/schools', { params });
      if (response.data.success) {
        setColleges(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch colleges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleViewCollege = async (collegeId) => {
    try {
      const response = await superAdminApi.get(`/schools/${collegeId}`);
      if (response.data.success) {
        setSelectedCollege(response.data.data);
        setViewModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch college details:', error);
      toast.error('Failed to load college details');
    }
  };

  const handleActivate = async (collegeId) => {
    try {
      await superAdminApi.put(`/schools/${collegeId}/activate`);
      toast.success('College activated successfully');
      fetchColleges();
    } catch (error) {
      toast.error('Failed to activate college');
    }
  };

  const handleSuspend = async (collegeId) => {
    try {
      await superAdminApi.put(`/schools/${collegeId}/suspend`);
      toast.success('College suspended');
      fetchColleges();
    } catch (error) {
      toast.error('Failed to suspend college');
    }
  };

  const handleDelete = async (collegeId) => {
    if (window.confirm('Are you sure you want to delete this college? This action cannot be undone.')) {
      try {
        await superAdminApi.delete(`/schools/${collegeId}`);
        toast.success('College deleted');
        fetchColleges();
      } catch (error) {
        toast.error('Failed to delete college');
      }
    }
  };

  const handleOpenCollege = async (collegeId) => {
    try {
      const response = await superAdminApi.post(`/impersonate/${collegeId}`);
      if (response.data.success && response.data.token) {
        const impersonatedCollege = response.data.school;

        localStorage.setItem('supportMode', 'true');
        localStorage.setItem('supportSchoolId', impersonatedCollege.id || collegeId);
        localStorage.setItem('supportSchoolName', impersonatedCollege.name);
        localStorage.setItem('token', response.data.token);

        if (updateSchoolState) {
          updateSchoolState(impersonatedCollege);
        }

        toast.success(`Supervision Mode Active for "${impersonatedCollege.name}"`);
        navigate('/college/dashboard');
      }
    } catch (error) {
      console.error('Failed to enter Support Mode:', error);
      toast.error(error.response?.data?.message || 'Failed to enter Support Mode');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'suspended':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Registered Colleges</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage college accounts, subscriptions, and supervision mode</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700/60 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search college by name, email, or phone..."
            value={search}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {['', 'active', 'free-trial', 'suspended'].map((st) => (
            <button
              key={st}
              onClick={() => handleStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {st === '' ? 'All Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700/60 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/60">
                <tr>
                  <th className="px-4 py-2">College</th>
                  <th className="px-4 py-2">Contact Email</th>
                  <th className="px-4 py-2">Phone</th>
                  <th className="px-4 py-2">Plan</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Joined</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {colleges.length > 0 ? (
                  colleges.map((college) => (
                    <tr key={college._id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          {college.logo ? (
                            <img src={college.logo} alt={college.name} className="w-8 h-8 rounded-lg object-contain bg-white p-1" />
                          ) : (
                            <div className="w-8 h-8 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                              <GraduationCap className="w-4 h-4 text-emerald-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-white leading-tight text-xs">{college.name}</p>
                            <p className="text-[10px] text-slate-400">{college.address || 'Address not set'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap font-medium text-slate-300 text-xs">{college.email}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-slate-300 text-xs">{college.phone || 'N/A'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-indigo-400 border border-slate-700">
                          {college.subscription?.plan || 'Free Trial'}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadgeClass(college.subscription?.status)}`}>
                          {college.subscription?.status || 'active'}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-[11px] text-slate-400 font-medium">
                        {new Date(college.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewCollege(college._id)}
                          className="text-slate-300 hover:text-white"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenCollege(college._id)}
                          className="text-indigo-400 hover:text-indigo-300 flex inline-items items-center space-x-1"
                          title="Supervise College"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="text-xs font-bold">Open College</span>
                        </Button>
                        {college.subscription?.status === 'active' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSuspend(college._id)}
                            className="text-rose-400 hover:text-rose-300"
                            title="Suspend"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleActivate(college._id)}
                            className="text-emerald-400 hover:text-emerald-300"
                            title="Activate"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(college._id)}
                          className="text-slate-400 hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-semibold">
                      No colleges registered on the platform.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {viewModalOpen && selectedCollege && (
        <Modal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          title="College Details"
          size="lg"
        >
          <div className="space-y-6 text-left text-slate-300">
            <div className="flex items-center space-x-4">
              {selectedCollege.logo ? (
                <img src={selectedCollege.logo} alt={selectedCollege.name} className="w-16 h-16 rounded-xl object-contain bg-slate-900 border border-slate-700 p-2" />
              ) : (
                <div className="w-16 h-16 bg-emerald-600/20 rounded-xl flex items-center justify-center border border-emerald-500/20">
                  <GraduationCap className="w-8 h-8 text-emerald-400" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-white">{selectedCollege.name}</h3>
                <p className="text-sm text-slate-400">{selectedCollege.tagline || 'No tagline set'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/40 p-4 rounded-xl border border-slate-700/50">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Institution Info</h4>
                <p className="text-sm"><span className="text-slate-500 font-semibold">Admin Email:</span> {selectedCollege.email}</p>
                <p className="text-sm"><span className="text-slate-500 font-semibold">Contact Phone:</span> {selectedCollege.phone}</p>
                <p className="text-sm"><span className="text-slate-500 font-semibold">Address:</span> {selectedCollege.address}</p>
                <p className="text-sm"><span className="text-slate-500 font-semibold">Website:</span> {selectedCollege.website ? <a href={selectedCollege.website} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{selectedCollege.website}</a> : 'N/A'}</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subscription telemetry</h4>
                <p className="text-sm"><span className="text-slate-500 font-semibold">Plan:</span> <span className="px-2 py-0.5 bg-slate-900 text-indigo-400 font-bold border border-slate-700 rounded text-xs uppercase">{selectedCollege.subscription?.plan || 'Free Trial'}</span></p>
                <p className="text-sm"><span className="text-slate-500 font-semibold">Status:</span> <span className="px-2 py-0.5 bg-slate-900 text-emerald-400 font-bold border border-slate-700 rounded text-xs uppercase">{selectedCollege.subscription?.status || 'active'}</span></p>
                <p className="text-sm">
                  <span className="text-slate-500 font-semibold">Trial Period:</span>{' '}
                  {selectedCollege.subscription?.trialStart ? new Date(selectedCollege.subscription.trialStart).toLocaleDateString() : 'N/A'} -{' '}
                  {selectedCollege.subscription?.trialEnd ? new Date(selectedCollege.subscription.trialEnd).toLocaleDateString() : 'N/A'}
                </p>
                <p className="text-sm">
                  <span className="text-slate-500 font-semibold">Active Billing Period:</span>{' '}
                  {selectedCollege.subscription?.startDate ? new Date(selectedCollege.subscription.startDate).toLocaleDateString() : 'N/A'} -{' '}
                  {selectedCollege.subscription?.expiryDate ? new Date(selectedCollege.subscription.expiryDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Colleges;
