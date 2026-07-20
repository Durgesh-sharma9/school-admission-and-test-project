import React from 'react';
import { Shield, LogOut } from 'lucide-react';
import Button from '../../../shared/components/Button';

const SupportModeBanner = ({ schoolName, onExit }) => {
  return (
    <div className="bg-red-600 text-white px-6 py-2.5 flex items-center justify-between shadow-md shrink-0 border-b border-red-700">
      <div className="flex items-center space-x-3 text-xs sm:text-sm font-bold tracking-wide text-left">
        <span className="flex h-2.5 w-2.5 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="uppercase tracking-widest font-black bg-red-700/80 px-2 py-0.5 rounded text-[11px]">
            SUPERVISION MODE
          </span>
          <span className="text-red-100">
            Viewing: <strong className="text-white underline">{schoolName || 'School Dashboard'}</strong>
          </span>
          <span className="text-red-200 hidden md:inline">• Logged in as Platform Support</span>
        </div>
      </div>
      <Button
        onClick={onExit}
        className="bg-white text-red-700 hover:bg-red-50 text-xs font-black px-3 py-1.5 shadow-sm border border-transparent shrink-0"
      >
        <LogOut className="w-3.5 h-3.5 mr-1.5 inline" />
        Exit Support Mode
      </Button>
    </div>
  );
};

export default SupportModeBanner;
