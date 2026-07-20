import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import api from '../services/api';
import {
  Menu,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Bell,
  FileText,
  UserCheck,
  ClipboardCheck,
  Megaphone,
  AlertTriangle,
  Paperclip,
  CheckSquare,
  X,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';

const getPopupTitle = (announcement) => {
  if (!announcement) return 'System Announcement';
  switch (announcement.category) {
    case 'Maintenance':
      return '🔧 Maintenance Notice';
    case 'Security':
      return '🛡️ Security Update';
    case 'Billing':
      return '💳 Billing Notice';
    case 'Update':
      return '🚀 Platform Update';
    case 'Feature':
      return '✨ New Feature Release';
    case 'Emergency':
      return '🚨 Urgent System Alert';
    default:
      return '📢 Platform Announcement';
  }
};

const Navbar = ({ toggleSidebar, title }) => {
  const { school, logout } = useAuth();
  const navigate = useNavigate();

  // Dropdown & Modal states
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [announcementDrawerOpen, setAnnouncementDrawerOpen] = useState(false);

  // Notification & Announcement states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [announcements, setAnnouncements] = useState([]);
  const [unreadAnnouncementCount, setUnreadAnnouncementCount] = useState(0);
  const [urgentAnnouncement, setUrgentAnnouncement] = useState(null);
  const [selectedAnnouncementDetail, setSelectedAnnouncementDetail] = useState(null);

  const profileRef = useRef(null);
  const bellRef = useRef(null);
  const annRef = useRef(null);

  // Fetch notifications & announcements
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.success) {
        setNotifications(res.data || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/school/announcements');
      if (res.data || res.success) {
        const list = res.data || [];
        setAnnouncements(list);
        setUnreadAnnouncementCount(res.unreadCount || 0);

        // Check for unread High/Critical urgent announcements to trigger popup modal
        const urgent = (res.urgentUnread || []).find((a) => !a.isRead);
        if (urgent && !urgentAnnouncement) {
          setUrgentAnnouncement(urgent);
        }
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  };

  useEffect(() => {
    if (school) {
      fetchNotifications();
      fetchAnnouncements();

      const interval = setInterval(() => {
        fetchNotifications();
        fetchAnnouncements();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [school]);

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
      if (annRef.current && !annRef.current.contains(e.target)) {
        setAnnouncementDrawerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await api.put('/notifications/read-all');
      if (res.success) {
        toast.success('All notifications marked as read');
        fetchNotifications();
      }
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await api.put(`/notifications/${notif._id}/read`);
      }
      setBellOpen(false);
      fetchNotifications();

      if (['new_enquiry', 'status_changed', 'admission_confirmed'].includes(notif.type)) {
        navigate('/enquiries');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAnnouncementRead = async (annId) => {
    try {
      await api.post(`/school/announcements/${annId}/read`);
      fetchAnnouncements();
      if (urgentAnnouncement?._id === annId) {
        setUrgentAnnouncement(null);
      }
      if (selectedAnnouncementDetail?._id === annId) {
        setSelectedAnnouncementDetail(null);
      }
      toast.success('Notice marked as read');
    } catch (err) {
      toast.error('Failed to mark notice as read');
    }
  };

  const handleAcknowledgeAnnouncement = async (annId) => {
    try {
      await api.post(`/school/announcements/${annId}/acknowledge`);
      fetchAnnouncements();
      if (urgentAnnouncement?._id === annId) {
        setUrgentAnnouncement(null);
      }
      if (selectedAnnouncementDetail?._id === annId) {
        setSelectedAnnouncementDetail(null);
      }
      toast.success('Notice acknowledged');
    } catch (err) {
      toast.error('Failed to acknowledge notice');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white border-b border-slate-100 shadow-xs">
        {/* Mobile Toggle & Title */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 lg:hidden"
          >
            <Menu className="h-5.5 w-5.5" />
          </button>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h1>
        </div>

        {/* Right Navbar elements */}
        <div className="flex items-center space-x-4">
          {/* Trial Badge */}
          {school?.subscription?.plan === 'free-trial' && (
            <div className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 animate-pulse">
              Active Free Trial
            </div>
          )}

          {/* Product Announcement Megaphone Center */}
          <div className="relative" ref={annRef}>
            <button
              onClick={() => {
                setAnnouncementDrawerOpen(!announcementDrawerOpen);
                if (!announcementDrawerOpen) fetchAnnouncements();
              }}
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
              title="Platform Updates & System Notices"
            >
              <Megaphone className="h-5 w-5" />
              {unreadAnnouncementCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-indigo-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                  {unreadAnnouncementCount}
                </span>
              )}
            </button>

            {announcementDrawerOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 py-2.5 z-50 text-left">
                <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Megaphone className="w-4 h-4 text-indigo-600" />
                    Platform Updates & Notices
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {unreadAnnouncementCount} Unread
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {announcements.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No system updates at this time.
                    </div>
                  ) : (
                    announcements.map((ann) => (
                      <div
                        key={ann._id}
                        onClick={() => setSelectedAnnouncementDetail(ann)}
                        className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-50 transition-colors text-left cursor-pointer ${
                          !ann.isRead ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {ann.priority === 'Critical' || ann.priority === 'High' ? (
                            <div className="h-7 w-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                              <Megaphone className="h-4 w-4" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-slate-800 truncate">{ann.title}</p>
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                              {ann.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{ann.message}</p>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 font-medium">
                            <span className="font-semibold text-slate-500">Admission CRM Team</span>
                            {ann.isRead ? (
                              <span className="text-emerald-600 font-bold">Read</span>
                            ) : (
                              <span className="text-indigo-600 font-bold">Unread</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notification Bell Dropdown */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => {
                setBellOpen(!bellOpen);
                if (!bellOpen) fetchNotifications();
              }}
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-600 rounded-full border-2 border-white" />
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2.5 z-50 text-left">
                <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Activity Alerts</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-indigo-600 hover:underline font-bold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <button
                        key={notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-55/40 transition-colors text-left ${
                          !notif.isRead ? 'bg-slate-50/50' : ''
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {notif.type === 'new_enquiry' && (
                            <div className="h-7 w-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                              <FileText className="h-4 w-4" />
                            </div>
                          )}
                          {notif.type === 'admission_confirmed' && (
                            <div className="h-7 w-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                              <UserCheck className="h-4 w-4" />
                            </div>
                          )}
                          {['status_changed', 'assessment_assigned', 'assessment_completed'].includes(notif.type) && (
                            <div className="h-7 w-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                              <ClipboardCheck className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{notif.title}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-medium">
                            {new Date(notif.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center space-x-3 p-1 rounded-xl hover:bg-slate-50 transition-colors"
            >
              {school?.logo ? (
                <img src={school.logo} alt="School Logo" className="h-8.5 w-8.5 rounded-lg object-contain bg-slate-50 p-1 border border-slate-100" />
              ) : (
                <div className="h-8.5 w-8.5 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  {school?.name?.charAt(0) || 'S'}
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-800 line-clamp-1 leading-snug">{school?.name || 'School Account'}</p>
                <p className="text-[10px] font-medium text-slate-400 truncate max-w-[120px]">{school?.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 hidden md:block" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 text-left">
                <div className="px-4 py-2 border-b border-slate-50">
                  <p className="text-xs font-bold text-slate-800 truncate">{school?.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{school?.email}</p>
                </div>
                <Link
                  to="/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 font-medium"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-medium border-t border-slate-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* HIGH / CRITICAL PRODUCT UPDATE POPUP MODAL */}
      {urgentAnnouncement && (
        <Modal
          isOpen={true}
          onClose={() => handleMarkAnnouncementRead(urgentAnnouncement._id)}
          title={getPopupTitle(urgentAnnouncement)}
        >
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-red-600 text-white animate-pulse">
                  {urgentAnnouncement.priority} PRIORITY
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  Category: {urgentAnnouncement.category}
                </span>
              </div>
              <span className="text-xs font-bold text-indigo-600">From: Admission CRM Team</span>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight mb-2">
                {urgentAnnouncement.title}
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 text-sm font-medium whitespace-pre-wrap leading-relaxed">
                {urgentAnnouncement.message}
              </div>
            </div>

            {urgentAnnouncement.attachment?.url && (
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-indigo-900 font-bold">
                  <Paperclip className="w-4 h-4 text-indigo-600" />
                  <span>{urgentAnnouncement.attachment.filename || 'Attached Reference File'}</span>
                </div>
                <a
                  href={urgentAnnouncement.attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-black text-indigo-600 hover:underline"
                >
                  Download / View File
                </a>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              {urgentAnnouncement.requireAcknowledgement ? (
                <Button
                  onClick={() => handleAcknowledgeAnnouncement(urgentAnnouncement._id)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  <CheckSquare className="w-4 h-4 mr-1.5 inline" />
                  I Acknowledge & Understand
                </Button>
              ) : (
                <Button
                  onClick={() => handleMarkAnnouncementRead(urgentAnnouncement._id)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5 inline" />
                  Mark as Read & Dismiss
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ANNOUNCEMENT DETAIL VIEW MODAL */}
      {selectedAnnouncementDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedAnnouncementDetail(null)}
          title={selectedAnnouncementDetail.title}
        >
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-slate-100 text-slate-800">
                  {selectedAnnouncementDetail.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-50 text-indigo-700">
                  {selectedAnnouncementDetail.priority} Priority
                </span>
              </div>
              <span className="text-xs font-bold text-indigo-600">From: Admission CRM Team</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 text-sm font-medium whitespace-pre-wrap leading-relaxed">
              {selectedAnnouncementDetail.message}
            </div>

            {selectedAnnouncementDetail.attachment?.url && (
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-indigo-900 font-bold">
                  <Paperclip className="w-4 h-4 text-indigo-600" />
                  <span>{selectedAnnouncementDetail.attachment.filename || 'Attached Reference File'}</span>
                </div>
                <a
                  href={selectedAnnouncementDetail.attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-black text-indigo-600 hover:underline"
                >
                  Download / View File
                </a>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              {!selectedAnnouncementDetail.isRead && (
                <Button
                  onClick={() => handleMarkAnnouncementRead(selectedAnnouncementDetail._id)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  Mark as Read
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default Navbar;
