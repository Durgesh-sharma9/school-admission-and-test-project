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
    <div className={`bg-white rounded-[18px] border border-[#E8ECF3] p-4 shadow-[0_10px_28px_rgba(15,23,42,0.08)] space-y-3 ${className}`}>
      {/* Row 1: Search and Export */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full text-left">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#94A3B8]">
            <Filter size={18} />
          </span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-lg border border-[#E9EAF0] text-sm text-slate-800 placeholder-[#94A3B8] shadow-[0_4px_14px_rgba(15,23,42,0.05)] hover:border-[#D7DCE5] focus:outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/15 transition-all duration-200"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
          <Button
            variant="outline"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 w-full md:w-auto text-xs font-semibold text-slate-700 bg-white border border-[#E9EAF0] shadow-[0_4px_14px_rgba(15,23,42,0.03)] hover:bg-[#8B5CF6]/5 hover:text-[#8B5CF6] hover:border-[#8B5CF6]/20 transition-all duration-200"
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
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 w-full md:w-auto text-xs font-semibold text-slate-700 bg-white border border-[#E9EAF0] shadow-[0_4px_14px_rgba(15,23,42,0.03)] hover:bg-[#EE5EAA]/5 hover:text-[#EE5EAA] hover:border-[#EE5EAA]/20 transition-all duration-200"
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
        className="w-full bg-white rounded-lg border border-[#E9EAF0] px-3 py-2 text-slate-700 font-medium focus:outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/15 transition-all shadow-[0_4px_14px_rgba(15,23,42,0.05)] cursor-pointer"
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
        className="w-full bg-white rounded-lg border border-[#E9EAF0] px-3 py-1.5 focus:outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/15 text-slate-700 font-medium transition-all shadow-[0_4px_14px_rgba(15,23,42,0.05)]"
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
