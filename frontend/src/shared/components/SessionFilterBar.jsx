import React, { useState, useRef, useEffect } from 'react';
import { useSession, DATE_PRESETS } from '../../contexts/SessionContext';
import { Calendar, ChevronDown, Check, Filter, AlertTriangle, RotateCcw } from 'lucide-react';

const SessionFilterBar = ({
  selectedTimeframe = 'all',
  onTimeframeChange,
  customStartDate = '',
  customEndDate = '',
  onCustomDateChange,
  className = '',
}) => {
  const { activeSession, defaultSession, isDefaultSession, changeSession, resetToDefaultSession, availableSessions } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Visual Non-Default Session Alert Banner if user switched session */}
      {!isDefaultSession && (
        <div className="flex items-center justify-between gap-2 px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Notice:</strong> You are viewing historical/future <strong>Session: {activeSession}</strong>. (Current default is {defaultSession}).
            </span>
          </div>
          <button
            type="button"
            onClick={resetToDefaultSession}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3 h-3 text-amber-700" />
            <span>Switch to {defaultSession}</span>
          </button>
        </div>
      )}

      {/* Main Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-2.5 sm:p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Active Session Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isDefaultSession
                  ? 'bg-blue-50/90 hover:bg-blue-100 text-blue-700 border border-blue-200/80'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
              }`}
              title="Academic Session Filter (Click to switch)"
            >
              {isDefaultSession ? (
                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              )}
              <span className="text-slate-500 font-medium">Session:</span>
              <span className="font-extrabold">{activeSession}</span>
              {!isDefaultSession && (
                <span className="text-[10px] bg-amber-200 text-amber-900 px-1 py-0.2 rounded font-bold">
                  Archive
                </span>
              )}
              <ChevronDown className="w-3 h-3 text-slate-400 transition-transform" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-left animate-fadeIn">
                <div className="px-3 py-1 border-b border-slate-100 mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Session
                  </span>
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1 py-0.2 rounded">
                    Default: {defaultSession}
                  </span>
                </div>
                <div className="space-y-0.5 px-1">
                  {availableSessions.map((sess) => {
                    const isSelected = activeSession === sess;
                    const isDef = sess === defaultSession;
                    return (
                      <button
                        key={sess}
                        type="button"
                        onClick={() => {
                          changeSession(sess);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{sess}</span>
                          {isDef && (
                            <span className={`text-[9px] font-normal px-1 rounded ${isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'}`}>
                              Current
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 font-medium pl-1 border-l border-slate-200">
            <Filter className="w-3 h-3" />
            <span>Date Range:</span>
          </div>
        </div>

        {/* Right: Clean Timeframe Preset Buttons */}
        {onTimeframeChange && (
          <div className="flex items-center gap-1.5 flex-wrap md:justify-end">
            {DATE_PRESETS.map((preset) => {
              const isSelected = selectedTimeframe === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onTimeframeChange(preset.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-xs scale-[1.02]'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/70 hover:text-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}

            {/* Custom Date Pickers when 'custom' is selected */}
            {selectedTimeframe === 'custom' && onCustomDateChange && (
              <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 mt-1 sm:mt-0">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => onCustomDateChange(e.target.value, customEndDate)}
                  className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-400 font-bold">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => onCustomDateChange(customStartDate, e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionFilterBar;
