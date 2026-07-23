const CollegeAcademicConfig = require('../models/CollegeAcademicConfig');

// @desc    Get all departments for a college
// @route   GET /api/v1/college/departments
// @access  Private (College Admin)
const getDepartments = async (req, res) => {
  try {
    const collegeId = req.school.id;
    const config = await CollegeAcademicConfig.findOne({ schoolId: collegeId }).populate('selectedDepartments');
    const departments = config ? config.selectedDepartments : [];
    return res.json({ success: true, data: departments });
  } catch (error) {
    console.error('Get departments error:', error);
    return res.status(550).json({ success: false, message: 'Server error fetching departments' });
  }
};

// @desc    Create a new department
// @route   POST /api/v1/college/departments
// @access  Private (College Admin)
const createDepartment = async (req, res) => {
  try {
    const collegeId = req.school.id;
    const { name, code, headOfDepartment, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Department name and code are required' });
    }

    const exists = await CollegeDepartment.findOne({ schoolId: collegeId, code: code.toUpperCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Department with this code already exists' });
    }

    const dept = new CollegeDepartment({
      name,
      code: code.toUpperCase(),
      headOfDepartment,
      description,
      schoolId: collegeId
    });

    await dept.save();
    return res.status(201).json({ success: true, data: dept });
  } catch (error) {
    console.error('Create department error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating department' });
  }
};

// @desc    Update department details
// @route   PUT /api/v1/college/departments/:id
// @access  Private (College Admin)
const updateDepartment = async (req, res) => {
  try {
    const collegeId = req.school.id;
    const { id } = req.params;
    const { name, code, headOfDepartment, description } = req.body;

    const dept = await CollegeDepartment.findOne({ _id: id, schoolId: collegeId });
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    if (code && code.toUpperCase() !== dept.code) {
      const exists = await CollegeDepartment.findOne({ schoolId: collegeId, code: code.toUpperCase() });
      if (exists) {
        return res.status(400).json({ success: false, message: 'Department with this code already exists' });
      }
      dept.code = code.toUpperCase();
    }

    if (name) dept.name = name;
    if (headOfDepartment !== undefined) dept.headOfDepartment = headOfDepartment;
    if (description !== undefined) dept.description = description;

    await dept.save();
    return res.json({ success: true, data: dept });
  } catch (error) {
    console.error('Update department error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating department' });
  }
};

// @desc    Delete a department
// @route   DELETE /api/v1/college/departments/:id
// @access  Private (College Admin)
const deleteDepartment = async (req, res) => {
  try {
    const collegeId = req.school.id;
    const { id } = req.params;

    const dept = await CollegeDepartment.findOneAndDelete({ _id: id, schoolId: collegeId });
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    return res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting department' });
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
