import React, { useState, useEffect } from 'react';
import superAdminApi from '../services/superAdminApi';
import Button from '../../../shared/components/Button';
import Loader from '../../../shared/components/Loader';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Check, X, Layers, BookOpen, GraduationCap, Inbox, Send, MessageSquare } from 'lucide-react';

const AcademicMasters = () => {
  const [activeTab, setActiveTab] = useState('departments');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [requests, setRequests] = useState([]);

  // Form states
  const [deptForm, setDeptForm] = useState({ name: '', code: '', id: null });
  const [courseForm, setCourseForm] = useState({ name: '', code: '', departmentId: '', id: null });
  const [specForm, setSpecForm] = useState({ name: '', courseId: '', id: null });

  // Modals / Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'departments') {
        const res = await superAdminApi.get('/academic/departments');
        setDepartments(res.data.data);
      } else if (activeTab === 'courses') {
        const [courseRes, deptRes] = await Promise.all([
          superAdminApi.get('/academic/courses'),
          superAdminApi.get('/academic/departments')
        ]);
        setCourses(courseRes.data.data);
        setDepartments(deptRes.data.data);
      } else if (activeTab === 'specializations') {
        const [specRes, courseRes] = await Promise.all([
          superAdminApi.get('/academic/specializations'),
          superAdminApi.get('/academic/courses?activeOnly=true')
        ]);
        setSpecializations(specRes.data.data);
        setCourses(courseRes.data.data);
      } else if (activeTab === 'requests') {
        const res = await superAdminApi.get('/academic/requests');
        setRequests(res.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to fetch academic master data');
    } finally {
      setLoading(false);
    }
  };

  // Department handlers
  const handleSaveDept = async (e) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code) return;
    try {
      if (deptForm.id) {
        await superAdminApi.put(`/academic/departments/${deptForm.id}`, { name: deptForm.name, code: deptForm.code });
        toast.success('Department updated successfully');
      } else {
        await superAdminApi.post('/academic/departments', { name: deptForm.name, code: deptForm.code });
        toast.success('Department created successfully');
      }
      setDeptForm({ name: '', code: '', id: null });
      setIsEditing(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save department');
    }
  };

  const handleToggleDept = async (id, currentStatus) => {
    try {
      await superAdminApi.put(`/academic/departments/${id}`, { isActive: !currentStatus });
      toast.success('Status updated');
      fetchData();
    } catch (err) {
      toast.error('Failed to toggle status');
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await superAdminApi.delete(`/academic/departments/${id}`);
      toast.success('Department deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete department');
    }
  };

  // Course handlers
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!courseForm.name || !courseForm.code || !courseForm.departmentId) return;
    try {
      if (courseForm.id) {
        await superAdminApi.put(`/academic/courses/${courseForm.id}`, courseForm);
        toast.success('Course updated successfully');
      } else {
        await superAdminApi.post('/academic/courses', courseForm);
        toast.success('Course created successfully');
      }
      setCourseForm({ name: '', code: '', departmentId: '', id: null });
      setIsEditing(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save course');
    }
  };

  const handleToggleCourse = async (id, currentStatus) => {
    try {
      await superAdminApi.put(`/academic/courses/${id}`, { isActive: !currentStatus });
      toast.success('Status updated');
      fetchData();
    } catch (err) {
      toast.error('Failed to toggle status');
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await superAdminApi.delete(`/academic/courses/${id}`);
      toast.success('Course deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete course');
    }
  };

  // Specialization handlers
  const handleSaveSpec = async (e) => {
    e.preventDefault();
    if (!specForm.name || !specForm.courseId) return;
    try {
      if (specForm.id) {
        await superAdminApi.put(`/academic/specializations/${specForm.id}`, specForm);
        toast.success('Specialization updated');
      } else {
        await superAdminApi.post('/academic/specializations', specForm);
        toast.success('Specialization created');
      }
      setSpecForm({ name: '', courseId: '', id: null });
      setIsEditing(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save specialization');
    }
  };

  const handleToggleSpec = async (id, currentStatus) => {
    try {
      await superAdminApi.put(`/academic/specializations/${id}`, { isActive: !currentStatus });
      toast.success('Status updated');
      fetchData();
    } catch (err) {
      toast.error('Failed to toggle status');
    }
  };

  const handleDeleteSpec = async (id) => {
    if (!window.confirm('Are you sure you want to delete this specialization?')) return;
    try {
      await superAdminApi.delete(`/academic/specializations/${id}`);
      toast.success('Specialization deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete specialization');
    }
  };

  // Request handlers (Approve / Reject)
  const handleApproveRequest = async (reqId) => {
    if (!window.confirm('Are you sure you want to approve this request? Corresponding master will be automatically created.')) return;
    setActionLoading(true);
    try {
      const res = await superAdminApi.post(`/academic/requests/${reqId}/approve`);
      if (res.data.success) {
        toast.success('Request approved and master record created!');
        setIsViewModalOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please specify rejection remarks');
      return;
    }
    setActionLoading(true);
    try {
      const res = await superAdminApi.post(`/academic/requests/${selectedReq._id}/reject`, { reason: rejectReason });
      if (res.data.success) {
        toast.success('Request rejected successfully');
        setIsRejectModalOpen(false);
        setIsViewModalOpen(false);
        setRejectReason('');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left text-slate-100 max-w-6xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">Academic Masters Configuration</h2>
        <p className="text-slate-400 text-xs mt-1">Super Admin dashboard to configure global departments, courses, specializations, and review college requests.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 bg-slate-800 p-1 rounded-xl gap-2 max-w-xl">
        {[
          { key: 'departments', label: 'Departments', icon: Layers },
          { key: 'courses', label: 'Courses', icon: BookOpen },
          { key: 'specializations', label: 'Specializations', icon: GraduationCap },
          { key: 'requests', label: 'Requests Workflow', icon: Inbox }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setIsEditing(false);
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'requests' ? (
        /* Requests Workflow Grid view */
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl w-full">
          <h3 className="text-sm font-bold text-white mb-4 border-b border-slate-700 pb-2">Academic Request Workflow Pipeline</h3>
          
          {loading ? (
            <Loader message="Querying academic request records..." />
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-slate-400 italic text-xs space-y-2">
              <Inbox className="h-10 w-10 text-slate-650 mx-auto" />
              <p>No college requests found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">College</th>
                    <th className="py-3 px-4">Requested By</th>
                    <th className="py-3 px-4">Request Type</th>
                    <th className="py-3 px-4">Requested Item</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-750 text-slate-300">
                  {requests.map(req => {
                    const itemDisplay = req.requestType === 'Department' ? req.departmentName :
                                        req.requestType === 'Course' ? `${req.courseName} (${req.courseCode || 'No Code'})` :
                                        `${req.specializationName} (${req.courseId?.name || 'N/A'})`;

                    const statusBadge = req.status === 'Pending' ? 'bg-amber-950 text-amber-400 border border-amber-900' :
                                        req.status === 'Approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                                        'bg-rose-950 text-rose-400 border border-rose-900';

                    return (
                      <tr key={req._id}>
                        <td className="py-3.5 px-4 font-semibold text-white">{req.collegeId?.name || 'Unknown'}</td>
                        <td className="py-3.5 px-4">{req.requestedBy}</td>
                        <td className="py-3.5 px-4 font-semibold text-indigo-400">{req.requestType}</td>
                        <td className="py-3.5 px-4">{itemDisplay}</td>
                        <td className="py-3.5 px-4 max-w-xs truncate" title={req.reason}>{req.reason}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide ${statusBadge}`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedReq(req);
                              setIsViewModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-650 rounded-lg font-bold text-[10px] text-white"
                          >
                            View
                          </button>
                          {req.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleApproveRequest(req._id)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold text-[10px] text-white"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedReq(req);
                                  setRejectReason('');
                                  setIsRejectModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 rounded-lg font-bold text-[10px] text-white"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* CRUD Masters Grid Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Left Form: Create / Edit */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl h-fit">
            <h3 className="text-sm font-bold text-white mb-4 border-b border-slate-700 pb-2">
              {isEditing ? 'Edit Master Record' : 'Create Master Record'}
            </h3>

            {activeTab === 'departments' && (
              <form onSubmit={handleSaveDept} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">Department Name</label>
                  <input
                    type="text"
                    value={deptForm.name}
                    onChange={e => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Engineering"
                    className="w-full bg-slate-900 border border-slate-755 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">Department Code</label>
                  <input
                    type="text"
                    value={deptForm.code}
                    onChange={e => setDeptForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. ENG"
                    className="w-full bg-slate-900 border border-slate-755 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1 py-2 text-xs font-bold">
                    {deptForm.id ? 'Update Department' : 'Create Department'}
                  </Button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeptForm({ name: '', code: '', id: null });
                        setIsEditing(false);
                      }}
                      className="px-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold transition-all text-slate-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}

            {activeTab === 'courses' && (
              <form onSubmit={handleSaveCourse} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">Select Department</label>
                  <select
                    value={courseForm.departmentId}
                    onChange={e => setCourseForm(prev => ({ ...prev, departmentId: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-755 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                    required
                  >
                    <option value="">-- Choose Department --</option>
                    {departments.map(d => (
                      <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">Course Name</label>
                  <input
                    type="text"
                    value={courseForm.name}
                    onChange={e => setCourseForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Bachelor of Technology"
                    className="w-full bg-slate-900 border border-slate-755 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">Course Code</label>
                  <input
                    type="text"
                    value={courseForm.code}
                    onChange={e => setCourseForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. BTECH"
                    className="w-full bg-slate-900 border border-slate-755 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1 py-2 text-xs font-bold">
                    {courseForm.id ? 'Update Course' : 'Create Course'}
                  </Button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setCourseForm({ name: '', code: '', departmentId: '', id: null });
                        setIsEditing(false);
                      }}
                      className="px-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold transition-all text-slate-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}

            {activeTab === 'specializations' && (
              <form onSubmit={handleSaveSpec} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">Select Course</label>
                  <select
                    value={specForm.courseId}
                    onChange={e => setSpecForm(prev => ({ ...prev, courseId: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-755 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                    required
                  >
                    <option value="">-- Choose Course --</option>
                    {courses.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">Specialization Name</label>
                  <input
                    type="text"
                    value={specForm.name}
                    onChange={e => setSpecForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Computer Science"
                    className="w-full bg-slate-900 border border-slate-755 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1 py-2 text-xs font-bold">
                    {specForm.id ? 'Update Specialization' : 'Create Specialization'}
                  </Button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setSpecForm({ name: '', courseId: '', id: null });
                        setIsEditing(false);
                      }}
                      className="px-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold transition-all text-slate-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Right Table View list */}
          <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 border-b border-slate-700 pb-2">Active Master Records</h3>
            
            {loading ? (
              <Loader message="Querying academic definitions..." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-4">Name</th>
                      {activeTab !== 'specializations' && (
                        <th className="py-3 px-4">Code</th>
                      )}
                      {activeTab === 'courses' && <th className="py-3 px-4">Department</th>}
                      {activeTab === 'specializations' && <th className="py-3 px-4">Course</th>}
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-750 text-slate-300">
                    {activeTab === 'departments' && departments.map(d => (
                      <tr key={d._id}>
                        <td className="py-3.5 px-4 font-semibold text-white">{d.name}</td>
                        <td className="py-3.5 px-4">{d.code}</td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleDept(d._id, d.isActive)}
                            className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                              d.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-rose-950 text-rose-400 border border-rose-900'
                            }`}
                          >
                            {d.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setDeptForm({ name: d.name, code: d.code, id: d._id });
                              setIsEditing(true);
                            }}
                            className="p-1 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDept(d._id)}
                            className="p-1 hover:bg-slate-750 rounded-md text-rose-400 hover:text-rose-350"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {activeTab === 'courses' && courses.map(c => (
                      <tr key={c._id}>
                        <td className="py-3.5 px-4 font-semibold text-white">{c.name}</td>
                        <td className="py-3.5 px-4">{c.code}</td>
                        <td className="py-3.5 px-4">{c.departmentId?.name || 'N/A'}</td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleCourse(c._id, c.isActive)}
                            className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                              c.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-rose-950 text-rose-400 border border-rose-900'
                            }`}
                          >
                            {c.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setCourseForm({ name: c.name, code: c.code, departmentId: c.departmentId?._id || c.departmentId, id: c._id });
                              setIsEditing(true);
                            }}
                            className="p-1 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(c._id)}
                            className="p-1 hover:bg-slate-750 rounded-md text-rose-400 hover:text-rose-350"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {activeTab === 'specializations' && specializations.map(s => (
                      <tr key={s._id}>
                        <td className="py-3.5 px-4 font-semibold text-white">{s.name}</td>
                        <td className="py-3.5 px-4">{s.courseId?.name || 'N/A'}</td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleSpec(s._id, s.isActive)}
                            className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                              s.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-rose-950 text-rose-400 border border-rose-900'
                            }`}
                          >
                            {s.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSpecForm({ name: s.name, courseId: s.courseId?._id || s.courseId, id: s._id });
                              setIsEditing(true);
                            }}
                            className="p-1 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSpec(s._id)}
                            className="p-1 hover:bg-slate-750 rounded-md text-rose-400 hover:text-rose-350"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Academic Master Request Details Modal (Redesigned) ── */}
      {selectedReq && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all ${isViewModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsViewModalOpen(false)}
          />

          {/* Modal Panel */}
          <div className="relative bg-slate-900 border border-slate-700 rounded-[20px] shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto flex flex-col">

            {/* ── Header ── */}
            <div className="flex items-start justify-between px-8 py-6 border-b border-slate-800 shrink-0">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="h-11 w-11 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <GraduationCap className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Academic Master Request</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <span className="text-xs text-slate-400">
                      Submitted by{' '}
                      <span className="text-slate-200 font-semibold">{selectedReq.collegeId?.name || 'Unknown College'}</span>
                    </span>
                    {selectedReq.createdAt && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-slate-600 inline-block" />
                        <span className="text-xs text-slate-400">
                          {new Date(selectedReq.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </>
                    )}
                    <span className="h-1 w-1 rounded-full bg-slate-600 inline-block" />
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      selectedReq.status === 'Pending'  ? 'bg-amber-500/15  text-amber-400  border border-amber-500/30' :
                      selectedReq.status === 'Approved' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        selectedReq.status === 'Pending'  ? 'bg-amber-400' :
                        selectedReq.status === 'Approved' ? 'bg-emerald-400' : 'bg-rose-400'
                      }`} />
                      {selectedReq.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* ── Body ── */}
            <div className="px-8 py-6 space-y-5 flex-1">

              {/* Section 1: Request Type */}
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Request Classification</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-600/20 border border-indigo-500/25 flex items-center justify-center">
                    {selectedReq.requestType === 'Department' ? <Layers className="h-4 w-4 text-indigo-400" /> :
                     selectedReq.requestType === 'Course'     ? <BookOpen className="h-4 w-4 text-indigo-400" /> :
                                                                <GraduationCap className="h-4 w-4 text-indigo-400" />}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Requested Type</p>
                    <p className="text-sm font-bold text-white mt-0.5">{selectedReq.requestType}</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Academic Hierarchy */}
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Academic Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Department */}
                  <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/40">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Department</p>
                    <p className="text-xs font-semibold text-slate-200">
                      {selectedReq.requestType === 'Department'
                        ? selectedReq.departmentName
                        : selectedReq.departmentId?.name || selectedReq.departmentName || '—'}
                    </p>
                  </div>

                  {/* Course */}
                  {(selectedReq.requestType === 'Course' || selectedReq.requestType === 'Specialization') && (
                    <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/40">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Course</p>
                      <p className="text-xs font-semibold text-slate-200">
                        {selectedReq.requestType === 'Course'
                          ? `${selectedReq.courseName || '—'} ${selectedReq.courseCode ? `(${selectedReq.courseCode})` : ''}`
                          : selectedReq.courseId?.name || selectedReq.courseName || '—'}
                      </p>
                    </div>
                  )}

                  {/* Specialization */}
                  {selectedReq.requestType === 'Specialization' && (
                    <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/40">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Specialization</p>
                      <p className="text-xs font-semibold text-slate-200">{selectedReq.specializationName || '—'}</p>
                    </div>
                  )}

                  {/* Duration (Course) */}
                  {selectedReq.requestType === 'Course' && selectedReq.duration && (
                    <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/40">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Duration</p>
                      <p className="text-xs font-semibold text-slate-200">{selectedReq.duration}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Reason */}
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Reason for Request</p>
                <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/40">
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedReq.reason || '—'}</p>
                </div>
              </div>

              {/* Section 4: Rejection remarks (only visible if rejected) */}
              {selectedReq.status === 'Rejected' && selectedReq.adminRemarks && (
                <div className="bg-rose-950/40 border border-rose-800/40 rounded-2xl p-5">
                  <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-3">Admin Rejection Remarks</p>
                  <p className="text-xs text-rose-300 leading-relaxed">{selectedReq.adminRemarks}</p>
                </div>
              )}

              {/* Section 5: Admin Remarks (inline Reject flow) */}
              {selectedReq.status === 'Pending' && isRejectModalOpen && (
                <div className="bg-rose-950/30 border border-rose-700/40 rounded-2xl p-5 space-y-3">
                  <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Admin Rejection Remarks</p>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    rows={4}
                    placeholder="Provide the reason for rejecting this request…"
                    className="w-full bg-slate-900/80 border border-rose-700/40 text-slate-200 placeholder-slate-500 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/40 resize-none"
                  />
                </div>
              )}

              {/* Section 5 alt: Admin Remarks textarea for Pending (non-reject mode) */}
              {selectedReq.status === 'Pending' && !isRejectModalOpen && (
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 space-y-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Admin Remarks</p>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    rows={3}
                    placeholder="Optional remarks for approval / reason for rejection…"
                    className="w-full bg-slate-900/80 border border-slate-700/50 text-slate-200 placeholder-slate-500 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                  />
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="px-8 py-5 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
              {/* Close */}
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setIsRejectModalOpen(false);
                  setRejectReason('');
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-all min-w-[100px] text-center"
              >
                Close
              </button>

              {selectedReq.status === 'Pending' && (
                <>
                  {/* Reject button — if not yet in reject mode, enter it; otherwise confirm */}
                  {isRejectModalOpen ? (
                    <>
                      <button
                        onClick={() => { setIsRejectModalOpen(false); setRejectReason(''); }}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all min-w-[120px]"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={handleRejectRequest}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 border border-rose-500 transition-all min-w-[140px] disabled:opacity-50"
                      >
                        {actionLoading ? 'Rejecting…' : 'Confirm Reject'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsRejectModalOpen(true)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600/80 hover:bg-rose-600 border border-rose-600/50 transition-all min-w-[140px]"
                    >
                      Reject Request
                    </button>
                  )}

                  {/* Approve */}
                  {!isRejectModalOpen && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleApproveRequest(selectedReq._id)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50 transition-all min-w-[140px] disabled:opacity-50 shadow-lg shadow-indigo-900/30"
                    >
                      {actionLoading ? 'Approving…' : 'Approve Request'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicMasters;
