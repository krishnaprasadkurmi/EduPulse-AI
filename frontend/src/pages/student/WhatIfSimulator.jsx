import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { attendanceApi } from '../../api/attendanceApi';
import {
  Calculator,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
} from 'lucide-react';

export default function WhatIfSimulator() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [simulateAttend, setSimulateAttend] = useState(5);
  const [simulateMiss, setSimulateMiss] = useState(0);
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
            // Find critical subject first (e.g. DBMS)
            const crit = sums.find((s) => s.stats.status === 'CRITICAL' || s.stats.percentage < 75);
            setSelectedSubjectId(crit ? crit.subject._id : sums[0].subject._id);
          }
        }
      } catch (err) {
        console.error('Error in what-if fetch:', err);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) fetchAttendance();
  }, [studentId]);

  const active = summaries.find((s) => s.subject._id === selectedSubjectId) || summaries[0];

  // Calculate live what-if simulation client-side with 100% responsiveness
  const currentAttended = active?.stats?.attendedClasses || 18;
  const currentConducted = active?.stats?.totalClasses || 25;
  const currentPercentage = active?.stats?.percentage || 72.0;

  const simConducted = currentConducted + simulateAttend + simulateMiss;
  const simAttended = currentAttended + simulateAttend;
  const simPercentage = simConducted > 0 ? Number(((simAttended / simConducted) * 100).toFixed(1)) : 100;

  const percentageDelta = Number((simPercentage - currentPercentage).toFixed(1));

  let simStatus = 'SAFE';
  if (simPercentage < 75) {
    simStatus = 'CRITICAL';
  } else if (simPercentage <= 80) {
    simStatus = 'WARNING';
  }

  const handleReset = () => {
    setSimulateAttend(active?.stats?.requiredClassesToReach75 || 5);
    setSimulateMiss(0);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mr-3" />
        Preparing What-If Attendance Engine...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            <Calculator className="w-3.5 h-3.5" /> Interactive Trajectory Simulator
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">What-If Attendance Simulator</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Simulate attending or missing upcoming lectures to project your compliance standing in real time.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-200 dark:border-slate-700"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Simulation</span>
        </button>
      </div>

      {/* Subject Pill Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {summaries.map(({ subject, stats }) => {
          const isActive = subject._id === selectedSubjectId;
          const isCritical = stats.status === 'CRITICAL';
          const isWarning = stats.status === 'WARNING';

          return (
            <button
              key={subject._id}
              onClick={() => {
                setSelectedSubjectId(subject._id);
                setSimulateAttend(stats.requiredClassesToReach75 || 3);
                setSimulateMiss(0);
              }}
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

      {active && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
              <div>
                <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                  {active.subject.code}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">
                  {active.subject.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Baseline: {currentAttended} / {currentConducted} classes attended ({currentPercentage}%)
                </p>
              </div>

              {/* Slider 1: Classes to Attend */}
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" /> Simulate Attending Upcoming Classes
                  </span>
                  <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-300">
                    +{simulateAttend}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={simulateAttend}
                  onChange={(e) => setSimulateAttend(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span>0 classes</span>
                  <span>10 classes</span>
                  <span>20 classes</span>
                </div>
              </div>

              {/* Slider 2: Classes to Miss */}
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4" /> Simulate Missing Upcoming Classes
                  </span>
                  <span className="font-mono text-base font-bold text-rose-600 dark:text-rose-300">
                    +{simulateMiss}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={simulateMiss}
                  onChange={(e) => setSimulateMiss(parseInt(e.target.value, 10))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span>0 classes</span>
                  <span>7 classes</span>
                  <span>15 classes</span>
                </div>
              </div>

              {/* Fast Scenario Presets */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quick Test Scenarios:</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSimulateAttend(active.stats.requiredClassesToReach75 || 5);
                      setSimulateMiss(0);
                    }}
                    className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold text-left transition-colors"
                  >
                    🚀 Reach 75% (+{active.stats.requiredClassesToReach75 || 5} attend)
                  </button>
                  <button
                    onClick={() => {
                      setSimulateAttend(10);
                      setSimulateMiss(0);
                    }}
                    className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold text-left transition-colors"
                  >
                    ⭐ Perfect 10 (+10 attend)
                  </button>
                  <button
                    onClick={() => {
                      setSimulateAttend(0);
                      setSimulateMiss(3);
                    }}
                    className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-[11px] text-rose-700 dark:text-rose-300 font-semibold text-left transition-colors"
                  >
                    ⚠️ Skip Next 3 (+3 miss)
                  </button>
                  <button
                    onClick={() => {
                      setSimulateAttend(4);
                      setSimulateMiss(2);
                    }}
                    className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-[11px] text-amber-700 dark:text-amber-300 font-semibold text-left transition-colors"
                  >
                    ⚖️ Mixed (+4 att, +2 miss)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Projection Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Simulated Outcome & Compliance Shift</span>
                </h3>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold uppercase transition-all ${
                    simStatus === 'CRITICAL'
                      ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                      : simStatus === 'WARNING'
                      ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                      : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                  }`}
                >
                  {simStatus} Standing
                </span>
              </div>

              {/* Big Comparative Display */}
              <div className="grid grid-cols-2 gap-4 p-5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Current Actual Standing</div>
                  <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-200 mt-1">
                    {currentPercentage}%
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {currentAttended} / {currentConducted} classes
                  </div>
                </div>

                <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Simulated Trajectory</div>
                  <div
                    className={`text-3xl font-extrabold mt-1 ${
                      simPercentage >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {simPercentage}%
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <span className="font-semibold">{simAttended} / {simConducted} classes</span>
                    <span
                      className={`font-bold ml-1 ${
                        percentageDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      ({percentageDelta >= 0 ? `+${percentageDelta}%` : `${percentageDelta}%`})
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar Comparison */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">Attendance Progress</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Target: 75.0% Mandatory</span>
                </div>
                <div className="relative w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  {/* 75% Marker Line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-900 dark:bg-white z-10"
                    style={{ left: '75%' }}
                    title="75% Mandatory Threshold"
                  />
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      simPercentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, simPercentage)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  <span>0%</span>
                  <span className="text-slate-800 dark:text-white font-bold">75% Threshold</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Dynamic Analysis Message */}
              <div
                className={`p-4 rounded-xl border text-xs leading-relaxed ${
                  simPercentage >= 75 && currentPercentage < 75
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-500/40 dark:text-emerald-200'
                    : simPercentage < 75
                    ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-500/40 dark:text-rose-200'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-950/40 dark:border-indigo-500/40 dark:text-indigo-200'
                }`}
              >
                {simPercentage >= 75 && currentPercentage < 75 ? (
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <strong className="block text-emerald-800 dark:text-emerald-300 font-bold mb-1">
                        Recovery Target Achieved!
                      </strong>
                      By attending the next {simulateAttend} lectures without absences, your attendance rises from {currentPercentage}% to {simPercentage}%, successfully clearing the university examination requirement!
                    </div>
                  </div>
                ) : simPercentage < 75 ? (
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <div>
                      <strong className="block text-rose-800 dark:text-rose-300 font-bold mb-1">
                        Below Required 75% Threshold
                      </strong>
                      With this schedule ({simulateAttend} attended, {simulateMiss} missed), your projected attendance is {simPercentage}%. You remain at risk of exam debarment. Increase your upcoming attendance.
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div>
                      <strong className="block text-indigo-800 dark:text-indigo-300 font-bold mb-1">
                        Attendance In Safe Standing
                      </strong>
                      Projected attendance is {simPercentage}%. You have headroom to maintain compliance throughout the remaining semester.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
