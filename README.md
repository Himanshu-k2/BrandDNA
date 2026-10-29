# BrandDNA --- AI-Powered Brand Governance Platform

> **Protecting the identity behind every brand message.**

BrandDNA is a web application designed to help organisations check
marketing content against their approved brand guidelines before
publication. It aims to identify inconsistent wording, incorrect product
facts, unsupported claims, and other brand-related issues; explain why
an issue was flagged; suggest corrections; and support human review and
approval.

**Team:** Meow\
**Team Leader:** Himanshu Kumar\
**Team Member:** Abhishek Kumar Prajapati\
**Project status:** In development --- confirm the current
implementation status before describing any feature as complete.

------------------------------------------------------------------------

## Table of contents

1.  [Problem and solution](#1-problem-and-solution)
2.  [Main features](#2-main-features)
3.  [Technology stack](#3-technology-stack)
4.  [System architecture](#4-system-architecture)
5.  [Repository structure](#5-repository-structure)
6.  [Prerequisites](#6-prerequisites)
7.  [Environment configuration](#7-environment-configuration)
8.  [Run the project locally](#8-run-the-project-locally)
9.  [Frontend and backend
    connection](#9-frontend-and-backend-connection)
10. [API reference](#10-api-reference)
11. [Authentication and user roles](#11-authentication-and-user-roles)
12. [Content review workflow](#12-content-review-workflow)
13. [Document upload](#13-document-upload)
14. [Demo data](#14-demo-data)
15. [Error handling and reliability](#15-error-handling-and-reliability)
16. [Security notes](#16-security-notes)
17. [Testing checklist](#17-testing-checklist)
18. [Deployment](#18-deployment)
19. [Known limitations and verification
    notes](#19-known-limitations-and-verification-notes)
20. [Team responsibilities](#20-team-responsibilities)
21. [Future scope](#21-future-scope)

------------------------------------------------------------------------

## 1. Problem and solution

Organisations create content through employees, agencies, freelancers,
and AI tools. Different people may use inconsistent language, outdated
product details, unapproved visuals, or promotional claims that do not
have approved evidence.

BrandDNA aims to provide one place where a team can:

-   Store approved brand guidelines, facts, terminology, and assets.
-   Submit content for review before publication.
-   Check content against the selected brand's rules.
-   View findings, explanations, and suggested corrections.
-   Revise content and send it to an authorised reviewer.
-   Track review status, comments, revisions, and decisions.
-   Identify repeated issues that may indicate unclear guidelines.

BrandDNA is not intended to replace human judgment. AI analysis is
assistance, not approval. The final decision remains with an authorised
human reviewer.

## 2. Main features

The intended product capabilities include:

-   **Brand management:** Create and manage separate brand workspaces.
-   **Guideline management:** Maintain rules that content should follow.
-   **Approved facts:** Store current prices and other approved product
    information.
-   **Terminology management:** Record preferred and prohibited terms.
-   **Content review:** Submit text for brand checks and AI-assisted
    analysis.
-   **Explainable findings:** Display issues and, where returned by the
    backend, their severity, explanations, and supporting rules or
    facts.
-   **Suggested corrections:** Help creators improve content while
    preserving the intended message.
-   **Document upload:** Submit supported PDF documents for review.
-   **Human approval:** Submit content, request changes, approve, or
    reject through the review workflow.
-   **Comments and revisions:** Keep discussion and revision history for
    a review.
-   **Notifications:** Show notifications returned by the backend.
-   **Audit trail:** Retrieve review history where supported.
-   **Governance analytics:** Future development may summarise recurring
    errors and unclear guidelines.

Feature availability depends on the current backend and frontend
implementation. Do not present a planned feature as complete until it
has been tested.

## 3. Technology stack

  -----------------------------------------------------------------------
  Layer                   Technology              Purpose
  ----------------------- ----------------------- -----------------------
  Frontend                React                   User interface and
                                                  interactive pages

  Styling                 Existing frontend       Consistent layout and
                          styling/UI framework    visual design; confirm
                                                  the actual framework in
                                                  the frontend repository

  Backend                 Node.js and Express     API endpoints and
                                                  application logic

  Database                MongoDB with Mongoose   Store users, brands,
                                                  rules, facts, reviews,
                                                  and related records

  Authentication          JWT and bcrypt          Token-based
                                                  authentication and
                                                  password hashing

  AI analysis             Google Gemini API       AI-assisted content
                                                  analysis, when
                                                  available

  Fallback checks         Deterministic           Basic checks when AI
                          rule-based logic        analysis is unavailable

  Backend hosting         Render                  Host the API

  Frontend hosting        Vercel                  Host the web
                                                  application

  Version control         Git and GitHub          Track code changes and
                                                  collaborate
  -----------------------------------------------------------------------

The configured Gemini model must be verified against the current backend
environment and the current Gemini API/SDK. Do not assume an older model
name is still supported.

## 4. System architecture

``` text
User
  |
  v
React Frontend (Vercel)
  |
  | HTTPS requests to /api
  v
Node.js + Express API (Render)
  |
  +--> Authentication and role/organisation checks
  |
  +--> Brand rules, approved facts, terminology
  |         |
  |         v
  |      MongoDB via Mongoose
  |
  +--> Review engine
  |       +--> Deterministic rule checks
  |       +--> Gemini analysis when available
  |       +--> Partial-analysis/fallback status
  |
  +--> Review workflow
  |       +--> Comments and revisions
  |       +--> Submit / approve / request changes / reject
  |       +--> Audit trail and notifications
  |
  v
Structured API responses returned to the frontend
```

The frontend should display real API results. It must not silently
replace a failed API response with mock data or claim that AI analysis
succeeded when the backend reports a partial or unavailable analysis.

## 5. Repository structure

The exact structure depends on the current repository. A typical
arrangement is:

``` text
BrandDNA/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── .env                 # local frontend configuration; do not commit secrets
│   └── package.json
├── backend/
│   ├── src/                 # or the existing backend source layout
│   ├── .env                 # local backend secrets; do not commit
│   └── package.json
└── README.md
```

**Important:** This is an example structure, not a claim about the exact
current repository. Keep the existing folder and file names if they
differ. Check the backend and frontend `package.json` files for the
actual start scripts.

## 6. Prerequisites

Install or obtain access to:

-   Node.js and npm.
-   The project repository.
-   A MongoDB database for local development, if running the backend
    locally.
-   A Gemini API key if AI analysis is enabled.
-   The configured backend and frontend hosting accounts for deployment.

Use compatible Node.js versions based on the project's `package.json`
and deployment configuration.

## 7. Environment configuration

### Frontend environment

For a Vite frontend, create or update `frontend/.env`:

``` env
VITE_API_BASE_URL=http://localhost:5001
```

For the deployed frontend, configure:

``` env
VITE_API_BASE_URL=https://branddna-zojh.onrender.com
```

After changing Vite environment variables, restart the frontend
development server.

Only public configuration, such as the API base URL, belongs in the
frontend environment. **Never put database credentials, JWT secrets,
Gemini API keys, or admin invitation secrets in frontend variables.**
Vite variables prefixed with `VITE_` are exposed to the browser.

### Backend environment

The backend integration guide lists these configuration names:

``` env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-long-random-secret>
JWT_EXPIRES_IN=7d
ADMIN_INVITE_SECRET=<your-admin-invitation-secret>
GEMINI_API_KEY=<your-gemini-api-key>
GEMINI_MODEL=<a-current-model-supported-by-your-api-and-SDK>
```

Use the values required by the actual backend code. These placeholders
are not working credentials. Do not commit `.env` files or print secrets
in logs.

The integration guide identifies port `5001` for local backend
development. Confirm the deployed server's port-binding behaviour before
changing it; hosting platforms may provide their own port configuration.

### CORS

The backend must allow requests from the actual frontend origin. The
guide lists `CLIENT_URL=http://localhost:3000` as a previous
configuration example, but a Vite app often uses another port, such as
`5173`. Set `CLIENT_URL` and CORS configuration to match the real local
frontend URL and the deployed Vercel domain. Confirm the backend
implementation before changing configuration.

## 8. Run the project locally

The exact commands depend on the scripts in each `package.json`. A
common setup is:

### Start the backend

``` bash
cd backend
npm install
npm run dev
```

If the backend does not define a `dev` script, inspect
`backend/package.json` and use its actual start script.

Check the API health endpoint:

``` text
GET http://localhost:5001/api/health
```

A successful health response confirms that the health route is
reachable. It does **not** prove that MongoDB, Gemini, authentication,
or every workflow is working.

### Start the frontend

Open a second terminal:

``` bash
cd frontend
npm install
npm run dev
```

Use the frontend URL printed by the development server. Confirm that
`VITE_API_BASE_URL` points to the backend you intend to use.

## 9. Frontend and backend connection

The frontend should use one central API base URL rather than hardcoding
the backend URL in multiple components.

Example for a Vite frontend:

``` js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not configured");
}

export { API_BASE_URL };
```

A central API client should handle:

-   The base URL.
-   JSON request and response handling.
-   Authentication headers when required.
-   Network and HTTP errors.
-   Expired or invalid tokens.
-   Loading and empty states.
-   Backend validation messages.
-   Partial-analysis warnings.

For protected routes, the backend may require:

``` http
Authorization: Bearer <token>
```

Follow the existing authentication implementation and confirm the actual
middleware requirements. Do not duplicate token logic differently in
every component.

### Integration principles

1.  Match the actual API paths and HTTP methods.
2.  Confirm request fields and response shapes from the backend
    controllers and route handlers.
3.  Use a real brand ID returned by the API.
4.  Render the actual returned findings and status.
5.  Use `FormData` for file uploads.
6.  Do not manually set the `Content-Type` header for browser
    `FormData`; the browser must set the multipart boundary.
7.  Handle network failures, CORS errors, invalid tokens, and hosting
    cold starts clearly.
8.  Do not show fake success messages when the API request fails.
9.  Enforce permissions on the backend. Hiding a button in the frontend
    is not a security control.

## 10. API reference

The following endpoints were listed in the backend integration guide.
Verify their exact schemas and response formats against the current
backend code before relying on them.

### Health

  -----------------------------------------------------------------------
  Method                  Endpoint                Purpose
  ----------------------- ----------------------- -----------------------
  GET                     `/api/health`           Check whether the API
                                                  health route is
                                                  reachable

  -----------------------------------------------------------------------

### Authentication

  Method   Endpoint               Purpose
  -------- ---------------------- --------------------------------------
  POST     `/api/auth/register`   Register a user
  POST     `/api/auth/login`      Authenticate a user
  GET      `/api/auth/me`         Get the authenticated user's profile

The exact registration/login request fields and response formats must be
confirmed from the route handlers and controllers.

### Brands

  -----------------------------------------------------------------------
  Method                  Endpoint                Purpose
  ----------------------- ----------------------- -----------------------
  GET                     `/api/brands`           List brands accessible
                                                  to the user

  POST                    `/api/brands`           Create a brand

  GET                     `/api/brands/:id`       Get brand details

  PATCH                   `/api/brands/:id`       Update a brand

  DELETE                  `/api/brands/:id`       Archive a brand;
                                                  reported to be a soft
                                                  archive
  -----------------------------------------------------------------------

Inspect the Mongoose schema and validation to confirm brand fields.

### Brand guidelines

  Method   Endpoint                       Purpose
  -------- ------------------------------ -----------------------------
  GET      `/api/brands/:id/guidelines`   List guidelines for a brand
  POST     `/api/brands/:id/guidelines`   Create a guideline
  PATCH    `/api/guidelines/:id`          Update a guideline
  DELETE   `/api/guidelines/:id`          Delete a guideline

Confirm the guideline field names, categories, validation, and
permissions in the backend source.

### Approved facts

  Method   Endpoint                  Purpose
  -------- ------------------------- ---------------------------------
  GET      `/api/brands/:id/facts`   List approved facts for a brand
  POST     `/api/brands/:id/facts`   Add an approved fact
  PATCH    `/api/facts/:id`          Update a fact
  DELETE   `/api/facts/:id`          Delete a fact

Do not hardcode prices in frontend components. Fetch current approved
facts from the backend. Confirm field names, data types, currency
handling, and validity/status fields.

### Terminology

  Method   Endpoint                        Purpose
  -------- ------------------------------- ---------------------------
  GET      `/api/brands/:id/terminology`   List terminology rules
  POST     `/api/brands/:id/terminology`   Create a terminology rule
  PATCH    `/api/terminology/:id`          Update a terminology rule
  DELETE   `/api/terminology/:id`          Delete a terminology rule

Example demo rule: prefer **"members"** and avoid **"users."** This is
an example for the NovaFit demo brand, not a universal rule for all
brands. Retrieve each brand's real terminology from the API.

### Reviews and content analysis

  -----------------------------------------------------------------------
  Method                  Endpoint                Purpose
  ----------------------- ----------------------- -----------------------
  POST                    `/api/reviews`          Create a content review

  GET                     `/api/reviews`          List accessible reviews

  GET                     `/api/reviews/:id`      Retrieve review details

  POST                    `/api/reviews/upload`   Upload a supported
                                                  document for review
  -----------------------------------------------------------------------

A previously used text-review request had this shape:

``` json
{
  "brandId": "REAL_BRAND_ID",
  "content": "Hey users! Join NovaFit for ₹799 per month!",
  "contentType": "social_post"
}
```

This is an example request only. Use a real brand ID returned by the API
and confirm the required fields in the backend code.

The backend is designed to check guidelines, approved facts,
terminology, and potential unsupported claims. AI-assisted analysis may
be used when available, with deterministic fallback checks when AI is
unavailable.

The frontend should display only fields that actually exist in the
response. Inspect the response JSON for findings, severity,
explanations, suggested corrections, source references, analysis status,
and review status. These are intended display categories, not guaranteed
property names.

### Revisions, comments, approval, and audit trail

  ---------------------------------------------------------------------------------------------
  Method                  Endpoint                                      Purpose
  ----------------------- --------------------------------------------- -----------------------
  POST                    `/api/reviews/:id/revisions`                  Create a revision

  GET                     `/api/reviews/:id/revisions`                  List revisions

  GET                     `/api/reviews/:id/revisions/:versionNumber`   Get a particular
                                                                        version

  POST                    `/api/reviews/:id/submit`                     Submit a review

  POST                    `/api/reviews/:id/comments`                   Add a comment

  GET                     `/api/reviews/:id/comments`                   List comments

  POST                    `/api/reviews/:id/approve`                    Approve a review

  POST                    `/api/reviews/:id/request-changes`            Request changes

  POST                    `/api/reviews/:id/reject`                     Reject a review

  GET                     `/api/reviews/:id/audit-trail`                Retrieve review history
  ---------------------------------------------------------------------------------------------

Confirm the exact state transitions and which roles may perform each
action before enabling workflow controls.

### Notifications

  -------------------------------------------------------------------------------
  Method                  Endpoint                        Purpose
  ----------------------- ------------------------------- -----------------------
  GET                     `/api/notifications`            List notifications

  PATCH                   `/api/notifications/:id/read`   Mark a notification as
                                                          read

  POST                    `/api/notifications/read-all`   Mark all notifications
                                                          as read
  -------------------------------------------------------------------------------

Verify the notification response fields and whether the response is a
list or a wrapped object.

## 11. Authentication and user roles

The backend integration guide identifies these role values:

  Backend role   Intended interface
  -------------- ----------------------------------------
  `admin`        Platform administrator / brand manager
  `creator`      Content creator
  `reviewer`     Brand reviewer / approver

The frontend may show friendlier labels, but API requests must use the
exact backend role values.

Reported authentication behaviour:

-   Passwords are hashed with bcrypt.
-   Authentication uses JWTs.
-   Protected API routes use backend middleware.
-   Role-based authorisation and organisation-level data isolation are
    intended.
-   Public registration defaults to `creator`.
-   The first registered user may be assigned `admin` by bootstrap
    logic.
-   Elevated roles require the configured invitation or authorisation
    mechanism.

Verify the current backend implementation before exposing administrator
registration. Never let a public user grant themselves an administrator
role by changing a frontend field.

## 12. Content review workflow

The intended flow is:

1.  A creator chooses a brand and submits content.
2.  The backend runs configured rule checks and available AI analysis.
3.  The frontend displays findings and any analysis warnings.
4.  The creator reviews suggestions and creates a revision if needed.
5.  The creator submits the content for approval.
6.  An authorised reviewer approves, requests changes, or rejects it.
7.  The system keeps revision history and audit records where supported.

Reported review states include:

-   `draft`
-   `analyzing`
-   `needs_changes`
-   `pending_approval`
-   `approved`
-   `rejected`

Confirm the exact states and allowed transitions in the current backend
code. Do not assume every state is valid for every action.

**Important:** AI findings are not approval. Approval actions must call
the backend and respect server-side permissions.

## 13. Document upload

The backend guide reports that `POST /api/reviews/upload` was exercised
successfully and returned HTTP `201 Created` for a PDF upload.

The tested multipart fields were:

-   `brandId`: a valid brand ID.
-   `assetType`: `pdf`.
-   `file`: the selected PDF file.

Example:

``` js
const formData = new FormData();
formData.append("brandId", brandId);
formData.append("assetType", "pdf");
formData.append("file", file);

const response = await fetch(
  `${API_BASE_URL}/api/reviews/upload`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  }
);

const result = await response.json();
```

Adapt this example to the project's existing API client. Do not manually
set the multipart `Content-Type` header.

The guide reports that document analysis previously returned a
partial-analysis warning because Gemini document analysis was
unavailable. The frontend must display partial analysis honestly and
distinguish it from successful AI analysis. Verify current file type
restrictions, file size limits, response fields, and error formats in
the backend.

## 14. Demo data

The backend guide reports a demo seeding command:

``` bash
npm run seed:demo
```

It reportedly seeds ten demo brands, including NovaFit, GreenBasket,
FinWise, TravelNest, PureGlow, ByteForge, EduSpark, FreshBite, HomeEase,
and EcoDrive.

Example facts in the reported demo data include NovaFit at ₹999 monthly
and GreenBasket with a ₹49 delivery fee. These are reported seed
examples, not guaranteed current production data.

Before running the seed command:

1.  Inspect the current seed script.
2.  Confirm which database connection it uses.
3.  Run it only against the intended development/demo database.
4.  Never seed or overwrite production data just to populate the
    frontend.

Always retrieve current brands and facts through the API.

## 15. Error handling and reliability

The frontend should handle:

-   Invalid login credentials.
-   Form validation errors.
-   Missing or expired tokens.
-   Insufficient permissions.
-   Missing brands or reviews.
-   Network and CORS errors.
-   Backend timeouts or unavailable service.
-   Render cold starts.
-   Unsupported files and file-size errors.
-   AI unavailable or partial-analysis responses.
-   Empty lists and loading states.

Show a clear message that helps the user understand what happened and
what they can do next. Do not silently show mock findings after a failed
request.

A successful `/api/health` response only confirms that the health route
is reachable; it does not guarantee all dependencies are working.

## 16. Security notes

-   Keep backend secrets in the backend environment, never in the
    frontend bundle.
-   Never commit `.env` files.
-   Use HTTPS for deployed requests.
-   Validate inputs on the backend.
-   Enforce roles and organisation access on the server.
-   Do not trust a brand ID supplied by the frontend without checking
    the user's access.
-   Limit file types and sizes according to backend validation.
-   Avoid logging passwords, JWTs, API keys, or confidential content.
-   Review the data-processing terms of external AI services before
    sending confidential brand materials.
-   Do not claim a review or content is approved unless the backend
    confirms it.

## 17. Testing checklist

Before calling the integration complete, test the following with the
real backend:

### Connection and authentication

-   [ ] Frontend uses one configured API base URL.
-   [ ] `/api/health` is reachable.
-   [ ] Registration and login match the real API schema.
-   [ ] Authenticated requests send the required token.
-   [ ] Expired tokens and permission failures are handled.

### Brand data

-   [ ] A real accessible brand can be listed and opened.
-   [ ] Brand details load from the API.
-   [ ] Guidelines load and mutations use the correct schema.
-   [ ] Approved facts load from the API.
-   [ ] Terminology rules are brand-specific.

### Reviews and workflow

-   [ ] A content review can be submitted using a real brand ID.
-   [ ] Actual backend findings are displayed.
-   [ ] Partial or unavailable AI analysis is clearly labelled.
-   [ ] Revisions and comments work with real response data.
-   [ ] Submit, approve, request changes, and reject actions respect
    permissions.
-   [ ] Audit trail and notifications load where supported.

### Upload and deployment

-   [ ] PDF upload uses `FormData`.
-   [ ] Upload errors and partial analysis are displayed correctly.
-   [ ] CORS works for local and deployed frontend URLs.
-   [ ] No API keys or backend secrets are present in frontend code.
-   [ ] The frontend does not replace failed API calls with mock data.

The integration is complete only when the frontend can authenticate,
retrieve a real brand, submit a content review, display the actual
findings, and correctly represent review or upload failures.

## 18. Deployment

### Backend --- Render

The backend integration guide lists this production base URL:

``` text
https://branddna-zojh.onrender.com
```

API base URL:

``` text
https://branddna-zojh.onrender.com/api
```

Configure the backend environment variables in Render using the actual
required values. Confirm MongoDB connectivity, CORS configuration, port
binding, and Gemini configuration from the running backend.

### Frontend --- Vercel

Set the frontend environment variable:

``` env
VITE_API_BASE_URL=https://branddna-zojh.onrender.com
```

Redeploy the frontend after changing environment variables. Configure
the backend CORS allowlist to include the actual Vercel domain.

Do not expose `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, or
`ADMIN_INVITE_SECRET` to the frontend.

## 19. Known limitations and verification notes

This README is based on the supplied backend integration guide. Some
details still need to be checked against the current backend and
frontend source code:

-   Exact request and response JSON schemas.
-   Actual Mongoose field names and validation.
-   Current role assignment and authorisation rules.
-   Exact review state transitions.
-   File types, upload limits, and error responses.
-   Current Gemini model and document-analysis support.
-   CORS settings and deployment configuration.
-   Exact frontend styling framework and repository structure.
-   Which features are implemented and tested versus planned.

Do not invent field names or assume that an endpoint's existence proves
the complete workflow is working. Inspect the route handlers,
controllers, models, and frontend code, then update this README to match
the implementation.

## 20. Team responsibilities

  -----------------------------------------------------------------------
  Team member                         Proposed responsibilities
  ----------------------------------- -----------------------------------
  Himanshu Kumar --- Team Leader      Product planning, backend/API
                                      coordination, database and AI
                                      integration planning, testing, and
                                      overall technical coordination

  Abhishek Kumar Prajapati --- Team   Frontend UI, dashboard and review
  Member                              screens, guideline-management
                                      interface, workflow interface,
                                      testing, and documentation
  -----------------------------------------------------------------------

These are proposed responsibilities. Update them if the actual work
split differs.

## 21. Future scope

Possible future improvements include:

-   Review of more document formats and richer visual content.
-   More advanced logo, colour, and accessibility checks.
-   Rechecking content when approved facts or guidelines change.
-   Stronger analytics for recurring errors and unclear rules.
-   Publishing and content-management integrations.
-   Notifications and collaboration integrations.
-   Multi-language support.
-   More advanced organisation-level access and governance controls.

Prioritise future features based on user feedback, available time, and
the reliability of the core review workflow.

------------------------------------------------------------------------

## Project summary

BrandDNA aims to help organisations maintain a consistent brand identity
by checking content against approved brand information, explaining
possible issues, suggesting corrections, and supporting human approval.

The key integration goal is to connect the frontend to the real backend
API, show authentic data and analysis status, and make the review
workflow reliable without hiding errors or inventing results.
