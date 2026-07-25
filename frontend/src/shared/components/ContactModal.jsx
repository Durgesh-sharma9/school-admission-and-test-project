import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Phone,
  MessageCircle,
  Mail,
  PhoneCall,
  User,
  Users,
  Copy,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

const ContactModal = ({
  isOpen,
  onClose,
  data,
  type = 'school'
}) => {
  if (!isOpen || !data) return null;

  // Format WhatsApp numbers
  const formatWhatsApp = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/[\s\-()]/g, '');
    if (cleaned.startsWith('+')) return cleaned.replace('+', '');
    if (cleaned.startsWith('91') && cleaned.length > 10) return cleaned;
    return `91${cleaned}`;
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Normalization mapping
  const studentName = data.studentName || '—';
  const idBadge = data.enquiryId || data.applicationId || '—';
  const classOrCourse = data.classSeeking || data.courseId?.name || data.course || '—';
  
  // Status normalizer
  const getStatusText = () => {
    const rawStatus = data.status || data.stage || 'New';
    if (rawStatus === 'New Enquiry') return 'NEW';
    if (rawStatus === 'Not Interested') return 'REJECTED';
    if (rawStatus === 'Admission Confirmed') return 'CONFIRMED';
    return rawStatus.toUpperCase();
  };

  // Get correct numbers based on CRM type
  const studentMobile = type === 'school' ? (data.studentMobile || '') : (data.mobile || '');
  const parentMobile = type === 'school' ? (data.mobile || '') : (data.parentMobile || '');
  const parentWhatsApp = type === 'school' ? (data.whatsapp || data.mobile || '') : (data.parentMobile || '');
  
  const studentEmail = data.email || '';
  const parentEmail = data.parentEmail || '';

  // Determine which cards to show
  const showCallStudent = !!studentMobile;
  const showCallParent = !!parentMobile;
  const showWhatsAppStudent = !!studentMobile;
  const showWhatsAppParent = !!parentWhatsApp;
  const showEmailStudent = !!studentEmail;
  const showEmailParent = !!parentEmail;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col text-slate-800 text-left"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                <PhoneCall className="h-4.5 w-4.5 text-emerald-600" />
              </div>
              {type === 'school' ? 'Contact Student' : 'Contact Applicant'}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-semibold">
              <span className="font-bold text-slate-700">{studentName}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300 inline-block" />
              <span className="font-semibold text-indigo-650">{idBadge}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300 inline-block" />
              <span>{classOrCourse}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300 inline-block" />
              <span className="text-[10px] bg-indigo-50 text-indigo-705 px-2 py-0.5 rounded uppercase font-bold tracking-wide">
                {getStatusText()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-655"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Top Information responsive row */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-0.5">Student Mobile</p>
              <p className="font-bold text-slate-700">{studentMobile || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-0.5">Parent Mobile</p>
              <p className="font-bold text-slate-700">{parentMobile || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-0.5">Email Address</p>
              <p className="font-bold text-slate-700 truncate" title={studentEmail || parentEmail}>{studentEmail || parentEmail || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-0.5">CRM Status</p>
              <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full font-black text-[9px] bg-indigo-50 text-indigo-650 uppercase tracking-wide border border-indigo-100">
                {getStatusText()}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Action Cards grid */}
        <div className="px-6 py-6 overflow-y-auto max-h-[60vh]">
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-4">Quick CRM Action Panel</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* 📞 Call Student */}
            {showCallStudent && (
              <div className="group flex flex-col justify-between p-4.5 rounded-2xl border border-slate-200 bg-white hover:bg-blue-50/40 hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left">
                <a
                  href={`tel:${studentMobile}`}
                  className="flex items-center gap-4 cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center shrink-0 transition-colors">
                    <Phone className="h-5.5 w-5.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">Call Student</p>
                    <p className="text-xs text-slate-400 mt-0.5 font-semibold">{studentMobile}</p>
                  </div>
                </a>
                <div className="flex items-center gap-3 mt-4 pt-3.5 border-t border-slate-100 font-bold text-[11px] text-slate-500">
                  <a href={`sms:${studentMobile}`} className="hover:text-blue-600 transition-colors">📱 SMS</a>
                  <span className="text-slate-300 font-normal">|</span>
                  <button type="button" onClick={() => copyToClipboard(studentMobile, 'Student mobile')} className="hover:text-blue-600 transition-colors">📋 Copy</button>
                </div>
              </div>
            )}

            {/* 📞 Call Parent */}
            {showCallParent && (
              <div className="group flex flex-col justify-between p-4.5 rounded-2xl border border-slate-200 bg-white hover:bg-violet-50/40 hover:border-violet-300 hover:shadow-md transition-all duration-200 text-left">
                <a
                  href={`tel:${parentMobile}`}
                  className="flex items-center gap-4 cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-xl bg-violet-100 group-hover:bg-violet-200 flex items-center justify-center shrink-0 transition-colors">
                    <Users className="h-5.5 w-5.5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-violet-700 transition-colors">Call Parent</p>
                    <p className="text-xs text-slate-400 mt-0.5 font-semibold">{parentMobile}</p>
                  </div>
                </a>
                <div className="flex items-center gap-3 mt-4 pt-3.5 border-t border-slate-100 font-bold text-[11px] text-slate-500">
                  <a href={`sms:${parentMobile}`} className="hover:text-violet-600 transition-colors">📱 SMS</a>
                  <span className="text-slate-300 font-normal">|</span>
                  <button type="button" onClick={() => copyToClipboard(parentMobile, 'Parent mobile')} className="hover:text-violet-600 transition-colors">📋 Copy</button>
                </div>
              </div>
            )}

            {/* 💬 WhatsApp Student */}
            {showWhatsAppStudent && (
              <div className="group flex flex-col justify-between p-4.5 rounded-2xl border border-slate-200 bg-white hover:bg-green-50/40 hover:border-green-300 hover:shadow-md transition-all duration-200 text-left">
                <a
                  href={`https://wa.me/${formatWhatsApp(studentMobile)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-xl bg-green-100 group-hover:bg-green-200 flex items-center justify-center shrink-0 transition-colors">
                    <MessageCircle className="h-5.5 w-5.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-green-700 transition-colors">WhatsApp Student</p>
                    <p className="text-xs text-slate-400 mt-0.5 font-semibold">{studentMobile}</p>
                  </div>
                </a>
                <div className="flex items-center gap-3 mt-4 pt-3.5 border-t border-slate-100 font-bold text-[11px] text-slate-500">
                  <button type="button" onClick={() => copyToClipboard(studentMobile, 'Student WhatsApp')} className="hover:text-green-600 transition-colors">📋 Copy Link</button>
                </div>
              </div>
            )}

            {/* 💬 WhatsApp Parent */}
            {showWhatsAppParent && (
              <div className="group flex flex-col justify-between p-4.5 rounded-2xl border border-slate-200 bg-white hover:bg-emerald-50/40 hover:border-emerald-300 hover:shadow-md transition-all duration-200 text-left">
                <a
                  href={`https://wa.me/${formatWhatsApp(parentWhatsApp)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center shrink-0 transition-colors">
                    <MessageCircle className="h-5.5 w-5.5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">WhatsApp Parent</p>
                    <p className="text-xs text-slate-400 mt-0.5 font-semibold">{parentWhatsApp}</p>
                  </div>
                </a>
                <div className="flex items-center gap-3 mt-4 pt-3.5 border-t border-slate-100 font-bold text-[11px] text-slate-500">
                  <button type="button" onClick={() => copyToClipboard(parentWhatsApp, 'Parent WhatsApp')} className="hover:text-emerald-600 transition-colors">📋 Copy Link</button>
                </div>
              </div>
            )}

            {/* 📧 Email Student */}
            {showEmailStudent && (
              <div className="group flex flex-col justify-between p-4.5 rounded-2xl border border-slate-200 bg-white hover:bg-amber-50/40 hover:border-amber-300 hover:shadow-md transition-all duration-200 text-left">
                <a
                  href={`mailto:${studentEmail}`}
                  className="flex items-center gap-4 cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-xl bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center shrink-0 transition-colors">
                    <Mail className="h-5.5 w-5.5 text-amber-605" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-amber-700 transition-colors">Email Student</p>
                    <p className="text-xs text-slate-450 mt-0.5 font-semibold truncate max-w-[190px]">{studentEmail}</p>
                  </div>
                </a>
                <div className="flex items-center gap-3 mt-4 pt-3.5 border-t border-slate-100 font-bold text-[11px] text-slate-500">
                  <button type="button" onClick={() => copyToClipboard(studentEmail, 'Student email')} className="hover:text-amber-600 transition-colors">📋 Copy Email</button>
                </div>
              </div>
            )}

            {/* 📧 Email Parent */}
            {showEmailParent && (
              <div className="group flex flex-col justify-between p-4.5 rounded-2xl border border-slate-200 bg-white hover:bg-teal-50/40 hover:border-teal-300 hover:shadow-md transition-all duration-200 text-left">
                <a
                  href={`mailto:${parentEmail}`}
                  className="flex items-center gap-4 cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-xl bg-teal-100 group-hover:bg-teal-200 flex items-center justify-center shrink-0 transition-colors">
                    <Mail className="h-5.5 w-5.5 text-teal-605" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-teal-700 transition-colors">Email Parent</p>
                    <p className="text-xs text-slate-450 mt-0.5 font-semibold truncate max-w-[190px]">{parentEmail}</p>
                  </div>
                </a>
                <div className="flex items-center gap-3 mt-4 pt-3.5 border-t border-slate-100 font-bold text-[11px] text-slate-500">
                  <button type="button" onClick={() => copyToClipboard(parentEmail, 'Parent email')} className="hover:text-teal-600 transition-colors">📋 Copy Email</button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-xs"
          >
            Close Panel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ContactModal;
