/**
 * Enhanced Voice Mark Parsing & Adapter Service
 * Parses raw spoken transcript into structured student mark records,
 * performs multi-subject detection from speech (e.g. DBMS, OS, DSA, AI, Networks, SE),
 * extracts assessment names, matches against student rosters, and validates score ranges.
 */

// Helper to convert English words to numbers if spoken verbatim
const wordToNumberMap = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
};

const convertWordNumbers = (text) => {
  let normalized = text.toLowerCase();

  // Replace compound like "forty two" -> 42
  for (const [tensWord, tensVal] of Object.entries(wordToNumberMap)) {
    if (tensVal >= 20 && tensVal <= 90) {
      for (const [unitWord, unitVal] of Object.entries(wordToNumberMap)) {
        if (unitVal >= 1 && unitVal <= 9) {
          const phraseRegex = new RegExp(`\\b${tensWord}[\\s-]${unitWord}\\b`, 'gi');
          normalized = normalized.replace(phraseRegex, String(tensVal + unitVal));
        }
      }
    }
  }

  // Replace single words
  for (const [word, val] of Object.entries(wordToNumberMap)) {
    const singleRegex = new RegExp(`\\b${word}\\b`, 'gi');
    normalized = normalized.replace(singleRegex, String(val));
  }

  return normalized;
};

// Calculate Levenshtein similarity for fuzzy matching
const similarity = (s1, s2) => {
  const longer = s1.length < s2.length ? s2 : s1;
  const shorter = s1.length < s2.length ? s1 : s2;
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;

  const costs = [];
  for (let i = 0; i <= shorter.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= longer.length; j++) {
      if (i === 0) costs[j] = j;
      else if (j > 0) {
        let newValue = costs[j - 1];
        if (shorter.charAt(i - 1) !== longer.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[longer.length] = lastValue;
  }

  return (longerLength - costs[longer.length]) / parseFloat(longerLength);
};

// Known subject acronyms and keywords
const knownSubjectAliases = {
  CS301: ['dbms', 'database management systems', 'database management', 'database', 'databases', 'db'],
  CS302: ['os', 'operating systems', 'operating system', 'systems architecture'],
  CS303: ['dsa', 'data structures and algorithms', 'data structures & algorithms', 'data structures', 'algorithms'],
  CS304: ['ai', 'artificial intelligence', 'intelligent systems', 'machine learning', 'ml'],
  CS305: ['cn', 'computer networks', 'computer network', 'networks', 'networking', 'network'],
  CS306: ['se', 'software engineering', 'software', 'soft eng'],
};

/**
 * Detect subject from a text fragment
 */
const detectSubjectFromText = (text, allSubjects = []) => {
  const lower = text.toLowerCase();

  // 1. Check known aliases
  for (const [code, aliases] of Object.entries(knownSubjectAliases)) {
    for (const alias of aliases) {
      const regex = new RegExp(`\\b${alias}\\b`, 'i');
      if (regex.test(lower)) {
        const found = allSubjects.find((s) => s.code.toUpperCase() === code);
        if (found) {
          return { subject: found, aliasUsed: alias };
        }
      }
    }
  }

  // 2. Check dynamic subject names & codes in database
  for (const s of allSubjects) {
    const sCode = s.code.toLowerCase();
    const sName = s.name.toLowerCase();

    if (new RegExp(`\\b${sCode}\\b`, 'i').test(lower)) {
      return { subject: s, aliasUsed: s.code };
    }
    if (new RegExp(`\\b${sName}\\b`, 'i').test(lower)) {
      return { subject: s, aliasUsed: s.name };
    }

    // Check acronym (e.g. DBMS from Database Management Systems)
    const acronym = s.name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .toLowerCase();
    if (acronym.length >= 2 && new RegExp(`\\b${acronym}\\b`, 'i').test(lower)) {
      return { subject: s, aliasUsed: acronym };
    }
  }

  return { subject: null, aliasUsed: null };
};

/**
 * Detect assessment name from text fragment (e.g. "Quiz 1", "Midterm", "Assignment 2")
 */
const detectAssessmentFromText = (text) => {
  const lower = text.toLowerCase();
  
  if (/\b(midterm|mid term|mid-term|midsem|mid semester)\b/i.test(lower)) {
    return { assessment: 'Midterm Examination', cleaned: text.replace(/\b(midterm examination|midterm exam|midterm|mid term|mid-term|midsem|mid semester)\b/gi, ' ') };
  }
  if (/\b(quiz\s*1|quiz\s*one)\b/i.test(lower)) {
    return { assessment: 'Quiz 1', cleaned: text.replace(/\b(quiz\s*1|quiz\s*one)\b/gi, ' ') };
  }
  if (/\b(quiz\s*2|quiz\s*two)\b/i.test(lower)) {
    return { assessment: 'Quiz 2', cleaned: text.replace(/\b(quiz\s*2|quiz\s*two)\b/gi, ' ') };
  }
  if (/\b(quiz\s*3|quiz\s*three)\b/i.test(lower)) {
    return { assessment: 'Quiz 3', cleaned: text.replace(/\b(quiz\s*3|quiz\s*three)\b/gi, ' ') };
  }
  if (/\b(endsem|end sem|final exam|final examination|finals)\b/i.test(lower)) {
    return { assessment: 'Final Examination', cleaned: text.replace(/\b(endsem|end sem|final exam|final examination|finals)\b/gi, ' ') };
  }
  if (/\b(lab test|lab exam|lab project|lab)\b/i.test(lower)) {
    return { assessment: 'Lab Assessment', cleaned: text.replace(/\b(lab test|lab exam|lab project|lab)\b/gi, ' ') };
  }

  return { assessment: null, cleaned: text };
};

/**
 * Match a raw name string against the class roster
 */
const matchStudentToRoster = (rawName, roster) => {
  const cleaned = rawName.trim().toLowerCase().replace(/[^a-z\s]/g, '');
  if (!cleaned || cleaned.length < 2) return { match: null, status: 'NOT_FOUND', candidates: [] };

  // 1. Exact match on full name or student ID
  const exact = roster.find(
    (s) =>
      s.name.toLowerCase() === cleaned ||
      (s.studentId && s.studentId.toLowerCase() === cleaned) ||
      (s.code && s.code.toLowerCase() === cleaned)
  );
  if (exact) {
    return { match: exact, status: 'EXACT_MATCH', candidates: [exact] };
  }

  // 2. Exact match on first name if unique in roster
  const firstName = cleaned.split(/\s+/)[0];
  const firstNameMatches = roster.filter(
    (s) => s.name.toLowerCase().split(/\s+/)[0] === firstName
  );
  if (firstNameMatches.length === 1) {
    return { match: firstNameMatches[0], status: 'EXACT_MATCH', candidates: firstNameMatches };
  }

  // 3. Substring match
  const partials = roster.filter(
    (s) =>
      s.name.toLowerCase().includes(cleaned) ||
      cleaned.includes(s.name.toLowerCase())
  );
  if (partials.length === 1) {
    return { match: partials[0], status: 'PARTIAL_MATCH', candidates: partials };
  }
  if (partials.length > 1) {
    return { match: partials[0], status: 'MULTIPLE_CANDIDATES', candidates: partials };
  }

  // 4. Fuzzy similarity
  const ranked = roster
    .map((s) => ({
      student: s,
      score: similarity(cleaned, s.name.toLowerCase()),
    }))
    .filter((entry) => entry.score > 0.45)
    .sort((a, b) => b.score - a.score);

  if (ranked.length > 0 && ranked[0].score >= 0.6) {
    return {
      match: ranked[0].student,
      status: ranked.length > 1 && ranked[1].score > 0.6 ? 'MULTIPLE_CANDIDATES' : 'FUZZY_MATCH',
      candidates: ranked.map((r) => r.student),
    };
  }

  return { match: null, status: 'NOT_FOUND', candidates: [] };
};

/**
 * Clean student candidate string by removing action words, subjects, and keywords
 */
const cleanCandidateName = (text, subjectAlias = '') => {
  let cleaned = text;

  if (subjectAlias) {
    const subjRegex = new RegExp(`\\b${subjectAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    cleaned = cleaned.replace(subjRegex, ' ');
  }

  // Strip all known subject names and acronyms
  for (const aliases of Object.values(knownSubjectAliases)) {
    for (const a of aliases) {
      cleaned = cleaned.replace(new RegExp(`\\b${a}\\b`, 'gi'), ' ');
    }
  }

  // Strip action words and conversational prepositions
  cleaned = cleaned.replace(
    /\b(update|add|enter|record|give|set|please|marks|mark|scored|points|score|got|grade|for|in|is|to|student|out|of|and|the)\b/gi,
    ' '
  );

  cleaned = cleaned.replace(/[^a-zA-Z\s]/g, ' ');
  return cleaned.trim().replace(/\s+/g, ' ');
};

/**
 * Parse transcript into candidate entries with multi-subject and direct add/update support
 */
const parseTranscript = (rawText, options = {}) => {
  if (!rawText || !rawText.trim()) return [];

  const {
    defaultSubject = null,
    allSubjects = [],
    rostersBySubject = {},
    allStudents = [],
    defaultAssessmentName = 'Midterm Assessment',
  } = options;

  const convertedText = convertWordNumbers(rawText);

  // Split input into segments
  // Splits on commas, semicolons, newlines, or transitions where a number is followed by another student name
  const rawSegments = convertedText
    .split(/[,;\n]+|(?<=\b\d+(?:\.\d+)?)\s*(?:and\s+)?(?=[A-Za-z])/gi)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const results = [];
  const handledKeys = new Set();

  for (const segment of rawSegments) {
    // 1. Extract Mark (the number anchor)
    // Matches e.g. "42", "45.5", "42/50", "42 out of 50"
    const scoreMatch = segment.match(/(?:(?:marks?|score|got|scored|to|is|:)\s*)?(\b\d+(?:\.\d+)?\b)(?:\s*(?:\/|out\s+of)\s*\d+)?/i);
    if (!scoreMatch) continue;

    const markValue = parseFloat(scoreMatch[1]);

    // 2. Extract Assessment if explicitly spoken
    const { assessment: spokenAssessment, cleaned: segmentWithoutAssessment } = detectAssessmentFromText(segment);
    const finalAssessment = spokenAssessment || defaultAssessmentName;

    // 3. Extract Subject if explicitly spoken
    const { subject: spokenSubject, aliasUsed } = detectSubjectFromText(segmentWithoutAssessment, allSubjects);
    const finalSubject = spokenSubject || defaultSubject || (allSubjects.length > 0 ? allSubjects[0] : null);

    // 4. Extract Student Name
    // Remove the number from the segment to leave the name + action words
    const segmentWithoutScore = segmentWithoutAssessment.replace(scoreMatch[0], ' ');
    const candidateName = cleanCandidateName(segmentWithoutScore, aliasUsed);

    if (!candidateName || candidateName.length < 2) continue;

    // 5. Determine roster to match against
    let targetRoster = [];
    if (finalSubject && rostersBySubject[finalSubject._id.toString()]) {
      targetRoster = rostersBySubject[finalSubject._id.toString()];
    } else if (allStudents.length > 0) {
      targetRoster = allStudents;
    }

    const rosterResult = matchStudentToRoster(candidateName, targetRoster);

    const maxMark = finalSubject?.maxMark || 50;
    let validationStatus = 'VALID';
    let validationMessage = 'Ready to confirm';

    if (rosterResult.status === 'NOT_FOUND') {
      validationStatus = 'ERROR';
      validationMessage = `Student "${candidateName}" not found in roster.`;
    } else if (rosterResult.status === 'MULTIPLE_CANDIDATES') {
      validationStatus = 'AMBIGUOUS';
      validationMessage = `Multiple students matched "${candidateName}". Select correct student.`;
    } else if (markValue < 0 || markValue > maxMark) {
      validationStatus = 'ERROR';
      validationMessage = `Mark ${markValue} is outside allowed range (0 - ${maxMark}).`;
    }

    const matchedStudent = rosterResult.match;
    const matchedStudentId = matchedStudent?.studentId || matchedStudent?._id?.toString() || null;
    const subjectIdStr = finalSubject?._id?.toString() || 'default';

    const dedupeKey = `${matchedStudentId}_${subjectIdStr}_${finalAssessment}`;
    if (matchedStudentId && handledKeys.has(dedupeKey)) {
      continue;
    }
    if (matchedStudentId) handledKeys.add(dedupeKey);

    results.push({
      rawInput: segment,
      rawStudentName: candidateName,
      parsedScore: markValue,
      maxScore: maxMark,
      assessmentName: finalAssessment,
      subject: finalSubject
        ? {
            id: finalSubject._id,
            name: finalSubject.name,
            code: finalSubject.code,
            maxMark: finalSubject.maxMark || 50,
          }
        : null,
      matchedSubjectId: finalSubject?._id || null,
      matchedStudent,
      matchedStudentId,
      matchedUserId: matchedStudent?.userId?._id || matchedStudent?.userId || null,
      candidates: rosterResult.candidates,
      matchConfidence: rosterResult.status,
      status: validationStatus,
      message: validationMessage,
      confirmed: validationStatus === 'VALID',
    });
  }

  return results;
};

module.exports = {
  parseTranscript,
  matchStudentToRoster,
  detectSubjectFromText,
  detectAssessmentFromText,
  convertWordNumbers,
  cleanCandidateName,
};
