import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  name,
  type = 'text',
  error,
  placeholder,
  options = [], // for select type
  className = '',
  required = false,
  ...props
}, ref) => {
  const inputBaseClasses = `w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
    error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''
  } ${className}`;

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label htmlFor={name} className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {type === 'select' ? (
        <select
          id={name}
          name={name}
          ref={ref}
          className={inputBaseClasses}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          ref={ref}
          placeholder={placeholder}
          rows={3}
          className={inputBaseClasses}
          {...props}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          ref={ref}
          placeholder={placeholder}
          className={inputBaseClasses}
          {...props}
        />
      )}

      {error && (
        <span className="text-xs text-red-500 font-medium mt-0.5" id={`${name}-error`}>
          {error.message}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
