import React, { useState, useEffect } from 'react';
import api from '../../school/services/schoolApi';
import Loader from '../../../shared/components/Loader';
import { BookOpen, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get('/college/academic/config');
      if (res.success && res.data) {
        setCourses(res.data.selectedCourses || []);
      }
    } catch (error) {
      toast.error('Failed to load active courses list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Offered Degree Courses</h2>
          <p className="text-slate-500 text-xs mt-0.5">Read-only list of academic degrees and course tracks offered at your college.</p>
        </div>
        <Link
          to="/college/settings"
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs gap-1.5 transition-all self-start"
        >
          <Settings className="h-4 w-4" /> Academic Configuration
        </Link>
      </div>

      {/* Info Warning Alert */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 leading-normal">
        <strong>SaaS Compliance Notice:</strong> You cannot create or modify courses manually. Academic courses are managed globally by the Super Admin. You can enable or disable master courses in your <Link to="/college/settings" className="underline font-bold">Academic Configuration settings</Link>.
      </div>

      {loading ? (
        <Loader message="Loading degree courses..." />
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">No Active Courses</h3>
            <p className="text-slate-500 text-xs mt-0.5">Please go to Settings to enable degree courses for your college.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase text-slate-400">
                <th className="py-3 px-4">Course Name</th>
                <th className="py-3 px-4">Course Code</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-650">
              {courses.map((course) => (
                <tr key={course._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 font-bold text-slate-800">{course.name}</td>
                  <td className="py-4 px-4 font-semibold text-slate-550">{course.code}</td>
                  <td className="py-4 px-4 text-slate-550 font-semibold">{course.departmentId?.name || 'N/A'}</td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[9px] uppercase tracking-wide">
                      Active Offered
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Courses;
