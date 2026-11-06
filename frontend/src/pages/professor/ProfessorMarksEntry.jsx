import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi } from '../../api/adminApi';
import { marksApi } from '../../api/marksApi';
import { GraduationCap, Save, CheckCircle2, RefreshCw } from 'lucide-react';

export default function ProfessorMarksEntry() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [assessmentName, setAssessmentName] = useState('Midterm Examination');
  const [maxScore, setMaxScore] = useState(50);
  const [roster, setRoster] = useState([]);
  const [marksMap, setMarksMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const res = await adminApi.getSubjects();
        if (res.success && res.data.length > 0) {
          setSubjects(res.data);
          setSelectedSubjectId(res.data[0]._id);
          setMaxScore(res.data[0].maxMark || 50);
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, [user]);

  useEffect(() => {
    if (!selectedSubjectId) return;

    const loadRoster = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/api/subjects/${selectedSubjectId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('edupulse_token')}`,
          },
        }).then((r) => r.json());

        if (res.success && res.data?.roster) {
          setRoster(res.data.roster);
          // Preload existing marks if any
          const marksRes = await marksApi.getSubjectMarks(selectedSubjectId);
          const initialMap = {};
          if (marksRes.success) {
            marksRes.data.forEach((m) => {
              if (m.assessmentName === assessmentName && m.studentId?._id) {
                initialMap[m.studentId._id] = m.score;
              }
            });
          }
          setMarksMap(initialMap);
        }
      } catch (err) {
        console.error('Error fetching roster/marks:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRoster();
  }, [selectedSubjectId, assessmentName]);

  const handleScoreChange = (studentId, val) => {
    setMarksMap((prev) => ({
      ...prev,
      [studentId]: val,
    }));
  };

  const handleSave = async (studentId) => {
    const scoreVal = parseFloat(marksMap[studentId]);
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > maxScore) {
      alert(`Score must be between 0 and ${maxScore}`);
      return;
    }

    try {
      setSaving(true);
      const res = await marksApi.createMark({
        studentId,
        subjectId: selectedSubjectId,
        assessmentName,
        score: scoreVal,
        maxScore,
      });

      if (res.success) {
        setSuccessMsg(`Mark saved for student! Risk score recalculated.`);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save mark.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-md">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/30">
          <GraduationCap className="w-3.5 h-3.5 text-indigo-400" /> Manual Gradebook & Evaluation Register
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Marks Gradebook</h1>
        <p className="text-xs text-slate-300 mt-1">
          Review, enter, or revise assessment scores across your enrolled student cohort.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Course & Assessment Selectors */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Select Course:
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value);
              const sub = subjects.find((s) => s._id === e.target.value);
              if (sub) setMaxScore(sub.maxMark || 50);
            }}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-colors"
          >
            {subjects.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.code} - {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Assessment Name:
          </label>
          <input
            type="text"
            value={assessmentName}
            onChange={(e) => setAssessmentName(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Maximum Mark:
          </label>
          <input
            type="number"
            value={maxScore}
            onChange={(e) => setMaxScore(parseFloat(e.target.value) || 50)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-colors"
          />
        </div>
      </div>

      {/* Roster Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="pb-3 font-semibold">Student Name</th>
                <th className="pb-3 font-semibold">Student ID</th>
                <th className="pb-3 font-semibold">Score (0 - {maxScore})</th>
                <th className="pb-3 font-semibold text-right">Commit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {roster.map((s) => (
                <tr key={s.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 font-bold text-slate-900 dark:text-slate-100">{s.name}</td>
                  <td className="py-3 font-mono font-medium text-slate-600 dark:text-slate-400">{s.studentCode}</td>
                  <td className="py-3">
                    <input
                      type="number"
                      min="0"
                      max={maxScore}
                      value={marksMap[s.studentId] !== undefined ? marksMap[s.studentId] : ''}
                      onChange={(e) => handleScoreChange(s.studentId, e.target.value)}
                      placeholder="e.g. 42"
                      className="w-24 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-sm font-mono text-indigo-700 dark:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold"
                    />
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleSave(s.studentId)}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 ml-auto cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
