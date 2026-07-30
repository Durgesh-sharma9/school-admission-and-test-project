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
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-[12px] h-[40px] px-4 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[#E91E63] hover:bg-[#E91E63]/90 text-white shadow-md shadow-pink-500/10 hover:shadow-lg hover:shadow-pink-500/20 border border-transparent',
    secondary: 'bg-white hover:bg-slate-50 text-[#111827] border border-[#E8ECF3] hover:border-slate-350 focus:ring-[#E91E63]/20 shadow-xs hover:shadow-md',
    danger: 'bg-[#EF4444] hover:bg-[#EF4444]/90 text-white border border-transparent focus:ring-red-500/20 shadow-xs',
    success: 'bg-[#22C55E] hover:bg-[#22C55E]/90 text-white border border-transparent focus:ring-green-500/20 shadow-xs',
    outline: 'bg-transparent border border-[#E8ECF3] hover:bg-slate-50 hover:border-[#D7DCE5] text-[#111827] focus:ring-[#E91E63]/20',
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
