import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { CLASS_SEEKING_OPTIONS } from './AutocompleteSelect';

const SearchableClassFilter = ({
  label,
  value = '',
  onChange,
  placeholder = 'All Classes',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef(null);

  // Helper to get display label for value
  const getDisplayLabel = (val) => {
    if (!val) return 'All Classes';
    return val;
  };

  useEffect(() => {
    setInputValue(value ? value : 'All Classes');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        handleValidation();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue, value]);

  const handleValidation = () => {
    const trimmedInput = inputValue.trim().toLowerCase();
    
    if (!trimmedInput || trimmedInput === 'all' || trimmedInput === 'all classes') {
      onChange('');
      setInputValue('All Classes');
      return;
    }

    const matched = CLASS_SEEKING_OPTIONS.find(
      opt => opt.toLowerCase() === trimmedInput
    );

    if (matched) {
      onChange(matched);
      setInputValue(matched);
    } else {
      onChange(value);
      setInputValue(getDisplayLabel(value));
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleOptionClick = (optVal) => {
    onChange(optVal);
    setInputValue(getDisplayLabel(optVal));
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setInputValue('All Classes');
    setIsOpen(false);
  };

  // Prepend 'All Classes' to list for search
  const allOptions = ['', ...CLASS_SEEKING_OPTIONS];

  const filteredOptions = allOptions.filter(opt => {
    const optLabel = opt === '' ? 'All Classes' : opt;
    return optLabel.toLowerCase().includes(inputValue.toLowerCase());
  });

  return (
    <div className={`flex flex-col gap-1.5 text-left relative ${className}`} ref={containerRef}>
      {label && (
        <span className="block text-xs font-semibold text-slate-500 tracking-wide uppercase">
          {label}
        </span>
      )}
      
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            if (inputValue === 'All Classes') {
              setInputValue('');
            }
          }}
          placeholder={placeholder}
          className="w-full bg-white rounded-lg border border-[#E9EAF0] pl-3.5 pr-10 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-4 focus:ring-[#8B5CF6]/15 focus:border-[#8B5CF6] transition-all shadow-[0_4px_14px_rgba(15,23,42,0.05)] cursor-pointer"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
          {value && (
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
              <Search className="h-3.5 w-3.5" /> No matches found
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = opt === value;
              const optLabel = opt === '' ? 'All Classes' : opt;
              return (
                <div
                  key={optLabel}
                  onClick={() => handleOptionClick(opt)}
                  className={`px-4 py-2 text-xs font-bold flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-purple-50 text-[#8B5CF6]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{optLabel}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-[#8B5CF6]" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableClassFilter;
