import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function SuggestedPrompts({ role, onSelectPrompt }) {
  const studentPrompts = [
    'What is my DBMS attendance?',
    'Show my marks.',
    'How many classes do I need to attend to reach 75%?',
    'Which subject has the highest risk?',
    'Explain my DBMS risk.',
  ];

  const professorPrompts = [
    'Show DBMS students below 75%.',
    "Show Rahul's marks and attendance.",
    'Who is at high academic risk?',
    "Update Rahul's DBMS Internal 1 mark to 42",
  ];

  const adminPrompts = [
    'Who is at high academic risk across all departments?',
    'Show overall DBMS attendance standing.',
    'Check recent audit logs for mark updates.',
  ];

  let prompts = studentPrompts;
  if (role === 'professor') prompts = professorPrompts;
  if (role === 'admin') prompts = adminPrompts;

  return (
    <div className="py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2">
        <Sparkles className="w-3 h-3 text-indigo-500" />
        <span>Suggested Queries ({role})</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {prompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(p)}
            className="text-left text-[11px] px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 hover:border-indigo-300 dark:hover:bg-indigo-950/40 dark:hover:border-indigo-500/40 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1 group"
          >
            <span>{p}</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
