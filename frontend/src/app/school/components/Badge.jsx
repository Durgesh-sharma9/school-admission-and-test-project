import React from 'react';

const Badge = ({ status }) => {
  const styles = {
    'New Enquiry': 'bg-blue-50 text-blue-700 border-blue-100',
    'Hold': 'bg-amber-50 text-amber-700 border-amber-100',
    'Not Interested': 'bg-rose-50 text-rose-700 border-rose-100',
    'Admission Confirmed': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };

  const currentStyle = styles[status] || 'bg-slate-50 text-slate-700 border-slate-100';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStyle}`}>
      {status}
    </span>
  );
};

export default Badge;
