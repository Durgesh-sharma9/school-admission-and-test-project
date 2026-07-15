import React from 'react';
import { motion } from 'framer-motion';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  icon: Icon,
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 shadow-sm border border-transparent',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-400 border border-transparent',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm border border-transparent',
    outline: 'bg-transparent border border-slate-300 hover:bg-slate-50 text-slate-700 focus:ring-slate-400',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base',
  };

  const combinedClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <motion.button
      whileTap={{ scale: isDisabled || isLoading ? 1 : 0.98 }}
      type={type}
      className={combinedClasses}
      disabled={isDisabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </>
      ) : (
        <>
          {Icon && <Icon className="-ml-1 mr-2 h-4.5 w-4.5" />}
          {children}
        </>
      )}
    </motion.button>
  );
};

export default Button;
