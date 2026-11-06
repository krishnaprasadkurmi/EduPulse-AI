import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  X,
  AlertTriangle,
  ShieldAlert,
  Award,
  FileText,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';
import { notificationApi } from '../../api/notificationApi';

export default function NotificationDrawer({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getNotifications();
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'ATTENDANCE_CRITICAL':
      case 'RISK_HIGH':
        return <ShieldAlert className="w-5 h-5 text-rose-400" />;
      case 'ATTENDANCE_WARNING':
      case 'RISK_MEDIUM':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'MARK_CREATED':
      case 'MARK_UPDATED':
        return <Award className="w-5 h-5 text-indigo-400" />;
      default:
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-indigo-500 text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">Academic updates & alert feeds</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && (
            <div className="py-8 text-center text-slate-500 text-sm">
              Loading alerts...
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-slate-400 font-medium text-sm">All caught up!</p>
              <p className="text-slate-500 text-xs mt-1">No alerts or updates at this time.</p>
            </div>
          )}

          {!loading &&
            notifications.map((n) => (
              <div
                key={n._id}
                className={`p-3.5 rounded-xl border transition-all ${
                  n.read
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-75'
                    : 'bg-slate-800/80 border-indigo-500/30 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-slate-950/60 shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className="text-xs font-semibold text-slate-200 truncate">
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed break-words">
                      {n.message}
                    </p>

                    {/* Requirement 8: WhatsApp & Email Delivery Channel Status & Direct Links */}
                    {n.channels && (
                      <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2 border-t border-slate-700/50">
                        {/* WhatsApp Status & 1-Click Link */}
                        {n.channels.whatsapp && (
                          <div className="flex flex-wrap items-center gap-1">
                            {n.channels.whatsapp.status === 'SENT' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                <span>✓ WhatsApp Delivered</span>
                              </span>
                            ) : n.channels.whatsapp.status === 'FAILED' ? (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                title={n.channels.whatsapp.error || 'Failed'}
                              >
                                <span>✕ WhatsApp Failed</span>
                              </span>
                            ) : n.channels.whatsapp.status === 'UNCONFIGURED' ? (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                title="CallMeBot API key required for automated background bot"
                              >
                                <span>⚠️ WhatsApp Key Needed</span>
                              </span>
                            ) : null}

                            <a
                              href={
                                n.channels.whatsapp.link ||
                                `https://api.whatsapp.com/send?phone=919894242835&text=${encodeURIComponent(n.message)}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 border border-[#25D366]/40 transition-colors"
                              title="Open pre-filled alert directly in WhatsApp Web or App"
                            >
                              <span>📲 Open in WhatsApp</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}

                        {/* Email Status & 1-Click Link */}
                        {n.channels.email && (
                          <div className="flex flex-wrap items-center gap-1">
                            {n.channels.email.status === 'SENT' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                                <span>✓ Email Delivered</span>
                              </span>
                            ) : n.channels.email.status === 'FAILED' ? (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                title={n.channels.email.error || 'Failed'}
                              >
                                <span>✕ Email Failed</span>
                              </span>
                            ) : n.channels.email.status === 'UNCONFIGURED' ? (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                title="Gmail App Password required for automated SMTP sending"
                              >
                                <span>⚠️ SMTP Key Needed</span>
                              </span>
                            ) : null}

                            <a
                              href={
                                n.channels.email.link ||
                                `https://mail.google.com/mail/?view=cm&fs=1&to=np6125168@gmail.com&su=${encodeURIComponent(n.title)}&body=${encodeURIComponent(n.message)}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 transition-colors"
                              title="Open pre-filled draft directly in Gmail"
                            >
                              <span>✉️ Open in Gmail</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => handleMarkAsRead(n._id)}
                      className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
