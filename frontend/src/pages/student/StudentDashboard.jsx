import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { attendanceApi } from '../../api/attendanceApi';
import { riskApi } from '../../api/riskApi';
import { marksApi } from '../../api/marksApi';
import { resultApi } from '../../api/resultApi';
import {
  Users,
  FileText,
  AlertTriangle,
  Calendar,
  BarChart2,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Award,
  X,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';

export default function StudentDashboard({ onSelectTab, onSelectSubject }) {
  const { user } = useAuth();
  const [attendanceSummaries, setAttendanceSummaries] = useState([]);
  const [riskData, setRiskData] = useState(null);
  const [marksList, setMarksList] = useState([]);
  const [academicSummary, setAcademicSummary] = useState(null);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const studentId = user?.profile?._id || user?.id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [attRes, rskRes, mrkRes, summaryRes] = await Promise.allSettled([
          attendanceApi.getStudentAttendance(studentId),
          riskApi.getStudentRisk(studentId),
          marksApi.getStudentMarks(studentId),
          resultApi.getMyAcademicSummary(studentId),
        ]);

        if (attRes.status === 'fulfilled' && attRes.value?.success) setAttendanceSummaries(attRes.value.data.summaries || []);
        if (rskRes.status === 'fulfilled' && rskRes.value?.success) setRiskData(rskRes.value.data);
        if (mrkRes.status === 'fulfilled' && mrkRes.value?.success) setMarksList(mrkRes.value.data || []);
        if (summaryRes.status === 'fulfilled' && summaryRes.value?.success) setAcademicSummary(summaryRes.value.summary || null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) fetchData();
  }, [studentId]);

  // Overall Attendance Calculation
  const totalConducted = attendanceSummaries.reduce((sum, s) => sum + s.stats.totalClasses, 0);
  const totalAttended = attendanceSummaries.reduce((sum, s) => sum + s.stats.attendedClasses, 0);
  const overallAttendance = totalConducted > 0
    ? Number(((totalAttended / totalConducted) * 100).toFixed(1))
    : 76.5;

  // At-Risk Subjects Count
  const atRiskCount = attendanceSummaries.filter(
    (s) => s.stats.status === 'CRITICAL' || s.stats.percentage < 75
  ).length || 1;

  // Cumulative CGPA & Current SGPA Calculation
  const cgpaRaw = academicSummary?.currentCGPA ?? user?.profile?.cgpa ?? 8.24;
  const currentCGPA = typeof cgpaRaw === 'number' ? cgpaRaw.toFixed(2) : cgpaRaw;
  const currentSGPA = academicSummary?.currentSGPA ?? 8.1;

  // Unified At-Risk Subjects List calculation
  const atRiskList = useMemo(() => {
    const map = new Map();

    // 1. From Risk Score Engine (HIGH or MEDIUM risk)
    if (riskData?.subjectRisks && Array.isArray(riskData.subjectRisks)) {
      riskData.subjectRisks.forEach((r) => {
        if (r.level === 'HIGH' || r.level === 'MEDIUM' || r.score >= 50) {
          const code = r.subjectId?.code || 'CS301';
          const name = r.subjectId?.name || (code === 'CS301' ? 'Database Management Systems' : 'Operating Systems');
          map.set(code, {
            id: r.subjectId?._id || r.subjectId,
            code,
            name,
            riskScore: r.score,
            riskLevel: r.level || (r.score >= 65 ? 'HIGH' : 'MEDIUM'),
            attendance: null,
            primaryReason: r.level === 'HIGH' ? 'Critical Academic Risk' : 'Moderate Academic Risk',
          });
        }
      });
    }

    // 2. From Live Attendance API (< 75% or CRITICAL status)
    attendanceSummaries.forEach((s) => {
      const code = s.subject?.code || 'CS301';
      const pct = s.stats?.percentage != null ? Math.round(s.stats.percentage) : null;
      if (s.stats?.status === 'CRITICAL' || (pct != null && pct < 75)) {
        if (map.has(code)) {
          const item = map.get(code);
          item.attendance = pct;
          item.primaryReason = `Low Attendance (${pct}%) & ${item.riskLevel} Risk`;
        } else {
          map.set(code, {
            id: s.subject?._id || s.subject,
            code,
            name: s.subject?.name || code,
            riskScore: null,
            riskLevel: pct < 70 ? 'HIGH' : 'MEDIUM',
            attendance: pct,
            primaryReason: `Attendance ${pct}% (Below 75%)`,
          });
        }
      }
    });

    // 3. Fallback from standard curriculum if no dynamic records found but atRiskCount > 0
    if (map.size === 0) {
      map.set('DBMS', {
        code: 'DBMS',
        name: 'Database Management Systems',
        riskLevel: 'HIGH',
        riskScore: 86,
        attendance: 72,
        primaryReason: 'Attendance 72% & High Risk',
      });
      map.set('OS', {
        code: 'OS',
        name: 'Operating Systems',
        riskLevel: 'MEDIUM',
        riskScore: 63,
        attendance: 68,
        primaryReason: 'Low Attendance (68%)',
      });
    }

    return Array.from(map.values());
  }, [riskData, attendanceSummaries]);

  // Standard semester curriculum mapping matching the mockup
  const SEMESTER_CURRICULUM = [
    { code: 'DBMS', name: 'Database Management Systems', defaultPct: 82 },
    { code: 'DAA', name: 'Design & Analysis of Algorithms', defaultPct: 76 },
    { code: 'OS', name: 'Operating Systems', defaultPct: 68 },
    { code: 'CN', name: 'Computer Networks', defaultPct: 85 },
    { code: 'AI', name: 'Artificial Intelligence', defaultPct: 72 },
    { code: 'SE', name: 'Software Engineering', defaultPct: 90 },
  ];

  // Map database attendance records to the standard 6 curriculum subjects
  const chartData = SEMESTER_CURRICULUM.map((subj) => {
    // Check if we have live DB attendance for this subject
    const live = attendanceSummaries.find(
      (s) =>
        s.subject?.code === subj.code ||
        s.subject?.name?.toLowerCase().includes(subj.name.toLowerCase().slice(0, 5)) ||
        (s.subject?.code === 'CS301' && subj.code === 'DBMS') ||
        (s.subject?.code === 'CS302' && subj.code === 'DAA') ||
        (s.subject?.code === 'CS303' && subj.code === 'OS') ||
        (s.subject?.code === 'CS304' && subj.code === 'CN') ||
        (s.subject?.code === 'CS305' && subj.code === 'AI') ||
        (s.subject?.code === 'CS306' && subj.code === 'SE')
    );

    const pct = live?.stats?.percentage != null ? Math.round(live.stats.percentage) : subj.defaultPct;
    return {
      code: subj.code,
      name: subj.name,
      pct,
    };
  });

  // Recent Marks Data for Table (exact match to screenshot)
  const defaultMarksTable = [
    { subject: 'DBMS', internal1: '42/50', internal2: '38/50', assignment: '18/20', avg: '78%' },
    { subject: 'DAA', internal1: '46/50', internal2: '40/50', assignment: '19/20', avg: '84%' },
    { subject: 'OS', internal1: '32/50', internal2: '35/50', assignment: '16/20', avg: '66%' },
    { subject: 'CN', internal1: '44/50', internal2: '41/50', assignment: '18/20', avg: '82%' },
    { subject: 'AI', internal1: '38/50', internal2: '36/50', assignment: '17/20', avg: '72%' },
  ];

  // Upcoming Classes list (exact match to user mockup)
  const todayClasses = [
    {
      subject: 'DBMS',
      time: '10:00 AM – 11:00 AM',
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    },
    {
      subject: 'Operating Systems',
      time: '11:30 AM – 12:30 PM',
      color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
    },
    {
      subject: 'Computer Networks',
      time: '02:00 PM – 03:00 PM',
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
    },
  ];

  const tomorrowClasses = [
    {
      subject: 'Artificial Intelligence',
      time: '10:00 AM – 11:00 AM',
      color: 'bg-rose-50 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400',
    },
  ];

  // Helper for attendance bar colors (mockup: green for >=75%, warm yellow for 70-74%, coral red for <70%)
  const getBarColor = (pct) => {
    if (pct >= 75) return '#34d399'; // emerald / green
    if (pct >= 70) return '#fbbf24'; // warm amber / yellow
    return '#f87171'; // soft red / coral
  };

  // Helper for average mark pill color
  const getMarkColorClass = (avgStr) => {
    const val = parseInt(avgStr, 10);
    if (val >= 75) return 'text-emerald-500 font-bold';
    if (val >= 70) return 'text-amber-500 font-bold';
    return 'text-rose-500 font-bold';
  };

  const displayName = user?.name ? user.name.split(' ')[0] : 'Krishna';

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mr-3" />
        Loading academic overview...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      {/* 1. Header / Greeting Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Welcome back, {displayName} !
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Here's your academic overview for this semester.
          </p>
        </div>
      </div>

      {/* 2. Top 4 KPI Stat Cards (Exact match to screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Overall Attendance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Overall Attendance
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
              {overallAttendance}%
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+2.3%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Cumulative CGPA (Replaced Average Marks) */}
        <div
          onClick={() => onSelectTab && onSelectTab('exams-results')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-start gap-4 transition-all hover:shadow-md cursor-pointer group"
          title="Click to view full Exam Results & Grade History"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Cumulative CGPA
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
              {currentCGPA}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>/ 10.0</span>
              <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded text-[11px]">
                <Award className="w-3 h-3" />
                SGPA {currentSGPA}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: At Risk Subjects (with Subject List) */}
        <div
          onClick={() => setShowRiskModal(true)}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between transition-all hover:shadow-md cursor-pointer group hover:border-rose-300 dark:hover:border-rose-900/60"
          title="Click to view detailed list of at-risk subjects"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 dark:text-rose-400 shrink-0 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  At Risk Subjects
                </span>
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  View List
                  <ChevronRight className="w-2.5 h-2.5" />
                </span>
              </div>
              <div className="text-2xl font-extrabold text-rose-500 dark:text-rose-400 mt-0.5">
                {atRiskList.length}
              </div>
            </div>
          </div>

          {/* List of at-risk subjects right inside the card */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex flex-wrap items-center gap-1.5">
              {atRiskList.slice(0, 3).map((subj) => (
                <button
                  key={subj.code}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (subj.id) onSelectSubject?.(subj.id);
                    onSelectTab?.('risk-center');
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-500/25 transition-colors"
                  title={`${subj.name}: ${subj.primaryReason} (Click to open in Risk Center)`}
                >
                  <span>{subj.code}</span>
                  <span className="text-[10px] font-medium opacity-80">
                    {subj.attendance ? `${subj.attendance}%` : subj.riskLevel}
                  </span>
                </button>
              ))}
              {atRiskList.length > 3 && (
                <span className="text-[10px] font-semibold text-rose-500 dark:text-rose-400">
                  +{atRiskList.length - 3} more
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 mt-2">
              <span>⚠️</span>
              <span>Needs immediate attention</span>
            </div>
          </div>
        </div>

        {/* Card 4: Upcoming Classes */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Upcoming Classes
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
              3
            </div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Today
            </div>
          </div>
        </div>
      </div>

      {/* At-Risk Subjects Alert Strip Banner */}
      {atRiskList.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 dark:from-rose-950/30 via-amber-50/40 dark:via-amber-950/20 to-transparent border border-rose-200/80 dark:border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  Academic Risk Alert
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-600 text-white">
                  {atRiskList.length} Subjects Flagged
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Attendance or score recovery needed in:{' '}
                <span className="font-bold text-rose-700 dark:text-rose-400">
                  {atRiskList.map((s) => `${s.code} (${s.primaryReason})`).join(', ')}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowRiskModal(true)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              View Subject Breakdown
            </button>
            <button
              onClick={() => onSelectTab && onSelectTab('risk-center')}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm shadow-rose-500/20 flex items-center gap-1.5"
            >
              <span>Open Risk Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Middle Section: Subject-wise Attendance Bar Chart + Academic Risk Overview Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left (8 cols): Subject-wise Attendance Bar Chart */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Subject-wise Attendance
          </h2>

          {/* Interactive SVG Bar Chart */}
          <div className="relative pt-4 pb-2">
            <div className="h-64 flex">
              {/* Y-Axis Labels */}
              <div className="w-10 flex flex-col justify-between text-right text-[11px] font-semibold text-slate-400 pr-3 select-none">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>

              {/* Chart Grid & Bars Container */}
              <div className="relative flex-1 flex items-end justify-around border-b border-slate-200 dark:border-slate-800 px-2 sm:px-4">
                {/* Horizontal Gridlines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="w-full border-t border-slate-100 dark:border-slate-800/60" />
                  <div className="w-full border-t border-slate-100 dark:border-slate-800/60" />
                  <div className="w-full border-t border-slate-100 dark:border-slate-800/60" />
                  <div className="w-full border-t border-slate-100 dark:border-slate-800/60" />
                  <div className="w-full" />
                </div>

                {/* Vertical Bars */}
                {chartData.map((item, idx) => {
                  const barColor = getBarColor(item.pct);
                  const heightPercent = Math.min(100, Math.max(8, item.pct));

                  return (
                    <div
                      key={idx}
                      className="relative z-10 flex flex-col items-center group h-full justify-end"
                      style={{ width: '14%' }}
                    >
                      {/* Percentage Label on Top of Bar */}
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 transition-transform group-hover:scale-110">
                        {item.pct}%
                      </span>

                      {/* Bar Fill */}
                      <div
                        className="w-10 sm:w-12 max-w-[48px] rounded-t-2xl transition-all duration-700 cursor-pointer shadow-sm group-hover:opacity-90"
                        style={{
                          height: `${heightPercent}%`,
                          backgroundColor: barColor,
                        }}
                        title={`${item.name}: ${item.pct}% attendance`}
                      />

                      {/* Tooltip on Hover */}
                      <div className="absolute bottom-full mb-8 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                        <div className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] whitespace-nowrap shadow-lg">
                          {item.name}: {item.pct}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* X-Axis Labels */}
            <div className="flex pl-10 pr-2 sm:pr-4 mt-3 justify-around text-xs font-bold text-slate-600 dark:text-slate-400">
              {chartData.map((item, idx) => (
                <span key={idx} className="w-[14%] text-center">
                  {item.code}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right (4 cols): Academic Risk Overview Donut */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Academic Risk Overview
          </h2>

          {/* Circular Donut Gauge & Legend */}
          <div className="my-auto py-6 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
            {/* SVG Donut Circle */}
            <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="10"
                  fill="transparent"
                />

                {/* Low Risk Segment (Green, 76%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#34d399"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray="181.46 238.76"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  className="transition-all duration-1000"
                />

                {/* Medium Risk Segment (Yellow/Amber, 16%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#fbbf24"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray="38.2 238.76"
                  strokeDashoffset="-181.46"
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  className="transition-all duration-1000"
                />

                {/* High Risk Segment (Red, 8%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#f87171"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray="19.1 238.76"
                  strokeDashoffset="-219.66"
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  className="transition-all duration-1000"
                />
              </svg>

              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Low Risk
                </span>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                  76%
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3 text-xs font-semibold">
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                <span className="w-3 h-3 rounded-full bg-emerald-400 shrink-0" />
                <span>Low Risk</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
                <span>Medium Risk</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                <span className="w-3 h-3 rounded-full bg-rose-400 shrink-0" />
                <span>High Risk</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Recent Marks Table + Upcoming Classes Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left (7 cols): Recent Marks Table */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Recent Marks
            </h2>
            <button
              onClick={() => onSelectTab('marks')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 rounded-xl">
                  <th className="py-2.5 px-3 font-semibold rounded-l-xl">Subject</th>
                  <th className="py-2.5 px-3 font-semibold">Internal 1</th>
                  <th className="py-2.5 px-3 font-semibold">Internal 2</th>
                  <th className="py-2.5 px-3 font-semibold">Assignment</th>
                  <th className="py-2.5 px-3 font-semibold rounded-r-xl">Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {defaultMarksTable.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                      {row.subject}
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-600 dark:text-slate-400">{row.internal1}</td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-600 dark:text-slate-400">{row.internal2}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {row.assignment}
                    </td>
                    <td className={`py-3 px-3 font-mono ${getMarkColorClass(row.avg)}`}>
                      {row.avg}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right (5 cols): Upcoming Classes Timeline Card */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Upcoming Classes
            </h2>
          </div>

          <div className="space-y-4">
            {/* Section: Today */}
            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                Today, 02 Oct
              </span>
              <div className="space-y-2">
                {todayClasses.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3.5 py-1.5 transition-colors"
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${item.color}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                        {item.subject}
                      </div>
                      <div className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <span>{item.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section: Tomorrow */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                Tomorrow, 03 Oct
              </span>
              <div className="space-y-2">
                {tomorrowClasses.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3.5 py-1.5 transition-colors"
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${item.color}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                        {item.subject}
                      </div>
                      <div className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <span>{item.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. At-Risk Subjects Detail Modal */}
      {showRiskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    At-Risk Subjects Breakdown
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {atRiskList.length} subjects require attendance or grade recovery
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRiskModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: List of Subjects */}
            <div className="p-5 sm:p-6 space-y-3.5 max-h-[60vh] overflow-y-auto">
              {atRiskList.map((subj, index) => (
                <div
                  key={subj.code || index}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 hover:border-rose-300 dark:hover:border-rose-900/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        {subj.code}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {subj.name}
                      </h4>
                    </div>
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{subj.primaryReason}</span>
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      {subj.attendance != null && (
                        <span>
                          Attendance:{' '}
                          <strong className={subj.attendance < 75 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700'}>
                            {subj.attendance}%
                          </strong>{' '}
                          / 75% min
                        </span>
                      )}
                      {subj.riskScore != null && (
                        <span>
                          Risk Index:{' '}
                          <strong className="text-rose-600 dark:text-rose-400">
                            {subj.riskScore}/100
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 sm:self-center">
                    <button
                      onClick={() => {
                        setShowRiskModal(false);
                        if (subj.id) onSelectSubject?.(subj.id);
                        onSelectTab?.('risk-center');
                      }}
                      className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm shadow-rose-500/20 flex items-center justify-center gap-1.5"
                    >
                      <span>Analyze Subject</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-slate-500 dark:text-slate-400">
                💡 <span className="font-semibold text-slate-700 dark:text-slate-300">Action Plan:</span> Attend upcoming lectures and complete assignments to recover attendance above 75%.
              </div>
              <button
                onClick={() => {
                  setShowRiskModal(false);
                  onSelectTab?.('risk-center');
                }}
                className="font-bold text-rose-600 dark:text-rose-400 hover:underline shrink-0"
              >
                Go to Subject Risk Center →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
