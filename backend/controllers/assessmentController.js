const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');
const AssessmentAssignment = require('../models/AssessmentAssignment');
const Enquiry = require('../models/Enquiry');
const School = require('../models/School');
const createNotification = require('../utils/createNotification');

// Helper to normalize one-word answers (converts to lowercase, strips all spaces)
const normalizeAnswer = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/\s+/g, '').trim();
};

const getEditDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

// ==========================================
// ASSESSMENT TEMPLATES (ADMIN CONTROLLERS)
// ==========================================

// @desc    Get all assessment templates for school
// @route   GET /api/v1/assessments
// @access  Private
const getAssessments = async (req, res) => {
  try {
    const schoolId = req.school.id;
    const { search = '', classFilter = '' } = req.query;

    const query = { schoolId, isDeleted: { $ne: true } };

    if (classFilter) {
      query.class = classFilter;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const assessments = await Assessment.find(query).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: assessments,
    });
  } catch (error) {
    console.error('Fetch assessments error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching assessments' });
  }
};

// @desc    Create new assessment template
// @route   POST /api/v1/assessments
// @access  Private
const createAssessment = async (req, res) => {
  try {
    const schoolId = req.school.id;
    const { name, class: className, duration, instructions, sections } = req.body;

    if (!name || !className || !duration || !sections || sections.length === 0) {
      return res.status(400).json({ success: false, message: 'Required assessment details are missing' });
    }

    // Custom Validation of Questions
    for (let s = 0; s < sections.length; s++) {
      const section = sections[s];
      if (!section.name) {
        return res.status(400).json({ success: false, message: `Section name is required for section index ${s}` });
      }
      if (!section.questions || section.questions.length === 0) {
        return res.status(400).json({ success: false, message: `Questions are required for section "${section.name}"` });
      }

      for (let q = 0; q < section.questions.length; q++) {
        const question = section.questions[q];
        if (!question.type || !question.question || question.marks === undefined) {
          return res.status(400).json({ success: false, message: `Question type, text, and marks are mandatory (Section: ${section.name}, Question index: ${q})` });
        }

        if (question.type === 'MCQ') {
          if (!question.options || question.options.length !== 4 || question.options.some(opt => !opt.trim())) {
            return res.status(400).json({ success: false, message: `MCQ question must have exactly 4 valid options (Section: ${section.name}, Question: "${question.question}")` });
          }
          if (!question.correctAnswer) {
            return res.status(400).json({ success: false, message: `Correct option selection is mandatory for MCQ (Section: ${section.name}, Question: "${question.question}")` });
          }
        }

        if (['One Word', 'True / False', 'Fill Blank'].includes(question.type)) {
          if (!question.correctAnswer) {
            return res.status(400).json({ success: false, message: `Correct answer is required for objective type (Section: ${section.name}, Question: "${question.question}")` });
          }
        }
      }
    }

    const assessment = new Assessment({
      schoolId,
      name,
      class: className,
      duration,
      instructions,
      sections,
    });

    await assessment.save();

    return res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: assessment,
    });
  } catch (error) {
    console.error('Create assessment error:', error);
    return res.status(500).json({ success: false, message: 'Server error building assessment template' });
  }
};

// @desc    Get assessment template by ID
// @route   GET /api/v1/assessments/:id
// @access  Private
const getAssessmentById = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ _id: req.params.id, schoolId: req.school.id, isDeleted: { $ne: true } });
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment template not found' });
    }
    return res.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Fetch assessment error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching assessment' });
  }
};

// @desc    Update assessment template
// @route   PUT /api/v1/assessments/:id
// @access  Private
const updateAssessment = async (req, res) => {
  try {
    const schoolId = req.school.id;
    const { name, class: className, duration, instructions, sections } = req.body;

    const assessment = await Assessment.findOne({ _id: req.params.id, schoolId, isDeleted: { $ne: true } });
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment template not found' });
    }

    if (name) assessment.name = name;
    if (className) assessment.class = className;
    if (duration) assessment.duration = duration;
    if (instructions !== undefined) assessment.instructions = instructions;
    if (sections) assessment.sections = sections;

    await assessment.save();

    return res.json({
      success: true,
      message: 'Assessment updated successfully',
      data: assessment,
    });
  } catch (error) {
    console.error('Update assessment error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating assessment template' });
  }
};

// @desc    Duplicate assessment template
// @route   POST /api/v1/assessments/:id/duplicate
// @access  Private
const duplicateAssessment = async (req, res) => {
  try {
    const schoolId = req.school.id;
    const original = await Assessment.findOne({ _id: req.params.id, schoolId, isDeleted: { $ne: true } });
    
    if (!original) {
      return res.status(404).json({ success: false, message: 'Original assessment template not found' });
    }

    // Deep copy section & question sub-documents (removing existing sub-doc _ids to generate new ones)
    const sectionsCopy = original.sections.map(sec => {
      const questionsCopy = sec.questions.map(q => {
        const qObj = q.toObject();
        delete qObj._id;
        return qObj;
      });
      const secObj = sec.toObject();
      delete secObj._id;
      secObj.questions = questionsCopy;
      return secObj;
    });

    const duplicate = new Assessment({
      schoolId,
      name: `${original.name} (Copy)`,
      class: original.class,
      duration: original.duration,
      instructions: original.instructions,
      sections: sectionsCopy,
    });

    await duplicate.save();

    return res.status(201).json({
      success: true,
      message: 'Assessment template duplicated successfully',
      data: duplicate,
    });
  } catch (error) {
    console.error('Duplicate assessment error:', error);
    return res.status(500).json({ success: false, message: 'Server error duplicating assessment template' });
  }
};

// @desc    Delete assessment template
// @route   DELETE /api/v1/assessments/:id
// @access  Private
const deleteAssessment = async (req, res) => {
  try {
    const schoolId = req.school.id;
    const assessment = await Assessment.findOneAndUpdate(
      { _id: req.params.id, schoolId },
      { isDeleted: true },
      { new: true }
    );
    
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment template not found or unauthorized' });
    }

    // Trigger Notification Log
    await createNotification(
      schoolId,
      'Blueprint Deleted',
      `Assessment blueprint "${assessment.name}" was soft-deleted.`,
      'status_changed'
    );

    return res.json({
      success: true,
      message: 'Assessment template deleted successfully',
    });
  } catch (error) {
    console.error('Delete assessment error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting assessment template' });
  }
};


// ==========================================
// ASSIGNMENT & EXAM ENGINE (STUDENT & ADMIN)
// ==========================================

// @desc    Assign assessment template to Enquiry
// @route   POST /api/v1/assessments/assign
// @access  Private (Admin)
const assignAssessment = async (req, res) => {
  try {
    const schoolId = req.school.id;
    const { enquiryId, assessmentId } = req.body;

    if (!enquiryId || !assessmentId) {
      return res.status(400).json({ success: false, message: 'Enquiry and Assessment template must be selected' });
    }

    // Verify template exists
    const assessment = await Assessment.findOne({ _id: assessmentId, schoolId });
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment template not found' });
    }

    // Verify enquiry exists
    const enquiry = await Enquiry.findOne({ _id: enquiryId, schoolId });
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry record not found' });
    }

    // Create the active exam assignment instance
    const assignment = new AssessmentAssignment({
      schoolId,
      enquiryId,
      assessmentId,
      status: 'Pending',
      answers: [],
    });

    await assignment.save();

    // Trigger Notification Log
    await createNotification(
      schoolId,
      'Assessment Assigned',
      `Test blueprint "${assessment.name}" assigned to candidate ${enquiry.studentName}`,
      'assessment_assigned'
    );

    return res.status(201).json({
      success: true,
      message: 'Assessment successfully assigned to student',
      data: assignment,
    });
  } catch (error) {
    console.error('Assign assessment error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating assessment assignment' });
  }
};

// @desc    Get assignments linked to specific Enquiry
// @route   GET /api/v1/assessments/assignments/enquiry/:enquiryId
// @access  Private (Admin)
const getAssignmentsByEnquiry = async (req, res) => {
  try {
    const assignments = await AssessmentAssignment.find({
      enquiryId: req.params.enquiryId,
      schoolId: req.school.id,
    })
    .populate('assessmentId', 'name class duration totalMarks')
    .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error('Fetch enquiry assignments error:', error);
    return res.status(500).json({ success: false, message: 'Server error loading assignments list' });
  }
};

// Helper function to resolve assignment document by ObjectId or publicToken
const findAssignmentByIdOrToken = async (id, populateFields = true) => {
  if (!id) return null;
  const decodedId = decodeURIComponent(id).trim();
  const mongoose = require('mongoose');

  let assignment = null;
  if (mongoose.Types.ObjectId.isValid(decodedId)) {
    let query = AssessmentAssignment.findById(decodedId);
    if (populateFields) {
      query = query
        .populate('assessmentId')
        .populate('enquiryId', 'studentName parentName email mobile classSeeking')
        .populate('schoolId', 'name logo settings');
    }
    assignment = await query;
  }

  if (!assignment) {
    let query = AssessmentAssignment.findOne({
      $or: [
        { publicToken: decodedId },
        { token: decodedId },
        { accessCode: decodedId },
      ]
    });
    if (populateFields) {
      query = query
        .populate('assessmentId')
        .populate('enquiryId', 'studentName parentName email mobile classSeeking')
        .populate('schoolId', 'name logo settings');
    }
    assignment = await query;
  }

  return assignment;
};

// @desc    Load assignment data (Public - for student exam lounge)
// @route   GET /api/v1/assessments/assignments/:id
// @access  Public
const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await findAssignmentByIdOrToken(id, true);

    if (!assignment) {
      console.warn('Public assessment lookup failed for token/ID:', id);
      return res.status(404).json({ success: false, message: 'This test assignment link is invalid, expired, or has been revoked.' });
    }

    // Security check: If student test is still active/pending, STRIP correct answers
    const school = assignment.schoolId;
    const enquiry = assignment.enquiryId;
    const rawAssessment = assignment.assessmentId ? assignment.assessmentId.toObject() : null;

    if (!rawAssessment) {
      return res.status(404).json({ success: false, message: 'Associated assessment template is no longer available.' });
    }

    if (assignment.status === 'Pending') {
      rawAssessment.sections.forEach(sec => {
        sec.questions.forEach(q => {
          delete q.correctAnswer;
          delete q.referenceAnswer;
        });
      });
    }

    return res.json({
      success: true,
      data: {
        assignment: {
          id: assignment._id,
          status: assignment.status,
          startTime: assignment.startTime,
          submittedAt: assignment.submittedAt,
          timeTaken: assignment.timeTaken,
          answers: assignment.answers,
          totalScore: assignment.totalScore,
          percentage: assignment.percentage,
          isEvaluated: assignment.isEvaluated,
        },
        assessment: rawAssessment,
        school,
        enquiry,
      },
    });
  } catch (error) {
    console.error('Public load assignment error:', error);
    return res.status(500).json({ success: false, message: 'Server error loading exam workspace' });
  }
};

// @desc    Auto-save active test answers dynamically (Public - Auto Save)
// @route   PUT /api/v1/assessments/assignments/:id/save-progress
// @access  Public
const saveProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body; // Array of student answers

    const assignment = await findAssignmentByIdOrToken(id, false);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Active test session not found' });
    }

    if (assignment.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Test already submitted. Action locked.' });
    }

    const updateDoc = { answers };
    if (!assignment.startTime) {
      updateDoc.startTime = new Date();
    }

    await AssessmentAssignment.findByIdAndUpdate(assignment._id, { $set: updateDoc });

    return res.json({
      success: true,
      message: 'Progress auto-saved successfully',
    });
  } catch (error) {
    console.error('Auto save progress error:', error);
    return res.status(500).json({ success: false, message: 'Server error during auto-save' });
  }
};

// @desc    Submit test & auto-evaluate objective questions (Public)
// @route   POST /api/v1/assessments/assignments/:id/submit
// @access  Public
const submitAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, timeTaken } = req.body;

    const assignment = await findAssignmentByIdOrToken(id, true);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Test session not found' });
    }

    if (assignment.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Test already submitted.' });
    }

    const assessment = assignment.assessmentId;
    const finalAnswers = answers || [];

    // Auto-Grading Objective Questions
    let earnedObjectiveScore = 0;
    let containsDescriptive = false;
    const schoolSettings = assignment.schoolId?.settings || {};
    const isMinorValidationEnabled = !!schoolSettings.minorTypingValidation;

    // Build lookup table of template questions
    const questionLookup = {};
    assessment.sections.forEach((sec, sIdx) => {
      sec.questions.forEach((q, qIdx) => {
        questionLookup[`${sIdx}-${qIdx}`] = q;
        if (q.type === 'Descriptive') {
          containsDescriptive = true;
        }
      });
    });

    // Evaluate answers
    const evaluatedAnswers = finalAnswers.map(ans => {
      const q = questionLookup[`${ans.sectionIndex}-${ans.questionIndex}`];
      if (!q) return ans;

      let isCorrect = false;
      let marksAwarded = 0;

      if (q.type === 'MCQ') {
        isCorrect = ans.answerText === q.correctAnswer;
        marksAwarded = isCorrect ? q.marks : 0;
      } else if (q.type === 'True / False') {
        isCorrect = ans.answerText === q.correctAnswer;
        marksAwarded = isCorrect ? q.marks : 0;
      } else if (q.type === 'One Word' || q.type === 'Fill Blank') {
        const normAnswer = normalizeAnswer(ans.answerText);
        const normCorrect = normalizeAnswer(q.correctAnswer);
        if (isMinorValidationEnabled) {
          isCorrect = getEditDistance(normAnswer, normCorrect) <= 1;
        } else {
          isCorrect = normAnswer === normCorrect;
        }
        marksAwarded = isCorrect ? q.marks : 0;
      } else if (q.type === 'Descriptive') {
        // Descriptive questions are left for manual evaluation (0 marks default initially)
        isCorrect = false;
        marksAwarded = 0;
      }

      return {
        ...ans,
        isCorrect,
        marksAwarded,
      };
    });

    // Calculate initial objective score
    evaluatedAnswers.forEach(ans => {
      earnedObjectiveScore += ans.marksAwarded || 0;
    });

    // Save final exam results details atomically to prevent Mongoose VersionError
    const updatedAssignment = await AssessmentAssignment.findByIdAndUpdate(
      assignment._id,
      {
        $set: {
          answers: evaluatedAnswers,
          status: 'Completed',
          submittedAt: new Date(),
          timeTaken: timeTaken || 0,
          totalScore: earnedObjectiveScore,
          percentage: parseFloat(((earnedObjectiveScore / maxMarks) * 100).toFixed(2)),
          isEvaluated: !containsDescriptive,
        }
      },
      { new: true }
    );

    // Trigger Notification Log
    await createNotification(
      assignment.schoolId?._id || assignment.schoolId,
      'Assessment Completed',
      `Candidate ${assignment.enquiryId?.studentName || 'Student'} completed test "${assessment.name}". ${!containsDescriptive ? 'Evaluation complete.' : 'Grading worksheet pending descriptive evaluation.'}`,
      'assessment_completed'
    );

    return res.json({
      success: true,
      message: 'Test submitted and auto-evaluated successfully!',
      data: updatedAssignment,
    });
  } catch (error) {
    console.error('Submit test error:', error);
    return res.status(500).json({ success: false, message: 'Server error processing test submission' });
  }
};

// @desc    Manually evaluate descriptive questions (Admin)
// @route   PUT /api/v1/assessments/assignments/:id/grade
// @access  Private (Admin)
const gradeDescriptiveAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { grades } = req.body; // Array of { sectionIndex, questionIndex, marksAwarded, adminComments }

    const assignment = await AssessmentAssignment.findOne({
      _id: id,
      schoolId: req.school.id,
    }).populate('assessmentId');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Completed test assignment not found' });
    }

    if (assignment.status !== 'Completed') {
      return res.status(400).json({ success: false, message: 'Test is not submitted yet. Unable to grade.' });
    }

    const assessment = assignment.assessmentId;

    // Load question mappings to double check max marks validation
    const questionLookup = {};
    assessment.sections.forEach((sec, sIdx) => {
      sec.questions.forEach((q, qIdx) => {
        questionLookup[`${sIdx}-${qIdx}`] = q;
      });
    });

    // Map existing answers to a lookup
    const answersMap = {};
    assignment.answers.forEach((ans, index) => {
      answersMap[`${ans.sectionIndex}-${ans.questionIndex}`] = index;
    });

    // Apply manual descriptive grades
    grades.forEach(grade => {
      const key = `${grade.sectionIndex}-${grade.questionIndex}`;
      const q = questionLookup[key];
      if (!q) return;

      // Validate marks limits
      const marks = parseFloat(grade.marksAwarded);
      if (isNaN(marks) || marks < 0 || marks > q.marks) {
        throw new Error(`Invalid marks awarded (${marks}) for question. Max allowed: ${q.marks}`);
      }

      const answerIndex = answersMap[key];
      if (answerIndex !== undefined) {
        // Answer exists
        assignment.answers[answerIndex].marksAwarded = marks;
        assignment.answers[answerIndex].adminComments = grade.adminComments || '';
        assignment.answers[answerIndex].isCorrect = marks >= q.marks / 2; // Arbitrary criteria
      } else {
        // Student didn't submit an answer, but we grade it (typically 0 marks)
        assignment.answers.push({
          sectionIndex: grade.sectionIndex,
          questionIndex: grade.questionIndex,
          questionId: q._id.toString(),
          answerText: '[No response submitted]',
          isCorrect: false,
          marksAwarded: marks,
          adminComments: grade.adminComments || '',
        });
      }
    });

    // Recalculate final combined scores
    let finalScore = 0;
    assignment.answers.forEach(ans => {
      finalScore += ans.marksAwarded || 0;
    });

    assignment.totalScore = finalScore;
    const maxMarks = assessment.totalMarks || 1;
    assignment.percentage = parseFloat(((finalScore / maxMarks) * 100).toFixed(2));
    assignment.isEvaluated = true; // Mark as fully graded

    await assignment.save();

    return res.json({
      success: true,
      message: 'Descriptive grades saved and totals updated successfully!',
      data: assignment,
    });
  } catch (error) {
    console.error('Grade descriptive error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Server error grading descriptive questions' });
  }
};

// @desc    Get assessment metrics and dashboard counters
// @route   GET /api/v1/assessments/assignments/stats
// @access  Private (Admin)
const getAssessmentStats = async (req, res) => {
  try {
    const schoolId = req.school.id;

    // 1. Total templates count
    const totalAssessments = await Assessment.countDocuments({ schoolId });

    // 2. Aggregate count of assignments by status
    const assignmentsCount = await AssessmentAssignment.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    let totalAssigned = 0;
    let completedCount = 0;
    let pendingCount = 0;

    assignmentsCount.forEach(item => {
      totalAssigned += item.count;
      if (item._id === 'Completed') completedCount = item.count;
      else if (item._id === 'Pending') pendingCount = item.count;
    });

    // 3. Average Score of Completed assignments
    const completedGraded = await AssessmentAssignment.find({
      schoolId,
      status: 'Completed',
    });

    let scoreSum = 0;
    completedGraded.forEach(item => {
      scoreSum += item.percentage || 0;
    });

    const averageScore = completedGraded.length > 0 
      ? parseFloat((scoreSum / completedGraded.length).toFixed(2)) 
      : 0;

    return res.json({
      success: true,
      stats: {
        totalAssessments,
        totalAssigned,
        completedCount,
        pendingCount,
        averageScore,
      },
    });
  } catch (error) {
    console.error('Assessment dashboard stats fetch error:', error);
    return res.status(500).json({ success: false, message: 'Server error loading analytics stats' });
  }
};

module.exports = {
  getAssessments,
  createAssessment,
  getAssessmentById,
  updateAssessment,
  duplicateAssessment,
  deleteAssessment,
  assignAssessment,
  getAssignmentsByEnquiry,
  getAssignmentById,
  saveProgress,
  submitAssessment,
  gradeDescriptiveAssessment,
  getAssessmentStats,
};
