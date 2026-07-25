import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  File,
  StickyNote,
  GitCommit,
  X,
  Check,
  Award,
  Briefcase,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import Button from './Button';
import AdmissionJourneyTimeline from './AdmissionJourneyTimeline';
import toast from 'react-hot-toast';

const CRMProfileModal = ({
  isOpen,
  onClose,
  data,
  type = 'school',
  onEdit,
  onConvert,
  onSaveJourney,
  onAssessments,
  onDocVerify,
  onAddNote,
  schoolName = 'Admin',
  stageOptions
}) => {
  const [activeSection, setActiveSection] = useState('student-info');
  const [newNoteText, setNewNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  if (!isOpen || !data) return null;

  const toggleSection = (sectionName) => {
    setActiveSection(activeSection === sectionName ? null : sectionName);
  };

  // 1. Data Normalization mapping
  const studentName = data.studentName || '—';
  const idBadge = data.enquiryId || data.applicationId || '—';
  
  // Normalize Status
  const getStatusText = () => {
    const rawStatus = data.status || data.stage || 'New';
    if (rawStatus === 'New Enquiry') return 'NEW';
    if (rawStatus === 'Not Interested') return 'REJECTED';
    if (rawStatus === 'Admission Confirmed') return 'CONFIRMED';
    return rawStatus.toUpperCase();
  };

  const getStatusColor = () => {
    const text = getStatusText();
    if (text === 'NEW' || text === 'NEW APPLICATION') return 'bg-blue-50 border-blue-200 text-blue-700';
    if (text === 'HOLD' || text === 'PENDING') return 'bg-amber-50 border-amber-250 text-amber-700';
    if (text === 'REJECTED' || text === 'CLOSED') return 'bg-rose-50 border-rose-250 text-rose-750';
    if (text === 'CONFIRMED' || text === 'ADMISSION CONFIRMED') return 'bg-emerald-50 border-emerald-250 text-emerald-700';
    return 'bg-purple-50 border-purple-250 text-purple-750';
  };

  // Convert to Registered checks
  const isAlreadyRegistered = data.isConvertedToAdmission || getStatusText() === 'CONFIRMED' || data.stage === 'Admission Confirmed';

  // Notes Normalization
  const getNotesList = () => {
    if (Array.isArray(data.notes)) {
      return data.notes.filter(note => !note.note?.includes('Status updated to:') && !note.note?.includes('Stage updated to:'));
    }
    if (typeof data.notes === 'string' && data.notes.trim()) {
      return [{ note: data.notes, date: data.updatedAt || data.createdAt || new Date(), counselorName: 'Admin' }];
    }
    if (data.expectations && typeof data.expectations === 'string' && data.expectations.trim()) {
      return [{ note: `Expectations: ${data.expectations}`, date: data.createdAt, counselorName: 'System' }];
    }
    return [];
  };

  // Dynamic / Custom Fields Filter
  const getCustomFields = () => {
    const knownKeys = [
      '_id', 'schoolId', 'studentName', 'gender', 'dob', 'classSeeking', 'currentSchool',
      'currentClass', 'previousSchool', 'previousClass', 'parentName', 'mobile', 'whatsapp',
      'email', 'state', 'city', 'area', 'society', 'fullAddress', 'notes', 'source',
      'expectations', 'enquiryId', 'saveDate', 'saveTime', 'status', 'isConvertedToAdmission',
      'convertedAt', 'isDeleted', 'createdAt', 'updatedAt', '__v', 'documents',
      'applicationId', 'stage', 'departmentId', 'courseId', 'specialization', 'modeOfStudy',
      'hostelRequired', 'transportRequired', 'fatherName', 'motherName', 'parentMobile',
      'parentEmail', 'tenthPercentage', 'tenthBoard', 'tenthYear', 'twelfthPercentage',
      'twelfthBoard', 'twelfthYear', 'graduationPercentage', 'graduationDegree', 'graduationYear',
      'nationality', 'category', 'address', 'journey'
    ];
    return Object.entries(data).filter(([key, val]) => {
      return !knownKeys.includes(key) && val !== null && val !== undefined && String(val).trim() !== '' && typeof val !== 'object';
    });
  };

  // Timeline Preview calculations
  const getTimelinePreview = () => {
    const journey = data.journey || [];
    const completedCount = journey.filter(step => step.status === 'Completed').length;
    const currentStep = journey.find(step => step.status === 'Current')?.stageName || 'Form Submitted';
    const nextFollowUp = journey.find(step => step.followUpDate)?.followUpDate || '—';
    return { completedCount, currentStep, nextFollowUp };
  };

  const { completedCount, currentStep, nextFollowUp } = getTimelinePreview();

  const handleLocalAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    if (!onAddNote) {
      toast.error('Notes addition not supported for this entry');
      return;
    }
    setSubmittingNote(true);
    try {
      await onAddNote(newNoteText);
      setNewNoteText('');
    } catch (err) {
      toast.error('Failed to add remark');
    } finally {
      setSubmittingNote(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 flex flex-col text-slate-800 text-left"
      >
        {/* CRM Header */}
        <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5 text-[#6D5DF6]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-black bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-lg tracking-wider">
                  {idBadge}
                </span>
                <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase border tracking-wider ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 mt-1">{studentName}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2 font-bold text-xs">
            {/* Edit Button */}
            {onEdit && (
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  onEdit();
                }}
                className="border-slate-200 hover:bg-slate-50 text-slate-705 h-9 px-3 rounded-lg text-xs"
              >
                Edit Details
              </Button>
            )}

            {/* Convert Button */}
            {!isAlreadyRegistered && onConvert && (
              <Button
                variant="primary"
                onClick={onConvert}
                className="bg-emerald-600 hover:bg-emerald-700 border-transparent text-white h-9 px-3 rounded-lg text-xs shadow-xs"
              >
                Convert to Registered
              </Button>
            )}

            {isAlreadyRegistered && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-250">
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                Registered
              </span>
            )}

            {/* Assessments quick access */}
            {onAssessments && (
              <Button
                variant="outline"
                onClick={onAssessments}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 h-9 px-3 rounded-lg text-xs"
              >
                Assessments
              </Button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Accordion Wrapper */}
        <div className="p-6 overflow-y-auto space-y-4 max-h-[72vh]">

          {/* Section 1: Student Information */}
          <div className="border border-slate-150 rounded-xl overflow-hidden shadow-xs bg-white">
            <button
              type="button"
              onClick={() => toggleSection('student-info')}
              className="w-full flex items-center justify-between px-5 py-4 bg-slate-50/50 hover:bg-slate-50 text-slate-805 font-black text-xs uppercase tracking-wider transition-colors border-b border-slate-100"
            >
              <span className="flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-[#6D5DF6]" />
                Student & Contact Information
              </span>
              {activeSection === 'student-info' ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>
            <AnimatePresence>
              {activeSection === 'student-info' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4.5 text-xs text-left">
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Student Name</span>
                      <span className="font-bold text-slate-800 text-sm mt-0.5 block">{studentName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Gender</span>
                      <span className="font-bold text-slate-705 text-sm mt-0.5 block">{data.gender || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Date of Birth</span>
                      <span className="font-bold text-slate-705 text-sm mt-0.5 block">
                        {data.dob ? new Date(data.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Class / Course Seeking</span>
                      <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                        {data.classSeeking || data.courseId?.name || data.course || '—'}
                      </span>
                    </div>
                    {type === 'college' && (
                      <div>
                        <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Department</span>
                        <span className="font-bold text-slate-705 text-sm mt-0.5 block">
                          {data.departmentId?.name || data.department || 'N/A'}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Parent / Guardian Name</span>
                      <span className="font-bold text-slate-705 text-sm mt-0.5 block">{data.parentName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Mobile Phone</span>
                      <span className="font-bold text-slate-705 text-sm mt-0.5 block">{data.parentMobile || data.mobile || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Email Address</span>
                      <span className="font-bold text-slate-750 text-sm mt-0.5 block truncate" title={data.parentEmail || data.email}>
                        {data.parentEmail || data.email || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">City / Location</span>
                      <span className="font-bold text-slate-705 text-sm mt-0.5 block">{data.city || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Locality / Area</span>
                      <span className="font-bold text-slate-750 text-sm mt-0.5 block">
                        {data.localityId?.name || data.locality || data.area || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Registration Date</span>
                      <span className="font-bold text-slate-750 text-sm mt-0.5 block">
                        {data.saveDate ? `${data.saveDate} ${data.saveTime || ''}` : data.createdAt ? new Date(data.createdAt).toLocaleDateString() : '—'}
                      </span>
                    </div>
                    {type === 'college' && (
                      <>
                        <div>
                          <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Hostel Required</span>
                          <span className="font-bold text-slate-705 text-xs block mt-1">
                            {data.hostelRequired ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Transport Option</span>
                          <span className="font-bold text-slate-705 text-xs block mt-1">
                            {data.transportRequired ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section 2: Admission Journey Timeline */}
          <div className="border border-slate-150 rounded-xl overflow-hidden shadow-xs bg-white">
            <button
              type="button"
              onClick={() => toggleSection('timeline')}
              className="w-full flex items-center justify-between px-5 py-4 bg-slate-50/50 hover:bg-slate-50 text-slate-805 font-black text-xs uppercase tracking-wider transition-colors border-b border-slate-100"
            >
              <span className="flex items-center gap-2">
                <GitCommit className="h-4.5 w-4.5 text-[#6D5DF6]" />
                Admission Journey & Pipeline
              </span>
              {activeSection === 'timeline' ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>
            <AnimatePresence>
              {activeSection === 'timeline' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-5 space-y-5 text-left">
                    {/* Timeline summary counters */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5 bg-slate-50/60 p-4 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Current Stage</span>
                        <span className="font-bold text-indigo-750 block text-sm mt-0.5">{currentStep}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Completed Count</span>
                        <span className="font-bold text-slate-805 block text-sm mt-0.5">{completedCount} Stage(s)</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Next Follow-up</span>
                        <span className="font-bold text-slate-805 block text-sm mt-0.5">
                          {nextFollowUp && nextFollowUp !== '—' 
                            ? new Date(nextFollowUp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                            : 'None scheduled'}
                        </span>
                      </div>
                    </div>

                    {/* Timeline Component */}
                    {onSaveJourney ? (
                      <div className="pt-2">
                        <AdmissionJourneyTimeline
                          enquiry={data}
                          stageOptions={stageOptions || ['Call', 'WhatsApp', 'Email', 'Meeting', 'Campus Visit', 'Documents Requested', 'Documents Submitted', 'Registration Fee', 'Admission Confirmed', 'Rejected', 'Closed', 'Other']}
                          onSaveJourney={onSaveJourney}
                          counselorName={schoolName}
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-slate-450 italic">Graphical timeline is viewable from the list expansion panel.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section 3: Notes & remarks */}
          <div className="border border-slate-150 rounded-xl overflow-hidden shadow-xs bg-white">
            <button
              type="button"
              onClick={() => toggleSection('notes')}
              className="w-full flex items-center justify-between px-5 py-4 bg-slate-50/50 hover:bg-slate-50 text-slate-805 font-black text-xs uppercase tracking-wider transition-colors border-b border-slate-100"
            >
              <span className="flex items-center gap-2">
                <StickyNote className="h-4.5 w-4.5 text-[#6D5DF6]" />
                Counseling Notes & remarks
              </span>
              {activeSection === 'notes' ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>
            <AnimatePresence>
              {activeSection === 'notes' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-5 space-y-4 text-left">
                    {/* Add note form */}
                    {onAddNote && (
                      <form onSubmit={handleLocalAddNote} className="flex gap-2">
                        <input
                          type="text"
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          placeholder="Log call feedback, parent response remarks, or observations..."
                          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                          disabled={submittingNote}
                        />
                        <Button type="submit" disabled={submittingNote} className="py-2 px-4.5 text-xs font-bold shrink-0">
                          {submittingNote ? 'Adding...' : 'Add Note'}
                        </Button>
                      </form>
                    )}

                    {/* Notes display */}
                    <div className="space-y-3">
                      {getNotesList().length === 0 ? (
                        <p className="text-slate-400 text-xs italic text-center py-4">No notes added yet.</p>
                      ) : (
                        getNotesList().map((note, index) => (
                          <div key={index} className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl">
                            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{note.note}</p>
                            <div className="flex justify-between items-center mt-2.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                              <span>Counselor: {note.counselorName || 'System'}</span>
                              <span>{new Date(note.date).toLocaleString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section 4: Documents */}
          <div className="border border-slate-150 rounded-xl overflow-hidden shadow-xs bg-white">
            <button
              type="button"
              onClick={() => toggleSection('documents')}
              className="w-full flex items-center justify-between px-5 py-4 bg-slate-50/50 hover:bg-slate-50 text-slate-805 font-black text-xs uppercase tracking-wider transition-colors border-b border-slate-100"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-[#6D5DF6]" />
                Uploaded Documents
              </span>
              {activeSection === 'documents' ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>
            <AnimatePresence>
              {activeSection === 'documents' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-5 text-left">
                    {!data.documents || data.documents.length === 0 ? (
                      <p className="text-slate-400 text-xs italic text-center py-4">No documents uploaded.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {data.documents.map((doc) => (
                          <div key={doc._id} className="flex items-center justify-between p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 text-xs">
                            <div>
                              <span className="font-bold text-slate-805 block text-xs">{doc.name}</span>
                              <span className={`inline-block mt-1.5 px-2 py-0.5 rounded font-extrabold text-[8px] uppercase tracking-wide border ${
                                doc.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : doc.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>
                                {doc.status}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 shrink-0">
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 font-bold hover:underline hover:text-indigo-500 text-[11px] mr-2"
                              >
                                View File
                              </a>
                              {onDocVerify && (
                                <>
                                  <button
                                    onClick={() => onDocVerify(doc._id, 'Verified')}
                                    className="p-1.5 hover:bg-emerald-105 text-emerald-600 rounded-lg transition-colors"
                                    title="Verify Document"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => onDocVerify(doc._id, 'Rejected')}
                                    className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                                    title="Reject Document"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section 5: Custom / Dynamic Fields */}
          {getCustomFields().length > 0 && (
            <div className="border border-slate-150 rounded-xl overflow-hidden shadow-xs bg-white">
              <button
                type="button"
                onClick={() => toggleSection('custom-fields')}
                className="w-full flex items-center justify-between px-5 py-4 bg-slate-50/50 hover:bg-slate-50 text-slate-805 font-black text-xs uppercase tracking-wider transition-colors border-b border-slate-100"
              >
                <span className="flex items-center gap-2">
                  <File className="h-4.5 w-4.5 text-[#6D5DF6]" />
                  Custom & Dynamic Fields
                </span>
                {activeSection === 'custom-fields' ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
              </button>
              <AnimatePresence>
                {activeSection === 'custom-fields' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-left">
                      {getCustomFields().map(([key, val]) => (
                        <div key={key}>
                          <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">{key}</span>
                          <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

        </div>

        {/* CRM Footer */}
        <div className="px-6 py-4.5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-lg text-xs h-9">
            Close Panel
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CRMProfileModal;
