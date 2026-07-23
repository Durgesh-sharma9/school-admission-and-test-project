import React, { useState, useEffect } from 'react';
import { useAuth } from '../../school/contexts/AuthContext';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Loader from '../../../shared/components/Loader';
import toast from 'react-hot-toast';
import api from '../../school/services/schoolApi';
import { Settings, Layers, BookOpen, GraduationCap, Calendar, Sparkles } from 'lucide-react';

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
  const [allSessions, setAllSessions] = useState([]);

  const [selectedDepts, setSelectedDepts] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectedSpecs, setSelectedSpecs] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState([]);

  useEffect(() => {
    if (activeTab === 'academic-config') {
      fetchAcademicConfig();
    }
  }, [activeTab]);

  const fetchAcademicConfig = async () => {
    setFetchingMasters(true);
    try {
      // 1. Fetch all active masters from Super Admin list
      // 2. Fetch current College Academic Configuration
      const [mastersRes, configRes] = await Promise.all([
        api.get('/college/academic/all-masters'),
        api.get('/college/academic/config')
      ]);

      if (mastersRes.success) {
        setAllDepts(mastersRes.data.departments || []);
        setAllCourses(mastersRes.data.courses || []);
        setAllSpecs(mastersRes.data.specializations || []);
        setAllSessions(mastersRes.data.sessions || []);
      }

      if (configRes.success && configRes.data) {
        const config = configRes.data;
        setSelectedDepts(config.selectedDepartments?.map(d => d._id || d) || []);
        setSelectedCourses(config.selectedCourses?.map(c => c._id || c) || []);
        setSelectedSpecs(config.selectedSpecializations?.map(s => s._id || s) || []);
        setSelectedSessions(config.selectedSessions?.map(s => s._id || s) || []);
      }
    } catch (error) {
      toast.error('Failed to load academic configuration data');
    } finally {
      setFetchingMasters(false);
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
        selectedSpecializations: selectedSpecs,
        selectedSessions: selectedSessions
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

  const toggleSession = (id) => {
    setSelectedSessions(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
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

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
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
        </div>
      </div>

      {activeTab === 'profile' ? (
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
      ) : (
        <form onSubmit={handleConfigSubmit} className="space-y-6">
          {fetchingMasters ? (
            <Loader message="Loading Super Admin Master catalogs..." />
          ) : (
            <>
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

              {/* Session Selector */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-500" /> Admission Sessions Config
                  </h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">Select active session years for admissions processing.</p>
                </div>

                {allSessions.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No admission sessions configured by Super Admin.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-2">
                    {allSessions.map(sess => {
                      const isChecked = selectedSessions.includes(sess._id);
                      return (
                        <label
                          key={sess._id}
                          className={`flex items-center space-x-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 font-bold'
                              : 'bg-slate-50/50 border-slate-150 text-slate-650 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSession(sess._id)}
                            className="h-4 w-4 text-indigo-650 border-slate-350 focus:ring-indigo-500 rounded"
                          />
                          <span className="text-xs truncate">{sess.name}</span>
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
    </div>
  );
};

export default SettingsPage;
