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
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-[12px] h-[46px] px-5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 border border-transparent',
    secondary: 'bg-white hover:bg-slate-50 text-[#111827] border border-slate-200 hover:border-slate-300 focus:ring-[#4F46E5]/20 shadow-sm hover:shadow-md',
    danger: 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 focus:ring-red-500/20 shadow-sm',
    outline: 'bg-transparent border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-[#111827] focus:ring-[#4F46E5]/20',
  };

  const combinedClasses = `${baseStyles} ${variants[variant]} ${className}`;

  return (
    <motion.button
      whileHover={!isDisabled && !isLoading ? { scale: 1.015, y: -1 } : {}}
      whileTap={!isDisabled && !isLoading ? { scale: 0.98 } : {}}
      type={type}
      className={combinedClasses}
      disabled={isDisabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!isLoading && Icon && <Icon className="-ml-1 mr-2 h-4 w-4 text-current shrink-0" />}
      {children}
    </motion.button>
  );
};

export default Button;
