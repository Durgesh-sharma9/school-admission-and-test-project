import React, { useState, useEffect } from 'react';
import { Bell, Send, Check, X, Clock, AlertCircle } from 'lucide-react';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendMode, setSendMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'normal',
    target: 'all',
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Mock data for now - will be replaced with actual API call
      setNotifications([
        {
          _id: '1',
          title: 'System Maintenance Scheduled',
          message: 'We will be performing scheduled maintenance on July 25th from 2 AM to 4 AM UTC.',
          priority: 'high',
          target: 'all',
          sentAt: '2026-07-18T10:00:00Z',
          sentBy: 'Super Admin',
          readCount: 145,
          totalRecipients: 150,
        },
        {
          _id: '2',
          title: 'New Feature: Advanced Analytics',
          message: 'Check out our new advanced analytics dashboard with real-time insights.',
          priority: 'normal',
          target: 'all',
          sentAt: '2026-07-15T14:30:00Z',
          sentBy: 'Super Admin',
          readCount: 120,
          totalRecipients: 150,
        },
        {
          _id: '3',
          title: 'Payment Gateway Update',
          message: 'We have updated our payment gateway for better security and faster transactions.',
          priority: 'low',
          target: 'active',
          sentAt: '2026-07-10T09:00:00Z',
          sentBy: 'Super Admin',
          readCount: 45,
          totalRecipients: 50,
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      // await superAdminApi.post('/notifications', formData);
      alert('Notification sent successfully!');
      setSendMode(false);
      setFormData({ title: '', message: '', priority: 'normal', target: 'all' });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('Failed to send notification');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-400';
      case 'normal': return 'bg-blue-500/10 text-blue-400';
      case 'low': return 'bg-slate-500/10 text-slate-400';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4" />;
      case 'normal': return <Bell className="w-4 h-4" />;
      case 'low': return <Clock className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400">Send and manage notifications to schools</p>
        </div>
        <Button
          onClick={() => setSendMode(!sendMode)}
          className="flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Send Notification
        </Button>
      </div>

      {/* Send Notification Form */}
      {sendMode && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Send New Notification</h2>
          <form onSubmit={handleSend} className="space-y-4">
            <Input
              label="Title"
              name="title"
              type="text"
              placeholder="Notification title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase mb-1">
                Message
              </label>
              <textarea
                name="message"
                placeholder="Notification message"
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase mb-1">
                  Target
                </label>
                <select
                  name="target"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Schools</option>
                  <option value="active">Active Schools</option>
                  <option value="trial">Trial Schools</option>
                  <option value="selected">Selected Schools</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSendMode(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Send Notification
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Notification History */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Notification History</h2>
        </div>
        <div className="divide-y divide-slate-700">
          {notifications.map((notification) => (
            <div key={notification._id} className="p-6 hover:bg-slate-700/30">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getPriorityColor(notification.priority)}`}>
                    {getPriorityIcon(notification.priority)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{notification.title}</h3>
                    <p className="text-sm text-slate-400">
                      Sent to {notification.target === 'all' ? 'all schools' : notification.target} • {new Date(notification.sentAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                  {notification.priority}
                </span>
              </div>
              <p className="text-slate-300 mb-3">{notification.message}</p>
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Sent by {notification.sentBy}</span>
                <span>{notification.readCount}/{notification.totalRecipients} read</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
