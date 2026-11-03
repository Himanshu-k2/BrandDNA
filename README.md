# BrandDNA — AI-Powered Brand Governance Platform

> **Protecting the identity behind every brand message.**
>
> **Inkloom AI Hackathon — Final Round Submission**  
> **Team Name:** Meow  
> **Team Leader:** Himanshu Kumar  
> **Team Member:** Abhishek Kumar Prajapati  
> **Product Category:** AI-powered Brand Governance  

[![Live Frontend (Vercel)](https://img.shields.io/badge/Vercel-Live%20Frontend-black?logo=vercel)](https://brand-8fj38h0sr-mewo3.vercel.app/)
[![Live Backend (Render)](https://img.shields.io/badge/Render-Live%20API-46E3B7?logo=render)](https://branddna-1-wndy.onrender.com/api/health)
[![Test Suite Status](https://img.shields.io/badge/Tests-101%2F101%20Passed-brightgreen)](https://github.com/Himanshu-k2/BrandDNA)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌟 Executive Summary

Modern organisations create content across dozens of channels, relying on a distributed mix of internal copywriters, marketing agencies, freelancers, and generative AI tools. This fragmented workflow creates a major governance crisis:
- **Inconsistent Tone & Voice:** Casual/playful messaging from external creators for enterprise brands requiring serious, authoritative tone.
- **Outdated Facts & Pricing:** Quoting deprecated product pricing (e.g., old ₹799 price points instead of current approved ₹999).
- **Prohibited Terminology:** Using forbidden industry terms (e.g. "users" instead of brand-mandated "members").
- **Unsupported Claims:** Aggressive statements ("fastest in the world") without required legal proof.
- **Human Bottleneck:** Reviewers manually cross-checking PDFs and spreadsheets, causing delays and fatigue-induced oversights.

**BrandDNA** solves this by establishing an automated, evidence-linked content review layer. Combining a **deterministic rule engine** for exact facts/terminology with **Google Gemini LLM** for contextual tone and messaging analysis, BrandDNA delivers instant feedback to creators while keeping human reviewers firmly in control of formal sign-offs.

---

## 🚀 Live Demo & Deployment Links

| Component | Provider | Live URL |
| :--- | :--- | :--- |
| **Production Web App** | Vercel | **[https://brand-8fj38h0sr-mewo3.vercel.app/](https://brand-8fj38h0sr-mewo3.vercel.app/)** |
| **Production API & Health** | Render | **[https://branddna-1-wndy.onrender.com/api/health](https://branddna-1-wndy.onrender.com/api/health)** |
| **Admin Invitations & Access** | Vercel | **[https://brand-8fj38h0sr-mewo3.vercel.app/admin/invitations](https://brand-8fj38h0sr-mewo3.vercel.app/admin/invitations)** |

---

## 👥 Three Core User Personas

| Persona | Role Identifier | Capabilities & Permissions |
| :--- | :---: | :--- |
| **1. Brand Manager** | `brand_manager` / `admin` | • Manages brand workspaces and visual identity.<br>• Defines approved facts, prices, tone directives, and terminology.<br>• Submits content and manages versioned rule sets. |
| **2. Content Creator** | `creator` | • Self-registers via public signup.<br>• Submits marketing copy, advertisements, captions, and PDF/DOCX/image assets.<br>• Runs AI-powered compliance evaluations and resolves flagged findings.<br>• Submits polished revisions (`v1` → `v2`) for formal approval. |
| **3. Platform Admin / Reviewer** | `admin` / `reviewer` | • Admin-controlled workspace onboarding and member invitations.<br>• Reviews flagged submissions in the formal approval queue.<br>• Approves, rejects (with mandatory justification), or requests changes.<br>• Inspects complete, immutable audit trails. |

---

## 🧭 Feature Walkthrough & How to Access Every Feature

Here is a step-by-step testing guide so evaluators and users can experience every capability of the platform:

### 1. 1-Click Role Switcher & Login
- **URL**: `https://brand-8fj38h0sr-mewo3.vercel.app/login`
- **How to access**: Look at the bottom of the sign-in card. Click any of the **Demo Quick-Fill Pills**:
  - `Admin (Jordan)` → Signs in with full Platform Admin permissions.
  - `Reviewer (Sarah)` → Signs in with Authorized Content Approver access.
  - `Brand Manager (Priya)` → Signs in with Brand Custodian & Guidelines access.
  - `Creator (Alex)` → Signs in with Marketing Author & Studio access.
- **Experience**: Notice the animated BrandDNA logo asterisk spinning clockwise as the workspace authenticates!

### 2. Brad — The Conversational AI Governance Copilot
- **How to access**: Click the **Brad AI icon (chat bubble/bot)** at the bottom-right of any authenticated screen.
- **What to try**:
  - Type: *"What is our approved price for NovaFit Premium?"* → Brad quotes ₹999/mo from the verified facts database.
  - Type: *"Can I say users in my post?"* → Brad warns you to use "members" based on the brand terminology rule.
  - Type: *"Take me to the review queue"* → Brad renders a clickable navigation pill that routes you directly to the approval queue.

### 3. Create & Submit Content with Hybrid AI Review
- **URL**: `https://brand-8fj38h0sr-mewo3.vercel.app/reviews/new` (or click **"New Content"** / **"+"** from the sidebar).
- **Step-by-step**:
  1. **Select Workspace**: Click the **Brand workspace** dropdown and choose from any of the 10 pre-seeded brands (e.g. `NovaFit Health`, `OmniCloud`, `FinWise`).
  2. **Select Content Type**: Choose `Social Media Post`, `Email Campaign`, `Website Copy`, etc.
  3. **Load Violation Preset**: Click the **"Load violation sample"** button to inject sample copy containing deprecated pricing (₹799) and prohibited wording ("users", "cheapest").
  4. **Multi-Modal Upload**: Drag and drop any PDF brochure, Word document, or image (PNG, JPG, WebP) to test document text extraction.
  5. Click **"Run BrandDNA Check"** → The engine runs deterministic regex rules and Google Gemini LLM contextual analysis.

### 4. Interactive Review Studio & Before/After Revision Diff
- **URL**: `https://brand-8fj38h0sr-mewo3.vercel.app/dashboard/review`
- **What to explore**:
  - **Evidence-Linked Finding Cards**: Click on any flagged issue to see the exact violation category, severity badge, source document clause citation, and why it was flagged.
  - **1-Click Apply Correction**: Click **"Accept Fix"** to replace the violation with the approved brand wording directly in the editor.
  - **Revision Snapshot (v1 → v2)**: Submitting your revised copy creates a new immutable revision snapshot. Use the **Version Diff comparison** toggle to view green/red visual line diffs of resolved errors.

### 5. Authorized Approvals Queue & Human-in-the-Loop Sign-off
- **URL**: `https://brand-8fj38h0sr-mewo3.vercel.app/dashboard/queue` (accessible to Reviewers & Admins).
- **How to test**:
  - Log in as **Reviewer (Sarah)** or **Admin (Jordan)**.
  - Open any pending submission.
  - Try **"Approve"**: Issues formal sign-off.
  - Try **"Request Changes"**: Leaves reviewer feedback comments and updates the workflow state to `needs_changes`.
  - Try **"Reject"**: Mandates an explanatory reason and denies publication.
  - *Try self-approval as a Creator*: The backend strictly returns HTTP 403 Forbidden to guarantee governance integrity!

### 6. Brand Guidelines, Facts & Terminology Hub
- **URL**: `https://brand-8fj38h0sr-mewo3.vercel.app/guidelines` (from sidebar: **"Guidelines Hub"**).
- **What to explore**:
  - Switch between **Approved Facts**, **Terminology Rules**, **Mandatory Disclaimers**, and **Tone Directives**.
  - Select any of the **10 Brand Workspaces** to inspect their isolated guidelines (e.g., NovaFit's ₹999 subscription, GreenBasket's ₹49 delivery fee, FinWise's ₹499 course).
  - Add or edit an approved fact — future content submissions for that brand immediately inherit the updated rule!

### 7. Admin Invitations & 1-Click Clipboard Activation
- **URL**: `https://brand-8fj38h0sr-mewo3.vercel.app/admin/invitations` (Admin only).
- **What to test**:
  - **Accept Pending Request**: Click **`ACCEPT`** on any applicant card.
  - **Copy Branded Activation Message**: Click the orange **`COPY LINK`** button at the top of an accepted member's card.
  - **Paste Anywhere**: Paste it into Gmail, Slack, WhatsApp, or Google Docs — it automatically pastes a formatted card with the black pill button: **`Activate Account & Set Password →`**!
  - **Copy Email**: Click the ghost **`COPY EMAIL`** button below to copy the applicant's verified email address in 1 click.

### 8. Immutable Audit Trail & In-App Notifications
- **How to test**:
  - Look at the top-right header for the **Notification Bell** to see real-time alerts when revisions are submitted or reviewed.
  - Open any review and navigate to the **Audit Trail** tab to view the tamper-proof log of timestamps, actors, and status transitions.

---

## 🛠️ Technology Stack & Architecture

```
┌────────────────────────────────────────────────────────┐
│                   React 18 SPA (Vite)                  │
│       Tailwind CSS • Lucide Icons • Motion Loading     │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST (Port 443)
┌───────────────────────────▼────────────────────────────┐
│               Node.js & Express API Gateway            │
│  • JWT Auth & RBAC Middleware                          │
│  • BOLA / IDOR Defense & Multi-Tenant Data Isolation   │
│  • Rate Limiting & Input Validation (Zod)              │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
┌─────────────▼──────────────┐ ┌──────────▼──────────────┐
│       Database Layer       │ │     AI Governance       │
│  MongoDB (Mongoose)        │ │  Google Gemini API      │
│  • Multi-Tenant Isolation  │ │  • Structured JSON mode │
│  • Guidelines & Facts DB   │ │  • Bounded Exponential  │
│  • Audit Trail & Snapshots │ │    Backoff + Jitter     │
└────────────────────────────┘ └─────────────────────────┘
```

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide React.
- **Backend:** Node.js, Express (ES Modules), Mongoose, Zod, Multer (multimodal uploads).
- **AI Engine:** Google Gemini with deterministic fallback and transient retry orchestrator (`429 RESOURCE_EXHAUSTED` / `503 UNAVAILABLE` handling).
- **Email & Access:** Resend HTTPS API with resilient direct one-click **COPY LINK** cryptographic activation tokens.

---

## 🎯 Verification & Benchmark Results

BrandDNA was benchmarked against a synthetic evaluation suite of test marketing copy and document assets:

- **Total Integration & Security Tests:** **101 tests passed across 13 suites (0 failures)**.
- **ExactCheck Accuracy:** **100%** on deterministic facts, prices, and prohibited terms.
- **False-Positive Rate:** **0.0%** (Exceeded proposal target of `< 10%`).
- **Detection Precision & Recall:** **100%** across 24 synthetic benchmark cases (Target was `> 85%`).
- **Human-in-the-Loop Enforcement:** Creators are strictly blocked (HTTP 403) from approving their own drafts.

---

## 🏁 Quickstart: Running Locally

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or pnpm
- Git

### 2. Clone the Repository
```bash
git clone https://github.com/Himanshu-k2/BrandDNA.git
cd BrandDNA
```

### 3. Backend Setup
```bash
cd backend
npm install
# Start backend server on port 5001
node src/server.js
```

### 4. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
# Start frontend on port 3000
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 5. Running the Automated Test Suite
To run all 101 unit, integration, and security tests:
```bash
cd backend
npm test
```

---

## 📂 Pre-seeded Demo Brands & Facts

The platform automatically boots with 10 production-ready fictional demo brands:

| Brand | Domain | Approved Fact / Price | Tone & Terminology Rule |
| :--- | :--- | :--- | :--- |
| **NovaFit Health** | Fitness & Wellness | Premium Membership: **₹999/mo** | Use **"members"**, forbid **"users"** |
| **GreenBasket** | Organic Grocery | Delivery Fee: **₹49** | Emphasize **sustainable farming** |
| **FinWise** | Financial EdTech | Masterclass Course: **₹499** | Strictly forbid **"guaranteed returns"** |
| **TravelNest** | Luxury Getaways | All-inclusive: **₹12,999** | Premium hospitality voice |
| **PureGlow** | Clean Skincare | Vitamin C Serum: **₹699** | Forbid **untested medical claims** |
| **ByteForge** | Cloud Developer Tools | Developer Tier: **₹1,499/mo** | Developer-first, technical tone |
| **EduSpark** | K-12 Learning | Annual Pass: **₹799** | Encouraging, student-focused |
| **FreshBite** | Healthy Meal Kits | Subscription: **₹199/meal** | Fresh, locally sourced emphasis |
| **HomeEase** | Smart Home Services | Deep Cleaning: **₹599** | Professional and punctual tone |
| **EcoDrive** | EV Mobility | Public Charging: **₹15/kWh** | Eco-conscious, modern voice |

---

## 👥 Team Responsibilities (Team Meow)

| Member | Core Responsibilities |
| :--- | :--- |
| **Himanshu Kumar**<br>*(Team Leader)* | • Product Vision & Hackathon Coordination<br>• Backend Architecture & Node.js Express REST API<br>• Database & MongoDB Schema Design<br>• Google Gemini AI Integration & Resilient Retry Engine<br>• Final Integration Testing & Security Pipeline Health |
| **Abhishek Kumar Prajapati**<br>*(Team Member)* | • Frontend React Architecture & UI System (Tailwind CSS)<br>• Brand Workspace & Guideline Management Interface<br>• Content Review & Interactive Findings Diff Rendering<br>• Approval Queue, Revisions Comparison & Audit Trail<br>• Presentation, Demo Preparation & Documentation |

---

## 📄 License
This project was developed for the **Inkloom AI Hackathon** by **Team Meow** and is open-sourced under the [MIT License](LICENSE).
