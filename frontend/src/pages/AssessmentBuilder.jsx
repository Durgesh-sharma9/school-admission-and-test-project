import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Sparkles,
  Save,
  Grid,
  Edit,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AssessmentBuilder = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // populated if editing
  const isEditMode = !!id;

  // Primary Assessment info states
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [duration, setDuration] = useState(30);
  const [instructions, setInstructions] = useState('');
  
  // Dynamic Sections state
  const [sections, setSections] = useState([
    { name: 'Section A', questions: [] }
  ]);

  // Loading states
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // active inline question editor states
  // We keep track of which section & question index is currently being edited/added
  const [activeEditor, setActiveEditor] = useState(null); // { sectionIndex, questionIndex }
  const [editType, setEditType] = useState('MCQ');
  const [editQuestion, setEditQuestion] = useState('');
  const [editOptions, setEditOptions] = useState(['', '', '', '']); // for MCQ
  const [editCorrectAnswer, setEditCorrectAnswer] = useState('');
  const [editMarks, setEditMarks] = useState(1);
  const [editReferenceAnswer, setEditReferenceAnswer] = useState('');

  // Fetch assessment details if in edit mode
  useEffect(() => {
    const fetchAssessmentDetails = async () => {
      try {
        setFetching(true);
        const response = await api.get(`/assessments/${id}`);
        if (response.success && response.data) {
          const asm = response.data;
          setName(asm.name || '');
          setClassName(asm.class || '');
          setDuration(asm.duration || 30);
          setInstructions(asm.instructions || '');
          setSections(asm.sections || []);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        toast.error(error.message || 'Failed to load assessment details');
        setNotFound(true);
      } finally {
        setFetching(false);
      }
    };

    if (isEditMode) {
      fetchAssessmentDetails();
    }
  }, [id, isEditMode, navigate]);

  // Calculate dynamic live totals
  const totalQuestions = (sections || []).filter(Boolean).reduce((acc, sec) => acc + ((sec && sec.questions) ? sec.questions.filter(Boolean).length : 0), 0);
  const totalMarks = (sections || []).filter(Boolean).reduce(
    (acc, sec) =>
      acc +
      ((sec && sec.questions) ? sec.questions.filter(Boolean).reduce((qAcc, q) => qAcc + (parseFloat(q ? q.marks : 0) || 0), 0) : 0),
    0
  );

  const getSectionTotalMarks = (section) => {
    if (!section || !section.questions) return 0;
    return section.questions.filter(Boolean).reduce((qAcc, q) => qAcc + (parseFloat(q ? q.marks : 0) || 0), 0);
  };

  // Section CRUD
  const addSection = () => {
    const sectionName = window.prompt('Enter new section name (e.g. Mathematics, Physics):');
    if (!sectionName || !sectionName.trim()) return;
    setSections([...sections, { name: sectionName.trim(), questions: [] }]);
    toast.success(`Section "${sectionName}" added!`);
  };

  const renameSection = (sectionIndex) => {
    const currentName = sections[sectionIndex].name;
    const newName = window.prompt('Rename section to:', currentName);
    if (!newName || !newName.trim() || newName === currentName) return;
    
    const updated = [...sections];
    updated[sectionIndex].name = newName.trim();
    setSections(updated);
    toast.success('Section renamed');
  };

  const deleteSection = (sectionIndex) => {
    if (sections.length === 1) {
      toast.error('At least one section is required');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete section "${sections[sectionIndex].name}" and all of its questions?`)) return;
    setSections(sections.filter((_, idx) => idx !== sectionIndex));
    // Reset editor if it belonged to this deleted section
    if (activeEditor?.sectionIndex === sectionIndex) {
      setActiveEditor(null);
    }
  };

  // Open inline editor for adding a question
  const openAddQuestionEditor = (sectionIndex) => {
    setActiveEditor({ sectionIndex, questionIndex: -1 }); // -1 indicates a new question is being created
    setEditType('MCQ');
    setEditQuestion('');
    setEditOptions(['', '', '', '']);
    setEditCorrectAnswer('');
    setEditMarks(1);
    setEditReferenceAnswer('');
  };

  // Open inline editor for editing a question
  const openEditQuestionEditor = (sectionIndex, questionIndex) => {
    const q = sections[sectionIndex].questions[questionIndex];
    setActiveEditor({ sectionIndex, questionIndex });
    setEditType(q.type);
    setEditQuestion(q.question);
    setEditOptions(q.options || ['', '', '', '']);
    setEditCorrectAnswer(q.correctAnswer || '');
    setEditMarks(q.marks);
    setEditReferenceAnswer(q.referenceAnswer || '');
  };

  // Handle saving the question from the inline editor
  const handleSaveQuestion = (e) => {
    e.preventDefault();

    // Validations
    if (!editQuestion.trim()) {
      toast.error('Question text is mandatory');
      return;
    }
    const marksNum = parseFloat(editMarks);
    if (isNaN(marksNum) || marksNum <= 0) {
      toast.error('Question marks must be a positive number');
      return;
    }

    if (editType === 'MCQ') {
      if (editOptions.some(opt => !opt.trim())) {
        toast.error('All 4 MCQ options are mandatory');
        return;
      }
      if (!editCorrectAnswer) {
        toast.error('Correct option choice is mandatory for MCQ');
        return;
      }
    }

    if (['One Word', 'True / False', 'Fill Blank'].includes(editType)) {
      if (!editCorrectAnswer.trim()) {
        toast.error('Correct answer is required');
        return;
      }
    }

    const questionData = {
      type: editType,
      question: editQuestion.trim(),
      options: editType === 'MCQ' ? editOptions.map(o => o.trim()) : undefined,
      correctAnswer: editType !== 'Descriptive' ? editCorrectAnswer.trim() : undefined,
      marks: marksNum,
      referenceAnswer: editType === 'Descriptive' ? editReferenceAnswer.trim() : '',
    };

    const updated = [...sections];
    const { sectionIndex, questionIndex } = activeEditor;

    if (questionIndex === -1) {
      // Adding new question
      updated[sectionIndex].questions.push(questionData);
      toast.success('Question added successfully!');
    } else {
      // Updating existing question
      updated[sectionIndex].questions[questionIndex] = questionData;
      toast.success('Question updated successfully!');
    }

    setSections(updated);
    setActiveEditor(null); // Close editor
  };

  // Duplicate Question item within a section
  const handleDuplicateQuestion = (sectionIndex, questionIndex) => {
    const q = sections[sectionIndex].questions[questionIndex];
    // Copy options & deep copy
    const duplicatedQuestion = {
      ...q,
      question: `${q.question} (Copy)`,
    };
    
    const updated = [...sections];
    updated[sectionIndex].questions.splice(questionIndex + 1, 0, duplicatedQuestion);
    setSections(updated);
    toast.success('Question duplicated');
  };

  // Delete Question item
  const handleDeleteQuestion = (sectionIndex, questionIndex) => {
    if (!window.confirm('Delete this question?')) return;
    const updated = [...sections];
    updated[sectionIndex].questions.splice(questionIndex, 1);
    setSections(updated);
    toast.success('Question deleted');
    if (activeEditor?.sectionIndex === sectionIndex && activeEditor?.questionIndex === questionIndex) {
      setActiveEditor(null);
    }
  };

  // Submit/Save the whole Assessment Template
  const handleSaveAssessment = async () => {
    if (!name.trim() || !className.trim() || !duration) {
      toast.error('Assessment Name, Class, and Duration are required');
      return;
    }

    // Verify sections have at least one question
    const emptySection = (sections || []).find(sec => !sec || !sec.questions || sec.questions.length === 0);
    if (emptySection) {
      toast.error(`Section "${emptySection ? emptySection.name : 'Unknown'}" has no questions. Please add questions first.`);
      return;
    }

    setSaving(true);
    const payload = {
      name: name.trim(),
      class: className.trim(),
      duration: parseInt(duration, 10),
      instructions: instructions.trim(),
      sections,
    };

    try {
      let response;
      if (isEditMode) {
        response = await api.put(`/assessments/${id}`, payload);
      } else {
        response = await api.post('/assessments', payload);
      }

      if (response.success) {
        toast.success(isEditMode ? 'Assessment template saved!' : 'Assessment template created!');
        navigate('/assessments');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save assessment template');
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return <Loader message="Fetching assessment questionnaire blueprint..." />;
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl space-y-5">
          <div className="h-14 w-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Assessment not found</h2>
          <p className="text-xs text-slate-505 leading-normal">
            The requested assessment blueprint does not exist or has been deleted.
          </p>
          <div className="pt-2">
            <Link
              to="/assessments"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg text-sm font-semibold bg-indigo-650 hover:bg-indigo-700 text-white transition-colors shadow-md shadow-indigo-600/10"
            >
              Go to Assessments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-24 text-left">
      {/* Back button header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/assessments"
          className="p-2 bg-white border border-slate-100 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition-colors shadow-xs"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isEditMode ? 'Edit Assessment Template' : 'Configure Assessment Template'}
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Set dynamic sections, MCQ, True/False, One-Word, or Descriptive questions.
          </p>
        </div>
      </div>

      {/* Main settings row */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2">
          <Input
            label="Assessment Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mid-Term Evaluation Grade 5"
            required
          />
        </div>
        <div>
          <Input
            label="Class targeted"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="e.g. Grade 5"
            required
          />
        </div>
        <div>
          <Input
            label="Duration (Minutes)"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
            min={1}
          />
        </div>
        <div className="md:col-span-4">
          <Input
            label="Instructions (Optional)"
            type="textarea"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Instructions displayed to students before starting the exam..."
          />
        </div>
      </div>

      {/* Builder Core Sections Area */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Assessment Questionnaire ({sections.length} Sections)
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={addSection}
            className="text-indigo-600 hover:bg-indigo-50 border-indigo-200"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Section
          </Button>
        </div>

        {sections && sections.filter(Boolean).map((sec, sIdx) => (
          <div key={sIdx} className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            {/* Section Header bar */}
            <div className="bg-slate-50/70 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                  {sIdx + 1}
                </span>
                <span
                  onClick={() => renameSection(sIdx)}
                  className="font-bold text-slate-800 text-sm cursor-pointer hover:underline decoration-dashed"
                >
                  {sec ? sec.name : ''}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  ({(sec && sec.questions) ? sec.questions.filter(Boolean).length : 0} questions • {getSectionTotalMarks(sec)} marks)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openAddQuestionEditor(sIdx)}
                  className="text-indigo-600 hover:bg-indigo-50 py-1 border-none"
                >
                  <PlusCircle className="h-4 w-4 mr-1.5" />
                  Add Question
                </Button>
                <button
                  onClick={() => deleteSection(sIdx)}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-650 transition-colors"
                  title="Delete Section"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Questions list within Section */}
            <div className="p-6 divide-y divide-slate-50">
              {(!sec || !sec.questions || sec.questions.filter(Boolean).length === 0) && activeEditor?.sectionIndex !== sIdx && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  This section has no questions yet. Click "Add Question" above to start building.
                </div>
              )}

              {/* Loop Questions */}
              {sec && (sec.questions || []).filter(Boolean).map((q, qIdx) => (
                <div key={qIdx} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Q{qIdx + 1} • {q?.type}
                      </span>
                      <span className="inline-flex items-center text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                        {q?.marks} Marks
                      </span>
                    </div>

                    <p className="font-semibold text-slate-800 text-sm">{q?.question}</p>

                    {/* Show correct answers for builder view */}
                    {q?.type === 'MCQ' && q?.options && (
                      <div className="grid grid-cols-2 gap-2 max-w-lg mt-2 text-xs text-slate-500">
                        {(q?.options || []).map((opt, oIdx) => {
                          const optionLetter = ['A', 'B', 'C', 'D'][oIdx];
                          const isCorrect = optionLetter === q?.correctAnswer;
                          return (
                            <div key={oIdx} className={`p-1.5 rounded-lg border ${isCorrect ? 'bg-emerald-50 border-emerald-100 text-emerald-800 font-bold' : 'border-slate-50 bg-slate-50/50'}`}>
                              {optionLetter}. {opt}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {['One Word', 'True / False', 'Fill Blank'].includes(q?.type) && (
                      <p className="text-xs text-slate-500 mt-1">
                        Correct Answer: <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{q?.correctAnswer}</span>
                      </p>
                    )}

                    {q?.type === 'Descriptive' && q?.referenceAnswer && (
                      <p className="text-xs text-slate-450 italic mt-1 line-clamp-2">
                        Reference Answer: {q?.referenceAnswer}
                      </p>
                    )}
                  </div>

                  {/* Question Actions */}
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleDuplicateQuestion(sIdx, qIdx)}
                      className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-650 transition-colors"
                      title="Duplicate Question"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditQuestionEditor(sIdx, qIdx)}
                      className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-650 transition-colors"
                      title="Edit Question"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(sIdx, qIdx)}
                      className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-650 transition-colors"
                      title="Delete Question"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Inline Editor Insertion */}
              {activeEditor?.sectionIndex === sIdx && (
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-5 mt-4 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      {activeEditor.questionIndex === -1 ? 'Add New Question' : 'Edit Question Details'}
                    </h4>
                    <button
                      onClick={() => setActiveEditor(null)}
                      className="text-slate-400 hover:text-slate-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-750 uppercase mb-1.5 text-left">
                        Question Type
                      </label>
                      <select
                        value={editType}
                        onChange={(e) => {
                          setEditType(e.target.value);
                          setEditCorrectAnswer('');
                        }}
                        className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      >
                        <option value="MCQ">Multiple Choice (MCQ)</option>
                        <option value="One Word">One Word Response</option>
                        <option value="True / False">True / False</option>
                        <option value="Fill Blank">Fill in the Blank</option>
                        <option value="Descriptive">Descriptive Answer (Manual Evaluation)</option>
                      </select>
                    </div>

                    <div>
                      <Input
                        label="Marks"
                        type="number"
                        value={editMarks}
                        onChange={(e) => setEditMarks(e.target.value)}
                        required
                        min={1}
                      />
                    </div>
                  </div>

                  <Input
                    label="Question Text"
                    value={editQuestion}
                    onChange={(e) => setEditQuestion(e.target.value)}
                    placeholder="Type question content here..."
                    required
                  />

                  {/* Conditional Editor Fields based on Type */}
                  {editType === 'MCQ' && (
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-750 uppercase text-left">
                        MCQ Options & Select Correct (Radio Button)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(editOptions || []).map((opt, oIdx) => {
                          const optionLetter = ['A', 'B', 'C', 'D'][oIdx];
                          return (
                            <div key={oIdx} className="flex items-center space-x-3">
                              <input
                                type="radio"
                                name="mcqCorrectAnswer"
                                value={optionLetter}
                                checked={editCorrectAnswer === optionLetter}
                                onChange={() => setEditCorrectAnswer(optionLetter)}
                                className="h-4.5 w-4.5 text-indigo-650 focus:ring-indigo-500/20"
                              />
                              <span className="font-bold text-xs text-slate-500">{optionLetter}</span>
                              <input
                                type="text"
                                placeholder={`Enter option ${optionLetter} text...`}
                                value={opt}
                                onChange={(e) => {
                                  const updatedOpts = [...editOptions];
                                  updatedOpts[oIdx] = e.target.value;
                                  setEditOptions(updatedOpts);
                                }}
                                className="flex-1 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {editType === 'True / False' && (
                    <div className="space-y-2 text-left">
                      <label className="block text-xs font-semibold text-slate-750 uppercase">
                        Select Correct Response
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="tfCorrect"
                            value="True"
                            checked={editCorrectAnswer === 'True'}
                            onChange={() => setEditCorrectAnswer('True')}
                            className="text-indigo-600 focus:ring-indigo-500/20"
                          />
                          <span>True</span>
                        </label>
                        <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="tfCorrect"
                            value="False"
                            checked={editCorrectAnswer === 'False'}
                            onChange={() => setEditCorrectAnswer('False')}
                            className="text-indigo-600 focus:ring-indigo-500/20"
                          />
                          <span>False</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {(editType === 'One Word' || editType === 'Fill Blank') && (
                    <Input
                      label="Correct Answer Text"
                      value={editCorrectAnswer}
                      onChange={(e) => setEditCorrectAnswer(e.target.value)}
                      placeholder="e.g. New Delhi"
                      required
                    />
                  )}

                  {editType === 'Descriptive' && (
                    <Input
                      label="Reference Answer for Grader (Optional)"
                      type="textarea"
                      value={editReferenceAnswer}
                      onChange={(e) => setEditReferenceAnswer(e.target.value)}
                      placeholder="Admin reference key only..."
                    />
                  )}

                  <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setActiveEditor(null)}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSaveQuestion}>
                      Save Question
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM Sticky Summary Panel */}
      <div className="fixed bottom-0 inset-x-0 bg-slate-900 border-t border-slate-800 text-white py-4 px-6 z-40 flex items-center justify-between flex-wrap gap-4 shadow-2xl">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Total Marks
            </span>
            <span className="text-xl font-black text-indigo-400">{totalMarks} Marks</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Question Count
            </span>
            <span className="text-xl font-black text-slate-100">{totalQuestions} Questions</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Sections Count
            </span>
            <span className="text-xl font-black text-slate-100">{sections.length} Sections</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/assessments"
            className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-slate-700 hover:bg-slate-800 transition-colors"
          >
            Cancel Builder
          </Link>
          <Button
            onClick={handleSaveAssessment}
            isLoading={saving}
            className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 shadow-md shadow-indigo-600/10 text-white font-bold"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Assessment Blueprint
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentBuilder;
