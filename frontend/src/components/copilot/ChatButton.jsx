import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

export default function ChatButton({ onClick, isOpen }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all shadow-sm ${
        isOpen
          ? 'bg-indigo-600 text-white shadow-indigo-500/25 ring-2 ring-indigo-400/40'
          : 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-300 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
      }`}
      title="Open EduPulse Academic AI Copilot"
    >
      <div className="relative">
        <Bot className={`w-4 h-4 ${isOpen ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} />
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
      </div>

      <span className="hidden sm:inline font-bold">AI Copilot</span>
      <Sparkles className="w-3 h-3 text-amber-400" />
    </button>
  );
}
