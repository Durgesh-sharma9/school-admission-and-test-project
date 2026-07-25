import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import Button from './Button';

const CollapsibleFilters = ({
  searchValue,
  onSearchChange,
  onExport,
  isExpanded: controlledExpanded,
  onToggleExpand,
  children,
  exportLabel = 'Export CSV / Excel',
  searchPlaceholder = 'Search by ID, name, mobile...',
  className = '',
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm space-y-3 ${className}`}>
      {/* Row 1: Search and Export */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full text-left">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Filter size={18} />
          </span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
          <Button
            variant="outline"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 w-full md:w-auto text-xs font-semibold text-slate-700 bg-white"
            onClick={handleToggle}
          >
            {isExpanded ? (
              <>
                <ChevronUp size={16} />
                Filters
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                Filters
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 w-full md:w-auto text-xs font-semibold text-slate-700 bg-white"
            onClick={onExport}
          >
            {exportLabel}
          </Button>
        </div>
      </div>

      {/* Row 2: Collapsible Filter Section */}
      <div
        className={`overflow-hidden transition-all duration-225 ease-in-out ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pt-3">
          {children}
        </div>
      </div>
    </div>
  );
};

// Filter Row Component for consistent layout
export const FilterRow = ({ children, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs ${className}`}>
      {children}
    </div>
  );
};

// Individual Filter Component
export const FilterField = ({ label, children, className = '' }) => {
  return (
    <div className={`text-left ${className}`}>
      <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">{label}</label>
      {children}
    </div>
  );
};

// Select Filter Component
export const SelectFilter = ({ label, value, onChange, options, placeholder, className = '' }) => {
  return (
    <FilterField label={label} className={className}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 rounded-lg border border-slate-100 px-3 py-2 text-slate-750 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FilterField>
  );
};

// Date Filter Component
export const DateFilter = ({ label, value, onChange, className = '' }) => {
  return (
    <FilterField label={label} className={className}>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 rounded-lg border border-slate-100 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium focus:bg-white"
      />
    </FilterField>
  );
};

// Timeline Filter Component
export const TimelineFilter = ({ value, onChange, className = '' }) => {
  const timelineOptions = [
    { value: '', label: 'All Timeline' },
    { value: 'Form Submitted', label: 'Form Submitted' },
    { value: 'Call', label: 'Call' },
    { value: 'Follow-up', label: 'Follow-up' },
    { value: 'Meeting', label: 'Meeting' },
    { value: 'Campus Visit', label: 'Campus Visit' },
    { value: 'Documents Pending', label: 'Documents Pending' },
    { value: 'Registered', label: 'Registered' },
  ];

  return (
    <SelectFilter
      label="Timeline"
      value={value}
      onChange={onChange}
      options={timelineOptions}
      placeholder="All Timeline"
      className={className}
    />
  );
};

export default CollapsibleFilters;
