import React, { useState, useEffect } from 'react';
import { useAuth } from '../../school/contexts/AuthContext';
import Loader from '../../../shared/components/Loader';
import api from '../../school/services/schoolApi';
import toast from 'react-hot-toast';
import {
  ClipboardList,
  Clock,
  FileText,
  UserCheck,
  CheckCircle,
  HelpCircle,
  Award,
  Home,
  Compass,
  DollarSign
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#4f46e5', '#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];

const Dashboard = () => {
  const { school } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/college/dashboard/analytics');
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load college analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <Loader message="Aggregating college CRM metrics..." />;
  }

  const stats = data?.stats || {
    totalApplications: 0,
    todayApplications: 0,
    pendingVerification: 0,
    counsellingScheduled: 0,
    counsellingCompleted: 0,
    feePending: 0,
    confirmedAdmissions: 0,
    scholarshipRequests: 0,
    hostelRequests: 0
  };

  const courseDistribution = data?.courseDistribution || [];
  const departmentDistribution = data?.departmentDistribution || [];
  const cityDistribution = data?.cityDistribution || [];
  const leadSourceDistribution = data?.leadSourceDistribution || [];
  const recentApplications = data?.recentApplications || [];

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{school?.name || 'College Admissions Desk'}</h2>
          <p className="text-slate-500 text-xs mt-1">Here is your campus admission funnel status for this academic year.</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { title: 'Total Applications', val: stats.totalApplications, icon: ClipboardList, color: 'indigo' },
          { title: 'Today\'s Applications', val: stats.todayApplications, icon: Clock, color: 'cyan' },
          { title: 'Docs Pending', val: stats.pendingVerification, icon: FileText, color: 'amber' },
          { title: 'Counselling Scheduled', val: stats.counsellingScheduled, icon: Compass, color: 'fuchsia' },
          { title: 'Counselling Completed', val: stats.counsellingCompleted, icon: UserCheck, color: 'violet' },
          { title: 'Fee Pending', val: stats.feePending, icon: DollarSign, color: 'rose' },
          { title: 'Admissions Confirmed', val: stats.confirmedAdmissions, icon: CheckCircle, color: 'emerald' },
          { title: 'Scholarship Requests', val: stats.scholarshipRequests, icon: Award, color: 'amber' },
          { title: 'Hostel Requests', val: stats.hostelRequests, icon: Home, color: 'indigo' }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 leading-tight truncate">{item.title}</span>
                <span className={`h-7 w-7 rounded-lg bg-${item.color}-50 text-${item.color}-600 flex items-center justify-center shrink-0`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-800 mt-2">{item.val}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department distribution */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Applications by Department</h3>
          <div className="h-64">
            {departmentDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">No active applications across departments</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                  <YAxis dataKey="code" type="category" stroke="#94a3b8" fontSize={10} width={60} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]}>
                    {departmentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Course distribution */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Applications by Course</h3>
          <div className="h-64">
            {courseDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">No courses configured or active</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="code" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* City-wise applications */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4">City-wise Applications</h3>
          <div className="h-64">
            {cityDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">No city details registered</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="city" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Lead Source Analytics */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Lead Source Analytics</h3>
          <div className="h-64 flex items-center justify-center">
            {leadSourceDistribution.length === 0 ? (
              <div className="text-slate-400 text-xs">No lead source statistics active</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadSourceDistribution}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {leadSourceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Applications table */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Recent Applicant Registrations</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                <th className="py-3 px-4">Application ID</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Selected Course</th>
                <th className="py-3 px-4">Counselling Stage</th>
                <th className="py-3 px-4 text-right">Registered Date</th>
              </tr>
            </thead>
            <tbody>
              {recentApplications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">No recent applications found</td>
                </tr>
              ) : (
                recentApplications.map((app) => (
                  <tr key={app._id} className="border-b border-slate-50 text-xs text-slate-600 hover:bg-slate-50/55 transition-colors">
                    <td className="py-3 px-4 font-bold text-indigo-650">{app.applicationId}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{app.studentName}</td>
                    <td className="py-3 px-4">{app.courseId?.name || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[9px] bg-indigo-50 text-indigo-700 uppercase">
                        {app.stage}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">{new Date(app.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
