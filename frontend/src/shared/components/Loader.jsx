import React from 'react';

const Loader = ({ fullPage = false, message = 'Loading...' }) => {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className="relative w-12 h-12">
        <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-indigo-100"></div>
        <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
      {message && <p className="text-sm font-medium text-slate-500">{message}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return <div className="py-12 flex items-center justify-center">{content}</div>;
};

export default Loader;
