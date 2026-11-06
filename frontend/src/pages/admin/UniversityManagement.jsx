import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { BookOpen, Users, GraduationCap, Building2 } from 'lucide-react';

export default function UniversityManagement() {
  const [tab, setTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [studRes, subjRes] = await Promise.all([
          adminApi.getStudents(),
          adminApi.getSubjects(),
        ]);
        if (studRes.success) setStudents(studRes.data || []);
        if (subjRes.success) setSubjects(subjRes.data || []);
      } catch (err) {
        console.error('Management fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-md">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/30">
          <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Institutional Registry & Curriculum
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Curriculum & Cohort Management</h1>
        <p className="text-xs text-slate-300 mt-1">
          Official university records for enrolled undergraduate cohorts, faculty chairs, and active course catalogs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setTab('students')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border cursor-pointer ${
            tab === 'students'
              ? 'bg-indigo-50 border-indigo-400 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-500 dark:text-indigo-200 shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Cohort ({students.length})</span>
        </button>

        <button
          onClick={() => setTab('subjects')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border cursor-pointer ${
            tab === 'subjects'
              ? 'bg-indigo-50 border-indigo-400 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-500 dark:text-indigo-200 shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Course Catalog ({subjects.length})</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
        {tab === 'students' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="pb-3 font-semibold">Student Name</th>
                  <th className="pb-3 font-semibold">Student ID</th>
                  <th className="pb-3 font-semibold">Department</th>
                  <th className="pb-3 font-semibold">Semester / Batch</th>
                  <th className="pb-3 font-semibold text-right">CGPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{s.userId?.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{s.userId?.email}</div>
                    </td>
                    <td className="py-3 font-mono font-semibold text-indigo-600 dark:text-indigo-300">{s.studentId}</td>
                    <td className="py-3">{s.department}</td>
                    <td className="py-3">Semester {s.semester} ({s.batch})</td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">{s.cgpa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="pb-3 font-semibold">Course Code</th>
                  <th className="pb-3 font-semibold">Subject Title</th>
                  <th className="pb-3 font-semibold">Department</th>
                  <th className="pb-3 font-semibold">Credits</th>
                  <th className="pb-3 font-semibold">Assigned Faculty</th>
                  <th className="pb-3 font-semibold text-right">Max Mark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {subjects.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{sub.code}</td>
                    <td className="py-3 font-bold text-slate-900 dark:text-slate-100">{sub.name}</td>
                    <td className="py-3">{sub.department}</td>
                    <td className="py-3 font-mono">{sub.credits}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">
                      {sub.professorIds?.map((p) => p.userId?.name).join(', ') || 'Assigned'}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">{sub.maxMark || 50}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
