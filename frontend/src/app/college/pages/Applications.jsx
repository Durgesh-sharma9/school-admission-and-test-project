import React, { useState, useEffect } from 'react';
import api from '../../school/services/schoolApi';
import Loader from '../../../shared/components/Loader';
import Button from '../../../shared/components/Button';
import toast from 'react-hot-toast';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  FileCheck,
  User,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  DollarSign,
  Plus,
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STAGES = [
  'Application Received',
  'Documents Pending',
  'Documents Verified',
  'Counselling Scheduled',
  'Counselling Completed',
  'Admission Confirmed',
  'Rejected'
];

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newNote, setNewNote] = useState('');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/college/applications', {
        params: { search, stage: stageFilter }
      });
      if (res.success) {
        setApplications(res.data);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [stageFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplications();
  };

  const handleViewDetails = async (id) => {
    try {
      const res = await api.get(`/college/applications/${id}`);
      if (res.success) {
        setSelectedApp(res.data);
        setDrawerOpen(true);
      }
    } catch (error) {
      toast.error('Failed to load application details');
    }
  };

  const handleStageChange = async (newStage) => {
    try {
      const res = await api.put(`/college/applications/${selectedApp._id}/stage`, {
        stage: newStage,
        note: `Stage updated to: ${newStage}`
      });
      if (res.success) {
        toast.success(`Application stage set to ${newStage}`);
        setSelectedApp(res.data);
        fetchApplications();
      }
    } catch (error) {
      toast.error('Failed to update stage');
    }
  };

  const handleDocVerify = async (docId, status) => {
    try {
      const res = await api.put(`/college/applications/${selectedApp._id}/document/${docId}`, { status });
      if (res.success) {
        toast.success(`Document marked as ${status}`);
        setSelectedApp(res.data);
        fetchApplications();
      }
    } catch (error) {
      toast.error('Failed to verify document');
    }
  };



  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      const res = await api.post(`/college/applications/${selectedApp._id}/note`, { note: newNote });
      if (res.success) {
        toast.success('Note added successfully!');
        setSelectedApp(res.data);
        setNewNote('');
        fetchApplications();
      }
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const handleExportCSV = () => {
    if (applications.length === 0) {
      toast.error('No applications found to export');
      return;
    }
    const headers = ['Application ID', 'Student Name', 'Email', 'Mobile', 'Course', 'Tenth %', 'Twelfth %', 'Admission Stage'];
    const rows = [headers.join(',')];
    applications.forEach(app => {
      rows.push([
        app.applicationId,
        `"${app.studentName}"`,
        app.email,
        app.mobile,
        `"${app.courseId?.name || 'N/A'}"`,
        app.tenthPercentage,
        app.twelfthPercentage,
        app.stage
      ].join(','));
    });
    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `College_Applications_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 text-left relative">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Applications CRM Desk</h2>
          <p className="text-slate-500 text-xs mt-0.5">Filter, track status, verify documents, and log counseling details.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="text-xs py-2 px-4 bg-white" onClick={handleExportCSV}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Name, Email, or Application ID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 pr-8 text-sm font-semibold text-slate-700 focus:outline-none"
            >
              <option value="">All Stages</option>
              {STAGES.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
            <Filter className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <Button onClick={fetchApplications} className="py-2 px-4 text-xs font-semibold">
            Search
          </Button>
        </div>
      </div>

      {/* Main High-Density Table */}
      {loading ? (
        <div className="py-12">
          <Loader message="Fetching applications dashboard..." />
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">No Applications Found</h3>
            <p className="text-slate-500 text-xs">Try adapting your search or filter settings.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400 bg-slate-50/50">
                  <th className="py-3 px-4">App ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Selected Course</th>
                  <th className="py-3 px-4">10% / 12% / Grad</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app._id} className="border-b border-slate-50 text-xs text-slate-600 hover:bg-slate-50/55 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-indigo-600">{app.applicationId}</td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-800">{app.studentName}</p>
                        <p className="text-[10px] text-slate-400">{app.email} | {app.mobile}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-slate-700">{app.courseId?.name || 'N/A'}</p>
                        <p className="text-[10px] text-slate-400">{app.departmentId?.name || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {app.tenthPercentage}% / {app.twelfthPercentage}% / {app.graduationPercentage ? `${app.graduationPercentage}%` : '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[9px] bg-indigo-50 text-indigo-600 uppercase tracking-wide">
                        {app.stage}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleViewDetails(app._id)}
                        className="inline-flex items-center space-x-1 p-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors border border-slate-100"
                        title="Open CRM Card"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="text-[10px] font-bold px-1">CRM Card</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Right Side CRM Slide-over Drawer */}
      <AnimatePresence>
        {drawerOpen && selectedApp && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-slate-900"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 right-0 w-full max-w-xl bg-white shadow-2xl z-55 flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <span className="text-[10px] uppercase font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md">
                    {selectedApp.applicationId}
                  </span>
                  <h3 className="text-base font-bold text-slate-800 mt-2">{selectedApp.studentName}</h3>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Stage selector */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Counselling Pipeline Stage</label>
                  <div className="grid grid-cols-2 gap-2">
                    {STAGES.map(stage => (
                      <button
                        key={stage}
                        onClick={() => handleStageChange(stage)}
                        className={`py-2 px-3 rounded-xl text-left text-xs font-bold border transition-all ${
                          selectedApp.stage === stage
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {stage}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact information details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b pb-1">Contact & Parent details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{selectedApp.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{selectedApp.mobile}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <User className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>Parent: {selectedApp.parentName} ({selectedApp.parentMobile})</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>DOB: {new Date(selectedApp.dob).toLocaleDateString()} | {selectedApp.gender}</span>
                    </div>
                  </div>
                </div>

                {/* Academic credentials checklist */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b pb-1">Academic Scores</h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">10th Grade</span>
                      <span className="text-sm font-bold text-slate-700">{selectedApp.tenthPercentage}%</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">{selectedApp.tenthBoard} ({selectedApp.tenthYear})</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">12th Grade</span>
                      <span className="text-sm font-bold text-slate-700">{selectedApp.twelfthPercentage}%</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">{selectedApp.twelfthBoard} ({selectedApp.twelfthYear})</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Graduation</span>
                      <span className="text-sm font-bold text-slate-700">
                        {selectedApp.graduationPercentage ? `${selectedApp.graduationPercentage}%` : 'N/A'}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        {selectedApp.graduationDegree || '-'} ({selectedApp.graduationYear || '-'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Requirements Preferences */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b pb-1">Preferences & Facility requests</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${selectedApp.scholarshipApplied ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-400'}`}>
                      Scholarship: {selectedApp.scholarshipApplied ? 'Yes' : 'No'}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${selectedApp.hostelRequired ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-50 text-slate-400'}`}>
                      Hostel Required: {selectedApp.hostelRequired ? 'Yes' : 'No'}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${selectedApp.transportRequired ? 'bg-violet-50 text-violet-700 border border-violet-200' : 'bg-slate-50 text-slate-400'}`}>
                      Transport Required: {selectedApp.transportRequired ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                {/* Documents uploaded check status */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b pb-1">Uploaded Certificates & Checklists</h4>
                  {selectedApp.documents.length === 0 ? (
                    <p className="text-slate-400 text-xs">No documents uploaded by applicant.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedApp.documents.map((doc) => (
                        <div key={doc._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                          <div>
                            <span className="font-bold text-slate-800">{doc.name}</span>
                            <span className={`ml-2 px-1.5 py-0.5 rounded-sm font-bold text-[9px] ${
                              doc.status === 'Verified' ? 'bg-emerald-50 text-emerald-700' : doc.status === 'Rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {doc.status}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 font-bold hover:underline mr-2"
                            >
                              View file
                            </a>
                            <button
                              onClick={() => handleDocVerify(doc._id, 'Verified')}
                              className="p-1 hover:bg-emerald-100 text-emerald-600 rounded-md transition-colors"
                              title="Verify Certificate"
                            >
                              <CheckCircle className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handleDocVerify(doc._id, 'Rejected')}
                              className="p-1 hover:bg-rose-100 text-rose-600 rounded-md transition-colors"
                              title="Reject / Flag Certificate"
                            >
                              <XCircle className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>



                {/* Log history list & counselling notes */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b pb-1">Counseling Audit Logs & Notes</h4>
                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add assessment evaluation or counseling note..."
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <Button type="submit" className="py-2 px-3 text-xs font-semibold shrink-0">
                      Add Note
                    </Button>
                  </form>

                  <div className="space-y-2 mt-2">
                    {selectedApp.notes.map((note, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <p className="text-slate-700 leading-normal">{note.note}</p>
                        <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400">
                          <span>By: {note.counselorName}</span>
                          <span>{new Date(note.date).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Applications;
