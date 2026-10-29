# BrandDNA Backend: AI-Powered Multimodal Brand Governance Engine

BrandDNA is an enterprise-grade AI brand governance and compliance platform. It intercepts and inspects marketing copy, multi-page PDF documents, and visual marketing assets prior to publication, ensuring absolute fidelity to approved brand guidelines, verified pricing, approved factual claims, and brand voice standards.

The backend operates as a decoupled RESTful microservice built with **Node.js**, **Express**, **MongoDB/Mongoose**, and **Google Gemini AI** (`@google/genai`).

---

## 🏗️ Architecture & System Design

```text
                               ┌─────────────────────────────────────────────────────────┐
                               │                 BrandDNA Client Layer                   │
                               │  (React Frontend :3000 / Postman Suite / REST API)       │
                               └───────────────────────────┬─────────────────────────────┘
                                                           │ HTTP Bearer JWT / Multipart
                                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       Express Application (:5001)                                      │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  Security & Middleware Stack:                                                                          │
│  - Helmet (HTTP Header Protection)      - CORS Policy Enforcement       - express-rate-limit (60/15m)  │
│  - JWT Authentication Middleware        - Role Authorization (RBAC)     - Multi-Tenant Org Isolation   │
│  - Multer In-Memory File Buffer Storage - Magic Byte Binary Signature Inspection (PDF, PNG, JPEG, WebP)│
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  Governance Review Pipeline:                                                                           │
│                                                                                                        │
│   [ Input Asset ]                                                                                      │
│          │                                                                                             │
│          ├────────► Pure Text Copy ──────┐                                                             │
│          ├────────► Multi-Page PDF ─────► In-Memory Parser (pdf-parse) ─► Page Text Envelopes          │
│          └────────► Marketing Image ────► In-Memory Buffer (sharp) ─────► EXIF Orientation & Hex Colors│
│                                                                                                        │
│   [ Hybrid Evaluation Engine ]                                                                         │
│          │                                                                                             │
│          ├── 1. Deterministic Rule Checker (Exact Regex, Prohibited Vocabulary, Conflicting Prices)    │
│          │                                                                                             │
│          └── 2. Google Gemini Contextual Analysis (Prompt Injection Containment, Tone & Claims)       │
│                     │                                                                                  │
│                     ├─► Primary: gemini-3.8-flash (with bounded exponential backoff & jitter)         │
│                     ├─► Auto-Fallback: gemini-3-flash-preview (on 503/504 transient spikes)            │
│                     └─► Safe Partial Fallback (100% deterministic preservation if offline)             │
│                                                                                                        │
│   [ Merge, Deduplicate & Localize ]                                                                    │
│          │                                                                                             │
│          ▼ Stamped Finding ID, Severity, Page Number, Evidence Citation, Compliance Score              │
│                                                                                                        │
│   [ Workflow State Machine ]                                                                           │
│          │                                                                                             │
│          ▼ draft ──► analyzing ──► needs_changes / pending_approval ──► approved / rejected             │
│                                                                                                        │
│   [ Persistence & Audit Trail ]                                                                        │
│          │                                                                                             │
│          ▼ MongoDB: ContentReview + ReviewRevision (v1, v2...) + ReviewComment + AuditLog + Notification│
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Folder Structure

```text
backend/
├── src/
│   ├── config/              # Infrastructure clients (MongoDB lifecycle, Google Gemini SDK)
│   ├── controllers/         # Express request handlers (Auth, Brands, Reviews, Workflow, etc.)
│   ├── middleware/          # Security, JWT auth, RBAC, tenant isolation, rate limiting, error handling
│   ├── models/              # Mongoose schemas (User, Brand, Guideline, Fact, Term, Asset, Review, etc.)
│   ├── routes/              # Declarative REST endpoint routing definitions
│   ├── services/            # Core business logic (aiReviewService, ruleCheckService, workflowService, etc.)
│   ├── utils/               # Resilient retry logic (geminiRetry), file signatures, JWT helpers, seeders
│   ├── validators/          # Strict schema validation using Zod
│   ├── app.js               # Express application initialization & middleware stack
│   └── server.js            # Entrypoint with graceful shutdown signals (SIGINT/SIGTERM)
├── tests/                   # Automated Node test runner suites (84 tests across 11 suites)
├── postman/                 # 9-folder comprehensive Postman collection (BrandDNA.postman_collection.json)
├── scripts/                 # Idempotent demo database seeding script (seedDemoData.js)
├── data/                    # 24-case ground-truth synthetic evaluation dataset (evaluationDataset.json)
├── .env.example             # Safe, documented environment configuration template
└── package.json             # ES Module dependencies, scripts, and runtime engines
```

---

## ✨ Features Actually Implemented & Verified

| Feature Area | Implementation Status | Technical Verification |
| :--- | :--- | :--- |
| **Authentication & RBAC** | ✅ Implemented | Bcryptjs (10 salt rounds), JWT signing (`HS256`), role enforcement (`admin`, `creator`, `reviewer`), privilege escalation guardrails via `ADMIN_INVITE_SECRET`. |
| **Multi-Tenant Isolation** | ✅ Implemented | Strict `organizationId` filtering across all brand, review, comment, revision, and audit log queries. |
| **Brand Knowledge Base** | ✅ Implemented | Workspace CRUD, guideline versioning with change tracking, verified factual claims, and case-sensitive/insensitive terminology pairs. |
| **Visual Asset Registry** | ✅ Implemented | Dedicated endpoints for primary, secondary, and prohibited brand colors (`#39FF14`), logo usage rules, and typography standards. |
| **Deterministic Checker** | ✅ Implemented | Exact word boundary regex matching for prohibited vocabulary and normalized currency/price verification against approved brand facts. |
| **Gemini AI Review** | ✅ Implemented | Contextual voice and superlative claim detection using supported model `gemini-3.8-flash` with structured JSON output enforcement. |
| **AI Resilience & Retry** | ✅ Implemented | Bounded retries with exponential backoff and full jitter; automatic fallback to `gemini-3-flash-preview` on 503/504 spikes; immediate exit on permanent 400/401 errors. |
| **Multimodal PDF Reviews** | ✅ Implemented | Binary `%PDF-` magic byte inspection, encryption/password detection, per-page text extraction, unanalyzable page flagging, page-localized findings. |
| **Multimodal Image Reviews**| ✅ Implemented | Binary magic byte verification (`JPEG`, `PNG`, `WebP`), EXIF auto-rotation via `sharp`, dominant color extraction, OCR transcription & visual branding checks. |
| **Revision History** | ✅ Implemented | Immutable snapshot tracking (`ReviewRevision`), automatic version incrementing (`v1` → `v2`), previous revision superseding. |
| **Human Approval Workflow** | ✅ Implemented | Role-enforced state transitions (`pending_approval` → `approved`/`rejected`/`needs_changes`), self-approval blocking, mandatory decision justifications. |
| **Audit Logs & Alerts** | ✅ Implemented | Chronological governance audit logging (`AuditLog`) and database-backed in-app notifications (`Notification`). |
| **Synthetic Benchmark** | ✅ Implemented | 24-case ground-truth evaluation benchmark achieving 100% Precision, Recall, and F1-Score. |

---

## 📋 Prerequisites & Installation

### Prerequisites
- **Node.js**: v18.0.0 or later (v24.x recommended)
- **MongoDB**: Local MongoDB instance (v6.0+) or MongoDB Atlas cluster URI
- **Google Gemini API Key**: Acquired free from [Google AI Studio](https://aistudio.google.com/)

### Installation
Clone the repository, navigate into the `backend/` directory, and install dependencies:
```bash
cd backend
npm install
```

---

## ⚙️ Environment Configuration

The backend reads configuration from a local `.env` file in the `backend/` directory.

> [!IMPORTANT]
> The backend server is hard-configured to run on **port 5001** to avoid collisions with the React frontend on port 3000 and Vite on port 5173.

### Safe Template (`.env.example`)
Create your `.env` file by copying the provided template:
```bash
cp .env.example .env
```

Populate `.env` with your environment values:
```env
# Server Network Configuration
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database Configuration (MongoDB Atlas or Local MongoDB)
MONGODB_URI=mongodb://localhost:27017/branddna

# Authentication & Security
JWT_SECRET=your_jwt_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# Role Escalation Secret (Required to register as 'admin' or 'reviewer')
ADMIN_INVITE_SECRET=your_admin_registration_passcode_here

# Google Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Gemini Model Selection (Configurable; defaults to gemini-3.8-flash)
GEMINI_MODEL=gemini-3.8-flash

# Optional: Secondary fallback model during demand spikes (defaults to gemini-3-flash-preview)
GEMINI_FALLBACK_MODEL=gemini-3-flash-preview
```

---

## 🗄️ Database Setup & Demo Data Seeding

BrandDNA includes two safe, completely idempotent database seed scripts that populate rich brand guidelines, verified pricing, and terminology rules without deleting existing user data:

### Option 1: Seed 10 Competition-Ready Demo Brands (Recommended)
Seeds 10 distinct fictional companies across various industries (NovaFit, GreenBasket, FinWise, TravelNest, PureGlow, ByteForge, EduSpark, FreshBite, HomeEase, EcoDrive). Each company comes pre-configured with $\ge 5$ guidelines, $\ge 5$ facts, and $\ge 3$ terminology rules:
```bash
npm run seed:demo
```

### Option 2: Seed Single Brand (NovaFit Only)
Seeds only the core NovaFit fitness brand workspace:
```bash
npm run seed
```

---

## 🚀 Starting the Server

### Development Mode (with hot-reloading via Nodemon):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```
*The server will start listening at `http://localhost:5001`.*

---

## 📡 API Endpoint Reference

All endpoints (except health and public auth) require the HTTP header:
```text
Authorization: Bearer <JWT_TOKEN>
```

### 1. Health & Foundation
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Root service ping and docs pointer |
| `GET` | `/api/health` | Public | Returns system health, database state, uptime, and environment |

### 2. Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user. Defaults to `creator`. Provide `adminSecretKey` for `admin` / `reviewer`. |
| `POST` | `/api/auth/login` | Public | Authenticate with email/password; returns JWT. |
| `GET` | `/api/auth/me` | Authenticated | Retrieve authenticated user profile and organization ID. |

### 3. Brand Workspace & Knowledge Base (`/api/brands`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/brands` | `admin` | Create brand workspace |
| `GET` | `/api/brands` | Authenticated | List all brand workspaces in organization (pagination & search) |
| `GET` | `/api/brands/:id` | Authenticated | Retrieve single brand workspace details |
| `PATCH` | `/api/brands/:id` | `admin` | Update brand details |
| `DELETE`| `/api/brands/:id` | `admin` | Soft-delete / archive brand workspace |
| `POST` | `/api/brands/:id/guidelines` | `admin` | Create guideline rule |
| `GET` | `/api/brands/:id/guidelines` | Authenticated | List brand guidelines (category filter available) |
| `POST` | `/api/brands/:id/facts` | `admin` | Register verified product/pricing fact |
| `GET` | `/api/brands/:id/facts` | Authenticated | List approved brand facts |
| `POST` | `/api/brands/:id/terminology` | `admin` | Add prohibited vs. preferred term rule |
| `GET` | `/api/brands/:id/terminology`| Authenticated | List active terminology rules |
| `POST` | `/api/brands/:id/visual-assets`| `admin` | Register brand visual rules (color palettes, logo rules) |
| `GET` | `/api/brands/:id/visual-assets`| Authenticated | List brand visual assets |

### 4. Content Review Engine (`/api/reviews`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/reviews` | Authenticated | Submit plain text copy for governance review (`application/json`) |
| `POST` | `/api/reviews/upload` | Authenticated | Submit multi-page PDF or image for review (`multipart/form-data`) |
| `GET` | `/api/reviews` | Authenticated | List reviews submitted within the organization |
| `GET` | `/api/reviews/:id` | Authenticated | Retrieve complete review report, score, and findings |

### 5. Revisions, Comments, & Human Decisions
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/reviews/:id/revisions` | Authenticated | Submit corrected copy revision (increments to `v2`) |
| `POST` | `/api/reviews/:id/revisions/upload` | Authenticated | Submit corrected PDF/image revision (`multipart/form-data`) |
| `GET` | `/api/reviews/:id/revisions` | Authenticated | Retrieve immutable revision snapshot history |
| `GET` | `/api/reviews/:id/revisions/:vNum` | Authenticated | Retrieve a specific historical snapshot |
| `POST` | `/api/reviews/:id/comments` | Authenticated | Append collaborative feedback comment |
| `GET` | `/api/reviews/:id/comments` | Authenticated | List discussion thread comments |
| `GET` | `/api/reviews/:id/audit-trail` | Authenticated | View immutable chronological governance audit trail |
| `POST` | `/api/reviews/:id/submit` | Authenticated | Transition content to `pending_approval` |
| `POST` | `/api/reviews/:id/request-changes` | `reviewer`, `admin` | Request changes (reason required; sets `needs_changes`) |
| `POST` | `/api/reviews/:id/reject` | `reviewer`, `admin` | Reject submission (reason required; sets `rejected`) |
| `POST` | `/api/reviews/:id/approve` | `reviewer`, `admin` | Officially approve content (sets `approved`) |

### 6. Notifications (`/api/notifications`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Authenticated | List in-app notifications for authenticated user |
| `PATCH` | `/api/notifications/:id/read` | Authenticated | Mark single notification as read |
| `POST` | `/api/notifications/read-all` | Authenticated | Mark all notifications as read |

---

## 🔒 Role Permissions Matrix

| Capability | Platform Admin (`admin`) | Content Creator (`creator`) | Governance Reviewer (`reviewer`) |
| :--- | :---: | :---: | :---: |
| Create / Edit Brands | ✅ | ❌ | ❌ |
| Create Guidelines / Facts / Terms | ✅ | ❌ | ❌ |
| Register Visual Identity Assets | ✅ | ❌ | ❌ |
| Submit Text Copy for Review | ✅ | ✅ | ✅ |
| Upload PDF / Images for Review | ✅ | ✅ | ✅ |
| Submit New Revisions | ✅ | ✅ | ❌ |
| Add Review Comments | ✅ | ✅ | ✅ |
| Request Approval (`/submit`) | ✅ | ✅ | ❌ |
| Approve Submissions (`/approve`) | ✅ | ❌ *(Self-Approval Blocked)* | ✅ |
| Reject Submissions (`/reject`) | ✅ | ❌ | ✅ |
| Request Changes (`/request-changes`)| ✅ | ❌ | ✅ |
| View Organization Audit Trail | ✅ | ✅ | ✅ |

---

## 📖 Multimodal Review Instructions

### 1. Plain Text Copy Review
Submit marketing text as JSON:
```bash
curl -X POST http://localhost:5001/api/reviews \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "<BRAND_ID>",
    "content": "Hey users! NovaFit is India\x27s No. 1 gym with membership at ₹799 per month.",
    "contentType": "social_post"
  }'
```
*Detects: Prohibited term "users" (suggests "members"), unapproved price "₹799" (expects "₹999"), and superlative claim "No. 1" (unsupported).*

### 2. Multi-Page PDF Document Review
Upload a marketing brochure or flyer (`multipart/form-data`):
```bash
curl -X POST http://localhost:5001/api/reviews/upload \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@brochure.pdf;type=application/pdf" \
  -F "brandId=<BRAND_ID>" \
  -F "title=Q4 Campaign Brochure"
```
*Results include exact page localization (`pageNumber: 1`), text extraction summaries, and deterministic + AI findings.*

### 3. Marketing Image Review (Copy + Visual Identity)
Upload a promotional banner or poster (`JPEG`, `PNG`, `WebP`):
```bash
curl -X POST http://localhost:5001/api/reviews/upload \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@promo_banner.png;type=image/png" \
  -F "brandId=<BRAND_ID>" \
  -F "title=Promotional Social Banner"
```
*Inspects both transcribed text inside the image and visual branding compliance (prohibited colors like neon green `#39FF14`, logo rules, contrast).*

---

## 🧪 Testing Instructions & Synthetic Evaluation Benchmark

The test suite runs using Node's built-in test runner (`node:test`) and an isolated, in-memory MongoDB server (`mongodb-memory-server`):

### Run All 84 Automated Tests:
```bash
npm test
```

### Verified Test Suites (11 Suites, 84 Tests):
1. **Phase 1: Foundation & Health Check Tests** (3 tests)
2. **Phase 2: Authentication & Authorization Tests** (15 tests)
3. **Phase 3: Brand Management & Knowledge Base Tests** (11 tests)
4. **Phase 4: AI & Deterministic Content Review Engine Tests** (9 tests)
5. **Phase 5: Review Workflow, Revisions, Comments & Approval Tests** (9 tests)
6. **BrandDNA Multimodal Governance Engine Tests** (20 tests)
7. **Gemini Resilience & Retry Engine Tests** (16 tests)
8. **Synthetic Evaluation Benchmark** (24 Labelled Ground-Truth Cases)

### Synthetic Benchmark Performance:
```text
======================================================
📊 SYNTHETIC EVALUATION BENCHMARK RESULTS
======================================================
Total Cases Evaluated:   24
True Positives (TP):     17
True Negatives (TN):     7
False Positives (FP):    0
False Negatives (FN):    0
------------------------------------------------------
Accuracy:                100.00%
Precision:               100.00%
Recall:                  100.00%
F1-Score:                100.00%
======================================================
```

---

## 📮 Postman Collection Setup

A pre-configured, self-contained Postman collection is located at:
[`backend/postman/BrandDNA.postman_collection.json`](postman/BrandDNA.postman_collection.json)

### Importing & Running:
1. Open Postman and click **Import**.
2. Select `backend/postman/BrandDNA.postman_collection.json`.
3. The collection is organized into **9 functional folders**:
   - `1. Health`
   - `2. Authentication`
   - `3. Brands`
   - `4. Guidelines, Facts, and Terminology`
   - `5. Text Reviews`
   - `6. PDF and Image Uploads`
   - `7. Revisions and Comments`
   - `8. Approvals and Rejections`
   - `9. Notifications`
4. Run `2. Authentication -> Login (Captures authToken)`: the collection variable `authToken` will be automatically populated for all subsequent requests.

---

## 🛡️ Security & Deployment Considerations

1. **Zero Orphaned Disk Files**: Uploaded PDFs and images are processed completely in-memory using Node.js `Buffer` streams (`multer.memoryStorage()`). No temporary files are written to the filesystem.
2. **Binary Magic Byte Verification**: File payloads are verified by examining raw header bytes (`%PDF-`, `\x89PNG`, `\xFF\xD8\xFF`, `RIFF...WEBP`) to block MIME-type spoofing or executable masquerading.
3. **Untrusted Data Containment**: All user-submitted copy and extracted PDF text is strictly enclosed within `<submitted_content>` and `<untrusted_document_page>` security envelopes to prevent adversarial prompt injection.
4. **Resilient AI Pipeline**: The engine automatically recovers from transient Google Gemini `503 UNAVAILABLE` / `504 DEADLINE_EXCEEDED` errors via bounded exponential backoff with jitter and transparent fallback to `gemini-3-flash-preview`.
5. **Deterministic Safeguards**: If the Gemini API is unreachable or unconfigured, the platform automatically returns complete deterministic findings with `isPartialAnalysis: true`.

---

## ⚠️ Known Limitations & Troubleshooting

- **Scanned / Image-Only PDFs**: PDFs containing only raster images without an embedded text layer will have their pages flagged in `unanalyzablePages` with a warning advising OCR pre-processing.
- **Rate Limits on Free Gemini Tiers**: Google AI Studio's free tier has request per minute (RPM) limits. The backend handles this with bounded exponential retries and fallback models. For high-volume production, configure a paid Google Cloud project key.
- **Port Conflicts**: Ensure no other service binds to port `5001`. The backend requires port `5001`.
