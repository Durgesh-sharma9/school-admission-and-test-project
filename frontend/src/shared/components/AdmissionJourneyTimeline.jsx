import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, X, AlertCircle } from 'lucide-react';
import Button from './Button';
import toast from 'react-hot-toast';

// Reusable CRM Timeline component supporting dynamic stages created by the admin
const AdmissionJourneyTimeline = ({
  enquiry,
  stageOptions,
  onSaveJourney,
  counselorName = 'Admin'
}) => {
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Modal and Editing states
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [modalStage, setModalStage] = useState(stageOptions[0]);
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
    <div className="space-y-4 text-left">
      {/* Clickable Accordion Header Button */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-2xl cursor-pointer select-none transition-all duration-205"
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
            <span>Current Stage: <strong className="text-indigo-650 font-black">{currentStageName}</strong></span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>{completedCount} / {totalStages} Completed</span>
            {nextFollowUp && (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                <span>Follow-up: <strong className="text-amber-600 font-bold">{new Date(nextFollowUp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</strong></span>
              </>
            )}
          </div>
        </div>

        {/* Accordion Toggle Chevron indicator */}
        <div className="flex items-center space-x-1.5 text-xs font-extrabold text-[#4F46E5] hover:text-[#4338CA] shrink-0">
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
            <div className="overflow-x-auto pb-3 scrollbar-thin">
              <div className="flex items-center w-max py-2 px-1">
                {normalizedJourney.map((stage, idx) => {
                  const status = getStageStatus(stage, idx);
                  const isSelected = selectedStageIndex === idx;

                  // Spacing & connection line rendering (must extend from previous to next in sequence)
                  return (
                    <React.Fragment key={idx}>
                      {idx > 0 && (
                        <div 
                          className={`h-1 w-14 mx-2 rounded transition-colors duration-305 ${
                            normalizedJourney[idx - 1].completedAt ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                      )}

                      {/* Circle & Label Container */}
                      <div
                        onClick={() => setSelectedStageIndex(idx)}
                        className={`flex flex-col items-center shrink-0 cursor-pointer relative transition-transform duration-200 ${
                          isSelected ? 'scale-105' : 'hover:scale-102'
                        }`}
                      >
                        {/* Circle Node */}
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 font-bold ${
                          status === 'Completed'
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                            : status === 'Current'
                            ? 'bg-[#4F46E5] border-[#4F46E5] text-white shadow-md shadow-indigo-600/20'
                            : status === 'Overdue'
                            ? 'bg-red-500 border-red-500 text-white animate-pulse shadow-xs'
                            : status === 'Cancelled'
                            ? 'bg-rose-800 border-rose-800 text-white shadow-xs'
                            : 'bg-white border-slate-300 text-slate-400'
                        }`}>
                          {status === 'Completed' ? (
                            <Check className="h-4.5 w-4.5 text-white" />
                          ) : (
                            <span className="text-[10px] font-black">{idx + 1}</span>
                          )}
                        </div>

                        {/* Label below circle */}
                        <span className={`text-[11px] font-bold mt-2 block whitespace-nowrap ${
                          isSelected ? 'text-indigo-650 font-black' : 'text-slate-600'
                        }`}>
                          {stage.stage}
                        </span>

                        {/* Badges */}
                        {status === 'Overdue' && (
                          <span className="text-[8px] bg-red-100 text-red-700 px-1 py-0.5 rounded font-black uppercase mt-1 animate-pulse">
                            Overdue
                          </span>
                        )}
                        {status === 'Cancelled' && (
                          <span className="text-[8px] bg-rose-100 text-rose-850 px-1 py-0.5 rounded font-black uppercase mt-1">
                            Cancelled
                          </span>
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

              return (
                <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all text-left">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Selected Stage Details</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${
                        status === 'Completed'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : status === 'Current'
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : status === 'Overdue'
                          ? 'bg-red-50 border-red-200 text-red-700 animate-pulse'
                          : status === 'Cancelled'
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        {status === 'Current' ? 'Active' : status}
                      </span>
                    </div>

                    <h5 className="text-sm font-extrabold text-slate-800 leading-tight">
                      {stage.stage}
                    </h5>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-slate-500">
                      <span>📅 Created: <strong>{new Date(stage.createdAt || stage.completedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</strong></span>
                      {stage.completedAt && (
                        <span className="text-emerald-600">✔ Completed: <strong>{new Date(stage.completedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</strong></span>
                      )}
                      {stage.followUpDate && !stage.completedAt && (
                        <span className={status === 'Overdue' ? 'text-red-650 font-bold' : ''}>
                          📞 Follow-up: <strong>{new Date(stage.followUpDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                        </span>
                      )}
                      {stage.createdBy && <span>👤 Handler: <strong>{stage.createdBy}</strong></span>}
                    </div>

                    {stage.notes && (
                      <p className="text-xs text-slate-655 bg-slate-50/70 p-3 rounded-xl border border-slate-100/80 mt-2 font-semibold">
                        Notes: {stage.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions for Selected Stage */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center font-bold">
                    {!stage.completedAt && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleMarkComplete(selectedStageIndex)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs border-transparent h-9 px-3 rounded-lg shadow-xs"
                      >
                        Mark Complete
                      </Button>
                    )}

                    {stage.stage !== 'Form Submitted' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingStageIndex(selectedStageIndex);
                          setModalStage(stage.stage);
                          setModalFollowUpDate(stage.followUpDate ? new Date(stage.followUpDate).toISOString().split('T')[0] : '');
                          setModalNotes(stage.notes || '');
                          setTimelineModalOpen(true);
                        }}
                        className="border-slate-200 hover:bg-slate-50 text-slate-650 h-9 px-3 text-xs rounded-lg font-bold"
                      >
                        Edit
                      </Button>
                    )}

                    {isLatest && selectedStageIndex > 0 ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteStage(selectedStageIndex)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 h-9 px-3 text-xs rounded-lg font-bold"
                      >
                        Delete
                      </Button>
                    ) : isLatest && selectedStageIndex === 0 ? (
                      <span className="text-[10px] text-slate-400 italic font-semibold select-none">Initial stage protected</span>
                    ) : null}
                  </div>
                </div>
              );
            })()}

            {/* Add Next Step Button */}
            <div className="text-left font-bold">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingStageIndex(-1);
                  setModalStage(stageOptions[0]);
                  setModalFollowUpDate('');
                  setModalNotes('');
                  setTimelineModalOpen(true);
                }}
                className="border-dashed border-indigo-300 hover:border-indigo-400 text-indigo-700 hover:bg-indigo-50/50 text-xs font-bold rounded-xl h-10 px-4"
              >
                + Add Next Step
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Timeline Stage Modal */}
      {timelineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden my-8"
          >
            <form onSubmit={handleSaveStage}>
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-indigo-650" />
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

              <div className="p-6 space-y-4 text-left">
                {/* Stage Selection */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600 uppercase">Stage *</label>
                  <select
                    value={modalStage}
                    onChange={(e) => setModalStage(e.target.value)}
                    className="w-full bg-slate-55 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all font-semibold"
                    required
                  >
                    {stageOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Follow-up Date */}
                {!['Admission Confirmed', 'Rejected', 'Closed'].includes(modalStage) && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600 uppercase">Next Follow-up Date *</label>
                    <input
                      type="date"
                      value={modalFollowUpDate}
                      onChange={(e) => setModalFollowUpDate(e.target.value)}
                      className="w-full bg-slate-55 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all font-semibold"
                      required
                    />
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600 uppercase">Notes (Optional)</label>
                  <textarea
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    rows={3}
                    placeholder="Enter stage details, follow-up remarks..."
                    className="w-full bg-slate-55 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 font-semibold text-xs">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setTimelineModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={saving}
                  className="bg-[#4F46E5] hover:bg-[#4338CA] border-transparent text-white shadow-xs px-4"
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
