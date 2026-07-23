import React, { useState, useEffect } from 'react';
import superAdminApi from '../services/superAdminApi';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Loader from '../../../shared/components/Loader';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, ShieldAlert, Check, X, Layers, BookOpen, GraduationCap, Calendar } from 'lucide-react';

const AcademicMasters = () => {
  const [activeTab, setActiveTab] = useState('departments');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Form states
  const [deptForm, setDeptForm] = useState({ name: '', code: '', id: null });
  const [courseForm, setCourseForm] = useState({ name: '', code: '', departmentId: '', id: null });
  const [specForm, setSpecForm] = useState({ name: '', courseId: '', id: null });
  const [sessionForm, setSessionForm] = useState({ name: '', id: null });

  // Modals / Editing state
  const [isEditing, setIsEditing] = useState(false);

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
      } else if (activeTab === 'sessions') {
        const res = await superAdminApi.get('/academic/sessions');
        setSessions(res.data.data);
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

  // Session handlers
  const handleSaveSession = async (e) => {
    e.preventDefault();
    if (!sessionForm.name) return;
    try {
      if (sessionForm.id) {
        await superAdminApi.put(`/academic/sessions/${sessionForm.id}`, { name: sessionForm.name });
        toast.success('Session updated');
      } else {
        await superAdminApi.post('/academic/sessions', { name: sessionForm.name });
        toast.success('Session created');
      }
      setSessionForm({ name: '', id: null });
      setIsEditing(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save session');
    }
  };

  const handleToggleSession = async (id, currentStatus) => {
    try {
      await superAdminApi.put(`/academic/sessions/${id}`, { isActive: !currentStatus });
      toast.success('Status updated');
      fetchData();
    } catch (err) {
      toast.error('Failed to toggle status');
    }
  };

  const handleDeleteSession = async (id) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    try {
      await superAdminApi.delete(`/academic/sessions/${id}`);
      toast.success('Session deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete session');
    }
  };

  return (
    <div className="space-y-6 text-left text-slate-100 max-w-6xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">Academic Masters Configuration</h2>
        <p className="text-slate-400 text-xs mt-1">Super Admin dashboard to configure global departments, courses, specializations, and sessions available to all colleges.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 bg-slate-800 p-1 rounded-xl gap-2 max-w-lg">
        {[
          { key: 'departments', label: 'Departments', icon: Layers },
          { key: 'courses', label: 'Courses', icon: BookOpen },
          { key: 'specializations', label: 'Specializations', icon: GraduationCap },
          { key: 'sessions', label: 'Sessions', icon: Calendar }
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

      {/* Content wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
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
                  className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
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
                  className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
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
                  className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
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
                  className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
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
                  className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
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
                  className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
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

          {activeTab === 'sessions' && (
            <form onSubmit={handleSaveSession} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">Session Name</label>
                <input
                  type="text"
                  value={sessionForm.name}
                  onChange={e => setSessionForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. 2026-27"
                  className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 py-2 text-xs font-bold">
                  {sessionForm.id ? 'Update Session' : 'Create Session'}
                </Button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setSessionForm({ name: '', id: null });
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
                    {activeTab !== 'sessions' && activeTab !== 'specializations' && (
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

                  {activeTab === 'sessions' && sessions.map(s => (
                    <tr key={s._id}>
                      <td className="py-3.5 px-4 font-semibold text-white">{s.name}</td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleSession(s._id, s.isActive)}
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
                            setSessionForm({ name: s.name, id: s._id });
                            setIsEditing(true);
                          }}
                          className="p-1 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSession(s._id)}
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
    </div>
  );
};

export default AcademicMasters;
