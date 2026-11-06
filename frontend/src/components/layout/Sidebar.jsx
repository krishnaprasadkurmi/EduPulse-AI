import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  ShieldAlert,
  CalendarCheck,
  Calculator,
  GraduationCap,
  Mic,
  Users,
  Building2,
  FileCheck2,
  BarChart3,
  BookOpen,
  Database,
  Bot,
  Sparkles,
  UserCircle,
} from 'lucide-react';

export default function Sidebar({ currentTab, onSelectTab, onOpenCopilot }) {
  const { user } = useAuth();
  if (!user) return null;

  const studentLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'risk-center', label: 'Subject Risk Center', icon: ShieldAlert, highlight: true },
    { id: 'attendance', label: 'Attendance & Trend', icon: CalendarCheck },
    { id: 'marks', label: 'Marks & Evaluation', icon: GraduationCap },
    { id: 'what-if', label: 'What-If Simulator', icon: Calculator },
    { id: 'learning-resources', label: 'Learning Resources', icon: BookOpen, isNew: true },
    { id: 'exams-results', label: 'Exams & Results', icon: BarChart3, isNew: true },
    { id: 'profile', label: 'My Profile & Alerts', icon: UserCircle },
  ];

  const professorLinks = [
    { id: 'dashboard', label: 'Professor Overview', icon: LayoutDashboard },
    { id: 'voice-marks', label: 'AI Voice Mark Entry', icon: Mic, highlight: true },
    { id: 'attendance-entry', label: 'Attendance Entry', icon: CalendarCheck },
    { id: 'marks-entry', label: 'Marks Gradebook', icon: GraduationCap },
    { id: 'at-risk', label: 'At-Risk Students', icon: ShieldAlert },
    { id: 'learning-resources', label: 'Learning Resources', icon: BookOpen, isNew: true },
    { id: 'exams-results', label: 'Exams & Results', icon: BarChart3, isNew: true },
    { id: 'profile', label: 'My Profile & Alerts', icon: UserCircle },
  ];

  const adminLinks = [
    { id: 'dashboard', label: 'Campus Analytics', icon: BarChart3 },
    { id: 'risk-monitor', label: 'Risk Monitor', icon: ShieldAlert, highlight: true },
    { id: 'management', label: 'Curriculum & Roster', icon: BookOpen },
    { id: 'learning-resources', label: 'Learning Resources', icon: BookOpen, isNew: true },
    { id: 'exams-results', label: 'Exams & Results', icon: BarChart3, isNew: true },
    { id: 'db-explorer', label: 'MongoDB Explorer', icon: Database, highlight: true },
    { id: 'audit-logs', label: 'Security Audit Logs', icon: FileCheck2 },
    { id: 'profile', label: 'My Profile & Alerts', icon: UserCircle },
  ];

  let links = studentLinks;
  if (user.role === 'professor') links = professorLinks;
  if (user.role === 'admin') links = adminLinks;

  return (
    <aside className="w-64 bg-white dark:bg-slate-900/60 backdrop-blur border-r border-slate-200 dark:border-slate-800/80 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] transition-colors">
      {/* Current Workspace Role Pill */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800/60">
        <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">
              {user.role} Portal
            </span>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">v1.0</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = currentTab === link.id;

          return (
            <button
              key={link.id}
              onClick={() => onSelectTab(link.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              } ${link.highlight && !isActive ? 'border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-300' : ''}`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
              <span className="flex-1 text-left">{link.label}</span>
              {link.highlight && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-mono uppercase font-bold">
                  AI
                </span>
              )}
              {link.isNew && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 font-mono uppercase font-bold">
                  NEW
                </span>
              )}
            </button>
          );
        })}

        {/* Dedicated Academic Copilot Quick Launcher */}
        <div className="pt-2">
          <button
            onClick={onOpenCopilot}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 shadow-sm"
          >
            <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="flex-1 text-left">Academic AI Copilot</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </button>
        </div>
      </nav>

      {/* Bottom Information Card */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/60">
        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-500/20">
          <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 mb-1">
            EduPulse Intelligence Loop
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
            Collect → Predict → Alert → Recommend → Act → Recalculate
          </p>
        </div>
      </div>
    </aside>
  );
}
