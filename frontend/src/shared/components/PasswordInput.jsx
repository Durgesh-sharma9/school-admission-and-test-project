import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';

export const checkPasswordCriteria = (password = '') => {
  const str = String(password || '');
  return {
    hasLength: str.length >= 8,
    hasLetter: /[a-zA-Z]/.test(str),
    hasNumber: /[0-9]/.test(str),
  };
};

export const isPasswordValid = (password = '') => {
  const criteria = checkPasswordCriteria(password);
  return criteria.hasLength && criteria.hasLetter && criteria.hasNumber;
};

export const getPasswordStrength = (password = '') => {
  const criteria = checkPasswordCriteria(password);
  let score = 0;
  if (criteria.hasLength) score += 1;
  if (criteria.hasLetter) score += 1;
  if (criteria.hasNumber) score += 1;

  if (!password) return { score: 0, label: '', color: 'bg-slate-200', textColor: 'text-slate-400' };
  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500', textColor: 'text-rose-600' };
  if (score === 2) return { score: 2, label: 'Medium', color: 'bg-amber-500', textColor: 'text-amber-600' };
  return { score: 3, label: 'Good', color: 'bg-emerald-500', textColor: 'text-emerald-600' };
};

const PasswordInput = forwardRef(({
  label,
  name = 'password',
  value,
  onChange,
  error,
  placeholder = 'Enter password (min 8 chars, letters & numbers)',
  className = '',
  required = false,
  showStrength = true,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const currentValue = value !== undefined ? value : (props.defaultValue || '');
  const criteria = checkPasswordCriteria(currentValue);
  const isComplete = isPasswordValid(currentValue);

  return (
    <div className="w-full flex flex-col gap-1 text-left">
      {label && (
        <label htmlFor={name} className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={name}
          name={name}
          type={showPassword ? 'text' : 'password'}
          ref={ref}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-slate-200 px-3.5 py-2 pr-10 text-sm text-slate-900 bg-white placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${
            error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''
          } ${className}`}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {error && (
        <span className="text-[11px] text-red-500 font-medium mt-0.5" id={`${name}-error`}>
          {error.message || error}
        </span>
      )}

      {/* Simplified, subtle requirement tags */}
      {showStrength && (currentValue.length > 0 || isFocused) && !isComplete && (
        <div className="flex items-center gap-3 text-[11px] pt-1 flex-wrap text-slate-500">
          <span className={`inline-flex items-center gap-1 ${criteria.hasLength ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
            {criteria.hasLength ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />}
            8+ characters
          </span>
          <span className={`inline-flex items-center gap-1 ${criteria.hasLetter ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
            {criteria.hasLetter ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />}
            Letters (a-z)
          </span>
          <span className={`inline-flex items-center gap-1 ${criteria.hasNumber ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
            {criteria.hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />}
            Numbers (0-9)
          </span>
        </div>
      )}

      {showStrength && isComplete && (
        <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold pt-0.5">
          <Check className="w-3.5 h-3.5 text-emerald-500" />
          <span>Password is valid & secure</span>
        </div>
      )}
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
