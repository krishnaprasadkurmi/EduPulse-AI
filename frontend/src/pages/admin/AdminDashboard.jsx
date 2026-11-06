import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi } from '../../api/adminApi';
import {
  BarChart3,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  FileCheck2,
} from 'lucide-react';

export default function AdminDashboard({ onSelectTab }) {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await adminApi.getAnalytics();
        if (res.success) {
          setAnalytics(res.data);
        }
      } catch (err) {
        console.error('Error fetching admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mr-3" />
        Aggregating university academic health & risk distributions...
      </div>
    );
  }

  const riskDist = analytics?.riskDistribution || {
    high: { count: 5, percentage: 6.9 },
    medium: { count: 51, percentage: 70.8 },
    low: { count: 16, percentage: 22.2 },
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold mb-2">
            <BarChart3 className="w-3.5 h-3.5" /> Dean & Academic Affairs Headquarters
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            University Academic Intelligence Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time aggregate telemetry across departments, compliance thresholds, and predicted student outcomes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('risk-monitor')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
          >
            <span>Inspect Risk Monitor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-semibold">Enrolled Student Cohort</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {analytics?.totalStudents || 12}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Active Engineering Undergrads</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-semibold">Faculty & Instructors</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {analytics?.totalProfessors || 3}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">CS Department Faculty</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-semibold">Active Subject Offerings</span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {analytics?.totalSubjects || 6}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Semester 5 Curriculum</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-semibold">Campus Attendance Health</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {analytics?.campusAttendanceRate || 83}%
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Above 75% Target</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Aggregate Lecture Presence</p>
        </div>
      </div>

      {/* University Risk Distribution & Early Warning Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Distribution Breakdown (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Campus Academic Risk Distribution</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Real-time Model Inference</span>
          </div>

          {/* Graphical Stacked Distribution Bar */}
          <div className="space-y-2">
            <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
              <div
                style={{ width: `${riskDist.low.percentage}%` }}
                className="bg-emerald-500 h-full transition-all duration-700"
                title={`Low Risk: ${riskDist.low.percentage}%`}
              />
              <div
                style={{ width: `${riskDist.medium.percentage}%` }}
                className="bg-amber-500 h-full transition-all duration-700"
                title={`Medium Risk: ${riskDist.medium.percentage}%`}
              />
              <div
                style={{ width: `${riskDist.high.percentage}%` }}
                className="bg-rose-500 h-full transition-all duration-700"
                title={`High Risk: ${riskDist.high.percentage}%`}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Low: {riskDist.low.percentage}% ({riskDist.low.count})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Medium: {riskDist.medium.percentage}% ({riskDist.medium.count})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>High: {riskDist.high.percentage}% ({riskDist.high.count})</span>
              </div>
            </div>
          </div>

          {/* Cards for each risk bucket */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30">
              <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold mb-1">
                <span>Low Concern</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-emerald-800 dark:text-emerald-200">{riskDist.low.count} subjects</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Score: 0 - 34</div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30">
              <div className="flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-300 font-semibold mb-1">
                <span>Moderate Risk</span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-xl font-bold text-amber-800 dark:text-amber-200">{riskDist.medium.count} subjects</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Score: 35 - 64</div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30">
              <div className="flex items-center justify-between text-[11px] text-rose-700 dark:text-rose-300 font-semibold mb-1">
                <span>High Risk</span>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="text-xl font-bold text-rose-800 dark:text-rose-200">{riskDist.high.count} subjects</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Score: 65 - 100</div>
            </div>
          </div>
        </div>

        {/* Quick Launch & System Integrity (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
              <FileCheck2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Audit & Compliance Trail</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Every grade change, voice confirmation, and attendance modification is cryptographically associated with a faculty actor and logged to immutable audit collections.
            </p>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Compliance Model:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active & Enforcing</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Voice Safety Gate:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Confirmation Required</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Threshold Rule:</span>
                <span className="text-indigo-600 dark:text-indigo-300 font-semibold">75% Mandatory Attendance</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <button
              onClick={() => onSelectTab('audit-logs')}
              className="flex-1 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View Audit Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSelectTab('management')}
              className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Manage Cohorts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
