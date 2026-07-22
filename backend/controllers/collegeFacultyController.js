const CollegeFaculty = require('../models/CollegeFaculty');

// @desc    Get all faculty for a college
// @route   GET /api/v1/college/faculty
// @access  Private (College Admin)
const getFaculty = async (req, res) => {
  try {
    const collegeId = req.school.id;
    const faculty = await CollegeFaculty.find({ schoolId: collegeId })
      .populate('departmentId', 'name')
      .sort({ name: 1 });
    return res.json({ success: true, data: faculty });
  } catch (error) {
    console.error('Get faculty error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching faculty' });
  }
};

// @desc    Create a new faculty member
// @route   POST /api/v1/college/faculty
// @access  Private (College Admin)
const createFaculty = async (req, res) => {
  try {
    const collegeId = req.school.id;
    const { name, email, phone, designation, departmentId, status } = req.body;

    if (!name || !email || !designation || !departmentId) {
      return res.status(400).json({ success: false, message: 'Name, email, designation, and department are required' });
    }

    const faculty = new CollegeFaculty({
      name,
      email,
      phone,
      designation,
      departmentId,
      status: status || 'Active',
      schoolId: collegeId
    });

    await faculty.save();
    return res.status(201).json({ success: true, data: faculty });
  } catch (error) {
    console.error('Create faculty error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating faculty' });
  }
};

// @desc    Update faculty details
// @route   PUT /api/v1/college/faculty/:id
// @access  Private (College Admin)
const updateFaculty = async (req, res) => {
  try {
    const collegeId = req.school.id;
    const { id } = req.params;
    const { name, email, phone, designation, departmentId, status } = req.body;

    const faculty = await CollegeFaculty.findOne({ _id: id, schoolId: collegeId });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    if (name) faculty.name = name;
    if (email) faculty.email = email;
    if (phone !== undefined) faculty.phone = phone;
    if (designation) faculty.designation = designation;
    if (departmentId) faculty.departmentId = departmentId;
    if (status) faculty.status = status;

    await faculty.save();
    return res.json({ success: true, data: faculty });
  } catch (error) {
    console.error('Update faculty error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating faculty' });
  }
};

// @desc    Delete a faculty member
// @route   DELETE /api/v1/college/faculty/:id
// @access  Private (College Admin)
const deleteFaculty = async (req, res) => {
  try {
    const collegeId = req.school.id;
    const { id } = req.params;

    const faculty = await CollegeFaculty.findOneAndDelete({ _id: id, schoolId: collegeId });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    return res.json({ success: true, message: 'Faculty deleted successfully' });
  } catch (error) {
    console.error('Delete faculty error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting faculty' });
  }
};

module.exports = {
  getFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty
};
