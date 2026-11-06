import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { FileCheck2, Filter, RefreshCw, UserCheck, Shield, Mic, CheckCircle2 } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAuditLogs(actionFilter ? { action: actionFilter } : {});
      if (res.success) {
        setLogs(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const getActionBadge = (action) => {
    switch (action) {
      case 'VOICE_CREATE_MARK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30">
            <Mic className="w-3 h-3 text-violet-400" /> Voice Mark Entry
          </span>
        );
      case 'CREATE_MARK':
      case 'UPDATE_MARK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Gradebook Revision
          </span>
        );
      case 'RECORD_ATTENDANCE':
      case 'UPDATE_ATTENDANCE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Attendance Event
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-slate-800 text-slate-300">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/30">
            <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" /> Immutable Audit & Governance Trail
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Audit Logs</h1>
          <p className="text-xs text-slate-300 mt-1">
            Complete cryptographic event ledger of all mark entries, attendance modifications, and actor authorizations.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 border border-slate-600 transition-colors shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { label: 'All Events', val: '' },
          { label: 'Voice Mark Entries', val: 'VOICE_CREATE_MARK' },
          { label: 'Manual Mark Updates', val: 'UPDATE_MARK' },
          { label: 'Attendance Records', val: 'RECORD_ATTENDANCE' },
        ].map((f) => (
          <button
            key={f.val}
            onClick={() => setActionFilter(f.val)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all border cursor-pointer ${
              actionFilter === f.val
                ? 'bg-indigo-50 border-indigo-400 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-500 dark:text-indigo-200 shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Audit Log Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="pb-3 font-semibold">Timestamp</th>
                <th className="pb-3 font-semibold">Actor / Faculty</th>
                <th className="pb-3 font-semibold">Action Type</th>
                <th className="pb-3 font-semibold">Entity</th>
                <th className="pb-3 font-semibold">Metadata / Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="py-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {log.actorId?.name || 'Authorized System User'}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                        {log.actorId?.role || 'Staff'}
                      </span>
                    </td>

                    <td className="py-3">{getActionBadge(log.action)}</td>

                    <td className="py-3 font-mono text-[11px] font-semibold text-indigo-600 dark:text-indigo-300">
                      {log.entityType}
                    </td>

                    <td className="py-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {JSON.stringify(log.metadata || log.after || {})}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">
                    No matching audit records in ledger.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
