import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import {
  FilePlus,
  Search,
  Filter,
  Copy,
  Trash2,
  Edit,
  Clock,
  BookOpen,
  FileQuestion,
  GraduationCap
} from 'lucide-react';
import { motion } from 'framer-motion';

const AssessmentList = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/assessments', {
        params: {
          search,
          classFilter,
        },
      });
      if (response.success) {
        setAssessments(response.data);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [search, classFilter]);

  // Duplicate assessment template
  const handleDuplicate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to duplicate "${name}"?`)) return;
    try {
      const response = await api.post(`/assessments/${id}/duplicate`);
      if (response.success) {
        toast.success('Assessment template duplicated successfully!');
        fetchAssessments(); // Reload
      }
    } catch (error) {
      toast.error(error.message || 'Failed to duplicate assessment');
    }
  };

  // Delete assessment template
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    try {
      const response = await api.delete(`/assessments/${id}`);
      if (response.success) {
        toast.success('Assessment template deleted successfully!');
        setAssessments(assessments.filter(item => item._id !== id));
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete assessment');
    }
  };

  // CSV blueprint report export trigger
  const handleExportCSV = () => {
    if (assessments.length === 0) {
      toast.error('No assessment templates found to export.');
      return;
    }

    const headers = ['Assessment Name', 'Class', 'Duration (Minutes)', 'Total Sections', 'Total Questions', 'Total Marks', 'Created Date'];
    const csvRows = [headers.join(',')];

    assessments.forEach(item => {
      const sectionsCount = item.sections ? item.sections.length : 0;
      const row = [
        `"${item.name || ''}"`,
        `"${item.class || ''}"`,
        item.duration,
        sectionsCount,
        item.totalQuestions,
        item.totalMarks,
        `"${new Date(item.createdAt).toLocaleDateString()}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Assessment_Blueprints_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Assessment report downloaded successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-left">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Assessment Templates</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Configure questions, dynamic sections, and durations to generate reusable exam assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="text-xs py-2.5 px-4 bg-white text-slate-700 border-slate-200 font-semibold"
            onClick={handleExportCSV}
          >
            Export CSV / Excel
          </Button>
          <Link
            to="/assessments/new"
            className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
          >
            <FilePlus className="h-4.5 w-4.5 mr-2" />
            Create Assessment
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search by assessment name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Filter className="h-4 w-4" />
            Class:
          </div>
          <input
            type="text"
            placeholder="e.g. Grade 5"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold text-slate-700 px-3 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Main content grid */}
      {loading ? (
        <Loader message="Loading assessments..." />
      ) : assessments.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-white border border-slate-100 rounded-2xl">
          <FileQuestion className="h-10 w-10 mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-500">No Assessment Templates</p>
          <p className="text-xs text-slate-400 mt-1">
            Build your first assessment questionnaire by clicking the button above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map((asm, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
              key={asm._id}
              className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative"
            >
              <div>
                {/* Badge Header */}
                <div className="flex justify-between items-start gap-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Class: {asm.class}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleDuplicate(asm._id, asm.name)}
                      className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-600 transition-colors"
                      title="Duplicate Template"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <Link
                      to={`/assessments/${asm._id}/edit`}
                      className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-600 transition-colors"
                      title="Edit Template"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(asm._id, asm.name)}
                      className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-650 transition-colors"
                      title="Delete Template"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-extrabold text-slate-800 text-sm mt-3.5 tracking-tight line-clamp-2">
                  {asm.name}
                </h3>

                {/* Sub headers stats */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-50 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-medium block">Duration</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-450" />
                      {asm.duration}m
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-medium block">Questions</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <FileQuestion className="h-3.5 w-3.5 text-slate-450" />
                      {asm.totalQuestions}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-medium block">Max Marks</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5 text-slate-450" />
                      {asm.totalMarks}
                    </span>
                  </div>
                </div>
              </div>

              {/* Created Date */}
              <div className="mt-5 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400">
                <span>Sections: {asm.sections?.length || 0}</span>
                <span>Configured: {new Date(asm.createdAt).toLocaleDateString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssessmentList;
