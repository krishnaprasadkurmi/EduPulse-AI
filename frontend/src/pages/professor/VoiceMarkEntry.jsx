import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { voiceApi } from '../../api/voiceApi';
import { adminApi } from '../../api/adminApi';
import {
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Send,
  HelpCircle,
  FileAudio,
  ListPlus,
  RefreshCw,
  Zap,
  Volume2,
  VolumeX,
  BookOpen,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function VoiceMarkEntry() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('auto');
  const [assessmentName, setAssessmentName] = useState('Midterm Examination');

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  // Parsing & Confirmation table
  const [isParsing, setIsParsing] = useState(false);
  const [parsedCandidates, setParsedCandidates] = useState([]);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [voiceAudioFeedback, setVoiceAudioFeedback] = useState(true);

  // Sample phrases showcasing direct multi-subject spoken commands
  const samplePhrases = [
    'Rahul Sharma, DBMS, 42.',
    'Priya Singh, Operating Systems, 45.',
    'Update Arjun Kumar DSA marks to 48.',
    'Neha Gupta, AI, 44.',
    'Rahul Sharma DBMS 42, Priya Singh OS 46, Arjun Kumar DSA 49.',
  ];

  // Fetch professor assigned subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await adminApi.getSubjects();
        if (res.success) {
          const profSubjs = res.data || [];
          setSubjects(profSubjs);
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
      }
    };
    fetchSubjects();
  }, [user]);

  // Setup Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let current = '';
      for (let i = 0; i < event.results.length; i++) {
        current += event.results[i][0].transcript + ' ';
      }
      setTranscript(current.trim());
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Browser speech recognition is not supported in this browser. Please use the text input or sample phrases below.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      setErrorMsg('');
      setSaveSuccessMessage('');
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
      }
    }
  };

  // Speaks aloud confirmation using Web Speech Synthesis
  const speakFeedback = (text) => {
    if (!voiceAudioFeedback || !('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  };

  // Main action: Parse preview OR Direct Save
  const handleVoiceAction = async (directSave = false) => {
    if (!transcript.trim()) {
      setErrorMsg('Please speak or enter a mark command (e.g. "Rahul Sharma, DBMS, 42").');
      return;
    }

    try {
      setIsParsing(true);
      setErrorMsg('');
      setSaveSuccessMessage('');

      const res = await voiceApi.parseVoiceInput({
        rawTranscript: transcript,
        subjectId: selectedSubjectId || 'auto',
        assessmentName,
        directSave,
      });

      if (res.success) {
        if (directSave && res.directSaved) {
          // Direct Auto-Save Completed!
          setSaveSuccessMessage(
            res.speechSummary || `Successfully saved ${res.savedCount} marks directly to MongoDB!`
          );
          setParsedCandidates([]);
          setTranscript('');
          speakFeedback(res.speechSummary || `Marks saved successfully for ${res.savedCount} student.`);
        } else {
          // Preview Mode for explicit faculty confirmation
          setParsedCandidates(res.candidates || []);
          if (!res.candidates || res.candidates.length === 0) {
            setErrorMsg('No students or scores recognized in the speech. Try saying: "Rahul Sharma, DBMS, 42".');
          }
        }
      } else {
        setErrorMsg(res.message || 'Failed to process voice input');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Server error while parsing speech');
    } finally {
      setIsParsing(false);
    }
  };

  const handleUpdateCandidateScore = (index, newScore) => {
    const updated = [...parsedCandidates];
    const scoreVal = parseFloat(newScore);
    updated[index].parsedScore = isNaN(scoreVal) ? 0 : scoreVal;
    const max = updated[index].maxScore || 50;
    if (updated[index].parsedScore >= 0 && updated[index].parsedScore <= max) {
      updated[index].status = 'VALID';
      updated[index].message = updated[index].isUpdate
        ? `Will update score from ${updated[index].previousScore}/${max} to ${updated[index].parsedScore}/${max}`
        : `Ready to confirm (${updated[index].parsedScore}/${max})`;
    } else {
      updated[index].status = 'ERROR';
      updated[index].message = `Score exceeds maximum (${max})`;
    }
    setParsedCandidates(updated);
  };

  const handleSelectAmbiguousStudent = (index, student) => {
    const updated = [...parsedCandidates];
    updated[index].matchedStudent = student;
    updated[index].matchedStudentId = student._id || student.studentId;
    updated[index].matchedUserId = student.userId;
    updated[index].status = 'VALID';
    updated[index].message = 'Selected from candidates list';
    setParsedCandidates(updated);
  };

  const handleToggleConfirmRow = (index) => {
    const updated = [...parsedCandidates];
    updated[index].confirmed = !updated[index].confirmed;
    setParsedCandidates(updated);
  };

  // Commit from confirmation preview table
  const handleConfirmAndSave = async () => {
    const validToSave = parsedCandidates.filter(
      (c) => c.confirmed && c.status === 'VALID' && c.matchedStudentId
    );

    if (validToSave.length === 0) {
      setErrorMsg('No valid candidates selected for confirmation.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg('');

      const confirmedEntries = validToSave.map((c) => ({
        studentId: c.matchedStudentId,
        subjectId: c.matchedSubjectId || selectedSubjectId,
        assessmentName: c.assessmentName || assessmentName,
        score: c.parsedScore,
        maxScore: c.maxScore,
      }));

      const res = await voiceApi.confirmVoiceMarks({
        subjectId: selectedSubjectId === 'auto' ? undefined : selectedSubjectId,
        assessmentName,
        confirmedEntries,
      });

      if (res.success) {
        setSaveSuccessMessage(
          res.speechSummary || `Success! Saved ${res.savedCount} marks to MongoDB. Notifications sent and risk scores recalculated.`
        );
        speakFeedback(res.speechSummary || `Confirmed and saved ${res.savedCount} marks.`);
        setParsedCandidates([]);
        setTranscript('');
      } else {
        setErrorMsg(res.message || 'Failed to save marks');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Server error confirming marks');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> AI Audio-Assisted Mark Entry (Natural Speech)
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Voice Mark Entry & Update</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Directly add or update student marks by simply speaking: <span className="font-semibold text-indigo-300">"[Student Name], [Subject], [Marks]"</span> (e.g. <em>"Rahul Sharma, DBMS, 42"</em>).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setVoiceAudioFeedback(!voiceAudioFeedback)}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
            voiceAudioFeedback
              ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          title="Toggle audio speech confirmation voice"
        >
          {voiceAudioFeedback ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4" />}
          <span>{voiceAudioFeedback ? 'Voice Audio: ON' : 'Voice Audio: OFF'}</span>
        </button>
      </div>

      {/* Configuration Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Select Target Subject / Course:</span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">Auto-detect supported</span>
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-colors"
          >
            <option value="auto">✨ Auto-Detect Subject from Speech (DBMS, OS, DSA, AI, Networks, SE)</option>
            {subjects.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.code} - {sub.name} (Max: {sub.maxMark || 50} pts)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Default Assessment Name:
          </label>
          <input
            type="text"
            value={assessmentName}
            onChange={(e) => setAssessmentName(e.target.value)}
            placeholder="e.g. Midterm Examination, Quiz 1, Quiz 2"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-colors"
          />
        </div>
      </div>

      {/* Voice & Transcript Input Area */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-4 rounded-2xl transition-all flex items-center justify-center cursor-pointer shadow-sm ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse shadow-glow-red ring-4 ring-rose-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow-indigo'
              }`}
              title={isRecording ? 'Click to stop recording' : 'Click to start voice recording'}
            >
              {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{isRecording ? 'Listening for speech...' : 'Microphone Ready'}</span>
                {isRecording && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-[10px] text-rose-500 dark:text-rose-400 uppercase font-mono font-bold">LIVE MIC</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {isRecording
                  ? 'Say student name, subject, and marks (e.g. "Rahul Sharma, DBMS, 42.")'
                  : 'Click mic to speak hands-free, or choose a sample phrase below.'}
              </p>
            </div>
          </div>

          {/* Action Buttons: Direct Add/Update vs Parse Preview */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleVoiceAction(true)}
              disabled={isParsing || !transcript.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
              title="Immediately add or update mark in MongoDB without additional clicks"
            >
              {isParsing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              )}
              <span>Direct Add / Update</span>
            </button>

            <button
              onClick={() => handleVoiceAction(false)}
              disabled={isParsing || !transcript.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
              title="Review in table before saving"
            >
              {isParsing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Review & Confirm</span>
            </button>
          </div>
        </div>

        {/* Live Audio Pulse Waves Animation when recording */}
        {isRecording && (
          <div className="h-10 bg-slate-100 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1.5 px-4">
            <span className="w-1 bg-indigo-500 rounded-full animate-sound-wave" style={{ animationDelay: '0.1s' }} />
            <span className="w-1 bg-indigo-400 rounded-full animate-sound-wave" style={{ animationDelay: '0.3s' }} />
            <span className="w-1 bg-violet-400 rounded-full animate-sound-wave" style={{ animationDelay: '0.2s' }} />
            <span className="w-1 bg-indigo-500 rounded-full animate-sound-wave" style={{ animationDelay: '0.4s' }} />
            <span className="w-1 bg-violet-500 rounded-full animate-sound-wave" style={{ animationDelay: '0.15s' }} />
            <span className="w-1 bg-indigo-400 rounded-full animate-sound-wave" style={{ animationDelay: '0.35s' }} />
            <span className="text-xs text-indigo-600 dark:text-indigo-300 font-mono ml-3">Listening to audio stream in real-time...</span>
          </div>
        )}

        {/* Text Transcript Box (Editable & Speech Feedback) */}
        <div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={3}
            placeholder='Spoken text will appear here automatically, or enter e.g.: "Rahul Sharma, DBMS, 42" or "Update Priya Singh Operating Systems to 45"'
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono transition-colors"
          />
        </div>

        {/* Sample Voice Snippets for 1-Click Demo Evaluation */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-400 flex items-center gap-1.5">
            <FileAudio className="w-3.5 h-3.5 text-indigo-500" />
            <span>Try Quick 1-Click Spoken Phrases:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {samplePhrases.map((phrase, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTranscript(phrase)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700 text-[11px] transition-colors font-mono cursor-pointer font-medium"
              >
                "{phrase}"
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {saveSuccessMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-emerald-700 dark:text-emerald-300">Database Transaction Committed</strong>
              {saveSuccessMessage}
            </div>
          </div>
        )}
      </div>

      {/* Mandatory Safe Confirmation Preview Table (Section 7 Acceptance Criteria) */}
      {parsedCandidates.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-indigo-500/30 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Step 2: Safe Confirmation Preview Table
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Review matched students and detected subjects before committing to MongoDB.
              </p>
            </div>

            <button
              onClick={handleConfirmAndSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow-emerald flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{isSaving ? 'Writing to MongoDB...' : 'Confirm & Save All Marks'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="pb-3 font-semibold w-12 text-center">Confirm</th>
                  <th className="pb-3 font-semibold">Spoken Input</th>
                  <th className="pb-3 font-semibold">Matched Student</th>
                  <th className="pb-3 font-semibold">Detected Subject</th>
                  <th className="pb-3 font-semibold">Score / Max</th>
                  <th className="pb-3 font-semibold">Action / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {parsedCandidates.map((candidate, idx) => {
                  const isValid = candidate.status === 'VALID';
                  const isAmbiguous = candidate.status === 'AMBIGUOUS';

                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        !candidate.confirmed ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={candidate.confirmed}
                          onChange={() => handleToggleConfirmRow(idx)}
                          className="w-4 h-4 accent-indigo-600 cursor-pointer rounded"
                        />
                      </td>

                      <td className="py-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        "{candidate.rawInput}"
                      </td>

                      <td className="py-3.5">
                        {isAmbiguous ? (
                          <div className="space-y-1">
                            <span className="text-amber-600 dark:text-amber-400 text-[11px] font-semibold block">
                              Select from roster candidates:
                            </span>
                            <select
                              onChange={(e) => {
                                const found = candidate.candidates?.find(
                                  (c) => (c._id || c.studentId) === e.target.value
                                );
                                if (found) handleSelectAmbiguousStudent(idx, found);
                              }}
                              className="bg-slate-50 dark:bg-slate-950 border border-amber-500/50 rounded-lg px-2 py-1 text-xs text-amber-900 dark:text-amber-200"
                            >
                              <option value="">Choose student...</option>
                              {candidate.candidates?.map((c) => (
                                <option key={c._id || c.studentId} value={c._id || c.studentId}>
                                  {c.name} ({c.code || c.studentId})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : candidate.matchedStudent ? (
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {candidate.matchedStudent.name}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                              ID: {candidate.matchedStudent.code || candidate.matchedStudent.studentId || 'Enrolled'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">
                            Unknown Student ("{candidate.rawStudentName}")
                          </span>
                        )}
                      </td>

                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                            {candidate.subject?.code || 'CS301'}
                          </span>
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[140px]" title={candidate.subject?.name}>
                            {candidate.subject?.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5 font-mono">
                          <input
                            type="number"
                            value={candidate.parsedScore}
                            onChange={(e) => handleUpdateCandidateScore(idx, e.target.value)}
                            className="w-16 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-sm font-bold text-indigo-700 dark:text-indigo-300 focus:outline-none focus:border-indigo-500"
                            min="0"
                            max={candidate.maxScore || 50}
                          />
                          <span className="text-slate-500 dark:text-slate-400">/ {candidate.maxScore || 50}</span>
                        </div>
                      </td>

                      <td className="py-3.5">
                        {candidate.isUpdate ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
                              <TrendingUp className="w-3 h-3" /> Update ({candidate.previousScore} ➔ {candidate.parsedScore})
                            </span>
                            <span className="text-[10px] text-slate-500 block">Existing mark replaced</span>
                          </div>
                        ) : isValid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                            <CheckCircle2 className="w-3 h-3" /> New Entry
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40">
                            <AlertTriangle className="w-3 h-3" /> {candidate.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
