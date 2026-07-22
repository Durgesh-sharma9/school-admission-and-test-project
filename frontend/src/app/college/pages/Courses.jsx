import React, { useState, useEffect } from 'react';
import api from '../../school/services/schoolApi';
import Loader from '../../../shared/components/Loader';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import Modal from '../../../shared/components/Modal';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    departmentId: '',
    duration: 3,
    eligibility: '',
    feesPerYear: 0,
    specializationsText: ''
  });

  const fetchCoursesAndDepts = async () => {
    try {
      setLoading(true);
      const [coursesRes, deptsRes] = await Promise.all([
        api.get('/college/courses'),
        api.get('/college/departments')
      ]);
      if (coursesRes.success) setCourses(coursesRes.data);
      if (deptsRes.success) setDepartments(deptsRes.data);
    } catch (error) {
      toast.error('Failed to load courses or departments details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursesAndDepts();
  }, []);

  const handleOpenAdd = () => {
    setEditingCourse(null);
    setFormData({
      name: '',
      code: '',
      departmentId: departments[0]?._id || '',
      duration: 3,
      eligibility: '',
      feesPerYear: 0,
      specializationsText: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      code: course.code,
      departmentId: course.departmentId?._id || course.departmentId || '',
      duration: course.duration,
      eligibility: course.eligibility || '',
      feesPerYear: course.feesPerYear || 0,
      specializationsText: (course.specializations || []).join(', ')
    });
    setModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete course "${name}"?`)) return;
    try {
      const res = await api.delete(`/college/courses/${id}`);
      if (res.success) {
        toast.success('Course deleted successfully');
        setCourses(courses.filter(c => c._id !== id));
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete course');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const specs = formData.specializationsText
      ? formData.specializationsText.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const payload = {
      name: formData.name,
      code: formData.code,
      departmentId: formData.departmentId,
      duration: formData.duration,
      eligibility: formData.eligibility,
      feesPerYear: formData.feesPerYear,
      specializations: specs
    };

    try {
      if (editingCourse) {
        const res = await api.put(`/college/courses/${editingCourse._id}`, payload);
        if (res.success) {
          toast.success('Course updated successfully!');
          fetchCoursesAndDepts();
          setModalOpen(false);
        }
      } else {
        const res = await api.post('/college/courses', payload);
        if (res.success) {
          toast.success('Course created successfully!');
          fetchCoursesAndDepts();
          setModalOpen(false);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save course');
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Courses Configuration</h2>
          <p className="text-slate-500 text-xs mt-0.5">Map courses, years duration, eligibility guidelines, fees structures, and streams.</p>
        </div>
        <Button onClick={handleOpenAdd} className="text-xs font-semibold py-2 px-4 inline-flex items-center">
          <Plus className="h-4 w-4 mr-1.5" /> Add Course
        </Button>
      </div>

      {loading ? (
        <Loader message="Loading college courses..." />
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">No Courses Registered</h3>
            <p className="text-slate-500 text-xs">Create your first Course details (e.g. B.Tech Computer Science, B.Com Hons).</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map(course => (
            <div key={course._id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {course.code}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{course.duration} Years</span>
                </div>
                <h3 className="font-bold text-slate-800 text-base">{course.name}</h3>
                <p className="text-xs text-slate-500">Dept: <span className="font-semibold text-slate-700">{course.departmentId?.name || 'Unassigned'}</span></p>
                <p className="text-xs text-slate-500">Fees: <span className="font-semibold text-slate-700">${course.feesPerYear}/Yr</span></p>
                <div className="text-xs text-slate-400">
                  <span className="font-bold text-slate-500 block mb-0.5">Specializations:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(course.specializations || []).length === 0 ? (
                      <span className="text-[10px] bg-slate-50 text-slate-400 px-2 py-0.5 rounded-sm">None</span>
                    ) : (
                      course.specializations.map((spec, i) => (
                        <span key={i} className="text-[9px] bg-slate-150 text-slate-600 px-1.5 py-0.5 rounded-sm border border-slate-100">
                          {spec}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => handleOpenEdit(course)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => handleDelete(course._id, course.name)}
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
          title={editingCourse ? 'Edit Course details' : 'Add New Course'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Course Name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. B.Tech Computer Science"
              required
            />
            <Input
              label="Course Code"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g. BTECH-CSE"
              required
              disabled={!!editingCourse}
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
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Duration (Years)"
                type="number"
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) || 3 })}
                required
              />
              <Input
                label="Fees per Year ($)"
                type="number"
                value={formData.feesPerYear}
                onChange={e => setFormData({ ...formData, feesPerYear: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            <Input
              label="Eligibility Requirements"
              value={formData.eligibility}
              onChange={e => setFormData({ ...formData, eligibility: e.target.value })}
              placeholder="e.g. 10+2 with 60% marks in Physics, Chemistry, Math"
            />
            <Input
              label="Specializations (Comma separated list)"
              value={formData.specializationsText}
              onChange={e => setFormData({ ...formData, specializationsText: e.target.value })}
              placeholder="e.g. Artificial Intelligence, Data Science, Cyber Security"
            />
            <div className="pt-2 flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCourse ? 'Update details' : 'Create Course'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Courses;
