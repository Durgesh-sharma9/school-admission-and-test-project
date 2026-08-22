import React from 'react';

export const CampusCrmIcon = ({ className = "h-9 w-auto" }) => (
  <img 
    src="/logo.png" 
    alt="Campus CRM Badge" 
    className={`${className} object-contain`} 
  />
);

const CampusCrmLogo = ({ variant = "full", className = "", size = "normal" }) => {
  const iconHeights = {
    sm: "h-7",
    normal: "h-8 sm:h-9",
    lg: "h-12"
  };

  const textHeights = {
    sm: "h-6",
    normal: "h-7 sm:h-8",
    lg: "h-11"
  };

  if (variant === "icon") {
    return (
      <img 
        src="/logo.png" 
        alt="Campus CRM Badge" 
        className={`${iconHeights[size] || iconHeights.normal} w-auto object-contain ${className}`}
      />
    );
  }

  // Renders Photo 1 (Icon Image) & Photo 2 (Text Banner Image) side-by-side without any HTML text!
  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 bg-transparent p-0 ${className}`}>
      {/* Photo 1: Circle Badge Icon Image */}
      <img 
        src="/logo.png" 
        alt="Campus CRM Icon" 
        className={`${iconHeights[size] || iconHeights.normal} w-auto object-contain shrink-0`} 
      />

      {/* Photo 2: Exact Text Banner Image provided by user */}
      <img 
        src="/campus-crm-text-light.png" 
        alt="Campus CRM Text" 
        className={`${textHeights[size] || textHeights.normal} w-auto object-contain shrink-0`} 
      />
    </div>
  );
};

export default CampusCrmLogo;
