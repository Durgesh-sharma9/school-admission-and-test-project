import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

export const CLASS_SEEKING_OPTIONS = [
  "Nursery",
  "LKG",
  "UKG",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11 (Science)",
  "Class 11 (Commerce)",
  "Class 11 (Arts)",
  "Class 12 (Science)",
  "Class 12 (Commerce)",
  "Class 12 (Arts)"
];

export const PREVIOUS_CLASS_OPTIONS = [
  "Nursery",
  "LKG",
  "UKG",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11 (Science)",
  "Class 11 (Commerce)",
  "Class 11 (Arts)"
];

const AutocompleteSelect = ({
  label,
  name,
  value = '',
  onChange,
  options = [],
  placeholder = 'Select option...',
  required = false,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Synchronize internal state with external value updates (e.g., initial load or form resets)
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes((inputValue || '').trim().toLowerCase())
  );

  // Keep active index in bounds when options filter updates
  useEffect(() => {
    setActiveIndex(-1);
  }, [inputValue]);

  const handleSelectOption = (option) => {
    onChange(option);
    setInputValue(option);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleBlur = () => {
    // Determine if the current input value matches any option case-insensitively
    const trimmedInput = (inputValue || '').trim().toLowerCase();
    const exactMatch = options.find(opt => opt.toLowerCase() === trimmedInput);

    if (exactMatch) {
      // Correct input casing to match the option value exactly
      onChange(exactMatch);
      setInputValue(exactMatch);
    } else {
      // Revert to the last valid value selected (if any) or clear it
      onChange(value || '');
      setInputValue(value || '');
    }
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else if (filteredOptions.length > 0) {
        setActiveIndex(prev => (prev + 1) % filteredOptions.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen && filteredOptions.length > 0) {
        setActiveIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
      }
    } else if (e.key === 'Enter') {
      // Do not submit the form when hitting Enter to select
      e.preventDefault();
      if (isOpen && activeIndex >= 0 && activeIndex < filteredOptions.length) {
        handleSelectOption(filteredOptions[activeIndex]);
      } else {
        // Blur the input to trigger validation and exact match checks
        inputRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setInputValue(value || '');
      inputRef.current?.blur();
    } else if (e.key === 'Tab') {
      if (isOpen) {
        // If there's an active index highlight, select it
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          handleSelectOption(filteredOptions[activeIndex]);
        } else {
          // If no index is highlighted but we have an exact match typed, complete it
          const trimmedInput = (inputValue || '').trim().toLowerCase();
          const match = filteredOptions.find(opt => opt.toLowerCase() === trimmedInput);
          if (match) {
            handleSelectOption(match);
          } else {
            handleBlur();
          }
        }
      }
    }
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    onChange('');
    setInputValue('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-1.5 text-left relative">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full rounded-[10px] border border-[#E9EAF0] pl-3.5 pr-12 py-2.5 text-sm text-slate-905 bg-white placeholder-[#94A3B8] shadow-[0_4px_14px_rgba(15,23,42,0.05)] hover:border-[#D7DCE5] focus:outline-none focus:ring-4 focus:ring-[#8B5CF6]/15 focus:border-[#8B5CF6] transition-all ${
            error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''
          }`}
          autoComplete="off"
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
          {inputValue && (
            <button
              type="button"
              onClick={clearSelection}
              className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (isOpen) {
                inputRef.current?.blur();
              } else {
                inputRef.current?.focus();
              }
            }}
            className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded cursor-pointer"
          >
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isOpen && (
          <div
            className="absolute z-[9999] left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-[#E9EAF0] rounded-[10px] shadow-[0_10px_25px_rgba(0,0,0,0.1)]"
            // Use onMouseDown with e.preventDefault() so that clicking an option doesn't fire blur on the input prematurely
            onMouseDown={(e) => e.preventDefault()}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt === value;
                const isHighlighted = idx === activeIndex;
                return (
                  <div
                    key={opt}
                    onClick={() => handleSelectOption(opt)}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer select-none transition-colors ${
                      isHighlighted
                        ? 'bg-slate-100 text-slate-900 font-medium'
                        : isSelected
                        ? 'bg-purple-50 text-purple-750 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <Check className="h-4 w-4 text-purple-650 shrink-0" />}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-3 text-sm text-slate-400 italic">
                No matching options found
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <span className="text-xs text-red-500 font-medium mt-0.5">
          {error.message}
        </span>
      )}
    </div>
  );
};

export default AutocompleteSelect;
