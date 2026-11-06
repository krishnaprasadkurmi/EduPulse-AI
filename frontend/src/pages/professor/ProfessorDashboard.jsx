import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi } from '../../api/adminApi';
import {
  BookOpen,
  Users,
  ShieldAlert,
  Mic,
  CalendarCheck,
  GraduationCap,
  ArrowRight,
  TrendingDown,
  Sparkles,
} from 'lucide-react';

export default function ProfessorDashboard({ onSelectTab }) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [atRiskList, setAtRiskList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [subRes, rskRes] = await Promise.all([
          adminApi.getSubjects(),
          adminApi.getRiskMonitor(),
        ]);

        if (subRes.success) setSubjects(subRes.data || []);
        if (rskRes.success) {
          // Filter high and medium risk students in professor's subjects
          const risky = (rskRes.data || []).filter(
            (r) => r.level === 'HIGH' || r.level === 'MEDIUM'
          );
          setAtRiskList(risky);
        }
      } catch (err) {
        console.error('Error fetching prof dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mr-3" />
        Loading faculty command center...
      </div>
    );
  }

  const highRiskCount = atRiskList.filter((r) => r.level === 'HIGH').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
            <GraduationCap className="w-3.5 h-3.5" /> Faculty Command Center
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Welcome, {user?.name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Department of {user?.department || 'Computer Science & Engineering'} • Faculty ID: {user?.profile?.employeeId || 'FAC1001'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('voice-marks')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
          >
            <Mic className="w-4 h-4" />
            <span>AI Voice Mark Entry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-semibold">Assigned Courses</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{subjects.length || 2}</div>
          <p className="text-[11px] text-slate-400 mt-1">Active Teaching Roster</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-semibold">Enrolled Students</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">12 Students</div>
          <p className="text-[11px] text-slate-400 mt-1">Active Cohort Total</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-semibold">High Risk Interventions</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-rose-500 dark:text-rose-400">{highRiskCount}</span>
            <span className="text-xs text-rose-500 font-semibold">Immediate Action</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Students &lt; 75% attendance</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-semibold">AI Voice Adapter</span>
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Ready</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Hands-free Mark Parser</p>
        </div>
      </div>

      {/* Quick Launchpad & Assigned Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assigned Courses (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Assigned Courses & Actions</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subjects.map((sub) => (
              <div
                key={sub._id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                      {sub.code}
                    </span>
                    <span className="text-xs text-slate-400">Semester {sub.semester}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                    {sub.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Max Assessment Mark: {sub.maxMark || 50} pts • {sub.credits || 4} Credits
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSelectTab('voice-marks')}
                    className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Voice Marks</span>
                  </button>
                  <button
                    onClick={() => onSelectTab('attendance-entry')}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Attendance</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* At-Risk Students Spotlight (1 col) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>At-Risk Students</span>
            </h3>
            <button
              onClick={() => onSelectTab('at-risk')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            >
              View all
            </button>
          </div>

          <div className="space-y-2.5">
            {atRiskList.slice(0, 4).map((r) => (
              <div
                key={r._id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {r.studentId?.userId?.name || 'Rahul Sharma'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {r.subjectId?.code || 'CS301'} • Risk Index: {r.score}/100
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    r.level === 'HIGH'
                      ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                  }`}
                >
                  {r.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
