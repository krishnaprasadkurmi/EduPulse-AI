import React from 'react';
import { Database, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function ToolActionPreview({ toolName, isSuccess = true }) {
  if (!toolName) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 text-[10px] font-mono text-indigo-700 dark:text-indigo-300 my-1">
      <Database className="w-3 h-3 text-indigo-500" />
      <span>Tool Executed: {toolName}</span>
      {isSuccess && <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-0.5" />}
    </div>
  );
}
