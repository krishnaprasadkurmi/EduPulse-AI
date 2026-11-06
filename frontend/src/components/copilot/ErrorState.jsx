import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({ error, onRetry }) {
  if (!error) return null;

  return (
    <div className="my-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="font-bold text-[11px] uppercase tracking-wider mb-0.5">Error</div>
        <p className="text-[11px] leading-relaxed text-rose-800 dark:text-rose-200">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-colors text-[10px]"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        )}
      </div>
    </div>
  );
}
