import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../api/authApi';
import {
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Sparkles,
  Bell,
  ShieldCheck,
  Check,
  Clock,
  Video,
  PhoneCall,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Star,
  RefreshCw,
  ExternalLink,
  Key,
  Lock,
  Eye,
  EyeOff,
  Zap,
  HelpCircle,
  CheckCircle,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, login } = useAuth();

  // Form states
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gmailAddress, setGmailAddress] = useState('');

  // Gateway states
  const [callmebotApiKey, setCallmebotApiKey] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [showAppPassword, setShowAppPassword] = useState(false);
  const [activeGatewayTab, setActiveGatewayTab] = useState('whatsapp');

  // Test feedback states
  const [isTestingWa, setIsTestingWa] = useState(false);
  const [waTestFeedback, setWaTestFeedback] = useState(null);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [emailTestFeedback, setEmailTestFeedback] = useState(null);
  const [lastTestAlertResult, setLastTestAlertResult] = useState(null);

  // Notification Preferences toggles
  const [prefs, setPrefs] = useState({
    attendanceAlerts: true,
    academicRiskAlerts: true,
    newMarkAdded: true,
    examReminders: true,
    resourceUpdates: true,
    resultNotifications: true,
  });

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isTriggeringCron, setIsTriggeringCron] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  // Initialize from user session
  useEffect(() => {
    if (!user) return;
    setFullName(user.name || '');

    const customRoll =
      user.profile?.studentId ||
      user.profile?.employeeId ||
      (user.role === 'student' ? '24CSE001' : 'FAC1001');
    setRollNumber(customRoll);

    // Split phone into country code and number if existing
    const rawWa = user.whatsappNumber || '+919876543210';
    if (rawWa.startsWith('+91')) {
      setCountryCode('+91');
      setPhoneNumber(rawWa.replace('+91', ''));
    } else if (rawWa.startsWith('+1')) {
      setCountryCode('+1');
      setPhoneNumber(rawWa.replace('+1', ''));
    } else if (rawWa.startsWith('+44')) {
      setCountryCode('+44');
      setPhoneNumber(rawWa.replace('+44', ''));
    } else {
      setCountryCode('+91');
      setPhoneNumber(rawWa.replace(/^\+/, ''));
    }

    setGmailAddress(user.gmail || user.email || '');
    setSenderEmail(user.smtpConfig?.senderEmail || 'kp2658950@gmail.com');
    setCallmebotApiKey(user.callmebotApiKey || '');

    if (user.notificationPreferences) {
      setPrefs({
        attendanceAlerts: user.notificationPreferences.attendanceAlerts ?? true,
        academicRiskAlerts: user.notificationPreferences.academicRiskAlerts ?? true,
        newMarkAdded: user.notificationPreferences.newMarkAdded ?? true,
        examReminders: user.notificationPreferences.examReminders ?? true,
        resourceUpdates: user.notificationPreferences.resourceUpdates ?? true,
        resultNotifications: user.notificationPreferences.resultNotifications ?? true,
      });
    }
  }, [user]);

  // Real-time validations
  const fullWhatsApp = `${countryCode}${phoneNumber.trim().replace(/[\s\-()]/g, '')}`;
  const cleanDigits = fullWhatsApp.replace(/[^0-9]/g, '');
  const isWhatsAppValid = /^\+[1-9]\d{9,14}$/.test(fullWhatsApp);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gmailAddress.trim());

  // Direct URLs for immediate 1-click test delivery
  const sampleAlertMessage = `🚀 *EduPulse AI - Alert System Connected*\n\nHi ${fullName.split(' ')[0] || 'Student'},\nYour WhatsApp number (${fullWhatsApp}) and Gmail (${gmailAddress}) are successfully linked to EduPulse AI.\nYou will receive real-time alerts whenever your attendance drops below 75% or new assessment scores are posted! ✓`;
  const directWhatsAppUrl = `https://api.whatsapp.com/send?phone=${cleanDigits}&text=${encodeURIComponent(sampleAlertMessage)}`;
  const directGmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(gmailAddress)}&su=${encodeURIComponent('EduPulse AI - System Verification Alert')}&body=${encodeURIComponent(sampleAlertMessage)}`;

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 6000);
  };

  const handleSave = async (e) => {
    e?.preventDefault();

    if (!fullName.trim()) {
      showToast('Full name is required.', 'error');
      return;
    }
    if (!phoneNumber.trim() || !isWhatsAppValid) {
      showToast('Please enter a valid WhatsApp number with country code (e.g., +919876543210).', 'error');
      return;
    }
    if (!gmailAddress.trim() || !isEmailValid) {
      showToast('Please enter a valid Gmail address.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await authApi.updateProfile({
        name: fullName.trim(),
        whatsappNumber: fullWhatsApp,
        gmail: gmailAddress.trim().toLowerCase(),
        studentId: rollNumber.trim(),
        callmebotApiKey: callmebotApiKey.trim(),
        smtpConfig: {
          senderEmail: (senderEmail || gmailAddress).trim().toLowerCase(),
          appPassword: appPassword.trim(),
        },
        notificationPreferences: prefs,
      });

      if (res.success) {
        showToast('Profile and real alert gateway settings saved successfully!', 'success');
      } else {
        showToast(res.message || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      console.error('Update error:', err);
      showToast(err.response?.data?.message || 'Server error updating profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWhatsAppBot = async () => {
    if (!callmebotApiKey.trim()) {
      setWaTestFeedback({
        type: 'error',
        text: 'Please enter your CallMeBot API key first. Click the activation link below to get one.',
      });
      return;
    }

    setIsTestingWa(true);
    setWaTestFeedback(null);
    try {
      const res = await authApi.testWhatsAppGateway({
        phone: fullWhatsApp,
        apiKey: callmebotApiKey.trim(),
      });

      if (res.success) {
        setWaTestFeedback({
          type: 'success',
          text: res.message || '✓ Verified! Real WhatsApp message dispatched to your phone.',
        });
        showToast('✓ Real WhatsApp message dispatched via CallMeBot!', 'success');
      } else {
        setWaTestFeedback({
          type: 'error',
          text: res.message || 'Invalid API Key or phone not authorized yet.',
        });
      }
    } catch (err) {
      setWaTestFeedback({
        type: 'error',
        text: err.response?.data?.message || err.message,
      });
    } finally {
      setIsTestingWa(false);
    }
  };

  const handleTestEmailSmtp = async () => {
    if (!appPassword.trim() && !user?.smtpConfig?.hasPassword) {
      setEmailTestFeedback({
        type: 'error',
        text: 'Please enter your 16-character Google App Password below to test SMTP sending.',
      });
      return;
    }

    setIsTestingEmail(true);
    setEmailTestFeedback(null);
    try {
      const res = await authApi.testEmailGateway({
        senderEmail: (senderEmail || gmailAddress).trim(),
        appPassword: appPassword.trim(),
      });

      if (res.success) {
        setEmailTestFeedback({
          type: 'success',
          text: res.message || '✓ Verified! Real email delivered to your Gmail inbox.',
        });
        showToast('✓ Real test email delivered via Gmail SMTP!', 'success');
      } else {
        setEmailTestFeedback({
          type: 'error',
          text: res.message || 'SMTP Authentication failed. Please check your App Password.',
        });
      }
    } catch (err) {
      setEmailTestFeedback({
        type: 'error',
        text: err.response?.data?.message || err.message,
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleSendTestAlert = async () => {
    setIsSendingTest(true);
    try {
      // First save changes so latest credentials and numbers are used
      await authApi.updateProfile({
        name: fullName.trim(),
        whatsappNumber: fullWhatsApp,
        gmail: gmailAddress.trim().toLowerCase(),
        studentId: rollNumber.trim(),
        callmebotApiKey: callmebotApiKey.trim(),
        smtpConfig: {
          senderEmail: (senderEmail || gmailAddress).trim().toLowerCase(),
          appPassword: appPassword.trim(),
        },
        notificationPreferences: prefs,
      });

      const res = await authApi.sendTestAlert();
      if (res.success) {
        setLastTestAlertResult(res);
        showToast(
          res.message || 'Test alert generated! Click the direct links below to verify in WhatsApp and Gmail.',
          'success'
        );
      }
    } catch (err) {
      console.error('Test alert error:', err);
      showToast(err.response?.data?.message || 'Failed to dispatch test alert.', 'error');
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleRunCron = async () => {
    setIsTriggeringCron(true);
    try {
      const res = await authApi.triggerCronCheck();
      if (res.success) {
        showToast(
          `Background Health Check triggered! Sent ${res.data.studentAlertsCount} student alerts and ${res.data.professorAlertsCount} professor alerts.`,
          'success'
        );
      }
    } catch (err) {
      showToast('Failed to trigger background health check.', 'error');
    } finally {
      setIsTriggeringCron(false);
    }
  };

  const displayName = fullName.split(' ')[0] || 'Student';

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Banner Alert Toast */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between shadow-lg border animate-in slide-in-from-top-3 ${
            toastType === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            {toastType === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs opacity-60 hover:opacity-100 ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          My Profile & Alert Delivery Setup
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal details and configure real-time WhatsApp & Gmail delivery gateways
        </p>
      </div>

      {/* Main Grid: Left Form | Right Previews & Mascot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Personal Info & Notification Preferences & Real Gateways (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Personal Information */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              <span>Personal Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Krishna Kurmi"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Roll Number / Employee ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {user?.role === 'professor' ? 'Employee ID' : 'Roll Number'}
                </label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. 24CSE001"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              {/* WhatsApp Number (Required) */}
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span>WhatsApp Number</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  {isWhatsAppValid ? (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valid (+91 format)
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Requires country code e.g. +91
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Country code pill */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2.5 shrink-0">
                    <span className="text-emerald-500 text-sm">💬</span>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                    >
                      <option value="+91">+91 (India)</option>
                      <option value="+1">+1 (US/CA)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+971">+971 (UAE)</option>
                      <option value="+65">+65 (SG)</option>
                    </select>
                  </div>

                  {/* Phone input */}
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="9876543210"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-mono placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                    {isWhatsAppValid && (
                      <span className="absolute right-3 top-2.5 w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Academic alerts and low attendance warnings will be sent to this WhatsApp number.
                </p>
              </div>

              {/* Gmail Address (Required) */}
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span>Gmail Address</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  {isEmailValid ? (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valid Address
                    </span>
                  ) : (
                    <span className="text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Enter valid email
                    </span>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute left-3 top-2.5 text-indigo-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={gmailAddress}
                    onChange={(e) => setGmailAddress(e.target.value)}
                    placeholder="e.g. np6125168@gmail.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                  {isEmailValid && (
                    <span className="absolute right-3 top-2.5 w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Institutional alerts and assessment summaries will be delivered to this Gmail inbox.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Real Alert Gateways & Live Delivery Setup */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Real Alert Gateways (Live WhatsApp & Gmail Setup)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure free automated background sending or use instant 1-click web links.
                </p>
              </div>
            </div>

            {/* Gateway Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setActiveGatewayTab('whatsapp')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeGatewayTab === 'whatsapp'
                    ? 'bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>💬 WhatsApp Gateway</span>
                {callmebotApiKey ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveGatewayTab('email')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeGatewayTab === 'email'
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>✉️ Gmail SMTP Gateway</span>
                {user?.smtpConfig?.hasPassword || appPassword ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>
            </div>

            {/* TAB 1: WhatsApp Gateway */}
            {activeGatewayTab === 'whatsapp' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Method A: Instant 1-Click WhatsApp Link */}
                <div className="p-4 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <span>⚡ Instant WhatsApp Delivery (No Bot Key Needed)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Opens WhatsApp Web / Mobile with the pre-filled alert to <span className="font-mono text-emerald-400 font-bold">{fullWhatsApp}</span>.
                    </p>
                  </div>
                  <a
                    href={directWhatsAppUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold shadow-md transition-all active:scale-95 shrink-0"
                  >
                    <span>📲 Open in WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Method B: Automated CallMeBot Setup (100% Free) */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-emerald-500" />
                      <span>Automated 24/7 WhatsApp Bot (CallMeBot - 100% Free)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                      Official Gateway
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    WhatsApp requires phone owners to grant anti-spam permission to the bot before automated messages can arrive. Complete this once in 10 seconds:
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300 text-[11px]">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        1
                      </span>
                      <div className="flex-1">
                        Click the button below to send <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-400">I allow callmebot to send me messages</code> to the CallMeBot verified number on WhatsApp:
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <a
                            href="https://wa.me/34684728023?text=I+allow+callmebot+to+send+me+messages"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#075E54] hover:bg-[#064e46] text-white text-[11px] font-bold shadow-sm"
                          >
                            <span>💬 Message Bot 1 (+34 684 728 023)</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <a
                            href="https://wa.me/34623786449?text=I+allow+callmebot+to+send+me+messages"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold"
                          >
                            <span>Alternative Bot 2</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300 text-[11px]">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        CallMeBot will immediately reply on WhatsApp with your personal <strong>apikey</strong> (e.g. <code>123456</code>).
                      </span>
                    </div>

                    <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300 text-[11px]">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        3
                      </span>
                      <div className="flex-1 space-y-2">
                        <span>Paste your received CallMeBot API Key below:</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={callmebotApiKey}
                            onChange={(e) => setCallmebotApiKey(e.target.value)}
                            placeholder="e.g. 583920"
                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={handleTestWhatsAppBot}
                            disabled={isTestingWa}
                            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                          >
                            <Zap className={`w-3.5 h-3.5 ${isTestingWa ? 'animate-spin' : ''}`} />
                            <span>{isTestingWa ? 'Testing...' : 'Test Bot'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Live Diagnostic Feedback */}
                  {waTestFeedback && (
                    <div
                      className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 animate-in fade-in ${
                        waTestFeedback.type === 'success'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {waTestFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <span>{waTestFeedback.text}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Gmail SMTP Gateway */}
            {activeGatewayTab === 'email' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Method A: Instant 1-Click Gmail Draft */}
                <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <span>⚡ Instant Gmail Compose (No SMTP Setup Needed)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Opens Gmail in browser with recipient <span className="font-mono text-sky-400 font-bold">{gmailAddress}</span> and alert body pre-filled.
                    </p>
                  </div>
                  <a
                    href={directGmailUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 shrink-0"
                  >
                    <span>✉️ Open in Gmail</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Method B: Automated Nodemailer Gmail SMTP Setup */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-indigo-500" />
                      <span>Automated Gmail Delivery (Google App Password)</span>
                    </div>
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:underline font-semibold"
                    >
                      <span>Get App Password</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Google requires a dedicated 16-character <strong>App Password</strong> (not your standard Gmail account password) for third-party systems like Nodemailer to send emails:
                  </p>

                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                    <div>1. Go to <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-indigo-400 underline">Google Account Security</a> and ensure <strong>2-Step Verification</strong> is ON.</div>
                    <div>2. Open <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-indigo-400 underline">App passwords</a>.</div>
                    <div>3. Type App name <strong>EduPulse AI</strong> and copy the 16-character code (e.g. <code>abcd efgh ijkl mnop</code>).</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Sender Gmail
                      </label>
                      <input
                        type="email"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        placeholder="your.gmail@gmail.com"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          16-Character App Password
                        </label>
                        {user?.smtpConfig?.hasPassword && !appPassword && (
                          <span className="text-[10px] text-emerald-500 font-bold">✓ Password Saved</span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={showAppPassword ? 'text' : 'password'}
                          value={appPassword}
                          onChange={(e) => setAppPassword(e.target.value)}
                          placeholder={user?.smtpConfig?.hasPassword ? '••••••••••••••••' : 'abcd efgh ijkl mnop'}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 pr-8 py-2 text-xs font-mono text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAppPassword(!showAppPassword)}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
                        >
                          {showAppPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleTestEmailSmtp}
                      disabled={isTestingEmail}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Zap className={`w-3.5 h-3.5 ${isTestingEmail ? 'animate-spin' : ''}`} />
                      <span>{isTestingEmail ? 'Testing SMTP...' : 'Test SMTP Connection'}</span>
                    </button>
                  </div>

                  {/* Email Live Diagnostic Feedback */}
                  {emailTestFeedback && (
                    <div
                      className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 animate-in fade-in ${
                        emailTestFeedback.type === 'success'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {emailTestFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <span>{emailTestFeedback.text}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Notification Preferences (Toggles matching Image) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Notification Preferences
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Toggle 1: Attendance Alerts */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setPrefs((p) => ({ ...p, attendanceAlerts: !p.attendanceAlerts }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-0.5 ${
                    prefs.attendanceAlerts ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      prefs.attendanceAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Attendance Alerts (Below 75%)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    Get notified when your attendance is low
                  </div>
                </div>
              </div>

              {/* Toggle 2: Academic Risk Alerts */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setPrefs((p) => ({ ...p, academicRiskAlerts: !p.academicRiskAlerts }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-0.5 ${
                    prefs.academicRiskAlerts ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      prefs.academicRiskAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Academic Risk Alerts
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    Get notified about potential academic risks
                  </div>
                </div>
              </div>

              {/* Toggle 3: New Mark Added */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setPrefs((p) => ({ ...p, newMarkAdded: !p.newMarkAdded }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-0.5 ${
                    prefs.newMarkAdded ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      prefs.newMarkAdded ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    New Mark Added
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    Get notified when new marks are added
                  </div>
                </div>
              </div>

              {/* Toggle 4: Exam Reminders */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setPrefs((p) => ({ ...p, examReminders: !p.examReminders }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-0.5 ${
                    prefs.examReminders ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      prefs.examReminders ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Exam Reminders
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    Get notified about upcoming exams and deadlines
                  </div>
                </div>
              </div>

              {/* Toggle 5: Resource Updates */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setPrefs((p) => ({ ...p, resourceUpdates: !p.resourceUpdates }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-0.5 ${
                    prefs.resourceUpdates ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      prefs.resourceUpdates ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Resource Updates
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    Alerts when new notes or lecture PDFs are uploaded
                  </div>
                </div>
              </div>

              {/* Toggle 6: Result Notifications */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setPrefs((p) => ({ ...p, resultNotifications: !p.resultNotifications }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-0.5 ${
                    prefs.resultNotifications ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      prefs.resultNotifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Result Notifications
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    Instant alerts when examination results are published
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Action Buttons Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSendTestAlert}
                disabled={isSendingTest || isSaving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                title="Send real test message to WhatsApp and Email"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingTest ? 'Dispatching...' : 'Send Test Alert'}</span>
              </button>

              <button
                type="button"
                onClick={handleRunCron}
                disabled={isTriggeringCron}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all"
                title="Trigger automated campus-wide health check routine"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTriggeringCron ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Run Background Check</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>

          {/* Live Delivery Launcher Banner (Displayed when Test Alert is triggered) */}
          {lastTestAlertResult && (
            <div className="p-4 rounded-3xl bg-indigo-950/40 border border-indigo-500/40 shadow-xl space-y-3 animate-in slide-in-from-top-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Test Alert Dispatched — Open Instantly:</span>
                </div>
                <button
                  onClick={() => setLastTestAlertResult(null)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={lastTestAlertResult.whatsappLink || directWhatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold shadow-lg transition-all active:scale-95"
                >
                  <span>📲 Deliver in WhatsApp ({fullWhatsApp})</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href={lastTestAlertResult.emailLink || directGmailUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg transition-all active:scale-95"
                >
                  <span>✉️ Open in Gmail ({gmailAddress})</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="text-[11px] text-slate-300 flex flex-wrap items-center gap-3 pt-1 border-t border-indigo-500/20">
                <span>
                  WhatsApp Gateway:{' '}
                  {lastTestAlertResult.channels?.whatsapp?.status === 'SENT' ? (
                    <strong className="text-emerald-400">✓ Delivered via CallMeBot</strong>
                  ) : (
                    <strong className="text-amber-400">Ready via 1-Click Link</strong>
                  )}
                </span>
                <span>
                  Email Gateway:{' '}
                  {lastTestAlertResult.channels?.email?.status === 'SENT' ? (
                    <strong className="text-emerald-400">✓ Delivered via Gmail SMTP</strong>
                  ) : (
                    <strong className="text-sky-400">Ready via 1-Click Gmail</strong>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: 3D Mascot Speech Bubble + WhatsApp & Email Live Previews (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mascot Speech Bubble & 3D Robot Head (Matching the Mockup) */}
          <div className="relative flex items-center justify-end gap-3 pr-2">
            <div className="relative bg-gradient-to-tr from-indigo-950 via-slate-900 to-purple-950 text-white p-3.5 rounded-2xl rounded-br-none shadow-xl border border-indigo-500/40 max-w-[240px] text-right">
              <p className="text-xs font-semibold text-slate-100 leading-snug">
                I'll notify you on <strong className="text-emerald-400">WhatsApp</strong> and <strong className="text-indigo-300">Email</strong> when your attendance is low! <span className="text-emerald-400">✓</span>
              </p>
              <div className="absolute -bottom-2 right-4 w-0 h-0 border-l-[7px] border-l-transparent border-t-[8px] border-t-purple-950 border-r-[7px] border-r-transparent" />
            </div>

            <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 shadow-[0_10px_25px_-5px_rgba(124,58,237,0.6)] shrink-0 animate-float-bob">
              <img
                src="/copilot-robot.jpg"
                alt="EduPulse AI Mascot"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>

          {/* WhatsApp Alert Preview Card (Matching Mockup) */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {/* WhatsApp App Bar Header */}
            <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 p-0.5">
                  <img src="/copilot-robot.jpg" alt="EduPulse AI" className="w-full h-full rounded-full object-cover" />
                </div>
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    EduPulse AI <span className="text-emerald-300 text-[10px]">✓</span>
                  </div>
                  <div className="text-[10px] text-emerald-100 opacity-90">online</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <Video className="w-4 h-4 cursor-pointer hover:text-white" />
                <PhoneCall className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
                <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white" />
              </div>
            </div>

            {/* Chat Canvas */}
            <div className="p-4 bg-[#EFEAE2] dark:bg-[#0b141a] min-h-[160px] space-y-2">
              <div className="max-w-[92%] bg-white dark:bg-[#1f2c34] text-slate-800 dark:text-slate-100 p-3.5 rounded-2xl rounded-tl-sm shadow-sm text-xs leading-relaxed space-y-1.5">
                <div className="font-bold text-[#b45309] dark:text-amber-400 flex items-center gap-1 text-[11px]">
                  <span>⚠️</span> EduPulse AI - Attendance Alert
                </div>
                <div className="text-slate-700 dark:text-slate-200">
                  Hi {displayName},
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  Your DBMS attendance is <strong className="text-rose-600 dark:text-rose-400 font-bold">68%</strong> (34 out of 50 classes).
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  You are below the 75% requirement.
                </div>
                <div className="text-slate-500 dark:text-slate-400 italic text-[11px]">
                  Please attend upcoming classes to avoid academic risk.
                </div>
                <div className="text-[9px] text-slate-400 dark:text-slate-500 text-right flex items-center justify-end gap-1 pt-1">
                  <span>10:24 AM</span>
                  <span className="text-sky-500 font-bold">✓✓</span>
                </div>
              </div>
            </div>

            {/* WhatsApp Fake Input bar */}
            <div className="bg-[#F0F2F5] dark:bg-[#1f2c34] p-2 flex items-center gap-2 border-t border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              <Smile className="w-4 h-4" />
              <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-full px-3 py-1.5 text-[11px] text-slate-400">
                Type a message
              </div>
              <Paperclip className="w-4 h-4" />
              <div className="w-7 h-7 rounded-full bg-[#00a884] text-white flex items-center justify-center">
                <Mic className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Email Alert Preview Card (Matching Mockup) */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {/* Email Header Bar */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  M
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    EduPulse AI &lt;noreply@edupulse.edu&gt;
                  </div>
                  <div className="text-[10px] text-slate-400">
                    to {gmailAddress || 'you@example.com'}
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-2">
                <span>10:24 AM</span>
                <Star className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* Email Body Card */}
            <div className="p-4 space-y-3 text-xs">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-900 to-purple-900 text-white font-bold text-xs flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-300" />
                <span>Attendance Alert</span>
              </div>

              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Hi {displayName},<br />
                Your DBMS attendance is <strong>68%</strong> (34 out of 50 classes).<br />
                You are below the 75% requirement.<br />
                Please attend upcoming classes to avoid academic risk.
              </p>

              {/* Summary Table Card */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subject:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">DBMS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Attendance:</span>
                  <span className="font-bold text-rose-500">68%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Required:</span>
                  <span className="font-bold text-emerald-500">75%</span>
                </div>
                <div className="pt-1 mt-1 border-t border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold">
                  Suggestion: Attend at least 4 more classes to stay above 75%.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
