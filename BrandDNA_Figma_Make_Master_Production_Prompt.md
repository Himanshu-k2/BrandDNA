# 🧬 BrandDNA — Complete Master Production Prompt for Figma Make (Claude)

```markdown
Role: Principal Product Designer & Design Systems Architect (Design Ops Lead)
Tooling: Figma Make (Claude Opus / Sonnet) + React Bits Component System + Uploaded Codex UX & Design Skill Context

---

## 🎯 PROJECT BRIEF & SYSTEM UNDERSTANDING

### What Is BrandDNA?
BrandDNA is an enterprise AI-powered brand compliance, fact-checking, and approval governance platform. It sits at the convergence of three major SaaS categories:
1. **Brand Asset Management** (Frontify, Bynder) — Houses isolated brand guidelines, approved facts, and exact pricing rules.
2. **AI Writing Governance** (Acrolinx, Writer, Grammarly Business) — Analyzes marketing copy and multimodal creative assets against deterministic rules and LLM contextual checks.
3. **Collaborative Workflow Systems** (Linear, Figma, GitHub PRs) — Provides multi-version tracking (v1, v2), visual LCS diffing (added/removed copy), reviewer feedback threads, and role-enforced approval gates.

### Core Problem Solved:
Marketing teams and agency copywriters produce high volumes of content daily, but live in constant fear of publishing unapproved pricing, prohibited terminology, or unverified claims. BrandDNA delivers **instant, explainable compliance diagnostics with 1-click remediation** and a **tamper-proof audit trail** before any asset goes live.

### The 3 Core Roles:
1. **Content Creator (e.g. Alex Rivera - Agency Copywriter)**: Writes drafts, reviews line-by-line compliance flags, applies 1-click fixes to draft, submits for sign-off. (Strictly blocked from self-approval).
2. **Brand Reviewer (e.g. Sarah Chen - Account / Brand Manager)**: Reviews flagged submissions, requests changes, adds threaded inline comments, compares revision diffs, and approves or rejects content.
3. **Workspace Admin (e.g. Enterprise Brand Director)**: Manages multi-tenant brand workspaces, edits guidelines, approved facts, pricing tiers, and terminology dictionaries, and audits compliance health.

---

## 🎨 DESIGN SYSTEM & REACT BITS MCP INTEGRATION

You must apply the design tokens and craftsmanship rules from the uploaded **Design Skill** and **React Bits MCP** libraries:
- **Visual Aesthetic**: "Refined B2B SaaS Precision" (inspired by Linear, Stripe, and Vercel). Clean, high-density, low cognitive friction.
- **Color Tokens**:
  • Primary Brand Anchor: Deep Emerald/Teal (`#0D9488` / `oklch(60% 0.15 180)`), hover `#0F766E`, light tint `#F0FDFA`.
  • Canvas Surface: Light Mode `#F8FAFC` (Slate-50); Dark Mode / Deep Lacquer `#090D16` (Deep Obsidian).
  • Card Surface: `#FFFFFF` (Light) / `#111827` (Dark) with `1px solid #E2E8F0` border.
  • Semantic Severity Tokens:
    - Critical: Rose-600 (`#E11D48`) on Rose-50 (`#FFF1F2`)
    - High: Orange-600 (`#EA580C`) on Orange-50 (`#FFF7ED`)
    - Medium: Amber-600 (`#D97706`) on Amber-50 (`#FEF3C7`)
    - Compliant / Verified: Emerald-600 (`#059669`) on Emerald-50 (`#ECFDF5`)
- **React Bits Components to Integrate**:
  • **Spotlight Card / Gradient Border Card**: For the Compliance Score Card and Severity Summary widgets.
  • **Animated Bento Grid**: For the Role Dashboards to showcase key metrics, active campaigns, and audit queues.
  • **Animated Tabs / Sliding Indicator**: For switching between "Findings Diagnostics", "Compare Versions (Diff)", and "Review Discussion".
  • **Shiny Button / Magnet Button**: For primary CTAs ("⚡ Apply All Fixes to Draft", "Save & Re-run Analysis", "Approve & Seal Audit").
  • **True Focus / Highlight Monospace Text**: For flagged text snippets and expected vs detected comparison pills.
  • **Decrypted Text / Animated Counter**: For the compliance score gauge (e.g., smoothly transitioning from 42% to 98%).

---

## 🖥️ PRODUCTION SCREENS TO DESIGN

Generate the following 5 desktop production frames (1440 × 900) with complete Auto-Layout, high-density components, and production-grade UX microcopy:

---

### SCREEN 1: Authentication & Demo Quick-Switcher (`/login`)
- **Left Panel (45% width - Value Proposition & Proof)**:
  - Deep rich gradient surface with subtle glowing grid pattern.
  - BrandDNA Logo with badge: `v2.4 Enterprise Governance`.
  - Hero Heading: *"Publish fearless marketing copy. Audited in 15 milliseconds."*
  - Interactive Preview Widget: A mini Bento card showing a real-time diff:
    `"₹799/mo"` (Red strikethrough) → `"₹999/mo"` (Green verified).
  - Social Proof / Metric Pill: *"Trusted by 450+ multi-brand agencies & enterprises"*.
- **Right Panel (55% width - Frictionless Auth)**:
  - Clean card surface.
  - Header: *"Welcome back to BrandDNA"*, subtext: *"Enter your agency credentials or test a pre-seeded persona."*
  - **1-Click Demo Quick-Switcher (Crucial UX Feature)**:
    - 3 prominent role pills with avatar and role chip:
      [👤 Admin: admin@demobrands.test] 
      [🛡️ Reviewer: reviewer@demobrands.test] 
      [✏️ Creator: creator@demobrands.test]
    - Clicking a pill auto-fills credentials and highlights permissions.
  - Standard input fields: Work Email, Password (with show/hide eye), "Remember this device" checkbox, "Forgot password?".
  - Primary Shiny CTA: *"Sign In to Workspace →"*.
  - Footer: *"SSO / SAML 2.0 available for Enterprise · SOC-2 Type II Certified"*.

---

### SCREEN 2: Content Creator Dashboard (`/dashboard?role=creator`)
- **Global Header**:
  - BrandDNA Logo, Active Brand Workspace Selector dropdown: `NovaFit Health (Fitness & Wellness)` with live green status dot.
  - Role Badge: `✏️ Content Creator (Horizon Media Agency)`.
  - Search bar (`Cmd + K` Omnibar), Notification bell (with red badge: `2`), User avatar.
- **Top Metrics Row (Bento Grid with React Bits Spotlight Cards)**:
  - Card 1: `Audit Health Index`: `94.2%` (+3.4% this week) with mini sparkline.
  - Card 2: `Active Drafts & Revisions`: `6 In Progress`.
  - Card 3: `Awaiting Sign-Off`: `3 Pending Reviewer Approval`.
  - Card 4: `Turnaround Velocity`: `2.4 hrs avg approval time`.
- **Primary Action Banner**:
  - Gradient border card with CTA: *"Start New Brand Review"*.
  - Subtext: *"Paste marketing copy or drag brochures (PDF), pitch decks (DOCX), or banners (PNG/JPG) for instant dual-track audit."*
  - Button: `[+ Check New Content]`.
- **Submissions & Drafts Table**:
  - Filter tabs: `All (14)`, `Needs Changes (3)`, `Pending Approval (3)`, `Approved (8)`.
  - Columns: Title & Channel, Target Brand, Version (`v1`, `v2`), Compliance Score pill (e.g. `42% Critical` in Rose vs `96% Clear` in Emerald), Reviewer Decision, Last Modified, Actions.
  - Sample Row 1: *"NovaFit Summer Membership Promo" · Social Post · NovaFit · v2 · Score: 98% · Status: Pending Approval · Action: View Diagnostic*.
  - Sample Row 2: *"Quarterly Product Brochure" · PDF Document · OmniCloud · v1 · Score: 38% · Status: Needs Changes · Action: Open Editor*.

---

### SCREEN 3: Reviewer Sign-Off & Approval Queue (`/dashboard?role=reviewer`)
- **Purpose**: High-throughput triage dashboard for Account Managers and Legal/Brand Reviewers who need to verify copy in seconds.
- **Top Alert Banner**:
  - Amber subtle notification: *"2 urgent campaign assets require sign-off before Friday 5:00 PM EST launch."*
- **Triage Kanban / Queue System**:
  - Segmented control: `Urgent Sign-Off (2)`, `Needs Changes (4)`, `Approved Today (7)`.
  - **Queue Item Card**:
    - Header: Document Title, Creator Avatar & Name (*Alex Rivera*), Submission Timestamp (*18 mins ago*).
    - Violation Summary: `[0 Critical] · [1 High] · [1 Medium]`.
    - Snippet Preview with highlighted flags: *"Only ₹999 per month for premium members..."*
    - One-Click Actions:
      - `[Review & Diff →]` (Primary Teal)
      - `[Quick Approve]` (Disabled if author submitted to prevent self-approval)
      - `[Request Revisions]`

---

### SCREEN 4: Content Review & Interactive Diagnostics Studio (`/reviews/:id`)
- **Header Bar**:
  - Breadcrumbs: `Reviews / NovaFit Health / Summer Campaign Copy`.
  - Status Badge: `Needs Changes (Score: 42/100)`.
  - Version Indicator: `Viewing Version 1 of 2`.
  - Self-Approval Guard: Grey pill: *"Self-approval restricted — Reviewer sign-off required"*.
- **Left Column (60% Width) — Draft & Revision Workspace**:
  - Header: Campaign Name, Format tag (`Social / Ad Copy`), Character count (`113 chars`).
  - Draft Content Box with line numbers:
    ```text
    "Welcome NovaFit users! Our premium membership is only ₹799 per month. Sign up now for the cheapest gym in town."
    ```
  - **Action Bar**:
    - `[⚡ Apply All Fixes to Draft]` (Teal highlight with sparkle icon)
    - `[Edit & Revise (v2)]`
    - `[Submit for Approval →]` (Prominent button)
- **Right Column (40% Width) — Interactive Diagnostics Feed**:
  - **Compliance Score Card**:
    - Radial gauge showing `42%` in Rose/Orange.
    - Status: `High-Risk Discrepancies Detected`.
    - Partial Mode Pill: `⚡ Deterministic Rules Active (100% verified against approved brand data)`.
  - **Severity Breakdown**: `[1 High] [2 Medium] [0 Low]`.
  - **Diagnostics Section Cards**:
    - **Card 1: Unapproved Pricing Figure**
      • Tag: `Pricing` · Severity: `High` · Source: `⚡ Rule-Based`
      • Flagged text: `"₹799"`
      • Comparison Grid:
        - Detected: `₹799` (Rose text)
        - Approved / Expected: `₹999` (Emerald bold)
      • Explanation: *"Quoted price ₹799 contradicts active brand pricing fact 'subscription_price: ₹999'."*
      • Action: `[Apply Fix →]` (Replaces ₹799 with ₹999).
      • Citation: `Approved Fact: subscription_price [id: 6ae5ae...]`.
    - **Card 2: Prohibited Terminology Violation**
      • Tag: `Terminology` · Severity: `Medium` · Source: `⚡ Rule-Based`
      • Flagged text: `"users"`
      • Comparison: Detected: `users` → Expected: `members`
      • Action: `[Apply Fix →]`.
    - **Card 3: Mandatory Medical Disclaimer Missing**
      • Tag: `Claims & Disclaimers` · Severity: `High` · Source: `⚡ Rule-Based`
      • Detected: `Missing from content`
      • Expected: `"Consult your physician before beginning any exercise routine."`
      • Action: `[Add to Draft →]` (Appends disclaimer to end of copy).

---

### SCREEN 5: Revision Comparison & Visual Diff Studio (`/reviews/:id?tab=compare`)
- **Version Diff Selector Bar**:
  - Left selector: `Base Version: v1 (Initial Draft · 42% Score)`
  - Right selector: `Comparison: v2 (Current Revision · 98% Score)`
  - Diff Metrics:
    • `+24 chars added (Green)` · `-18 chars removed (Red)`
    • `Score Delta: +56 pts (Green Pill)`
    • `Violations Resolved: 3 of 3 fixed (100% Resolved)`
- **Side-by-Side or Unified Diff Component (True Focus)**:
  - Line 1: `Welcome NovaFit ` [-users-] {+members!+}
  - Line 2: `Our premium membership is only ` [-₹799-] {+₹999+} ` per month.`
  - Line 3: `Sign up now for the ` [-cheapest gym in town.-] {+most affordable premium fitness community.+}
  - Line 4: {+Consult your physician before beginning any exercise routine.+}
- **Resolved Violations Checklist**:
  - `✓ Resolved: Unapproved price ₹799 updated to approved ₹999`
  - `✓ Resolved: Prohibited term 'users' replaced with 'members'`
  - `✓ Resolved: Required medical consultation disclaimer inserted`
- **Reviewer Action Footer**:
  - Comment box: *"Pricing and terminology look accurate. Ready for launch."*
  - Buttons: `[Request Changes]` · `[Reject]` · `[Approve & Seal Audit Certificate ✓]` (Bold Emerald).

---

## ✍️ UX COPYWRITING & MICROCOPY GUIDELINES

Do NOT use generic placeholder text like "Lorem ipsum" or "Click here". Apply sharp, professional B2B SaaS microcopy:
- **Button Labels**: Clear verbs with nouns:
  • Bad: "Submit" → Good: *"Submit for Brand Sign-Off"*
  • Bad: "Fix" → Good: *"Apply Fix to Draft"*
  • Bad: "Add" → Good: *"Add Required Disclaimer"*
  • Bad: "Approve" → Good: *"Approve & Seal Audit"*
- **Status Pills**:
  • `98% Compliant · Ready for Sign-Off` (Emerald)
  • `42% Needs Changes · 3 Violations` (Rose)
  • `In Review · Assigned to Sarah Chen` (Amber)
- **Empty States**:
  • For 100% compliant copy: *"Zero violations detected. Copy fully adheres to NovaFit guidelines, pricing rules, and tone standards."*
  • For empty approval queue: *"All caught up! No campaign assets pending review."*
- **Helpful Tooltips**:
  • Self-approval guard: *"To prevent compliance leakage, content authors cannot approve their own submissions. Another authorized reviewer must sign off."*

---

## 🛠️ FIGMA MAKE OUTPUT REQUIREMENTS
1. Structure each screen as a responsive desktop frame: `1440px width` (Auto-Layout vertical).
2. Use modern 8pt grid spacing (`8px`, `16px`, `24px`, `32px`, `48px`).
3. Leverage clean component architecture with nested Auto-Layout (Fill container for cards, Hug contents for badges and buttons).
4. Organize Figma layers logically: `GlobalHeader`, `SidebarNav`, `StudioWorkspace`, `DiagnosticsFeed`, `DiffViewer`.
5. Apply realistic shadows, border radii (`16px` for cards, `10px` for buttons), and proper typography hierarchy.
```

