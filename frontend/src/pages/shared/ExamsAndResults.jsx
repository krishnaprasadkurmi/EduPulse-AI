import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { examApi } from '../../api/examApi';
import { resultApi } from '../../api/resultApi';
import { subjectApi } from '../../api/subjectApi';
import {
  Calendar,
  Clock,
  MapPin,
  Award,
  TrendingUp,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Plus,
  Filter,
  Search,
  BookOpen,
  BarChart3,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
  Percent,
  Sliders,
  X,
  Edit,
  Trash2,
  Send,
  HelpCircle,
} from 'lucide-react';

const EXAM_TYPES = [
  'All',
  'Internal Assessment',
  'Midterm',
  'Model Exam',
  'End Semester',
  'Practical',
  'Other',
];

export default function ExamsAndResults() {
  const { user } = useAuth();

  // Tab navigation
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'results' | 'grade-history' | 'analytics' (admin) | 'faculty-entry' (prof)

  // Data states
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [allExams, setAllExams] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [gradeHistory, setGradeHistory] = useState([]);
  const [academicSummary, setAcademicSummary] = useState(null);
  const [adminAnalytics, setAdminAnalytics] = useState(null);
  const [subjects, setSubjects] = useState([]);

  // Filter states
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedExamType, setSelectedExamType] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Professor / Admin: Schedule Exam Modal
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [examForm, setExamForm] = useState({
    name: '',
    subjectId: '',
    examType: 'Midterm',
    date: '',
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    venue: 'Hall 402',
    maxMarks: 50,
    status: 'Scheduled',
  });
  const [submittingExam, setSubmittingExam] = useState(false);

  // Faculty: Mark / Result Entry Modal
  const [isResultEntryOpen, setIsResultEntryOpen] = useState(false);
  const [selectedExamForResults, setSelectedExamForResults] = useState(null);
  const [examResultsRoster, setExamResultsRoster] = useState([]);
  const [submittingResults, setSubmittingResults] = useState(false);

  // Load data based on role
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [examsRes, subsRes] = await Promise.all([
        examApi.getExams({
          subjectId: selectedSubject !== 'All' ? selectedSubject : undefined,
          examType: selectedExamType !== 'All' ? selectedExamType : undefined,
        }),
        subjectApi.getAllSubjects().catch(() => ({ subjects: [] })),
      ]);

      setAllExams(examsRes.exams || []);
      setSubjects(subsRes.subjects || []);

      // If Student: fetch personal results, grade history, and academic summary
      if (user.role === 'student') {
        const [resultsRes, historyRes, summaryRes] = await Promise.all([
          resultApi.getMyResults().catch(() => ({ results: [] })),
          resultApi.getMyGradeHistory().catch(() => ({ history: [] })),
          resultApi.getMyAcademicSummary().catch(() => ({ summary: null })),
        ]);

        setMyResults(resultsRes.results || []);
        setGradeHistory(historyRes.history || []);
        setAcademicSummary(summaryRes.summary);
      }

      // If Admin or Professor: fetch university analytics
      if (user.role === 'admin' || user.role === 'professor') {
        const analyticsRes = await resultApi.getAdminAnalytics().catch(() => null);
        if (analyticsRes) setAdminAnalytics(analyticsRes.analytics);
      }
    } catch (err) {
      console.error('Error loading exams and results:', err);
      setError('Failed to fetch academic assessment records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSubject, selectedExamType]);

  // Open Exam Schedule Modal
  const openExamModal = (exam = null) => {
    if (exam) {
      setEditingExam(exam);
      setExamForm({
        name: exam.name || '',
        subjectId: exam.subjectId?._id || exam.subjectId || '',
        examType: exam.examType || 'Midterm',
        date: exam.date ? new Date(exam.date).toISOString().split('T')[0] : '',
        startTime: exam.startTime || '10:00 AM',
        endTime: exam.endTime || '12:00 PM',
        venue: exam.venue || 'Hall 402',
        maxMarks: exam.maxMarks || 50,
        status: exam.status || 'Scheduled',
      });
    } else {
      setEditingExam(null);
      setExamForm({
        name: '',
        subjectId: subjects[0]?._id || '',
        examType: 'Midterm',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        venue: 'Hall 402',
        maxMarks: 50,
        status: 'Scheduled',
      });
    }
    setIsExamModalOpen(true);
  };

  // Submit Exam Form
  const handleExamSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingExam(true);
      if (editingExam) {
        await examApi.updateExam(editingExam._id, examForm);
        setActionSuccess('Exam schedule updated successfully!');
      } else {
        await examApi.createExam(examForm);
        setActionSuccess('Exam scheduled and notifications dispatched to students!');
      }
      setIsExamModalOpen(false);
      setTimeout(() => setActionSuccess(null), 4000);
      loadData();
    } catch (err) {
      console.error('Error saving exam:', err);
      alert(err.response?.data?.message || 'Failed to save exam schedule.');
    } finally {
      setSubmittingExam(false);
    }
  };

  // Delete Exam
  const handleDeleteExam = async (id, name) => {
    if (!window.confirm(`Are you sure you want to cancel and delete "${name}"?`)) return;
    try {
      await examApi.deleteExam(id);
      setActionSuccess('Exam schedule cancelled.');
      setTimeout(() => setActionSuccess(null), 3000);
      loadData();
    } catch (err) {
      console.error('Error deleting exam:', err);
      alert(err.response?.data?.message || 'Failed to delete exam.');
    }
  };

  // Open Result Entry Gradebook Modal (Professor)
  const openResultEntry = async (exam) => {
    setSelectedExamForResults(exam);
    try {
      // Fetch roster / existing results
      const res = await resultApi.getExamResults(exam._id);
      if (res.results && res.results.length > 0) {
        setExamResultsRoster(
          res.results.map((r) => ({
            studentId: r.studentId?._id || r.studentId,
            name: r.studentId?.userId?.name || 'Student',
            internalMarks: r.internalMarks || 0,
            assignmentMarks: r.assignmentMarks || 0,
            practicalMarks: r.practicalMarks || 0,
            externalMarks: r.externalMarks || 0,
            totalMarks: r.totalMarks || 0,
            published: r.published !== undefined ? r.published : true,
          }))
        );
      } else {
        // Fallback default sample roster for entry
        setExamResultsRoster([
          { studentId: '6ac08c23cbc11e688212ca61', name: 'Rahul Sharma', internalMarks: 22, assignmentMarks: 18, practicalMarks: 0, externalMarks: 44, totalMarks: 84, published: true },
          { studentId: '6ac08c23cbc11e688212ca65', name: 'Priya Singh', internalMarks: 24, assignmentMarks: 20, practicalMarks: 0, externalMarks: 45, totalMarks: 89, published: true },
          { studentId: '6ac08c23cbc11e688212ca69', name: 'Arjun Kumar', internalMarks: 25, assignmentMarks: 20, practicalMarks: 0, externalMarks: 48, totalMarks: 93, published: true },
        ]);
      }
      setIsResultEntryOpen(true);
    } catch (err) {
      console.error('Error opening result entry:', err);
      alert('Failed to load student roster for this examination.');
    }
  };

  // Submit Published Results
  const handlePublishResults = async () => {
    if (!selectedExamForResults) return;
    try {
      setSubmittingResults(true);
      await resultApi.saveResults({
        examId: selectedExamForResults._id,
        subjectId: selectedExamForResults.subjectId?._id || selectedExamForResults.subjectId,
        resultsData: examResultsRoster,
        published: true,
      });

      setActionSuccess('Official exam results published! Student alerts sent.');
      setIsResultEntryOpen(false);
      setTimeout(() => setActionSuccess(null), 4000);
      loadData();
    } catch (err) {
      console.error('Error publishing results:', err);
      alert(err.response?.data?.message || 'Failed to publish results.');
    } finally {
      setSubmittingResults(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-purple-900/60 via-indigo-900/50 to-slate-900/80 border border-purple-500/20 shadow-xl backdrop-blur relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-2 border border-purple-500/30">
              <Award className="w-3.5 h-3.5" />
              <span>Assessment & Evaluation Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Exams, Results & Grade Progression
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Track upcoming examinations, view multi-assessment breakdowns, and monitor cumulative SGPA/CGPA history.
            </p>
          </div>

          {(user.role === 'professor' || user.role === 'admin') && (
            <button
              onClick={() => openExamModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Exam</span>
            </button>
          )}
        </div>

        {/* Student Academic Summary Banner */}
        {user.role === 'student' && academicSummary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-purple-500/20 text-slate-200">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-slate-400 block font-medium">Cumulative CGPA</span>
              <span className="text-xl font-black text-amber-400">{academicSummary.currentCGPA} / 10.0</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-slate-400 block font-medium">Current SGPA</span>
              <span className="text-xl font-black text-emerald-400">{academicSummary.currentSGPA}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-slate-400 block font-medium">Average Marks</span>
              <span className="text-xl font-bold text-indigo-300">{academicSummary.averageMarks}%</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-slate-400 block font-medium">Strongest Subject</span>
              <span className="text-sm font-bold text-emerald-300 truncate block">
                {academicSummary.strongestSubject?.code} ({academicSummary.strongestSubject?.percentage}%)
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-slate-400 block font-medium">Needs Attention</span>
              <span className="text-sm font-bold text-rose-400 truncate block">
                {academicSummary.subjectNeedingAttention?.code} ({academicSummary.subjectNeedingAttention?.percentage}%)
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-slate-400 block font-medium">Completed Credits</span>
              <span className="text-xl font-bold text-purple-300">
                {academicSummary.completedCredits} / {academicSummary.totalCredits}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-3 text-sm font-semibold animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'upcoming'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Upcoming Exams ({allExams.length})</span>
          </button>

          {user.role === 'student' && (
            <>
              <button
                onClick={() => setActiveTab('results')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'results'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Previous Results ({myResults.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('grade-history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'grade-history'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Grade History & CGPA</span>
              </button>
            </>
          )}

          {(user.role === 'admin' || user.role === 'professor') && (
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>University Performance Analytics</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="All">All Subjects</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>{s.code} - {s.name}</option>
            ))}
          </select>

          <select
            value={selectedExamType}
            onChange={(e) => setSelectedExamType(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            {EXAM_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB 1: Upcoming Examinations */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 text-center text-slate-400">Loading exams schedule...</div>
          ) : allExams.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Calendar className="w-12 h-12 text-purple-400 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">No upcoming exams scheduled</h3>
              <p className="text-xs text-slate-400 mt-1">Enjoy your study sessions or check past results.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {allExams.map((exam) => {
                const diffTime = new Date(exam.date).getTime() - Date.now();
                const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isUrgent = daysRemaining <= 3 && daysRemaining >= 0;

                return (
                  <div
                    key={exam._id}
                    className={`rounded-2xl p-5 bg-white dark:bg-slate-900 border shadow-sm transition-all flex flex-col justify-between ${
                      isUrgent
                        ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-transparent'
                        : 'border-slate-200 dark:border-slate-800 hover:border-purple-500/40'
                    }`}
                  >
                    <div>
                      {/* Top Tag & Status */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {exam.examType}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            daysRemaining < 0
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              : daysRemaining === 0
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          }`}
                        >
                          {daysRemaining < 0
                            ? 'Completed'
                            : daysRemaining === 0
                            ? '🔥 Today'
                            : `⏳ In ${daysRemaining} days`}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 line-clamp-1">
                        {exam.name}
                      </h3>
                      <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 block mt-0.5">
                        {exam.subjectId?.code} — {exam.subjectId?.name}
                      </span>

                      {/* Schedule Details */}
                      <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-purple-500" />
                          <span>
                            {new Date(exam.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{exam.startTime} – {exam.endTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>Venue: <strong>{exam.venue}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span>Max Marks: <strong>{exam.maxMarks}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Faculty Actions */}
                    {(user.role === 'professor' || user.role === 'admin') && (
                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => openResultEntry(exam)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold transition-colors"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Enter / Publish Results</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openExamModal(exam)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-purple-400"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExam(exam._id, exam.name)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Student Previous Results */}
      {activeTab === 'results' && user.role === 'student' && (
        <div className="space-y-4">
          {myResults.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Award className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300">No results published yet</h3>
              <p className="text-xs text-slate-400 mt-1">Official scores will appear here once published by faculty.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Subject & Assessment</th>
                    <th className="p-4 text-center">Internal</th>
                    <th className="p-4 text-center">Assignment</th>
                    <th className="p-4 text-center">Practical</th>
                    <th className="p-4 text-center">External</th>
                    <th className="p-4 text-center">Total Score</th>
                    <th className="p-4 text-center">Percentage</th>
                    <th className="p-4 text-center">Grade</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {myResults.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">
                          {r.subjectId?.name}
                        </span>
                        <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold block">
                          {r.subjectId?.code} • {r.examId?.name || 'Evaluation'}
                        </span>
                      </td>
                      <td className="p-4 text-center text-slate-600 dark:text-slate-300">{r.internalMarks}</td>
                      <td className="p-4 text-center text-slate-600 dark:text-slate-300">{r.assignmentMarks}</td>
                      <td className="p-4 text-center text-slate-600 dark:text-slate-300">{r.practicalMarks}</td>
                      <td className="p-4 text-center text-slate-600 dark:text-slate-300">{r.externalMarks}</td>
                      <td className="p-4 text-center font-extrabold text-slate-900 dark:text-slate-100">
                        {r.totalMarks} / {r.maxMarks || 100}
                      </td>
                      <td className="p-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                        {r.percentage}%
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-md text-xs font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {r.grade} ({r.gradePoint} GP)
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.resultStatus === 'Distinction'
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : r.resultStatus === 'Pass'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          }`}
                        >
                          {r.resultStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Grade History & Progression */}
      {activeTab === 'grade-history' && user.role === 'student' && (
        <div className="space-y-6">
          {/* Progression Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {gradeHistory.map((gh) => (
              <div
                key={gh._id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    Semester {gh.semester}
                  </span>
                  <span>{gh.academicYear}</span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">SGPA</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{gh.sgpa}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block font-medium">CGPA</span>
                    <span className="text-lg font-bold text-amber-500">{gh.cgpa}</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Credits: {gh.completedCredits}/{gh.totalCredits}</span>
                  <span className="text-emerald-500 font-semibold">{gh.passedSubjectsCount || 6} Passed</span>
                </div>
              </div>
            ))}
          </div>

          {/* Simple Visual Progression Bar Chart */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span>Semester-wise SGPA Progression</span>
            </h3>
            <div className="flex items-end justify-around h-48 pt-6 pb-2 border-b border-slate-200 dark:border-slate-800">
              {gradeHistory.map((gh) => {
                const heightPct = (gh.sgpa / 10) * 100;
                return (
                  <div key={gh._id} className="flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{gh.sgpa}</span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-12 rounded-t-xl bg-gradient-to-t from-purple-600 to-indigo-500 shadow-md transition-all duration-500 hover:opacity-90"
                    />
                    <span className="text-[11px] text-slate-400 font-semibold">Sem {gh.semester}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: University Analytics (Admin / Faculty) */}
      {activeTab === 'analytics' && adminAnalytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-400 block font-medium">Total Evaluations</span>
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{adminAnalytics.totalResults}</span>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-400 block font-medium">University Pass Rate</span>
              <span className="text-2xl font-black text-emerald-500">{adminAnalytics.passPercentage}%</span>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-400 block font-medium">Distinction Achieved</span>
              <span className="text-2xl font-black text-amber-500">{adminAnalytics.distinctionCount}</span>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-400 block font-medium">Failed Examinations</span>
              <span className="text-2xl font-black text-rose-500">{adminAnalytics.failedCount}</span>
            </div>
          </div>

          {/* Subject Performance Breakdown */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4">
              Subject-wise Average Academic Performance
            </h3>
            <div className="space-y-3">
              {adminAnalytics.subjectPerformance?.map((sub) => (
                <div key={sub.subjectCode} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">{sub.subjectCode} - {sub.subjectName}</span>
                    <span className="text-purple-600 dark:text-purple-400">{sub.avgPercentage}% Avg</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${sub.avgPercentage}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Schedule / Edit Exam */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {editingExam ? 'Edit Examination Schedule' : 'Schedule University Examination'}
              </h3>
              <button onClick={() => setIsExamModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExamSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Exam Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midterm Assessment 1"
                  value={examForm.name}
                  onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subject *</label>
                  <select
                    required
                    value={examForm.subjectId}
                    onChange={(e) => setExamForm({ ...examForm, subjectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="" disabled>Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s._id} value={s._id}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Exam Type</label>
                  <select
                    value={examForm.examType}
                    onChange={(e) => setExamForm({ ...examForm, examType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    {EXAM_TYPES.filter((t) => t !== 'All').map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={examForm.date}
                    onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                  <input
                    type="text"
                    value={examForm.startTime}
                    onChange={(e) => setExamForm({ ...examForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                  <input
                    type="text"
                    value={examForm.endTime}
                    onChange={(e) => setExamForm({ ...examForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Venue</label>
                  <input
                    type="text"
                    value={examForm.venue}
                    onChange={(e) => setExamForm({ ...examForm, venue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={examForm.maxMarks}
                    onChange={(e) => setExamForm({ ...examForm, maxMarks: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExam}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md"
                >
                  {submittingExam ? 'Scheduling...' : editingExam ? 'Update Schedule' : 'Schedule Exam & Notify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Enter & Publish Results (Faculty Gradebook) */}
      {isResultEntryOpen && selectedExamForResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Gradebook Entry: {selectedExamForResults.name}
                </h3>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                  {selectedExamForResults.subjectId?.code} • Max Marks: {selectedExamForResults.maxMarks}
                </p>
              </div>
              <button onClick={() => setIsResultEntryOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-bold uppercase">
                  <tr>
                    <th className="p-3">Student Name</th>
                    <th className="p-3 text-center">Internal</th>
                    <th className="p-3 text-center">Assignment</th>
                    <th className="p-3 text-center">External</th>
                    <th className="p-3 text-center">Total Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {examResultsRoster.map((item, idx) => (
                    <tr key={item.studentId}>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{item.name}</td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          value={item.internalMarks}
                          onChange={(e) => {
                            const updated = [...examResultsRoster];
                            updated[idx].internalMarks = Number(e.target.value);
                            updated[idx].totalMarks = updated[idx].internalMarks + updated[idx].assignmentMarks + updated[idx].externalMarks;
                            setExamResultsRoster(updated);
                          }}
                          className="w-16 px-2 py-1 text-center rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          value={item.assignmentMarks}
                          onChange={(e) => {
                            const updated = [...examResultsRoster];
                            updated[idx].assignmentMarks = Number(e.target.value);
                            updated[idx].totalMarks = updated[idx].internalMarks + updated[idx].assignmentMarks + updated[idx].externalMarks;
                            setExamResultsRoster(updated);
                          }}
                          className="w-16 px-2 py-1 text-center rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          value={item.externalMarks}
                          onChange={(e) => {
                            const updated = [...examResultsRoster];
                            updated[idx].externalMarks = Number(e.target.value);
                            updated[idx].totalMarks = updated[idx].internalMarks + updated[idx].assignmentMarks + updated[idx].externalMarks;
                            setExamResultsRoster(updated);
                          }}
                          className="w-16 px-2 py-1 text-center rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold"
                        />
                      </td>
                      <td className="p-3 text-center font-black text-purple-600 dark:text-purple-400">
                        {item.totalMarks} / {selectedExamForResults.maxMarks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-400">
                Publishing will trigger automated WhatsApp & Email notifications to all enrolled students.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsResultEntryOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublishResults}
                  disabled={submittingResults}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingResults ? 'Publishing...' : 'Publish & Dispatch Alerts'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
