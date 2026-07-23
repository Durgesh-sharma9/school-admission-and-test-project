const MasterDepartment = require('../models/MasterDepartment');
const MasterCourse = require('../models/MasterCourse');
const MasterSpecialization = require('../models/MasterSpecialization');
const CollegeAcademicConfig = require('../models/CollegeAcademicConfig');

// ==========================================
// Department Master CRUD
// ==========================================

const getMasterDepartments = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const filter = {};
    if (activeOnly === 'true') filter.isActive = true;

    const departments = await MasterDepartment.find(filter).sort({ name: 1 });
    return res.json({ success: true, data: departments });
  } catch (error) {
    console.error('Get master departments error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching departments' });
  }
};

const createMasterDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Name and Code are required' });
    }

    const dept = new MasterDepartment({ name, code });
    await dept.save();

    return res.status(201).json({ success: true, message: 'Department created successfully', data: dept });
  } catch (error) {
    console.error('Create master department error:', error);
    return res.status(550).json({ success: false, message: error.code === 11000 ? 'Department with this Name/Code already exists' : 'Server error creating department' });
  }
};

const updateMasterDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, isActive } = req.body;

    const dept = await MasterDepartment.findById(id);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    if (name !== undefined) dept.name = name;
    if (code !== undefined) dept.code = code;
    if (isActive !== undefined) dept.isActive = isActive;

    await dept.save();
    return res.json({ success: true, message: 'Department updated successfully', data: dept });
  } catch (error) {
    console.error('Update master department error:', error);
    return res.status(550).json({ success: false, message: error.code === 11000 ? 'Department with this Name/Code already exists' : 'Server error updating department' });
  }
};

const deleteMasterDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if courses reference this department
    const courseRef = await MasterCourse.findOne({ departmentId: id });
    if (courseRef) {
      return res.status(400).json({ success: false, message: 'Cannot delete Department as courses reference it' });
    }

    const dept = await MasterDepartment.findByIdAndDelete(id);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    return res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete master department error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting department' });
  }
};


// ==========================================
// Course Master CRUD
// ==========================================

const getMasterCourses = async (req, res) => {
  try {
    const { activeOnly, departmentId } = req.query;
    const filter = {};
    if (activeOnly === 'true') filter.isActive = true;
    if (departmentId) filter.departmentId = departmentId;

    const courses = await MasterCourse.find(filter)
      .populate('departmentId', 'name code')
      .sort({ name: 1 });
    return res.json({ success: true, data: courses });
  } catch (error) {
    console.error('Get master courses error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching courses' });
  }
};

const createMasterCourse = async (req, res) => {
  try {
    const { name, code, departmentId } = req.body;
    if (!name || !code || !departmentId) {
      return res.status(400).json({ success: false, message: 'Name, Code and Department are required' });
    }

    const course = new MasterCourse({ name, code, departmentId });
    await course.save();

    return res.status(201).json({ success: true, message: 'Course created successfully', data: course });
  } catch (error) {
    console.error('Create master course error:', error);
    return res.status(550).json({ success: false, message: error.code === 11000 ? 'Course with this Code already exists in the selected Department' : 'Server error creating course' });
  }
};

const updateMasterCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, departmentId, isActive } = req.body;

    const course = await MasterCourse.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (name !== undefined) course.name = name;
    if (code !== undefined) course.code = code;
    if (departmentId !== undefined) course.departmentId = departmentId;
    if (isActive !== undefined) course.isActive = isActive;

    await course.save();
    return res.json({ success: true, message: 'Course updated successfully', data: course });
  } catch (error) {
    console.error('Update master course error:', error);
    return res.status(550).json({ success: false, message: error.code === 11000 ? 'Course with this Code already exists in the selected Department' : 'Server error updating course' });
  }
};

const deleteMasterCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if specializations reference this course
    const specRef = await MasterSpecialization.findOne({ courseId: id });
    if (specRef) {
      return res.status(400).json({ success: false, message: 'Cannot delete Course as specializations reference it' });
    }

    const course = await MasterCourse.findByIdAndDelete(id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    return res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete master course error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting course' });
  }
};


// ==========================================
// Specialization Master CRUD
// ==========================================

const getMasterSpecializations = async (req, res) => {
  try {
    const { activeOnly, courseId } = req.query;
    const filter = {};
    if (activeOnly === 'true') filter.isActive = true;
    if (courseId) filter.courseId = courseId;

    const specializations = await MasterSpecialization.find(filter)
      .populate({
        path: 'courseId',
        select: 'name code departmentId',
        populate: { path: 'departmentId', select: 'name code' }
      })
      .sort({ name: 1 });
    return res.json({ success: true, data: specializations });
  } catch (error) {
    console.error('Get master specializations error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching specializations' });
  }
};

const createMasterSpecialization = async (req, res) => {
  try {
    const { name, courseId } = req.body;
    if (!name || !courseId) {
      return res.status(400).json({ success: false, message: 'Name and Course reference are required' });
    }

    const spec = new MasterSpecialization({ name, courseId });
    await spec.save();

    return res.status(201).json({ success: true, message: 'Specialization created successfully', data: spec });
  } catch (error) {
    console.error('Create master specialization error:', error);
    return res.status(550).json({ success: false, message: error.code === 11000 ? 'Specialization already exists for this course' : 'Server error creating specialization' });
  }
};

const updateMasterSpecialization = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, courseId, isActive } = req.body;

    const spec = await MasterSpecialization.findById(id);
    if (!spec) {
      return res.status(404).json({ success: false, message: 'Specialization not found' });
    }

    if (name !== undefined) spec.name = name;
    if (courseId !== undefined) spec.courseId = courseId;
    if (isActive !== undefined) spec.isActive = isActive;

    await spec.save();
    return res.json({ success: true, message: 'Specialization updated successfully', data: spec });
  } catch (error) {
    console.error('Update master specialization error:', error);
    return res.status(550).json({ success: false, message: error.code === 11000 ? 'Specialization already exists for this course' : 'Server error updating specialization' });
  }
};

const deleteMasterSpecialization = async (req, res) => {
  try {
    const { id } = req.params;

    const spec = await MasterSpecialization.findByIdAndDelete(id);
    if (!spec) {
      return res.status(404).json({ success: false, message: 'Specialization not found' });
    }

    return res.json({ success: true, message: 'Specialization deleted successfully' });
  } catch (error) {
    console.error('Delete master specialization error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting specialization' });
  }
};


// ==========================================
// College Tenant Configurations
// ==========================================

const getCollegeAcademicConfig = async (req, res) => {
  try {
    // If college admin, req.school.id. If superadmin, allow query parameters
    const schoolId = req.school ? req.school.id : req.query.schoolId || req.params.schoolId;
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'School/College ID is required' });
    }

    let config = await CollegeAcademicConfig.findOne({ schoolId })
      .populate('selectedDepartments')
      .populate('selectedCourses')
      .populate('selectedSpecializations');

    if (!config) {
      config = new CollegeAcademicConfig({
        schoolId,
        selectedDepartments: [],
        selectedCourses: [],
        selectedSpecializations: []
      });
      await config.save();
    }

    return res.json({ success: true, data: config });
  } catch (error) {
    console.error('Get college configuration error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching academic configuration' });
  }
};

const saveCollegeAcademicConfig = async (req, res) => {
  try {
    const schoolId = req.school.id;
    const {
      selectedDepartments,
      selectedCourses,
      selectedSpecializations
    } = req.body;

    let config = await CollegeAcademicConfig.findOne({ schoolId });
    if (!config) {
      config = new CollegeAcademicConfig({ schoolId });
    }

    config.selectedDepartments = selectedDepartments || [];
    config.selectedCourses = selectedCourses || [];
    config.selectedSpecializations = selectedSpecializations || [];

    await config.save();
    return res.json({ success: true, message: 'Academic configurations saved successfully', data: config });
  } catch (error) {
    console.error('Save college configuration error:', error);
    return res.status(500).json({ success: false, message: 'Server error saving academic configuration' });
  }
};

const getAcademicMastersForCollege = async (req, res) => {
  try {
    const departments = await MasterDepartment.find({ isActive: true }).sort({ name: 1 });
    const courses = await MasterCourse.find({ isActive: true }).sort({ name: 1 });
    const specializations = await MasterSpecialization.find({ isActive: true }).sort({ name: 1 });

    return res.json({
      success: true,
      data: {
        departments,
        courses,
        specializations
      }
    });
  } catch (error) {
    console.error('Get all masters error:', error);
    return res.status(550).json({ success: false, message: 'Server error loading masters list' });
  }
};

module.exports = {
  getMasterDepartments,
  createMasterDepartment,
  updateMasterDepartment,
  deleteMasterDepartment,
  
  getMasterCourses,
  createMasterCourse,
  updateMasterCourse,
  deleteMasterCourse,
  
  getMasterSpecializations,
  createMasterSpecialization,
  updateMasterSpecialization,
  deleteMasterSpecialization,

  getCollegeAcademicConfig,
  saveCollegeAcademicConfig,
  getAcademicMastersForCollege
};
