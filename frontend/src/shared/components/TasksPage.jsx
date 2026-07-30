import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../app/school/services/schoolApi';
import Loader from './Loader';
import Button from './Button';
import toast from 'react-hot-toast';
import CRMProfileModal from './CRMProfileModal';
import AssessmentPortalModal from '../../app/school/components/AssessmentPortalModal';
import { useAuth } from '../../app/school/contexts/AuthContext';
import {
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Plus,
  Play,
  ArrowUpRight,
  MoreVertical,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  Clock3,
  CalendarDays,
  RefreshCw,
  User,
  CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- INLINE CUSTOM CALENDAR PICKER WITH TASK STATUS DOTS ---
const CalendarPicker = ({
  rawTasks,
  selectedDate,
  setSelectedDate,
  getLocalDateString,
  onSelectComplete
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-indexed

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const blanks = Array(firstDayIndex).fill(null);
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const monthYearLabel = currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  // Scan tasks on a specific date to output indicators
  const getDayTaskIndicators = (day) => {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = rawTasks.filter(task => {
      return getLocalDateString(task.followUpDate) === dStr;
    });

    let hasOverdue = false;
    let hasPending = false;
    let hasCompleted = false;

    dayTasks.forEach(task => {
      if (task.status === 'Completed') hasCompleted = true;
      else if (task.status === 'Overdue') hasOverdue = true;
      else if (task.status === 'Pending') hasPending = true;
    });

    return { hasOverdue, hasPending, hasCompleted };
  };

  const handleDayClick = (day) => {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dStr);
    if (onSelectComplete) onSelectComplete();
  };

  return (
    <div className="w-full bg-[#FCFCFF] border border-slate-200/80 rounded-2xl p-4 font-sans text-left shadow-md">
      {/* Month switcher header */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="p-2 hover:bg-[#F5F3FF] hover:text-indigo-600 rounded-full text-slate-600 font-bold select-none cursor-pointer transition-all duration-200"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold text-slate-900 tracking-tight">{monthYearLabel}</span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-2 hover:bg-[#F5F3FF] hover:text-indigo-600 rounded-full text-slate-600 font-bold select-none cursor-pointer transition-all duration-200"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Grid of weekdays */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-[#7C8AA5] uppercase mb-3">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(w => <span key={w}>{w}</span>)}
      </div>

      {/* Grid of days */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {blanks.map((_, i) => <div key={`b-${i}`} className="h-10" />)}
        {days.map(day => {
          const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = selectedDate === dStr;
          const { hasOverdue, hasPending, hasCompleted } = getDayTaskIndicators(day);
          
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          const isToday = dStr === todayStr;

          return (
            <button
              type="button"
              key={day}
              onClick={() => handleDayClick(day)}
              className={`h-10 w-full rounded-xl flex flex-col justify-between items-center py-1.5 transition-all duration-200 text-xs font-bold relative cursor-pointer ${
                isSelected 
                  ? 'bg-gradient-to-br from-[#6D5DF6] to-[#4F46E5] text-white border-2 border-[#6D5DF6] shadow-lg shadow-indigo-500/30 scale-105' 
                  : isToday 
                  ? 'bg-[#EEF5FF] border-2 border-[#3B82F6] text-[#3B82F6] hover:bg-[#F5F3FF]'
                  : 'hover:bg-[#F5F3FF] text-slate-700 hover:shadow-sm'
              }`}
            >
              <span>{day}</span>
              
              {/* Colored indicators row */}
              <div className="flex gap-1 justify-center items-center h-2 w-full">
                {hasOverdue && <span className={`h-2 w-2 rounded-full ${isSelected ? 'bg-white' : 'bg-[#EF4444]'}`} title="Overdue tasks" />}
                {hasPending && <span className={`h-2 w-2 rounded-full ${isSelected ? 'bg-white' : 'bg-[#3B82F6]'}`} title="Pending tasks" />}
                {hasCompleted && <span className={`h-2 w-2 rounded-full ${isSelected ? 'bg-white' : 'bg-[#22C55E]'}`} title="Completed tasks" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const TasksPage = ({ module = 'school' }) => {
  const navigate = useNavigate();
  const { school } = useAuth();
  const currentUser = school?.name || school?.email || 'Admin';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  // Active KPI card filter tracker
  const [activeKpi, setActiveKpi] = useState('all');

  // Filters State
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('today'); // today, today_only, tomorrow, week, custom, all
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // default to all - completed tasks must stay visible

  // Custom Selected Date state
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Modals State
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleTask, setRescheduleTask] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('10:00');

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteTask, setNoteTask] = useState(null);
  const [noteText, setNoteText] = useState('');

  // CRM Profile Modal State
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedProfileTask, setSelectedProfileTask] = useState(null);
  const [selectedEnquiryForAssessment, setSelectedEnquiryForAssessment] = useState(null);

  // Helper date format YYYY-MM-DD
  function getLocalDateString(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Fetch data function
  const fetchData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const url = module === 'school' ? '/enquiries' : '/college/applications';
      const params = module === 'school' ? { limit: 10000 } : {};
      const response = await api.get(url, { params });
      
      if (response.success) {
        setItems(response.data || []);
        if (isManualRefresh) {
          toast.success('CRM work queue refreshed successfully!');
        }
      } else {
        toast.error('Failed to load tasks database');
      }
    } catch (err) {
      toast.error(err.message || 'Connection error retrieving records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [module]);

  // Map raw data elements into unified CRM Tasks
  const rawTasks = useMemo(() => {
    const tasks = [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    items.forEach((item) => {
      const journey = item.journey || [];
      journey.forEach((stage) => {
        if (stage.followUpDate) {
          const followUpTime = new Date(stage.followUpDate);
          const isCompleted = !!stage.completedAt || stage.status === 'Completed';
          // Backend status enum: 'Current', 'Upcoming', 'Completed', 'Cancelled', 'Overdue'
          // 'Current' and 'Upcoming' are the "pending" states from backend
          const isCancelled = stage.status === 'Cancelled';
          
          let derivedStatus = 'Pending'; // display label
          if (isCompleted) {
            derivedStatus = 'Completed';
          } else if (isCancelled) {
            derivedStatus = 'Cancelled';
          } else if (followUpTime < startOfToday && stage.status !== 'Completed' && stage.status !== 'Cancelled') {
            derivedStatus = 'Overdue';
          }

          // Derive priority from stage name and notes keywords
          let derivedPriority = 'Medium';
          const stageLower = (stage.stage || '').toLowerCase();
          const noteLower = (stage.notes || '').toLowerCase();

          if (
            stageLower.includes('fee') ||
            stageLower.includes('confirm') ||
            stageLower.includes('regist') ||
            noteLower.includes('urgent') ||
            noteLower.includes('critical') ||
            noteLower.includes('high') ||
            noteLower.includes('asap')
          ) {
            derivedPriority = 'High';
          } else if (noteLower.includes('low') || noteLower.includes('chill') || noteLower.includes('later')) {
            derivedPriority = 'Low';
          }

          tasks.push({
            id: `${item._id}-${stage._id}`,
            stageId: stage._id,
            itemId: item._id,
            enquiryId: item.enquiryId || item.applicationId || '—',
            studentName: item.studentName || 'Unnamed Student',
            parentName: item.parentName || item.guardianName || '—',
            phone: item.mobile || item.parentMobile || '—',
            email: item.email || '—',
            stage: stage.stage,
            notes: stage.notes || '',
            createdBy: stage.createdBy || 'Admin',
            followUpDate: stage.followUpDate,
            completedAt: stage.completedAt,
            status: derivedStatus,
            priority: derivedPriority,
            rawItem: item,
            rawStage: stage
          });
        }
      });
    });

    return tasks;
  }, [items]);

  // Compute Dashboard Metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const endOfTomorrow = new Date(endOfToday.getTime() + 24 * 60 * 60 * 1000);

    let todayCount = 0;
    let tomorrowCount = 0;
    let overdueCount = 0;
    let pendingCount = 0;
    let completedCount = 0;
    let totalCount = 0;

    rawTasks.forEach((task) => {
      const taskDate = new Date(task.followUpDate);
      totalCount++;

      if (task.status === 'Completed') {
        completedCount++;
      } else if (task.status === 'Cancelled') {
        // not counted in pending
      } else {
        pendingCount++;
        if (task.status === 'Overdue') {
          overdueCount++;
        } else if (taskDate >= startOfToday && taskDate <= endOfToday) {
          todayCount++;
        } else if (taskDate >= startOfTomorrow && taskDate <= endOfTomorrow) {
          tomorrowCount++;
        }
      }
    });

    return { todayCount, tomorrowCount, overdueCount, pendingCount, completedCount, totalCount };
  }, [rawTasks]);

  // Clicking KPI summary card directly toggles filtration
  const handleKpiClick = (kpiName) => {
    if (activeKpi === kpiName) {
      setActiveKpi('all');
      setDateFilter('today');
      setStatusFilter('all');
      setTypeFilter('all');
      setSelectedDate(null);
    } else {
      setActiveKpi(kpiName);
      setSelectedDate(null);
      if (kpiName === 'today') {
        setDateFilter('today');
        setStatusFilter('pending');
        setTypeFilter('all');
      } else if (kpiName === 'tomorrow') {
        setDateFilter('tomorrow');
        setStatusFilter('pending');
        setTypeFilter('all');
      } else if (kpiName === 'overdue') {
        setStatusFilter('overdue');
        setDateFilter('all');
        setTypeFilter('all');
      } else if (kpiName === 'pending') {
        setStatusFilter('pending');
        setDateFilter('all');
        setTypeFilter('all');
      } else if (kpiName === 'completed') {
        setStatusFilter('completed');
        setDateFilter('all');
        setTypeFilter('all');
      } else if (kpiName === 'total') {
        setStatusFilter('all');
        setDateFilter('all');
        setTypeFilter('all');
      }
    }
  };

  // Compile active task list applying search & filters
  const filteredTasks = useMemo(() => {
    const todayStr = getLocalDateString(new Date());
    const tomorrowStr = getLocalDateString(new Date(Date.now() + 24 * 60 * 60 * 1000));
    
    // Find week boundaries
    const today = new Date();
    const dayOfWeek = today.getDay();
    const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const mondayStr = getLocalDateString(new Date(today.getTime() + distanceToMon * 24 * 60 * 60 * 1005));
    const sundayStr = getLocalDateString(new Date(today.getTime() + (distanceToMon + 6) * 24 * 60 * 60 * 1005));

    return rawTasks
      .filter((task) => {
        // 1. Search text filter
        if (search) {
          const sLower = search.toLowerCase();
          const matchSearch =
            task.studentName.toLowerCase().includes(sLower) ||
            task.parentName.toLowerCase().includes(sLower) ||
            task.phone.toLowerCase().includes(sLower) ||
            task.enquiryId.toLowerCase().includes(sLower) ||
            (task.notes || '').toLowerCase().includes(sLower);
          if (!matchSearch) return false;
        }

        // 2. Date Filtering
        if (selectedDate) {
          const taskDateStr = getLocalDateString(task.followUpDate);
          if (selectedDate === todayStr) {
            // Show today's tasks, overdue tasks, AND completed tasks that were due today
            if (taskDateStr !== todayStr && task.status !== 'Overdue') return false;
          } else {
            // Show strictly tasks for the selected date (including completed ones for that date)
            if (taskDateStr !== selectedDate) return false;
          }
        } else {
          // Standard dropdown date filter
          const taskDate = new Date(task.followUpDate);
          if (dateFilter === 'today') {
            const taskDateStr = getLocalDateString(task.followUpDate);
            // Include: today's tasks + overdue tasks
            if (taskDateStr !== todayStr && task.status !== 'Overdue') return false;
          } else if (dateFilter === 'today_only') {
            const taskDateStr = getLocalDateString(task.followUpDate);
            // Include ONLY today's tasks — no overdue, no other dates
            if (taskDateStr !== todayStr) return false;
          } else if (dateFilter === 'tomorrow') {
            const taskDateStr = getLocalDateString(task.followUpDate);
            if (taskDateStr !== tomorrowStr) return false;
          } else if (dateFilter === 'week') {
            const taskDateStr = getLocalDateString(task.followUpDate);
            if ((taskDateStr < mondayStr || taskDateStr > sundayStr) && task.status !== 'Overdue') return false;
          } else if (dateFilter === 'custom') {
            if (customStartDate) {
              const limitStart = new Date(customStartDate);
              limitStart.setHours(0, 0, 0, 0);
              if (taskDate < limitStart) return false;
            }
            if (customEndDate) {
              const limitEnd = new Date(customEndDate);
              limitEnd.setHours(23, 59, 59, 999);
              if (taskDate > limitEnd) return false;
            }
          }
        }

        // 4. Task Type Filter
        if (typeFilter !== 'all') {
          const stageLower = task.stage.toLowerCase();
          if (typeFilter === 'call' && !stageLower.includes('call')) return false;
          if (typeFilter === 'follow-up' && !stageLower.includes('follow-up') && !stageLower.includes('followup')) return false;
          if (typeFilter === 'meeting' && !stageLower.includes('meeting') && !stageLower.includes('visit') && !stageLower.includes('counsel')) return false;
          if (typeFilter === 'whatsapp' && !stageLower.includes('whatsapp')) return false;
          if (typeFilter === 'email' && !stageLower.includes('email')) return false;
          if (typeFilter === 'document' && !stageLower.includes('doc')) return false;
          if (typeFilter === 'counselling' && !stageLower.includes('counsel')) return false;
          if (typeFilter === 'registration' && !stageLower.includes('regist')) return false;
          if (typeFilter === 'admission' && !stageLower.includes('admiss')) return false;
        }

        // 5. Status Filter
        if (statusFilter === 'pending') {
          if (task.status === 'Completed' || task.status === 'Cancelled') return false;
        } else if (statusFilter === 'completed') {
          if (task.status !== 'Completed') return false;
        } else if (statusFilter === 'cancelled') {
          if (task.status !== 'Cancelled') return false;
        } else if (statusFilter === 'overdue') {
          if (task.status !== 'Overdue') return false;
        }

        return true;
      })
      // Custom Sorting Order: Overdue first -> Today's Pending -> Completed Today -> Others
      .sort((a, b) => {
        const getSortWeight = (task) => {
          if (task.status === 'Overdue') return 0;
          
          const taskDate = getLocalDateString(task.followUpDate);
          const isToday = taskDate === todayStr;
          if (task.status === 'Pending' && isToday) return 1;

          if (task.status === 'Completed') {
            if (task.completedAt) {
              const compDateStr = getLocalDateString(task.completedAt);
              if (compDateStr === todayStr) return 2;
            }
            return 4; // Other completed
          }
          return 3; // Future pending
        };

        const wA = getSortWeight(a);
        const wB = getSortWeight(b);
        if (wA !== wB) return wA - wB;

        return new Date(a.followUpDate) - new Date(b.followUpDate);
      });
  }, [rawTasks, search, dateFilter, customStartDate, customEndDate, typeFilter, statusFilter, selectedDate]);

  // Bulk actions handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredTasks.map((t) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (actionType) => {
    if (selectedIds.length === 0) return;
    const toastId = toast.loading(`Performing bulk update on ${selectedIds.length} tasks...`);
    try {
      const selectedTasks = rawTasks.filter((t) => selectedIds.includes(t.id));
      
      for (const task of selectedTasks) {
        const newStatus = actionType === 'complete' ? 'Completed' : 'Cancelled';
        const completedAt = new Date();
        const followUpDate = task.followUpDate;
        
        await updateTaskDatabase(task, newStatus, completedAt, followUpDate, task.notes);
      }

      toast.success(`Successfully updated ${selectedIds.length} tasks!`, { id: toastId });
      setSelectedIds([]);
      fetchData();
    } catch (err) {
      toast.error('Bulk action failed: ' + (err.message || 'unknown error'), { id: toastId });
    }
  };

  // Helper database save runner with optimistic updates
  const updateTaskDatabase = async (task, newStatus, completedAt, followUpDate, notes) => {
    const updatedJourney = task.rawItem.journey.map((stage) => {
      if (stage._id === task.stageId) {
        return {
          ...stage,
          status: newStatus,
          completedAt,
          followUpDate,
          notes
        };
      }
      return stage;
    });

    const url = module === 'school'
      ? `/enquiries/${task.itemId}`
      : `/college/applications/${task.itemId}/stage`;

    const payload = { journey: updatedJourney };

    // Optimistic UI updates
    setItems((prev) =>
      prev.map((item) => {
        if (item._id === task.itemId) {
          return {
            ...item,
            journey: updatedJourney
          };
        }
        return item;
      })
    );

    const response = await api.put(url, payload);
    if (response.success) {
      setItems((prev) => prev.map((item) => (item._id === task.itemId ? response.data : item)));
    }

    // Trigger Navbar count update live!
    window.dispatchEvent(new CustomEvent('crm-tasks-updated'));
  };

  const handleSaveJourney = async (itemId, updatedJourney, journeyStatus, closedMetadata) => {
    const url = module === 'school'
      ? `/enquiries/${itemId}`
      : `/college/applications/${itemId}/stage`;

    const payload = { journey: updatedJourney };
    if (journeyStatus) payload.journeyStatus = journeyStatus;
    if (closedMetadata) {
      payload.closedBy = closedMetadata.closedBy;
      payload.closedAt = closedMetadata.closedAt;
      payload.closedStage = closedMetadata.closedStage;
    } else if (journeyStatus === 'ACTIVE') {
      payload.closedBy = '';
      payload.closedAt = null;
      payload.closedStage = '';
    }

    // Optimistic UI updates
    setItems((prev) =>
      prev.map((item) => {
        if (item._id === itemId) {
          return {
            ...item,
            journey: updatedJourney,
            journeyStatus: journeyStatus || item.journeyStatus
          };
        }
        return item;
      })
    );

    try {
      const response = await api.put(url, payload);
      if (response.success) {
        setItems((prev) => prev.map((item) => (item._id === itemId ? response.data : item)));
        if (selectedProfileTask && selectedProfileTask.itemId === itemId) {
          setSelectedProfileTask((prev) => ({
            ...prev,
            rawItem: response.data
          }));
        }
        toast.success('Journey updated successfully');
        window.dispatchEvent(new CustomEvent('crm-tasks-updated'));
      } else {
        toast.error('Failed to update journey');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update journey');
    }
  };

  // Reschedule Task handler
  const handleRescheduleSubmit = async () => {
    if (!rescheduleTask || !rescheduleDate) return;
    const toastId = toast.loading('Rescheduling task...');
    try {
      const combinedDateStr = `${rescheduleDate}T${rescheduleTime}:00`;
      const newFollowUpDate = new Date(combinedDateStr);
      
      await updateTaskDatabase(rescheduleTask, 'Current', null, newFollowUpDate, rescheduleTask.notes);
      toast.success('Task rescheduled successfully!', { id: toastId });
      setRescheduleOpen(false);
      setRescheduleTask(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to reschedule task: ' + err.message, { id: toastId });
    }
  };

  // Add notes handler
  const handleNoteSubmit = async () => {
    if (!noteTask) return;
    const toastId = toast.loading('Saving notes...');
    try {
      await updateTaskDatabase(
        noteTask,
        noteTask.rawStage.status,
        noteTask.rawStage.completedAt,
        noteTask.rawStage.followUpDate,
        noteText
      );
      toast.success('Notes updated successfully!', { id: toastId });
      setNoteOpen(false);
      setNoteTask(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to update notes: ' + err.message, { id: toastId });
    }
  };

  // Single Quick Complete
  const handleQuickComplete = async (task) => {
    const toastId = toast.loading('Marking task completed...');
    try {
      await updateTaskDatabase(task, 'Completed', new Date(), task.followUpDate, task.notes);
      toast.success('Task marked completed!', { id: toastId });
      fetchData();
    } catch (err) {
      toast.error('Action failed: ' + err.message, { id: toastId });
    }
  };

  // Single Quick Reopen / Undo Complete
  const handleUndoComplete = async (task) => {
    const toastId = toast.loading('Reopening task...');
    try {
      // Send 'Current' — the correct backend enum value for a pending/active stage
      await updateTaskDatabase(task, 'Current', null, task.followUpDate, task.notes);
      toast.success('Task marked pending!', { id: toastId });
      fetchData();
    } catch (err) {
      toast.error('Action failed: ' + err.message, { id: toastId });
    }
  };

  // Single Quick Skip
  const handleQuickSkip = async (task) => {
    if (!window.confirm('Are you sure you want to skip/cancel this task?')) return;
    const toastId = toast.loading('Skipping task...');
    try {
      await updateTaskDatabase(task, 'Cancelled', new Date(), task.followUpDate, task.notes);
      toast.success('Task skipped!', { id: toastId });
      fetchData();
    } catch (err) {
      toast.error('Action failed: ' + err.message, { id: toastId });
    }
  };

  // Redirection Actions
  const handleCallAction = (e, phone) => {
    e.stopPropagation();
    window.location.href = `tel:${phone}`;
    toast.success(`Dialing: ${phone}`);
  };

  const handleWhatsAppAction = (e, phone, studentName, parentName, enquiryId) => {
    e.stopPropagation();
    const text = `Dear ${parentName}, thank you for your admission enquiry for ${studentName} (ID: ${enquiryId}). We would love to discuss the details. Regards.`;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
    toast.success('WhatsApp chat opened!');
  };

  const handleEmailAction = (e, email, studentName) => {
    e.stopPropagation();
    const body = `Dear parent,\n\nThis is a follow-up email regarding ${studentName}'s admission registration enquiry.\n\nRegards,\nAdmission Desk`;
    window.open(`mailto:${email}?subject=Admission Follow-up&body=${encodeURIComponent(body)}`, '_self');
    toast.success('Email composer launched!');
  };

  const handleOpenTimeline = (e, task) => {
    e.stopPropagation();
    const path = module === 'school'
      ? `/enquiries?expand=${task.itemId}`
      : `/college/applications?expand=${task.itemId}`;
    navigate(path);
  };

  const handleViewProfileClick = (task) => {
    setSelectedProfileTask(task);
    setProfileModalOpen(true);
  };

  // Export filtered tasks as CSV
  const handleExportCSV = () => {
    if (filteredTasks.length === 0) {
      toast.error('No tasks found to export.');
      return;
    }
    const headers = ['Task Type', 'Student Name', 'Parent Name', 'Phone', 'Email', 'Reference ID', 'Due Date', 'Notes', 'Created By', 'Status'];
    const rows = filteredTasks.map((t) => [
      t.stage,
      t.studentName,
      t.parentName,
      t.phone,
      t.email,
      t.enquiryId,
      new Date(t.followUpDate).toLocaleString(),
      t.notes.replace(/,/g, ' '),
      t.createdBy,
      t.status
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${module}_crm_tasks.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV export complete!');
  };

  const getOverdueDays = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);
    const diff = today.getTime() - due.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days}d overdue` : 'Overdue';
  };

  // Stage Options Lists
  const schoolStages = ['Call', 'WhatsApp', 'Email', 'Meeting', 'Campus Visit', 'Documents Requested', 'Documents Submitted', 'Registration Fee', 'Admission Confirmed', 'Rejected', 'Closed', 'Other'];
  const collegeStages = ['Call', 'WhatsApp', 'Email', 'Meeting', 'Documents Requested', 'Documents Submitted', 'Counselling Session', 'Department Discussion', 'Course Selection', 'Scholarship Discussion', 'Admission Confirmed', 'Rejected', 'Closed', 'Other'];
  const currentStageOptions = module === 'school' ? schoolStages : collegeStages;

  // Task Priority badge class helper (Overdue: Red, Today: Blue, Tomorrow: Orange, Completed: Green)
  const getPriorityStyleBadge = (task) => {
    if (task.status === 'Completed') {
      return {
        text: 'Completed',
        classes: 'bg-emerald-50 text-emerald-700 border-emerald-250'
      };
    }
    
    if (task.status === 'Overdue') {
      return {
        text: getOverdueDays(task.followUpDate),
        classes: 'bg-rose-50 text-rose-700 border-rose-250 animate-pulse font-extrabold'
      };
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const endOfTomorrow = new Date(endOfToday.getTime() + 24 * 60 * 60 * 1000);

    const taskDate = new Date(task.followUpDate);
    const taskDateStr = getLocalDateString(task.followUpDate);
    const todayStr = getLocalDateString(now);
    const tomorrowStr = getLocalDateString(startOfTomorrow);

    if (taskDateStr === todayStr) {
      return {
        text: 'Today',
        classes: 'bg-blue-50 text-blue-700 border-blue-250'
      };
    }

    if (taskDateStr === tomorrowStr) {
      return {
        text: 'Tomorrow',
        classes: 'bg-amber-50 text-amber-700 border-amber-250'
      };
    }

    return {
      text: 'Pending',
      classes: 'bg-indigo-50 text-indigo-755 border-indigo-250'
    };
  };

  // Task type icon helper
  const getTaskTypeIcon = (stage) => {
    const s = (stage || '').toLowerCase();
    if (s.includes('call')) return '📞';
    if (s.includes('whatsapp')) return '💬';
    if (s.includes('email')) return '📧';
    if (s.includes('meeting') || s.includes('visit') || s.includes('counsel')) return '📅';
    if (s.includes('doc')) return '📄';
    if (s.includes('follow')) return '📝';
    if (s.includes('regist') || s.includes('fee')) return '💳';
    if (s.includes('admiss') || s.includes('confirm')) return '🎓';
    return '📌';
  };

  return (
    <div className="max-w-[1400px] mx-auto text-left">

      {/* 1. PAGE HEADER (No Card) */}
      <div className="mb-6 mt-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-0.5">
            <h1 className="text-[24px] font-bold text-[#1F2937] tracking-tight leading-[1.2] flex items-center gap-2">
              <CheckSquare className="h-6 w-6 text-[#E91E63]" />
              {selectedDate ? `Tasks for ${new Date(selectedDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}` : "Today's CRM Work Queue"}
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(null)}
                  className="ml-2 text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer border border-rose-100"
                  title="Clear Date"
                >
                  Clear Date <X className="h-3 w-3" />
                </button>
              )}
            </h1>
            <p className="text-[#64748B] text-[15px] font-medium mt-1.5">
              Everything requiring action today in one place.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setCalendarOpen(true)}
              className="inline-flex items-center px-4.5 h-[36px] bg-[#E91E63] hover:bg-[#E91E63]/90 text-white rounded-[12px] text-[11px] font-bold transition-all shadow-xs gap-1.5 cursor-pointer"
              title="Change Date"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>{selectedDate ? new Date(selectedDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Change Date'}</span>
            </button>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="inline-flex items-center px-4.5 h-[36px] bg-white hover:bg-slate-50 text-slate-700 border border-[#E8ECF3] rounded-[12px] text-[11px] font-bold transition-all shadow-[0_3px_10px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 gap-1.5 disabled:opacity-50 cursor-pointer"
              title="Refresh List"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center px-4.5 h-[36px] bg-[#E91E63] hover:bg-[#E91E63]/90 text-white rounded-[12px] text-[11px] font-bold transition-all shadow-xs gap-1.5 cursor-pointer"
              title="Export CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. FILTER CARD (Rounded-2xl, soft shadow, matching Enquiries filters) */}
      <div className="bg-white rounded-[18px] border border-[#E8ECF3] p-4 shadow-[0_10px_28px_rgba(15,23,42,0.08)] space-y-3 mb-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-[10px] uppercase tracking-wider">
            <Filter className="h-4 w-4 text-slate-500" />
            <span>Work Queue Filters</span>
          </div>
          <button
            onClick={() => {
              setActiveKpi('all');
              setDateFilter('today');
              setTypeFilter('all');
              setStatusFilter('all');
              setSearch('');
              setSelectedDate(null);
            }}
            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* Search Box */}
          <div className="text-left space-y-1">
            <label className="block text-[10px] font-bold text-slate-455 uppercase">Search Record</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Student, Parent, Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-[#E9EAF0] text-xs font-semibold focus:outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/15 transition-all text-slate-850"
              />
              <Search className="absolute left-2.5 top-3 h-3.5 w-3.5 text-[#94A3B8]" />
            </div>
          </div>

          {/* Due Date Selector */}
          <div className="text-left space-y-1">
            <label className="block text-[10px] font-bold text-slate-455 uppercase">Due Date</label>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setSelectedDate(null); // Clear calendar selection when choosing standard dropdown
              }}
              className="w-full px-3 py-2 bg-white border border-[#E9EAF0] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/15 text-slate-750 cursor-pointer shadow-[0_4px_14px_rgba(15,23,42,0.05)]"
            >
              <option value="today">Today + Overdue</option>
              <option value="today_only">Today Only</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="week">Next 7 Days</option>
              <option value="all">All Dates</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Task Type */}
          <div className="text-left space-y-1">
            <label className="block text-[10px] font-bold text-slate-455 uppercase">Task Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E9EAF0] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/15 text-slate-755 cursor-pointer shadow-[0_4px_14px_rgba(15,23,42,0.05)]"
            >
              <option value="all">All Types</option>
              <option value="call">Calls</option>
              <option value="follow-up">Follow-ups</option>
              <option value="meeting">Meetings / Visits</option>
              <option value="whatsapp">WhatsApp Chats</option>
              <option value="email">Emails</option>
              <option value="document">Documents</option>
              {module === 'college' && <option value="counselling">Counselling</option>}
              <option value="registration">Registration / Fee</option>
              <option value="admission">Admissions</option>
            </select>
          </div>

          {/* Status */}
          <div className="text-left space-y-1">
            <label className="block text-[10px] font-bold text-slate-455 uppercase">Task Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E9EAF0] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/15 text-slate-755 cursor-pointer shadow-[0_4px_14px_rgba(15,23,42,0.05)]"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Custom date range selection */}
        {dateFilter === 'custom' && (
          <div className="grid grid-cols-2 gap-4 max-w-md pt-2 border-t border-slate-100">
            <div className="text-left space-y-1">
              <label className="text-[9px] font-bold text-slate-450 uppercase">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E9EAF0] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/15 transition-all text-slate-750"
              />
            </div>
            <div className="text-left space-y-1">
              <label className="text-[9px] font-bold text-slate-455 uppercase">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E9EAF0] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/15 transition-all text-slate-750"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bulk actions block */}
      {selectedIds.length > 0 && (
        <div className="bg-pink-50/70 border border-pink-100 rounded-xl p-3 flex justify-between items-center shadow-xs">
          <div className="text-xs text-[#E91E63] font-bold">
            ⚡ Selected {selectedIds.length} tasks for bulk actions
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('complete')}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              Mark Completed
            </button>
            <button
              onClick={() => handleBulkAction('skip')}
              className="px-3.5 py-1.5 bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-700 border border-slate-250 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <X className="h-3.5 w-3.5 text-rose-500" />
              Skip Selected
            </button>
          </div>
        </div>
      )}

      {/* 4. MAIN CRM LIST TABLE */}
      {loading ? (
        <div className="py-12 bg-white rounded-[18px] border border-[#E8ECF3] shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
          <Loader message="Fetching CRM queue records..." />
        </div>
      ) : filteredTasks.length === 0 ? (
        /* Empty State (Centered nicely, illustration, balanced spacing) */
        <div className="py-14 text-center bg-white rounded-[18px] border border-[#E8ECF3] shadow-[0_10px_28px_rgba(15,23,42,0.08)] max-w-md mx-auto flex flex-col items-center justify-center space-y-4 my-8 p-6">
          <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl shadow-xs">
            🎉
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-805">No tasks found</h3>
            <p className="text-slate-455 text-xs font-semibold">
              No tasks match the current filters.
            </p>
          </div>
          <button
            onClick={() => {
              setDateFilter('week');
              setStatusFilter('pending');
              setActiveKpi('all');
              setSelectedDate(null);
            }}
            className="px-4.5 py-2 bg-[#E91E63] hover:bg-[#E91E63]/90 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            View Upcoming Tasks
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-[18px] border border-[#E8ECF3] shadow-[0_14px_35px_rgba(233,30,99,0.08)] overflow-hidden">
          <div className="h-[4px] w-full bg-[#E91E63] rounded-t-[18px]" />
          <div className="overflow-x-auto max-h-[600px] scrollbar-none">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="text-[13px] text-[#5A3345] font-bold uppercase tracking-[0.6px] border-b border-[#F2C8DA] sticky top-0 shadow-[0_3px_10px_rgba(233,30,99,0.08)] z-10" style={{ background: 'linear-gradient(90deg, #FFF5F8 0%, #FCE8F1 45%, #FFF7FA 100%)', height: '56px' }}>
                <tr style={{ height: '56px' }}>
                  <th className="px-4 py-0 text-center w-10 border-r border-[rgba(233,30,99,0.08)] last:border-r-0 align-middle">
                    <input
                      type="checkbox"
                      className="rounded-md text-[#E91E63] border-[#F2C8DA] bg-white focus:ring-[#E91E63]/20 focus:border-[#E91E63] h-4.5 w-4.5 cursor-pointer"
                      onChange={handleSelectAll}
                      checked={selectedIds.length > 0 && selectedIds.length === filteredTasks.length}
                    />
                  </th>
                  <th className="px-4 py-0 border-r border-[rgba(233,30,99,0.08)] last:border-r-0 align-middle">Task</th>
                  <th className="px-4 py-0 border-r border-[rgba(233,30,99,0.08)] last:border-r-0 align-middle">Student</th>
                  <th className="px-4 py-0 border-r border-[rgba(233,30,99,0.08)] last:border-r-0 align-middle">Parent</th>
                  <th className="px-4 py-0 border-r border-[rgba(233,30,99,0.08)] last:border-r-0 align-middle">Phone</th>
                  <th className="px-4 py-0 border-r border-[rgba(233,30,99,0.08)] last:border-r-0 align-middle">Reference</th>
                  <th className="px-4 py-0 border-r border-[rgba(233,30,99,0.08)] last:border-r-0 align-middle">Due Date</th>
                  <th className="px-4 py-0 text-center border-r border-[rgba(233,30,99,0.08)] last:border-r-0 align-middle">Status</th>
                  <th className="px-4 py-0 text-right min-w-[165px] last:border-r-0 align-middle">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8ECF3] font-semibold text-slate-700">
                {filteredTasks.map((task) => {
                  const isCompleted = task.status === 'Completed';
                  const isOverdue = task.status === 'Overdue';
                  const timeframe = getPriorityStyleBadge(task);
                  
                  return (
                    <tr
                      key={task.id}
                      onClick={() => handleViewProfileClick(task)}
                      className={`transition-all duration-200 ease-out hover:bg-[#FFF7FA] ${
                        isCompleted
                          ? 'opacity-50 bg-slate-50 hover:opacity-60 hover:bg-[#FFF7FA]'
                          : ''
                      }`}
                      style={{ height: '58px' }}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3 text-center border-r border-[rgba(233,30,99,0.04)] last:border-r-0" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="rounded-md text-[#E91E63] border-[#F2C8DA] bg-white focus:ring-[#E91E63]/20 focus:border-[#E91E63] h-4.5 w-4.5 cursor-pointer"
                          checked={selectedIds.includes(task.id)}
                          onChange={() => handleSelectRow(task.id)}
                        />
                      </td>

                      {/* Task Type */}
                      <td className="px-4 py-3 border-r border-[rgba(233,30,99,0.04)] last:border-r-0">
                        <div className="flex flex-col">
                          <span className={`font-bold text-[11.5px] ${
                            isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}>{task.stage}</span>
                          {task.notes && (
                            <span className="text-[9.5px] text-slate-400 truncate max-w-[150px] font-medium block mt-0.5" title={task.notes}>
                              {task.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Student Name (Slightly bolder) */}
                      <td className="px-4 py-3 border-r border-[rgba(233,30,99,0.04)] last:border-r-0">
                        <span className="font-black text-slate-900 block text-xs">{task.studentName}</span>
                      </td>

                      {/* Parent Name */}
                      <td className="px-4 py-3 text-slate-550 text-[11px] border-r border-[rgba(233,30,99,0.04)] last:border-r-0">
                        {task.parentName}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3 text-slate-500 font-mono font-semibold text-[10.5px] border-r border-[rgba(233,30,99,0.04)] last:border-r-0">
                        {task.phone}
                      </td>

                      {/* Reference ID */}
                      <td className="px-4 py-3 text-slate-455 font-mono text-[10.5px] border-r border-[rgba(233,30,99,0.04)] last:border-r-0">
                        {task.enquiryId}
                      </td>

                      {/* Due Date & Time */}
                      <td className="px-4 py-3 border-r border-[rgba(233,30,99,0.04)] last:border-r-0">
                        <div className="flex flex-col text-slate-550 leading-tight">
                          <span className="font-semibold text-[11px]">{new Date(task.followUpDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {new Date(task.followUpDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </span>
                        </div>
                      </td>

                      {/* Status Badges with custom colors (Centered) */}
                      <td className="px-4 py-3 text-center border-r border-[rgba(233,30,99,0.04)] last:border-r-0" onClick={(e) => e.stopPropagation()}>
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 border rounded text-[8.5px] font-extrabold uppercase tracking-wider min-w-[76px] ${timeframe.classes}`}>
                          {timeframe.text}
                        </span>
                      </td>

                      {/* Actions buttons */}
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Call: redirecting using tel: dialer */}
                          <button
                            onClick={(e) => handleCallAction(e, task.phone)}
                            className="p-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg border border-sky-100 transition-colors cursor-pointer"
                            title="Call Dialer (tel:)"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </button>

                          {/* WhatsApp Chat link */}
                          <button
                            onClick={(e) => handleWhatsAppAction(e, task.phone, task.studentName, task.parentName, task.enquiryId)}
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-100 transition-colors cursor-pointer"
                            title="Open WhatsApp Chat"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>

                          {/* Email composer redirect */}
                          {task.email !== '—' && (
                            <button
                              onClick={(e) => handleEmailAction(e, task.email, task.studentName)}
                              className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors cursor-pointer"
                              title="Open Email Composer"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Timeline redirect link */}
                          <button
                            onClick={(e) => handleOpenTimeline(e, task)}
                            className="p-1.5 bg-indigo-50 text-indigo-755 hover:bg-indigo-100 rounded-lg border border-indigo-100 transition-colors cursor-pointer"
                            title="Open Timeline Page"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>

                          {/* View profile */}
                          <button
                            onClick={() => handleViewProfileClick(task)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-655 border border-slate-205 rounded-lg transition-colors cursor-pointer"
                            title="View Profile Details"
                          >
                            <User className="h-3.5 w-3.5" />
                          </button>

                          {/* Quick Mark Complete or Undo */}
                          {!isCompleted ? (
                            <button
                              onClick={() => handleQuickComplete(task)}
                              className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer"
                              title="Mark Complete"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUndoComplete(task)}
                              className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors cursor-pointer"
                              title="Undo Complete (Mark Pending)"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Action Options Dropdown (More) */}
                          <div className="relative group/actions">
                            <button className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-205 text-slate-500 rounded-lg transition-colors cursor-pointer">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                            <div className="absolute right-0 top-7 w-32 bg-white border border-slate-200 rounded-xl shadow-md hidden group-hover/actions:block hover:block z-30 py-1 text-left">
                              <button
                                onClick={() => {
                                  setRescheduleTask(task);
                                  setRescheduleDate(task.followUpDate ? new Date(task.followUpDate).toISOString().split('T')[0] : '');
                                  setRescheduleOpen(true);
                                }}
                                className="w-full px-2.5 py-1.5 text-[10.5px] text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                Reschedule
                              </button>
                              <button
                                onClick={() => {
                                  setNoteTask(task);
                                  setNoteText(task.notes);
                                  setNoteOpen(true);
                                }}
                                className="w-full px-2.5 py-1.5 text-[10.5px] text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5 text-slate-400" />
                                Add Notes
                              </button>
                              {isCompleted ? (
                                <button
                                  onClick={() => handleUndoComplete(task)}
                                  className="w-full px-2.5 py-1.5 text-[10.5px] text-amber-700 hover:bg-amber-50 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <RefreshCw className="h-3.5 w-3.5 text-amber-500" />
                                  Mark Pending
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleQuickSkip(task)}
                                  className="w-full px-2.5 py-1.5 text-[10.5px] text-rose-650 hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <X className="h-3.5 w-3.5 text-rose-500" />
                                  Skip/Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. DETAILS DIALOGS & OVERLAYS SYSTEM */}

      {/* Calendar Picker Popup Modal */}
      <AnimatePresence>
        {calendarOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl border border-slate-100"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5 text-indigo-850 font-black text-xs uppercase tracking-wider">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  <span>Choose Date</span>
                </div>
                <button
                  onClick={() => setCalendarOpen(false)}
                  className="text-slate-455 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <CalendarPicker
                rawTasks={rawTasks}
                selectedDate={selectedDate || getLocalDateString(new Date())}
                setSelectedDate={(d) => {
                  setSelectedDate(d);
                  setCalendarOpen(false);
                }}
                getLocalDateString={getLocalDateString}
                onSelectComplete={() => setCalendarOpen(false)}
              />

              <div className="pt-2 border-t border-slate-100 text-right">
                <button
                  type="button"
                  onClick={() => setCalendarOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-705 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reschedule Picker Modal */}
      <AnimatePresence>
        {rescheduleOpen && rescheduleTask && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl border border-slate-100"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-slate-805 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-indigo-500" />
                  Reschedule Task
                </h3>
                <button onClick={() => setRescheduleOpen(false)} className="text-slate-450 hover:text-slate-700 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 font-semibold text-left">
                <div className="bg-slate-50 p-3 rounded-xl text-slate-655 text-xs">
                  <span className="font-bold text-slate-750 block">
                    {rescheduleTask.stage} — {rescheduleTask.studentName}
                  </span>
                  <span className="text-[10px] text-slate-450 block mt-0.5">ID: {rescheduleTask.enquiryId}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase">New Date</label>
                    <input
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase">New Time</label>
                    <input
                      type="time"
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setRescheduleOpen(false)}
                  className="px-4.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-655 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRescheduleSubmit}
                  className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Save Schedule
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Notes update modal */}
      <AnimatePresence>
        {noteOpen && noteTask && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl border border-slate-100"
            >
              <div className="flex justify-between items-center border-b border-slate-105 pb-2">
                <h3 className="text-sm font-black text-slate-805 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4 text-indigo-500" />
                  Add/Update Notes
                </h3>
                <button onClick={() => setNoteOpen(false)} className="text-slate-450 hover:text-slate-700 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 font-semibold text-left">
                <div className="bg-slate-50 p-3 rounded-xl text-slate-655 text-xs">
                  <span className="font-bold text-slate-755 block">
                    {noteTask.stage} — {noteTask.studentName}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Task comments / remarks</label>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Enter outcomes or details of conversation..."
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setNoteOpen(false)}
                  className="px-4.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-655 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNoteSubmit}
                  className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Save Notes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unified premium CRM Student Profile modal integration */}
      {profileModalOpen && selectedProfileTask && (
        <CRMProfileModal
          isOpen={profileModalOpen}
          onClose={() => {
            setProfileModalOpen(false);
            setSelectedProfileTask(null);
          }}
          data={selectedProfileTask.rawItem}
          type={module === 'school' ? 'school' : 'college'}
          stageOptions={currentStageOptions}
          schoolName={currentUser}
          onSaveJourney={async (updatedJourney, journeyStatus, closedMetadata) => {
            await handleSaveJourney(selectedProfileTask.itemId, updatedJourney, journeyStatus, closedMetadata);
          }}
          onAddNote={async (noteText) => {
            if (module === 'school') {
              const url = `/enquiries/${selectedProfileTask.itemId}`;
              const response = await api.put(url, { notes: noteText });
              if (response.success) {
                setSelectedProfileTask(prev => ({
                  ...prev,
                  rawItem: { ...prev.rawItem, notes: noteText }
                }));
                fetchData();
              }
            } else {
              const url = `/college/applications/${selectedProfileTask.itemId}/note`;
              const response = await api.post(url, { note: noteText });
              if (response.success) {
                setSelectedProfileTask(prev => ({
                  ...prev,
                  rawItem: response.data
                }));
                fetchData();
              }
            }
          }}
          onAssessments={() => {
            setSelectedEnquiryForAssessment(selectedProfileTask.rawItem);
          }}
        />
      )}

      {/* Assessment Portal Modal — opened from CRM Profile Modal */}
      {selectedEnquiryForAssessment && (
        <AssessmentPortalModal
          enquiry={selectedEnquiryForAssessment}
          onClose={() => setSelectedEnquiryForAssessment(null)}
        />
      )}
    </div>
  );
};

export default TasksPage;
