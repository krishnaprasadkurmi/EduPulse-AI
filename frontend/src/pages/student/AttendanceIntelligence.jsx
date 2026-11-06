import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { attendanceApi } from '../../api/attendanceApi';
import {
  CalendarCheck,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Info,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function AttendanceIntelligence({ onSelectTab }) {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [loading, setLoading] = useState(true);

  const studentId = user?.profile?._id || user?.id;

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const res = await attendanceApi.getStudentAttendance(studentId);
        if (res.success) {
          const sums = res.data.summaries || [];
          setSummaries(sums);
          if (sums.length > 0) {
            setSelectedSubjectId(sums[0].subject._id);
          }
        }
      } catch (err) {
        console.error('Attendance fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) fetchAttendance();
  }, [studentId]);

  const activeSummary = summaries.find((s) => s.subject._id === selectedSubjectId) || summaries[0];

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mr-3" />
        Calculating transparent attendance statistics & trend projections...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            <CalendarCheck className="w-3.5 h-3.5" /> 75% Mandatory Attendance Compliance Engine
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Attendance Intelligence & Trends</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Predictive tracking around the university 75% threshold with transparent recovery math.
          </p>
        </div>

        <button
          onClick={() => onSelectTab('what-if')}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
        >
          <span>Open What-If Simulator</span>
        </button>
      </div>

      {/* Subject Pill Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {summaries.map(({ subject, stats }) => {
          const isActive = subject._id === selectedSubjectId;
          const isCritical = stats.status === 'CRITICAL';
          const isWarning = stats.status === 'WARNING';

          return (
            <button
              key={subject._id}
              onClick={() => setSelectedSubjectId(subject._id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-2 border ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-200 border-indigo-300 dark:border-indigo-500/50 shadow-sm font-bold'
                  : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{subject.code}</span>
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">({stats.percentage}%)</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
            </button>
          );
        })}
      </div>

      {activeSummary && (
        <div className="space-y-6">
          {/* Main Card: Blueprint Example UI Spec */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                  {activeSummary.subject.code}
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                  {activeSummary.subject.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Department of {activeSummary.subject.department} • Semester {activeSummary.subject.semester}
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <div
                  className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${
                    activeSummary.stats.status === 'CRITICAL'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-500/50 text-rose-700 dark:text-rose-300'
                      : activeSummary.stats.status === 'WARNING'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/50 text-amber-700 dark:text-amber-300'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {activeSummary.stats.status === 'CRITICAL' ? (
                    <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  ) : activeSummary.stats.status === 'WARNING' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  )}
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                      Compliance Status
                    </div>
                    <div className="text-sm font-extrabold uppercase">
                      {activeSummary.stats.status}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics 4-Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-b border-slate-100 dark:border-slate-800/80">
              {/* Current Attendance */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold">Current Attendance</div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {activeSummary.stats.percentage}%
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {activeSummary.stats.attendedClasses} / {activeSummary.stats.totalClasses} classes attended
                </div>
              </div>

              {/* Recent Trend */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold">Recent Trend</div>
                <div
                  className={`text-2xl font-bold flex items-center gap-1.5 ${
                    activeSummary.stats.trend < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : activeSummary.stats.trend > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {activeSummary.stats.trend < 0 ? (
                    <TrendingDown className="w-6 h-6" />
                  ) : (
                    <TrendingUp className="w-6 h-6" />
                  )}
                  <span>
                    {activeSummary.stats.trend > 0 ? `+${activeSummary.stats.trend}%` : `${activeSummary.stats.trend}%`}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">over recent sessions</div>
              </div>

              {/* Projected Attendance */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold">Projected End-Term</div>
                <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-300">
                  {activeSummary.stats.projectedPercentage}%
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Linear trend projection</div>
              </div>

              {/* Required to 75% */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold">To Reach 75% Threshold</div>
                <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                  {activeSummary.stats.requiredClassesToReach75 > 0
                    ? `${activeSummary.stats.requiredClassesToReach75} classes`
                    : 'Target Met'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {activeSummary.stats.requiredClassesToReach75 > 0
                    ? 'consecutive attendances needed'
                    : `Can miss up to ${activeSummary.stats.classesCanMiss} class(es)`}
                </div>
              </div>
            </div>

            {/* Recommendation Banner */}
            <div className="pt-6 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">Recommended Action: </span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">{activeSummary.stats.recommendation}</span>
              </div>
            </div>
          </div>

          {/* Recent Class Attendance Logs */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Recent Class Attendance History Log</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="pb-3 font-semibold">Session Date</th>
                    <th className="pb-3 font-semibold">Subject</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {activeSummary.recentRecords && activeSummary.recentRecords.length > 0 ? (
                    activeSummary.recentRecords.map((rec) => (
                      <tr key={rec._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="py-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                          {new Date(rec.date).toLocaleDateString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3 font-medium text-slate-800 dark:text-slate-200">{activeSummary.subject.name}</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold uppercase text-[10px] ${
                              rec.status === 'present'
                                ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                                : 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                            }`}
                          >
                            {rec.status === 'present' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                            )}
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-3 text-right text-slate-400 dark:text-slate-500 font-mono text-[10px]">
                          Faculty Verified
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-slate-400 dark:text-slate-500">
                        No recorded sessions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
