import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi } from '../../api/adminApi';
import { ShieldAlert, AlertTriangle, Mail, ArrowRight, UserCheck, Search } from 'lucide-react';

export default function AtRiskStudents() {
  const { user } = useAuth();
  const [riskList, setRiskList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRisk = async () => {
      try {
        setLoading(true);
        const res = await adminApi.getRiskMonitor();
        if (res.success) {
          setRiskList(res.data || []);
        }
      } catch (err) {
        console.error('Error fetching risk students:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRisk();
  }, [user]);

  const filtered = riskList.filter((item) => {
    const studentName = item.studentId?.userId?.name || '';
    const subjectName = item.subjectId?.name || '';
    const matchesSearch =
      studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subjectName.toLowerCase().includes(searchQuery.toLowerCase());

    if (levelFilter === 'ALL') return matchesSearch;
    return matchesSearch && item.level === levelFilter;
  });

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mr-3" />
        Scanning academic signals for at-risk student cohorts...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-slate-800 shadow-md">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold mb-2 border border-rose-500/30">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Early Warning Intervention System
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">At-Risk Students Roster</h1>
        <p className="text-xs text-slate-300 mt-1">
          Proactive student identification based on declining attendance trajectories and assessment scores.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search student or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                levelFilter === lvl
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:text-slate-200'
              }`}
            >
              {lvl} Risk
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Student Risk Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const isHigh = item.level === 'HIGH';
          const isMed = item.level === 'MEDIUM';

          return (
            <div
              key={item._id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between shadow-sm ${
                isHigh
                  ? 'border-rose-300 bg-rose-50/50 dark:border-rose-500/40 dark:bg-rose-950/10'
                  : isMed
                  ? 'border-amber-300 bg-amber-50/40 dark:border-amber-500/30 dark:bg-slate-900/60'
                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                    {item.subjectId?.code || 'CS301'}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      isHigh
                        ? 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                        : isMed
                        ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                    }`}
                  >
                    {item.level} ({item.score}/100)
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {item.studentId?.userId?.name || 'Student Name'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ID: {item.studentId?.studentId || 'STU2024'} • {item.subjectId?.name}
                </p>

                {/* Primary Factor */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                    Primary Driver:
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                    {item.insights?.[0] || 'Multiple academic risk indicators.'}
                  </p>
                </div>

                {/* Recommendation */}
                <div className="mt-3 text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-1.5">
                  <span>💡</span>
                  <span className="line-clamp-2">
                    {item.recommendations?.[0] || 'Schedule an academic review meeting.'}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <a
                  href={`mailto:${item.studentId?.userId?.email || 'student@edupulse.edu'}`}
                  className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Contact Student</span>
                </a>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(item.calculatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
