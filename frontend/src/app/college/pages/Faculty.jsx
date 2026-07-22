import React, { useState, useEffect } from 'react';
import api from '../../school/services/schoolApi';
import Loader from '../../../shared/components/Loader';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import Modal from '../../../shared/components/Modal';

const Faculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    departmentId: '',
    status: 'Active'
  });

  const fetchFacultyAndDepts = async () => {
    try {
      setLoading(true);
      const [facRes, deptsRes] = await Promise.all([
        api.get('/college/faculty'),
        api.get('/college/departments')
      ]);
      if (facRes.success) setFaculty(facRes.data);
      if (deptsRes.success) setDepartments(deptsRes.data);
    } catch (error) {
      toast.error('Failed to load faculty or departments details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyAndDepts();
  }, []);

  const handleOpenAdd = () => {
    setEditingFaculty(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      designation: '',
      departmentId: departments[0]?._id || '',
      status: 'Active'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (fac) => {
    setEditingFaculty(fac);
    setFormData({
      name: fac.name,
      email: fac.email,
      phone: fac.phone || '',
      designation: fac.designation,
      departmentId: fac.departmentId?._id || fac.departmentId || '',
      status: fac.status || 'Active'
    });
    setModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete faculty member "${name}"?`)) return;
    try {
      const res = await api.delete(`/college/faculty/${id}`);
      if (res.success) {
        toast.success('Faculty member deleted successfully');
        setFaculty(faculty.filter(f => f._id !== id));
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete faculty member');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFaculty) {
        const res = await api.put(`/college/faculty/${editingFaculty._id}`, formData);
        if (res.success) {
          toast.success('Faculty member details updated successfully!');
          fetchFacultyAndDepts();
          setModalOpen(false);
        }
      } else {
        const res = await api.post('/college/faculty', formData);
        if (res.success) {
          toast.success('Faculty member added successfully!');
          fetchFacultyAndDepts();
          setModalOpen(false);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save faculty member');
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Faculty Registry</h2>
          <p className="text-slate-500 text-xs mt-0.5">Manage teaching credentials, HOD positions, and academic assignments.</p>
        </div>
        <Button onClick={handleOpenAdd} className="text-xs font-semibold py-2 px-4 inline-flex items-center">
          <Plus className="h-4 w-4 mr-1.5" /> Add Faculty
        </Button>
      </div>

      {loading ? (
        <Loader message="Loading faculty list..." />
      ) : faculty.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">No Faculty Registered</h3>
            <p className="text-slate-500 text-xs">Create your first faculty record (e.g. Professor, Assistant Professor).</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {faculty.map(fac => (
            <div key={fac._id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wide ${
                    fac.status === 'Active' ? 'bg-emerald-50 text-emerald-650' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {fac.status}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-base">{fac.name}</h3>
                <p className="text-xs text-indigo-600 font-semibold">{fac.designation}</p>
                <p className="text-xs text-slate-500">Dept: <span className="font-semibold text-slate-700">{fac.departmentId?.name || 'Unassigned'}</span></p>
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <p>Email: {fac.email}</p>
                  <p>Phone: {fac.phone || '-'}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => handleOpenEdit(fac)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => handleDelete(fac._id, fac.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingFaculty ? 'Edit Faculty member details' : 'Add New Faculty Member'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Faculty Member Name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Dr. Ramesh Kumar"
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. ramesh@college.edu"
              required
            />
            <Input
              label="Contact Number"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. 9876543210"
            />
            <Input
              label="Designation"
              value={formData.designation}
              onChange={e => setFormData({ ...formData, designation: e.target.value })}
              placeholder="e.g. Professor / Asst. Professor"
              required
            />
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Select Department</label>
              <select
                value={formData.departmentId}
                onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
                required
              >
                <option value="">-- Select Department --</option>
                {departments.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="pt-2 flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingFaculty ? 'Update details' : 'Add Faculty'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Faculty;
