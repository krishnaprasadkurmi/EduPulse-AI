import React from 'react';
import { AlertCircle, Check, X, ShieldAlert } from 'lucide-react';

export default function ConfirmationCard({ action, onConfirm, onCancel, isProcessing }) {
  if (!action) return null;

  const {
    studentName,
    subject,
    assessmentName,
    currentScore,
    newScore,
    maxScore,
    status,
    type,
  } = action;

  return (
    <div className="my-3 p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-xs shadow-md animate-in fade-in zoom-in-95">
      <div className="flex items-start gap-2.5 mb-3">
        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-amber-900 dark:text-amber-200 text-xs uppercase tracking-wider">
            Write Confirmation Required
          </div>
          <div className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed mt-0.5">
            This action will modify live institutional academic records, notify the student, and recalculate risk index.
          </div>
        </div>
      </div>

      {/* Action Details Grid */}
      <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-3 border border-amber-500/20 space-y-1.5 mb-3">
        {studentName && (
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">Target Student:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{studentName}</span>
          </div>
        )}
        {subject && (
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">Subject:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{subject}</span>
          </div>
        )}
        {assessmentName && (
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">Assessment:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{assessmentName}</span>
          </div>
        )}

        {type === 'UPDATE_MARK' && (
          <div className="pt-1.5 mt-1 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Mark Adjustment:</span>
            <div className="flex items-center gap-2 font-mono font-bold">
              <span className="text-slate-400 line-through">{currentScore}/{maxScore}</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-sm">→ {newScore}/{maxScore}</span>
            </div>
          </div>
        )}

        {type === 'CREATE_MARK' && (
          <div className="pt-1.5 mt-1 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">New Score:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {newScore}/{maxScore}
            </span>
          </div>
        )}

        {type === 'RECORD_ATTENDANCE' && (
          <div className="pt-1.5 mt-1 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Attendance Status:</span>
            <span className={`font-bold px-2 py-0.5 rounded uppercase text-[10px] ${
              status === 'present'
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
            }`}>
              {status}
            </span>
          </div>
        )}
      </div>

      {/* Confirmation Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onConfirm}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-3.5 h-3.5" />
          <span>{isProcessing ? 'Writing to DB...' : 'Confirm & Apply'}</span>
        </button>

        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-all disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
