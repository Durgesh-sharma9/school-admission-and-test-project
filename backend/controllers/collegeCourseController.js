const CollegeAcademicConfig = require('../models/CollegeAcademicConfig');

// @desc    Get all courses for a college
// @route   GET /api/v1/college/courses
// @access  Private (College Admin)
const getCourses = async (req, res) => {
  try {
    const collegeId = req.school.id;
    const config = await CollegeAcademicConfig.findOne({ schoolId: collegeId }).populate({
      path: 'selectedCourses',
      populate: { path: 'departmentId', select: 'name code' }
    });
    const courses = config ? config.selectedCourses : [];
    return res.json({ success: true, data: courses });
  } catch (error) {
    console.error('Get courses error:', error);
    return res.status(550).json({ success: false, message: 'Server error fetching courses' });
  }
};

// @desc    Create a new course
// @route   POST /api/v1/college/courses
// @access  Private (College Admin)
const createCourse = async (req, res) => {
  try {
    const collegeId = req.school.id;
    const { name, code, departmentId, duration, eligibility, feesPerYear, specializations } = req.body;

    if (!name || !code || !departmentId) {
      return res.status(400).json({ success: false, message: 'Course name, code, and department are required' });
    }

    const exists = await CollegeCourse.findOne({ schoolId: collegeId, code: code.toUpperCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Course with this code already exists' });
    }

    const course = new CollegeCourse({
      name,
      code: code.toUpperCase(),
      departmentId,
      duration,
      eligibility,
      feesPerYear,
      specializations: specializations || [],
      schoolId: collegeId
    });

    await course.save();
    return res.status(201).json({ success: true, data: course });
  } catch (error) {
    console.error('Create course error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating course' });
  }
};

// @desc    Update course details
// @route   PUT /api/v1/college/courses/:id
// @access  Private (College Admin)
const updateCourse = async (req, res) => {
  try {
    const collegeId = req.school.id;
    const { id } = req.params;
    const { name, code, departmentId, duration, eligibility, feesPerYear, specializations } = req.body;

    const course = await CollegeCourse.findOne({ _id: id, schoolId: collegeId });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (code && code.toUpperCase() !== course.code) {
      const exists = await CollegeCourse.findOne({ schoolId: collegeId, code: code.toUpperCase() });
      if (exists) {
        return res.status(400).json({ success: false, message: 'Course with this code already exists' });
      }
      course.code = code.toUpperCase();
    }

    if (name) course.name = name;
    if (departmentId) course.departmentId = departmentId;
    if (duration !== undefined) course.duration = duration;
    if (eligibility !== undefined) course.eligibility = eligibility;
    if (feesPerYear !== undefined) course.feesPerYear = feesPerYear;
    if (specializations) course.specializations = specializations;

    await course.save();
    return res.json({ success: true, data: course });
  } catch (error) {
    console.error('Update course error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating course' });
  }
};

// @desc    Delete a course
// @route   DELETE /api/v1/college/courses/:id
// @access  Private (College Admin)
const deleteCourse = async (req, res) => {
  try {
    const collegeId = req.school.id;
    const { id } = req.params;

    const course = await CollegeCourse.findOneAndDelete({ _id: id, schoolId: collegeId });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    return res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting course' });
  }
};

module.exports = {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse
};
