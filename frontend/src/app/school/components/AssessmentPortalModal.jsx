import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Loader from '../../../shared/components/Loader';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import toast from 'react-hot-toast';
import {
  FileQuestion,
  Copy,
  ExternalLink,
  ChevronRight,
  ClipboardCheck,
  CheckCircle,
  HelpCircle,
  FileText,
  AlertCircle,
  Award,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AssessmentPortalModal = ({ enquiry, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  // Modal inner views: 'list', 'grade', 'view'
  const [viewState, setViewState] = useState('list'); 
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [activeAssignmentDetails, setActiveAssignmentDetails] = useState(null);
  
  // Grading inputs state
  const [descriptiveGrades, setDescriptiveGrades] = useState({}); // key "secIdx-qIdx": { marksAwarded, adminComments }
  const [gradingInProgress, setGradingInProgress] = useState(false);

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      // Fetch templates and assignments parallel
      const [resTemplates, resAssignments] = await Promise.all([
        api.get('/assessments'),
        api.get(`/assessments/assignments/enquiry/${enquiry._id}`)
      ]);

      if (resTemplates.success) setTemplates(resTemplates.data);
      if (resAssignments.success) setAssignments(resAssignments.data);
    } catch (error) {
      toast.error('Failed to load assessment details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, [enquiry._id]);

  // Copy student test invitation link
  const handleCopyTestLink = async (assignmentId) => {
    const frontendUrl = window.location.origin;
    const link = `${frontendUrl}/public/test/${assignmentId}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Test invitation URL copied!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  // Assign Assessment trigger
  const handleAssignTest = async () => {
    if (!selectedTemplate) {
      toast.error('Please select an assessment template');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/assessments/assign', {
        enquiryId: enquiry._id,
        assessmentId: selectedTemplate,
      });

      if (response.success) {
        toast.success('Assessment assigned successfully!');
        setSelectedTemplate('');
        // Reload list
        const resAssignments = await api.get(`/assessments/assignments/enquiry/${enquiry._id}`);
        if (resAssignments.success) setAssignments(resAssignments.data);
      }
    } catch (error) {
      toast.error(error.message || 'Assignment failed');
    } finally {
      setLoading(false);
    }
  };

  // Load specific assignment details for grading or viewing
  const loadAssignmentDetails = async (assignmentId, targetView) => {
    try {
      setLoading(true);
      const res = await api.get(`/assessments/assignments/${assignmentId}`);
      if (res.success) {
        setActiveAssignmentDetails(res.data);
        setSelectedAssignmentId(assignmentId);
        setViewState(targetView);

        // Prepopulate grading sheet inputs
        if (targetView === 'grade') {
          const initialGrades = {};
          res.data.assessment.sections.forEach((sec, sIdx) => {
            sec.questions.forEach((q, qIdx) => {
              if (q.type === 'Descriptive') {
                const answer = res.data.assignment.answers.find(
                  a => a.sectionIndex === sIdx && a.questionIndex === qIdx
                );
                initialGrades[`${sIdx}-${qIdx}`] = {
                  marksAwarded: answer ? answer.marksAwarded : 0,
                  adminComments: answer ? answer.adminComments : '',
                };
              }
            });
          });
          setDescriptiveGrades(initialGrades);
        }
      }
    } catch (error) {
      toast.error('Failed to load assignment workspace');
    } finally {
      setLoading(false);
    }
  };

  // Save manual descriptive grades
  const handleSaveGrades = async () => {
    setGradingInProgress(true);
    try {
      // Map grades to backend payload schema
      const payloadGrades = Object.entries(descriptiveGrades).map(([key, value]) => {
        const [sectionIndex, questionIndex] = key.split('-').map(Number);
        return {
          sectionIndex,
          questionIndex,
          marksAwarded: parseFloat(value.marksAwarded) || 0,
          adminComments: value.adminComments || '',
        };
      });

      const response = await api.put(`/assessments/assignments/${selectedAssignmentId}/grade`, {
        grades: payloadGrades,
      });

      if (response.success) {
        toast.success('Descriptive grading updated successfully!');
        setViewState('list');
        fetchPortalData(); // Refresh assignments index
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit marks');
    } finally {
      setGradingInProgress(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-8 max-h-[85vh] text-left"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Candidate Portal</span>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
              {enquiry.studentName} — Assessments Portal
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">
            ✕
          </button>
        </div>

        {/* Dynamic inner scroll panel */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && viewState === 'list' ? (
            <Loader message="Loading candidates workspace..." />
          ) : (
            <>
              {/* VIEW 1: ASSIGNMENTS INDEX LIST */}
              {viewState === 'list' && (
                <div className="space-y-6">
                  {/* Assignment Trigger Dropdown */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100/50 flex flex-col sm:flex-row items-end gap-4">
                    <div className="flex-1 w-full text-left">
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                        Assign New Test Invitation
                      </label>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-950 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="">Select Assessment Blueprint</option>
                        {templates.map(t => (
                          <option key={t._id} value={t._id}>
                            {t.name} (Class {t.class} • {t.totalQuestions} Questions)
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button onClick={handleAssignTest} className="px-6 h-[44px] shrink-0 w-full sm:w-auto">
                      Assign Exam
                    </Button>
                  </div>

                  {/* Assigned list index */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">
                      Assigned Examinations ({assignments.length})
                    </h4>

                    {assignments.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-150 rounded-xl">
                        No active tests assigned. Choose a template above to assign.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {assignments.map(asm => (
                          <div
                            key={asm._id}
                            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative"
                          >
                            <div className="space-y-3 text-left">
                              <div className="flex justify-between items-center gap-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                  asm.status === 'Completed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                    : 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                                }`}>
                                  {asm.status}
                                </span>
                                
                                {asm.status === 'Completed' && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                    asm.isEvaluated
                                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                      : 'bg-red-50 text-red-700 border border-red-100'
                                  }`}>
                                    {asm.isEvaluated ? 'Evaluated' : 'Grading Pending'}
                                  </span>
                                )}
                              </div>

                              <h4 className="font-extrabold text-slate-800 text-sm line-clamp-2">
                                {asm.assessmentId?.name}
                              </h4>

                              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-50 text-slate-500">
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-medium">Duration</span>
                                  <span className="font-semibold text-slate-650">{asm.assessmentId?.duration}m</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-medium">Total Marks</span>
                                  <span className="font-semibold text-slate-650">{asm.assessmentId?.totalMarks} Marks</span>
                                </div>
                              </div>

                              {asm.status === 'Completed' && (
                                <div className="bg-indigo-50/40 rounded-xl p-3 border border-indigo-100/20 text-xs">
                                  <div className="flex justify-between font-bold text-indigo-950">
                                    <span>Earned Marks:</span>
                                    <span>{asm.totalScore} / {asm.assessmentId?.totalMarks}</span>
                                  </div>
                                  <div className="flex justify-between mt-1 font-semibold text-slate-500">
                                    <span>Percentage:</span>
                                    <span>{asm.percentage}%</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Actions block */}
                            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between gap-3 text-xs">
                              {asm.status === 'Pending' ? (
                                <>
                                  <button
                                    onClick={() => handleCopyTestLink(asm._id)}
                                    className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-bold hover:underline"
                                  >
                                    <Copy className="h-3.5 w-3.5 mr-1" />
                                    Copy Link
                                  </button>
                                  <a
                                    href={`/public/test/${asm._id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center text-slate-450 hover:text-slate-700 font-semibold"
                                  >
                                    Preview Lounge
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                  </a>
                                </>
                              ) : (
                                <>
                                  {!asm.isEvaluated ? (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                                      onClick={() => loadAssignmentDetails(asm._id, 'grade')}
                                    >
                                      <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />
                                      Grade Descriptive
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      className="w-full text-indigo-650 hover:bg-indigo-50 border-none font-bold"
                                      onClick={() => loadAssignmentDetails(asm._id, 'view')}
                                    >
                                      <Award className="h-3.5 w-3.5 mr-1.5" />
                                      View Results Sheet
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VIEW 2: MANUAL GRADING WORKSHEET */}
              {viewState === 'grade' && activeAssignmentDetails && (
                <div className="space-y-6">
                  {/* Navigation bar inside modal */}
                  <div className="flex items-center space-x-2 pb-4 border-b border-slate-100">
                    <button
                      onClick={() => setViewState('list')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-500"
                    >
                      ← Back to Assignments
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3 text-red-800 text-xs">
                      <AlertCircle className="h-5 w-5 text-red-650 shrink-0 mt-0.5" />
                      <div className="space-y-0.5 text-left">
                        <h4 className="font-bold">Descriptive Grading Required</h4>
                        <p className="text-red-600">
                          Objective scores have been auto-submitted. Please read candidate responses below, check max marks limits, assign scores, and submit final marks.
                        </p>
                      </div>
                    </div>

                    {/* Loop dynamic sections & check for Descriptive questions */}
                    {activeAssignmentDetails.assessment.sections.map((sec, sIdx) => {
                      const descriptiveQuestions = sec.questions.filter(q => q.type === 'Descriptive');
                      if (descriptiveQuestions.length === 0) return null;

                      return (
                        <div key={sIdx} className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider text-left">
                            {sec.name} — Descriptive Questions
                          </h4>

                          {sec.questions.map((q, qIdx) => {
                            if (q.type !== 'Descriptive') return null;

                            const studentAns = activeAssignmentDetails.assignment.answers.find(
                              a => a.sectionIndex === sIdx && a.questionIndex === qIdx
                            ) || { answerText: '[No response submitted]' };

                            const gradeKey = `${sIdx}-${qIdx}`;
                            const marksVal = descriptiveGrades[gradeKey]?.marksAwarded || 0;
                            const commentVal = descriptiveGrades[gradeKey]?.adminComments || '';

                            return (
                              <div key={qIdx} className="bg-slate-50 border border-slate-150/65 rounded-2xl p-5 space-y-4 text-left">
                                <div className="flex justify-between items-start">
                                  <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                                    Question {qIdx + 1} ({q.marks} Marks Max)
                                  </h5>
                                </div>

                                <p className="font-semibold text-slate-800 text-sm">{q.question}</p>

                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Student Response</span>
                                  <div className="bg-white border border-slate-100 rounded-xl p-3 text-xs text-slate-700 whitespace-pre-wrap min-h-20">
                                    {studentAns.answerText}
                                  </div>
                                </div>

                                {q.referenceAnswer && (
                                  <div className="space-y-1 bg-indigo-50/20 border border-indigo-100/30 rounded-xl p-3">
                                    <span className="text-[9px] font-bold text-indigo-400 uppercase">Reference Answer (For Admin Reference)</span>
                                    <p className="text-xs text-slate-500 whitespace-pre-wrap">{q.referenceAnswer}</p>
                                  </div>
                                )}

                                {/* Grading inputs */}
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100/50">
                                  <div>
                                    <Input
                                      label="Marks Awarded"
                                      type="number"
                                      value={marksVal}
                                      max={q.marks}
                                      min={0}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setDescriptiveGrades({
                                          ...descriptiveGrades,
                                          [gradeKey]: { ...descriptiveGrades[gradeKey], marksAwarded: Math.min(val, q.marks) }
                                        });
                                      }}
                                    />
                                  </div>
                                  <div className="sm:col-span-3">
                                    <Input
                                      label="Evaluation Feedback / Comment"
                                      value={commentVal}
                                      placeholder="Provide notes for internal record..."
                                      onChange={(e) => {
                                        setDescriptiveGrades({
                                          ...descriptiveGrades,
                                          [gradeKey]: { ...descriptiveGrades[gradeKey], adminComments: e.target.value }
                                        });
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => setViewState('list')}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveGrades}
                      isLoading={gradingInProgress}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                    >
                      Submit Grades & Finalize Report
                    </Button>
                  </div>
                </div>
              )}

              {/* VIEW 3: FULL RESULTS BREAKDOWN SHEET */}
              {viewState === 'view' && activeAssignmentDetails && (
                <div className="space-y-6">
                  {/* Navigation bar inside modal */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <button
                      onClick={() => setViewState('list')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-500"
                    >
                      ← Back to Assignments
                    </button>
                    
                    <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                      Evaluated Scorecard
                    </span>
                  </div>

                  {/* Summary Metric Header Card */}
                  <div className="bg-indigo-950 text-white rounded-3xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-15">
                      <Award className="h-28 w-28 text-white" />
                    </div>
                    
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Final Score</span>
                      <span className="text-2xl font-black text-indigo-400">
                        {activeAssignmentDetails.assignment.totalScore} / {activeAssignmentDetails.assessment.totalMarks}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Percentage</span>
                      <span className="text-2xl font-black text-white">
                        {activeAssignmentDetails.assignment.percentage}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Questions Answered</span>
                      <span className="text-2xl font-black text-white">
                        {activeAssignmentDetails.assignment.answers.filter(a => a.answerText.trim() !== '').length} / {activeAssignmentDetails.assessment.totalQuestions}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Status</span>
                      <span className="text-2xl font-black text-emerald-400 flex items-center justify-center gap-1.5">
                        <CheckCircle className="h-5 w-5" />
                        Pass
                      </span>
                    </div>
                  </div>

                  {/* Dynamic sections detailed report */}
                  <div className="space-y-6">
                    {activeAssignmentDetails.assessment.sections.map((sec, sIdx) => {
                      return (
                        <div key={sIdx} className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider text-left flex items-center gap-2">
                            <BookOpen className="h-4.5 w-4.5 text-indigo-500" />
                            {sec.name} Detailed Breakdown
                          </h4>

                          <div className="space-y-3">
                            {sec.questions.map((q, qIdx) => {
                              const ans = activeAssignmentDetails.assignment.answers.find(
                                a => a.sectionIndex === sIdx && a.questionIndex === qIdx
                              ) || { answerText: '[No response submitted]', marksAwarded: 0 };

                              const maxMarks = q.marks;
                              const isCorrect = ans.marksAwarded >= maxMarks / 2;

                              return (
                                <div key={qIdx} className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 text-left">
                                  <div className="flex justify-between items-center flex-wrap gap-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                                      Question {qIdx + 1} • {q.type}
                                    </span>
                                    <span className={`inline-flex items-center text-[10px] font-bold ${
                                      ans.marksAwarded === maxMarks
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : ans.marksAwarded > 0
                                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                                    } px-2 py-0.5 rounded`}>
                                      Marks: {ans.marksAwarded} / {maxMarks}
                                    </span>
                                  </div>

                                  <p className="font-semibold text-slate-800 text-xs leading-normal">
                                    {q.question}
                                  </p>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                    <div>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Submitted Answer</span>
                                      <p className="p-2 rounded bg-slate-50 text-slate-700 font-medium whitespace-pre-wrap">{ans.answerText || '[No response]'}</p>
                                    </div>
                                    {q.type !== 'Descriptive' && (
                                      <div>
                                        <span className="text-[9px] font-bold text-emerald-600 uppercase block mb-1">Correct Answer</span>
                                        <p className="p-2 rounded bg-emerald-50/50 border border-emerald-100/35 text-emerald-800 font-semibold">{q.correctAnswer}</p>
                                      </div>
                                    )}
                                  </div>

                                  {ans.adminComments && (
                                    <div className="bg-amber-50/30 border border-amber-100/30 rounded-xl p-2.5 text-xs text-slate-650">
                                      <span className="font-bold text-amber-700 block text-[9px] uppercase tracking-wider">Evaluator Feedback:</span>
                                      <p className="mt-0.5">{ans.adminComments}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close Portal
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default AssessmentPortalModal;
