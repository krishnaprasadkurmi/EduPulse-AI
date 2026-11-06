import React from 'react';
import { useAuth, DEMO_PERSONAS } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Activity,
  ArrowRight,
  ShieldAlert,
  Mic,
  CalendarCheck,
  TrendingDown,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  Sun,
  Moon,
} from 'lucide-react';

export default function LandingPage({ onGoToLogin }) {
  const { switchPersona } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleQuickDemo = async (persona) => {
    await switchPersona(persona.email, persona.password);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200 selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <header className="h-20 border-b border-slate-200 dark:border-slate-800/80 px-6 sm:px-12 flex items-center justify-between max-w-7xl mx-auto w-full transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-glow-indigo">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-600 dark:from-white dark:via-indigo-100 dark:to-indigo-400 bg-clip-text text-transparent">
              EduPulse AI
            </span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-widest">
              Intelligent Academic System
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle (Light / Dark Mode) */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          <button
            onClick={() => onGoToLogin('student')}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md hover:shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Sign In / Demo Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 sm:px-12 py-16 sm:py-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 text-xs font-semibold mb-6 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          <span>Core Promise: Detect academic risk before it becomes academic failure.</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl text-slate-900 dark:text-white leading-tight">
          Don't discover academic failure.{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 dark:from-indigo-400 dark:via-violet-400 dark:to-pink-400 bg-clip-text text-transparent">
            Predict it.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mt-6 leading-relaxed font-medium">
          An intelligent university monitoring platform that converts continuous attendance and performance signals into explainable risk predictions, instant student alerts, and hands-free faculty voice workflows.
        </p>

        {/* 1-Click Interactive Persona Jumpstart for Judges & Portal Access */}
        <div className="w-full max-w-4xl mt-12 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-5 flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500" /> Role Portals & One-Click Demo Access
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEMO_PERSONAS.map((p) => (
              <div
                key={p.role}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-white dark:hover:bg-slate-900/90 transition-all text-left flex flex-col justify-between group shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-indigo-500/30" />
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                      {p.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-snug font-medium">
                    {p.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                  <button
                    type="button"
                    onClick={() => onGoToLogin(p.role)}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-500/30 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>{p.role.toUpperCase()} Portal Login / Sign Up</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo(p)}
                    className="w-full py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white dark:text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Instant Demo Sign-In</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Intelligence Loop Architecture Diagram */}
        <div className="w-full max-w-4xl mt-16 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none text-left space-y-6 transition-colors">
          <div>
            <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
              Architecture Principle
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              The Closed-Loop Academic Intelligence Engine
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              EduPulse AI is not a static database: every grade entry or attendance toggle triggers a continuous recalculation loop.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { step: '01', title: 'Collect', desc: 'Attendance & Grades' },
              { step: '02', title: 'Predict', desc: 'Attendance & Risk' },
              { step: '03', title: 'Alert', desc: 'In-app Notifications' },
              { step: '04', title: 'Recommend', desc: 'Actionable Steps' },
              { step: '05', title: 'Act', desc: 'Voice Mark Entry' },
              { step: '06', title: 'Recalculate', desc: 'Feedback Loop' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 transition-colors"
              >
                <div className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">{item.step}</div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-200 mt-1">{item.title}</div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        EduPulse AI • Built for HackSprint Track 2 • Production-Quality MERN + AI Prototype
      </footer>
    </div>
  );
}
