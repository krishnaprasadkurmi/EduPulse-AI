import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { riskApi } from '../../api/riskApi';
import { attendanceApi } from '../../api/attendanceApi';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  TrendingDown,
  CheckCircle2,
  CalendarCheck,
  Award,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

export default function SubjectRiskCenter({ selectedSubjectId }) {
  const { user } = useAuth();
  const [subjectRisks, setSubjectRisks] = useState([]);
  const [activeSubjectId, setActiveSubjectId] = useState(selectedSubjectId || null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [recalcSuccess, setRecalcSuccess] = useState(false);

  const studentId = user?.profile?._id || user?.id;

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await riskApi.getStudentRisk(studentId);
      if (res.success) {
        const risks = res.data.subjectRisks || [];
        setSubjectRisks(risks);
        if (!activeSubjectId && risks.length > 0) {
          // Default to highest risk subject (e.g. DBMS)
          setActiveSubjectId(selectedSubjectId || risks[0]?.subjectId?._id);
        }
      }
    } catch (err) {
      console.error('Failed to load risk center:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) loadData();
  }, [studentId, selectedSubjectId]);

  const activeRisk = subjectRisks.find(
    (r) => (r.subjectId?._id || r.subjectId) === activeSubjectId
  ) || subjectRisks[0];

  const handleRecalculate = async () => {
    if (!activeRisk) return;
    try {
      setRecalculating(true);
      const res = await riskApi.recalculateRisk(studentId, activeRisk.subjectId._id);
      if (res.success) {
        setRecalcSuccess(true);
        setTimeout(() => setRecalcSuccess(false), 3000);
        await loadData();
      }
    } catch (err) {
      console.error('Recalculation error:', err);
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mr-3" />
        Analyzing academic risk factors & recommendations...
      </div>
    );
  }

  const factorConfig = [
    { key: 'attendance', name: 'Attendance Rate', weight: '25%', icon: CalendarCheck, desc: 'Class presence vs 75% threshold' },
    { key: 'assessment', name: 'Assessment Scores', weight: '30%', icon: Award, desc: 'Test & exam normalized performance' },
    { key: 'assignment', name: 'Assignment Completion', weight: '15%', icon: Layers, desc: 'Problem sets & lab project submissions' },
    { key: 'previousPerformance', name: 'Academic Baseline (CGPA)', weight: '15%', icon: ShieldCheck, desc: 'Historical academic momentum' },
    { key: 'recentTrend', name: 'Recent Trajectory', weight: '15%', icon: TrendingDown, desc: 'Velocity of recent test & attendance changes' },
  ];

  const isHigh = activeRisk?.level === 'HIGH';
  const isMed = activeRisk?.level === 'MEDIUM';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Explainable Risk Intelligence Engine
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Subject Risk Center</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Transparent breakdown of why a subject is risky and recommended intervention actions.
          </p>
        </div>

        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
          <span>{recalculating ? 'Recalculating Signals...' : 'Recalculate Risk'}</span>
        </button>
      </div>

      {recalcSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Risk metrics successfully recalculated with latest assessment & attendance data!</span>
        </div>
      )}

      {/* Course Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {subjectRisks.map((item) => {
          const sub = item.subjectId;
          const isActive = (sub?._id || sub) === activeSubjectId;
          const level = item.level;

          return (
            <button
              key={sub?._id || sub}
              onClick={() => setActiveSubjectId(sub?._id || sub)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-2 border ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-200 border-indigo-300 dark:border-indigo-500/50 shadow-sm font-bold'
                  : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{sub?.code || 'CS301'}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  level === 'HIGH'
                    ? 'bg-rose-500'
                    : level === 'MEDIUM'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
              />
            </button>
          );
        })}
      </div>

      {activeRisk ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Risk Meter & Summary */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-semibold">
                <span>{activeRisk.subjectId?.code}</span>
                <span className="font-mono text-[11px]">Semester 5</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {activeRisk.subjectId?.name}
              </h2>

              {/* Huge Risk Meter */}
              <div className="mt-8 text-center">
                <div className="relative inline-flex items-center justify-center">
                  {/* Gauge Ring */}
                  <div
                    className={`w-40 h-40 rounded-full border-8 flex flex-col items-center justify-center transition-all ${
                      isHigh
                        ? 'border-rose-500/80 bg-rose-50 dark:bg-rose-950/20'
                        : isMed
                        ? 'border-amber-500/80 bg-amber-50 dark:bg-amber-950/20'
                        : 'border-emerald-500/80 bg-emerald-50 dark:bg-emerald-950/20'
                    }`}
                  >
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">
                      {activeRisk.score}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/ 100</span>
                    <span
                      className={`text-[10px] font-bold uppercase mt-1 px-2 py-0.5 rounded-full ${
                        isHigh
                          ? 'bg-rose-500 text-white'
                          : isMed
                          ? 'bg-amber-500 text-slate-900'
                          : 'bg-emerald-500 text-slate-900'
                      }`}
                    >
                      {activeRisk.level} Risk
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-6 leading-relaxed max-w-xs mx-auto font-medium">
                  {isHigh
                    ? 'Immediate academic intervention required. Key signals show imminent danger of course failure or exam debarment.'
                    : isMed
                    ? 'Moderate risk detected. Performance is bordering thresholds and requires targeted attention.'
                    : 'Academic risk is low. Maintain current attendance and assignment submission standards.'}
                </p>
              </div>
            </div>

            {/* Threshold Legend */}
            <div className="mt-8 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1.5">
              <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Standard Risk Scales:</div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>0 – 34: Low Academic Risk</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Safe</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>35 – 64: Moderate Risk</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">Caution</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>65 – 100: High Academic Risk</span>
                <span className="text-rose-600 dark:text-rose-400 font-semibold">Critical</span>
              </div>
            </div>
          </div>

          {/* Right Column (2 cols wide): Explainable Contributing Drivers & Recommendations */}
          <div className="lg:col-span-2 space-y-6">
            {/* Normalized Contributing Factors Breakdown */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>5-Signal Normalized Contribution Breakdown</span>
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium">Normalized (0 - 100)</span>
              </div>

              <div className="space-y-4">
                {factorConfig.map((factor) => {
                  const Icon = factor.icon;
                  const factorValue = activeRisk.factors?.[factor.key] ?? 30;
                  const isConcern = factorValue >= 50;

                  return (
                    <div key={factor.key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{factor.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            (Weight: {factor.weight})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold ${
                              isConcern ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {factorValue} / 100
                          </span>
                          <span className="text-[10px] text-slate-400">risk contribution</span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            factorValue >= 70
                              ? 'bg-rose-500'
                              : factorValue >= 40
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, factorValue))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Contributing Factors (Explainability) */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-amber-500" />
                <span>Explainable Diagnostic Drivers</span>
              </h3>
              <div className="space-y-2.5">
                {activeRisk.insights && activeRisk.insights.length > 0 ? (
                  activeRisk.insights.map((insight, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 flex items-start gap-3"
                    >
                      <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{insight}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">All academic signals are compliant.</p>
                )}
              </div>
            </div>

            {/* Actionable Recommendations */}
            <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 shadow-sm">
              <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>AI Actionable Recommendations</span>
              </h3>
              <div className="space-y-2.5">
                {activeRisk.recommendations && activeRisk.recommendations.length > 0 ? (
                  activeRisk.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 flex items-start gap-3 shadow-xs"
                    >
                      <span className="text-indigo-600 dark:text-indigo-400 text-sm">👉</span>
                      <p className="text-xs text-indigo-950 dark:text-indigo-100 font-medium leading-relaxed">{rec}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-indigo-700 dark:text-indigo-300">Maintain steady attendance and performance.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-400">No subject selected.</div>
      )}
    </div>
  );
}
