import React, { useState, useEffect } from 'react';
import { useAuth } from '../../school/contexts/AuthContext';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Loader from '../../../shared/components/Loader';
import Modal from '../../../shared/components/Modal';
import toast from 'react-hot-toast';
import api from '../../school/services/schoolApi';
import { Settings, Layers, BookOpen, GraduationCap, Sparkles, Send } from 'lucide-react';

const SettingsPage = () => {
  const { school, updateSchoolState } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [fetchingMasters, setFetchingMasters] = useState(false);

  // Profile Form States
  const [name, setName] = useState(school?.name || '');
  const [phone, setPhone] = useState(school?.phone || '');
  const [address, setAddress] = useState(school?.address || '');

  // Academic Configuration States
  const [allDepts, setAllDepts] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [allSpecs, setAllSpecs] = useState([]);

  const [selectedDepts, setSelectedDepts] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectedSpecs, setSelectedSpecs] = useState([]);

  // Requests States
  const [requestsList, setRequestsList] = useState([]);
  const [fetchingRequests, setFetchingRequests] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestType, setRequestType] = useState('Department');

  // Request form parameters
  const [reqDeptName, setReqDeptName] = useState('');
  const [reqDeptDesc, setReqDeptDesc] = useState('');
  const [reqDeptId, setReqDeptId] = useState('');
  const [reqCourseName, setReqCourseName] = useState('');
  const [reqCourseCode, setReqCourseCode] = useState('');
  const [reqDuration, setReqDuration] = useState('');
  const [reqCourseId, setReqCourseId] = useState('');
  const [reqSpecName, setReqSpecName] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'academic-config') {
      fetchAcademicConfig();
    } else if (activeTab === 'requests') {
      fetchRequests();
    }
  }, [activeTab]);

  const fetchAcademicConfig = async () => {
    setFetchingMasters(true);
    try {
      const [mastersRes, configRes] = await Promise.all([
        api.get('/college/academic/all-masters'),
        api.get('/college/academic/config')
      ]);

      if (mastersRes.success) {
        setAllDepts(mastersRes.data.departments || []);
        setAllCourses(mastersRes.data.courses || []);
        setAllSpecs(mastersRes.data.specializations || []);
      }

      if (configRes.success && configRes.data) {
        const config = configRes.data;
        setSelectedDepts(config.selectedDepartments?.map(d => d._id || d) || []);
        setSelectedCourses(config.selectedCourses?.map(c => c._id || c) || []);
        setSelectedSpecs(config.selectedSpecializations?.map(s => s._id || s) || []);
      }
    } catch (error) {
      toast.error('Failed to load academic configuration data');
    } finally {
      setFetchingMasters(false);
    }
  };

  const fetchRequests = async () => {
    setFetchingRequests(true);
    try {
      const res = await api.get('/college/academic/requests');
      if (res.success) {
        setRequestsList(res.data || []);
      }
    } catch (error) {
      toast.error('Failed to load requests list');
    } finally {
      setFetchingRequests(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/settings', { name, phone, address });
      if (res.success) {
        toast.success('College profile settings saved!');
        if (updateSchoolState) updateSchoolState(res.data);
      }
    } catch (error) {
      toast.error('Failed to save settings details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        selectedDepartments: selectedDepts,
        selectedCourses: selectedCourses,
        selectedSpecializations: selectedSpecs
      };

      const res = await api.post('/college/academic/config', payload);
      if (res.success) {
        toast.success('Academic configuration saved successfully!');
      }
    } catch (error) {
      toast.error('Failed to save academic config');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!reqReason) {
      toast.error('Please specify the reason for request');
      return;
    }

    setRequestLoading(true);
    try {
      const payload = {
        requestType,
        reason: reqReason,
        departmentId: reqDeptId || undefined,
        courseId: reqCourseId || undefined,
        departmentName: reqDeptName || undefined,
        courseName: reqCourseName || undefined,
        courseCode: reqCourseCode || undefined,
        specializationName: reqSpecName || undefined,
        duration: reqDuration || undefined
      };

      const res = await api.post('/college/academic/requests', payload);
      if (res.success) {
        toast.success('Academic request submitted to Super Admin!');
        setIsRequestModalOpen(false);
        resetRequestForm();
        if (activeTab === 'requests') {
          fetchRequests();
        } else {
          setActiveTab('requests');
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setRequestLoading(false);
    }
  };

  const resetRequestForm = () => {
    setReqDeptName('');
    setReqDeptDesc('');
    setReqDeptId('');
    setReqCourseName('');
    setReqCourseCode('');
    setReqDuration('');
    setReqCourseId('');
    setReqSpecName('');
    setReqReason('');
  };

  // Helper toggle handlers
  const toggleDept = (id) => {
    setSelectedDepts(prev => {
      if (prev.includes(id)) {
        // Remove dept and also any selected courses & specs belonging to it
        const newDepts = prev.filter(d => d !== id);
        const relatedCourses = allCourses.filter(c => c.departmentId?._id === id || c.departmentId === id).map(c => c._id);
        setSelectedCourses(cPrev => cPrev.filter(cId => !relatedCourses.includes(cId)));
        
        // Also clean specs related to those courses
        setSelectedSpecs(sPrev => sPrev.filter(sId => {
          const specObj = allSpecs.find(s => s._id === sId);
          const courseObj = specObj ? allCourses.find(c => c._id === (specObj.courseId?._id || specObj.courseId)) : null;
          return courseObj ? (courseObj.departmentId?._id !== id && courseObj.departmentId !== id) : true;
        }));

        return newDepts;
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleCourse = (id) => {
    setSelectedCourses(prev => {
      if (prev.includes(id)) {
        const newCourses = prev.filter(c => c !== id);
        // Also remove selected specs belonging to this course
        setSelectedSpecs(sPrev => sPrev.filter(sId => {
          const specObj = allSpecs.find(s => s._id === sId);
          return specObj ? (specObj.courseId?._id !== id && specObj.courseId !== id) : true;
        }));
        return newCourses;
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleSpec = (id) => {
    setSelectedSpecs(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  // Filter lists based on configuration selections
  const visibleCourses = allCourses.filter(c => {
    const deptId = c.departmentId?._id || c.departmentId;
    return selectedDepts.includes(deptId);
  });

  const visibleSpecs = allSpecs.filter(s => {
    const courseId = s.courseId?._id || s.courseId;
    return selectedCourses.includes(courseId);
  });

  // Filter courses for requests dropdown based on departmentId
  const requestAvailableCourses = allCourses.filter(c => {
    const deptId = c.departmentId?._id || c.departmentId;
    return deptId === reqDeptId;
  });

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto relative">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">College Settings</h2>
          <p className="text-slate-500 text-xs mt-0.5">Manage credentials, profile details, and dynamic SaaS academic master configurations.</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1.5 shrink-0 self-start sm:self-center">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'profile'
                ? 'bg-white text-indigo-650 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            University Profile
          </button>
          <button
            onClick={() => setActiveTab('academic-config')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'academic-config'
                ? 'bg-white text-indigo-650 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Academic Configuration
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'requests'
                ? 'bg-white text-indigo-650 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            My Requests
          </button>
        </div>
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b pb-1">University Profile Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="College/University Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <Input
              label="Contact Helpline Number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
            <div className="md:col-span-2">
              <Input
                label="Permanent Campus Address"
                value={address}
                onChange={e => setAddress(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" isLoading={loading} className="py-3 px-6 text-xs font-semibold inline-flex items-center">
              <Settings className="h-4.5 w-4.5 mr-1.5" /> Save Profile Details
            </Button>
          </div>
        </form>
      )}

      {activeTab === 'academic-config' && (
        <form onSubmit={handleConfigSubmit} className="space-y-6">
          {fetchingMasters ? (
            <Loader message="Loading Super Admin Master catalogs..." />
          ) : (
            <>
              {/* Request New Course Action Button bar */}
              <div className="flex justify-between items-center bg-indigo-50/40 border border-indigo-100/70 p-4 rounded-2xl">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-indigo-950">Missing a course or specialization?</h4>
                  <p className="text-[10px] text-indigo-600">Submit a master request to the Super Admin for approvals.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetRequestForm();
                    setIsRequestModalOpen(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Request New Course
                </button>
              </div>

              {/* Step 1: Select Departments */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-slate-500" /> Step 1: Enable Departments
                  </h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">Toggle checkboxes to make departments available for admissions configuration.</p>
                </div>
                
                {allDepts.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No global departments configured by Super Admin yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-2">
                    {allDepts.map(dept => {
                      const isChecked = selectedDepts.includes(dept._id);
                      return (
                        <label
                          key={dept._id}
                          className={`flex items-center space-x-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 font-bold'
                              : 'bg-slate-50/50 border-slate-150 text-slate-650 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleDept(dept._id)}
                            className="h-4 w-4 text-indigo-600 border-slate-350 focus:ring-indigo-500 rounded"
                          />
                          <span className="text-xs truncate">{dept.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 2: Select Courses */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-slate-500" /> Step 2: Enable Courses
                  </h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">Only courses belonging to selected departments are visible.</p>
                </div>

                {selectedDepts.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">Please select at least one department above to load courses.</p>
                ) : visibleCourses.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No courses exist under selected departments.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-2">
                    {visibleCourses.map(course => {
                      const isChecked = selectedCourses.includes(course._id);
                      return (
                        <label
                          key={course._id}
                          className={`flex items-center space-x-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 font-bold'
                              : 'bg-slate-50/50 border-slate-150 text-slate-650 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCourse(course._id)}
                            className="h-4 w-4 text-indigo-600 border-slate-350 focus:ring-indigo-500 rounded"
                          />
                          <span className="text-xs truncate">{course.name} ({course.code})</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 3: Select Specializations */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-slate-500" /> Step 3: Enable Specializations
                  </h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">Only specializations belonging to selected courses are visible.</p>
                </div>

                {selectedCourses.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">Please select at least one course above to load specializations.</p>
                ) : visibleSpecs.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No specializations exist under selected courses.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-2">
                    {visibleSpecs.map(spec => {
                      const isChecked = selectedSpecs.includes(spec._id);
                      return (
                        <label
                          key={spec._id}
                          className={`flex items-center space-x-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 font-bold'
                              : 'bg-slate-50/50 border-slate-150 text-slate-650 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSpec(spec._id)}
                            className="h-4 w-4 text-indigo-600 border-slate-350 focus:ring-indigo-500 rounded"
                          />
                          <span className="text-xs truncate">{spec.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex justify-end pt-2">
                <Button type="submit" isLoading={loading} className="py-3 px-6 text-xs font-semibold inline-flex items-center">
                  <Sparkles className="h-4.5 w-4.5 mr-1.5" /> Save Academic Configuration
                </Button>
              </div>
            </>
          )}
        </form>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-800">My Requests History</h3>
              <p className="text-slate-400 text-[10px]">Track approvals and remarks for master record submissions.</p>
            </div>
            <button
              onClick={() => {
                resetRequestForm();
                setIsRequestModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              Request New Course
            </button>
          </div>

          {fetchingRequests ? (
            <Loader message="Loading academic request submissions..." />
          ) : requestsList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                <Send className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">No Requests Submitted</h3>
                <p className="text-slate-550 text-xs">When you request new departments or courses, they will list here.</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase text-slate-400">
                      <th className="py-3 px-4">Request Type</th>
                      <th className="py-3 px-4">Requested Item</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Submitted Date</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-650">
                    {requestsList.map(req => {
                      const itemDisplay = req.requestType === 'Department' ? req.departmentName :
                                          req.requestType === 'Course' ? `${req.courseName} (${req.courseCode || 'No Code'})` :
                                          `${req.specializationName} (${req.courseId?.name || 'N/A'})`;
                      
                      const statusColor = req.status === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                          req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                          'bg-rose-50 text-rose-600 border border-rose-200';

                      return (
                        <tr key={req._id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-4 px-4 font-bold text-slate-850">{req.requestType}</td>
                          <td className="py-4 px-4 font-semibold text-slate-700">{itemDisplay}</td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide ${statusColor}`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-500">
                            {new Date(req.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-4 px-4 text-slate-550 max-w-xs truncate" title={req.adminRemarks || 'N/A'}>
                            {req.adminRemarks || <span className="text-slate-400 italic">No remarks</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Request Academic Master Modal */}
      <Modal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)}>
        <form onSubmit={handleRequestSubmit} className="space-y-4 text-left p-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Request Academic Master</h3>
            <p className="text-slate-550 text-[10px] mt-0.5">Submit request to the Super Admin to add new master entities.</p>
          </div>

          <div className="space-y-3 pt-2">
            {/* Request Type dropdown */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Request Type *</label>
              <select
                value={requestType}
                onChange={e => {
                  setRequestType(e.target.value);
                  resetRequestForm();
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
              >
                <option value="Department">Department</option>
                <option value="Course">Course</option>
                <option value="Specialization">Specialization</option>
              </select>
            </div>

            {/* Department Fields */}
            {requestType === 'Department' && (
              <>
                <Input
                  label="Department Name *"
                  value={reqDeptName}
                  onChange={e => setReqDeptName(e.target.value)}
                  placeholder="e.g. Pharmacy"
                  required
                />
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Department Description (optional)</label>
                  <textarea
                    value={reqDeptDesc}
                    onChange={e => setReqDeptDesc(e.target.value)}
                    placeholder="Provide brief department description details..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none h-16"
                  />
                </div>
              </>
            )}

            {/* Course Fields */}
            {requestType === 'Course' && (
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Existing Department *</label>
                  <select
                    value={reqDeptId}
                    onChange={e => setReqDeptId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
                    required
                  >
                    <option value="">-- Select Department --</option>
                    {allDepts.map(d => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Course Name *"
                  value={reqCourseName}
                  onChange={e => setReqCourseName(e.target.value)}
                  placeholder="e.g. Bachelor of Pharmacy"
                  required
                />
                <Input
                  label="Course Code (optional)"
                  value={reqCourseCode}
                  onChange={e => setReqCourseCode(e.target.value.toUpperCase())}
                  placeholder="e.g. BPHARM"
                />
                <Input
                  label="Duration (optional)"
                  value={reqDuration}
                  onChange={e => setReqDuration(e.target.value)}
                  placeholder="e.g. 4 Years"
                />
              </>
            )}

            {/* Specialization Fields */}
            {requestType === 'Specialization' && (
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Department *</label>
                  <select
                    value={reqDeptId}
                    onChange={e => {
                      setReqDeptId(e.target.value);
                      setReqCourseId('');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
                    required
                  >
                    <option value="">-- Select Department --</option>
                    {allDepts.map(d => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Course *</label>
                  <select
                    value={reqCourseId}
                    onChange={e => setReqCourseId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
                    required
                    disabled={!reqDeptId}
                  >
                    <option value="">-- Select Course --</option>
                    {requestAvailableCourses.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Specialization Name *"
                  value={reqSpecName}
                  onChange={e => setReqSpecName(e.target.value)}
                  placeholder="e.g. Pharmacology"
                  required
                />
              </>
            )}

            {/* Reason */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Reason for Request *</label>
              <textarea
                value={reqReason}
                onChange={e => setReqReason(e.target.value)}
                placeholder="Why is this master record needed for your college?"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none h-20"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t mt-4">
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all"
            >
              Cancel
            </button>
            <Button
              type="submit"
              isLoading={requestLoading}
              className="px-4 py-2 text-xs font-bold"
            >
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SettingsPage;
