import React, { useState, useEffect } from 'react';
import { Building2, Search, Eye, CheckCircle, XCircle, Trash2, ExternalLink, Filter, Shield } from 'lucide-react';
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

const Schools = () => {
  const navigate = useNavigate();
  const { updateSchoolState } = useAuth();

  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  useEffect(() => {
    fetchSchools();
  }, [pagination.page, statusFilter]);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await superAdminApi.get('/schools', { params });
      if (response.data.success) {
        setSchools(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch schools:', error);
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

  const handleViewSchool = async (schoolId) => {
    try {
      const response = await superAdminApi.get(`/schools/${schoolId}`);
      if (response.data.success) {
        setSelectedSchool(response.data.data);
        setViewModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch school details:', error);
      toast.error('Failed to load school details');
    }
  };

  const handleActivate = async (schoolId) => {
    try {
      await superAdminApi.put(`/schools/${schoolId}/activate`);
      toast.success('School activated successfully');
      fetchSchools();
    } catch (error) {
      toast.error('Failed to activate school');
    }
  };

  const handleSuspend = async (schoolId) => {
    try {
      await superAdminApi.put(`/schools/${schoolId}/suspend`);
      toast.success('School suspended');
      fetchSchools();
    } catch (error) {
      toast.error('Failed to suspend school');
    }
  };

  const handleDelete = async (schoolId) => {
    if (window.confirm('Are you sure you want to delete this school? This action cannot be undone.')) {
      try {
        await superAdminApi.delete(`/schools/${schoolId}`);
        toast.success('School deleted');
        fetchSchools();
      } catch (error) {
        toast.error('Failed to delete school');
      }
    }
  };

  const handleOpenSchool = async (schoolId) => {
    try {
      const response = await superAdminApi.post(`/impersonate/${schoolId}`);
      if (response.data.success && response.data.token) {
        const impersonatedSchool = response.data.school;

        localStorage.setItem('supportMode', 'true');
        localStorage.setItem('supportSchoolId', impersonatedSchool.id || schoolId);
        localStorage.setItem('supportSchoolName', impersonatedSchool.name);
        localStorage.setItem('token', response.data.token);

        if (updateSchoolState) {
          updateSchoolState(impersonatedSchool);
        }

        toast.success(`Supervision Mode Active for "${impersonatedSchool.name}"`);
        const redirectPath = impersonatedSchool.institutionType === 'college' ? '/college/dashboard' : '/dashboard';
        navigate(redirectPath);
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
          <h1 className="text-2xl font-bold text-white">Registered Schools</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage school accounts, subscriptions, and supervision mode</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700/60 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search school by name, email, or phone..."
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
              <thead className="bg-slate-900/60 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/60">
                <tr>
                  <th className="px-6 py-4">School</th>
                  <th className="px-6 py-4">Contact Email</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {schools.length > 0 ? (
                  schools.map((school) => (
                    <tr key={school._id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          {school.logo ? (
                            <img src={school.logo} alt={school.name} className="w-9 h-9 rounded-lg object-contain bg-white p-1" />
                          ) : (
                            <div className="w-9 h-9 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-indigo-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-white leading-tight">{school.name}</p>
                            <p className="text-xs text-slate-400">{school.address || 'Address not set'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-300">{school.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-300">{school.phone || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-900 text-indigo-400 border border-slate-700">
                          {school.subscription?.plan || 'Free Trial'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusBadgeClass(school.subscription?.status)}`}>
                          {school.subscription?.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-medium">
                        {new Date(school.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewSchool(school._id)}
                          className="text-slate-300 hover:text-white"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleOpenSchool(school._id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2.5 py-1"
                          title="Supervision Mode"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1 inline" />
                          Open School
                        </Button>

                        {school.subscription?.status !== 'active' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleActivate(school._id)}
                            className="text-green-400 hover:text-green-300"
                            title="Activate School"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSuspend(school._id)}
                            className="text-amber-400 hover:text-amber-300"
                            title="Suspend School"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(school._id)}
                          className="text-red-400 hover:text-red-300"
                          title="Delete School"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-medium">
                      No schools found in database matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-700/60 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Showing page <span className="font-bold text-white">{pagination.page}</span> of{' '}
              <span className="font-bold text-white">{pagination.pages}</span> ({pagination.total} schools)
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                isDisabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="text-xs border-slate-700 text-slate-300"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                isDisabled={pagination.page >= pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="text-xs border-slate-700 text-slate-300"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* View School Details Modal */}
      {selectedSchool && (
        <Modal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          title="School Detail Overview"
        >
          <div className="space-y-6 text-left">
            <div className="flex items-center space-x-4 border-b border-slate-700/60 pb-4">
              {selectedSchool.logo ? (
                <img src={selectedSchool.logo} alt={selectedSchool.name} className="w-16 h-16 rounded-xl object-contain bg-white p-2" />
              ) : (
                <div className="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-slate-400" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-black text-white">{selectedSchool.name}</h3>
                <p className="text-xs text-slate-400 italic">"{selectedSchool.tagline || 'No tagline provided'}"</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 font-medium uppercase text-[10px]">Email</p>
                <p className="text-white font-bold">{selectedSchool.email}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium uppercase text-[10px]">Phone</p>
                <p className="text-white font-bold">{selectedSchool.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium uppercase text-[10px]">Address</p>
                <p className="text-white font-bold">{selectedSchool.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium uppercase text-[10px]">Plan</p>
                <p className="text-indigo-400 font-bold uppercase">{selectedSchool.subscription?.plan || 'Free Trial'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium uppercase text-[10px]">Subscription Status</p>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(selectedSchool.subscription?.status)}`}>
                  {selectedSchool.subscription?.status || 'active'}
                </span>
              </div>
              <div>
                <p className="text-slate-400 font-medium uppercase text-[10px]">Registration Date</p>
                <p className="text-white font-bold">{new Date(selectedSchool.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            {selectedSchool.statistics && (
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-700/60">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-3">Real Database Statistics</h4>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="p-2 bg-slate-800 rounded-xl">
                    <p className="text-xl font-black text-white">{selectedSchool.statistics.totalEnquiries}</p>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Enquiries</p>
                  </div>
                  <div className="p-2 bg-slate-800 rounded-xl">
                    <p className="text-xl font-black text-white">{selectedSchool.statistics.totalAssessments}</p>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Assessments</p>
                  </div>
                  <div className="p-2 bg-slate-800 rounded-xl">
                    <p className="text-xl font-black text-emerald-400">{selectedSchool.statistics.totalAdmissions}</p>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Admissions</p>
                  </div>
                  <div className="p-2 bg-slate-800 rounded-xl">
                    <p className="text-sm font-black text-indigo-400 mt-1">{formatINR(selectedSchool.statistics.revenue)}</p>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Est. Revenue</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <Button
                onClick={() => {
                  setViewModalOpen(false);
                  handleOpenSchool(selectedSchool._id);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                <Shield className="w-4 h-4 mr-1.5 inline" />
                Open School (Support Mode)
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Schools;
