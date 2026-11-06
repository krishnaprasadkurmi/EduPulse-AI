# EduPulse AI: Intelligent Student Academic Monitoring & Support System

> **HackSprint / Track 2: MERN + AI 24-Hour Build**  
> *Core Promise: Detect academic risk before it becomes academic failure.*  
> *"Don't discover academic failure. Predict it."*

---

## 🌟 Executive Overview & Architectural Loop

EduPulse AI is a role-based academic monitoring platform engineered for universities. Rather than functioning as a static ERP repository, the platform operates as a continuous closed-loop intelligence engine:

$$\textbf{Collect} \longrightarrow \textbf{Analyze / Predict} \longrightarrow \textbf{Alert} \longrightarrow \textbf{Recommend} \longrightarrow \textbf{Act} \longrightarrow \textbf{Recalculate}$$

1. **Collect**: Ingests attendance logs, assessment scores, assignment submissions, and historical academic baselines.
2. **Predict**: Calculates rolling attendance trajectories around the mandatory 75% threshold and derives multi-factor academic risk indices (0–100 scale).
3. **Alert**: Automatically dispatches proactive in-app notifications to students when attendance dips below 75% or when risk escalates to HIGH.
4. **Recommend**: Diagnoses top explainable drivers and generates personalized actionable intervention steps.
5. **Act**: Provides hands-free **AI Voice Mark Entry** with automated student roster matching and a safe faculty confirmation gate.
6. **Recalculate**: Immediately updates the student's risk trajectory upon mark persistence or attendance changes.

---

## 🚀 Key Feature Matrix

| Feature | Description | Target Role |
| :--- | :--- | :--- |
| **75% Attendance Intelligence** | Transparent $\frac{\text{Attended} + x}{\text{Conducted} + x} \ge 0.75$ recovery calculation with linear trend projection and status categorizations (`SAFE`, `WARNING`, `CRITICAL`). | Student / Faculty / Admin |
| **Interactive What-If Simulator** | Real-time simulator enabling students to test attending or missing upcoming lectures with live recalculation of standing and status badge transitions. | Student |
| **Explainable Academic Risk Engine** | 5-factor normalized scoring (Attendance 25%, Assessments 30%, Assignments 15%, Baseline CGPA 15%, Trend 15%) categorized into `LOW` (0–34), `MEDIUM` (35–64), and `HIGH` (65–100) with diagnostic bullet explanations and actionable recommendations. | Student / Faculty / Admin |
| **AI Voice Mark Entry (Signature Feature)** | Speech-to-text adapter (browser Web Speech API + deterministic text fallback), regex & fuzzy student roster matching, bounds verification, and **mandatory faculty preview confirmation** before database write. | Professor |
| **Automated Notification Engine** | In-app alerts triggered on new marks, grade updates, borderline attendance drops, and risk escalations to HIGH. | Student |
| **University Analytics & Risk Monitor** | Dean-level analytics displaying campus-wide attendance health, risk distribution charts, and filterable diagnostic monitors. | Admin |
| **Cryptographic Audit Logs** | Complete immutable ledger recording actor ID, action type (`VOICE_CREATE_MARK`, `UPDATE_MARK`, etc.), entity, and payload diffs. | Admin |

---

## 👥 Demo Personas & Credentials

The application is pre-seeded with 12 students, 3 professors, and 6 courses with realistic attendance trends and risk profiles. For fast hackathon evaluation, you can use the **1-Click Persona Switcher** in the top navigation bar or enter credentials manually:

| Role | Name | Email | Password | Notable Test Signals |
| :--- | :--- | :--- | :--- | :--- |
| **Student** (Primary Demo) | **Rahul Sharma** | `rahul@edupulse.edu` | `student123` | DBMS: 72.0% attendance, downward trend (CRITICAL), High Risk score 78/100 |
| **Student** (Medium Risk) | **Priya Singh** | `priya@edupulse.edu` | `student123` | OS: 74% attendance (WARNING border), Medium Risk 56/100 |
| **Student** (Low Risk) | **Arjun Kumar** | `arjun@edupulse.edu` | `student123` | DSA: 92% attendance, score 48/50, Low Risk 18/100 |
| **Professor** | **Prof. Rajesh Sharma** | `prof.sharma@edupulse.edu` | `prof123` | Instructor for CS301 (DBMS) & CS303 (DSA); test voice mark entry |
| **Admin** | **Dr. Aris Thorne** | `admin@edupulse.edu` | `admin123` | Academic Dean; inspect campus analytics, risk monitor & audit logs |

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Axios.
- **Backend**: Node.js, Express REST API, JSON Web Tokens (JWT), BCryptJS, Mongoose.
- **Database**: MongoDB with automatic embedded `mongodb-memory-server` fallback for 100% zero-configuration out-of-the-box startup on any evaluation machine.
- **Audio Adapter**: Web Speech API (`webkitSpeechRecognition`) + deterministic NLP transcript parser fallback.

---

## ⚡ Quickstart & Local Installation

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)

### 1. Install Dependencies
From the repository root:
```bash
# Install backend dependencies
npm run install:backend

# Install frontend dependencies
npm run install:frontend
```
*(Or run `npm run install:all` — legacy `npm run install:server` and `npm run install:client` are also supported)*

### 2. Seed Demo Dataset
Populates the database with realistic student attendance histories, assessment scores, explainable risk records, initial notifications, and audit logs:
```bash
npm run seed
```

### 3. Launch Development Servers
In two terminal tabs:

**Terminal 1 (Backend Server on Port 5000):**
```bash
npm run backend
# or cd backend && npm start
```

**Terminal 2 (Frontend Client on Port 5173):**
```bash
npm run frontend
# or cd frontend && npm run dev
```

Navigate to **http://localhost:5173** in your web browser.

---

## 🚢 Independent Deployment Guide

EduPulse AI is structured into fully independent `frontend` and `backend` directories for frictionless deployment:

### Backend Deployment (e.g., Render, Railway, AWS, DigitalOcean)
- **Root Directory:** `backend`
- **Build Command:** `npm install` (or `npm run build`)
- **Start Command:** `npm start`
- **Required Environment Variables:**
  - `PORT=5000` (or dynamically supplied by platform)
  - `MONGODB_URI` (MongoDB Atlas URI or any hosted MongoDB instance)
  - `JWT_SECRET` (Strong secret key for tokens)
  - `CLIENT_URL` (Your production frontend URL, e.g. `https://your-frontend.vercel.app`)

### Frontend Deployment (e.g., Vercel, Netlify, Cloudflare Pages)
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Required Environment Variables:**
  - `VITE_API_URL` (Your production backend API URL, e.g. `https://your-backend.onrender.com/api`)
- *Note:* Pre-configured with `vercel.json` and `_redirects` for automatic SPA routing support.

---

## 🎯 Step-by-Step Judge Evaluation Walkthrough

Follow this 15-step sequence matching **Section 15 of the Blueprint**:

1. **Open http://localhost:5173** and click **"Rahul Sharma (Student)"** on the landing page persona launchpad.
2. **Review Student Dashboard**: Observe overall attendance, CGPA (6.4), aggregate risk index, and the prominent **Critical Alert Banner** for CS301 DBMS.
3. **Open Attendance & Trend**: Verify DBMS shows **72.0% attendance** with a downward trend ($\downarrow$) and a recommendation: *"Attend the next 5 consecutive classes"*.
4. **Open What-If Simulator**:
   - Drag the slider to simulate attending $+5$ upcoming classes.
   - Observe the live recalculation: attendance rises to **$76.7\%$** and the status transitions from **CRITICAL** to **SAFE**!
5. **Open Subject Risk Center**:
   - Select CS301 Database Management Systems.
   - Inspect the **Score Meter (78 / 100 — HIGH)**.
   - Review the **5-Signal Normalized Contribution Breakdown** (Attendance 25%, Assessments 30%, Assignments 15%, Baseline 15%, Trend 15%).
   - Read the explainable diagnostic drivers and actionable recommendations.
6. **Switch to Professor**:
   - In the top navigation bar, click **"Switch Persona"** $\to$ select **Prof. Rajesh Sharma**.
7. **Open AI Voice Mark Entry**:
   - Select Course: **CS301 - Database Management Systems**.
   - Assessment Name: `Midterm Examination`.
   - Click the **Microphone button** to speak, OR click the quick sample phrase:
     `"Rahul Sharma, DBMS, 42."`
   - Click **"Parse Voice Input"**.
8. **Inspect Confirmation Table**:
   - The system matches "Rahul Sharma" against the professor's assigned roster, extracts mark 42, and shows a **VALID** status.
   - Verify the mandatory safe confirmation preview table.
9. **Commit Mark**:
   - Click **"Confirm & Save Marks"**.
   - Observe the success banner: mark saved, notification dispatched, and risk recalculated!
10. **Switch back to Student (Rahul Sharma)**:
    - Click **"Switch Persona"** $\to$ select **Rahul Sharma**.
    - Click the **Notification Bell** in the top bar: observe the instant alert: *"New Mark Recorded: Database Management Systems (42/50)"*.
    - Open **Subject Risk Center**: observe that the new score has updated the assessment factor and improved the risk score!
11. **Switch to Admin (Dr. Aris Thorne)**:
    - View **University Analytics**: campus attendance rate, risk distribution bar (Low, Medium, High).
    - Open **Campus Risk Monitor**: filter all students by risk level.
    - Open **Security Audit Logs**: inspect the immutable audit event generated for the voice mark entry by Prof. Rajesh Sharma!
12. **Complete**: Conclude the intelligence loop demonstration: $\text{Collect} \to \text{Predict} \to \text{Alert} \to \text{Recommend} \to \text{Act} \to \text{Recalculate}$.
