const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');

// Models
const User = require('../src/models/User');
const Student = require('../src/models/Student');
const Professor = require('../src/models/Professor');
const Subject = require('../src/models/Subject');
const Enrollment = require('../src/models/Enrollment');
const Attendance = require('../src/models/Attendance');
const Mark = require('../src/models/Mark');
const Assignment = require('../src/models/Assignment');
const RiskScore = require('../src/models/RiskScore');
const Notification = require('../src/models/Notification');
const AuditLog = require('../src/models/AuditLog');
const LearningResource = require('../src/models/LearningResource');
const Exam = require('../src/models/Exam');
const Result = require('../src/models/Result');
const GradeHistory = require('../src/models/GradeHistory');
const storageAdapter = require('../src/services/storageAdapter');

// Services
const { analyzeAttendanceTrend } = require('../src/services/attendanceService');
const { calculateSubjectRisk } = require('../src/services/riskService');

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Professor.deleteMany({}),
      Subject.deleteMany({}),
      Enrollment.deleteMany({}),
      Attendance.deleteMany({}),
      Mark.deleteMany({}),
      Assignment.deleteMany({}),
      RiskScore.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
      LearningResource.deleteMany({}),
      Exam.deleteMany({}),
      Result.deleteMany({}),
      GradeHistory.deleteMany({}),
    ]);

    const studentPasswordHash = await bcrypt.hash('student123', 10);
    const profPasswordHash = await bcrypt.hash('prof123', 10);
    const adminPasswordHash = await bcrypt.hash('admin123', 10);

    // 1. Create Admin
    const adminUser = await User.create({
      name: 'Dr. Aris Thorne (Academic Dean)',
      email: 'admin@edupulse.edu',
      whatsappNumber: '+919876543200',
      gmail: 'admin@edupulse.edu',
      passwordHash: adminPasswordHash,
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      department: 'Dean of Academic Affairs',
    });

    // 2. Create Professors
    const profData = [
      {
        name: 'Prof. Rajesh Sharma',
        email: 'prof.sharma@edupulse.edu',
        whatsappNumber: '+919876543201',
        gmail: 'prof.sharma@edupulse.edu',
        employeeId: 'FAC1001',
        designation: 'Senior Professor of Database Systems',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      },
      {
        name: 'Prof. Anita Desai',
        email: 'prof.desai@edupulse.edu',
        whatsappNumber: '+919876543202',
        gmail: 'prof.desai@edupulse.edu',
        employeeId: 'FAC1002',
        designation: 'Associate Professor of Systems Architecture',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      },
      {
        name: 'Prof. Vikram Sen',
        email: 'prof.sen@edupulse.edu',
        whatsappNumber: '+919876543203',
        gmail: 'prof.sen@edupulse.edu',
        employeeId: 'FAC1003',
        designation: 'Head of Intelligent Systems',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      },
    ];

    const professors = [];
    for (const p of profData) {
      const u = await User.create({
        name: p.name,
        email: p.email,
        whatsappNumber: p.whatsappNumber,
        gmail: p.gmail,
        passwordHash: profPasswordHash,
        role: 'professor',
        avatar: p.avatar,
        department: 'Computer Science & Engineering',
      });
      const profProfile = await Professor.create({
        userId: u._id,
        employeeId: p.employeeId,
        designation: p.designation,
        assignedSubjectIds: [],
      });
      professors.push({ user: u, profile: profProfile });
    }

    // 3. Create Subjects
    const subjectList = [
      {
        code: 'CS301',
        name: 'Database Management Systems',
        semester: 5,
        credits: 4,
        maxMark: 50,
        profIndex: 0, // Prof. Rajesh Sharma
      },
      {
        code: 'CS302',
        name: 'Operating Systems',
        semester: 5,
        credits: 4,
        maxMark: 50,
        profIndex: 1, // Prof. Anita Desai
      },
      {
        code: 'CS303',
        name: 'Data Structures & Algorithms',
        semester: 5,
        credits: 4,
        maxMark: 50,
        profIndex: 0, // Prof. Rajesh Sharma
      },
      {
        code: 'CS304',
        name: 'Artificial Intelligence',
        semester: 5,
        credits: 3,
        maxMark: 50,
        profIndex: 2, // Prof. Vikram Sen
      },
      {
        code: 'CS305',
        name: 'Computer Networks',
        semester: 5,
        credits: 4,
        maxMark: 50,
        profIndex: 1, // Prof. Anita Desai
      },
      {
        code: 'CS306',
        name: 'Software Engineering',
        semester: 5,
        credits: 3,
        maxMark: 50,
        profIndex: 2, // Prof. Vikram Sen
      },
    ];

    const subjects = [];
    for (const s of subjectList) {
      const assignedProf = professors[s.profIndex].profile;
      const sub = await Subject.create({
        code: s.code,
        name: s.name,
        semester: s.semester,
        credits: s.credits,
        maxMark: s.maxMark,
        professorIds: [assignedProf._id],
      });

      // Update professor's assigned list
      assignedProf.assignedSubjectIds.push(sub._id);
      await assignedProf.save();

      subjects.push(sub);
    }

    // 4. Create Students (12 distinct realistic students with various risk profiles)
    const rawStudents = [
      {
        name: 'Rahul Sharma',
        email: 'rahul@edupulse.edu',
        studentId: 'STU2024001',
        cgpa: 6.4,
        phone: '+1-555-0101',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      },
      {
        name: 'Priya Singh',
        email: 'priya@edupulse.edu',
        studentId: 'STU2024002',
        cgpa: 7.2,
        phone: '+1-555-0102',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      },
      {
        name: 'Arjun Kumar',
        email: 'arjun@edupulse.edu',
        studentId: 'STU2024003',
        cgpa: 8.9,
        phone: '+1-555-0103',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
      },
      {
        name: 'Ananya Patel',
        email: 'ananya@edupulse.edu',
        studentId: 'STU2024004',
        cgpa: 9.3,
        phone: '+1-555-0104',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      },
      {
        name: 'Rohan Verma',
        email: 'rohan@edupulse.edu',
        studentId: 'STU2024005',
        cgpa: 6.8,
        phone: '+1-555-0105',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      },
      {
        name: 'Sneha Iyer',
        email: 'sneha@edupulse.edu',
        studentId: 'STU2024006',
        cgpa: 8.4,
        phone: '+1-555-0106',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
      },
      {
        name: 'Vikram Mehta',
        email: 'vikram@edupulse.edu',
        studentId: 'STU2024007',
        cgpa: 7.0,
        phone: '+1-555-0107',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
      },
      {
        name: 'Neha Gupta',
        email: 'neha@edupulse.edu',
        studentId: 'STU2024008',
        cgpa: 8.1,
        phone: '+1-555-0108',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      },
      {
        name: 'Aditya Rao',
        email: 'aditya@edupulse.edu',
        studentId: 'STU2024009',
        cgpa: 5.8,
        phone: '+1-555-0109',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      },
      {
        name: 'Pooja Nair',
        email: 'pooja@edupulse.edu',
        studentId: 'STU2024010',
        cgpa: 7.7,
        phone: '+1-555-0110',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
      {
        name: 'Karan Malhotra',
        email: 'karan@edupulse.edu',
        studentId: 'STU2024011',
        cgpa: 6.1,
        phone: '+1-555-0111',
        avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
      },
      {
        name: 'Meera Joshi',
        email: 'meera@edupulse.edu',
        studentId: 'STU2024012',
        cgpa: 8.6,
        phone: '+1-555-0112',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      },
    ];

    const students = [];
    for (const raw of rawStudents) {
      const u = await User.create({
        name: raw.name,
        email: raw.email,
        whatsappNumber: '+919876543210',
        gmail: raw.email,
        passwordHash: studentPasswordHash,
        role: 'student',
        avatar: raw.avatar,
        department: 'Computer Science & Engineering',
      });

      const s = await Student.create({
        userId: u._id,
        studentId: raw.studentId,
        department: 'Computer Science & Engineering',
        program: 'B.Tech in Computer Science & Engineering',
        semester: 5,
        batch: '2023-2027',
        academicYear: '2024-2025',
        enrollmentStatus: 'Active',
        phone: raw.phone,
        whatsappNumber: '+919876543210',
        gmail: raw.email,
        cgpa: raw.cgpa,
      });

      students.push({ user: u, student: s });
    }

    // 5. Enroll Students in Subjects
    for (const stud of students) {
      for (const subj of subjects) {
        await Enrollment.create({
          studentId: stud.student._id,
          subjectId: subj._id,
          semester: 5,
          academicYear: '2025-2026',
        });
      }
    }

    // 6. Create Assignments for Subjects
    const assignmentsCreated = [];
    for (const subj of subjects) {
      const a1 = await Assignment.create({
        subjectId: subj._id,
        title: `${subj.code} Problem Set 1: Theoretical Foundations`,
        dueDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        maxScore: 100,
      });
      const a2 = await Assignment.create({
        subjectId: subj._id,
        title: `${subj.code} Lab Project: Implementation & Analysis`,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxScore: 100,
      });
      assignmentsCreated.push(a1, a2);
    }

    // 7. Generate Attendance History & Trends
    // Blueprint rule:
    // Rahul Sharma in DBMS (CS301) must have:
    // - 72.0% attendance
    // - downward trend (-6.2% over recent classes)
    // - projected attendance 70.8%
    // - status: CRITICAL
    // - recommendation: Attend the next 5 classes.
    // Conducted classes: 25. Attended: 18 (18 / 25 = 72.0%)
    // Last 5 classes: only 2 attended (40%), earlier 20 classes: 16 attended (80%) -> trend: 40 - 80 = -40% downward!
    console.log('[Seed] Populating realistic attendance histories and trends...');

    const dbmsSubj = subjects[0]; // CS301
    const osSubj = subjects[1];   // CS302
    const dsaSubj = subjects[2];  // CS303
    const aiSubj = subjects[3];   // CS304
    const profRajesh = professors[0].user;

    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 35); // 35 days ago

    // Seed attendance for Rahul Sharma in DBMS (CS301)
    const rahul = students[0];
    const rahulDbmsAttendance = [];
    // 25 sessions: first 20 had 16 presents, 4 absents. Last 5 had 2 presents, 3 absents. Total presents = 18. 18 / 25 = 72%
    for (let i = 0; i < 25; i++) {
      const d = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
      d.setHours(10, 0, 0, 0);

      let status = 'present';
      if (i === 3 || i === 8 || i === 12 || i === 17) {
        status = 'absent';
      }
      if (i >= 20) {
        // Last 5 classes: 2 presents, 3 absents
        status = (i === 21 || i === 24) ? 'present' : 'absent';
      }

      const att = await Attendance.create({
        studentId: rahul.student._id,
        subjectId: dbmsSubj._id,
        date: d,
        status,
        recordedBy: profRajesh._id,
      });
      rahulDbmsAttendance.push(att);
    }

    // Seed attendance for other subjects for Rahul (e.g. OS near 76%, DSA safe 88%)
    for (let i = 0; i < 25; i++) {
      const d = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
      // OS: 19/25 = 76% (Near 75% warning)
      await Attendance.create({
        studentId: rahul.student._id,
        subjectId: osSubj._id,
        date: d,
        status: i % 4 === 0 ? 'absent' : 'present',
        recordedBy: professors[1].user._id,
      });
      // DSA: 22/25 = 88% (Safe)
      await Attendance.create({
        studentId: rahul.student._id,
        subjectId: dsaSubj._id,
        date: d,
        status: (i === 5 || i === 15 || i === 23) ? 'absent' : 'present',
        recordedBy: profRajesh._id,
      });
    }

    // Seed attendance for remaining students
    for (let sIdx = 1; sIdx < students.length; sIdx++) {
      const curStudent = students[sIdx];
      // Priya Singh (index 1): OS near 74%
      // Arjun Kumar (index 2): DSA 92% safe
      // Ananya Patel (index 3): 96% safe
      for (const subj of subjects) {
        for (let i = 0; i < 20; i++) {
          const d = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
          let isPresent = true;
          if (sIdx === 1 && subj.code === 'CS302') {
            // Priya in OS: 74%
            isPresent = i % 4 !== 0;
          } else if (sIdx === 8) {
            // Aditya Rao: low attendance across the board
            isPresent = i % 3 !== 0;
          } else {
            // Most other students safe
            isPresent = Math.random() > 0.15;
          }

          await Attendance.create({
            studentId: curStudent.student._id,
            subjectId: subj._id,
            date: d,
            status: isPresent ? 'present' : 'absent',
            recordedBy: profRajesh._id,
          });
        }
      }
    }

    // 8. Seed Marks
    console.log('[Seed] Populating assessment marks...');
    // Rahul Sharma DBMS marks:
    // Quiz 1: 18/50 (low)
    // Quiz 2: 15/50 (declining trend)
    // Lab Assessment: 16/50
    await Mark.create({
      studentId: rahul.student._id,
      subjectId: dbmsSubj._id,
      assessmentName: 'Quiz 1 (Relational Algebra)',
      score: 18,
      maxScore: 50,
      weight: 15,
      enteredBy: profRajesh._id,
    });
    await Mark.create({
      studentId: rahul.student._id,
      subjectId: dbmsSubj._id,
      assessmentName: 'Quiz 2 (Normalization & SQL)',
      score: 15,
      maxScore: 50,
      weight: 15,
      enteredBy: profRajesh._id,
    });

    // Seed Marks for Priya Singh, Arjun Kumar, Ananya Patel, etc.
    // Priya Singh: OS Quiz 1: 28/50, Midterm: 29/50 (Medium risk)
    await Mark.create({
      studentId: students[1].student._id,
      subjectId: osSubj._id,
      assessmentName: 'Quiz 1 (Processes & Threads)',
      score: 28,
      maxScore: 50,
      weight: 20,
      enteredBy: professors[1].user._id,
    });

    // Arjun Kumar: DSA Quiz 1: 46/50, Midterm: 48/50 (Low risk)
    await Mark.create({
      studentId: students[2].student._id,
      subjectId: dsaSubj._id,
      assessmentName: 'Midterm (Trees & Dynamic Programming)',
      score: 48,
      maxScore: 50,
      weight: 30,
      enteredBy: profRajesh._id,
    });

    // Ananya Patel: AI Quiz 1: 49/50 (Low risk)
    await Mark.create({
      studentId: students[3].student._id,
      subjectId: aiSubj._id,
      assessmentName: 'Quiz 1 (Heuristic Search)',
      score: 49,
      maxScore: 50,
      weight: 20,
      enteredBy: professors[2].user._id,
    });

    // Fill realistic marks for other enrolled students
    for (let sIdx = 4; sIdx < students.length; sIdx++) {
      const curStudent = students[sIdx];
      for (const subj of subjects) {
        const randScore = Math.floor(25 + Math.random() * 22);
        await Mark.create({
          studentId: curStudent.student._id,
          subjectId: subj._id,
          assessmentName: 'Midterm Examination',
          score: randScore,
          maxScore: 50,
          weight: 30,
          enteredBy: profRajesh._id,
        });
      }
    }

    // 9. Calculate and Store Explainable Risk Scores
    console.log('[Seed] Computing and storing academic risk scores...');
    for (const stud of students) {
      for (const subj of subjects) {
        const records = await Attendance.find({ studentId: stud.student._id, subjectId: subj._id }).sort({ date: 1 });
        const stats = analyzeAttendanceTrend(records);
        const marks = await Mark.find({ studentId: stud.student._id, subjectId: subj._id });
        const assignments = await Assignment.find({ subjectId: subj._id });

        const calculated = calculateSubjectRisk({
          attendanceStats: stats,
          marks,
          assignments,
          studentCGPA: stud.student.cgpa,
        });

        await RiskScore.create({
          studentId: stud.student._id,
          subjectId: subj._id,
          score: calculated.score,
          level: calculated.level,
          factors: calculated.factors,
          insights: calculated.insights,
          recommendations: calculated.recommendations,
          calculatedAt: new Date(),
        });
      }
    }

    // 10. Seed Notifications for Rahul Sharma & Others
    console.log('[Seed] Populating initial notifications with WhatsApp & Email delivery status...');
    const now = Date.now();
    await Notification.create({
      userId: rahul.user._id,
      type: 'ATTENDANCE_CRITICAL',
      title: 'Critical Attendance Alert: CS301 Database Management Systems',
      message: 'Your attendance is currently 72.0% (downward trend). You must attend the next 5 consecutive classes to reach 75%.',
      channels: {
        whatsapp: {
          sent: true,
          status: 'SENT',
          timestamp: new Date(now - 3600 * 1000 * 4),
          recipient: '+919876543210',
        },
        email: {
          sent: true,
          status: 'SENT',
          timestamp: new Date(now - 3600 * 1000 * 4),
          recipient: 'rahul@edupulse.edu',
        },
      },
      metadata: { subjectId: dbmsSubj._id, percentage: 72.0, status: 'CRITICAL', requiredClasses: 5 },
      createdAt: new Date(now - 3600 * 1000 * 4),
    });

    await Notification.create({
      userId: rahul.user._id,
      type: 'RISK_HIGH',
      title: 'Academic Risk Alert: CS301 DBMS (Risk Score: 78/100)',
      message: 'High risk detected due to attendance below 75% and declining assessment scores. Immediate intervention recommended.',
      channels: {
        whatsapp: {
          sent: true,
          status: 'SENT',
          timestamp: new Date(now - 3600 * 1000 * 2),
          recipient: '+919876543210',
        },
        email: {
          sent: true,
          status: 'SENT',
          timestamp: new Date(now - 3600 * 1000 * 2),
          recipient: 'rahul@edupulse.edu',
        },
      },
      metadata: { subjectId: dbmsSubj._id, score: 78 },
      createdAt: new Date(now - 3600 * 1000 * 2),
    });

    await Notification.create({
      userId: rahul.user._id,
      type: 'MARK_CREATED',
      title: 'New Mark Recorded: CS301 DBMS',
      message: 'Prof. Rajesh Sharma has entered your score for Quiz 2: 15/50.',
      channels: {
        whatsapp: {
          sent: true,
          status: 'SENT',
          timestamp: new Date(now - 3600 * 1000 * 1),
          recipient: '+919876543210',
        },
        email: {
          sent: true,
          status: 'SENT',
          timestamp: new Date(now - 3600 * 1000 * 1),
          recipient: 'rahul@edupulse.edu',
        },
      },
      metadata: { subjectId: dbmsSubj._id, score: 15, maxScore: 50 },
      createdAt: new Date(now - 3600 * 1000 * 1),
    });

    // 11. Initial Audit Logs
    console.log('[Seed] Populating initial audit logs...');
    await AuditLog.create({
      actorId: profRajesh._id,
      action: 'CREATE_MARK',
      entityType: 'Mark',
      entityId: dbmsSubj._id,
      metadata: {
        subject: 'CS301 Database Management Systems',
        assessment: 'Quiz 2 (Normalization & SQL)',
        recordsCount: 12,
      },
      createdAt: new Date(Date.now() - 3600 * 1000 * 2),
    });

    await AuditLog.create({
      actorId: adminUser._id,
      action: 'UPDATE_SUBJECT',
      entityType: 'Subject',
      entityId: dbmsSubj._id,
      metadata: {
        subject: 'CS301 Database Management Systems',
        action: 'Configured Semester 5 curriculum and assigned Prof. Rajesh Sharma',
      },
      createdAt: new Date(Date.now() - 86400 * 1000 * 3),
    });

    // 12. Seed Learning Resources across subjects
    console.log('[Seed] Populating rich learning resources & study vaults...');
    const [subDBMS, subOS, subDSA, subAI, subCN, subSE] = subjects;

    // Create realistic sample documents on disk
    const sampleDbmsNotes = await storageAdapter.createSampleResourceFile(
      'dbms_unit3_normalization_notes.txt',
      '=== CS301 DATABASE MANAGEMENT SYSTEMS ===\nUNIT 3: RELATIONAL DATABASE DESIGN & NORMALIZATION\n\n1. Functional Dependencies (FDs)\n   An FD X -> Y specifies that the value of X uniquely determines Y.\n2. Normal Forms:\n   - 1NF: Atomic attribute values.\n   - 2NF: 1NF + No partial dependencies on candidate keys.\n   - 3NF: 2NF + No transitive dependencies (X -> A implies X is superkey or A is prime).\n   - BCNF: For every FD X -> A, X must be a superkey.\n\n3. Decompositions:\n   - Lossless join guarantee: R1 ∩ R2 -> R1 or R1 ∩ R2 -> R2\n   - Dependency preservation.\n'
    );

    const sampleOsPaging = await storageAdapter.createSampleResourceFile(
      'os_virtual_memory_paging_guide.txt',
      '=== CS302 OPERATING SYSTEMS ===\nUNIT 4: VIRTUAL MEMORY, PAGING & TRANSLATION LOOKASIDE BUFFER (TLB)\n\n1. Logical vs Physical Address Space\n2. Page Tables & Inverted Page Tables\n3. Page Replacement Algorithms:\n   - FIFO, LRU (Least Recently Used), Optimal (Belady’s Anomaly)\n4. Thrashing and Working Set Model.\n'
    );

    const sampleDsaGraph = await storageAdapter.createSampleResourceFile(
      'dsa_graph_algorithms_cheatsheet.txt',
      '=== CS303 DATA STRUCTURES & ALGORITHMS ===\nUNIT 5: GRAPH ALGORITHMS CHEATSHEET\n\n1. BFS (O(V + E)) - Shortest path in unweighted graphs\n2. DFS (O(V + E)) - Topological sort & cycle detection\n3. Dijkstra Algorithm (O((V + E) log V)) - Non-negative edge weights\n4. Bellman-Ford (O(V * E)) - Negative edge weights & negative cycle detection\n5. Minimum Spanning Trees: Kruskal and Prim algorithms.\n'
    );

    const sampleAiSearch = await storageAdapter.createSampleResourceFile(
      'ai_heuristic_search_slides.txt',
      '=== CS304 ARTIFICIAL INTELLIGENCE ===\nHEURISTIC SEARCH & ADVERSARIAL GAMES\n\n1. A* Search: f(n) = g(n) + h(n)\n   - Admissible: h(n) <= h*(n)\n   - Consistent (Monotonic): h(n) <= c(n, a, n\') + h(n\')\n2. Minimax with Alpha-Beta Pruning\n   - Alpha: Best choice found so far for MAX\n   - Beta: Best choice found so far for MIN.\n'
    );

    const sampleCnTcp = await storageAdapter.createSampleResourceFile(
      'cn_tcp_congestion_control.txt',
      '=== CS305 COMPUTER NETWORKS ===\nTCP TRANSPORT LAYER PROTOCOLS & FLOW CONTROL\n\n1. TCP 3-Way Handshake: SYN -> SYN-ACK -> ACK\n2. Connection Teardown: FIN -> ACK -> FIN -> ACK\n3. Congestion Control Phases:\n   - Slow Start (Exponential growth)\n   - Congestion Avoidance (Linear growth: AIMD)\n   - Fast Retransmit & Fast Recovery.\n'
    );

    const sampleAgileDesign = await storageAdapter.createSampleResourceFile(
      'se_agile_design_patterns.txt',
      '=== CS306 SOFTWARE ENGINEERING ===\nAGILE METHODOLOGIES & GANG OF FOUR PATTERNS\n\n1. Agile Manifesto & Scrum Framework (Sprints, Retrospectives, Standups)\n2. Creational Patterns: Singleton, Factory, Builder\n3. Structural Patterns: Adapter, Facade, Decorator\n4. Behavioral Patterns: Observer, Strategy, Command.\n'
    );

    const resourceSeedList = [
      {
        title: 'Unit 3: Relational Normalization & BCNF Notes',
        description: 'Comprehensive lecture notes covering Functional Dependencies, 1NF, 2NF, 3NF, BCNF decomposition, and lossy join testing.',
        subjectId: subDBMS._id,
        type: 'Notes',
        fileUrl: sampleDbmsNotes,
        fileSize: '420 KB',
        fileType: 'text/plain',
        uploadedBy: professors[0].user._id,
        visibleToStudents: true,
      },
      {
        title: 'SQL Complex Queries & Subqueries Cheatsheet',
        description: 'Practice queries with GROUP BY, HAVING, Window functions, and CTEs with solved examples.',
        subjectId: subDBMS._id,
        type: 'PDF',
        fileUrl: sampleDbmsNotes,
        fileSize: '1.2 MB',
        fileType: 'application/pdf',
        uploadedBy: professors[0].user._id,
        visibleToStudents: true,
      },
      {
        title: 'B+ Tree Indexing & Database Internals Guide',
        description: 'Interactive reference on how disk block pointers, B+ Trees, and LSM trees operate under heavy writes.',
        subjectId: subDBMS._id,
        type: 'Reference Link',
        externalUrl: 'https://en.wikipedia.org/wiki/B%2B_tree',
        uploadedBy: professors[0].user._id,
        visibleToStudents: true,
      },
      {
        title: 'Virtual Memory, Paging & Segmentation Guide',
        description: 'Detailed analysis of Page Replacement algorithms, TLB hit/miss calculations, and Belady anomaly.',
        subjectId: subOS._id,
        type: 'PDF',
        fileUrl: sampleOsPaging,
        fileSize: '890 KB',
        fileType: 'application/pdf',
        uploadedBy: professors[1].user._id,
        visibleToStudents: true,
      },
      {
        title: 'Process Synchronization Mutex & Semaphores Lab Code',
        description: 'Working C code examples for Producer-Consumer and Dining Philosophers problem with POSIX pthreads.',
        subjectId: subOS._id,
        type: 'Lecture Material',
        fileUrl: sampleOsPaging,
        fileSize: '240 KB',
        fileType: 'text/plain',
        uploadedBy: professors[1].user._id,
        visibleToStudents: true,
      },
      {
        title: 'Operating System Concepts (Silberschatz) Chapter Slides',
        description: 'Official slide decks and reference notes for memory management and CPU scheduling.',
        subjectId: subOS._id,
        type: 'Reference Link',
        externalUrl: 'https://os-book.com',
        uploadedBy: professors[1].user._id,
        visibleToStudents: true,
      },
      {
        title: 'Graph Algorithms & Shortest Path Cheatsheet',
        description: 'Quick reference for Dijkstra, Bellman-Ford, Floyd-Warshall, and Prim-Kruskal MST.',
        subjectId: subDSA._id,
        type: 'PDF',
        fileUrl: sampleDsaGraph,
        fileSize: '650 KB',
        fileType: 'application/pdf',
        uploadedBy: professors[0].user._id,
        visibleToStudents: true,
      },
      {
        title: 'Dynamic Programming Top 50 LeetCode Patterns',
        description: 'State transition equations and memoization techniques for 0/1 Knapsack, LCS, LIS, and Matrix Chain.',
        subjectId: subDSA._id,
        type: 'Notes',
        fileUrl: sampleDsaGraph,
        fileSize: '1.4 MB',
        fileType: 'application/pdf',
        uploadedBy: professors[0].user._id,
        visibleToStudents: true,
      },
      {
        title: 'A* Search, Heuristics & Alpha-Beta Pruning Slides',
        description: 'Lecture slides covering informed search heuristics, admissibility conditions, and adversarial games.',
        subjectId: subAI._id,
        type: 'Lecture Material',
        fileUrl: sampleAiSearch,
        fileSize: '2.1 MB',
        fileType: 'application/pdf',
        uploadedBy: professors[2].user._id,
        visibleToStudents: true,
      },
      {
        title: 'TCP/IP 3-Way Handshake & Congestion Control Guide',
        description: 'RFC breakdown of TCP header flags, Slow Start, AIMD, and Fast Recovery.',
        subjectId: subCN._id,
        type: 'PDF',
        fileUrl: sampleCnTcp,
        fileSize: '780 KB',
        fileType: 'application/pdf',
        uploadedBy: professors[1].user._id,
        visibleToStudents: true,
      },
      {
        title: 'Agile Scrum Methodology & Software Design Patterns',
        description: 'UML diagram guidelines, Sprint planning templates, and GoF patterns.',
        subjectId: subSE._id,
        type: 'Assignment Material',
        fileUrl: sampleAgileDesign,
        fileSize: '950 KB',
        fileType: 'application/pdf',
        uploadedBy: professors[2].user._id,
        visibleToStudents: true,
      },
    ];

    for (const res of resourceSeedList) {
      await LearningResource.create(res);
    }

    // 13. Seed Upcoming Examinations
    console.log('[Seed] Populating upcoming examination schedules...');
    const nowMs = Date.now();
    const dayMs = 24 * 3600 * 1000;

    const examList = [
      {
        name: 'Midterm Examination - Database Management Systems',
        subjectId: subDBMS._id,
        examType: 'Midterm',
        date: new Date(nowMs + 4 * dayMs),
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        venue: 'Lecture Hall 402',
        maxMarks: 50,
        status: 'Scheduled',
        createdBy: professors[0].user._id,
      },
      {
        name: 'Internal Assessment 2 - Operating Systems',
        subjectId: subOS._id,
        examType: 'Internal Assessment',
        date: new Date(nowMs + 7 * dayMs),
        startTime: '02:00 PM',
        endTime: '03:30 PM',
        venue: 'Room 305',
        maxMarks: 30,
        status: 'Scheduled',
        createdBy: professors[1].user._id,
      },
      {
        name: 'Lab Practical Examination - Data Structures & Algorithms',
        subjectId: subDSA._id,
        examType: 'Practical',
        date: new Date(nowMs + 11 * dayMs),
        startTime: '09:00 AM',
        endTime: '01:00 PM',
        venue: 'Computing Lab 3',
        maxMarks: 50,
        status: 'Scheduled',
        createdBy: professors[0].user._id,
      },
      {
        name: 'Midterm Examination - Artificial Intelligence',
        subjectId: subAI._id,
        examType: 'Midterm',
        date: new Date(nowMs + 15 * dayMs),
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        venue: 'Auditorium West',
        maxMarks: 50,
        status: 'Scheduled',
        createdBy: professors[2].user._id,
      },
      {
        name: 'End Semester Examination - Computer Networks',
        subjectId: subCN._id,
        examType: 'End Semester',
        date: new Date(nowMs + 24 * dayMs),
        startTime: '10:00 AM',
        endTime: '01:00 PM',
        venue: 'Examination Block B',
        maxMarks: 100,
        status: 'Scheduled',
        createdBy: adminUser._id,
      },
    ];

    const createdExams = [];
    for (const ex of examList) {
      const doc = await Exam.create(ex);
      createdExams.push(doc);
    }

    // 14. Seed Student Examination Results
    console.log('[Seed] Populating verified examination results & grades...');
    const resultDefinitions = [
      // Rahul Sharma (STU2024001)
      { studentIdx: 0, subject: subDBMS, int: 18, assign: 16, prac: 0, ext: 38, total: 72, pct: 72.0, grade: 'A', gp: 8, status: 'Pass' },
      { studentIdx: 0, subject: subOS, int: 14, assign: 15, prac: 0, ext: 32, total: 61, pct: 61.0, grade: 'B+', gp: 7, status: 'Pass' },
      { studentIdx: 0, subject: subDSA, int: 21, assign: 19, prac: 0, ext: 42, total: 82, pct: 82.0, grade: 'A+', gp: 9, status: 'Distinction' },
      { studentIdx: 0, subject: subAI, int: 16, assign: 14, prac: 0, ext: 35, total: 65, pct: 65.0, grade: 'B+', gp: 7, status: 'Pass' },
      { studentIdx: 0, subject: subCN, int: 17, assign: 16, prac: 0, ext: 36, total: 69, pct: 69.0, grade: 'B+', gp: 7, status: 'Pass' },
      { studentIdx: 0, subject: subSE, int: 19, assign: 18, prac: 0, ext: 40, total: 77, pct: 77.0, grade: 'A', gp: 8, status: 'Pass' },

      // Priya Singh (STU2024002)
      { studentIdx: 1, subject: subDBMS, int: 23, assign: 20, prac: 0, ext: 44, total: 87, pct: 87.0, grade: 'A+', gp: 9, status: 'Distinction' },
      { studentIdx: 1, subject: subOS, int: 20, assign: 18, prac: 0, ext: 40, total: 78, pct: 78.0, grade: 'A', gp: 8, status: 'Pass' },
      { studentIdx: 1, subject: subDSA, int: 24, assign: 20, prac: 0, ext: 45, total: 89, pct: 89.0, grade: 'A+', gp: 9, status: 'Distinction' },
      { studentIdx: 1, subject: subAI, int: 21, assign: 19, prac: 0, ext: 42, total: 82, pct: 82.0, grade: 'A+', gp: 9, status: 'Distinction' },

      // Arjun Kumar (STU2024003)
      { studentIdx: 2, subject: subDBMS, int: 25, assign: 20, prac: 0, ext: 48, total: 93, pct: 93.0, grade: 'O', gp: 10, status: 'Distinction' },
      { studentIdx: 2, subject: subOS, int: 24, assign: 20, prac: 0, ext: 46, total: 90, pct: 90.0, grade: 'O', gp: 10, status: 'Distinction' },
      { studentIdx: 2, subject: subDSA, int: 25, assign: 20, prac: 0, ext: 49, total: 94, pct: 94.0, grade: 'O', gp: 10, status: 'Distinction' },
      { studentIdx: 2, subject: subAI, int: 24, assign: 20, prac: 0, ext: 47, total: 91, pct: 91.0, grade: 'O', gp: 10, status: 'Distinction' },
    ];

    for (const r of resultDefinitions) {
      const studentDoc = students[r.studentIdx].student;
      await Result.create({
        studentId: studentDoc._id,
        subjectId: r.subject._id,
        examId: createdExams[0]._id,
        internalMarks: r.int,
        assignmentMarks: r.assign,
        practicalMarks: r.prac,
        externalMarks: r.ext,
        totalMarks: r.total,
        maxMarks: 100,
        percentage: r.pct,
        grade: r.grade,
        gradePoint: r.gp,
        resultStatus: r.status,
        published: true,
        enteredBy: professors[0].user._id,
      });
    }

    // 15. Seed Grade History (Semesters 1 to 5 progression)
    console.log('[Seed] Populating semester progression and SGPA/CGPA history...');
    const gradeHistories = [
      // Rahul Sharma (STU2024001)
      { studentIdx: 0, sem: 1, year: '2022-2023', sgpa: 6.8, cgpa: 6.8, totalCred: 24, compCred: 24, passCount: 6, failCount: 0 },
      { studentIdx: 0, sem: 2, year: '2022-2023', sgpa: 6.5, cgpa: 6.65, totalCred: 24, compCred: 24, passCount: 6, failCount: 0 },
      { studentIdx: 0, sem: 3, year: '2023-2024', sgpa: 6.2, cgpa: 6.5, totalCred: 24, compCred: 24, passCount: 6, failCount: 0 },
      { studentIdx: 0, sem: 4, year: '2023-2024', sgpa: 6.0, cgpa: 6.38, totalCred: 24, compCred: 24, passCount: 6, failCount: 0 },
      { studentIdx: 0, sem: 5, year: '2024-2025', sgpa: 6.7, cgpa: 6.44, totalCred: 24, compCred: 24, passCount: 6, failCount: 0 },

      // Priya Singh (STU2024002)
      { studentIdx: 1, sem: 1, year: '2022-2023', sgpa: 7.2, cgpa: 7.2, totalCred: 24, compCred: 24, passCount: 6, failCount: 0 },
      { studentIdx: 1, sem: 2, year: '2022-2023', sgpa: 7.4, cgpa: 7.3, totalCred: 24, compCred: 24, passCount: 6, failCount: 0 },
      { studentIdx: 1, sem: 3, year: '2023-2024', sgpa: 7.5, cgpa: 7.37, totalCred: 24, compCred: 24, passCount: 6, failCount: 0 },
      { studentIdx: 1, sem: 4, year: '2023-2024', sgpa: 7.6, cgpa: 7.43, totalCred: 24, compCred: 24, passCount: 6, failCount: 0 },
      { studentIdx: 1, sem: 5, year: '2024-2025', sgpa: 7.8, cgpa: 7.5, totalCred: 24, compCred: 24, passCount: 6, failCount: 0 },

      // Arjun Kumar (STU2024003)
      { studentIdx: 2, sem: 1, year: '2022-2023', sgpa: 8.8, cgpa: 8.8, totalCred: 24, compCred: 24, passCount: 6, failCount: 0 },
      { studentIdx: 2, sem: 2, year: '2022-2023', sgpa: 9.0, cgpa: 8.9, totalCred: 24, compCred: 24, passCount: 6, failCount: 0 },
      { studentIdx: 2, sem: 3, year: '2023-2024', sgpa: 9.2, cgpa: 9.0, totalCred: 24, compCred: 24, passCount: 6, failCount: 0 },
      { studentIdx: 2, sem: 4, year: '2023-2024', sgpa: 9.1, cgpa: 9.03, totalCred: 24, compCred: 24, passCount: 6, failCount: 0 },
      { studentIdx: 2, sem: 5, year: '2024-2025', sgpa: 9.3, cgpa: 9.1, totalCred: 24, compCred: 24, passCount: 6, failCount: 0 },
    ];

    for (const gh of gradeHistories) {
      const studentDoc = students[gh.studentIdx].student;
      await GradeHistory.create({
        studentId: studentDoc._id,
        semester: gh.sem,
        academicYear: gh.year,
        sgpa: gh.sgpa,
        cgpa: gh.cgpa,
        totalCredits: gh.totalCred,
        completedCredits: gh.compCred,
        passedSubjectsCount: gh.passCount,
        failedSubjectsCount: gh.failCount,
      });
    }

    console.log('[Seed] Seeding completed successfully!');
    console.log('---------------------------------------------------------');
    console.log('DEMO ACCOUNTS READY:');
    console.log('1. Student (High Risk Demo): rahul@edupulse.edu / student123');
    console.log('2. Student (Medium Risk):   priya@edupulse.edu / student123');
    console.log('3. Student (Low Risk):      arjun@edupulse.edu / student123');
    console.log('4. Professor (DBMS/DSA):    prof.sharma@edupulse.edu / prof123');
    console.log('5. University Admin:        admin@edupulse.edu / admin123');
    console.log('---------------------------------------------------------');

    await disconnectDB();
  } catch (err) {
    console.error('[Seed Error] Failed to seed database:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
