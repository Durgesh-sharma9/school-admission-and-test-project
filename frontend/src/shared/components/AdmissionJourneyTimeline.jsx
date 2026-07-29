import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, X, Plus, Info, Calendar, User, GitCommit } from 'lucide-react';
import Button from './Button';
import toast from 'react-hot-toast';

// Reusable premium CRM horizontal timeline node component
const AdmissionJourneyTimeline = ({
  enquiry,
  stageOptions,
  onSaveJourney,
  counselorName = 'Admin'
}) => {
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [hoveredStageIndex, setHoveredStageIndex] = useState(null);
  const [hoveredStageRect, setHoveredStageRect] = useState(null);

  // Modal and Editing states
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [modalSelectedOption, setModalSelectedOption] = useState('Call'); // Call, WhatsApp, Email, Meeting, Other
  const [modalStage, setModalStage] = useState('Call');
  const [modalFollowUpDate, setModalFollowUpDate] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [editingStageIndex, setEditingStageIndex] = useState(-1);
  const [saving, setSaving] = useState(false);
  const [showConfirmCloseModal, setShowConfirmCloseModal] = useState(false);
  const [pendingStageData, setPendingStageData] = useState(null);
  const [showConfirmReopenModal, setShowConfirmReopenModal] = useState(false);
  const [showFinalNodePopup, setShowFinalNodePopup] = useState(false);

  // Normalize the journey list to always guarantee 'Form Submitted' is at index 0
  const getNormalizedJourney = () => {
    let rawJourney = enquiry.journey || [];
    const hasFormSubmitted = rawJourney.some(s => s.stage === 'Form Submitted');
    if (!hasFormSubmitted) {
      return [
        {
          stage: 'Form Submitted',
          status: 'Completed',
          createdAt: enquiry.createdAt || new Date(),
          completedAt: enquiry.createdAt || new Date(),
          notes: 'Form submitted successfully.',
          createdBy: 'System'
        },
        ...rawJourney
      ];
    }
    return rawJourney;
  };

  const normalizedJourney = getNormalizedJourney();

  // Set default selected stage to first incomplete stage (Active) or the last stage
  useEffect(() => {
    const activeIndex = normalizedJourney.findIndex(s => !s.completedAt);
    const defaultIndex = activeIndex !== -1 ? activeIndex : Math.max(0, normalizedJourney.length - 1);
    setSelectedStageIndex(defaultIndex);
  }, [enquiry]);

  // Derived status mappings
  const getStageStatus = (stage, index) => {
    if (stage.completedAt) {
      if (stage.status === 'Cancelled') return 'Cancelled';
      return 'Completed';
    }

    const firstIncompleteIdx = normalizedJourney.findIndex(s => !s.completedAt);

    if (index === firstIncompleteIdx) {
      if (stage.followUpDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const followUp = new Date(stage.followUpDate);
        followUp.setHours(0, 0, 0, 0);
        if (today > followUp) return 'Overdue';
      }
      if (stage.status === 'Cancelled') return 'Cancelled';
      return 'Current';
    }

    if (index > firstIncompleteIdx || firstIncompleteIdx === -1) {
      if (stage.status === 'Cancelled') return 'Cancelled';
      return 'Upcoming';
    }

    return stage.status || 'Upcoming';
  };

  // Helper to check if follow-up is today or overdue
  const getFollowUpStatusBadge = (stage) => {
    if (!stage.followUpDate || stage.completedAt) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const followUp = new Date(stage.followUpDate);
    followUp.setHours(0, 0, 0, 0);

    if (today.getTime() === followUp.getTime()) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black bg-amber-50 text-amber-700 border border-amber-200">
          TODAY
        </span>
      );
    } else if (today.getTime() > followUp.getTime()) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
          OVERDUE
        </span>
      );
    }
    return null;
  };

  // Helper to persist normalized journey list updates to parent callback
  const saveNormalizedJourney = async (updatedNormalized, journeyStatus) => {
    await onSaveJourney(updatedNormalized, journeyStatus);
  };

  // Complete active stage handler
  const handleMarkComplete = async (index) => {
    try {
      let updatedJourney = [...normalizedJourney];
      updatedJourney[index] = {
        ...updatedJourney[index],
        completedAt: new Date(),
        status: 'Completed'
      };
      await saveNormalizedJourney(updatedJourney);
      toast.success(`${updatedJourney[index].stage} marked as completed!`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to mark stage as completed');
    }
  };

  // Delete latest stage handler
  const handleDeleteStage = async (index) => {
    if (index !== normalizedJourney.length - 1) return;
    if (!window.confirm('Are you sure you want to delete this stage? Past completed history is protected.')) return;
    try {
      let updatedJourney = [...normalizedJourney];
      updatedJourney.splice(index, 1);
      await saveNormalizedJourney(updatedJourney);
      toast.success('Stage deleted successfully!');
      setSelectedStageIndex(Math.max(0, updatedJourney.length - 1));
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to delete stage');
    }
  };

  // Save new/edited stage handler
  const handleSaveStage = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEditing = editingStageIndex !== -1;
      const stageData = {
        stage: modalStage,
        followUpDate: ['Admission Confirmed', 'Rejected', 'Closed'].includes(modalStage) ? null : (modalFollowUpDate || null),
        notes: modalNotes,
        createdBy: counselorName,
        status: isEditing ? normalizedJourney[editingStageIndex].status : 'Current'
      };

      let updatedJourney = [...normalizedJourney];
      if (isEditing) {
        updatedJourney[editingStageIndex] = {
          ...updatedJourney[editingStageIndex],
          ...stageData
        };
      } else {
        updatedJourney.push({
          ...stageData,
          createdAt: new Date(),
          status: 'Current'
        });
      }

      if (['Admission Confirmed', 'Rejected', 'Closed'].includes(modalStage)) {
        setPendingStageData(updatedJourney);
        setShowConfirmCloseModal(true);
        setSaving(false);
        return;
      }

      await saveNormalizedJourney(updatedJourney);
      setTimelineModalOpen(false);
      setEditingStageIndex(-1);
      toast.success(`Stage ${isEditing ? 'updated' : 'added'} successfully!`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save stage');
    } finally {
      setSaving(false);
    }
  };

  // Append virtual "Add Node" or "Locked Node" at the end of the journey list
  const displayNodes = [
    ...normalizedJourney,
    ...(enquiry.journeyStatus === 'CLOSED' ? [{ isLockedNode: true }] : [{ isAddNode: true }])
  ];

  const closedStage = enquiry.closedStage || normalizedJourney[normalizedJourney.length - 1]?.stage || 'Closed';
  const closedOn = enquiry.closedAt ? new Date(enquiry.closedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
  const closedBy = enquiry.closedBy || 'Admin';

  const getCardTheme = () => {
    if (closedStage === 'Admission Confirmed') {
      return {
        bg: 'bg-emerald-50/30 border-emerald-200',
        text: 'text-emerald-800',
        badge: 'bg-emerald-100 border-emerald-200 text-emerald-805 font-black uppercase',
        dot: 'bg-emerald-500',
        border: 'border-emerald-100'
      };
    }
    if (closedStage === 'Rejected') {
      return {
        bg: 'bg-rose-50/30 border-rose-200',
        text: 'text-rose-850',
        badge: 'bg-rose-100 border-rose-200 text-rose-805 font-black uppercase',
        dot: 'bg-rose-500',
        border: 'border-rose-100'
      };
    }
    return {
      bg: 'bg-slate-50 border-slate-200',
      text: 'text-slate-700',
      badge: 'bg-slate-100 border-slate-200 text-slate-705 font-black uppercase',
      dot: 'bg-slate-500',
      border: 'border-slate-200'
    };
  };

  const theme = getCardTheme();

  const handleReopenJourney = async () => {
    setSaving(true);
    try {
      await saveNormalizedJourney(normalizedJourney, 'ACTIVE', null);
      setShowConfirmReopenModal(false);
      setShowFinalNodePopup(false);
      toast.success("Journey reopened successfully! Timeline unlocked.");
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to reopen journey');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 text-left font-sans relative timeline-container-ref">
      {enquiry.journeyStatus === 'CLOSED' && (
        <div className={`border rounded-xl p-5 shadow-xs transition-all ${theme.bg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-slate-800">
                  🔒 Journey Closed
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[9px] border ${theme.badge}`}>
                  {closedStage}
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Status</span>
                  <span className="font-extrabold text-slate-700 mt-0.5 block">Closed</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Final Stage</span>
                  <span className="font-extrabold text-slate-700 mt-0.5 block">{closedStage}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Closed On</span>
                  <span className="font-extrabold text-slate-700 mt-0.5 block">{closedOn}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Closed By</span>
                  <span className="font-extrabold text-slate-700 mt-0.5 block">{closedBy}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed pt-1.5 border-t border-dashed border-slate-200">
                This journey has been completed. No further stages can be added.
              </p>
            </div>

            <div className="shrink-0 text-left sm:text-right">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmReopenModal(true)}
                className="border-slate-300 hover:bg-white text-slate-700 hover:border-slate-400 px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                Reopen Journey
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Timeline Card Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        
        {/* Connected Horizontal Timeline Scroller */}
        <div className="overflow-x-auto pb-2 p-3 border-b border-slate-200">
          <div className="flex items-center w-max py-1 px-1">
          {displayNodes.map((stage, idx) => {
            const isAddNode = stage.isAddNode;
            const isLockedNode = stage.isLockedNode;

            if (isLockedNode) {
              return (
                <React.Fragment key="locked-node">
                  {idx > 0 && (
                    <div className="h-1.5 w-16 mx-3 rounded-full bg-slate-300" />
                  )}

                  {/* Locked Timeline Circle Node */}
                  <div
                    title="This journey has been closed. No further stages can be added."
                    className="flex flex-col items-center shrink-0 cursor-not-allowed relative"
                  >
                    <div className="w-8 h-8 rounded-full border-2 border-slate-300 bg-slate-100 text-slate-400 flex items-center justify-center font-bold">
                      <span className="text-xs">🔒</span>
                    </div>

                    {/* Label below circle */}
                    <span className="text-[11px] font-semibold mt-2 block whitespace-nowrap text-slate-400">
                      Timeline Locked
                    </span>
                  </div>
                </React.Fragment>
              );
            }

            if (isAddNode) {
              const previousCompleted = normalizedJourney[idx - 1]?.completedAt;

              return (
                <React.Fragment key="add-node">
                  {idx > 0 && (
                    <div 
                      className={`h-1.5 w-16 mx-3 rounded-full transition-colors duration-300 ${
                        previousCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  )}

                  {/* Add Stage Circle Node */}
                  <div
                    onClick={() => {
                      setEditingStageIndex(-1);
                      setModalSelectedOption('Call');
                      setModalStage('Call');
                      setModalFollowUpDate('');
                      setModalNotes('');
                      setTimelineModalOpen(true);
                    }}
                    onMouseEnter={(e) => {
                      setHoveredStageIndex(idx);
                      const circleEl = e.currentTarget.querySelector('div');
                      const rect = circleEl ? circleEl.getBoundingClientRect() : e.currentTarget.getBoundingClientRect();
                      setHoveredStageRect({
                        top: rect.top,
                        left: rect.left + (rect.width / 2),
                        idx
                      });
                    }}
                    onMouseLeave={() => {
                      setHoveredStageIndex(null);
                      setHoveredStageRect(null);
                    }}
                    className="flex flex-col items-center shrink-0 cursor-pointer relative transition-all duration-300 hover:scale-105"
                  >
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-indigo-500 bg-indigo-50 text-indigo-500 flex items-center justify-center font-bold relative hover:bg-indigo-100 transition-all">
                      <Plus className="h-4 w-4" />
                    </div>

                    {/* Label below circle */}
                    <span className="text-[11px] font-semibold mt-2 block whitespace-nowrap text-slate-500">
                      + Add Stage
                    </span>
                  </div>
                </React.Fragment>
              );
            }

            const isFinalStageNode = enquiry.journeyStatus === 'CLOSED' && idx === normalizedJourney.length - 1;
            const status = getStageStatus(stage, idx);
            const isSelected = selectedStageIndex === idx;

            return (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <div 
                    className={`h-1.5 w-16 mx-3 rounded-full transition-colors duration-300 ${
                      (normalizedJourney[idx - 1].completedAt || enquiry.journeyStatus === 'CLOSED') ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}

                {/* Circle & Label Container */}
                <div
                  onClick={() => {
                    setSelectedStageIndex(idx);
                    if (isFinalStageNode) {
                      setShowFinalNodePopup(true);
                    }
                  }}
                  onMouseEnter={(e) => {
                    setHoveredStageIndex(idx);
                    const circleEl = e.currentTarget.querySelector('div');
                    const rect = circleEl ? circleEl.getBoundingClientRect() : e.currentTarget.getBoundingClientRect();
                    setHoveredStageRect({
                      top: rect.top,
                      left: rect.left + (rect.width / 2),
                      idx
                    });
                  }}
                  onMouseLeave={() => {
                    setHoveredStageIndex(null);
                    setHoveredStageRect(null);
                  }}
                  className="flex flex-col items-center shrink-0 cursor-pointer relative transition-all duration-300 hover:scale-105"
                >
                  {/* Circle Node */}
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 font-bold relative ${
                    isFinalStageNode
                      ? (closedStage === 'Admission Confirmed'
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                        : closedStage === 'Rejected'
                        ? 'bg-rose-500 border-rose-500 text-white shadow-md'
                        : 'bg-slate-500 border-slate-500 text-white shadow-md')
                      : status === 'Completed'
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                      : status === 'Current' || status === 'Overdue'
                      ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-105'
                      : 'bg-white border-slate-300 text-slate-400 hover:border-slate-400'
                  }`}>
                    {isFinalStageNode ? (
                      closedStage === 'Admission Confirmed' ? (
                        <Check className="h-4 w-4 text-white" />
                      ) : closedStage === 'Rejected' ? (
                        <span className="text-[10px]">❌</span>
                      ) : (
                        <span className="text-[10px]">🔒</span>
                      )
                    ) : status === 'Completed' ? (
                      <Check className="h-4 w-4 text-white" />
                    ) : (
                      <span className="text-[10px] font-black">{idx + 1}</span>
                    )}

                    {/* Glow Overlay for Current */}
                    {!isFinalStageNode && (status === 'Current' || status === 'Overdue') && (
                      <span className="absolute inset-0 rounded-full border border-white/40 animate-ping opacity-75 pointer-events-none" />
                    )}
                  </div>

                  {/* Label below circle */}
                  <span className={`text-[11px] font-semibold mt-2 block whitespace-nowrap transition-colors duration-200 ${
                    isSelected ? 'text-indigo-600 font-bold' : 'text-slate-700'
                  }`}>
                    {isFinalStageNode ? `${stage.stage} (Final)` : stage.stage}
                  </span>

                  {stage.completedAt && (
                    <span className="text-[9px] text-slate-400 font-medium mt-0.5">
                      {new Date(stage.completedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </span>
                  )}

                  {/* Overdue/Today badges under label */}
                  {getFollowUpStatusBadge(stage) && (
                    <div className="mt-1">{getFollowUpStatusBadge(stage)}</div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Non-Clipping Absolute Positioned Tooltip */}
      {hoveredStageRect && (
        <div 
          style={{
            position: 'fixed',
            top: `${hoveredStageRect.top + 40}px`,
            left: `${hoveredStageRect.left}px`,
            transform: 'translateX(-50%)',
            zIndex: 9999
          }}
          className="bg-slate-900 text-white text-[10.5px] p-3 rounded-xl shadow-xl w-52 pointer-events-none transition-all duration-150 text-left border border-slate-700/60 leading-normal"
        >
          {(() => {
            const stage = displayNodes[hoveredStageRect.idx];
            if (!stage) return null;
            if (stage.isAddNode) {
              return (
                <>
                  <div className="font-extrabold text-[#6D5DF6]">Add Stage</div>
                  <div className="text-slate-300 mt-0.5 font-medium">Continue Admission Journey</div>
                </>
              );
            }
            const status = getStageStatus(stage, hoveredStageRect.idx);
            return (
              <>
                <div className="font-extrabold border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between">
                  <span className="truncate">{stage.stage}</span>
                  <span className="text-[8.5px] bg-[#6D5DF6] text-white px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">{status}</span>
                </div>
                <div className="space-y-1 text-slate-300 font-medium">
                  <div>📅 Created: {new Date(stage.createdAt || stage.completedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  {stage.completedAt && <div className="text-emerald-450">✔ Completed: {new Date(stage.completedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</div>}
                  {stage.followUpDate && !stage.completedAt && <div>📞 Follow-up: {new Date(stage.followUpDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</div>}
                  {stage.notes && <div className="italic truncate border-t border-slate-800/80 pt-1 mt-1 text-slate-455">"{stage.notes}"</div>}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Selected Stage Detail Panel - Inside Unified Container */}
      {(() => {
        const stage = normalizedJourney[selectedStageIndex];
        if (!stage) return null;

        const status = getStageStatus(stage, selectedStageIndex);
        const isLatest = selectedStageIndex === normalizedJourney.length - 1;

        // Check if only Form Submitted exists
        const isOnlyFormSubmitted = normalizedJourney.length === 1 && normalizedJourney[0].stage === 'Form Submitted';

        if (isOnlyFormSubmitted) {
          return (
            <div className="py-5 text-center bg-gradient-to-br from-slate-50 to-white border-t border-slate-100 p-4 flex flex-col items-center justify-center space-y-2">
              <div className="h-10 w-10 bg-indigo-100 border border-indigo-200 rounded-lg flex items-center justify-center shadow-sm">
                <Sparkles className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="space-y-0.5">
                <h5 className="text-xs font-extrabold text-slate-800">Continue Admission Journey</h5>
                <p className="text-[10px] text-slate-500 max-w-sm leading-relaxed">Start candidate logging by clicking the "+" timeline node above to record the first contact.</p>
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  setEditingStageIndex(-1);
                  setModalSelectedOption('Call');
                  setModalStage('Call');
                  setModalFollowUpDate('');
                  setModalNotes('');
                  setTimelineModalOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-4 py-2 rounded-lg shadow-sm transition-all border-transparent h-8"
              >
                + Add First Interaction
              </Button>
            </div>
          );
        }

        return (
          <div className="border-t border-slate-100">
            {/* Header with accent */}
            <div className={`px-4 py-2.5 border-b border-slate-100 flex items-center justify-between ${
              (status === 'Current' || status === 'Overdue') ? 'bg-gradient-to-r from-indigo-50 to-white' : 'bg-slate-50'
            }`}>
              <div className="flex items-center gap-2">
                <h5 className="text-xs font-black text-slate-900 leading-tight">
                  {stage.stage}
                </h5>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border ${
                  status === 'Completed'
                    ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                    : status === 'Current'
                    ? 'bg-indigo-100 border-indigo-200 text-indigo-700'
                    : status === 'Overdue'
                    ? 'bg-red-100 border-red-200 text-red-700 animate-pulse'
                    : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}>
                  {status === 'Current' ? 'ACTIVE' : status}
                </span>
                {getFollowUpStatusBadge(stage)}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Premium Info Chips */}
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <span className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-slate-600 font-semibold shadow-sm">
                  <Info className="h-3 w-3 text-slate-400" />
                  Created: <strong>{new Date(stage.createdAt || stage.completedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                </span>
                {stage.completedAt && (
                  <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg text-emerald-700 font-semibold shadow-sm">
                    <Check className="h-3 w-3 text-emerald-500" />
                    Completed: <strong>{new Date(stage.completedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                  </span>
                )}
                {stage.followUpDate && !stage.completedAt && (
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-lg font-semibold border shadow-sm ${
                    status === 'Overdue' 
                      ? 'bg-red-50 border-red-200 text-red-700' 
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>
                    <Calendar className="h-3 w-3" />
                    Follow-up: <strong>{new Date(stage.followUpDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                  </span>
                )}
                {stage.createdBy && (
                  <span className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-slate-600 font-semibold shadow-sm">
                    <User className="h-3 w-3 text-slate-400" />
                    Assigned To: <strong>{stage.createdBy}</strong>
                  </span>
                )}
              </div>

              {/* Notes Box */}
              {stage.notes ? (
                <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 font-medium leading-relaxed shadow-sm">
                  {stage.notes}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic font-medium pl-1">No notes recorded for this stage interaction.</p>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-1.5">
              {enquiry.journeyStatus !== 'CLOSED' && !stage.completedAt && (
                <Button
                  variant="primary"
                  onClick={() => handleMarkComplete(selectedStageIndex)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-[10px] border-transparent h-8 px-3 rounded-lg shadow-sm transition-all font-bold"
                >
                  Mark Complete
                </Button>
              )}

              {enquiry.journeyStatus !== 'CLOSED' && stage.stage !== 'Form Submitted' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingStageIndex(selectedStageIndex);
                    const matchedStage = stage.stage;
                    setModalStage(matchedStage);
                    // Determine segmented options selector choice
                    if (['Call', 'WhatsApp', 'Email', 'Meeting'].includes(matchedStage)) {
                      setModalSelectedOption(matchedStage);
                    } else {
                      setModalSelectedOption('Other');
                    }
                    setModalFollowUpDate(stage.followUpDate ? new Date(stage.followUpDate).toISOString().split('T')[0] : '');
                    setModalNotes(stage.notes || '');
                    setTimelineModalOpen(true);
                  }}
                  className="border-slate-300 hover:bg-white text-slate-700 h-8 px-3 text-[10px] rounded-lg font-bold transition-all"
                >
                  Edit
                </Button>
              )}

              {enquiry.journeyStatus !== 'CLOSED' && isLatest && selectedStageIndex > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => handleDeleteStage(selectedStageIndex)}
                  className="border-red-200 text-red-600 hover:bg-red-50 h-8 px-3 text-[10px] rounded-lg font-bold transition-all"
                >
                  Delete
                </Button>
              ) : null}
            </div>
          </div>
        );
      })()}
      </div>

      {/* Add / Edit Timeline Stage Modal */}
      {timelineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-xl shadow-xl border border-[#E5E7EB] overflow-hidden my-8"
          >
            <form onSubmit={handleSaveStage}>
              <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E5E7EB] flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-[#6D5DF6]" />
                  {editingStageIndex !== -1 ? 'Edit Journey Stage' : 'Add Journey Stage'}
                </h3>
                <button
                  type="button"
                  onClick={() => setTimelineModalOpen(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-left">
                {/* Selectable Stage Options Chips directly */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-600 uppercase">Select Timeline / Pipeline Stage *</label>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/50">
                    {stageOptions.filter(opt => opt !== 'Other').map(opt => {
                      const isSelected = modalStage === opt;
                      
                      let chipClass = '';
                      if (opt === 'Admission Confirmed') {
                        chipClass = isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs font-black'
                          : 'bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100 font-bold';
                      } else if (opt === 'Rejected') {
                        chipClass = isSelected
                          ? 'bg-rose-600 border-rose-600 text-white shadow-xs font-black'
                          : 'bg-rose-50 border-rose-250 text-rose-700 hover:bg-rose-100 font-bold';
                      } else if (opt === 'Closed') {
                        chipClass = isSelected
                          ? 'bg-slate-700 border-slate-700 text-white shadow-xs font-black'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/50 font-bold';
                      } else {
                        chipClass = isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50';
                      }

                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setModalStage(opt)}
                          className={`px-3 py-1.5 rounded-lg text-[10.5px] border transition-all text-center cursor-pointer ${chipClass}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Follow-up Date */}
                {!['Admission Confirmed', 'Rejected', 'Closed'].includes(modalStage) && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-600 uppercase">Next Follow-up Date *</label>
                    <input
                      type="date"
                      value={modalFollowUpDate}
                      onChange={(e) => setModalFollowUpDate(e.target.value)}
                      className="w-full bg-[#F8FAFC] rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#6D5DF6]/30 focus:bg-white transition-all font-semibold"
                      required
                    />
                  </div>
                )}

                {/* Modern Note Area */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-600 uppercase">Interaction Notes / Remarks</label>
                  <textarea
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    rows={3}
                    placeholder="Add notes about this interaction..."
                    className="w-full bg-[#F8FAFC] rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#6D5DF6]/30 focus:bg-white transition-all font-medium leading-relaxed"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E5E7EB] flex justify-end gap-3 font-semibold text-xs">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setTimelineModalOpen(false)}
                  className="rounded-lg h-8 px-3.5 font-bold border-[#E5E7EB]"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={saving}
                  className="bg-[#6D5DF6] hover:bg-[#5b4ee3] border-transparent text-white shadow-xs px-3.5 rounded-lg h-8 font-bold"
                >
                  Save Stage
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* 2. Confirmation modal for final stages */}
      <AnimatePresence>
        {showConfirmCloseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-xl shadow-xl border border-[#E5E7EB] overflow-hidden"
            >
              <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E5E7EB] flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span>Complete Journey?</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowConfirmCloseModal(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 text-left">
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  You are adding a final stage.
                </p>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  Do you also want to close this student's journey?
                </p>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-lg">
                  🔒 After closing the journey, no new stages can be added unless the journey is reopened.
                </p>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex justify-end gap-2 text-xs font-bold">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfirmCloseModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-705 hover:bg-slate-100 font-bold transition-all text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await saveNormalizedJourney(pendingStageData);
                      setShowConfirmCloseModal(false);
                      setTimelineModalOpen(false);
                      setEditingStageIndex(-1);
                      toast.success("Stage saved! Timeline remains ACTIVE.");
                    } catch (err) {
                      console.error(err);
                      toast.error(err.message || 'Failed to save stage');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="px-4 py-2 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-lg font-bold transition-all text-xs"
                >
                  Continue Journey
                </Button>
                <Button
                  type="button"
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await saveNormalizedJourney(pendingStageData, 'CLOSED', {
                        closedBy: counselorName,
                        closedAt: new Date(),
                        closedStage: pendingStageData[pendingStageData.length - 1]?.stage || modalStage
                      });
                      setShowConfirmCloseModal(false);
                      setTimelineModalOpen(false);
                      setEditingStageIndex(-1);
                      toast.success("Stage saved and timeline marked as CLOSED!");
                    } catch (err) {
                      console.error(err);
                      toast.error(err.message || 'Failed to save stage');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-900 text-white rounded-lg font-bold transition-all border-transparent text-xs"
                >
                  Close Journey
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reopen Journey Confirmation Modal */}
      <AnimatePresence>
        {showConfirmReopenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-xl shadow-xl border border-[#E5E7EB] overflow-hidden"
            >
              <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E5E7EB] flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span>Reopen Journey?</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowConfirmReopenModal(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-3 text-left">
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  This will unlock the journey and allow new stages to be added again.
                </p>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex justify-end gap-2 text-xs font-bold">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfirmReopenModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-705 hover:bg-slate-100 font-bold transition-all text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleReopenJourney}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all border-transparent text-xs"
                >
                  Reopen Journey
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Final Node Popup */}
      <AnimatePresence>
        {showFinalNodePopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-xl shadow-xl border border-[#E5E7EB] overflow-hidden text-left"
            >
              <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E5E7EB] flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span>Journey Closure Summary</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowFinalNodePopup(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Journey Status</span>
                    <span className="font-extrabold text-slate-700 mt-0.5 block">Closed</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Final Stage</span>
                    <span className="font-extrabold text-slate-700 mt-0.5 block">{closedStage}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Closed On</span>
                    <span className="font-extrabold text-slate-700 mt-0.5 block">{closedOn}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Closed By</span>
                    <span className="font-extrabold text-slate-700 mt-0.5 block">{closedBy}</span>
                  </div>
                </div>

                <div className="pt-3.5 border-t border-slate-100 space-y-1">
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Closure Notes / Reason</span>
                  <p className="text-xs text-slate-655 bg-slate-50 border border-slate-100 p-3 rounded-lg leading-relaxed italic">
                    "{normalizedJourney[normalizedJourney.length - 1]?.notes || 'No notes specified.'}"
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex justify-end gap-2 text-xs font-bold">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFinalNodePopup(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-705 hover:bg-slate-100 font-bold transition-all text-xs"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowFinalNodePopup(false);
                    setShowConfirmReopenModal(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all border-transparent text-xs"
                >
                  Reopen Journey
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdmissionJourneyTimeline;
