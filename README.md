# BrandDNA — AI-Powered Brand Governance Platform

> **Protecting the identity behind every brand message.**
>
> **Inkloom AI Hackathon — Final Round Submission**  
> **Team Name:** Meow  
> **Team Leader:** Himanshu Kumar  
> **Team Member:** Abhishek Kumar Prajapati  
> **Product Category:** AI-powered Brand Governance  

[![Live Frontend (Vercel)](https://img.shields.io/badge/Vercel-Live%20Frontend-black?logo=vercel)](https://brand-3tc74k0an-mewo3.vercel.app)
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
| **Production Web App** | Vercel | **[https://brand-3tc74k0an-mewo3.vercel.app](https://brand-3tc74k0an-mewo3.vercel.app)** |
| **Production API & Health** | Render | **[https://branddna-1-wndy.onrender.com/api/health](https://branddna-1-wndy.onrender.com/api/health)** |
| **Admin Invitations & Access** | Vercel | **[https://brand-3tc74k0an-mewo3.vercel.app/admin/invitations](https://brand-3tc74k0an-mewo3.vercel.app/admin/invitations)** |

---

## 👥 Three Core User Personas

| Persona | Role Identifier | Capabilities & Permissions |
| :--- | :---: | :--- |
| **1. Brand Manager** | `brand_manager` / `admin` | • Manages brand workspaces and visual identity.<br>• Defines approved facts, prices, tone directives, and terminology.<br>• Submits content and manages versioned rule sets. |
| **2. Content Creator** | `creator` | • Self-registers via public signup.<br>• Submits marketing copy, advertisements, captions, and PDF/DOCX/image assets.<br>• Runs AI-powered compliance evaluations and resolves flagged findings.<br>• Submits polished revisions (`v1` → `v2`) for formal approval. |
| **3. Platform Admin / Reviewer** | `admin` / `reviewer` | • Admin-controlled workspace onboarding and member invitations.<br>• Reviews flagged submissions in the formal approval queue.<br>• Approves, rejects (with mandatory justification), or requests changes.<br>• Inspects complete, immutable audit trails. |

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
