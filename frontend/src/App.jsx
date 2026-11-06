import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';

// Layout
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import CopilotDrawer from './components/copilot/CopilotDrawer';

// Public pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import SubjectRiskCenter from './pages/student/SubjectRiskCenter';
import AttendanceIntelligence from './pages/student/AttendanceIntelligence';
import WhatIfSimulator from './pages/student/WhatIfSimulator';
import StudentMarks from './pages/student/StudentMarks';

// Professor pages
import ProfessorDashboard from './pages/professor/ProfessorDashboard';
import VoiceMarkEntry from './pages/professor/VoiceMarkEntry';
import AttendanceEntry from './pages/professor/AttendanceEntry';
import ProfessorMarksEntry from './pages/professor/ProfessorMarksEntry';
import AtRiskStudents from './pages/professor/AtRiskStudents';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import RiskMonitor from './pages/admin/RiskMonitor';
import UniversityManagement from './pages/admin/UniversityManagement';
import AuditLogs from './pages/admin/AuditLogs';
import DatabaseExplorer from './pages/admin/DatabaseExplorer';

// Shared Profile, Learning Resources & Exams & Results pages
import ProfilePage from './pages/shared/ProfilePage';
import LearningResources from './pages/shared/LearningResources';
import ExamsAndResults from './pages/shared/ExamsAndResults';

export default function App() {
  const { user, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRole, setLoginRole] = useState('student');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // If loading user session
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="font-semibold text-sm">Initializing EduPulse AI Environment...</span>
        </div>
      </div>
    );
  }

  // If unauthenticated: show Landing Page or Login Page
  if (!user) {
    if (showLoginModal) {
      return (
        <LoginPage
          initialRole={loginRole}
          onBackToHome={() => setShowLoginModal(false)}
        />
      );
    }
    return (
      <LandingPage
        onGoToLogin={(role) => {
          const targetRole = (typeof role === 'string' && ['student', 'professor', 'admin'].includes(role)) ? role : 'student';
          setLoginRole(targetRole);
          setShowLoginModal(true);
        }}
      />
    );
  }

  // Role-based main content router
  const renderContent = () => {
    // Shared modules across all roles
    if (currentTab === 'profile') {
      return <ProfilePage />;
    }
    if (currentTab === 'learning-resources') {
      return <LearningResources />;
    }
    if (currentTab === 'exams-results') {
      return <ExamsAndResults />;
    }

    // 1. Student Portal
    if (user.role === 'student') {
      switch (currentTab) {
        case 'dashboard':
          return (
            <StudentDashboard
              onSelectTab={setCurrentTab}
              onSelectSubject={setSelectedSubjectId}
            />
          );
        case 'risk-center':
          return <SubjectRiskCenter selectedSubjectId={selectedSubjectId} />;
        case 'attendance':
          return <AttendanceIntelligence onSelectTab={setCurrentTab} />;
        case 'what-if':
          return <WhatIfSimulator />;
        case 'marks':
          return <StudentMarks />;
        default:
          return <StudentDashboard onSelectTab={setCurrentTab} onSelectSubject={setSelectedSubjectId} />;
      }
    }

    // 2. Professor Portal
    if (user.role === 'professor') {
      switch (currentTab) {
        case 'dashboard':
          return <ProfessorDashboard onSelectTab={setCurrentTab} />;
        case 'voice-marks':
          return <VoiceMarkEntry />;
        case 'attendance-entry':
          return <AttendanceEntry />;
        case 'marks-entry':
          return <ProfessorMarksEntry />;
        case 'at-risk':
          return <AtRiskStudents />;
        default:
          return <ProfessorDashboard onSelectTab={setCurrentTab} />;
      }
    }

    // 3. Admin Portal
    if (user.role === 'admin') {
      switch (currentTab) {
        case 'dashboard':
          return <AdminDashboard onSelectTab={setCurrentTab} />;
        case 'risk-monitor':
          return <RiskMonitor />;
        case 'management':
          return <UniversityManagement />;
        case 'db-explorer':
          return <DatabaseExplorer />;
        case 'audit-logs':
          return <AuditLogs />;
        default:
          return <AdminDashboard onSelectTab={setCurrentTab} />;
      }
    }

    return <div>Unknown user role.</div>;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar
        onOpenCopilot={() => setIsCopilotOpen((prev) => !prev)}
        isCopilotOpen={isCopilotOpen}
        onSelectTab={setCurrentTab}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenCopilot={() => setIsCopilotOpen((prev) => !prev)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderContent()}
        </main>
      </div>

      {/* Global Academic AI Copilot Drawer */}
      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onOpen={() => setIsCopilotOpen(true)}
      />
    </div>
  );
}
