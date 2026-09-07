import React, { createContext, useContext, useState, useEffect } from 'react';

export const DEFAULT_SESSION = '2026-2027';

export const ACADEMIC_SESSIONS = [
  '2026-2027',
  '2027-2028',
  '2028-2029',
  '2029-2030',
  '2030-2031'
];

export const DATE_PRESETS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'last5days', label: 'Last 5 Days' },
  { id: 'last7days', label: 'Last 7 Days' },
  { id: 'last30days', label: 'Last 30 Days' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'sessionStart', label: 'Start of Session' },
  { id: 'custom', label: 'Date Range' },
];

export const calculateDateRange = (preset, session = DEFAULT_SESSION, customStart = '', customEnd = '') => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (preset === 'today') {
    return { startDate: todayStr, endDate: todayStr };
  }
  if (preset === 'last5days') {
    const d = new Date();
    d.setDate(d.getDate() - 4);
    return { startDate: d.toISOString().split('T')[0], endDate: todayStr };
  }
  if (preset === 'last7days') {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return { startDate: d.toISOString().split('T')[0], endDate: todayStr };
  }
  if (preset === 'last30days') {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return { startDate: d.toISOString().split('T')[0], endDate: todayStr };
  }
  if (preset === 'thisMonth') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startStr = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}-01`;
    return { startDate: startStr, endDate: todayStr };
  }
  if (preset === 'sessionStart') {
    const startYear = session ? session.split('-')[0] : '2026';
    return { startDate: `${startYear}-04-01`, endDate: todayStr };
  }
  if (preset === 'custom') {
    return { startDate: customStart || '', endDate: customEnd || '' };
  }
  return { startDate: '', endDate: '' };
};

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [activeSession, setActiveSession] = useState(() => {
    return localStorage.getItem('selected_academic_session') || DEFAULT_SESSION;
  });

  const changeSession = (newSession) => {
    setActiveSession(newSession);
    localStorage.setItem('selected_academic_session', newSession);
    window.dispatchEvent(new CustomEvent('academic-session-changed', { detail: newSession }));
  };

  const resetToDefaultSession = () => {
    changeSession(DEFAULT_SESSION);
  };

  const isDefaultSession = activeSession === DEFAULT_SESSION;
  const isFutureSession = activeSession > DEFAULT_SESSION;
  const canCreateEnquiry = !isFutureSession;

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'selected_academic_session' && e.newValue) {
        setActiveSession(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        activeSession,
        defaultSession: DEFAULT_SESSION,
        isDefaultSession,
        isFutureSession,
        canCreateEnquiry,
        changeSession,
        resetToDefaultSession,
        availableSessions: ACADEMIC_SESSIONS,
        datePresets: DATE_PRESETS,
        calculateDateRange,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    return {
      activeSession: DEFAULT_SESSION,
      defaultSession: DEFAULT_SESSION,
      isDefaultSession: true,
      isFutureSession: false,
      canCreateEnquiry: true,
      changeSession: () => {},
      resetToDefaultSession: () => {},
      availableSessions: ACADEMIC_SESSIONS,
      datePresets: DATE_PRESETS,
      calculateDateRange,
    };
  }
  return context;
};

export default SessionContext;
