import React from 'react';

export const CampusCrmIcon = ({ className = "h-9 w-auto" }) => (
  <img 
    src="/logo.png" 
    alt="Campus CRM Badge" 
    className={`${className} object-contain`} 
  />
);

const CampusCrmLogo = ({ variant = "full", lightText = false, className = "", size = "normal" }) => {
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

  // Uses white text image (campus-crm-text-light.png) on dark backgrounds, dark text image (campus-crm-text.png) on light backgrounds
  const textImageSrc = lightText ? "/campus-crm-text-light.png" : "/campus-crm-text.png";

  return (
    <div className={`inline-flex items-center gap-2 sm:gap-2.5 bg-transparent p-0 select-none ${className}`}>
      {/* Photo 1: Circle Icon Badge */}
      <img 
        src="/logo.png" 
        alt="Campus CRM Icon" 
        className={`${iconHeights[size] || iconHeights.normal} w-auto object-contain shrink-0`} 
      />

      {/* Photo 2: Text Banner Image */}
      <img 
        src={textImageSrc} 
        alt="Campus CRM Text" 
        className={`${textHeights[size] || textHeights.normal} w-auto object-contain shrink-0 translate-y-[2.5px] sm:translate-y-[3.5px]`} 
      />
    </div>
  );
};

export default CampusCrmLogo;
