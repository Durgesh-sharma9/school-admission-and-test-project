import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/schoolApi';
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
    case 'Maintenance': return '🔧 Maintenance Notice';
    case 'Security': return '🛡️ Security Update';
    case 'Billing': return '💳 Billing Notice';
    case 'Update': return '🚀 Platform Update';
    case 'Feature': return '✨ New Feature Release';
    case 'Emergency': return '🚨 Urgent System Alert';
    default: return '📢 Platform Announcement';
  }
};

const Navbar = ({ toggleSidebar, title, module = 'school' }) => {
  const { school, logout } = useAuth();
  const navigate = useNavigate();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [announcementDrawerOpen, setAnnouncementDrawerOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [announcements, setAnnouncements] = useState([]);
  const [unreadAnnouncementCount, setUnreadAnnouncementCount] = useState(0);
  const [urgentAnnouncement, setUrgentAnnouncement] = useState(null);
  const [selectedAnnouncementDetail, setSelectedAnnouncementDetail] = useState(null);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);

  const profileRef = useRef(null);
  const bellRef = useRef(null);
  const annRef = useRef(null);

  const fetchPendingTasksCount = async () => {
    try {
      const url = module === 'school' ? '/enquiries' : '/college/applications';
      const params = module === 'school' ? { limit: 10000 } : {};
      const res = await api.get(url, { params });
      if (res.success && res.data) {
        let count = 0;
        const now = new Date();
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        res.data.forEach(item => {
          (item.journey || []).forEach(stage => {
            if (stage.followUpDate) {
              const isCompleted = !!stage.completedAt || stage.status === 'Completed';
              const isCancelled = stage.status === 'Cancelled';
              if (!isCompleted && !isCancelled) {
                const fDate = new Date(stage.followUpDate);
                if (fDate <= endOfToday) {
                  count++;
                }
              }
            }
          });
        });
        setPendingTasksCount(count);
      }
    } catch (err) {
      console.error('Failed to load pending tasks count:', err);
    }
  };

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
      if (module === 'school') {
        fetchNotifications();
        fetchAnnouncements();
      }
      fetchPendingTasksCount();
      const interval = setInterval(() => {
        if (module === 'school') {
          fetchNotifications();
          fetchAnnouncements();
        }
        fetchPendingTasksCount();
      }, 30000);

      window.addEventListener('crm-tasks-updated', fetchPendingTasksCount);

      return () => {
        clearInterval(interval);
        window.removeEventListener('crm-tasks-updated', fetchPendingTasksCount);
      };
    }
  }, [school, module]);

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
     <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white border-b border-gray-100 shadow-[0_3px_12px_rgba(236,72,153,0.08),0_1px_4px_rgba(15,23,42,0.04)] transition-all duration-300 animate-[slide-down_0.3s_ease_both]">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-pink-50 hover:text-[#F21D6B] transition-all duration-200 lg:hidden"
          >
            <Menu className="h-5.5 w-5.5" />
          </button>
          <h1 className="text-lg font-extrabold text-gray-800 tracking-tight">{title}</h1>
        </div>

        {/* Right Navbar elements */}
        <div className="flex items-center space-x-4">
          {school?.subscription?.plan === 'free-trial' && (
            <div className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-pink-500 to-[#F21D6B] text-white shadow-sm">
              Active Free Trial
            </div>
          )}

          {module === 'school' && (
            <div className="relative" ref={annRef}>
              <button
                onClick={() => {
                  setAnnouncementDrawerOpen(!announcementDrawerOpen);
                  if (!announcementDrawerOpen) fetchAnnouncements();
                }}
                className="relative p-2 rounded-lg text-white/60 hover:bg-[#E91E63] hover:text-white transition-colors"
              >
                <Megaphone className="h-5 w-5" />
                {unreadAnnouncementCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-[#E91E63] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#1E1F2B]">
                    {unreadAnnouncementCount}
                  </span>
                )}
              </button>

              {announcementDrawerOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#1B1E28] rounded-2xl shadow-xl border border-white/10 py-2.5 z-50 text-left">
                  <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Megaphone className="w-4 h-4 text-[#E91E63]" />
                      Platform Updates & Notices
                    </span>
                    <span className="text-[10px] font-bold text-white bg-[#E91E63] px-2 py-0.5 rounded-full">
                      {unreadAnnouncementCount} Unread
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {announcements.length === 0 ? (
                      <div className="py-8 text-center text-xs text-white/40">No system updates at this time.</div>
                    ) : (
                      announcements.map((ann) => (
                        <div
                          key={ann._id}
                          onClick={() => setSelectedAnnouncementDetail(ann)}
                          className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 border-b border-white/5 transition-colors text-left cursor-pointer ${
                            !ann.isRead ? 'bg-white/[0.02]' : ''
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {ann.priority === 'Critical' || ann.priority === 'High' ? (
                              <div className="h-7 w-7 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                                <AlertTriangle className="h-4 w-4" />
                              </div>
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-[#E91E63]/20 text-[#E91E63] flex items-center justify-center">
                                <Megaphone className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-white truncate">{ann.title}</p>
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/60 shrink-0">
                                {ann.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-white/60 line-clamp-2 mt-0.5">{ann.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tasks Badge */}
          <Link
            to={module === 'school' ? '/tasks' : '/college/tasks'}
            className="relative p-2 rounded-lg text-gray-500 hover:bg-pink-50 hover:text-[#F21D6B] transition-all duration-200 shrink-0 group flex items-center"
          >
            <ClipboardCheck className="h-5 w-5" />
            {pendingTasksCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-[#1E1F2B] px-1 leading-none">
                {pendingTasksCount}
              </span>
            )}

            {/* Hover Tooltip */}
            <div className="absolute right-0 top-10 hidden group-hover:flex flex-col items-center bg-slate-950 text-white text-[10px] rounded-lg py-1.5 px-2.5 shadow-lg border border-slate-800 z-50 pointer-events-none w-36 whitespace-normal leading-tight text-center font-bold">
              <div>Today's Tasks</div>
              <div className="text-[#E91E63] text-[9px] font-extrabold mt-0.5">
                {pendingTasksCount} Pending Tasks
              </div>
            </div>
          </Link>

          {module === 'school' && (
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => {
                  setBellOpen(!bellOpen);
                  if (!bellOpen) fetchNotifications();
                }}
                className="relative p-2 rounded-lg text-gray-500 hover:bg-pink-50 hover:text-[#F21D6B] transition-all duration-200"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-pink-500 rounded-full border-2 border-white" />
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#1B1E28] rounded-2xl shadow-xl border border-white/10 py-2.5 z-50 text-left">
                  <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Activity Alerts</span>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-[10px] text-[#E91E63] hover:underline font-bold">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-white/40">No notifications yet.</div>
                    ) : (
                      notifications.map((notif) => (
                        <button
                          key={notif._id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 border-b border-white/5 transition-colors text-left ${
                            !notif.isRead ? 'bg-white/[0.02]' : ''
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {notif.type === 'new_enquiry' && (
                              <div className="h-7 w-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center"><FileText className="h-4 w-4" /></div>
                            )}
                            {notif.type === 'admission_confirmed' && (
                              <div className="h-7 w-7 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center"><UserCheck className="h-4 w-4" /></div>
                            )}
                            {['status_changed', 'assessment_assigned', 'assessment_completed'].includes(notif.type) && (
                              <div className="h-7 w-7 rounded-full bg-[#E91E63]/20 text-[#E91E63] flex items-center justify-center"><ClipboardCheck className="h-4 w-4" /></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{notif.title}</p>
                            <p className="text-[11px] text-white/60 line-clamp-2 mt-0.5">{notif.message}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-gray-50 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200"
            >
              {school?.logo ? (
                <img src={school.logo} alt="School Logo" className="h-8.5 w-8.5 rounded-lg object-contain bg-white p-1 border border-white/10" />
              ) : (
                <div className="h-8.5 w-8.5 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  {school?.name?.charAt(0) || 'S'}
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-gray-800 line-clamp-1 leading-snug">{school?.name || 'School Account'}</p>
                <p className="text-[10px] font-medium text-gray-400 truncate max-w-[120px]">{school?.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 hidden md:block" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1B1E28] rounded-2xl shadow-xl border border-white/10 py-1.5 z-50 text-left">
                <div className="px-4 py-2 border-b border-white/10">
                  <p className="text-xs font-bold text-white truncate">{school?.name}</p>
                  <p className="text-[10px] text-white/60 truncate">{school?.email}</p>
                </div>
                <Link
                  to={module === 'school' ? '/settings' : '/college/settings'}
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center space-x-2.5 px-4 py-2 text-xs text-white/80 hover:bg-white/5 hover:text-[#E91E63] font-medium"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to log out?')) {
                      logout();
                      navigate('/login');
                    }
                  }}
                  className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 font-medium border-t border-white/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Keeping your modals structurally same but with lighter tailwind classes */}
      {urgentAnnouncement && (
        <Modal isOpen={true} onClose={() => handleMarkAnnouncementRead(urgentAnnouncement._id)} title={getPopupTitle(urgentAnnouncement)}>
          <div className="space-y-4 text-left">
            <h3 className="text-base font-extrabold text-gray-900">{urgentAnnouncement.title}</h3>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-gray-800 text-sm font-medium">{urgentAnnouncement.message}</div>
            <div className="flex justify-end space-x-3 pt-2">
              <Button onClick={() => handleMarkAnnouncementRead(urgentAnnouncement._id)} className="bg-gradient-to-r from-[#FF2D75] to-[#FF4F8B] hover:opacity-90 text-white font-bold text-xs px-4 py-2 rounded-lg">Mark as Read</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
export default Navbar;