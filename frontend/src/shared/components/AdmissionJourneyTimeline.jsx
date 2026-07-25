import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, X, Plus, AlertCircle, Info, Calendar, User } from 'lucide-react';
import Button from './Button';
import toast from 'react-hot-toast';

// Reusable premium HubSpot/Salesforce style Admission Journey Timeline CRM component
const AdmissionJourneyTimeline = ({
  enquiry,
  stageOptions,
  onSaveJourney,
  counselorName = 'Admin'
}) => {
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredStageIndex, setHoveredStageIndex] = useState(null);

  // Modal and Editing states
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [modalSelectedOption, setModalSelectedOption] = useState('Call'); // Call, WhatsApp, Email, Meeting, Other
  const [modalStage, setModalStage] = useState('Call');
  const [modalFollowUpDate, setModalFollowUpDate] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [editingStageIndex, setEditingStageIndex] = useState(-1);
  const [saving, setSaving] = useState(false);

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

  // Derived summaries for collapsed header view
  const activeIndex = normalizedJourney.findIndex(s => !s.completedAt);
  const activeStage = activeIndex !== -1 ? normalizedJourney[activeIndex] : null;
  const completedCount = normalizedJourney.filter(s => s.completedAt).length;
  const totalStages = normalizedJourney.length;
  const nextFollowUp = activeStage ? activeStage.followUpDate : null;
  const currentStageName = activeStage ? activeStage.stage : (normalizedJourney[normalizedJourney.length - 1]?.stage || 'Form Submitted');

  // Status Colors Mapping
  // Completed = Green, Current = Blue, Pending/Upcoming = Grey, Overdue = Red, Cancelled = Dark Red
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
  const saveNormalizedJourney = async (updatedNormalized) => {
    await onSaveJourney(updatedNormalized);
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

  return (
    <div className="space-y-4 text-left font-sans">
      {/* Clickable Accordion Header Button */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[#F8FAFC] hover:bg-slate-100/70 border border-[#E5E7EB] rounded-2xl cursor-pointer select-none transition-all duration-205"
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-sm">📍</span>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Admission Timeline
            </h4>
          </div>
          
          {/* Summary Details */}
          <div className="flex flex-wrap items-center gap-x-3 text-xs font-semibold text-slate-500">
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>Current Stage: <strong className="text-[#6D5DF6] font-bold">{currentStageName}</strong></span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>Completed: <strong className="text-slate-700 font-bold">{completedCount} / {totalStages}</strong></span>
            {nextFollowUp && (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                <span>Next Follow-up: <strong className="text-amber-600 font-bold">{new Date(nextFollowUp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</strong></span>
              </>
            )}
          </div>
        </div>

        {/* Accordion Toggle Chevron indicator */}
        <div className="flex items-center space-x-1.5 text-xs font-extrabold text-[#6D5DF6] hover:text-[#5b4ee3] shrink-0">
          <span>{isExpanded ? 'Hide Timeline' : 'View Timeline'}</span>
          <span className="text-[10px] transform transition-transform duration-200">
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Accordion Expansion Animation Wrapper */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: 'auto', marginTop: 12 },
              collapsed: { opacity: 0, height: 0, marginTop: 0 }
            }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden space-y-4"
          >
            {/* Connected Horizontal Timeline Scroller */}
            <div className="overflow-x-auto pb-3 scrollbar-thin bg-[#F8FAFC]/55 p-4.5 rounded-2xl border border-[#E5E7EB]">
              <div className="flex items-center w-max py-2 px-1">
                {normalizedJourney.map((stage, idx) => {
                  const status = getStageStatus(stage, idx);
                  const isSelected = selectedStageIndex === idx;

                  // Render filling connection line (Green if completed, Grey if pending)
                  const isLineCompleted = normalizedJourney[idx]?.completedAt;

                  return (
                    <React.Fragment key={idx}>
                      {idx > 0 && (
                        <div 
                          className={`h-1 w-14 mx-2 rounded transition-colors duration-305 ${
                            normalizedJourney[idx - 1].completedAt ? 'bg-[#22C55E]' : 'bg-[#E5E7EB]'
                          }`}
                        />
                      )}

                      {/* Circle & Label Container */}
                      <div
                        onClick={() => setSelectedStageIndex(idx)}
                        onMouseEnter={() => setHoveredStageIndex(idx)}
                        onMouseLeave={() => setHoveredStageIndex(null)}
                        className="flex flex-col items-center shrink-0 cursor-pointer relative transition-transform duration-200"
                      >
                        {/* Circle Node */}
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 font-bold relative ${
                          status === 'Completed'
                            ? 'bg-[#22C55E] border-[#22C55E] text-white shadow-xs'
                            : status === 'Current' || status === 'Overdue'
                            ? 'bg-[#6D5DF6] border-[#6D5DF6] text-white shadow-lg shadow-[#6D5DF6]/20 scale-105'
                            : 'bg-white border-[#E5E7EB] text-slate-400'
                        }`}>
                          {status === 'Completed' ? (
                            <Check className="h-4.5 w-4.5 text-white" />
                          ) : (
                            <span className="text-[10px] font-black">{idx + 1}</span>
                          )}

                          {/* Glow Overlay for Current */}
                          {(status === 'Current' || status === 'Overdue') && (
                            <span className="absolute inset-0 rounded-full border border-white/40 animate-ping opacity-75 pointer-events-none" />
                          )}
                        </div>

                        {/* Label below circle */}
                        <span className={`text-[11px] font-semibold mt-2 block whitespace-nowrap transition-colors duration-200 ${
                          isSelected ? 'text-[#6D5DF6] font-bold' : 'text-slate-700'
                        }`}>
                          {stage.stage}
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

                        {/* Interactive Tooltip on Hover */}
                        {hoveredStageIndex === idx && (
                          <div className="absolute z-35 bottom-14 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[10.5px] p-3 rounded-xl shadow-xl w-52 pointer-events-none transition-all duration-200 text-left border border-slate-700/60 leading-normal">
                            <div className="font-extrabold border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between">
                              <span className="truncate">{stage.stage}</span>
                              <span className="text-[8.5px] bg-[#6D5DF6] text-white px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">{status}</span>
                            </div>
                            <div className="space-y-1 text-slate-300 font-medium">
                              <div>📅 Created: {new Date(stage.createdAt || stage.completedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                              {stage.completedAt && <div className="text-emerald-450">✔ Completed: {new Date(stage.completedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</div>}
                              {stage.followUpDate && !stage.completedAt && <div>📞 Follow-up: {new Date(stage.followUpDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</div>}
                              {stage.notes && <div className="italic truncate border-t border-slate-800/80 pt-1 mt-1 text-slate-400">"{stage.notes}"</div>}
                            </div>
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Selected Stage Detail Panel */}
            {(() => {
              const stage = normalizedJourney[selectedStageIndex];
              if (!stage) return null;

              const status = getStageStatus(stage, selectedStageIndex);
              const isLatest = selectedStageIndex === normalizedJourney.length - 1;

              // Check if only Form Submitted exists
              const isOnlyFormSubmitted = normalizedJourney.length === 1 && normalizedJourney[0].stage === 'Form Submitted';

              if (isOnlyFormSubmitted) {
                return (
                  <div className="py-7 text-center bg-slate-50 border-2 border-dashed border-[#E5E7EB] rounded-2xl p-5 flex flex-col items-center justify-center space-y-3 shadow-xs">
                    <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-[#6D5DF6]" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-sm font-extrabold text-slate-800">Continue Admission Journey</h5>
                      <p className="text-[11px] text-slate-400 max-w-sm leading-normal">Start candidate logging by creating the first communication or interaction follow-up stage.</p>
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
                      className="bg-[#6D5DF6] hover:bg-[#5b4ee3] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-[#6D5DF6]/20 transition-all border-transparent h-9"
                    >
                      + Add First Interaction
                    </Button>
                  </div>
                );
              }

              return (
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4.5 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-5 transition-all text-left relative overflow-hidden">
                  {/* Left accent strip for current */}
                  {(status === 'Current' || status === 'Overdue') && (
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#6D5DF6]" />
                  )}

                  <div className="space-y-3.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-black text-slate-800 leading-tight">
                        {stage.stage}
                      </h5>
                      <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wide border ${
                        status === 'Completed'
                          ? 'bg-emerald-50 border-emerald-250 text-emerald-700'
                          : status === 'Current'
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : status === 'Overdue'
                          ? 'bg-red-50 border-red-200 text-red-700 animate-pulse'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        {status === 'Current' ? 'ACTIVE' : status}
                      </span>
                      {getFollowUpStatusBadge(stage)}
                    </div>

                    {/* Responsive Info Chips */}
                    <div className="flex flex-wrap gap-2 text-[10.5px]">
                      <span className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E5E7EB] px-2.5 py-1 rounded-xl text-slate-500 font-semibold">
                        <Info className="h-3.5 w-3.5 text-slate-400" />
                        Created: <strong>{new Date(stage.createdAt || stage.completedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</strong>
                      </span>
                      {stage.completedAt && (
                        <span className="flex items-center gap-1 bg-emerald-50/50 border border-emerald-150 px-2.5 py-1 rounded-xl text-emerald-700 font-semibold">
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          Completed: <strong>{new Date(stage.completedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</strong>
                        </span>
                      )}
                      {stage.followUpDate && !stage.completedAt && (
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-semibold border ${
                          status === 'Overdue' 
                            ? 'bg-red-50 border-red-200 text-red-700' 
                            : 'bg-amber-50/50 border-amber-200 text-amber-700'
                        }`}>
                          <Calendar className="h-3.5 w-3.5" />
                          Follow-up: <strong>{new Date(stage.followUpDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</strong>
                        </span>
                      )}
                      {stage.createdBy && (
                        <span className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E5E7EB] px-2.5 py-1 rounded-xl text-slate-500 font-semibold">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          Assigned To: <strong>{stage.createdBy}</strong>
                        </span>
                      )}
                    </div>

                    {/* Modern Notes Box */}
                    {stage.notes ? (
                      <div className="text-xs text-slate-600 bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E7EB] font-medium leading-relaxed">
                        {stage.notes}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic font-medium pl-1">No notes recorded for this stage interaction.</p>
                    )}
                  </div>

                  {/* Actions for Selected Stage */}
                  <div className="flex flex-wrap items-center gap-2 font-bold shrink-0 self-end md:self-start pt-1 md:pt-0">
                    {!stage.completedAt && (
                      <Button
                        variant="primary"
                        onClick={() => handleMarkComplete(selectedStageIndex)}
                        className="bg-[#6D5DF6] hover:bg-[#5b4ee3] text-white text-xs border-transparent h-9 px-4 rounded-xl shadow-xs transition-all font-extrabold"
                      >
                        Mark Complete
                      </Button>
                    )}

                    {stage.stage !== 'Form Submitted' && (
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
                        className="border-[#E5E7EB] hover:bg-slate-50 text-slate-700 h-9 px-4 text-xs rounded-xl font-extrabold transition-all"
                      >
                        Edit
                      </Button>
                    )}

                    {isLatest && selectedStageIndex > 0 ? (
                      <Button
                        variant="secondary"
                        onClick={() => handleDeleteStage(selectedStageIndex)}
                        className="border-[#E5E7EB] text-[#EF4444] hover:bg-red-50/50 h-9 px-4 text-xs rounded-xl font-extrabold transition-all hover:border-red-200"
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })()}

            {/* Add Next Stage Dashed Card */}
            {normalizedJourney.length > 1 && (
              <div 
                onClick={() => {
                  setEditingStageIndex(-1);
                  setModalSelectedOption('Call');
                  setModalStage('Call');
                  setModalFollowUpDate('');
                  setModalNotes('');
                  setTimelineModalOpen(true);
                }}
                className="group flex flex-col items-center justify-center p-4.5 bg-white hover:bg-[#F8FAFC] border-2 border-dashed border-[#E5E7EB] hover:border-[#6D5DF6] rounded-2xl cursor-pointer select-none transition-all duration-200 shadow-xs"
              >
                <div className="flex items-center space-x-2 text-xs font-extrabold text-[#6D5DF6] group-hover:scale-102 transition-transform">
                  <Plus className="h-4 w-4" />
                  <span>+ Add Next Stage</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 font-medium">Click to continue admission journey</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Timeline Stage Modal */}
      {timelineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E5E7EB] overflow-hidden my-8"
          >
            <form onSubmit={handleSaveStage}>
              <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E5E7EB] flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-[#6D5DF6]" />
                  {editingStageIndex !== -1 ? 'Edit Journey Stage' : 'Add Next Stage'}
                </h3>
                <button
                  type="button"
                  onClick={() => setTimelineModalOpen(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4.5 text-left">
                {/* Segmented Control for Interaction Types */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-650 uppercase">Interaction Type *</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {['Call', 'WhatsApp', 'Email', 'Meeting', 'Other'].map(opt => {
                      const isSelected = modalSelectedOption === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setModalSelectedOption(opt);
                            if (opt !== 'Other') {
                              setModalStage(opt);
                            } else {
                              // Default first choice among non-segmented options
                              const nonSegmented = stageOptions.filter(o => !['Call', 'WhatsApp', 'Email', 'Meeting'].includes(o));
                              setModalStage(nonSegmented[0] || 'Admission Confirmed');
                            }
                          }}
                          className={`py-2 rounded-xl text-[10.5px] font-bold border transition-all text-center ${
                            isSelected
                              ? 'bg-[#6D5DF6] border-[#6D5DF6] text-white shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/75'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dropdown for other stages if 'Other' is selected in segmented control */}
                {modalSelectedOption === 'Other' && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-1.5"
                  >
                    <label className="block text-xs font-black text-slate-650 uppercase">Select Pipeline Stage *</label>
                    <select
                      value={modalStage}
                      onChange={(e) => setModalStage(e.target.value)}
                      className="w-full bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#6D5DF6]/30 focus:bg-white transition-all font-semibold"
                      required
                    >
                      {stageOptions
                        .filter(o => !['Call', 'WhatsApp', 'Email', 'Meeting'].includes(o))
                        .map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                  </motion.div>
                )}

                {/* Follow-up Date */}
                {!['Admission Confirmed', 'Rejected', 'Closed'].includes(modalStage) && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-slate-655 uppercase">Next Follow-up Date *</label>
                    <input
                      type="date"
                      value={modalFollowUpDate}
                      onChange={(e) => setModalFollowUpDate(e.target.value)}
                      className="w-full bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#6D5DF6]/30 focus:bg-white transition-all font-semibold"
                      required
                    />
                  </div>
                )}

                {/* Modern Note Area */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-655 uppercase">Interaction Notes / Remarks</label>
                  <textarea
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    rows={3}
                    placeholder="Add notes about this interaction..."
                    className="w-full bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#6D5DF6]/30 focus:bg-white transition-all font-medium leading-relaxed"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E5E7EB] flex justify-end gap-3 font-semibold text-xs">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setTimelineModalOpen(false)}
                  className="rounded-xl h-9 px-4 font-bold border-[#E5E7EB]"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={saving}
                  className="bg-[#6D5DF6] hover:bg-[#5b4ee3] border-transparent text-white shadow-xs px-4 rounded-xl h-9 font-bold"
                >
                  Save Stage
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdmissionJourneyTimeline;
