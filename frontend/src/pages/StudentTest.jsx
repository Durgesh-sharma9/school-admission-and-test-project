import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';
import Button from '../components/Button';
import Input from '../components/Input';
import toast from 'react-hot-toast';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';

const StudentTest = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  // Test states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Data models loaded from backend
  const [assignment, setAssignment] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [school, setSchool] = useState(null);
  const [enquiry, setEnquiry] = useState(null);

  // Exam lounge controls
  const [testStarted, setTestStarted] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState([]); // [{ sectionIndex, questionIndex, questionId, answerText }]
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [testCompleted, setTestCompleted] = useState(false);
  const [takeLaterState, setTakeLaterState] = useState(false);

  const timerRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);

  // Fetch test details on mount
  const fetchTestDetails = async () => {
    try {
      setLoading(true);
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
      const res = await axios.get(`${apiBaseUrl}/assessments/assignments/${assignmentId}`);
      
      if (res.data.success) {
        const data = res.data.data;
        setAssignment(data.assignment);
        setAssessment(data.assessment);
        setSchool(data.school);
        setEnquiry(data.enquiry);

        // If test is already completed, redirect to success/results screen directly
        if (data.assignment.status === 'Completed') {
          setTestCompleted(true);
          setTestStarted(true);
        } else {
          // Sync existing answers if resuming
          setStudentAnswers(data.assignment.answers || []);

          // Resume Timer check
          if (data.assignment.startTime) {
            setTestStarted(true);
            const elapsedSeconds = Math.floor(
              (Date.now() - new Date(data.assignment.startTime).getTime()) / 1000
            );
            const totalDurationSeconds = data.assessment.duration * 60;
            const remaining = totalDurationSeconds - elapsedSeconds;

            if (remaining <= 0) {
              // Timer already expired, auto-submit immediate response
              handleAutoSubmit(data.assignment.answers || [], totalDurationSeconds);
            } else {
              setTimeLeft(remaining);
            }
          } else {
            // First time opening the test
            setTimeLeft(data.assessment.duration * 60);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load test details:', error);
      toast.error('Unable to fetch test details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestDetails();
  }, [assignmentId]);

  // Timer logic
  useEffect(() => {
    if (testStarted && !testCompleted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            toast.error('Time is up! Submitting your answers...');
            handleAutoSubmit(studentAnswers, assessment.duration * 60);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testStarted, testCompleted, timeLeft, studentAnswers]);

  // Debounced progress auto-saving logic
  useEffect(() => {
    if (!testStarted || testCompleted) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
        await axios.put(`${apiBaseUrl}/assessments/assignments/${assignmentId}/save-progress`, {
          answers: studentAnswers,
        });
      } catch (err) {
        console.error('Failed to auto-save test progress:', err);
      }
    }, 1000); // 1-second debounce

    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [studentAnswers, testStarted, testCompleted]);

  // Format timer countdown display
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}:` : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Start Test action
  const handleStartTest = async () => {
    try {
      setLoading(true);
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
      // Post to save-progress to record the startTime on backend
      const res = await axios.put(`${apiBaseUrl}/assessments/assignments/${assignmentId}/save-progress`, {
        answers: studentAnswers,
      });

      if (res.data.success) {
        setTestStarted(true);
        setTimeLeft(assessment.duration * 60);
      }
    } catch (err) {
      toast.error('Failed to initialize test timer');
    } finally {
      setLoading(false);
    }
  };

  // Handle student input answer updates
  const handleAnswerSelect = (sectionIdx, questionIdx, questionId, text) => {
    const existingIdx = studentAnswers.findIndex(
      (ans) => ans.sectionIndex === sectionIdx && ans.questionIndex === questionIdx
    );

    const updated = [...studentAnswers];
    if (existingIdx !== -1) {
      updated[existingIdx].answerText = text;
    } else {
      updated.push({
        sectionIndex: sectionIdx,
        questionIndex: questionIdx,
        questionId: questionId,
        answerText: text,
      });
    }
    setStudentAnswers(updated);
  };

  const getAnswerText = (sectionIdx, questionIdx) => {
    const ans = studentAnswers.find(
      (a) => a.sectionIndex === sectionIdx && a.questionIndex === questionIdx
    );
    return ans ? ans.answerText : '';
  };

  // Submit test (manually triggered by clicking "Submit Test")
  const handleSubmitTest = async () => {
    const unansweredCount = getUnansweredCount();
    let confirmMsg = 'Are you sure you want to submit your test?';
    if (unansweredCount > 0) {
      confirmMsg = `You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`;
    }

    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    try {
      const elapsedSeconds = assessment.duration * 60 - timeLeft;
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
      const res = await axios.post(`${apiBaseUrl}/assessments/assignments/${assignmentId}/submit`, {
        answers: studentAnswers,
        timeTaken: elapsedSeconds,
      });

      if (res.data.success) {
        setTestCompleted(true);
        toast.success('Assessment submitted successfully!');
      }
    } catch (err) {
      toast.error('Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  // Auto submit (triggered on timer expire)
  const handleAutoSubmit = async (answersList, totalDurationSeconds) => {
    setSubmitting(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
      const res = await axios.post(`${apiBaseUrl}/assessments/assignments/${assignmentId}/submit`, {
        answers: answersList,
        timeTaken: totalDurationSeconds,
      });

      if (res.data.success) {
        setTestCompleted(true);
        toast.success('Time expired! Your progress was saved and submitted.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper stats for palette
  const isQuestionAnswered = (sectionIdx, questionIdx) => {
    const text = getAnswerText(sectionIdx, questionIdx);
    return text !== undefined && text.trim() !== '';
  };

  const getUnansweredCount = () => {
    let total = 0;
    assessment.sections.forEach((sec) => {
      total += sec.questions.length;
    });
    return total - studentAnswers.filter((ans) => ans.answerText.trim() !== '').length;
  };

  const getPercentageCompleted = () => {
    let total = 0;
    assessment.sections.forEach((sec) => {
      total += sec.questions.length;
    });
    if (total === 0) return 0;
    const answered = studentAnswers.filter((ans) => ans.answerText.trim() !== '').length;
    return Math.round((answered / total) * 100);
  };

  // Onboard / Entrance screens
  if (loading) {
    return <Loader fullPage message="Entering assessment lobby..." />;
  }

  // 1. Take Later View
  if (takeLaterState) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center text-left">
        <div className="max-w-md bg-white rounded-3xl p-8 border border-slate-100 shadow-xl space-y-5">
          <div className="h-14 w-14 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-650">
            <Clock className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Saved for Later</h2>
          <p className="text-xs text-slate-400 leading-normal">
            You can return to this online workspace page anytime to start your examination. 
            Keep this URL bookmarked or copy it for your reference.
          </p>
          <div className="pt-2">
            <Button className="w-full" onClick={() => setTakeLaterState(false)}>
              Back to Test Details
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Submission Success View
  if (testCompleted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center text-left">
        <div className="max-w-md bg-white rounded-3xl p-8 border border-slate-100 shadow-xl space-y-6">
          <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Test Completed!</h2>
            <p className="text-xs text-slate-500 leading-normal">
              Your test answers have been saved and sent to the school evaluation desk.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold uppercase">Candidate</span>
              <span className="font-bold text-slate-700">{enquiry?.studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold uppercase">Exam Code</span>
              <span className="font-bold text-indigo-600">{assessment?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold uppercase">Submitted</span>
              <span className="font-bold text-slate-700">
                {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 leading-normal italic">
            You may now close this browser window. Thank you.
          </div>
        </div>
      </div>
    );
  }

  // 3. Lobby Entrance Page
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-slate-50 bg-gradient-to-tr from-indigo-50/20 via-slate-50 to-indigo-50/10 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden text-left">
          <div className="bg-indigo-600 p-6 flex items-center space-x-3 text-white">
            {school?.logo ? (
              <img src={school.logo} alt={school.name} className="h-10 w-10 rounded-lg object-cover bg-white p-0.5" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center font-bold text-white">
                {school?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest block">Official Test Lounge</span>
              <h3 className="font-bold text-sm tracking-wide truncate max-w-[280px]">{school?.name}</h3>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Student Admission Test</h2>
              <p className="text-xs text-slate-400">
                Welcome <span className="font-semibold text-slate-700">{enquiry?.studentName}</span>. Please review the examination instructions below before starting.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-4 text-xs">
              <div>
                <span className="text-slate-450 font-bold uppercase tracking-wider block mb-1">Time Limit</span>
                <span className="font-bold text-slate-700 text-sm flex items-center gap-1">
                  <Clock className="h-4 w-4 text-slate-400" />
                  {assessment?.duration} Minutes
                </span>
              </div>
              <div>
                <span className="text-slate-450 font-bold uppercase tracking-wider block mb-1">Max Questions</span>
                <span className="font-bold text-slate-700 text-sm flex items-center gap-1">
                  <FileText className="h-4 w-4 text-slate-400" />
                  {assessment?.totalQuestions} Questions
                </span>
              </div>
            </div>

            {assessment?.instructions && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Instructions:</h4>
                <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">
                  {assessment.instructions}
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <Button
                variant="outline"
                className="flex-1 py-3"
                onClick={() => setTakeLaterState(true)}
              >
                Take Later
              </Button>
              <Button
                variant="primary"
                className="flex-1 py-3"
                onClick={handleStartTest}
              >
                Take Assessment
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Active Exam Lounge
  const currentSectionData = assessment.sections[currentSection];
  const currentQuestionData = currentSectionData.questions[currentQuestion];
  const qAnswer = getAnswerText(currentSection, currentQuestion);

  // Global flattening of questions to map palette indexing
  const questionMap = [];
  assessment.sections.forEach((sec, sIdx) => {
    sec.questions.forEach((_, qIdx) => {
      questionMap.push({ sIdx, qIdx });
    });
  });

  const activeFlatIdx = questionMap.findIndex(
    (item) => item.sIdx === currentSection && item.qIdx === currentQuestion
  );

  const jumpToQuestion = (flatIndex) => {
    const item = questionMap[flatIndex];
    if (item) {
      setCurrentSection(item.sIdx);
      setCurrentQuestion(item.qIdx);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-left">
      {/* Exam Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white border-b border-slate-100 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-650">
            {enquiry?.studentName?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">Candidate Logged In</span>
            <span className="text-xs font-extrabold text-slate-800">{enquiry?.studentName}</span>
          </div>
        </div>

        {/* Timer Box */}
        <div className="flex items-center space-x-2 px-4 py-2 bg-indigo-550 rounded-xl text-white font-bold text-sm bg-indigo-600 shadow-md shadow-indigo-600/10">
          <Clock className="h-4.5 w-4.5 animate-pulse" />
          <span>Timer: {formatTime(timeLeft)}</span>
        </div>
      </header>

      {/* Main Workspace Split */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        
        {/* Left pane: active question panel */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          
          {/* Progress Guide */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">
              {currentSectionData.name} • Question {currentQuestion + 1} of {currentSectionData.questions.length}
            </span>
            
            {/* Progress bar */}
            <div className="flex items-center gap-3 w-40 sm:w-60">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{ width: `${getPercentageCompleted()}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-indigo-600">{getPercentageCompleted()}%</span>
            </div>
          </div>

          {/* Question Box Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-6 min-h-[220px]">
            <h3 className="font-extrabold text-slate-800 text-base leading-normal">
              {currentQuestionData.question}
            </h3>

            {/* Answer Field Editors depending on Type */}
            {currentQuestionData.type === 'MCQ' && (
              <div className="grid grid-cols-1 gap-4 pt-2">
                {currentQuestionData.options.map((opt, oIdx) => {
                  const letter = ['A', 'B', 'C', 'D'][oIdx];
                  const isChecked = qAnswer === letter;
                  return (
                    <label
                      key={oIdx}
                      className={`flex items-start p-4 rounded-xl border cursor-pointer hover:bg-slate-50 transition-all ${
                        isChecked
                          ? 'bg-indigo-50/50 border-indigo-500 text-indigo-950 font-bold'
                          : 'bg-white border-slate-150 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="examMcq"
                        value={letter}
                        checked={isChecked}
                        onChange={() =>
                          handleAnswerSelect(
                            currentSection,
                            currentQuestion,
                            currentQuestionData._id,
                            letter
                          )
                        }
                        className="mt-1 h-4.5 w-4.5 text-indigo-600 focus:ring-indigo-500/20"
                      />
                      <span className="ml-3 font-semibold text-xs text-slate-400 mr-2">
                        {letter}.
                      </span>
                      <span className="text-xs leading-normal">{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {currentQuestionData.type === 'True / False' && (
              <div className="flex gap-4 pt-2">
                {['True', 'False'].map((val) => {
                  const isChecked = qAnswer === val;
                  return (
                    <label
                      key={val}
                      className={`flex-1 flex items-center justify-center p-4 rounded-xl border cursor-pointer hover:bg-slate-50 transition-all text-xs font-bold ${
                        isChecked
                          ? 'bg-indigo-50/50 border-indigo-500 text-indigo-950'
                          : 'bg-white border-slate-150 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="examTf"
                        value={val}
                        checked={isChecked}
                        onChange={() =>
                          handleAnswerSelect(
                            currentSection,
                            currentQuestion,
                            currentQuestionData._id,
                            val
                          )
                        }
                        className="mr-2 text-indigo-600 focus:ring-indigo-500/20"
                      />
                      <span>{val}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {(currentQuestionData.type === 'One Word' || currentQuestionData.type === 'Fill Blank') && (
              <div className="pt-2 text-left">
                <Input
                  label="Enter your answer text"
                  value={qAnswer}
                  onChange={(e) =>
                    handleAnswerSelect(
                      currentSection,
                      currentQuestion,
                      currentQuestionData._id,
                      e.target.value
                    )
                  }
                  placeholder="Type your response here..."
                />
              </div>
            )}

            {currentQuestionData.type === 'Descriptive' && (
              <div className="pt-2 text-left">
                <Input
                  label="Type your complete answer explanation"
                  type="textarea"
                  value={qAnswer}
                  onChange={(e) =>
                    handleAnswerSelect(
                      currentSection,
                      currentQuestion,
                      currentQuestionData._id,
                      e.target.value
                    )
                  }
                  placeholder="Provide your complete descriptive solution..."
                  rows={6}
                />
              </div>
            )}

            {!['MCQ', 'True / False', 'One Word', 'Fill Blank', 'Descriptive'].includes(currentQuestionData.type) && (
              <div className="py-8 text-center text-rose-600 bg-rose-50 border border-rose-100 rounded-xl font-bold text-sm">
                Unsupported Question Type
              </div>
            )}
          </div>

          {/* Navigation Controls buttons */}
          <div className="flex justify-between items-center gap-4">
            <Button
              variant="secondary"
              onClick={() => jumpToQuestion(activeFlatIdx - 1)}
              isDisabled={activeFlatIdx === 0}
            >
              <ChevronLeft className="h-4.5 w-4.5 mr-1.5" />
              Previous
            </Button>

            {activeFlatIdx === questionMap.length - 1 ? (
              <Button
                variant="primary"
                onClick={handleSubmitTest}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                isLoading={submitting}
              >
                <Send className="h-4.5 w-4.5 mr-1.5" />
                Submit Test
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => jumpToQuestion(activeFlatIdx + 1)}
              >
                Next
                <ChevronRight className="h-4.5 w-4.5 ml-1.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Right pane: palette list drawer */}
        <aside className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-slate-100 p-6 flex flex-col space-y-6">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Examination Palette
            </h4>
            <p className="text-[10px] text-slate-400">
              Select questions directly to skip sections. Real-time updates.
            </p>
          </div>

          {/* Palette Questions Grid */}
          <div className="flex-1 overflow-y-auto max-h-[300px] md:max-h-none">
            {assessment.sections.map((sec, sIdx) => (
              <div key={sIdx} className="space-y-2 mb-4">
                <span className="text-[10px] font-bold text-slate-450 uppercase block">
                  {sec.name}
                </span>
                
                <div className="grid grid-cols-5 gap-2.5">
                  {sec.questions.map((_, qIdx) => {
                    const flatIdx = questionMap.findIndex(
                      (item) => item.sIdx === sIdx && item.qIdx === qIdx
                    );
                    const isActive = sIdx === currentSection && qIdx === currentQuestion;
                    const isAnswered = isQuestionAnswered(sIdx, qIdx);
                    
                    return (
                      <button
                        key={qIdx}
                        onClick={() => jumpToQuestion(flatIdx)}
                        className={`h-9 w-9 rounded-lg text-xs font-bold flex items-center justify-center border transition-all ${
                          isActive
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-650/10'
                            : isAnswered
                            ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                            : 'bg-slate-50 border-slate-150 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {qIdx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend index guide */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[10px] space-y-2.5">
            <div className="flex items-center space-x-2">
              <span className="h-4.5 w-4.5 bg-indigo-600 rounded border border-indigo-600 block" />
              <span className="font-semibold text-slate-650">Active Question</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-4.5 w-4.5 bg-indigo-50 rounded border border-indigo-100 block" />
              <span className="font-semibold text-slate-650">Answered Question</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-4.5 w-4.5 bg-slate-50 rounded border border-slate-150 block" />
              <span className="font-semibold text-slate-650">Not Answered</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default StudentTest;
