# VeriCheck AI (AICTE Smart Application Validator)
### AI-Assisted Decision Support Engine for Technical Education Regulatory Scrutiny
**Problem Statement ID:** 26261 (Smart India Hackathon)

---

## 🏛️ System Overview

**VeriCheck AI** is a decision-support platform designed to assist AICTE scrutiny officers in conducting first-level compliance checks on annual technical college applications (Extension of Approval - EoA, Increase in Intake - III). 

The platform automates clerical cross-checks, validity verifications, non-judicial stamp paper valuations, and regulatory anomaly screening—saving an estimated **70%+ of manual scrutiny effort** while strictly preserving human authority:

> **Important Regulatory Principle:**
> *"AI findings are advisory only. Final decision rests with the competent AICTE authority."*
> Suspected discrepancies are consistently classified as **"possible anomaly, needs human verification"** rather than "fraud". Automated rejection is prohibited.

---

## 🏗️ Architecture & Independent Portals

The solution consists of **THREE independently runnable parts** integrated exclusively over REST:

```
SIH-DEMO-1/
├── backend/            # Python FastAPI Backend (Port 8000, SQLite aicte.db)
│   ├── config/         # Config-driven checklists & rule definitions (JSON)
│   ├── routes/         # REST API endpoints (auth, config, applications, officer, mock_issuer, files)
│   ├── services/       # Core engines: extractor, validator, anomaly, mock_registry, auth
│   ├── storage/        # Regulatory document repository outside web root
│   ├── seed_data.py    # Generates 14 realistic applications with synthetic PDFs
│   └── main.py         # FastAPI application entrypoint
│
├── applicant-portal/   # React + Vite (Port 5173, Citizen-facing green/white theme)
│   ├── src/pages/      # Login, Dashboard, NewApplication (Wizard), ApplicationView
│   └── src/services/   # Axios API client with role interceptors
│
└── officer-dashboard/  # React + Vite (Port 5174, Administrative blue/white theme)
    ├── src/pages/      # Login, Scrutiny Dashboard, ApplicationDetail (Three-Panel), Alerts, Audit, Metrics
    └── src/services/   # Axios API client with officer role interceptors
```

| Service | Technology | Port | Primary Users | Styling / Branding |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API** | FastAPI, Python 3.11, SQLite | `8000` | REST Gateway & OpenAPI (`/docs`) | Clean JSON REST Contract |
| **Applicant Portal** | React, Vite, Tailwind CSS | `5173` | Technical College Applicants | Citizen-friendly, Emerald/Green `#059669` |
| **Officer Dashboard** | React, Vite, Tailwind CSS | `5174` | AICTE Scrutiny Officers | Government Official, Deep Blue `#0f2b48` |

---

## 🔑 Demo Credentials & 1-Click Login

Both portals feature **1-Click Quick Login buttons** on their login screens for instantaneous access:

| Role | Name | Email | Password | Assigned Institution / Office |
| :--- | :--- | :--- | :--- | :--- |
| **Applicant 1** | Dr. Arvind Kulkarni | `applicant1@aicte-demo.in` | `Demo@123` | Apex Institute of Technology (PID: `1-3324567891`) |
| **Applicant 2** | Prof. Sunita Rao | `applicant2@aicte-demo.in` | `Demo@123` | Bharat Polytechnic (PID: `1-4456789123`) |
| **Scrutiny Officer** | Dr. R. K. Sharma | `officer@aicte.gov.in` | `Demo@123` | AICTE Headquarters, New Delhi |

*Role Safeguard:* The backend rejects an applicant token on officer endpoints (403 Forbidden) and rejects an officer token on applicant creation endpoints. Each frontend also prevents logins of the wrong role.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Launch All Three Services at Once
On Windows, run either:
```cmd
run_all.bat
```
or via PowerShell:
```powershell
.\run_all.ps1
```

### 2. Manual Start (Three Separate Terminals)

#### Terminal 1: Backend API (:8000)
```bash
cd backend
python -m pip install -r requirements.txt
python seed_data.py     # Generates 14 synthetic applications & sample PDFs
python main.py
```
*API & Swagger Documentation:* [http://localhost:8000/docs](http://localhost:8000/docs)

#### Terminal 2: Applicant Portal (:5173)
```bash
cd applicant-portal
npm install
npm run dev
```
*Open in Browser:* [http://localhost:5173](http://localhost:5173)

#### Terminal 3: Officer Dashboard (:5174)
```bash
cd officer-dashboard
npm install
npm run dev
```
*Open in Browser:* [http://localhost:5174](http://localhost:5174)

---

## 🧪 End-to-End Automated Integration Test

To verify the complete cross-portal integration flow automatically:
```bash
python test_e2e_flow.py
```
This script executes a 14-step automated verification:
1. Verifies backend health and OpenAPI schema.
2. Performs JWT logins for applicant and officer.
3. Tests role guards (asserting 403 Forbidden when roles cross over).
4. Loads dynamic checklist for Extension of Approval.
5. Creates a draft application as the college applicant.
6. Uploads a generated PDF with SHA-256 calculation and field extraction.
7. Executes AI Pre-check and verifies explainable findings.
8. Formally locks and submits the application.
9. Retrieves the Three-Panel Scrutiny Dossier as an AICTE Officer.
10. Updates finding decisions (Accept / Dismiss with remark).
11. Records the officer's final scrutiny determination order.
12. Validates immutable entries in the regulatory audit ledger.

---

## 📊 Flawed-Scenario Walkthrough (Synthetic Dataset)

The seed script creates **14 synthetic applications** containing realistic PDFs with official headers, seal watermarks, and Rs. 220 stamp paper banners:

| App ID | Category | Flaw Scenario / Test Case | AI Advisory Determination | Explanation & Rule Triggered |
| :---: | :--- | :--- | :---: | :--- |
| **APP-0001** | Extension of Approval | **Clean Application** | `Clear` | All 6 mandatory documents uploaded; Rs. 220 stamp paper; active Anna Univ NOC. |
| **APP-0002** | Extension of Approval | **Clean Application** | `Clear` | All documents valid, VTU NOC active, all fuzzy name matches >= 95%. |
| **APP-0003** | Increase in Intake | **Clean Application** | `Clear` | Baseline intake matches previous EoA (120 seats), requested intake (180 seats) valid. |
| **APP-0004** | Extension of Approval | **Expired University NOC** | `Deficient` | `RULE_DOC_EXPIRED`: NOC expired on 2025-06-30, prior to current cycle submission. |
| **APP-0005** | Extension of Approval | **Institution Name Mismatch** | `Deficient` | `RULE_INST_NAME_MISMATCH`: Form states "Apex Institute of Technology" while NOC states "Apex College of Global Engineering" (Fuzzy match 64% &lt; 85%). |
| **APP-0006** | Extension of Approval | **Missing Affidavit II** | `Deficient` | `RULE_REQ_DOC_MISSING_AFFIDAVIT_2`: Mandatory faculty cadre ratio affidavit was not uploaded. |
| **APP-0007** | Extension of Approval | **Duplicate File Across Colleges** | `Deficient` | `ANOMALY_CROSS_APP_DUPLICATE`: Exact same SHA-256 file was previously uploaded by Apex Institute of Technology in APP-0001. |
| **APP-0008** | Extension of Approval | **Stamp Paper below Rs. 220** | `Deficient` | `RULE_STAMP_VAL_DEFICIENT`: Affidavit executed on Rs. 100 stamp paper (mandatory minimum is Rs. 220). |
| **APP-0009** | Extension of Approval | **Delayed Submission** | `Needs Manual Review` | `RULE_APPLICATION_DELAYED`: Submitted on 2026-10-24, after official cycle deadline (2026-10-15). |
| **APP-0010** | Extension of Approval | **Tampered Metadata PDF** | `Needs Manual Review` | `ANOMALY_PDF_METADATA_TAMPERED`: PDF metadata indicates alteration using suspicious external tool post-notarization. |
| **APP-0011** | Extension of Approval | **Source Registry Unavailable** | `Needs Manual Review` | `RULE_REGISTRY_SOURCE_UNAVAILABLE`: State university portal returned HTTP 503 Gateway Timeout; routed for human verification. |
| **APP-0012** | Increase in Intake | **Baseline Intake Mismatch** | `Deficient` | `RULE_INTAKE_MISMATCH_PREV_EOA`: Form claims current intake is 120 seats, but previous EoA letter shows 60 seats. |
| **APP-0013** | Extension of Approval | **Same File Under Two Types** | `Deficient` | `ANOMALY_SAME_FILE_MULTI_TYPE`: Identical PDF file uploaded for both Affidavit I and Affidavit II within the same submission. |
| **APP-0014** | Extension of Approval | **Future Issue Date** | `Deficient` | `ANOMALY_FUTURE_ISSUE_DATE`: Submitted document claims issue date in late 2028. |

---

## 🖥️ Screen-by-Screen Features

### 1. Applicant Portal (`:5173`)
- **Login:** Citizen-facing green theme with 1-click profiles for Apex Tech and Bharat Poly.
- **Dashboard:** Table of own applications, visual badges (`Clear`, `Needs Manual Review`, `Deficient`), submission timestamps, and direct link to rectify deficiencies.
- **New Application Wizard:**
  - Choose between *Extension of Approval (EoA)* and *Increase in Intake (III)*.
  - Form validation for college name, permanent ID, current intake, requested intake, and society name.
  - Dynamic Document Checklist loaded from backend JSON configuration (`/config/checklist/{type}`).
  - File upload slots with real-time extracted fields preview (stamp value, doc number, expiry dates).
- **Run Pre-check:** Instant first-level validation feedback before final lock.
- **Final Submit:** Locks the application and forwards it to the officer scrutiny queue.
- **Rectification Workflow:** If an officer requests clarification or rectification, the applicant can replace specific flagged documents and re-run pre-check.

### 2. Officer Scrutiny Console (`:5174`)
- **Login:** Administrative government blue theme with 1-click officer access.
- **Scrutiny Dashboard:** Real-time KPI counters (`All`, `Clear`, `Manual Review`, `Deficient`, `Rectification`, `Escalated`), filters by category and status, search bar, and pending alerts summary.
- **Three-Panel Scrutiny Dossier:**
  - **Panel 1 (Left):** Application Form Data (Institution info, permanent ID, state, intake figures, trust particulars).
  - **Panel 2 (Middle):** Document Viewer (Document switcher tabs, per-document validity badges, extracted structured field chips, and in-browser PDF streaming with zoom/full-window mode).
  - **Panel 3 (Right):** Validation Report (Findings table showing document, check name, status, severity, plain-language reason, and an expandable evidence drawer displaying exact comparisons and registry logs).
- **Officer Finding Controls:**
  - `Accept Flag`: Confirms the AI advisory finding.
  - `Dismiss Flag`: Overrides the flag with mandatory officer justification.
  - `Request Clarification`: Queries the applicant regarding the discrepancy.
- **Overall Scrutiny Determination:**
  - `Mark Reviewed`: Concludes first-level scrutiny.
  - `Request Rectification`: Returns application with official remarks for college document re-upload.
  - `Escalate for Inspection`: Dispatches a surprise physical inspection committee.
- **Pending Alerts Stream:** Categorized queue of missing info, expired certificates, source timeouts, and anomalies.
- **Audit Trail Ledger:** Immutable chronological timeline of every rule applied, mock issuer response, and officer decision with timestamp and actor.
- **Metrics & KPIs:** Total documents scrutinized, flags raised, average validation speed (~1.4s), and estimated human hours saved.

---

## 🔒 Security & Safe Document Handling
- **Role-Based Access Control (RBAC):** Backend JWT tokens contain role claims (`applicant` vs `officer`).
- **Data Isolation:** Applicants can only query and view applications belonging to their assigned institution.
- **Secure File Storage:** Uploaded regulatory documents are stored in `/backend/storage/documents/` outside the web root and served exclusively through the authorized streaming endpoint (`GET /files/{doc_id}`).
- **Comprehensive Audit Trail:** All access events, document uploads, automated checks, and human decisions are permanently recorded in the SQLite `audit_log` table.

---

## 🚀 Deployment Guide

### Option 1: Free Cloud Hosting (Recommended for Hackathons / SIH)

#### Step 1: Deploy Backend (Render / Railway)
1. Push this repository to GitHub.
2. In [Render.com](https://render.com), click **New + > Blueprint** and select your repository (it will automatically read [render.yaml](file:///c:/Users/thiru/Downloads/Movies%20-%20Copy/New%20folder/Projects/SIH-DEMO-1/render.yaml)).
   * *Alternatively*, create a **Web Service**:
     - **Runtime:** Python 3.11
     - **Root Directory:** `backend`
     - **Build Command:** `pip install -r requirements.txt`
     - **Start Command:** `python main.py`
     - **Environment Variables:** `ENV=production`, `GEMINI_API_KEY` (optional)
3. Copy your live backend URL (e.g. `https://vericheck-backend.onrender.com`).

#### Step 2: Deploy Frontends (Vercel)
Both frontends include pre-configured `vercel.json` rewrite files for seamless SPA routing.
1. In [Vercel.com](https://vercel.com), click **Add New > Project** and import your GitHub repo twice:
   - **Project 1: Applicant Portal**
     - **Root Directory:** `applicant-portal`
     - **Framework Preset:** Vite
     - **Environment Variable:** `VITE_API_URL = https://vericheck-backend.onrender.com`
   - **Project 2: Officer Console**
     - **Root Directory:** `officer-dashboard`
     - **Framework Preset:** Vite
     - **Environment Variable:** `VITE_API_URL = https://vericheck-backend.onrender.com`
2. Click **Deploy** on both.

---

### Option 2: Docker Compose (Single Cloud VM / VPS / Local Container)

Deploy all 3 services behind Nginx with persistent database and file storage volumes:

```bash
# 1. Clone repository on your VPS (Ubuntu / Debian / AWS EC2)
git clone <your-repo-url>
cd SIH-DEMO-1

# 2. Start all services in the background
docker compose up -d --build

# 3. Access the deployed portals:
# - Applicant Portal:   http://<your-vps-ip>:5173
# - Officer Console:    http://<your-vps-ip>:5174
# - Backend OpenAPI:    http://<your-vps-ip>:8000/docs
```

