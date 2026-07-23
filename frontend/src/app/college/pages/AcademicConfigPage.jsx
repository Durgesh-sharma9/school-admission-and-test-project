import React, { useState, useEffect } from 'react';
import api from '../../school/services/schoolApi';
import Loader from '../../../shared/components/Loader';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Modal from '../../../shared/components/Modal';
import toast from 'react-hot-toast';
import { 
  Layers, 
  BookOpen, 
  GraduationCap, 
  Search, 
  Plus, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp,
  Info 
} from 'lucide-react';

const AcademicConfigPage = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Masters Data
  const [allDepts, setAllDepts] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [allSpecs, setAllSpecs] = useState([]);

  // Configured Data
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectedSpecs, setSelectedSpecs] = useState([]);

  // Expand / Collapse State
  const [expandedDepts, setExpandedDepts] = useState({});

  // Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestType, setRequestType] = useState('Department');
  const [reqDeptName, setReqDeptName] = useState('');
  const [reqDeptDesc, setReqDeptDesc] = useState('');
  const [reqDeptId, setReqDeptId] = useState('');
  const [reqCourseName, setReqCourseName] = useState('');
  const [reqCourseCode, setReqCourseCode] = useState('');
  const [reqDuration, setReqDuration] = useState('');
  const [reqCourseId, setReqCourseId] = useState('');
  const [reqSpecName, setReqSpecName] = useState('');
  const [reqReason, setReqReason] = useState('');

  const fetchCatalogData = async () => {
    try {
      setLoading(true);
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
        setSelectedDepts(config.selectedDepartments || []);
        setSelectedCourses(config.selectedCourses || []);
        setSelectedSpecs(config.selectedSpecializations || []);

        // Expand first department by default if available
        if (config.selectedDepartments?.length > 0) {
          setExpandedDepts({ [config.selectedDepartments[0]._id]: true });
        }
      }
    } catch (error) {
      toast.error('Failed to load academic catalog details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogData();
  }, []);

  const toggleDeptExpand = (deptId) => {
    setExpandedDepts(prev => ({
      ...prev,
      [deptId]: !prev[deptId]
    }));
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!reqReason.trim()) {
      toast.error('Please specify the reason for the request');
      return;
    }

    setSubmitting(true);
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
        toast.success('Academic master request submitted successfully!');
        setIsRequestModalOpen(false);
        resetRequestForm();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
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

  // Filter Logic
  const filteredDepartments = selectedDepts.filter(dept => {
    const deptMatches = dept.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        dept.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check if any courses nested under this department match
    const nestedCourses = selectedCourses.filter(c => {
      const parentDeptId = c.departmentId?._id || c.departmentId;
      return parentDeptId === dept._id;
    });

    const courseMatches = nestedCourses.some(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Check if any specializations nested under those courses match
    const specMatches = selectedSpecs.some(spec => {
      const courseObj = selectedCourses.find(c => c._id === (spec.courseId?._id || spec.courseId));
      if (!courseObj) return false;
      const parentDeptId = courseObj.departmentId?._id || courseObj.departmentId;
      if (parentDeptId !== dept._id) return false;
      return spec.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return deptMatches || courseMatches || specMatches;
  });

  const requestAvailableCourses = allCourses.filter(c => {
    const deptId = c.departmentId?._id || c.departmentId;
    return deptId === reqDeptId;
  });

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto relative pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Academic Configuration</h2>
          <p className="text-slate-500 text-xs mt-0.5">Catalogue profile of enabled departments, courses and specializations.</p>
        </div>
        <button
          onClick={() => {
            resetRequestForm();
            setIsRequestModalOpen(true);
          }}
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs gap-1.5 self-start"
        >
          <Plus className="h-4 w-4" /> Request New Program
        </button>
      </div>

      {/* Information SaaS Compliance Notice Banner */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-800 flex items-start space-x-3 leading-normal">
        <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>SaaS Compliance Policy:</strong> This catalogue is managed globally by the Super Admin. Your college can configure and enable programs in the settings profile or request new departments/courses below.
        </div>
      </div>

      {/* Search Input bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs">
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search departments, courses, or specializations..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <Loader message="Synthesizing academic programs registry..." />
      ) : filteredDepartments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">No Programs Found</h3>
            <p className="text-slate-500 text-xs mt-0.5">Adapt your search terms or submit requests to the Super Admin.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDepartments.map(dept => {
            const nestedCourses = selectedCourses.filter(c => {
              const parentDeptId = c.departmentId?._id || c.departmentId;
              return parentDeptId === dept._id;
            });
            const isExpanded = !!expandedDepts[dept._id];

            return (
              <div 
                key={dept._id} 
                className="bg-white border border-slate-100 rounded-2xl shadow-2xs overflow-hidden transition-all duration-200"
              >
                {/* Department Header row */}
                <div 
                  onClick={() => toggleDeptExpand(dept._id)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors select-none"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-indigo-50 text-indigo-650 rounded-xl flex items-center justify-center border border-indigo-100 shrink-0">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm">{dept.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Code: {dept.code} | {nestedCourses.length} Courses Offered</p>
                    </div>
                  </div>
                  <button className="text-slate-400 p-1 hover:bg-slate-100 rounded-lg">
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                </div>

                {/* Expanded Course Listing Card */}
                {isExpanded && (
                  <div className="border-t border-slate-50 bg-slate-50/20 p-5 space-y-4">
                    {nestedCourses.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No courses enabled for this department.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {nestedCourses.map(course => {
                          const nestedSpecs = selectedSpecs.filter(spec => {
                            const parentCourseId = spec.courseId?._id || spec.courseId;
                            return parentCourseId === course._id;
                          });

                          return (
                            <div 
                              key={course._id}
                              className="bg-white border border-slate-100 rounded-xl p-4 shadow-3xs flex flex-col justify-between"
                            >
                              <div className="space-y-1">
                                <h4 className="font-extrabold text-slate-850 text-xs flex items-center gap-1.5">
                                  <BookOpen className="h-3.5 w-3.5 text-indigo-550 shrink-0" />
                                  <span>{course.name}</span>
                                </h4>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Code: {course.code}</p>
                              </div>

                              <div className="mt-4 pt-3 border-t border-slate-50">
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase block tracking-wider mb-2">Available Specializations</span>
                                {nestedSpecs.length === 0 ? (
                                  <span className="text-[10px] text-slate-400 italic block">No specializations configured</span>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                    {nestedSpecs.map(spec => (
                                      <span 
                                        key={spec._id}
                                        className="inline-flex items-center px-2.5 py-1 bg-slate-50 border border-slate-150 rounded-lg text-[10px] font-semibold text-slate-650"
                                      >
                                        <GraduationCap className="h-3 w-3 mr-1 text-slate-400 shrink-0" />
                                        {spec.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Request Academic Master Modal */}
      <Modal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)}>
        <form onSubmit={handleRequestSubmit} className="space-y-4 text-left p-2 text-slate-850">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Request Academic Program</h3>
            <p className="text-slate-550 text-[10px] mt-0.5">Submit details to the Super Admin to add new master programs.</p>
          </div>

          <div className="space-y-3 pt-2">
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

            {requestType === 'Department' && (
              <>
                <Input
                  label="Department Name *"
                  value={reqDeptName}
                  onChange={e => setReqDeptName(e.target.value)}
                  placeholder="e.g. Hotel Management"
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
              isLoading={submitting}
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

export default AcademicConfigPage;
