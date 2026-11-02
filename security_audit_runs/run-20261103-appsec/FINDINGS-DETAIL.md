# Technical Vulnerability & Remediation Details

### AUDIT-01: Insecure Suffix Wildcard Origin in CORS Configuration
- **Domain**: `WEB-PROTOCOL-AND-AUTH.md`
- **Location**: [`backend/src/app.js`](file:///d:/Antigravity%20projects/New%20folder%20(2)/BrandDNA-main/backend/src/app.js#L20-L38)
- **Root Cause**: The CORS origin check used `origin.endsWith('.vercel.app')` while enabling `credentials: true`. Any third party could deploy a malicious script on a free Vercel subdomain (e.g. `https://attacker-app.vercel.app`) and issue cross-origin credentialed requests to read tenant guidelines, user profiles, and review records.
- **Remediation**: Replaced suffix matching with a strict origin whitelist: exact match against `CLIENT_URL`, `ALLOWED_ORIGINS` (comma-delimited list of authorized hostnames), and verified development ports. Any unauthorized origin is rejected with a CORS policy error.

---

### AUDIT-02: AI Prompt Injection & Delimiter Breakout in Gemini Engine
- **Domain**: `AI-AND-LLM.md`
- **Location**: [`backend/src/services/aiReviewService.js`](file:///d:/Antigravity%20projects/New%20folder%20(2)/BrandDNA-main/backend/src/services/aiReviewService.js), [`backend/src/services/bradAiService.js`](file:///d:/Antigravity%20projects/New%20folder%20(2)/BrandDNA-main/backend/src/services/bradAiService.js)
- **Root Cause**: User-submitted copy was concatenated into prompts inside `<submitted_content>` without neutralizing closing tags `</submitted_content>`. Furthermore, in Brad AI chat, user messages were interpolated with plain quotes without XML delimiter fences or escaping, allowing prompt injection instructions to override evaluation guidelines.
- **Remediation**:
  1. Enforced strict delimiter neutralization: `</submitted_content>` and `</submitted_document>` tags in user inputs are neutralized before prompt assembly.
  2. Bounded input string lengths to prevent token-exhaustion attacks.
  3. Enclosed conversational user inputs inside delimited `<user_message>` tags accompanied by defensive system directives commanding Gemini to treat contents strictly as untrusted data.

---

### AUDIT-03: Client-Side Protocol Injection & Open Redirect via AI Navigation
- **Domain**: `CLIENT-SIDE.md`
- **Location**: [`backend/src/services/bradAiService.js`](file:///d:/Antigravity%20projects/New%20folder%20(2)/BrandDNA-main/backend/src/services/bradAiService.js), [`frontend/src/components/brad/BradChatPanel.tsx`](file:///d:/Antigravity%20projects/New%20folder%20(2)/BrandDNA-main/frontend/src/components/brad/BradChatPanel.tsx)
- **Root Cause**: The model's JSON output for `sources` and `actions` contained a `to` property passed directly into React Router `<Link to={...}>` and `navigate(...)`. If manipulated via hallucination or prompt injection, this could trigger `javascript:` scheme execution or navigate to phishing sites (`https://evil.com` or `//evil.com`).
- **Remediation**:
  1. Backend `sanitizeAppPath(url)` ensures all `to` URLs start with a single `/`, reject `//`, and prohibit URI schemes with colons (`:`).
  2. Frontend `isSafeAppPath(path)` in `BradChatPanel.tsx` validates paths before rendering `<Link>` or calling `navigate()`.

---

### AUDIT-04: Unbounded Base64 Upload & Signature Check Bypass
- **Domain**: `RESOURCE-EXHAUSTION-AND-AVAILABILITY.md`, `ATTACK-CLASSES.md`
- **Location**: [`backend/src/controllers/reviewController.js`](file:///d:/Antigravity%20projects/New%20folder%20(2)/BrandDNA-main/backend/src/controllers/reviewController.js), [`backend/src/controllers/workflowController.js`](file:///d:/Antigravity%20projects/New%20folder%20(2)/BrandDNA-main/backend/src/controllers/workflowController.js), [`backend/src/validators/reviewValidator.js`](file:///d:/Antigravity%20projects/New%20folder%20(2)/BrandDNA-main/backend/src/validators/reviewValidator.js)
- **Root Cause**: Endpoints accepting JSON submissions with embedded base64 files bypassed Multer upload middleware, permitting arbitrary file types and unbounded buffer allocations in memory.
- **Remediation**:
  1. Enforced Zod schema validation restricting base64 string size (max 15MB) and limiting total file count to 5.
  2. Decoded buffer size is checked against a hard 10MB limit.
  3. Invoked `validateFileSignature(buffer)` immediately upon base64 decoding to enforce authentic PDF, PNG, JPEG, and WebP binary magic bytes before passing to downstream processors.

---

### AUDIT-05: Sub-Resource Authorization Inconsistency & Deprecated Role
- **Domain**: `DATA-ISOLATION-AND-LIFECYCLE.md`, `WEB-PROTOCOL-AND-AUTH.md`
- **Location**: [`backend/src/routes/guidelineRoutes.js`](file:///d:/Antigravity%20projects/New%20folder%20(2)/BrandDNA-main/backend/src/routes/guidelineRoutes.js), [`backend/src/routes/factRoutes.js`](file:///d:/Antigravity%20projects/New%20folder%20(2)/BrandDNA-main/backend/src/routes/factRoutes.js), [`backend/src/routes/terminologyRoutes.js`](file:///d:/Antigravity%20projects/New%20folder%20(2)/BrandDNA-main/backend/src/routes/terminologyRoutes.js), [`backend/src/routes/visualAssetRoutes.js`](file:///d:/Antigravity%20projects/New%20folder%20(2)/BrandDNA-main/backend/src/routes/visualAssetRoutes.js), [`backend/src/routes/reviewRoutes.js`](file:///d:/Antigravity%20projects/New%20folder%20(2)/BrandDNA-main/backend/src/routes/reviewRoutes.js)
- **Root Cause**: While `brand_manager` was permitted to create rules under brands, sub-resource direct routes (`PATCH /:id`, `DELETE /:id`) only authorized `admin`. Additionally, deprecated `reviewer` role permissions lingered on approval endpoints.
- **Remediation**:
  1. Updated sub-resource routes to `authorize('admin', 'brand_manager')`.
  2. Removed deprecated `'reviewer'` role from approval endpoints, enforcing that only `admin` and `brand_manager` can sign off on submissions.
  3. Added `brand_manager` to registration schema and restricted new registrations from selecting the retired `reviewer` role.

---

### AUDIT-06: Chat Prompt Flooding & Model Resource Starvation
- **Domain**: `RESOURCE-EXHAUSTION-AND-AVAILABILITY.md`
- **Location**: [`backend/src/validators/chatValidators.js`](file:///d:/Antigravity%20projects/New%20folder%20(2)/BrandDNA-main/backend/src/validators/chatValidators.js), [`backend/src/routes/chatRoutes.js`](file:///d:/Antigravity%20projects/New%20folder%20(2)/BrandDNA-main/backend/src/routes/chatRoutes.js)
- **Root Cause**: `/api/chat/brad` lacked input schema validation, allowing attackers to flood the endpoint with multi-megabyte payloads and consume Gemini token limits.
- **Remediation**: Introduced `chatSchema` enforcing max 4,000 characters for `message`, sanitizing `context` keys, and capping `history` to 20 messages.

---

### AUDIT-07: Dependency Security (GHSA-g3hv-75wg-m249)
- **Domain**: `SUPPLY-CHAIN-AND-RELEASE.md`
- **Location**: [`backend/package.json`](file:///d:/Antigravity%20projects/New%20folder%20(2)/BrandDNA-main/backend/package.json)
- **Root Cause**: Transitive dependency `minimatch` in dev dependencies was susceptible to ReDoS / glob amplification.
- **Remediation**: Added npm `overrides` for `minimatch: "^11.0.4"`, achieving 0 vulnerabilities across `npm audit`.
