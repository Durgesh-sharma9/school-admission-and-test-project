const mongoose = require('mongoose');
const Locality = require('../models/Locality');
const Enquiry = require('../models/Enquiry');

// @desc    Get localities list for logged-in school (Approved or Pending)
// @route   GET /api/v1/localities
// @access  Private (School Admin)
const getLocalities = async (req, res) => {
  try {
    const schoolId = req.school.id;
    const { 
      type = 'approved', // 'approved' or 'pending'
      search = '', 
      status = '',
      page = 1, 
      limit = 10 
    } = req.query;

    const query = {
      schoolId: new mongoose.Types.ObjectId(schoolId),
      isApproved: type === 'approved',
    };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Locality.countDocuments(query);
    const localities = await Locality.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    // Get usage statistics for approved localities
    const localitiesWithStats = await Promise.all(
      localities.map(async (loc) => {
        const locObj = loc.toObject();
        
        // Count total enquiries matching this locality (by ID or area name)
        const enquiriesCount = await Enquiry.countDocuments({
          schoolId: new mongoose.Types.ObjectId(schoolId),
          isDeleted: { $ne: true },
          $or: [
            { localityId: loc._id },
            { area: { $regex: `^${loc.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } }
          ]
        });

        // Count admissions matching this locality
        const admissionsCount = await Enquiry.countDocuments({
          schoolId: new mongoose.Types.ObjectId(schoolId),
          isDeleted: { $ne: true },
          status: 'Admission Confirmed',
          $or: [
            { localityId: loc._id },
            { area: { $regex: `^${loc.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } }
          ]
        });

        locObj.usedInEnquiries = enquiriesCount;
        locObj.usedInAdmissions = admissionsCount;
        return locObj;
      })
    );

    return res.json({
      success: true,
      data: localitiesWithStats,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Fetch localities error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching localities' });
  }
};

// @desc    Get active approved localities for dropdown suggestions
// @route   GET /api/v1/localities/active
// @access  Public / Private
const getActiveLocalities = async (req, res) => {
  try {
    const schoolId = req.query.schoolId || (req.school && req.school.id);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'School ID is required' });
    }

    const localities = await Locality.find({
      schoolId: new mongoose.Types.ObjectId(schoolId),
      isApproved: true,
      status: 'active',
    }).sort({ name: 1 }).select('_id name');

    return res.json({
      success: true,
      data: localities,
    });
  } catch (error) {
    console.error('Fetch active localities error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching active localities' });
  }
};

// @desc    Add new approved locality (Admin)
// @route   POST /api/v1/localities
// @access  Private (School Admin)
const createLocality = async (req, res) => {
  try {
    const schoolId = req.school.id;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Locality name is required' });
    }

    const trimmedName = name.trim();
    const nameLower = trimmedName.toLowerCase();

    // Check case-insensitive duplicate per school
    const existing = await Locality.findOne({
      schoolId: new mongoose.Types.ObjectId(schoolId),
      nameLower,
    });

    if (existing) {
      if (!existing.isApproved) {
        // Automatically approve if it was pending
        existing.isApproved = true;
        existing.status = 'active';
        existing.name = trimmedName;
        await existing.save();
        return res.status(200).json({
          success: true,
          message: 'Existing pending locality approved successfully',
          data: existing,
        });
      }
      return res.status(400).json({ success: false, message: 'Locality with this name already exists' });
    }

    const locality = new Locality({
      schoolId,
      name: trimmedName,
      nameLower,
      status: 'active',
      isApproved: true,
      createdBy: 'admin',
    });

    await locality.save();

    return res.status(201).json({
      success: true,
      message: 'Locality added successfully',
      data: locality,
    });
  } catch (error) {
    console.error('Create locality error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating locality' });
  }
};

// @desc    Update locality name
// @route   PUT /api/v1/localities/:id
// @access  Private (School Admin)
const updateLocality = async (req, res) => {
  try {
    const schoolId = req.school.id;
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Locality name is required' });
    }

    const trimmedName = name.trim();
    const nameLower = trimmedName.toLowerCase();

    // Check duplicate excluding current
    const duplicate = await Locality.findOne({
      _id: { $ne: id },
      schoolId: new mongoose.Types.ObjectId(schoolId),
      nameLower,
    });

    if (duplicate) {
      return res.status(400).json({ success: false, message: 'Another locality with this name already exists' });
    }

    const locality = await Locality.findOneAndUpdate(
      { _id: id, schoolId: new mongoose.Types.ObjectId(schoolId) },
      { name: trimmedName, nameLower },
      { new: true, runValidators: true }
    );

    if (!locality) {
      return res.status(404).json({ success: false, message: 'Locality not found' });
    }

    return res.json({
      success: true,
      message: 'Locality updated successfully',
      data: locality,
    });
  } catch (error) {
    console.error('Update locality error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating locality' });
  }
};

// @desc    Toggle Locality status (Active / Inactive)
// @route   PATCH /api/v1/localities/:id/status
// @access  Private (School Admin)
const updateLocalityStatus = async (req, res) => {
  try {
    const schoolId = req.school.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be active or inactive' });
    }

    const locality = await Locality.findOneAndUpdate(
      { _id: id, schoolId: new mongoose.Types.ObjectId(schoolId) },
      { status },
      { new: true }
    );

    if (!locality) {
      return res.status(404).json({ success: false, message: 'Locality not found' });
    }

    return res.json({
      success: true,
      message: `Locality ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: locality,
    });
  } catch (error) {
    console.error('Status update error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating status' });
  }
};

// @desc    Approve pending locality suggestion
// @route   PATCH /api/v1/localities/:id/approve
// @access  Private (School Admin)
const approveLocality = async (req, res) => {
  try {
    const schoolId = req.school.id;
    const { id } = req.params;

    const locality = await Locality.findOneAndUpdate(
      { _id: id, schoolId: new mongoose.Types.ObjectId(schoolId) },
      { isApproved: true, status: 'active' },
      { new: true }
    );

    if (!locality) {
      return res.status(404).json({ success: false, message: 'Pending locality not found' });
    }

    return res.json({
      success: true,
      message: 'Locality approved successfully!',
      data: locality,
    });
  } catch (error) {
    console.error('Approve locality error:', error);
    return res.status(500).json({ success: false, message: 'Server error approving locality' });
  }
};

// @desc    Delete locality (or Reject pending)
// @route   DELETE /api/v1/localities/:id
// @access  Private (School Admin)
const deleteLocality = async (req, res) => {
  try {
    const schoolId = req.school.id;
    const { id } = req.params;

    const locality = await Locality.findOne({
      _id: id,
      schoolId: new mongoose.Types.ObjectId(schoolId),
    });

    if (!locality) {
      return res.status(404).json({ success: false, message: 'Locality not found' });
    }

    // If pending, allow simple removal from pending list
    if (!locality.isApproved) {
      await Locality.deleteOne({ _id: id });
      return res.json({
        success: true,
        message: 'Pending locality suggestion rejected and removed',
      });
    }

    // Check if used in enquiries or admissions
    const usageCount = await Enquiry.countDocuments({
      schoolId: new mongoose.Types.ObjectId(schoolId),
      isDeleted: { $ne: true },
      $or: [
        { localityId: locality._id },
        { area: { $regex: `^${locality.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } }
      ]
    });

    if (usageCount > 0) {
      // Rule: Do NOT allow permanent deletion if used. Deactivate it instead.
      locality.status = 'inactive';
      await locality.save();

      return res.json({
        success: true,
        deactivated: true,
        message: `Locality has been used in ${usageCount} enquiry/admission records. It was deactivated instead of deleted.`,
        data: locality,
      });
    }

    // Unused approved locality can be deleted
    await Locality.deleteOne({ _id: id });

    return res.json({
      success: true,
      message: 'Locality deleted successfully',
    });
  } catch (error) {
    console.error('Delete locality error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting locality' });
  }
};

// @desc    Locality analytics breakdown
// @route   GET /api/v1/localities/analytics
// @access  Private (School Admin)
const getLocalityAnalytics = async (req, res) => {
  try {
    const schoolId = req.school.id;

    const pipeline = [
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(schoolId),
          isDeleted: { $ne: true },
        }
      },
      {
        $group: {
          _id: { $toLower: '$area' },
          localityName: { $first: '$area' },
          totalEnquiries: { $sum: 1 },
          admissionsConfirmed: {
            $sum: { $cond: [{ $eq: ['$status', 'Admission Confirmed'] }, 1, 0] }
          },
          onHold: {
            $sum: { $cond: [{ $eq: ['$status', 'Hold'] }, 1, 0] }
          },
          notInterested: {
            $sum: { $cond: [{ $eq: ['$status', 'Not Interested'] }, 1, 0] }
          },
          newEnquiries: {
            $sum: { $cond: [{ $eq: ['$status', 'New Enquiry'] }, 1, 0] }
          }
        }
      },
      { $sort: { totalEnquiries: -1 } }
    ];

    const results = await Enquiry.aggregate(pipeline);

    const formattedData = results.map(item => {
      const conversionRate = item.totalEnquiries > 0
        ? parseFloat(((item.admissionsConfirmed / item.totalEnquiries) * 100).toFixed(1))
        : 0;

      return {
        localityName: item.localityName || 'Unknown',
        totalEnquiries: item.totalEnquiries,
        admissionsConfirmed: item.admissionsConfirmed,
        onHold: item.onHold,
        notInterested: item.notInterested,
        newEnquiries: item.newEnquiries,
        conversionRate,
      };
    });

    return res.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Locality analytics error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching locality analytics' });
  }
};

// Helper: Process locality creation/upsert on enquiry submission
const processLocalityOnEnquirySave = async (schoolId, areaName, isPublic = false) => {
  try {
    if (!areaName || !areaName.trim()) return null;

    const trimmedName = areaName.trim();
    const nameLower = trimmedName.toLowerCase();

    let locality = await Locality.findOne({
      schoolId: new mongoose.Types.ObjectId(schoolId),
      nameLower,
    });

    if (locality) {
      // Increment usage count
      locality.timesUsed = (locality.timesUsed || 0) + 1;
      await locality.save();
      return { localityId: locality._id, localityName: locality.name };
    }

    // Create pending locality automatically
    const pending = new Locality({
      schoolId,
      name: trimmedName,
      nameLower,
      status: 'active',
      isApproved: false, // Needs admin approval
      createdBy: isPublic ? 'parent' : 'admin',
      timesUsed: 1,
    });

    await pending.save();
    return { localityId: pending._id, localityName: pending.name };
  } catch (err) {
    console.error('Error in processLocalityOnEnquirySave:', err);
    return null;
  }
};

module.exports = {
  getLocalities,
  getActiveLocalities,
  createLocality,
  updateLocality,
  updateLocalityStatus,
  approveLocality,
  deleteLocality,
  getLocalityAnalytics,
  processLocalityOnEnquirySave,
};
