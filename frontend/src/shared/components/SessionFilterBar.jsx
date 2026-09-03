import React, { useState } from 'react';
import { useSession, ACADEMIC_SESSIONS, DATE_PRESETS } from '../../contexts/SessionContext';
import { Calendar, Clock, Filter, Sparkles, ChevronDown, Check } from 'lucide-react';

const SessionFilterBar = ({
  selectedTimeframe = 'all',
  onTimeframeChange,
  customStartDate = '',
  customEndDate = '',
  onCustomDateChange,
  showSession = true,
  showTimeframe = true,
  className = '',
}) => {
  const { activeSession, changeSession, availableSessions } = useSession();
  const [sessionDropdownOpen, setSessionDropdownOpen] = useState(false);

  return (
    <div className={`flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm transition-all ${className}`}>
      {/* Left: Academic Session Switcher */}
      {showSession && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/70 rounded-xl">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-bold text-blue-900">Academic Session:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {availableSessions.map((sess) => {
              const isSelected = activeSession === sess;
              return (
                <button
                  key={sess}
                  type="button"
                  onClick={() => changeSession(sess)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20 scale-[1.02]'
                      : 'bg-slate-100/80 hover:bg-slate-200 text-slate-700 border border-slate-200/60'
                  }`}
                >
                  {sess}
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Right: Date Timeframe Filter Presets */}
      {showTimeframe && onTimeframeChange && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap lg:justify-end">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {DATE_PRESETS.map((preset) => {
              const isSelected = selectedTimeframe === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onTimeframeChange(preset.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Custom Date Pickers when 'custom' is selected */}
          {selectedTimeframe === 'custom' && onCustomDateChange && (
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => onCustomDateChange(e.target.value, customEndDate)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-400 font-bold">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => onCustomDateChange(customStartDate, e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SessionFilterBar;
