import React, { useState, useEffect } from 'react';
import api from '../../school/services/schoolApi';
import Loader from '../../../shared/components/Loader';
import Button from '../../../shared/components/Button';
import toast from 'react-hot-toast';
import { Compass, MessageSquare, PhoneCall, CheckCircle } from 'lucide-react';

const Counselling = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [noteText, setNoteText] = useState('');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/college/applications');
      if (res.success) {
        setApplications(res.data);
      }
    } catch (error) {
      toast.error('Failed to load counselling list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleSelectApplicant = async (app) => {
    try {
      const res = await api.get(`/college/applications/${app._id}`);
      if (res.success) {
        setSelectedApp(res.data);
      }
    } catch (error) {
      toast.error('Failed to load applicant detail logs');
    }
  };

  const handleLogCall = async () => {
    if (!selectedApp) return;
    try {
      const res = await api.post(`/college/applications/${selectedApp._id}/note`, {
        note: 'Outbound counselling callback log: Dialed applicant/parent, updated with guidelines.'
      });
      if (res.success) {
        toast.success('Callback logged successfully!');
        setSelectedApp(res.data);
        fetchApplications();
      }
    } catch (error) {
      toast.error('Failed to log call');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      const res = await api.post(`/college/applications/${selectedApp._id}/note`, {
        note: noteText
      });
      if (res.success) {
        toast.success('Counselling feedback note saved!');
        setSelectedApp(res.data);
        setNoteText('');
        fetchApplications();
      }
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Counselling Pipeline</h2>
        <p className="text-slate-500 text-xs mt-0.5">Log interactions, update counselor remarks, and track interview progress.</p>
      </div>

      {loading ? (
        <Loader message="Loading counselling roster..." />
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p className="text-slate-400 text-xs">No active applications currently mapped for counselling.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: List of applicants */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs space-y-3 h-[600px] overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Applicants list</h3>
            <div className="space-y-2">
              {applications.map(app => (
                <button
                  key={app._id}
                  onClick={() => handleSelectApplicant(app)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                    selectedApp?._id === app._id
                      ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                      : 'bg-slate-50 border-slate-100 hover:bg-slate-100/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-800">{app.studentName}</span>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase">{app.applicationId}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{app.courseId?.name || 'N/A'}</p>
                  <span className="inline-block mt-2 px-1.5 py-0.5 rounded-sm font-bold text-[8px] uppercase tracking-wider bg-white border text-indigo-650">
                    {app.stage}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right panel: Active Workspace */}
          <div className="lg:col-span-2 space-y-4">
            {selectedApp ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{selectedApp.studentName}</h3>
                    <p className="text-xs text-slate-400">Course: {selectedApp.courseId?.name} | Specialization: {selectedApp.specialization || '-'}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleLogCall}
                      className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 inline-flex items-center"
                    >
                      <PhoneCall className="h-4 w-4 mr-1.5 text-slate-500" /> Log Call Callback
                    </button>
                  </div>
                </div>

                {/* Academic Highlights */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Student Email</p>
                    <p className="font-semibold text-slate-700 mt-0.5">{selectedApp.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Mobile / Contact</p>
                    <p className="font-semibold text-slate-700 mt-0.5">{selectedApp.mobile}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px]">10th / 12th Scores</p>
                    <p className="font-semibold text-slate-700 mt-0.5">{selectedApp.tenthPercentage}% / {selectedApp.twelfthPercentage}%</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Graduation details</p>
                    <p className="font-semibold text-slate-700 mt-0.5">{selectedApp.graduationPercentage ? `${selectedApp.graduationPercentage}%` : '-'}</p>
                  </div>
                </div>

                {/* Notes log */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Counselling remark notes</h4>
                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder="Add assessment results or student preferences remarks..."
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                    />
                    <Button type="submit" className="py-2 px-4 text-xs font-semibold">
                      Save Remark
                    </Button>
                  </form>

                  <div className="space-y-2 h-[200px] overflow-y-auto">
                    {selectedApp.notes.map((note, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <p className="text-slate-700 leading-normal">{note.note}</p>
                        <div className="flex justify-between items-center mt-2 text-[9px] text-slate-400">
                          <span>By: {note.counselorName}</span>
                          <span>{new Date(note.date).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 text-xs">
                Select an applicant from the list to manage counseling sessions and review details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Counselling;
