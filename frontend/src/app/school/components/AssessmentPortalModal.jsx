import React, { useState, useEffect, useRef } from 'react';
import api from '../services/schoolApi';
import Loader from '../../../shared/components/Loader';
import Button from '../../../shared/components/Button';
import toast from 'react-hot-toast';
import {
  Copy, ExternalLink, ChevronRight, ClipboardCheck,
  HelpCircle, FileText, AlertCircle, Award, BookOpen,
  Download, Printer, Share2, ArrowLeft,
  TrendingUp, Sparkles, Check, X, Target, Activity,
  Star, Zap, Hash, Timer, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const getAnswerDisplayValue = (q, val) => {
  if (!val || !val.trim()) return '[No response]';
  if (q.type === 'MCQ') {
    const letter = val.trim().toUpperCase();
    const idx = letter.charCodeAt(0) - 65; // A=0, B=1, ...
    if (q.options && idx >= 0 && idx < q.options.length) {
      return `${letter} — ${q.options[idx]}`;
    }
    return val;
  }
  return val;
};

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b'];

const AssessmentPortalModal = ({ enquiry, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [viewState, setViewState] = useState('list');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [activeAssignmentDetails, setActiveAssignmentDetails] = useState(null);
  const [descriptiveGrades, setDescriptiveGrades] = useState({});
  const [gradingInProgress, setGradingInProgress] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const reportRef = useRef(null);

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      const [resT, resA] = await Promise.all([
        api.get('/assessments'),
        api.get(`/assessments/assignments/enquiry/${enquiry._id}`),
      ]);
      if (resT.success) setTemplates(resT.data);
      if (resA.success) setAssignments(resA.data);
    } catch { toast.error('Failed to load assessment details'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPortalData(); }, [enquiry._id]);

  const handleCopyTestLink = async (id) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/public/test/${id}`);
      toast.success('Test invitation link copied!');
    } catch { toast.error('Failed to copy link'); }
  };

  const handleAssignTest = async () => {
    if (!selectedTemplate) { toast.error('Please select an assessment template'); return; }
    try {
      setLoading(true);
      const res = await api.post('/assessments/assign', { enquiryId: enquiry._id, assessmentId: selectedTemplate });
      if (res.success) {
        toast.success('Assessment assigned!');
        setSelectedTemplate('');
        const r = await api.get(`/assessments/assignments/enquiry/${enquiry._id}`);
        if (r.success) setAssignments(r.data);
      }
    } catch (e) { toast.error(e.message || 'Assignment failed'); }
    finally { setLoading(false); }
  };

  const loadAssignmentDetails = async (id, target) => {
    try {
      setLoading(true);
      const res = await api.get(`/assessments/assignments/${id}`);
      if (res.success) {
        setActiveAssignmentDetails(res.data);
        setSelectedAssignmentId(id);
        setViewState(target);
        if (target === 'grade') {
          const init = {};
          res.data.assessment.sections.forEach((sec, sI) =>
            sec.questions.forEach((q, qI) => {
              if (q.type === 'Descriptive') {
                const a = res.data.assignment.answers.find(x => x.sectionIndex === sI && x.questionIndex === qI);
                init[`${sI}-${qI}`] = { marksAwarded: a?.marksAwarded ?? 0, adminComments: a?.adminComments ?? '' };
              }
            })
          );
          setDescriptiveGrades(init);
        }
      }
    } catch { toast.error('Failed to load assignment'); }
    finally { setLoading(false); }
  };

  const handleSaveGrades = async () => {
    setGradingInProgress(true);
    try {
      const grades = Object.entries(descriptiveGrades).map(([k, v]) => {
        const [si, qi] = k.split('-').map(Number);
        return { sectionIndex: si, questionIndex: qi, marksAwarded: parseFloat(v.marksAwarded) || 0, adminComments: v.adminComments || '' };
      });
      const res = await api.put(`/assessments/assignments/${selectedAssignmentId}/grade`, { grades });
      if (res.success) { toast.success('Grading submitted!'); setViewState('list'); fetchPortalData(); }
    } catch (e) { toast.error(e.message || 'Failed to submit marks'); }
    finally { setGradingInProgress(false); }
  };

  const calculateResultStats = () => {
    if (!activeAssignmentDetails) return null;
    const { assessment, assignment } = activeAssignmentDetails;
    const totalQuestions = assessment.totalQuestions || 0;
    const answers = assignment.answers || [];
    const answeredCount = answers.filter(a => a.answerText?.trim()).length;
    const skippedCount = Math.max(0, totalQuestions - answeredCount);
    let correctCount = 0, wrongCount = 0;

    const sectionStats = assessment.sections.map((sec, sIdx) => {
      const sAs = answers.filter(a => a.sectionIndex === sIdx);
      let sm = 0, st = 0, sc = 0, sw = 0, ss = 0;
      sec.questions.forEach((q, qIdx) => {
        st += q.marks || 0;
        const a = sAs.find(a => a.questionIndex === qIdx);
        if (!a?.answerText?.trim()) { ss++; }
        else { sm += a.marksAwarded || 0; if (a.marksAwarded > 0) { sc++; correctCount++; } else { sw++; wrongCount++; } }
      });
      return {
        name: sec.name, totalQuestions: sec.questions.length,
        correct: sc, wrong: sw, skipped: ss,
        marksObtained: sm, totalMarks: st,
        percentage: st > 0 ? Math.round((sm / st) * 100) : 0
      };
    });

    const marksObtained = assignment.totalScore || 0;
    const totalMarks = assessment.totalMarks || 0;
    const percentage = assignment.percentage || 0;
    const timeTaken = assignment.timeTaken || 0;
    const attemptRate = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    const strongAreas = sectionStats.filter(s => s.percentage >= 70).map(s => s.name);
    const weakAreas = sectionStats.filter(s => s.percentage < 40).map(s => s.name);

    const durSec = (assessment.duration || 0) * 60;
    let speedLabel = 'Normal Pace';
    if (timeTaken > 0 && durSec > 0) {
      const r = timeTaken / durSec;
      if (r <= 0.4) speedLabel = 'Excellent Speed';
      else if (r <= 0.7) speedLabel = 'Good Speed';
      else if (r > 0.9) speedLabel = 'Time Intensive';
    }

    const answeredTotal = correctCount + wrongCount;
    const accuracyPct = answeredTotal > 0 ? Math.round((correctCount / answeredTotal) * 100) : 0;
    const accuracyLabel = accuracyPct >= 80 ? 'High Accuracy' : accuracyPct >= 60 ? 'Good Accuracy' : accuracyPct >= 40 ? 'Average Accuracy' : 'Low Accuracy';

    const recommendations = [];
    if (weakAreas.length) recommendations.push(`Focus on: ${weakAreas.join(', ')}`);
    if (skippedCount > totalQuestions * 0.2) recommendations.push('Attempt all questions to maximise your score');
    if (accuracyPct < 60 && answeredTotal > 0) recommendations.push('Review incorrect answers to identify concept gaps');
    if (!recommendations.length) recommendations.push('Keep practising consistently to maintain performance');

    return {
      totalQuestions, answeredCount, correctCount, wrongCount, skippedCount,
      marksObtained, totalMarks, percentage, timeTaken, attemptRate,
      sectionStats, strongAreas, weakAreas,
      speedLabel, accuracyLabel, accuracyPct, recommendations,
    };
  };

  const statsResult = calculateResultStats();
  const getInitials = (n) => n ? n.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase() : 'C';
  const reportId = activeAssignmentDetails
    ? `RPT-${activeAssignmentDetails.assignment._id?.slice(-8).toUpperCase()}`
    : '';

  // PDF builder — Professional Enterprise A4 report layout designed for print
  const buildScorecardHTML = () => {
    if (!statsResult || !activeAssignmentDetails) return '';
    const { assessment, assignment } = activeAssignmentDetails;
    const s = statsResult;
    const submittedDate = assignment.submittedAt
      ? new Date(assignment.submittedAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Pending';
    const genDate = new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    const candId = enquiry.applicationId || enquiry.enquiryId || 'N/A';
    const courseName = enquiry.classSeeking || enquiry.courseId?.name || enquiry.class || 'N/A';

    // Dynamic Logo fetching logic
    const schoolLogoUrl = localStorage.getItem('schoolLogo') || enquiry?.schoolId?.logo || enquiry?.school?.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(enquiry?.schoolId?.name || 'School')}&background=f1f5f9&color=64748b&size=120`;
    const schoolName = enquiry?.schoolId?.name || localStorage.getItem('schoolName') || 'OFFICIAL INSTITUTION';

    // Precompile Detailed review card blocks
    const qCardsHTML = assessment.sections.map((sec, sI) =>
      sec.questions.map((q, qI) => {
        const a = assignment.answers.find(x => x.sectionIndex === sI && x.questionIndex === qI) || { answerText: '', marksAwarded: 0 };
        const sk = !a.answerText?.trim();
        const ok = !sk && a.marksAwarded === q.marks;
        const pt = !sk && !ok && a.marksAwarded > 0;
        const lbl = sk ? 'SKIPPED' : ok ? 'CORRECT' : pt ? 'PARTIAL' : 'WRONG';
        const sc = sk ? '#b45309' : ok ? '#047857' : pt ? '#1d4ed8' : '#be123c';
        const sbg = sk ? '#fffbeb' : ok ? '#ecfdf5' : pt ? '#eff6ff' : '#fff1f2';

        let optsHtml = '';
        if (q.type === 'MCQ' && q.options) {
          optsHtml = '<div style="margin-top: 12px; margin-bottom: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">';
          q.options.forEach((optText, oIdx) => {
            const letter = String.fromCharCode(65 + oIdx);
            const isCorrectOption = letter === q.correctAnswer;
            const isSubmittedOption = letter === a.answerText;
            const isWrongSubmitted = isSubmittedOption && !isCorrectOption;

            let bgStyle = '#f8fafc';
            let borderStyle = '1px solid #e2e8f0';
            let textStyle = '#334155';
            let badge = '';

            if (isCorrectOption) {
              bgStyle = '#ecfdf5';
              borderStyle = '1px solid #10b981';
              textStyle = '#047857';
              badge = ' <span style="font-size: 9px; font-weight: 800; color: #047857; background: #d1fae5; padding: 2px 6px; border-radius: 4px; margin-left: 8px; float: right;">✓ CORRECT</span>';
            } else if (isWrongSubmitted) {
              bgStyle = '#fff1f2';
              borderStyle = '1px solid #f43f5e';
              textStyle = '#be123c';
              badge = ' <span style="font-size: 9px; font-weight: 800; color: #be123c; background: #ffe4e6; padding: 2px 6px; border-radius: 4px; margin-left: 8px; float: right;">✗ SELECTED</span>';
            } else if (isSubmittedOption) {
              bgStyle = '#eff6ff';
              borderStyle = '1px solid #3b82f6';
              textStyle = '#1d4ed8';
              badge = ' <span style="font-size: 9px; font-weight: 800; color: #1d4ed8; background: #dbeafe; padding: 2px 6px; border-radius: 4px; margin-left: 8px; float: right;">SELECTED</span>';
            }

            optsHtml += '<div style="background: ' + bgStyle + '; border: ' + borderStyle + '; border-radius: 4px; padding: 8px 12px; font-size: 11px; color: ' + textStyle + '; font-weight: 600;">' +
              '<span style="font-weight: 800; margin-right: 6px; color: #0f172a;">' + letter + '.</span> ' + optText + badge +
              '</div>';
          });
          optsHtml += '</div>';
        }

        let noteHtml = '';
        if (a.adminComments) {
          noteHtml = `
            <div style="margin-top: 10px; background: #f8fafc; border-left: 3px solid #64748b; padding: 8px 12px; font-size: 11px; color: #334155;">
              <strong style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #0f172a; display: block; margin-bottom: 2px;">Evaluator Remarks:</strong>
              ${a.adminComments}
            </div>
          `;
        }

        return `
          <div class="q-card-block" style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; margin-bottom: 12px; page-break-inside: avoid; background: #ffffff;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;">
              <div>
                <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">Question ${qI + 1}</div>
                <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Type: ${q.type}</div>
              </div>
              <div style="text-align: right;">
                <div style="background: ${sbg}; color: ${sc}; padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; display: inline-block; margin-bottom: 4px;">${lbl}</div>
                <div style="font-size: 12px; font-weight: 800; color: #0f172a;">SCORE: ${a.marksAwarded || 0} / ${q.marks}</div>
              </div>
            </div>
            <div style="font-size: 12px; font-weight: 600; color: #1e293b; margin-bottom: 10px; line-height: 1.5;">${q.question}</div>
            ${optsHtml}
            ${noteHtml}
          </div>
        `;
      }).join('')
    ).join('');

    // Calculate chart data flawlessly
    const tot = (s.correctCount + s.wrongCount + s.skippedCount) || 1;
    const cPct = Math.round((s.correctCount / tot) * 100);
    const wPct = Math.round((s.wrongCount / tot) * 100);
    const sPct = 100 - cPct - wPct;

    // Circle circumference for R=55
    const circ = 345.58;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Assessment Report - ${enquiry.studentName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
    }
    /* Expanded A4 utilization */
    .pdf-page {
      width: 210mm;
      min-height: 297mm;
      padding: 15mm 15mm 25mm 15mm; /* Increased bottom padding to protect footer */
      box-sizing: border-box;
      position: relative;
      background: #ffffff;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
    }
    @media print {
      body { background: #fff; }
      .pdf-page { margin: 0; page-break-after: always; box-shadow: none; }
    }
    .card-title {
      background: #f8fafc; 
      border-bottom: 1px solid #cbd5e1; 
      padding: 10px 16px; 
      font-size: 11px; 
      font-weight: 800; 
      color: #0f172a; 
      text-transform: uppercase; 
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>

  <!-- PAGE 1: Assessment Summary -->
  <div class="pdf-page" id="page-summary">
    
    <!-- PROFESSIONAL ERP HEADER -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 28px;">
       <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
             <img src="${schoolLogoUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.src='https://ui-avatars.com/api/?name=LOGO&background=f1f5f9&color=94a3b8&size=120';" />
          </div>
          <div>
             <h1 style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">${schoolName}</h1>
             <div style="font-size: 12px; color: #475569; margin-top: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Academic Session 2026-2027 • Assessment Report</div>
          </div>
       </div>
       <div style="text-align: right; border-left: 2px solid #e2e8f0; padding-left: 20px;">
          <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">REPORT ID</div>
          <div style="font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 4px;">${reportId}</div>
          <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-top: 6px; text-transform: uppercase;">DATE: ${genDate}</div>
       </div>
    </div>

    <!-- STUDENT INFORMATION CARD -->
    <div style="border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 24px; overflow: hidden;">
       <div class="card-title">Candidate & Assessment Information</div>
       <div style="padding: 20px 24px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; background: #ffffff;">
          <div><div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Candidate Name</div><div style="font-size: 14px; font-weight: 800; color: #0f172a;">${enquiry.studentName}</div></div>
          <div><div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Registration / ID</div><div style="font-size: 14px; font-weight: 800; color: #0f172a;">${candId}</div></div>
          <div><div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Program / Class</div><div style="font-size: 14px; font-weight: 800; color: #0f172a;">${courseName}</div></div>
          <div><div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Assessment Date</div><div style="font-size: 14px; font-weight: 800; color: #0f172a;">${submittedDate}</div></div>
          
          <div><div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Assessment Name</div><div style="font-size: 14px; font-weight: 800; color: #0f172a;">${assessment.name}</div></div>
          <div><div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Evaluator</div><div style="font-size: 14px; font-weight: 800; color: #0f172a;">${assignment.gradedBy || 'System Evaluated'}</div></div>
          <div><div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Max Duration</div><div style="font-size: 14px; font-weight: 800; color: #0f172a;">${assessment.duration} Minutes</div></div>
          <div><div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Time Taken</div><div style="font-size: 14px; font-weight: 800; color: #0f172a;">${Math.floor(s.timeTaken / 60)}m ${s.timeTaken % 60}s</div></div>
       </div>
    </div>

    <!-- PERFORMANCE METRICS (8 CARDS) -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
       <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px 14px; background: #ffffff; border-left: 5px solid #0f172a;">
          <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Total Questions</div>
          <div style="font-size: 24px; font-weight: 900; color: #0f172a;">${s.totalQuestions}</div>
       </div>
       <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px 14px; background: #ffffff; border-left: 5px solid #3b82f6;">
          <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Attempted</div>
          <div style="font-size: 24px; font-weight: 900; color: #1e3a8a;">${s.answeredCount}</div>
       </div>
       <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px 14px; background: #ffffff; border-left: 5px solid #10b981;">
          <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Correct Answers</div>
          <div style="font-size: 24px; font-weight: 900; color: #064e3b;">${s.correctCount}</div>
       </div>
       <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px 14px; background: #ffffff; border-left: 5px solid #ef4444;">
          <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Wrong Answers</div>
          <div style="font-size: 24px; font-weight: 900; color: #7f1d1d;">${s.wrongCount}</div>
       </div>
       <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px 14px; background: #ffffff; border-left: 5px solid #f59e0b;">
          <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Skipped Questions</div>
          <div style="font-size: 24px; font-weight: 900; color: #78350f;">${s.skippedCount}</div>
       </div>
       <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px 14px; background: #ffffff; border-left: 5px solid #8b5cf6;">
          <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Marks Obtained</div>
          <div style="font-size: 24px; font-weight: 900; color: #4c1d95;">${s.marksObtained} <span style="font-size: 14px; color:#64748b;">/ ${s.totalMarks}</span></div>
       </div>
       <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px 14px; background: #ffffff; border-left: 5px solid #ec4899;">
          <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Final Percentage</div>
          <div style="font-size: 24px; font-weight: 900; color: #831843;">${s.percentage}%</div>
       </div>
       <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px 14px; background: #ffffff; border-left: 5px solid #14b8a6;">
          <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Accuracy Rate</div>
          <div style="font-size: 24px; font-weight: 900; color: #134e4a;">${s.accuracyPct}%</div>
       </div>
    </div>

    <!-- SECTION-WISE PERFORMANCE TABLE -->
    <div style="border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 24px; overflow: hidden; flex-shrink: 0;">
       <div class="card-title">Section-wise Breakdown</div>
       <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: center;">
          <thead>
             <tr style="background: #f1f5f9; color: #475569; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">
                <th style="padding: 14px 16px; text-align: left; border-bottom: 2px solid #cbd5e1;">Section Name</th>
                <th style="padding: 14px 16px; border-bottom: 2px solid #cbd5e1;">Total Qs</th>
                <th style="padding: 14px 16px; border-bottom: 2px solid #cbd5e1; color: #047857;">Correct</th>
                <th style="padding: 14px 16px; border-bottom: 2px solid #cbd5e1; color: #be123c;">Wrong</th>
                <th style="padding: 14px 16px; border-bottom: 2px solid #cbd5e1; color: #b45309;">Skipped</th>
                <th style="padding: 14px 16px; border-bottom: 2px solid #cbd5e1;">Marks</th>
                <th style="padding: 14px 16px; border-bottom: 2px solid #cbd5e1; color: #0f172a;">Score %</th>
             </tr>
          </thead>
          <tbody>
             ${s.sectionStats.map((sec, i) =>
      `<tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
                  <td style="font-weight: 800; padding: 14px 16px; text-align: left; color: #0f172a;">${sec.name}</td>
                  <td style="font-weight: 600; padding: 14px 16px;">${sec.totalQuestions}</td>
                  <td style="font-weight: 800; color: #047857; padding: 14px 16px;">${sec.correct}</td>
                  <td style="font-weight: 800; color: #be123c; padding: 14px 16px;">${sec.wrong}</td>
                  <td style="font-weight: 800; color: #b45309; padding: 14px 16px;">${sec.skipped}</td>
                  <td style="font-weight: 800; color: #0f172a; padding: 14px 16px;">${sec.marksObtained} <span style="font-weight:600; color:#64748b;">/ ${sec.totalMarks}</span></td>
                  <td style="font-weight: 900; color: #0f172a; padding: 14px 16px; background: ${i % 2 === 0 ? '#f1f5f9' : '#e2e8f0'};">${sec.percentage}%</td>
                </tr>`
    ).join('')}
          </tbody>
       </table>
    </div>

    <!-- ANALYTICS & ACADEMIC INSIGHTS -->
    <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 24px; margin-bottom: auto; flex-shrink: 0;">
       <!-- Score Distribution -->
       <div style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;">
          <div class="card-title">Score Distribution</div>
          <div style="padding: 24px; display: flex; align-items: center; justify-content: center; gap: 32px; flex: 1; background: #ffffff;">
             <svg width="140" height="140" viewBox="0 0 140 140" style="display: block; flex-shrink: 0;">
               <circle cx="70" cy="70" r="55" fill="none" stroke="#e2e8f0" stroke-width="20" />
               ${cPct > 0 ? `<circle cx="70" cy="70" r="55" fill="none" stroke="#10b981" stroke-width="20" stroke-dasharray="${circ * cPct / 100} 345.58" stroke-dashoffset="0" transform="rotate(-90 70 70)" />` : ''}
               ${wPct > 0 ? `<circle cx="70" cy="70" r="55" fill="none" stroke="#ef4444" stroke-width="20" stroke-dasharray="${circ * wPct / 100} 345.58" stroke-dashoffset="-${circ * cPct / 100}" transform="rotate(-90 70 70)" />` : ''}
               ${sPct > 0 ? `<circle cx="70" cy="70" r="55" fill="none" stroke="#f59e0b" stroke-width="20" stroke-dasharray="${circ * sPct / 100} 345.58" stroke-dashoffset="-${circ * (cPct + wPct) / 100}" transform="rotate(-90 70 70)" />` : ''}
               <g transform="translate(70, 75)" style="text-anchor: middle; font-family: Arial; font-weight: 900;">
                 <text y="-5" style="font-size: 28px; fill: #0f172a;">${s.percentage}%</text>
                 <text y="14" style="font-size: 10px; fill: #64748b; font-weight: 800; text-transform: uppercase;">SCORE</text>
               </g>
             </svg>
             <div style="flex: 1;">
               <div style="display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 12px; font-weight: 800;"><span style="color: #475569;">CORRECT</span><span style="color: #047857;">${cPct}%</span></div>
               <div style="display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 12px; font-weight: 800;"><span style="color: #475569;">WRONG</span><span style="color: #be123c;">${wPct}%</span></div>
               <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 800;"><span style="color: #475569;">SKIPPED</span><span style="color: #b45309;">${sPct}%</span></div>
             </div>
          </div>
       </div>
       
       <!-- Academic Insights -->
       <div style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;">
          <div class="card-title">Evaluation Insights</div>
          <div style="padding: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; flex: 1; align-content: center; background: #ffffff;">
             <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px 16px; border-radius: 6px;">
                <div style="font-size: 10px; font-weight: 900; color: #166534; text-transform: uppercase; margin-bottom: 6px;">Strong Areas</div>
                <div style="font-size: 13px; font-weight: 800; color: #14532d; line-height: 1.4;">${s.strongAreas.length ? s.strongAreas.join(', ') : 'Consistent performance'}</div>
             </div>
             <div style="background: #fff1f2; border: 1px solid #fecdd3; padding: 14px 16px; border-radius: 6px;">
                <div style="font-size: 10px; font-weight: 900; color: #9f1239; text-transform: uppercase; margin-bottom: 6px;">Needs Improvement</div>
                <div style="font-size: 13px; font-weight: 800; color: #881337; line-height: 1.4;">${s.weakAreas.length ? s.weakAreas.join(', ') : 'No critical weak areas'}</div>
             </div>
             <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 14px 16px; border-radius: 6px;">
                <div style="font-size: 10px; font-weight: 900; color: #1e40af; text-transform: uppercase; margin-bottom: 6px;">Pace & Accuracy</div>
                <div style="font-size: 13px; font-weight: 800; color: #1e3a8a; line-height: 1.4;">${s.speedLabel} / ${s.accuracyLabel}</div>
             </div>
             <div style="background: #faf5ff; border: 1px solid #e9d5ff; padding: 14px 16px; border-radius: 6px;">
                <div style="font-size: 10px; font-weight: 900; color: #6b21a8; text-transform: uppercase; margin-bottom: 6px;">Primary Recommendation</div>
                <div style="font-size: 13px; font-weight: 800; color: #581c87; line-height: 1.4;">${s.recommendations[0]}</div>
             </div>
          </div>
       </div>
    </div>

    <!-- SIGNATURES (No Seal, Bottom Padding Added to clear footer) -->
    <div style="margin-top: 40px; padding-top: 20px; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-end;">
       <div style="width: 240px; text-align: center;">
          <div style="height: 50px; border-bottom: 1px solid #0f172a; margin-bottom: 10px;"></div>
          <div style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">Evaluator Signature</div>
       </div>
       <div style="width: 240px; text-align: center;">
          <div style="height: 50px; border-bottom: 1px solid #0f172a; margin-bottom: 10px;"></div>
          <div style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">Principal / Director</div>
       </div>
    </div>

  </div>

  <!-- Detailed questions container (Hidden temporarily, processed by JS) -->
  <div id="temp-questions" style="display: none;">
    ${qCardsHTML}
  </div>

  <script>
    window.addEventListener('load', function() {
      const temp = document.getElementById('temp-questions');
      const cards = Array.from(temp.children);
      temp.parentNode.removeChild(temp);

      let currentPage = null;
      let currentHeight = 0;
      const pageHeightLimit = 1000; // Limit for standard A4 considering new padding
      let pageNum = 2;

      const createNewPage = () => {
        const page = document.createElement('div');
        page.className = 'pdf-page';
        page.id = 'page-' + pageNum;

        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px;';
        header.innerHTML = '<div><h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Detailed Evaluation</h1>' +
          '<div style="font-size: 12px; color: #475569; margin-top: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${enquiry.studentName} — ${assessment.name}</div></div>' +
          '<div style="text-align: right; border-left: 2px solid #e2e8f0; padding-left: 20px;">' +
          '<div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">REPORT ID</div>' +
          '<div style="font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 4px;">${reportId}</div></div>';
        page.appendChild(header);

        document.body.appendChild(page);
        pageNum++;
        return page;
      };

      currentPage = createNewPage();

      cards.forEach((card) => {
        currentPage.appendChild(card);
        const cardHeight = card.offsetHeight;

        if (currentHeight + cardHeight > pageHeightLimit) {
          currentPage.removeChild(card);
          currentPage = createNewPage();
          currentPage.appendChild(card);
          currentHeight = cardHeight + 80;
        } else {
          currentHeight += cardHeight + 12; // margin-bottom
        }
      });

      // Append Fixed Footers completely avoiding signature overlap
      const allPages = document.querySelectorAll('.pdf-page');
      allPages.forEach((page, idx) => {
        const footer = document.createElement('div');
        footer.style.cssText = 'position: absolute; bottom: 10mm; left: 15mm; right: 15mm; display: flex; justify-content: space-between; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; border-top: 1px solid #e2e8f0; padding-top: 10px; letter-spacing: 0.5px;';
        footer.innerHTML = '<span>Official Assessment Report • ${schoolName}</span>' +
          '<span>Page ' + (idx + 1) + ' of ' + allPages.length + '</span>';
        page.appendChild(footer);
      });
      
      window.layoutComplete = true;
    });
  </script>
</body>
</html>`;
  };

  const handleDownloadPDF = async () => {
    if (!statsResult || !activeAssignmentDetails) return;
    setPdfGenerating(true);
    const toastId = toast.loading('Generating enterprise report PDF…');
    let iframe = null;
    try {
      const html = buildScorecardHTML();
      iframe = document.createElement('iframe');
      // Set width mapping the A4 ratio (210mm x 297mm) -> ~820px width matches
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:820px;border:none;visibility:hidden;';
      document.body.appendChild(iframe);

      await new Promise(resolve => {
        iframe.onload = resolve;
        iframe.contentDocument.open();
        iframe.contentDocument.write(html);
        iframe.contentDocument.close();
      });

      // Wait until pagination script is fully complete and height is calculated
      await new Promise((resolve) => {
        const check = () => {
          if (iframe.contentWindow.layoutComplete) {
            resolve();
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });

      const pages = iframe.contentDocument.querySelectorAll('.pdf-page');
      const pdf = new jsPDF('p', 'mm', 'a4');

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2, useCORS: true, logging: false,
          backgroundColor: '#ffffff',
          width: 820, height: 1159, windowWidth: 820, // 820 * 1.414 ~ 1159
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }

      pdf.save(enquiry.studentName.replace(/\s+/g, '_') + '_assessment_report.pdf');
      toast.success('Report downloaded!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('PDF failed — try the Print option.', { id: toastId });
    } finally {
      if (iframe?.parentNode) iframe.parentNode.removeChild(iframe);
      setPdfGenerating(false);
    }
  };

  const handlePrint = () => {
    const html = buildScorecardHTML();
    const w = window.open('', '', 'width=960,height=1100');
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl bg-slate-50 rounded-[2.5rem] shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col my-4 max-h-[92vh] text-left">

        {/* Top bar */}
        <div className="px-7 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Student Assessment Suite</span>
              <h3 className="text-sm font-black text-slate-800 leading-tight">{enquiry.studentName} — Evaluation Desk</h3>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold flex items-center justify-center transition-all cursor-pointer">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {loading && viewState === 'list' ? (
            <div className="py-20"><Loader message="Loading assessment workspace..." /></div>
          ) : (
            <>
              {/* VIEW: LIST */}
              {viewState === 'list' && (
                <div className="space-y-8">
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-end gap-5">
                    <div className="flex-1 w-full space-y-2">
                      <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">Assign New Assessment</label>
                      <div className="relative">
                        <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none cursor-pointer appearance-none">
                          <option value="">Select Assessment Blueprint...</option>
                          {templates.map(t => <option key={t._id} value={t._id}>{t.name} · Class {t.class} · {t.totalQuestions} Qs · {t.totalMarks} Marks</option>)}
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-slate-400 rotate-90" />
                      </div>
                    </div>
                    <Button onClick={handleAssignTest} className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold px-7 h-[50px] rounded-2xl shrink-0 w-full md:w-auto shadow-md">
                      Assign Assessment
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Assigned Examinations ({assignments.length})</h4>
                    {assignments.length === 0 ? (
                      <div className="py-14 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-xs font-bold text-slate-400">No assessments assigned yet.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {assignments.map(asm => (
                          <div key={asm._id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${asm.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>{asm.status}</span>
                                {asm.status === 'Completed' && <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${asm.isEvaluated ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>{asm.isEvaluated ? 'Evaluated' : 'Grading Pending'}</span>}
                              </div>
                              <h4 className="font-black text-slate-800 text-sm leading-snug">{asm.assessmentId?.name}</h4>
                              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
                                <div><span className="text-[9px] text-slate-400 block font-black uppercase tracking-wider">Duration</span><span className="font-bold text-slate-700 mt-0.5 block">{asm.assessmentId?.duration} min</span></div>
                                <div><span className="text-[9px] text-slate-400 block font-black uppercase tracking-wider">Max Marks</span><span className="font-bold text-slate-700 mt-0.5 block">{asm.assessmentId?.totalMarks}</span></div>
                              </div>
                              {asm.status === 'Completed' && (
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs space-y-1">
                                  <div className="flex justify-between font-black text-slate-800"><span>Score:</span><span className="text-indigo-600">{asm.totalScore}/{asm.assessmentId?.totalMarks}</span></div>
                                  <div className="flex justify-between font-bold text-slate-400"><span>Percentage:</span><span>{asm.percentage}%</span></div>
                                </div>
                              )}
                            </div>
                            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                              {asm.status === 'Pending' ? (
                                <>
                                  <button onClick={() => handleCopyTestLink(asm._id)} className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-black uppercase cursor-pointer"><Copy className="h-3.5 w-3.5 mr-1" />Copy Link</button>
                                  <a href={`/public/test/${asm._id}`} target="_blank" rel="noreferrer" className="inline-flex items-center text-slate-500 hover:text-slate-700 font-black uppercase">Preview<ExternalLink className="h-3 w-3 ml-1" /></a>
                                </>
                              ) : !asm.isEvaluated ? (
                                <Button variant="primary" size="sm" className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black text-[11px] uppercase tracking-wider py-3.5 rounded-xl" onClick={() => loadAssignmentDetails(asm._id, 'grade')}>
                                  <ClipboardCheck className="h-4 w-4 mr-1.5" />Grade Descriptive Answers
                                </Button>
                              ) : (
                                <Button variant="secondary" size="sm" className="w-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border-none font-black text-[11px] uppercase tracking-wider py-3.5 rounded-xl transition-all" onClick={() => loadAssignmentDetails(asm._id, 'view')}>
                                  <Award className="h-4 w-4 mr-1.5 text-indigo-600" />View Scorecard Report
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VIEW: GRADE */}
              {viewState === 'grade' && activeAssignmentDetails && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <button onClick={() => setViewState('list')} className="text-xs font-black text-indigo-600 flex items-center gap-1.5 cursor-pointer hover:underline"><ArrowLeft className="w-4 h-4" />Back to List</button>
                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">Descriptive Evaluation Form</span>
                  </div>
                  <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-5 flex gap-4 text-xs">
                    <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div><h4 className="font-black text-rose-900 mb-0.5">Manual Grading Workspace</h4><p className="text-slate-500 font-medium leading-relaxed">Objective answers are auto-scored. Review each descriptive response, allocate marks, and add feedback before finalising.</p></div>
                  </div>
                  <div className="space-y-6">
                    {activeAssignmentDetails.assessment.sections.map((sec, sIdx) => {
                      if (!sec.questions.some(q => q.type === 'Descriptive')) return null;
                      return (
                        <div key={sIdx} className="space-y-4">
                          <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{sec.name}</h4>
                          {sec.questions.map((q, qIdx) => {
                            if (q.type !== 'Descriptive') return null;
                            const ans = activeAssignmentDetails.assignment.answers.find(a => a.sectionIndex === sIdx && a.questionIndex === qIdx) || { answerText: '' };
                            const key = `${sIdx}-${qIdx}`;
                            const gv = descriptiveGrades[key] || { marksAwarded: 0, adminComments: '' };
                            return (
                              <div key={qIdx} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                                <div className="flex justify-between flex-wrap gap-2 pb-3 border-b border-slate-100 text-[10px]">
                                  <span className="font-black text-slate-400 uppercase tracking-wider">Q{qIdx + 1}</span>
                                  <span className="font-black text-slate-500 uppercase">Max: {q.marks} marks</span>
                                </div>
                                <p className="font-black text-slate-800 text-xs">{q.question}</p>
                                {q.referenceAnswer && <div className="bg-indigo-50/40 p-3 rounded-2xl border border-indigo-100/30 text-xs"><span className="font-black text-indigo-900 text-[9px] uppercase tracking-wider block">Reference Answer:</span><p className="text-slate-600 font-semibold mt-0.5">{q.referenceAnswer}</p></div>}
                                <div>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Candidate Response</span>
                                  <p className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 font-semibold text-xs whitespace-pre-wrap">{ans.answerText || '[No response submitted]'}</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                                  <div className="sm:col-span-3 space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-600 uppercase block">Marks Awarded</label>
                                    <input type="number" min="0" max={q.marks} value={gv.marksAwarded}
                                      onChange={e => { const v = Math.min(q.marks, Math.max(0, parseFloat(e.target.value) || 0)); setDescriptiveGrades(p => ({ ...p, [key]: { ...p[key], marksAwarded: v } })); }}
                                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold bg-slate-50 focus:outline-none" />
                                  </div>
                                  <div className="sm:col-span-9 space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-600 uppercase block">Evaluator Remarks</label>
                                    <input type="text" placeholder="Add feedback..." value={gv.adminComments}
                                      onChange={e => setDescriptiveGrades(p => ({ ...p, [key]: { ...p[key], adminComments: e.target.value } }))}
                                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold bg-slate-50 focus:outline-none" />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setViewState('list')} className="border-slate-200 text-slate-600 font-bold text-xs py-3 px-6 rounded-2xl">Cancel</Button>
                    <Button variant="primary" onClick={handleSaveGrades} disabled={gradingInProgress} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-3 px-7 rounded-2xl shadow-lg">
                      {gradingInProgress ? 'Saving...' : 'Finalise & Submit Scorecard'}
                    </Button>
                  </div>
                </div>
              )}

              {/* VIEW: SCORECARD */}
              {viewState === 'view' && activeAssignmentDetails && statsResult && (() => {
                const { assessment, assignment } = activeAssignmentDetails;
                const s = statsResult;
                const submittedDate = assignment.submittedAt ? new Date(assignment.submittedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pending';
                const circ = 2 * Math.PI * 56;
                return (
                  <div className="space-y-6 text-left">
                    {/* Action bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                      <button onClick={() => setViewState('list')} className="text-xs font-black text-indigo-600 flex items-center gap-1.5 cursor-pointer hover:underline"><ArrowLeft className="w-4 h-4" />Back to Assessments</button>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={handleDownloadPDF} disabled={pdfGenerating} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer">
                          <Download className="w-4 h-4" />{pdfGenerating ? 'Generating...' : 'Download PDF'}
                        </Button>
                        <Button onClick={handlePrint} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer">
                          <Printer className="w-4 h-4 text-slate-400" />Print
                        </Button>
                        <Button onClick={() => toast('Share coming soon!')} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer">
                          <Share2 className="w-4 h-4 text-slate-400" />Share
                        </Button>
                      </div>
                    </div>

                    {/* Scorecard Preview */}
                    <div ref={reportRef} className="space-y-7 bg-white p-6 sm:p-8 rounded-[1.75rem] border border-slate-200 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500" />

                      {/* Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-5 pt-2">
                        <div className="flex items-start gap-4">
                          {enquiry.photo
                            ? <img src={enquiry.photo} alt={enquiry.studentName} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-md shrink-0" />
                            : <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white font-black text-xl flex items-center justify-center shadow-lg shrink-0">{getInitials(enquiry.studentName)}</div>
                          }
                          <div>
                            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-0.5">Assessment Report</p>
                            <h2 className="text-lg font-black text-slate-900 leading-tight">{enquiry.studentName}</h2>
                            <div className="grid grid-cols-2 gap-x-5 gap-y-0.5 mt-2 text-[11px] text-slate-500 font-semibold">
                              <span><ShieldCheck className="w-3.5 h-3.5 text-slate-400 inline mr-1" />{enquiry.applicationId || enquiry.enquiryId || 'N/A'}</span>
                              <span><BookOpen className="w-3.5 h-3.5 text-slate-400 inline mr-1" />{enquiry.classSeeking || enquiry.courseId?.name || enquiry.class || 'N/A'}</span>
                              <span><FileText className="w-3.5 h-3.5 text-slate-400 inline mr-1" />{assessment.name}</span>
                              <span><Timer className="w-3 h-3 text-slate-400 inline mr-1" />{submittedDate}</span>
                              <span>Duration: {assessment.duration} min</span>
                              <span>By: {assignment.gradedBy || 'System Evaluator'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="text-[10px] text-slate-400 text-right">
                            <div className="font-bold text-slate-500">Report ID: {reportId}</div>
                            <div>Generated: {new Date().toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>

                      {/* 9 Summary Cards */}
                      <div>
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Score Summary</h3>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                          {[
                            { label: 'Total Qs', value: s.totalQuestions, from: 'from-blue-50', to: 'to-blue-100/40', vc: 'text-blue-700', icon: <Hash className="w-3.5 h-3.5 text-blue-400" /> },
                            { label: 'Attempted', value: s.answeredCount, from: 'from-slate-50', to: 'to-slate-100/40', vc: 'text-slate-700', icon: <Activity className="w-3.5 h-3.5 text-slate-400" /> },
                            { label: 'Correct', value: s.correctCount, from: 'from-emerald-50', to: 'to-emerald-100/40', vc: 'text-emerald-700', icon: <Check className="w-3.5 h-3.5 text-emerald-400" /> },
                            { label: 'Wrong', value: s.wrongCount, from: 'from-rose-50', to: 'to-rose-100/40', vc: 'text-rose-700', icon: <X className="w-3.5 h-3.5 text-rose-400" /> },
                            { label: 'Skipped', value: s.skippedCount, from: 'from-amber-50', to: 'to-amber-100/40', vc: 'text-amber-700', icon: <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> },
                            { label: 'Obtained', value: s.marksObtained, from: 'from-purple-50', to: 'to-purple-100/40', vc: 'text-purple-700', icon: <Star className="w-3.5 h-3.5 text-purple-400" /> },
                            { label: 'Max Marks', value: s.totalMarks, from: 'from-indigo-50', to: 'to-indigo-100/40', vc: 'text-indigo-700', icon: <Target className="w-3.5 h-3.5 text-indigo-400" /> },
                            { label: 'Percentage', value: s.percentage + '%', from: 'from-fuchsia-50', to: 'to-fuchsia-100/40', vc: 'text-fuchsia-700', icon: <TrendingUp className="w-3.5 h-3.5 text-fuchsia-400" /> },
                            { label: 'Time Taken', value: Math.floor(s.timeTaken / 60) + 'm ' + (s.timeTaken % 60) + 's', from: 'from-sky-50', to: 'to-sky-100/40', vc: 'text-sky-700', icon: <Timer className="w-3.5 h-3.5 text-sky-400" /> },
                          ].map((c, i) => (
                            <div key={i} className={`bg-gradient-to-br ${c.from} ${c.to} rounded-2xl p-3.5 shadow-sm border border-white/80 flex flex-col gap-2`}>
                              <div className="flex items-center gap-1.5">{c.icon}<span className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider">{c.label}</span></div>
                              <span className={`text-xl font-black ${c.vc} leading-none`}>{c.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Performance ring */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50/60 rounded-2xl p-5 border border-slate-100">
                        <div className="flex flex-col items-center justify-center">
                          <div className="relative w-32 h-32">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                              <circle cx="64" cy="64" r="56" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                              <circle cx="64" cy="64" r="56" fill="none" stroke="#6366f1" strokeWidth="10"
                                strokeDasharray={`${circ * s.percentage / 100} ${circ}`} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-black text-slate-800">{s.percentage}%</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Score</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4 flex flex-col justify-center text-xs">
                          {[{ label: 'Attempt Rate', pct: s.attemptRate, bar: '#6366f1' }, { label: 'Accuracy (of attempted)', pct: s.accuracyPct, bar: '#10b981' }].map((m, i) => (
                            <div key={i}>
                              <div className="flex justify-between font-black text-slate-700 mb-1"><span>{m.label}</span><span>{m.pct}%</span></div>
                              <div className="h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: m.pct + '%', background: m.bar }} /></div>
                            </div>
                          ))}
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            {[{ label: 'Speed', val: s.speedLabel }, { label: 'Accuracy', val: s.accuracyLabel }].map((m, i) => (
                              <div key={i} className="bg-white rounded-xl p-2.5 shadow-sm border border-slate-100">
                                <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block">{m.label}</span>
                                <span className="font-black text-slate-700 text-[11px] mt-0.5 block">{m.val}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Section table */}
                      <div>
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Section-wise Breakdown</h3>
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200">
                                {['Section', 'Questions', 'Correct', 'Wrong', 'Skipped', 'Marks', 'Score %'].map((h, i) => (
                                  <th key={i} className={`px-4 py-3 font-black text-[9.5px] uppercase tracking-wider whitespace-nowrap ${i === 0 ? 'text-left text-slate-600' : 'text-center ' + ['text-slate-600', 'text-emerald-600', 'text-rose-600', 'text-amber-600', 'text-slate-600', 'text-indigo-600'][i - 1]}`}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {s.sectionStats.map((sec, i) => (
                                <tr key={i} className={`border-b border-slate-100 hover:bg-indigo-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                                  <td className="px-4 py-3 font-black text-slate-800">{sec.name}</td>
                                  <td className="px-4 py-3 text-center text-slate-600">{sec.totalQuestions}</td>
                                  <td className="px-4 py-3 text-center font-bold text-emerald-700">{sec.correct}</td>
                                  <td className="px-4 py-3 text-center font-bold text-rose-700">{sec.wrong}</td>
                                  <td className="px-4 py-3 text-center text-amber-700">{sec.skipped}</td>
                                  <td className="px-4 py-3 text-center font-bold text-slate-800">{sec.marksObtained}/{sec.totalMarks}</td>
                                  <td className="px-4 py-3 text-center"><span className="font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg">{sec.percentage}%</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Charts */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-100">
                          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Score Distribution</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie data={[{ name: 'Correct', value: s.correctCount }, { name: 'Wrong', value: s.wrongCount }, { name: 'Skipped', value: s.skippedCount }]}
                                cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                                {PIE_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                              </Pie>
                              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '10px' }} />
                              <Legend wrapperStyle={{ fontSize: '10px', fontWeight: '700' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-100">
                          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Section Marks Comparison</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={s.sectionStats} barSize={14}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} tickLine={false} axisLine={false} />
                              <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '10px' }} />
                              <Legend wrapperStyle={{ fontSize: '10px', fontWeight: '700' }} />
                              <Bar name="Obtained" dataKey="marksObtained" fill="#6366f1" radius={[4, 4, 0, 0]} />
                              <Bar name="Maximum" dataKey="totalMarks" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Insights */}
                      <div>
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />Performance Insights
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {[
                            { icon: <Star className="w-4 h-4 text-emerald-500" />, label: 'Strong Areas', val: s.strongAreas.length ? s.strongAreas.join(', ') : 'Consistent across all sections', cls: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
                            { icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, label: 'Needs Attention', val: s.weakAreas.length ? s.weakAreas.join(', ') : 'No critical weak areas', cls: 'bg-amber-50 border-amber-200 text-amber-800' },
                            { icon: <Target className="w-4 h-4 text-blue-500" />, label: 'Accuracy', val: s.accuracyPct + '% — ' + s.accuracyLabel, cls: 'bg-blue-50 border-blue-200 text-blue-800' },
                            { icon: <Activity className="w-4 h-4 text-purple-500" />, label: 'Attempt Rate', val: s.attemptRate + '% (' + s.answeredCount + '/' + s.totalQuestions + ' Qs)', cls: 'bg-purple-50 border-purple-200 text-purple-800' },
                            { icon: <Zap className="w-4 h-4 text-sky-500" />, label: 'Speed', val: s.speedLabel, cls: 'bg-sky-50 border-sky-200 text-sky-800' },
                            { icon: <TrendingUp className="w-4 h-4 text-indigo-500" />, label: 'Recommendation', val: s.recommendations[0], cls: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
                          ].map((it, i) => (
                            <div key={i} className={`${it.cls} border rounded-2xl p-4 text-xs`}>
                              <div className="flex items-center gap-1.5 mb-1.5">{it.icon}<span className="font-black uppercase tracking-wider text-[8.5px]">{it.label}</span></div>
                              <p className="font-semibold leading-snug">{it.val}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Question review */}
                      <div>
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />Detailed Question Review
                        </h3>
                        <div className="space-y-3">
                          {assessment.sections.map((sec, sIdx) => (
                            <div key={sIdx}>
                              <div className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <BookOpen className="w-3 h-3" /> {sec.name}
                              </div>
                              {sec.questions.map((q, qIdx) => {
                                const ans = assignment.answers.find(a => a.sectionIndex === sIdx && a.questionIndex === qIdx) || { answerText: '', marksAwarded: 0 };
                                const sk = !ans.answerText?.trim();
                                const ok = !sk && ans.marksAwarded === q.marks;
                                const pt = !sk && !ok && ans.marksAwarded > 0;
                                const cfg = sk ? { label: 'Skipped', wrap: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', icon: <HelpCircle className="w-3 h-3" /> }
                                  : ok ? { label: 'Correct', wrap: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', icon: <Check className="w-3 h-3" /> }
                                    : pt ? { label: 'Partial', wrap: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700', icon: <Activity className="w-3 h-3" /> }
                                      : { label: 'Wrong', wrap: 'bg-rose-50 border-rose-200', badge: 'bg-rose-100 text-rose-700', icon: <X className="w-3 h-3" /> };

                                const isSelCorrect = ans.answerText === q.correctAnswer;

                                return (
                                  <div key={qIdx} className={`${cfg.wrap} border rounded-2xl p-5 text-xs mb-4 shadow-sm`}>
                                    <div className="flex items-start justify-between gap-2 flex-wrap">
                                      <div className="flex items-center gap-2">
                                        <span className="min-w-[22px] h-5 rounded-lg bg-white/80 border border-slate-200/50 text-slate-600 flex items-center justify-center font-black text-[9px] shadow-sm px-1">{qIdx + 1}</span>
                                        <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider">{q.type}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`${cfg.badge} flex items-center gap-1 px-2 py-0.5 rounded-lg font-black text-[8.5px] uppercase tracking-wider`}>
                                          {cfg.icon} {cfg.label}
                                        </span>
                                        <span className="font-black text-slate-700 text-[11px] whitespace-nowrap">{ans.marksAwarded || 0}/{q.marks}m</span>
                                      </div>
                                    </div>

                                    <p className="font-bold text-slate-800 mt-2 leading-snug">{q.question}</p>

                                    {/* MCQ Option List */}
                                    {q.type === 'MCQ' && q.options && (
                                      <div className="mt-3.5 space-y-2">
                                        <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">Options List</span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                          {q.options.map((optText, oIdx) => {
                                            const letter = String.fromCharCode(65 + oIdx);
                                            const isCorrectOption = letter === q.correctAnswer;
                                            const isSubmittedOption = letter === ans.answerText;
                                            const isWrongSubmitted = isSubmittedOption && !isCorrectOption;

                                            let optClass = "border-slate-250 bg-white text-slate-700 hover:bg-slate-50/50";
                                            let optBadge = null;

                                            if (isCorrectOption) {
                                              optClass = "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold shadow-xs";
                                              optBadge = (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-705 bg-emerald-100/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                  <Check className="w-3 h-3 text-emerald-600" /> Correct
                                                </span>
                                              );
                                            } else if (isWrongSubmitted) {
                                              optClass = "border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-indigo-500 font-bold shadow-xs";
                                              optBadge = (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-rose-705 bg-rose-100/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                  <X className="w-3 h-3 text-rose-600" /> Selected (Wrong)
                                                </span>
                                              );
                                            } else if (isSubmittedOption) {
                                              optClass = "border-indigo-500 ring-2 ring-indigo-500 bg-indigo-50 text-indigo-800 font-bold";
                                              optBadge = (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-indigo-705 bg-indigo-100/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                  Selected
                                                </span>
                                              );
                                            }

                                            return (
                                              <div key={oIdx} className={`border rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs transition-all ${optClass}`}>
                                                <span><strong className="mr-1.5">{letter}.</strong>{optText}</span>
                                                {optBadge}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* MCQ Highlight blocks */}
                                    {q.type === 'MCQ' ? (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100">
                                        <div>
                                          <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">Student Selected Option</span>
                                          <p className={`border rounded-xl px-3.5 py-2 font-black ${isSelCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'}`}>
                                            {isSelCorrect ? '✔' : '☒'} Selected: {getAnswerDisplayValue(q, ans.answerText)}
                                          </p>
                                        </div>
                                        {!isSelCorrect && (
                                          <div>
                                            <span className="text-[8.5px] font-black text-emerald-600 uppercase tracking-wider block mb-1">Correct Option</span>
                                            <p className="bg-emerald-50/70 border border-emerald-100 rounded-xl px-3.5 py-2 text-emerald-800 font-black">
                                              ✔ Correct: {getAnswerDisplayValue(q, q.correctAnswer)}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    ) : q.type === 'True / False' ? (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100">
                                        <div>
                                          <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">Submitted</span>
                                          <p className={`border rounded-xl px-3.5 py-2 font-black ${isSelCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'}`}>
                                            {ans.answerText || '[No response]'}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-[8.5px] font-black text-emerald-600 uppercase tracking-wider block mb-1">Correct</span>
                                          <p className="bg-emerald-50/70 border border-emerald-100 rounded-xl px-3.5 py-2 text-emerald-800 font-black">{q.correctAnswer}</p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-3 mt-4 pt-3 border-t border-slate-100">
                                        <div>
                                          <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">Submitted Answer</span>
                                          <p className="bg-white/90 border border-slate-200/60 rounded-xl px-4 py-2.5 text-slate-700 font-bold whitespace-pre-wrap">{ans.answerText || '[No response]'}</p>
                                        </div>
                                        {q.type !== 'Descriptive' && (
                                          <div>
                                            <span className="text-[8.5px] font-black text-emerald-600 uppercase tracking-wider block mb-1">Correct Answer</span>
                                            <p className="bg-emerald-50/70 border border-emerald-100 rounded-xl px-4 py-2.5 text-emerald-800 font-bold">{q.correctAnswer}</p>
                                          </div>
                                        )}
                                        {q.type === 'Descriptive' && q.referenceAnswer && (
                                          <div>
                                            <span className="text-[8.5px] font-black text-blue-600 uppercase tracking-wider block mb-1">Model Answer / Reference</span>
                                            <p className="bg-blue-50 border border-blue-150 rounded-xl px-4 py-2.5 text-blue-800 font-bold">{q.referenceAnswer}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {ans.adminComments && (
                                      <div className="mt-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px]">
                                        <strong className="text-amber-800 font-black text-[8.5px] uppercase">Remarks: </strong>
                                        <span className="text-slate-700 font-semibold">{ans.adminComments}</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-6">
                        <div className="text-[10px] text-slate-400 space-y-0.5">
                          <p className="font-black text-slate-500 uppercase tracking-wider text-[8.5px]">Report Certification</p>
                          <p>Report ID: <strong className="text-slate-600">{reportId}</strong></p>
                          <p>Generated: {new Date().toLocaleString()}</p>
                          <p className="italic">Powered by CRM Assessment DeskSuite</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-48 h-px bg-slate-300 mb-2" />
                          <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider">Authorized Signature</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>

        <div className="px-7 py-4 bg-white border-t border-slate-100 flex justify-end shrink-0">
          <Button variant="outline" onClick={onClose} className="border-slate-200 text-slate-700 font-bold px-6 py-2.5 rounded-xl cursor-pointer">Close Portal</Button>
        </div>
      </motion.div>
    </div>
  );
};

export default AssessmentPortalModal;