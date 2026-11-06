import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { marksApi } from '../../api/marksApi';
import { GraduationCap, Award, Calendar, BookOpen, AlertCircle } from 'lucide-react';

export default function StudentMarks() {
  const { user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('ALL');

  const studentId = user?.profile?._id || user?.id;

  useEffect(() => {
    const fetchMarks = async () => {
      try {
        setLoading(true);
        const res = await marksApi.getStudentMarks(studentId);
        if (res.success) {
          setMarks(res.data || []);
        }
      } catch (err) {
        console.error('Marks fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) fetchMarks();
  }, [studentId]);

  const uniqueSubjects = Array.from(
    new Set(marks.map((m) => m.subjectId?.name).filter(Boolean))
  );

  const filteredMarks = selectedSubject === 'ALL'
    ? marks
    : marks.filter((m) => m.subjectId?.name === selectedSubject);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mr-3" />
        Loading academic assessments & gradebook...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
          <GraduationCap className="w-3.5 h-3.5" /> Assessment & Evaluation Record
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Marks & Evaluation</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Verified academic records, quiz marks, and mid-term examination results.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setSelectedSubject('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
            selectedSubject === 'ALL'
              ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-200 border-indigo-300 dark:border-indigo-500/50 shadow-sm font-bold'
              : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          All Subjects ({marks.length})
        </button>
        {uniqueSubjects.map((name) => (
          <button
            key={name}
            onClick={() => setSelectedSubject(name)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
              selectedSubject === name
                ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-200 border-indigo-300 dark:border-indigo-500/50 shadow-sm font-bold'
                : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Marks Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="pb-3 font-semibold">Subject</th>
                <th className="pb-3 font-semibold">Assessment Title</th>
                <th className="pb-3 font-semibold">Score / Max</th>
                <th className="pb-3 font-semibold">Percentage</th>
                <th className="pb-3 font-semibold">Evaluator</th>
                <th className="pb-3 font-semibold text-right">Date Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {filteredMarks.length > 0 ? (
                filteredMarks.map((m) => {
                  const pct = Math.round((m.score / m.maxScore) * 100);
                  const isLow = pct < 50;

                  return (
                    <tr key={m._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-3.5">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{m.subjectId?.name || 'Subject'}</div>
                        <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">{m.subjectId?.code}</span>
                      </td>
                      <td className="py-3.5 font-medium text-slate-800 dark:text-slate-200">{m.assessmentName}</td>
                      <td className="py-3.5 font-mono text-sm font-bold">
                        <span className={isLow ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}>{m.score}</span>
                        <span className="text-slate-400 dark:text-slate-500 text-xs font-normal"> / {m.maxScore}</span>
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            pct >= 75
                              ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                              : pct >= 50
                              ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                              : 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                          }`}
                        >
                          {pct}%
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-600 dark:text-slate-400">{m.enteredBy?.name || 'Faculty'}</td>
                      <td className="py-3.5 text-right font-mono text-[11px] text-slate-400 dark:text-slate-500">
                        {new Date(m.createdAt || m.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 dark:text-slate-500">
                    No assessment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
