import React, { useState } from 'react';
import { useAuth, DEMO_PERSONAS } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Activity,
  Lock,
  Mail,
  User,
  Building2,
  GraduationCap,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Hash,
  Sun,
  Moon,
  ArrowLeft,
} from 'lucide-react';

export default function LoginPage({ onBackToHome, initialRole = 'student' }) {
  const { login, register, switchPersona, authError } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Active Role Tab: 'student' | 'professor' | 'admin'
  const validInitialRole = (typeof initialRole === 'string' && ['student', 'professor', 'admin'].includes(initialRole)) ? initialRole : 'student';
  const [activeRole, setActiveRole] = useState(validInitialRole);
  // Mode: 'signin' | 'signup'
  const [mode, setMode] = useState('signin');

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up State
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [studentId, setStudentId] = useState('');
  const [semester, setSemester] = useState('5');
  const [employeeId, setEmployeeId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Role metadata configurations
  const roleConfig = {
    student: {
      title: 'Student Academic Portal',
      subtitle: 'Track your attendance, predictive risk scores, and simulate 75% recovery.',
      badge: 'Student Access',
      badgeColor: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
      icon: GraduationCap,
      accentBorder: 'border-indigo-200 dark:border-indigo-500/30',
      accentBtn: 'bg-indigo-600 hover:bg-indigo-500 shadow-md',
      demoEmail: 'rahul@edupulse.edu',
      demoPass: 'student123',
      demoName: 'Rahul Sharma (High Risk Demo)',
    },
    professor: {
      title: 'Faculty Gradebook & AI Console',
      subtitle: 'Hands-free voice mark recording, class roster attendance, and academic interventions.',
      badge: 'Faculty Access',
      badgeColor: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
      icon: BookOpen,
      accentBorder: 'border-emerald-200 dark:border-emerald-500/30',
      accentBtn: 'bg-emerald-600 hover:bg-emerald-500 shadow-md',
      demoEmail: 'prof.sharma@edupulse.edu',
      demoPass: 'prof123',
      demoName: 'Prof. Rajesh Sharma (DBMS & DSA)',
    },
    admin: {
      title: 'Academic Dean & Analytics Suite',
      subtitle: 'University-wide risk heatmaps, enrollment roster administration, and audit trails.',
      badge: 'Dean Access',
      badgeColor: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
      icon: ShieldAlert,
      accentBorder: 'border-purple-200 dark:border-purple-500/30',
      accentBtn: 'bg-purple-600 hover:bg-purple-500 shadow-md',
      demoEmail: 'admin@edupulse.edu',
      demoPass: 'admin123',
      demoName: 'Dr. Aris Thorne (Academic Dean)',
    },
  };

  const currentCfg = roleConfig[activeRole];

  // Handle Sign In submission
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    if (!email.trim() || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await login(email.trim(), password);
      if (!res.success) {
        setLocalError(res.message || 'Login failed. Please verify credentials.');
      }
    } catch (err) {
      setLocalError('Unable to connect to authentication service.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Sign Up submission
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    if (!name.trim() || !signupEmail.trim() || !signupPassword) {
      setLocalError('Please fill in your name, email, and password.');
      return;
    }

    if (signupPassword !== confirmPassword) {
      setLocalError('Passwords do not match. Please re-enter.');
      return;
    }

    if (signupPassword.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        role: activeRole,
        department,
        ...(activeRole === 'student' && {
          studentId: studentId.trim() || undefined,
          semester: parseInt(semester, 10) || 5,
        }),
        ...(activeRole === 'professor' && {
          employeeId: employeeId.trim() || undefined,
        }),
      };

      const res = await register(payload);
      if (res.success) {
        setSuccessMessage('Account registered successfully! Redirecting...');
      } else {
        setLocalError(res.message || 'Registration failed. Email may already be in use.');
      }
    } catch (err) {
      setLocalError('Server error while creating your account.');
    } finally {
      setSubmitting(false);
    }
  };

  // 1-Click Quick Demo Login
  const handleQuickDemo = () => {
    setEmail(currentCfg.demoEmail);
    setPassword(currentCfg.demoPass);
    switchPersona(currentCfg.demoEmail, currentCfg.demoPass);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden transition-colors duration-200">
      {/* Background ambient lighting */}
      <div className="absolute w-[32rem] h-[32rem] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl -top-24 -left-24 pointer-events-none" />
      <div className="absolute w-[32rem] h-[32rem] bg-violet-500/10 dark:bg-violet-600/10 rounded-full blur-3xl -bottom-24 -right-24 pointer-events-none" />

      {/* Top Floating Controls */}
      <div className="absolute top-6 left-6 right-6 max-w-xl mx-auto flex items-center justify-between z-20">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </div>

      <div className="w-full max-w-xl relative z-10 space-y-6 mt-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white mx-auto shadow-glow-indigo mb-3">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            EduPulse AI Authentication
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Intelligent Student Academic Monitoring & Support System
          </p>
        </div>

        {/* Role Portal Selection Tabs (Student / Faculty / Admin) */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveRole('student');
              setLocalError('');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeRole === 'student'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800/60'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveRole('professor');
              setLocalError('');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeRole === 'professor'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Faculty</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveRole('admin');
              setLocalError('');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeRole === 'admin'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Admin</span>
          </button>
        </div>

        {/* Portal Information Banner */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/80 border ${currentCfg.accentBorder}`}>
              <currentCfg.icon className="w-5 h-5 text-indigo-600 dark:text-slate-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{currentCfg.title}</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentCfg.badgeColor}`}>
                  {currentCfg.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">{currentCfg.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Sign In vs Sign Up Mode Switcher */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 px-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setLocalError('');
              }}
              className={`text-xs font-bold pb-2 -mb-2.5 border-b-2 transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-300'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Sign In with Existing Account
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setLocalError('');
              }}
              className={`text-xs font-bold pb-2 -mb-2.5 border-b-2 transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-300'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Sign Up (Create New Account)
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
            MongoDB Live Sync
          </span>
        </div>

        {/* Main Form Container */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
          {/* Alerts */}
          {(localError || authError) && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{localError || authError}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {mode === 'signin' ? (
            /* ================= SIGN IN FORM ================= */
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  University Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={`e.g. ${currentCfg.demoEmail}`}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-2.5 rounded-xl text-white font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer ${currentCfg.accentBtn}`}
              >
                <span>{submitting ? 'Authenticating...' : `Sign In as ${activeRole.toUpperCase()}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* 1-Click Fast Demo Pill */}
              <div className="pt-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Fast Demo Account: </span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] block">{currentCfg.demoEmail}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickDemo}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 font-semibold text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>One-Click Login</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* ================= SIGN UP FORM ================= */
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Legal Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aditi Verma"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  University Email Address (Use to Log In)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="e.g. aditi@edupulse.edu"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="At least 6 chars"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Academic Department
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                    <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                  </select>
                </div>
              </div>

              {/* Role-Specific Fields */}
              {activeRole === 'student' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Student Roll / ID (Optional)
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="Auto-generated if empty"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Current Semester
                    </label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {activeRole === 'professor' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Faculty Employee ID (Optional)
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="Auto-generated if empty"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-2.5 rounded-xl text-white font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer ${currentCfg.accentBtn}`}
              >
                <span>{submitting ? 'Creating Account in MongoDB...' : `Create ${activeRole.toUpperCase()} Account`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center font-medium">
                Once registered, your credentials are saved in MongoDB and you can sign in anytime with this email & password.
              </p>
            </form>
          )}

          {/* Back Navigation */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
            <button
              onClick={onBackToHome}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-slate-200 font-semibold transition-colors cursor-pointer"
            >
              ← Back to EduPulse AI Overview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
