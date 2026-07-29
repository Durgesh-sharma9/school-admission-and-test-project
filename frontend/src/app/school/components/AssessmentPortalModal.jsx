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
import { motion } from 'framer-motion';
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
  const [loading, setLoading]                                 = useState(true);
  const [assignments, setAssignments]                         = useState([]);
  const [templates, setTemplates]                             = useState([]);
  const [selectedTemplate, setSelectedTemplate]               = useState('');
  const [viewState, setViewState]                             = useState('list');
  const [selectedAssignmentId, setSelectedAssignmentId]       = useState(null);
  const [activeAssignmentDetails, setActiveAssignmentDetails] = useState(null);
  const [descriptiveGrades, setDescriptiveGrades]             = useState({});
  const [gradingInProgress, setGradingInProgress]             = useState(false);
  const [pdfGenerating, setPdfGenerating]                     = useState(false);

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
    const answers        = assignment.answers || [];
    const answeredCount  = answers.filter(a => a.answerText?.trim()).length;
    const skippedCount   = Math.max(0, totalQuestions - answeredCount);
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
    const totalMarks    = assessment.totalMarks  || 0;
    const percentage    = assignment.percentage  || 0;
    const timeTaken     = assignment.timeTaken   || 0;
    const attemptRate   = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    const strongAreas    = sectionStats.filter(s => s.percentage >= 70).map(s => s.name);
    const weakAreas      = sectionStats.filter(s => s.percentage < 40).map(s => s.name);

    const durSec = (assessment.duration || 0) * 60;
    let speedLabel = 'Normal Pace';
    if (timeTaken > 0 && durSec > 0) {
      const r = timeTaken / durSec;
      if (r <= 0.4) speedLabel = 'Excellent Speed';
      else if (r <= 0.7) speedLabel = 'Good Speed';
      else if (r > 0.9) speedLabel = 'Time Intensive';
    }

    const answeredTotal = correctCount + wrongCount;
    const accuracyPct   = answeredTotal > 0 ? Math.round((correctCount / answeredTotal) * 100) : 0;
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

  const statsResult  = calculateResultStats();
  const getInitials  = (n) => n ? n.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase() : 'C';
  const reportId     = activeAssignmentDetails
    ? `RPT-${activeAssignmentDetails.assignment._id?.slice(-8).toUpperCase()}`
    : '';

  // PDF builder — pure inline hex styles, zero Tailwind / oklch, structures Page 1 (Summary Only) vs Page 2+ (Cards Only)
  const buildScorecardHTML = () => {
    if (!statsResult || !activeAssignmentDetails) return '';
    const { assessment, assignment } = activeAssignmentDetails;
    const s = statsResult;
    const submittedDate = assignment.submittedAt
      ? new Date(assignment.submittedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Pending';
    const genDate    = new Date().toLocaleString();
    const initials   = getInitials(enquiry.studentName);
    const candId     = enquiry.applicationId || enquiry.enquiryId || 'N/A';
    const courseName = enquiry.classSeeking || enquiry.courseId?.name || enquiry.class || 'N/A';

    const tot  = (s.correctCount + s.wrongCount + s.skippedCount) || 1;
    const cPct = Math.round((s.correctCount / tot) * 100);
    const wPct = Math.round((s.wrongCount   / tot) * 100);
    const sPct = 100 - cPct - wPct;

    const cardDefs = [
      { label: 'Total Questions', value: s.totalQuestions,    bg: '#eff6ff', color: '#1d4ed8' },
      { label: 'Attempted Qs',    value: s.answeredCount,     bg: '#f8fafc', color: '#475569' },
      { label: 'Correct Answers', value: s.correctCount,      bg: '#ecfdf5', color: '#047857' },
      { label: 'Wrong Answers',   value: s.wrongCount,        bg: '#fff1f2', color: '#be123c' },
      { label: 'Skipped Qs',      value: s.skippedCount,      bg: '#fffbeb', color: '#b45309' },
      { label: 'Obtained Marks',  value: s.marksObtained,     bg: '#f3e8ff', color: '#7e22ce' },
      { label: 'Maximum Marks',   value: s.totalMarks,        bg: '#eef2ff', color: '#4338ca' },
      { label: 'Percentage',      value: s.percentage + '%',  bg: '#fdf4ff', color: '#c026d3' },
      { label: 'Time Taken',      value: Math.floor(s.timeTaken/60) + 'm ' + (s.timeTaken%60) + 's', bg: '#f0f9ff', color: '#0284c7' },
    ];
    const cardsHTML = cardDefs.map(c =>
      '<div style="background:' + c.bg + ';border-radius:10px;padding:12px 14px;display:inline-block;width:154px;margin:4px;vertical-align:top;box-shadow:0 1px 3px rgba(0,0,0,.05);border:1px solid #e2e8f0;">' +
      '<div style="font-size:8.5px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px;">' + c.label + '</div>' +
      '<div style="font-size:20px;font-weight:900;color:' + c.color + ';line-height:1;">' + c.value + '</div></div>'
    ).join('');

    const secRows = s.sectionStats.map((sec, i) =>
      '<tr style="background:' + (i%2===0?'#fff':'#f8fafc') + '; border-bottom: 1px solid #e2e8f0;">' +
      '<td style="padding:9px 12px;font-weight:700;color:#1e293b;">' + sec.name + '</td>' +
      '<td style="padding:9px 12px;text-align:center;color:#475569;">' + sec.totalQuestions + '</td>' +
      '<td style="padding:9px 12px;text-align:center;color:#047857;font-weight:700;">' + sec.correct + '</td>' +
      '<td style="padding:9px 12px;text-align:center;color:#be123c;font-weight:700;">' + sec.wrong + '</td>' +
      '<td style="padding:9px 12px;text-align:center;color:#b45309;">' + sec.skipped + '</td>' +
      '<td style="padding:9px 12px;text-align:center;font-weight:750;color:#1e293b;">' + sec.marksObtained + '/' + sec.totalMarks + '</td>' +
      '<td style="padding:9px 12px;text-align:center;font-weight:900;color:#4f46e5;">' + sec.percentage + '%</td></tr>'
    ).join('');

    const insights = [
      { label: 'Accuracy Rate',   val: s.accuracyPct + '% — ' + s.accuracyLabel,                                      col:'#10b981', bg:'#ecfdf5' },
      { label: 'Attempt Ratio',   val: s.attemptRate + '% (' + s.answeredCount + '/' + s.totalQuestions + ' Qs)',              col:'#6366f1', bg:'#eff6ff' },
      { label: 'Pacing Speed',    val: s.speedLabel,                                                                        col:'#0284c7', bg:'#f0f9ff' },
      { label: 'Strong Sections', val: s.strongAreas.length ? s.strongAreas.join(', ') : 'Consistent performance',         col:'#059669', bg:'#f0fdf4' },
      { label: 'Focus Areas',     val: s.weakAreas.length   ? s.weakAreas.join(', ')   : 'No critical weak sections',      col:'#d97706', bg:'#fffbeb' },
      { label: 'Recommendation',  val: s.recommendations[0],                                                                col:'#7c3aed', bg:'#fdf4ff' },
    ];
    const insightsHTML = insights.map(it =>
      '<div style="background:' + it.bg + ';border-left:3.5px solid ' + it.col + ';border-radius:8px;padding:10px 12px;box-sizing:border-box;">' +
      '<div style="font-size:8.5px;font-weight:800;color:' + it.col + ';text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">' + it.label + '</div>' +
      '<div style="font-size:10.5px;font-weight:600;color:#334155;line-height:1.35;">' + it.val + '</div></div>'
    ).join('');

    // Precompiled Detailed review card blocks (to distribute dynamically inside iframe)
    const qCardsHTML = assessment.sections.map((sec, sI) =>
      sec.questions.map((q, qI) => {
        const a   = assignment.answers.find(x => x.sectionIndex === sI && x.questionIndex === qI) || { answerText: '', marksAwarded: 0 };
        const sk  = !a.answerText?.trim();
        const ok  = !sk && a.marksAwarded === q.marks;
        const pt  = !sk && !ok && a.marksAwarded > 0;
        const lbl = sk ? 'Skipped' : ok ? 'Correct' : pt ? 'Partial' : 'Wrong';
        const sc  = sk ? '#b45309' : ok ? '#047857' : pt ? '#1d4ed8' : '#be123c';
        const sbg = sk ? '#fffbeb' : ok ? '#ecfdf5' : pt ? '#eff6ff' : '#fff1f2';
        const swrap = sk ? 'background: #fffdf9; border: 1.5px solid #fef3c7;'
                    : ok ? 'background: #fafdfa; border: 1.5px solid #d1fae5;'
                    : pt ? 'background: #f7faff; border: 1.5px solid #dbeafe;'
                         : 'background: #fffafb; border: 1.5px solid #ffe4e6;';

        // Options
        let optsHtml = '';
        if (q.type === 'MCQ' && q.options) {
          optsHtml = '<div style="margin-top: 8px; margin-bottom: 8px;"><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">';
          q.options.forEach((optText, oIdx) => {
            const letter = String.fromCharCode(65 + oIdx);
            const isCorrectOption = letter === q.correctAnswer;
            const isSubmittedOption = letter === a.answerText;
            const isWrongSubmitted = isSubmittedOption && !isCorrectOption;

            let borderStyle = 'border: 1px solid #cbd5e1; background: #ffffff; color: #475569;';
            let badge = '';

            if (isCorrectOption) {
              borderStyle = 'border: 1.5px solid #10b981; background: #ecfdf5; color: #047857; font-weight: bold;';
              badge = ' <span style="font-size: 8.5px; font-weight: 800; color: #047857; background: #d1fae5; padding: 1px 4px; border-radius: 4px; text-transform: uppercase; margin-left: 5px;">✓ Correct</span>';
            } else if (isWrongSubmitted) {
              borderStyle = 'border: 1.5px solid #f43f5e; box-shadow: 0 0 0 2px #6366f1; background: #fff1f2; color: #be123c; font-weight: bold;';
              badge = ' <span style="font-size: 8.5px; font-weight: 800; color: #be123c; background: #ffe4e6; padding: 1px 4px; border-radius: 4px; text-transform: uppercase; margin-left: 5px;">✗ Selected Wrong</span>';
            } else if (isSubmittedOption) {
              borderStyle = 'border: 1.5px solid #6366f1; box-shadow: 0 0 0 2px #6366f1; background: #eef2ff; color: #3730a3; font-weight: bold;';
            }

            optsHtml += '<div style="border-radius: 8px; padding: 7px 9px; font-size: 10px; ' + borderStyle + '">' +
              '<strong>' + letter + '.</strong> ' + optText + badge +
              '</div>';
          });
          optsHtml += '</div></div>';
        }

        const subVal  = getAnswerDisplayValue(q, a.answerText);
        const corrVal = q.type !== 'Descriptive' ? getAnswerDisplayValue(q, q.correctAnswer) : null;

        // Visual answers block
        let ansBlock = '';
        if (q.type === 'MCQ') {
          const isSelCorrect = a.answerText === q.correctAnswer;
          ansBlock = `
            <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 8px; font-size: 10.5px;">
              <div>
                <span style="font-size: 8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 2px;">Student Selected Option</span>
                <div style="border-radius: 8px; padding: 6px 10px; font-weight: 700; ${isSelCorrect ? 'background:#ecfdf5; border:1px solid #10b981; color:#047857;' : 'background:#fff1f2; border:1px solid #f43f5e; color:#be123c;'}">
                  ${isSelCorrect ? '✔' : '☒'} Selected: ${subVal}
                </div>
              </div>
              ${!isSelCorrect ? `
              <div>
                <span style="font-size: 8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 2px;">Correct Option</span>
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 6px 10px; font-weight: 700; color: #166534;">
                  ✔ Correct: ${corrVal}
                </div>
              </div>
              ` : ''}
            </div>
          `;
        } else if (q.type === 'True / False') {
          const isTFCorrect = String(a.answerText).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
          ansBlock = `
            <div style="display: flex; gap: 8px; margin-top: 8px; font-size: 10.5px;">
              <div style="flex: 1;">
                <span style="font-size: 8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 2px;">Submitted</span>
                <div style="border-radius: 8px; padding: 6px 10px; font-weight: 700; ${isTFCorrect ? 'background:#ecfdf5; border:1px solid #10b981; color:#047857;' : 'background:#fff1f2; border:1px solid #f43f5e; color:#be123c;'}">${subVal}</div>
              </div>
              <div style="flex: 1;">
                <span style="font-size: 8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 2px;">Correct</span>
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 6px 10px; font-weight: 700; color: #166534;">${corrVal}</div>
              </div>
            </div>
          `;
        } else {
          ansBlock = `
            <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 8px; font-size: 10.5px;">
              <div>
                <span style="font-size: 8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 2px;">Submitted Answer</span>
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 10px; color: #334155; font-weight: 600; white-space: pre-wrap;">${subVal}</div>
              </div>
              ${q.type !== 'Descriptive' ? `
              <div>
                <span style="font-size: 8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 2px;">Correct Answer</span>
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 7px 10px; color: #166534; font-weight: 700;">${corrVal}</div>
              </div>
              ` : ''}
              ${q.type === 'Descriptive' && q.referenceAnswer ? `
              <div>
                <span style="font-size: 8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 2px;">Model Answer / Reference</span>
                <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 7px 10px; color: #1e40af; font-weight: 600;">${q.referenceAnswer}</div>
              </div>
              ` : ''}
            </div>
          `;
        }

        let noteHtml = '';
        if (a.adminComments) {
          noteHtml = `
            <div style="margin-top: 7px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 6px 8px; font-size: 10px; color: #451a03;">
              <strong style="font-size: 8px; font-weight: 800; text-transform: uppercase; color: #b45309;">Remarks: </strong>
              ${a.adminComments}
            </div>
          `;
        }

        return `
          <div class="q-card-block" style="border-radius: 12px; padding: 12px; margin-bottom: 12px; page-break-inside: avoid; ${swrap}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 1.5px 5px; font-weight: 900; font-size: 9px; color: #475569;">Question ${qI+1}</span>
                <span style="font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">${q.type}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="background: ${sbg}; color: ${sc}; padding: 1.5px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase;">${lbl}</span>
                <span style="font-size: 10px; font-weight: 900; color: #1e293b;">${a.marksAwarded||0}/${q.marks} Marks</span>
              </div>
            </div>
            <div style="font-size: 11px; font-weight: bold; color: #1e293b; margin-bottom: 7px; line-height: 1.35;">${q.question}</div>
            ${optsHtml}
            ${ansBlock}
            ${noteHtml}
          </div>
        `;
      }).join('')
    ).join('');

    // Precalculate SVG Donut Chart segment attributes
    const circ = 314.16; // 2 * PI * 50
    const correctOffset = 0;
    const wrongOffset = -(circ * cPct) / 100;
    const skippedOffset = -(circ * (cPct + wPct)) / 100;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Assessment Report - ${enquiry.studentName}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 0;
      font-family: Arial, Helvetica, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      -webkit-print-color-adjust: exact;
    }
    .pdf-page {
      width: 820px;
      height: 1140px;
      padding: 40px 45px;
      box-sizing: border-box;
      position: relative;
      background: #ffffff;
      margin: 0 auto 20px auto;
      box-shadow: 0 4px 10px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
    }
    table { border-collapse: collapse; width: 100%; }
    th {
      background: #f1f5f9;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: #475569;
      padding: 9px 12px;
      text-align: left;
      border-bottom: 2px solid #e2e8f0;
    }
    h2 {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: #1e293b;
      margin: 0 0 10px 0;
      padding-bottom: 6px;
      border-bottom: 2px solid #cbd5e1;
    }
    .sec { margin-bottom: 18px; }
    @media print {
      body { background: #fff; }
      .pdf-page {
        margin: 0;
        box-shadow: none;
        page-break-after: always;
      }
    }
  </style>
</head>
<body>

  <!-- PAGE 1: Assessment Summary Only -->
  <div class="pdf-page" id="page-summary">
    <div style="height: 5px; background: linear-gradient(to right, #6366f1, #a855f7, #ec4899); border-radius: 3px; margin-bottom: 15px;"></div>
    
    <!-- Top Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 38px; height: 38px; border-radius: 8px; background: linear-gradient(135deg, #6366f1, #a855f7); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; font-weight: 900;">S</div>
        <div>
          <div style="font-size: 14px; font-weight: 900; color: #1e293b;">Assessment Summary Report</div>
          <div style="font-size: 9px; color: #64748b; margin-top: 1px;">Official ERP Academic Evaluation Desk</div>
        </div>
      </div>
      <div style="text-align: right; font-size: 9.5px; color: #64748b;">
        <div style="font-weight: 800; color: #475569;">Report ID: ${reportId}</div>
        <div>Academic Session: 2026-2027</div>
        <div>Generated: ${genDate}</div>
      </div>
    </div>

    <!-- Student Info Card -->
    <div style="background: #f8fafc; border-radius: 12px; padding: 14px 16px; margin-bottom: 15px; border: 1px solid #e2e8f0; display: flex; gap: 15px; align-items: center;">
      <div style="width: 50px; height: 50px; border-radius: 10px; background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 17px; font-weight: 900; flex-shrink: 0;">${initials}</div>
      <div style="flex: 1;">
        <div style="font-size: 15px; font-weight: 900; color: #0f172a; margin-bottom: 4px;">${enquiry.studentName}</div>
        <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 10px; color: #64748b;">
          <span><strong>Enquiry ID:</strong> ${candId}</span>
          <span><strong>Class/Course:</strong> ${courseName}</span>
          <span><strong>Assessment:</strong> ${assessment.name}</span>
          <span><strong>Attempt Date:</strong> ${submittedDate}</span>
          <span><strong>Duration:</strong> ${assessment.duration} min</span>
          <span><strong>Evaluator:</strong> ${assignment.gradedBy || 'System Evaluator'}</span>
        </div>
      </div>
    </div>

    <!-- 9 Statistic Cards Grid -->
    <div class="sec">
      <h2 style="border-bottom: 1.5px solid #e2e8f0;">Performance Summary</h2>
      <div style="text-align: center; margin-top: 5px;">
        ${cardsHTML}
      </div>
    </div>

    <!-- Charts & Rings Block -->
    <div class="sec" style="background: #f8fafc; border-radius: 12px; padding: 14px; border: 1px solid #e2e8f0; margin-top: 10px;">
      <table style="width: 100%; table-layout: fixed;">
        <tr>
          <!-- SVG Progress Ring -->
          <td style="width: 50%; text-align: center; vertical-align: middle; border-right: 1px solid #e2e8f0; padding-right: 10px;">
            <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Score Distribution</div>
            <svg width="110" height="110" viewBox="0 0 120 120" style="display: block; margin: 0 auto;">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" stroke-width="12" />
              ${cPct > 0 ? `<circle cx="60" cy="60" r="50" fill="none" stroke="#10b981" stroke-width="12" stroke-dasharray="${circ * cPct / 100} 314.16" stroke-dashoffset="${correctOffset}" transform="rotate(-90 60 60)" />` : ''}
              ${wPct > 0 ? `<circle cx="60" cy="60" r="50" fill="none" stroke="#ef4444" stroke-width="12" stroke-dasharray="${circ * wPct / 100} 314.16" stroke-dashoffset="${wrongOffset}" transform="rotate(-90 60 60)" />` : ''}
              ${sPct > 0 ? `<circle cx="60" cy="60" r="50" fill="none" stroke="#f59e0b" stroke-width="12" stroke-dasharray="${circ * sPct / 100} 314.16" stroke-dashoffset="${skippedOffset}" transform="rotate(-90 60 60)" />` : ''}
              <g transform="translate(60, 65)" style="text-anchor: middle; font-family: Arial; font-weight: bold;">
                <text y="-8" style="font-size: 15px; fill: #1e293b;">${s.percentage}%</text>
                <text y="5" style="font-size: 7.5px; fill: #64748b; font-weight: normal; text-transform: uppercase;">Score</text>
              </g>
            </svg>
            <div style="display: flex; justify-content: center; gap: 10px; font-size: 9px; font-weight: bold; margin-top: 8px; color: #475569;">
              <span><span style="display:inline-block;width:7px;height:7px;background:#10b981;margin-right:3px;"></span>Correct: ${cPct}%</span>
              <span><span style="display:inline-block;width:7px;height:7px;background:#ef4444;margin-right:3px;"></span>Wrong: ${wPct}%</span>
              <span><span style="display:inline-block;width:7px;height:7px;background:#f59e0b;margin-right:3px;"></span>Skipped: ${sPct}%</span>
            </div>
          </td>

          <!-- Metrics Bars -->
          <td style="width: 50%; padding-left: 20px; vertical-align: middle;">
            <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 12px;">Exam Stats Index</div>
            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 3px;">
                <span>Attempt Rate</span><span>${s.attemptRate}%</span>
              </div>
              <div style="height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden;">
                <div style="height: 100%; width: ${s.attemptRate}%; background: #6366f1; border-radius: 99px;"></div>
              </div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 3px;">
                <span>Accuracy (on Attempted)</span><span>${s.accuracyPct}%</span>
              </div>
              <div style="height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden;">
                <div style="height: 100%; width: ${s.accuracyPct}%; background: #10b981; border-radius: 99px;"></div>
              </div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 14px;">
              <div style="flex: 1; background: #ffffff; border-radius: 6px; padding: 4px 6px; border: 1px solid #e2e8f0; font-size: 9px; text-align: center;">
                <span style="color: #64748b; display: block;">Speed Pace</span>
                <strong style="color: #1e293b; font-size: 9.5px;">${s.speedLabel}</strong>
              </div>
              <div style="flex: 1; background: #ffffff; border-radius: 6px; padding: 4px 6px; border: 1px solid #e2e8f0; font-size: 9px; text-align: center;">
                <span style="color: #64748b; display: block;">Accuracy</span>
                <strong style="color: #1e293b; font-size: 9.5px;">${s.accuracyLabel}</strong>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Section summary table -->
    <div class="sec">
      <h2 style="border-bottom: 1.5px solid #e2e8f0; margin-bottom: 8px;">Section-wise Breakdown</h2>
      <table style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr>
            <th>Section</th>
            <th style="text-align:center;">Questions</th>
            <th style="text-align:center;">Correct</th>
            <th style="text-align:center;">Wrong</th>
            <th style="text-align:center;">Skipped</th>
            <th style="text-align:center;">Marks Obtained</th>
            <th style="text-align:center;">Section %</th>
          </tr>
        </thead>
        <tbody>
          ${secRows}
        </tbody>
      </table>
    </div>

    <!-- Insights Grid -->
    <div class="sec" style="margin-top: 8px;">
      <h2 style="border-bottom: 1.5px solid #e2e8f0; margin-bottom: 8px;">Academic Insights</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
        ${insightsHTML}
      </div>
    </div>
  </div>

  <!-- Detailed cards container (dynamically structured inside the iframe script) -->
  <div id="temp-questions" style="display: none;">
    ${qCardsHTML}
  </div>

  <script>
    window.addEventListener('load', function() {
      // Pagination Algorithm
      const temp = document.getElementById('temp-questions');
      const cards = Array.from(temp.children);
      temp.parentNode.removeChild(temp);

      let currentPage = null;
      let currentHeight = 0;
      const pageHeightLimit = 955; // fits nicely within 1140px height budget
      let pageNum = 2;

      const createNewPage = () => {
        const page = document.createElement('div');
        page.className = 'pdf-page';
        page.id = 'page-' + pageNum;

        // Custom detailed review header
        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 14px;';
        header.innerHTML = '<div style="font-size: 11px; font-weight: 800; color: #6366f1; text-transform: uppercase; letter-spacing:0.06em;">Detailed Question Review</div>' +
          '<div style="font-size: 9px; font-weight: bold; color: #64748b;">${enquiry.studentName} · ${assessment.name}</div>';
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
          currentHeight = cardHeight + 45; // account for header space
        } else {
          currentHeight += cardHeight + 12; // account for gap
        }
      });

      // Append footers dynamically to all pages with standard layout
      const allPages = document.querySelectorAll('.pdf-page');
      allPages.forEach((page, idx) => {
        const footer = document.createElement('div');
        footer.style.cssText = 'position: absolute; bottom: 30px; left: 45px; right: 45px; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; font-family: sans-serif;';
        footer.innerHTML = '<span>Academic Evaluation Suite</span>' +
          '<span>Page ' + (idx + 1) + ' of ' + allPages.length + '</span>';
        page.appendChild(footer);
      });
      
      // Let html2canvas know layout is stabilized
      window.layoutComplete = true;
    });
  </script>
</body>
</html>`;
  };

  const handleDownloadPDF = async () => {
    if (!statsResult || !activeAssignmentDetails) return;
    setPdfGenerating(true);
    const toastId = toast.loading('Generating production report PDF…');
    let iframe = null;
    try {
      const html = buildScorecardHTML();
      iframe = document.createElement('iframe');
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
          scale: 2.2, useCORS: true, logging: false,
          backgroundColor: '#ffffff',
          width: 820, height: 1140, windowWidth: 820,
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
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
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${asm.status==='Completed'?'bg-emerald-50 text-emerald-700 border border-emerald-100':'bg-amber-50 text-amber-700 border border-amber-100'}`}>{asm.status}</span>
                                {asm.status==='Completed' && <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${asm.isEvaluated?'bg-indigo-50 text-indigo-700 border border-indigo-100':'bg-rose-50 text-rose-700 border border-rose-100'}`}>{asm.isEvaluated?'Evaluated':'Grading Pending'}</span>}
                              </div>
                              <h4 className="font-black text-slate-800 text-sm leading-snug">{asm.assessmentId?.name}</h4>
                              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
                                <div><span className="text-[9px] text-slate-400 block font-black uppercase tracking-wider">Duration</span><span className="font-bold text-slate-700 mt-0.5 block">{asm.assessmentId?.duration} min</span></div>
                                <div><span className="text-[9px] text-slate-400 block font-black uppercase tracking-wider">Max Marks</span><span className="font-bold text-slate-700 mt-0.5 block">{asm.assessmentId?.totalMarks}</span></div>
                              </div>
                              {asm.status==='Completed' && (
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs space-y-1">
                                  <div className="flex justify-between font-black text-slate-800"><span>Score:</span><span className="text-indigo-600">{asm.totalScore}/{asm.assessmentId?.totalMarks}</span></div>
                                  <div className="flex justify-between font-bold text-slate-400"><span>Percentage:</span><span>{asm.percentage}%</span></div>
                                </div>
                              )}
                            </div>
                            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                              {asm.status==='Pending' ? (
                                <>
                                  <button onClick={() => handleCopyTestLink(asm._id)} className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-black uppercase cursor-pointer"><Copy className="h-3.5 w-3.5 mr-1"/>Copy Link</button>
                                  <a href={`/public/test/${asm._id}`} target="_blank" rel="noreferrer" className="inline-flex items-center text-slate-500 hover:text-slate-700 font-black uppercase">Preview<ExternalLink className="h-3 w-3 ml-1"/></a>
                                </>
                              ) : !asm.isEvaluated ? (
                                <Button variant="primary" size="sm" className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black text-[11px] uppercase tracking-wider py-3.5 rounded-xl" onClick={() => loadAssignmentDetails(asm._id,'grade')}>
                                  <ClipboardCheck className="h-4 w-4 mr-1.5"/>Grade Descriptive Answers
                                </Button>
                              ) : (
                                <Button variant="secondary" size="sm" className="w-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border-none font-black text-[11px] uppercase tracking-wider py-3.5 rounded-xl transition-all" onClick={() => loadAssignmentDetails(asm._id,'view')}>
                                  <Award className="h-4 w-4 mr-1.5 text-indigo-600"/>View Scorecard Report
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
              {viewState==='grade' && activeAssignmentDetails && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <button onClick={() => setViewState('list')} className="text-xs font-black text-indigo-600 flex items-center gap-1.5 cursor-pointer hover:underline"><ArrowLeft className="w-4 h-4"/>Back to List</button>
                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">Descriptive Evaluation Form</span>
                  </div>
                  <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-5 flex gap-4 text-xs">
                    <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5"/>
                    <div><h4 className="font-black text-rose-900 mb-0.5">Manual Grading Workspace</h4><p className="text-slate-500 font-medium leading-relaxed">Objective answers are auto-scored. Review each descriptive response, allocate marks, and add feedback before finalising.</p></div>
                  </div>
                  <div className="space-y-6">
                    {activeAssignmentDetails.assessment.sections.map((sec, sIdx) => {
                      if (!sec.questions.some(q => q.type==='Descriptive')) return null;
                      return (
                        <div key={sIdx} className="space-y-4">
                          <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest flex items-center gap-1.5"><BookOpen className="w-4 h-4"/>{sec.name}</h4>
                          {sec.questions.map((q, qIdx) => {
                            if (q.type!=='Descriptive') return null;
                            const ans = activeAssignmentDetails.assignment.answers.find(a=>a.sectionIndex===sIdx&&a.questionIndex===qIdx)||{answerText:''};
                            const key = `${sIdx}-${qIdx}`;
                            const gv  = descriptiveGrades[key]||{marksAwarded:0,adminComments:''};
                            return (
                              <div key={qIdx} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                                <div className="flex justify-between flex-wrap gap-2 pb-3 border-b border-slate-100 text-[10px]">
                                  <span className="font-black text-slate-400 uppercase tracking-wider">Q{qIdx+1}</span>
                                  <span className="font-black text-slate-500 uppercase">Max: {q.marks} marks</span>
                                </div>
                                <p className="font-black text-slate-800 text-xs">{q.question}</p>
                                {q.referenceAnswer && <div className="bg-indigo-50/40 p-3 rounded-2xl border border-indigo-100/30 text-xs"><span className="font-black text-indigo-900 text-[9px] uppercase tracking-wider block">Reference Answer:</span><p className="text-slate-600 font-semibold mt-0.5">{q.referenceAnswer}</p></div>}
                                <div>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Candidate Response</span>
                                  <p className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 font-semibold text-xs whitespace-pre-wrap">{ans.answerText||'[No response submitted]'}</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                                  <div className="sm:col-span-3 space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-600 uppercase block">Marks Awarded</label>
                                    <input type="number" min="0" max={q.marks} value={gv.marksAwarded}
                                      onChange={e=>{const v=Math.min(q.marks,Math.max(0,parseFloat(e.target.value)||0));setDescriptiveGrades(p=>({...p,[key]:{...p[key],marksAwarded:v}}));}}
                                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold bg-slate-50 focus:outline-none"/>
                                  </div>
                                  <div className="sm:col-span-9 space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-600 uppercase block">Evaluator Remarks</label>
                                    <input type="text" placeholder="Add feedback..." value={gv.adminComments}
                                      onChange={e=>setDescriptiveGrades(p=>({...p,[key]:{...p[key],adminComments:e.target.value}}))}
                                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold bg-slate-50 focus:outline-none"/>
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
                      {gradingInProgress?'Saving...':'Finalise & Submit Scorecard'}
                    </Button>
                  </div>
                </div>
              )}

              {/* VIEW: SCORECARD */}
              {viewState==='view' && activeAssignmentDetails && statsResult && (() => {
                const { assessment, assignment } = activeAssignmentDetails;
                const s = statsResult;
                const submittedDate = assignment.submittedAt ? new Date(assignment.submittedAt).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}) : 'Pending';
                const circ = 2 * Math.PI * 56;
                return (
                  <div className="space-y-6 text-left">
                    {/* Action bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                      <button onClick={() => setViewState('list')} className="text-xs font-black text-indigo-600 flex items-center gap-1.5 cursor-pointer hover:underline"><ArrowLeft className="w-4 h-4"/>Back to Assessments</button>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={handleDownloadPDF} disabled={pdfGenerating} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer">
                          <Download className="w-4 h-4"/>{pdfGenerating?'Generating...':'Download PDF'}
                        </Button>
                        <Button onClick={handlePrint} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer">
                          <Printer className="w-4 h-4 text-slate-400"/>Print
                        </Button>
                        <Button onClick={() => toast('Share coming soon!')} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer">
                          <Share2 className="w-4 h-4 text-slate-400"/>Share
                        </Button>
                      </div>
                    </div>

                    {/* Scorecard Preview */}
                    <div ref={reportRef} className="space-y-7 bg-white p-6 sm:p-8 rounded-[1.75rem] border border-slate-200 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500"/>

                      {/* Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-5 pt-2">
                        <div className="flex items-start gap-4">
                          {enquiry.photo
                            ? <img src={enquiry.photo} alt={enquiry.studentName} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-md shrink-0"/>
                            : <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white font-black text-xl flex items-center justify-center shadow-lg shrink-0">{getInitials(enquiry.studentName)}</div>
                          }
                          <div>
                            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-0.5">Assessment Report</p>
                            <h2 className="text-lg font-black text-slate-900 leading-tight">{enquiry.studentName}</h2>
                            <div className="grid grid-cols-2 gap-x-5 gap-y-0.5 mt-2 text-[11px] text-slate-500 font-semibold">
                              <span><ShieldCheck className="w-3.5 h-3.5 text-slate-400 inline mr-1"/>{enquiry.applicationId||enquiry.enquiryId||'N/A'}</span>
                              <span><BookOpen className="w-3.5 h-3.5 text-slate-400 inline mr-1"/>{enquiry.classSeeking||enquiry.courseId?.name||enquiry.class||'N/A'}</span>
                              <span><FileText className="w-3.5 h-3.5 text-slate-400 inline mr-1"/>{assessment.name}</span>
                              <span><Timer className="w-3 h-3 text-slate-400 inline mr-1"/>{submittedDate}</span>
                              <span>Duration: {assessment.duration} min</span>
                              <span>By: {assignment.gradedBy||'System Evaluator'}</span>
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
                            {label:'Total Qs',   value:s.totalQuestions,   from:'from-blue-50',    to:'to-blue-100/40',    vc:'text-blue-700',    icon:<Hash         className="w-3.5 h-3.5 text-blue-400"   />},
                            {label:'Attempted',  value:s.answeredCount,    from:'from-slate-50',   to:'to-slate-100/40',   vc:'text-slate-700',   icon:<Activity     className="w-3.5 h-3.5 text-slate-400"  />},
                            {label:'Correct',    value:s.correctCount,     from:'from-emerald-50', to:'to-emerald-100/40', vc:'text-emerald-700', icon:<Check        className="w-3.5 h-3.5 text-emerald-400"/>},
                            {label:'Wrong',      value:s.wrongCount,       from:'from-rose-50',    to:'to-rose-100/40',    vc:'text-rose-700',    icon:<X            className="w-3.5 h-3.5 text-rose-400"    />},
                            {label:'Skipped',    value:s.skippedCount,     from:'from-amber-50',   to:'to-amber-100/40',   vc:'text-amber-700',   icon:<HelpCircle   className="w-3.5 h-3.5 text-amber-400"  />},
                            {label:'Obtained',   value:s.marksObtained,    from:'from-purple-50',  to:'to-purple-100/40',  vc:'text-purple-700',  icon:<Star         className="w-3.5 h-3.5 text-purple-400" />},
                            {label:'Max Marks',  value:s.totalMarks,       from:'from-indigo-50',  to:'to-indigo-100/40',  vc:'text-indigo-700',  icon:<Target       className="w-3.5 h-3.5 text-indigo-400" />},
                            {label:'Percentage', value:s.percentage+'%',   from:'from-fuchsia-50', to:'to-fuchsia-100/40', vc:'text-fuchsia-700', icon:<TrendingUp   className="w-3.5 h-3.5 text-fuchsia-400"/>},
                            {label:'Time Taken', value:Math.floor(s.timeTaken/60)+'m '+(s.timeTaken%60)+'s', from:'from-sky-50', to:'to-sky-100/40', vc:'text-sky-700', icon:<Timer className="w-3.5 h-3.5 text-sky-400"/>},
                          ].map((c,i) => (
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
                              <circle cx="64" cy="64" r="56" fill="none" stroke="#e2e8f0" strokeWidth="10"/>
                              <circle cx="64" cy="64" r="56" fill="none" stroke="#6366f1" strokeWidth="10"
                                strokeDasharray={`${circ*s.percentage/100} ${circ}`} strokeLinecap="round"/>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-black text-slate-800">{s.percentage}%</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Score</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4 flex flex-col justify-center text-xs">
                          {[{label:'Attempt Rate',pct:s.attemptRate,bar:'#6366f1'},{label:'Accuracy (of attempted)',pct:s.accuracyPct,bar:'#10b981'}].map((m,i) => (
                            <div key={i}>
                              <div className="flex justify-between font-black text-slate-700 mb-1"><span>{m.label}</span><span>{m.pct}%</span></div>
                              <div className="h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:m.pct+'%',background:m.bar}}/></div>
                            </div>
                          ))}
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            {[{label:'Speed',val:s.speedLabel},{label:'Accuracy',val:s.accuracyLabel}].map((m,i) => (
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
                                {['Section','Questions','Correct','Wrong','Skipped','Marks','Score %'].map((h,i) => (
                                  <th key={i} className={`px-4 py-3 font-black text-[9.5px] uppercase tracking-wider whitespace-nowrap ${i===0?'text-left text-slate-600':'text-center '+['text-slate-600','text-emerald-600','text-rose-600','text-amber-600','text-slate-600','text-indigo-600'][i-1]}`}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {s.sectionStats.map((sec,i) => (
                                <tr key={i} className={`border-b border-slate-100 hover:bg-indigo-50/30 transition-colors ${i%2===0?'bg-white':'bg-slate-50/40'}`}>
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
                              <Pie data={[{name:'Correct',value:s.correctCount},{name:'Wrong',value:s.wrongCount},{name:'Skipped',value:s.skippedCount}]}
                                cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                                {PIE_COLORS.map((c,i) => <Cell key={i} fill={c}/>)}
                              </Pie>
                              <Tooltip contentStyle={{fontSize:'11px',borderRadius:'10px'}}/>
                              <Legend wrapperStyle={{fontSize:'10px',fontWeight:'700'}}/>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-100">
                          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Section Marks Comparison</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={s.sectionStats} barSize={14}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                              <XAxis dataKey="name" tick={{fontSize:9,fontWeight:700}} tickLine={false} axisLine={false}/>
                              <YAxis tick={{fontSize:9}} tickLine={false} axisLine={false}/>
                              <Tooltip contentStyle={{fontSize:'11px',borderRadius:'10px'}}/>
                              <Legend wrapperStyle={{fontSize:'10px',fontWeight:'700'}}/>
                              <Bar name="Obtained" dataKey="marksObtained" fill="#6366f1" radius={[4,4,0,0]}/>
                              <Bar name="Maximum"  dataKey="totalMarks"    fill="#e2e8f0" radius={[4,4,0,0]}/>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Insights */}
                      <div>
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500"/>Performance Insights
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {[
                            {icon:<Star         className="w-4 h-4 text-emerald-500"/>, label:'Strong Areas',   val:s.strongAreas.length?s.strongAreas.join(', '):'Consistent across all sections', cls:'bg-emerald-50 border-emerald-200 text-emerald-800'},
                            {icon:<AlertTriangle className="w-4 h-4 text-amber-500" />, label:'Needs Attention', val:s.weakAreas.length?s.weakAreas.join(', '):'No critical weak areas',           cls:'bg-amber-50 border-amber-200 text-amber-800'   },
                            {icon:<Target        className="w-4 h-4 text-blue-500"  />, label:'Accuracy',       val:s.accuracyPct+'% — '+s.accuracyLabel,                                     cls:'bg-blue-50 border-blue-200 text-blue-800'      },
                            {icon:<Activity      className="w-4 h-4 text-purple-500"/>, label:'Attempt Rate',   val:s.attemptRate+'% ('+s.answeredCount+'/'+s.totalQuestions+' Qs)',               cls:'bg-purple-50 border-purple-200 text-purple-800' },
                            {icon:<Zap           className="w-4 h-4 text-sky-500"   />, label:'Speed',          val:s.speedLabel,                                                                   cls:'bg-sky-50 border-sky-200 text-sky-800'         },
                            {icon:<TrendingUp    className="w-4 h-4 text-indigo-500"/>, label:'Recommendation', val:s.recommendations[0],                                                           cls:'bg-indigo-50 border-indigo-200 text-indigo-800'},
                          ].map((it,i) => (
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
                          <FileText className="w-3.5 h-3.5 text-indigo-500"/>Detailed Question Review
                        </h3>
                        <div className="space-y-3">
                          {assessment.sections.map((sec, sIdx) => (
                            <div key={sIdx}>
                              <div className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <BookOpen className="w-3 h-3" /> {sec.name}
                              </div>
                              {sec.questions.map((q, qIdx) => {
                                const ans = assignment.answers.find(a => a.sectionIndex === sIdx && a.questionIndex === qIdx) || { answerText: '', marksAwarded: 0 };
                                const sk  = !ans.answerText?.trim();
                                const ok  = !sk && ans.marksAwarded === q.marks;
                                const pt  = !sk && !ok && ans.marksAwarded > 0;
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
                          <div className="w-48 h-px bg-slate-300 mb-2"/>
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
