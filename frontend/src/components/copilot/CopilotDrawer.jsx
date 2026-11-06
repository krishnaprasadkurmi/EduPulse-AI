import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { copilotApi } from '../../api/copilotApi';
import {
  X,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  ChevronRight,
  BarChart3,
  FileText,
  AlertTriangle,
  Calendar,
  Users,
  Edit3,
  FileCheck2,
  BookOpen,
} from 'lucide-react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

export default function CopilotDrawer({ isOpen, onClose, onOpen }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [error, setError] = useState(null);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBubble, setShowBubble] = useState(true);

  // Initialize role-grounded welcome greeting
  useEffect(() => {
    if (!user) return;

    let welcomeText = '';
    if (user.role === 'student') {
      welcomeText =
        `👋 Hello **${user.name}**! I'm your **EduPulse Academic Copilot**.\n\n` +
        `I am connected directly to your institutional records. Ask me:\n` +
        `• *"What is my DBMS attendance?"*\n` +
        `• *"How many classes do I need to attend to reach 75%?"*\n` +
        `• *"Show my marks."*\n` +
        `• *"Which subject needs attention?"*\n` +
        `• *"Upcoming classes"*`;
    } else if (user.role === 'professor') {
      welcomeText =
        `👋 Welcome, **${user.name}**.\n\n` +
        `I can help you review student progress and perform authorized updates:\n` +
        `• *"Show DBMS students below 75%"*\n` +
        `• *"Show Rahul's marks and attendance"*\n` +
        `• *"Who is at high academic risk?"*\n` +
        `• *"Update Rahul's DBMS Internal 1 mark to 42"* (requires your confirmation)`;
    } else {
      welcomeText =
        `👋 Welcome **${user.name}** (Academic Dean).\n\n` +
        `Ask me about student risk distributions, campus-wide trends, or audit logs.`;
    }

    setMessages([
      {
        sender: 'assistant',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [user]);

  const handleSendMessage = async (text) => {
    if (!text || !text.trim() || isLoading) return;

    setError(null);
    setLastFailedMessage(null);

    const userMsg = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await copilotApi.chat(text);

      if (res.success) {
        const assistantMsg = {
          sender: 'assistant',
          text: res.reply,
          data: res.data,
          requiresConfirmation: res.requiresConfirmation,
          action: res.action,
          tool:
            res.tool ||
            (res.data?.singleSubject
              ? 'getMyAttendance'
              : res.data?.today
              ? 'getMySchedule'
              : res.data?.risks
              ? 'calculateSubjectRisk'
              : res.data?.marks
              ? 'getMyMarks'
              : res.action
              ? 'createPendingWrite'
              : null),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setError(res.message || 'Failed to process query.');
        setLastFailedMessage(text);
      }
    } catch (err) {
      console.error('[CopilotDrawer] Chat request error:', err);
      const errMsg = err.response?.data?.message || 'Network error communicating with Academic Engine.';
      setError(errMsg);
      setLastFailedMessage(text);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async (actionId) => {
    setIsProcessingAction(true);
    try {
      const res = await copilotApi.confirmAction(actionId, true);
      if (res.success) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            text: res.reply,
            tool: 'writeConfirmed',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setError(res.message || 'Failed to confirm action.');
      }
    } catch (err) {
      console.error('[CopilotDrawer] Confirmation error:', err);
      setError(err.response?.data?.message || 'Error executing confirmed write action.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleCancelAction = async (actionId) => {
    setIsProcessingAction(true);
    try {
      const res = await copilotApi.confirmAction(actionId, false);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: res.reply || 'Action cancelled. No database changes were made.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('[CopilotDrawer] Cancellation error:', err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleResetChat = () => {
    if (!user) return;
    setMessages([]);
    setError(null);
  };

  // Quick Action Options matching Image 2
  const studentQuickActions = [
    {
      label: 'What is my DBMS attendance?',
      icon: BarChart3,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      query: 'What is my DBMS attendance?',
    },
    {
      label: 'Show my marks',
      icon: FileText,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      query: 'Show my marks',
    },
    {
      label: 'Which subject needs attention?',
      icon: AlertTriangle,
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      query: 'Which subject needs attention?',
    },
    {
      label: 'Upcoming classes',
      icon: Calendar,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      query: 'Upcoming classes',
    },
  ];

  const profQuickActions = [
    {
      label: 'Show DBMS students below 75%',
      icon: Users,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      query: 'Show DBMS students below 75%',
    },
    {
      label: "Show Rahul's marks & attendance",
      icon: FileText,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      query: "Show Rahul's marks and attendance",
    },
    {
      label: 'Who is at high academic risk?',
      icon: AlertTriangle,
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      query: 'Who is at high academic risk?',
    },
    {
      label: "Update Rahul's DBMS mark to 42",
      icon: Edit3,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      query: "Update Rahul's DBMS Internal 1 mark to 42",
    },
  ];

  const adminQuickActions = [
    {
      label: 'Who is at high academic risk?',
      icon: AlertTriangle,
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      query: 'Who is at high academic risk across all departments?',
    },
    {
      label: 'Show overall DBMS attendance standing',
      icon: BarChart3,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      query: 'Show overall DBMS attendance standing',
    },
    {
      label: 'Check recent audit logs',
      icon: FileCheck2,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      query: 'Check recent audit logs for mark updates',
    },
    {
      label: 'Curriculum & department overview',
      icon: BookOpen,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      query: 'Show all subjects',
    },
  ];

  let quickActions = studentQuickActions;
  if (user?.role === 'professor') quickActions = profQuickActions;
  if (user?.role === 'admin') quickActions = adminQuickActions;

  const firstName = user?.name?.split(' ')[0] || 'there';

  // 1. When CLOSED: Render Floating Robot Mascot & Speech Bubble
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3 pointer-events-auto">
        {/* Speech Bubble Tooltip as seen in Image 2 */}
        {showBubble && (
          <div
            onClick={onOpen}
            className="group relative bg-gradient-to-tr from-indigo-950 via-slate-900 to-purple-950 text-white p-3.5 rounded-2xl rounded-br-none shadow-2xl border border-indigo-500/40 backdrop-blur-md cursor-pointer hover:border-indigo-400 transition-all duration-300 max-w-[210px] animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1">
                Hi! 👋
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBubble(false);
                }}
                className="text-slate-400 hover:text-white p-0.5 text-[10px] transition-colors"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-100 mt-1 leading-snug">
              Need help with your academics?
            </p>

            {/* Little pointer triangle to robot head */}
            <div className="absolute -bottom-2 right-4 w-0 h-0 border-l-[7px] border-l-transparent border-t-[8px] border-t-purple-950 border-r-[7px] border-r-transparent" />
          </div>
        )}

        {/* 3D Robot Mascot Avatar Button */}
        <button
          onClick={onOpen}
          className="relative group p-1 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 shadow-[0_10px_35px_-5px_rgba(124,58,237,0.7)] hover:shadow-[0_15px_45px_-5px_rgba(124,58,237,0.95)] hover:scale-110 active:scale-95 transition-all duration-300 animate-float-bob"
          title="Open EduPulse Academic AI Copilot"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-slate-900 ring-2 ring-white/20">
            <img
              src="/copilot-robot.jpg"
              alt="EduPulse AI Mascot"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Glowing Online Beacon */}
          <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 shadow-sm" />
          <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping opacity-75" />

          {/* Floating Sparkle icon */}
          <span className="absolute -top-1 -left-1 p-1 rounded-full bg-indigo-600/90 text-amber-300 shadow-md">
            <Sparkles className="w-3 h-3" />
          </span>
        </button>
      </div>
    );
  }

  // 2. When OPEN: Render Sleek Floating Window Card as seen in Image 2
  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 sm:hidden transition-opacity"
      />

      <div
        className={`fixed z-50 transition-all duration-300 ease-out flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-[0_25px_70px_-15px_rgba(15,23,42,0.45)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 ${
          isExpanded
            ? 'bottom-2 right-2 sm:bottom-6 sm:right-6 w-[calc(100vw-1rem)] sm:w-[560px] md:w-[640px] h-[calc(100vh-1rem)] sm:h-[86vh]'
            : 'bottom-2 right-2 sm:bottom-6 sm:right-6 w-[calc(100vw-1rem)] sm:w-[415px] h-[590px] max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-5rem)]'
        }`}
      >
        {/* Header Bar matching Image 2 */}
        <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-full ring-2 ring-indigo-500/40 p-0.5 bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-sm shrink-0">
              <img
                src="/copilot-robot.jpg"
                alt="EduPulse AI"
                className="w-full h-full rounded-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                  EduPulse <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">AI</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Academic
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Online</span>
              </div>
            </div>
          </div>

          {/* Window action controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isExpanded ? 'Restore window size' : 'Expand window'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleResetChat}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close Copilot"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body: Greeting + Quick Action Cards (Image 2 style) OR Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            /* Initial Welcome State (as seen in Image 2) */
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Friendly Greeting Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-blue-950/40 border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
                <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1.5">
                  Hi {firstName}! <span className="text-base">👋</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  I'm your academic assistant. You can ask me about your attendance, marks, subjects,
                  risk analysis, schedule, and more.
                </p>
              </div>

              {/* Quick Action Options List (Matching Image 2 exactly) */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                  Quick Actions
                </div>
                {quickActions.map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(action.query)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 hover:translate-x-1 shadow-sm transition-all duration-200 group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border ${action.color} shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                          {action.label}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Active Conversation Message List */
            <div className="space-y-3">
              <MessageList
                messages={messages}
                isLoading={isLoading}
                error={error}
                onRetry={() => lastFailedMessage && handleSendMessage(lastFailedMessage)}
                onConfirmAction={handleConfirmAction}
                onCancelAction={handleCancelAction}
                isProcessingAction={isProcessingAction}
              />

              {/* Fast follow-up suggestion chips */}
              {!isLoading && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span>Ask More</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {quickActions.map((qa, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(qa.query)}
                        className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1"
                      >
                        <span>{qa.label}</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Bar (Matching Image 2 floating rounded pill) */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading || isProcessingAction}
          placeholder="Ask anything about your academics..."
        />
      </div>
    </>
  );
}
