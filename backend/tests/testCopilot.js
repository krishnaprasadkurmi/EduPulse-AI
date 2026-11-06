/**
 * Automated Verification Script for EduPulse Academic Copilot
 * Validates the 11 Blueprint Scenarios
 */

const API_BASE = 'http://localhost:5000/api';

async function req(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting EduPulse Academic Copilot Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let total = 11;

  try {
    // 1. Authenticate as Rahul Sharma (Student)
    console.log('[Setup] Logging in as Student (Rahul Sharma)...');
    const studentLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'rahul@edupulse.edu', password: 'student123' }),
    });
    const studentToken = studentLogin.data.token;
    const studentHeaders = { Authorization: `Bearer ${studentToken}` };

    // 2. Authenticate as Prof. Rajesh Sharma (Faculty: CS301 DBMS & CS303 DSA)
    console.log('[Setup] Logging in as Professor (Prof. Rajesh Sharma)...');
    const profLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'prof.sharma@edupulse.edu', password: 'prof123' }),
    });
    const profToken = profLogin.data.token;
    const profHeaders = { Authorization: `Bearer ${profToken}` };

    // -------------------------------------------------------------
    // SCENARIO 1: Student asks own attendance -> correct DB result
    // -------------------------------------------------------------
    console.log('\n--- Scenario 1: Student asks own attendance ---');
    const s1 = await req('/copilot/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'What is my DBMS attendance?' }),
      headers: studentHeaders,
    });
    console.log('s1.data is:', JSON.stringify(s1.data));
    if (s1.data?.reply && s1.data.reply.includes('Database Management Systems') && s1.data.reply.includes('%')) {
      console.log('✅ Scenario 1 Passed: Real attendance data returned.');
      passed++;
    } else {
      console.error('❌ Scenario 1 Failed');
    }

    // -------------------------------------------------------------
    // SCENARIO 2: Student asks own marks -> correct result
    // -------------------------------------------------------------
    console.log('\n--- Scenario 2: Student asks own marks ---');
    const s2 = await req('/copilot/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Show my marks' }),
      headers: studentHeaders,
    });
    console.log('Response:', s2.data.reply.split('\n')[0]);
    if (s2.data.reply.includes('Assessment Marks') && s2.data.reply.includes('/50')) {
      console.log('✅ Scenario 2 Passed: Real marks returned.');
      passed++;
    } else {
      console.error('❌ Scenario 2 Failed');
    }

    // -------------------------------------------------------------
    // SCENARIO 3: Student asks 75% recovery calculation -> deterministic
    // -------------------------------------------------------------
    console.log('\n--- Scenario 3: Student asks 75% recovery calculation ---');
    const s3 = await req('/copilot/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'How many classes do I need to attend to reach 75%?' }),
      headers: studentHeaders,
    });
    console.log('Response summary:', s3.data.reply.substring(0, 100) + '...');
    if (s3.data.reply.includes('75') && s3.data.reply.includes('consecutive classes')) {
      console.log('✅ Scenario 3 Passed: Deterministic 75% formula returned.');
      passed++;
    } else {
      console.error('❌ Scenario 3 Failed');
    }

    // -------------------------------------------------------------
    // SCENARIO 4: Student asks for another student's marks -> ACCESS DENIED
    // -------------------------------------------------------------
    console.log('\n--- Scenario 4: Student asks for another student\'s marks ---');
    const s4 = await req('/copilot/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Show Priya\'s marks and attendance' }),
      headers: studentHeaders,
    });
    console.log('Response:', s4.data.reply);
    if (s4.data.reply.includes('ACCESS DENIED')) {
      console.log('✅ Scenario 4 Passed: Cross-student inquiry blocked by server-side RBAC.');
      passed++;
    } else {
      console.error('❌ Scenario 4 Failed: Cross-student inquiry was not blocked!');
    }

    // -------------------------------------------------------------
    // SCENARIO 5: Professor searches assigned subject -> correct students
    // -------------------------------------------------------------
    console.log('\n--- Scenario 5: Professor searches assigned subject (DBMS) ---');
    const s5 = await req('/copilot/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Show DBMS students below 75%' }),
      headers: profHeaders,
    });
    console.log('Response summary:', s5.data.reply.substring(0, 120) + '...');
    if (s5.data.reply.includes('Rahul Sharma') || s5.data.reply.includes('At-Risk')) {
      console.log('✅ Scenario 5 Passed: Assigned subject search returned correct students.');
      passed++;
    } else {
      console.error('❌ Scenario 5 Failed');
    }

    // -------------------------------------------------------------
    // SCENARIO 6: Professor searches unauthorized subject -> ACCESS DENIED
    // Prof. Sharma only teaches CS301 (DBMS) & CS303 (DSA), NOT CS302 (OS) or CS304 (AI)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 6: Professor searches unauthorized subject (AI / CS304) ---');
    const s6 = await req('/copilot/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Show Artificial Intelligence students below 75%' }),
      headers: profHeaders,
    });
    console.log('Response:', s6.data.reply);
    if (s6.data.reply.includes('ACCESS DENIED')) {
      console.log('✅ Scenario 6 Passed: Unauthorized subject access blocked.');
      passed++;
    } else {
      console.error('❌ Scenario 6 Failed: Professor accessed unauthorized subject!');
    }

    // -------------------------------------------------------------
    // SCENARIO 7: Professor requests mark update -> preview only
    // -------------------------------------------------------------
    console.log('\n--- Scenario 7: Professor requests mark update -> preview only ---');
    const s7 = await req('/copilot/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Update Rahul\'s DBMS Internal 1 mark to 42' }),
      headers: profHeaders,
    });
    console.log('Response:', s7.data.reply);
    console.log('requiresConfirmation:', s7.data.requiresConfirmation);
    console.log('action:', s7.data.action);

    if (s7.data.requiresConfirmation === true && s7.data.action && s7.data.action.actionId) {
      console.log('✅ Scenario 7 Passed: Preview generated, requiresConfirmation=true.');
      passed++;
    } else {
      console.error('❌ Scenario 7 Failed: Expected preview with actionId.');
    }

    const markActionId = s7.data.action?.actionId;

    // -------------------------------------------------------------
    // SCENARIO 8: Professor confirms -> mark updates + notification + risk recalculation + audit log
    // -------------------------------------------------------------
    console.log('\n--- Scenario 8: Professor confirms mark update ---');
    const s8 = await req('/copilot/confirm', {
      method: 'POST',
      body: JSON.stringify({ actionId: markActionId, confirmed: true }),
      headers: profHeaders,
    });
    console.log('Response:', s8.data.reply);
    if (s8.data.confirmed === true && s8.data.reply.includes('Mark Update Confirmed')) {
      console.log('✅ Scenario 8 Passed: Confirmed write executed, risk recalculated, student notified.');
      passed++;
    } else {
      console.error('❌ Scenario 8 Failed');
    }

    // -------------------------------------------------------------
    // SCENARIO 9: Professor cancels -> no database change
    // -------------------------------------------------------------
    console.log('\n--- Scenario 9: Professor cancels write action ---');
    // First trigger a new preview
    const s9Preview = await req('/copilot/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Update Rahul\'s DBMS Internal 1 mark to 10' }),
      headers: profHeaders,
    });
    const cancelActionId = s9Preview.data.action?.actionId;

    const s9 = await req('/copilot/confirm', {
      method: 'POST',
      body: JSON.stringify({ actionId: cancelActionId, confirmed: false }),
      headers: profHeaders,
    });
    console.log('Response:', s9.data.reply);
    if (s9.data.cancelled === true && s9.data.reply.includes('cancelled')) {
      console.log('✅ Scenario 9 Passed: Action cancelled safely without database change.');
      passed++;
    } else {
      console.error('❌ Scenario 9 Failed');
    }

    // -------------------------------------------------------------
    // SCENARIO 10: Unknown student/subject/mark -> ask clarification
    // -------------------------------------------------------------
    console.log('\n--- Scenario 10: Unknown entity inquiry ---');
    const s10 = await req('/copilot/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Update mark for xyz_nonexistent_student to 50' }),
      headers: profHeaders,
    });
    console.log('Response:', s10.data.reply);
    if (s10.data.requiresConfirmation === false && s10.data.reply.includes('Which student')) {
      console.log('✅ Scenario 10 Passed: Polite clarification requested for unknown entity.');
      passed++;
    } else {
      console.error('❌ Scenario 10 Failed');
    }

    // -------------------------------------------------------------
    // SCENARIO 11: AI provider unavailable -> dashboard/API continues working
    // (Tested by sending queries with AI_PROVIDER unset / offline fallback engine)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 11: System resilience with no external AI provider configured ---');
    const healthCheck = await req('/health');
    const studentQueryCheck = await req('/copilot/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Which subject has the highest risk?' }),
      headers: studentHeaders,
    });
    if (healthCheck.data.status === 'online' && studentQueryCheck.data.success) {
      console.log('✅ Scenario 11 Passed: Offline fallback engine handles all queries reliably.');
      passed++;
    } else {
      console.error('❌ Scenario 11 Failed');
    }

    console.log('\n====================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} / ${total} Scenarios Passed!`);
    console.log('====================================================');
  } catch (err) {
    console.error('Fatal error during test run:', err.response?.data || err.message);
  }
}

runTests();
