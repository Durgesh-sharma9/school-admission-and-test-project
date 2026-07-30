import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

export const CLASS_SEEKING_OPTIONS = [
  'Nursery',
  'LKG',
  'UKG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11 (Science)',
  'Class 11 (Commerce)',
  'Class 11 (Arts)',
  'Class 12 (Science)',
  'Class 12 (Commerce)',
  'Class 12 (Arts)'
];

export const PREVIOUS_CLASS_OPTIONS = [
  'Nursery',
  'LKG',
  'UKG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11 (Science)',
  'Class 11 (Commerce)',
  'Class 11 (Arts)'
];

const AutocompleteSelect = ({
  label,
  value = '',
  onChange,
  options = [],
  placeholder = 'Select option...',
  error,
  required = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef(null);

  // Sync state when value changes (e.g. initialData, reset, or parent changes)
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Click outside to close dropdown and validate/revert input
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        handleValidation();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue, value, options]);

  // Validate the text in the input on blur/close
  const handleValidation = () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput) {
      onChange('');
      setInputValue('');
      return;
    }

    // Try to find a case-insensitive exact match in predefined options
    const matched = options.find(
      opt => opt.toLowerCase() === trimmedInput.toLowerCase()
    );

    if (matched) {
      onChange(matched);
      setInputValue(matched);
    } else {
      // Revert to last valid selected value
      onChange(value || '');
      setInputValue(value || '');
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleOptionClick = (option) => {
    onChange(option);
    setInputValue(option);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setInputValue('');
    setIsOpen(false);
  };

  // Filter options based on input text
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className={`w-full flex flex-col gap-1.5 text-left relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full rounded-[10px] border border-[#E9EAF0] pl-3.5 pr-10 py-2.5 text-sm text-slate-900 bg-white placeholder-[#94A3B8] shadow-[0_4px_14px_rgba(15,23,42,0.05)] hover:border-[#D7DCE5] focus:outline-none focus:ring-4 focus:ring-[#8B5CF6]/15 focus:border-[#8B5CF6] transition-all ${
            error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''
          }`}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400">
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 cursor-pointer ${
              isOpen ? 'rotate-180 text-slate-600' : ''
            }`}
            onClick={() => setIsOpen(!isOpen)}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto bg-white border border-[#E9EAF0] rounded-xl shadow-xl z-50 py-1.5">
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5" /> No matching classes found
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = opt === value;
              return (
                <div
                  key={opt}
                  onClick={() => handleOptionClick(opt)}
                  className={`px-4 py-2 text-sm font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-purple-50 text-[#8B5CF6]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && <Check className="h-4 w-4 text-[#8B5CF6]" />}
                </div>
              );
            })
          )}
        </div>
      )}

      {error && (
        <span className="text-xs text-red-500 font-medium mt-0.5">
          {error.message}
        </span>
      )}
    </div>
  );
};

export default AutocompleteSelect;
