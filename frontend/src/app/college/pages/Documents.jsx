import React, { useState, useEffect } from 'react';
import api from '../../school/services/schoolApi';
import Loader from '../../../shared/components/Loader';
import toast from 'react-hot-toast';
import { Check, X, FileText, CheckCircle2, XCircle } from 'lucide-react';

const Documents = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/college/applications');
      if (res.success) {
        // filter those that have at least one document
        setApplications(res.data.filter(app => app.documents && app.documents.length > 0));
      }
    } catch (error) {
      toast.error('Failed to load documents list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleVerify = async (appId, docId, status) => {
    try {
      const res = await api.put(`/college/applications/${appId}/document/${docId}`, { status });
      if (res.success) {
        toast.success(`Document marked as ${status}`);
        fetchApplications();
      }
    } catch (error) {
      toast.error('Failed to update document status');
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Document Verification Desk</h2>
        <p className="text-slate-500 text-xs mt-0.5">Approve, reject, or flag certificates uploaded during student admissions registration.</p>
      </div>

      {loading ? (
        <Loader message="Loading uploaded certificates..." />
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 text-xs">
          No files / certificates uploaded for verification at this time.
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <div key={app._id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{app.studentName}</h3>
                  <p className="text-slate-400 text-[10px]">App ID: {app.applicationId} | Course: {app.courseId?.name || 'N/A'}</p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-50 border text-slate-500">
                  {app.stage}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {app.documents.map(doc => (
                  <div key={doc._id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/50">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 leading-tight truncate max-w-[180px]">{doc.name}</p>
                        <span className={`text-[9px] font-bold px-1 py-0.5 rounded-sm ${
                          doc.status === 'Verified' ? 'bg-emerald-50 text-emerald-600' : doc.status === 'Rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-indigo-600 hover:underline mr-2"
                      >
                        Preview File
                      </a>
                      <button
                        onClick={() => handleVerify(app._id, doc._id, 'Verified')}
                        className="h-7 w-7 rounded-lg bg-white hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 flex items-center justify-center border border-slate-200 hover:border-emerald-200 transition-colors"
                        title="Approve document"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleVerify(app._id, doc._id, 'Rejected')}
                        className="h-7 w-7 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center border border-slate-200 hover:border-rose-200 transition-colors"
                        title="Reject / Flag document"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Documents;
