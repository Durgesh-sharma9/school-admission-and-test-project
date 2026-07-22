import React, { useState, useEffect } from 'react';
import api from '../../school/services/schoolApi';
import Loader from '../../../shared/components/Loader';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Layers } from 'lucide-react';
import Modal from '../../../shared/components/Modal';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    headOfDepartment: '',
    description: ''
  });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/college/departments');
      if (res.success) {
        setDepartments(res.data);
      }
    } catch (error) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenAdd = () => {
    setEditingDept(null);
    setFormData({ name: '', code: '', headOfDepartment: '', description: '' });
    setModalOpen(true);
  };

  const handleOpenEdit = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      headOfDepartment: dept.headOfDepartment || '',
      description: dept.description || ''
    });
    setModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete department "${name}"?`)) return;
    try {
      const res = await api.delete(`/college/departments/${id}`);
      if (res.success) {
        toast.success('Department deleted successfully');
        setDepartments(departments.filter(d => d._id !== id));
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete department');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDept) {
        const res = await api.put(`/college/departments/${editingDept._id}`, formData);
        if (res.success) {
          toast.success('Department updated successfully!');
          fetchDepartments();
          setModalOpen(false);
        }
      } else {
        const res = await api.post('/college/departments', formData);
        if (res.success) {
          toast.success('Department created successfully!');
          fetchDepartments();
          setModalOpen(false);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save department');
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Departments Management</h2>
          <p className="text-slate-500 text-xs mt-0.5">Manage administrative and academic departments inside your college.</p>
        </div>
        <Button onClick={handleOpenAdd} className="text-xs font-semibold py-2 px-4 inline-flex items-center">
          <Plus className="h-4 w-4 mr-1.5" /> Add Department
        </Button>
      </div>

      {loading ? (
        <Loader message="Loading departments..." />
      ) : departments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">No Departments Mapped</h3>
            <p className="text-slate-500 text-xs">Create your first department list (e.g. Science, Commerce, Engineering).</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map(dept => (
            <div key={dept._id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {dept.code}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-base">{dept.name}</h3>
                <p className="text-xs text-slate-500">HOD: <span className="font-semibold text-slate-700">{dept.headOfDepartment || 'Not assigned'}</span></p>
                <p className="text-xs text-slate-400 line-clamp-2">{dept.description || 'No description provided.'}</p>
              </div>
              <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => handleOpenEdit(dept)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => handleDelete(dept._id, dept.name)}
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
          title={editingDept ? 'Edit Department details' : 'Add New Department'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Department Name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Computer Science & Engineering"
              required
            />
            <Input
              label="Department Code"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g. CSE"
              required
              disabled={!!editingDept}
            />
            <Input
              label="Head of Department (HOD)"
              value={formData.headOfDepartment}
              onChange={e => setFormData({ ...formData, headOfDepartment: e.target.value })}
              placeholder="e.g. Dr. Anita Sen"
            />
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the department's mandate..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                rows={3}
              />
            </div>
            <div className="pt-2 flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingDept ? 'Update details' : 'Create Department'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Departments;
