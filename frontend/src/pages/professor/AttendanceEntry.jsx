import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi } from '../../api/adminApi';
import { attendanceApi } from '../../api/attendanceApi';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Save,
  CheckCheck,
  Calendar,
  RefreshCw,
  Users,
} from 'lucide-react';

export default function AttendanceEntry() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [roster, setRoster] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { [studentId]: 'present' | 'absent' }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const res = await adminApi.getSubjects();
        if (res.success && res.data.length > 0) {
          setSubjects(res.data);
          setSelectedSubjectId(res.data[0]._id);
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, [user]);

  // Load roster when subject changes
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
          // Default all to 'present'
          const initialMap = {};
          res.data.roster.forEach((student) => {
            initialMap[student.studentId] = 'present';
          });
          setAttendanceMap(initialMap);
        }
      } catch (err) {
        console.error('Error fetching subject roster:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRoster();
  }, [selectedSubjectId]);

  const toggleStatus = (studentId) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present',
    }));
  };

  const markAll = (status) => {
    const newMap = {};
    roster.forEach((s) => {
      newMap[s.studentId] = status;
    });
    setAttendanceMap(newMap);
  };

  const handleSave = async () => {
    if (!selectedSubjectId) return;

    try {
      setSaving(true);
      setSuccessMessage('');

      const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      const res = await attendanceApi.recordAttendance({
        subjectId: selectedSubjectId,
        date,
        records,
      });

      if (res.success) {
        setSuccessMessage(
          `Attendance successfully saved for ${res.count} students! Automatic trend and risk recalculations completed (${res.notificationsTriggered} alert notifications dispatched).`
        );
      }
    } catch (err) {
      console.error('Error saving attendance:', err);
      alert('Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter((v) => v === 'present').length;
  const absentCount = Object.values(attendanceMap).filter((v) => v === 'absent').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/30">
            <CalendarCheck className="w-3.5 h-3.5 text-indigo-400" /> Rapid Attendance Session Recorder
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Attendance Entry</h1>
          <p className="text-xs text-slate-300 mt-1">
            Toggle student attendance for today's lecture. Saving automatically triggers attendance trend alerts and recalculates academic risk scores.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || roster.length === 0}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow-emerald flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving & Recalculating...' : 'Save Attendance Session'}</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold text-emerald-700 dark:text-emerald-300">Session Recorded</strong>
            {successMessage}
          </div>
        </div>
      )}

      {/* Filter and Date Configuration */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Select Course:
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
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
            Session Date:
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-colors"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => markAll('present')}
            className="flex-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>All Present</span>
          </button>
          <button
            type="button"
            onClick={() => markAll('absent')}
            className="flex-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>All Absent</span>
          </button>
        </div>
      </div>

      {/* Roster Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Class Roster ({roster.length} Enrolled Students)
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{presentCount} Present</span>
            <span className="text-slate-400">•</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">{absentCount} Absent</span>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="pb-3 font-semibold">Student Name</th>
                <th className="pb-3 font-semibold">Student ID</th>
                <th className="pb-3 font-semibold">CGPA</th>
                <th className="pb-3 font-semibold text-right">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {roster.map((s) => {
                const isPresent = attendanceMap[s.studentId] === 'present';

                return (
                  <tr key={s.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{s.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{s.email}</div>
                    </td>
                    <td className="py-3 font-mono font-medium text-slate-600 dark:text-slate-300">{s.studentCode || 'STU2024'}</td>
                    <td className="py-3 font-mono text-slate-600 dark:text-slate-300">{s.cgpa}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => toggleStatus(s.studentId)}
                        className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[11px] transition-all flex items-center gap-1.5 ml-auto cursor-pointer ${
                          isPresent
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 shadow-sm'
                            : 'bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40 shadow-sm'
                        }`}
                      >
                        {isPresent ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        )}
                        <span>{isPresent ? 'Present' : 'Absent'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
