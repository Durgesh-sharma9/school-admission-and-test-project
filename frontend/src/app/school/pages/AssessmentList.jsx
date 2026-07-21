import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/schoolApi';
import Loader from '../../../shared/components/Loader';
import Button from '../../../shared/components/Button';
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
            to="/assessments/create"
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Assessment Name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 pr-8 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Classes</option>
              <option value="Nursery">Nursery</option>
              <option value="LKG">LKG</option>
              <option value="UKG">UKG</option>
              <option value="1">Class 1</option>
              <option value="2">Class 2</option>
              <option value="3">Class 3</option>
              <option value="4">Class 4</option>
              <option value="5">Class 5</option>
              <option value="6">Class 6</option>
              <option value="7">Class 7</option>
              <option value="8">Class 8</option>
              <option value="9">Class 9</option>
              <option value="10">Class 10</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
            </select>
            <Filter className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="py-12">
          <Loader message="Loading assessment templates..." />
        </div>
      ) : assessments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">No Assessment Templates Found</h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              Create your first question blueprint to generate automated test links for student evaluation.
            </p>
          </div>
          <Link
            to="/assessments/create"
            className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            <FilePlus className="h-4 w-4 mr-1.5" />
            Create First Template
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
          {assessments.map((item) => {
            const sectionsCount = item.sections ? item.sections.length : 0;
            return (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base line-clamp-1">{item.name}</h3>
                        <span className="text-xs text-indigo-600 font-semibold bg-indigo-50/60 px-2 py-0.5 rounded-md inline-block mt-0.5">
                          Class {item.class}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Indicators */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration</span>
                      <span className="text-xs font-bold text-slate-700 flex items-center justify-center mt-0.5">
                        <Clock className="h-3 w-3 mr-1 text-slate-400" />
                        {item.duration}m
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Questions</span>
                      <span className="text-xs font-bold text-slate-700 flex items-center justify-center mt-0.5">
                        <FileQuestion className="h-3 w-3 mr-1 text-slate-400" />
                        {item.totalQuestions}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Marks</span>
                      <span className="text-xs font-bold text-slate-700 flex items-center justify-center mt-0.5">
                        {item.totalMarks} pts
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Sections:</span>
                      <span className="font-semibold text-slate-700">{sectionsCount} Sections</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created On:</span>
                      <span className="font-semibold text-slate-700">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Link
                      to={`/assessments/edit/${item._id}`}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit Assessment Template"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDuplicate(item._id, item.name)}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Duplicate Template"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id, item.name)}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Assessment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <Link
                    to={`/assessments/edit/${item._id}`}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    View Details →
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AssessmentList;
