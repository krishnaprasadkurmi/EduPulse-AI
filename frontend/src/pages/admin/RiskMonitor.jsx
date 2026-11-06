import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { ShieldAlert, AlertTriangle, ShieldCheck, Search, Filter, Layers, ArrowUpRight } from 'lucide-react';

export default function RiskMonitor() {
  const [riskScores, setRiskScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [activeItem, setActiveItem] = useState(null);

  useEffect(() => {
    const fetchRisk = async () => {
      try {
        setLoading(true);
        const res = await adminApi.getRiskMonitor();
        if (res.success) {
          setRiskScores(res.data || []);
        }
      } catch (err) {
        console.error('Error fetching risk monitor:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRisk();
  }, []);

  const filtered = riskScores.filter((r) => {
    const sName = r.studentId?.userId?.name || '';
    const cName = r.subjectId?.name || '';
    const cCode = r.subjectId?.code || '';
    const matchesSearch =
      sName.toLowerCase().includes(search.toLowerCase()) ||
      cName.toLowerCase().includes(search.toLowerCase()) ||
      cCode.toLowerCase().includes(search.toLowerCase());

    if (levelFilter === 'ALL') return matchesSearch;
    return matchesSearch && r.level === levelFilter;
  });

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mr-3" />
        Loading university-wide academic risk telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-md">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold mb-2 border border-rose-500/30">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> University Risk Monitor & Diagnostic Center
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Campus Risk Monitor</h1>
        <p className="text-xs text-slate-300 mt-1">
          Complete cross-cohort visibility into academic vulnerability, attendance drops, and assessment deviations.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search student, subject, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                levelFilter === lvl
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:text-slate-200'
              }`}
            >
              {lvl} ({riskScores.filter((r) => lvl === 'ALL' || r.level === lvl).length})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="pb-3 font-semibold">Student</th>
                <th className="pb-3 font-semibold">Subject / Course</th>
                <th className="pb-3 font-semibold">Risk Level</th>
                <th className="pb-3 font-semibold">Index Score</th>
                <th className="pb-3 font-semibold">Top Diagnostic Insight</th>
                <th className="pb-3 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {filtered.map((item) => {
                const isHigh = item.level === 'HIGH';
                const isMed = item.level === 'MEDIUM';

                return (
                  <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {item.studentId?.userId?.name || 'Student'}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        {item.studentId?.studentId} • CGPA {item.studentId?.cgpa}
                      </div>
                    </td>

                    <td className="py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-200">
                        {item.subjectId?.name || 'Subject'}
                      </div>
                      <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        {item.subjectId?.code}
                      </span>
                    </td>

                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                          isHigh
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : isMed
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {item.level}
                      </span>
                    </td>

                    <td className="py-3.5 font-mono text-sm font-bold">
                      <span className={isHigh ? 'text-rose-400' : isMed ? 'text-amber-400' : 'text-emerald-400'}>
                        {item.score}
                      </span>
                      <span className="text-slate-500 text-xs font-normal"> / 100</span>
                    </td>

                    <td className="py-3.5 max-w-xs text-slate-400 truncate">
                      {item.insights?.[0] || 'Nominal telemetry signals.'}
                    </td>

                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => setActiveItem(item)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-[11px] transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drill-down Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setActiveItem(null)}
          />
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 z-10 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-400">
                  {activeItem.subjectId?.code}
                </span>
                <h3 className="text-lg font-bold text-slate-100">
                  {activeItem.studentId?.userId?.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {activeItem.subjectId?.name} • Risk Score: {activeItem.score}/100 ({activeItem.level})
                </p>
              </div>
              <button
                onClick={() => setActiveItem(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300">Normalized Factor Contributions:</h4>
              <div className="space-y-2 text-xs">
                {Object.entries(activeItem.factors || {}).map(([k, val]) => (
                  <div key={k} className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="capitalize text-slate-400">{k} Risk:</span>
                    <span className="font-mono font-bold text-slate-200">{val} / 100</span>
                  </div>
                ))}
              </div>

              <h4 className="text-xs font-bold text-slate-300 pt-2">Diagnostic Insights:</h4>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {activeItem.insights?.map((ins, i) => (
                  <li key={i}>{ins}</li>
                ))}
              </ul>

              <h4 className="text-xs font-bold text-indigo-300 pt-2">Prescribed Actions:</h4>
              <ul className="space-y-1.5 text-xs text-indigo-200 list-disc list-inside">
                {activeItem.recommendations?.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
