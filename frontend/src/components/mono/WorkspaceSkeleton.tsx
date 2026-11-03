import { motion } from 'motion/react';
import {
  ChevronsLeft,
  LayoutGrid,
  Inbox,
  Library,
  BookOpen,
  FileCheck2,
  FileSpreadsheet,
  Settings,
  LogOut,
  ArrowUpRight,
  Bell,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { Logo } from '@/components/mono/Logo';

interface WorkspaceSkeletonProps {
  userName?: string;
  userEmail?: string;
  roleLabel?: string;
  initials?: string;
  message?: string;
}

export function WorkspaceSkeleton({
  userName = 'Priya Kapoor',
  userEmail = 'brandmanager@branddna.com',
  roleLabel = 'Brand Manager',
  initials = 'PK',
  message = 'Loading workspace & syncing brand rules...'
}: WorkspaceSkeletonProps) {
  const firstName = userName.split(' ')[0] || 'there';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="mono mono-wash fixed inset-0 z-50 flex overflow-hidden bg-wash"
      role="status"
      aria-label="Loading workspace"
    >
      {/* ── Left Sidebar Skeleton (Exact match to BrandDNA AppFrame) ── */}
      <aside className="hidden md:flex w-72 shrink-0 flex-col justify-between border-r border-silver/60 bg-paper p-5 select-none">
        <div className="flex flex-col gap-6">
          {/* Logo & Collapse button */}
          <div className="flex items-center justify-between">
            <Logo variant="horizontal" size="md" />
            <span className="flex size-7 items-center justify-center rounded-lg text-mid">
              <ChevronsLeft className="size-4" />
            </span>
          </div>

          {/* Search Bar Skeleton */}
          <div className="flex h-10 w-full items-center justify-between rounded-xl border border-silver/80 bg-silver/10 px-3.5">
            <div className="flex items-center gap-2">
              <div className="size-3.5 rounded-full bg-silver/60 animate-pulse" />
              <div className="h-3 w-16 rounded bg-silver/60 animate-pulse" />
            </div>
            <span className="rounded border border-silver/80 bg-paper px-1.5 py-0.5 text-[10px] font-bold text-mid">
              ⌘K
            </span>
          </div>

          {/* Role Pill */}
          <div className="self-start rounded-full bg-silver/30 border border-silver/70 px-3 py-1">
            <span className="text-[11px] font-semibold text-graphite">
              {roleLabel}
            </span>
          </div>

          {/* Navigation Menu */}
          <div className="flex flex-col gap-1.5">
            <span className="px-2 text-[11px] font-bold tracking-wider text-mid uppercase">
              Menu
            </span>

            {/* Active item: Brand Dashboard */}
            <div className="flex items-center gap-3 rounded-xl bg-silver/40 px-3 py-2.5 font-medium text-ink shadow-2xs">
              <LayoutGrid className="size-4 text-ink" />
              <span className="text-ui font-semibold">Brand Dashboard</span>
            </div>

            {/* Inactive item: Approval Queue */}
            <div className="flex items-center justify-between rounded-xl px-3 py-2 text-graphite">
              <div className="flex items-center gap-3">
                <Inbox className="size-4 text-mid" />
                <span className="text-ui">Approval Queue</span>
              </div>
              <span className="size-2 rounded-full bg-brand-orange" />
            </div>

            {/* Inactive item: Brand Asset Library */}
            <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-graphite">
              <Library className="size-4 text-mid" />
              <span className="text-ui">Brand Asset Library</span>
            </div>

            {/* Inactive item: Guideline Ingestion */}
            <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-graphite">
              <BookOpen className="size-4 text-mid" />
              <span className="text-ui">Guideline Ingestion</span>
            </div>

            {/* Inactive item: All Submissions */}
            <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-graphite">
              <FileCheck2 className="size-4 text-mid" />
              <span className="text-ui">All Submissions</span>
            </div>

            {/* Inactive item: Audit Log Ledger */}
            <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-graphite">
              <FileSpreadsheet className="size-4 text-mid" />
              <span className="text-ui">Audit Log Ledger</span>
            </div>
          </div>
        </div>

        {/* Bottom Profile & Actions Skeleton */}
        <div className="flex flex-col gap-3 border-t border-silver/40 pt-4">
          <div className="flex items-center gap-3 rounded-2xl border border-silver/80 bg-paper p-3 shadow-xs">
            <span
              style={{ color: '#ffffff' }}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-caption font-bold !text-white text-white"
            >
              {initials}
            </span>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="truncate text-ui font-semibold text-ink">
                {userName}
              </span>
              <span className="truncate text-caption text-graphite">
                {userEmail}
              </span>
            </div>
            <ChevronDown className="size-4 text-mid" />
          </div>

          <div className="flex items-center gap-3 px-3 py-1.5 text-graphite">
            <Settings className="size-4 text-mid" />
            <span className="text-caption font-medium">Settings</span>
          </div>

          <div className="flex items-center gap-3 px-3 py-1.5 text-graphite">
            <LogOut className="size-4 text-mid" />
            <span className="text-caption font-medium">Log out</span>
          </div>
        </div>
      </aside>

      {/* ── Main Dashboard Workspace Area (Exact 2-Column Match) ── */}
      <main className="flex-1 overflow-y-auto p-6 sm:p-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          {/* Header Row: "Hello, Priya!" + Team Presence + Bell */}
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-display font-semibold tracking-tight text-ink">
                Hello, {firstName}!
              </h1>
            </div>

            <div className="ml-auto flex items-center gap-3 shrink-0">
              {/* Online Team Presence Pill Skeleton */}
              <div className="flex items-center gap-2 rounded-full border border-silver/80 bg-paper px-3 py-1.5 shadow-2xs">
                <div className="flex -space-x-1.5">
                  <span
                    style={{ color: '#ffffff' }}
                    className="flex size-6 items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold !text-white text-white"
                  >
                    PK
                  </span>
                  <span
                    style={{ color: '#ffffff' }}
                    className="flex size-6 items-center justify-center rounded-full bg-ink text-[10px] font-bold !text-white text-white"
                  >
                    AR
                  </span>
                  <span
                    style={{ color: '#ffffff' }}
                    className="flex size-6 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold !text-white text-white"
                  >
                    JB
                  </span>
                </div>
                <span className="text-caption font-semibold text-graphite">3 Online</span>
              </div>

              {/* Notification Bell with Orange Dot */}
              <div className="relative flex size-10 items-center justify-center rounded-full border border-silver/80 bg-paper text-ink shadow-2xs">
                <Bell className="size-4 text-graphite" />
                <span className="absolute top-2 right-2 size-2 rounded-full bg-brand-orange" />
              </div>
            </div>
          </header>

          {/* Canonical Two-Column Grid (xl:grid-cols-[minmax(0,1fr)_320px]) */}
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            {/* ── Left Column: Performance Bento & Audit Volume ── */}
            <div className="flex min-w-0 flex-col gap-8">
              {/* Section Header: Performance + Period Segmented Control */}
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold tracking-tight text-ink">
                  Performance
                </h2>

                <div className="flex rounded-xl bg-silver/40 p-1">
                  <span className="px-3 py-1 text-caption font-medium text-graphite">Day</span>
                  <span className="rounded-lg bg-ink px-3 py-1 text-caption font-semibold text-paper shadow-xs">Week</span>
                  <span className="px-3 py-1 text-caption font-medium text-graphite">Month</span>
                  <span className="px-3 py-1 text-caption font-medium text-graphite">Year</span>
                </div>
              </div>

              {/* 4 Bento Cards (2x2 Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bento Card 1: Orange Hero (Brand health score 94%) */}
                <div className="flex min-h-40 flex-col justify-between rounded-panel bg-brand-orange p-6 text-ink shadow-soft">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-ui font-bold text-ink">Brand health score</p>
                    <span className="flex size-11 items-center justify-center rounded-full bg-ink text-brand-orange shadow-sm">
                      <ArrowUpRight className="size-6 shrink-0" />
                    </span>
                  </div>
                  <div className="my-1">
                    <span className="font-display text-display font-semibold tracking-tight text-ink">
                      94%
                    </span>
                  </div>
                  <p className="text-caption font-medium text-ink/90">
                    +4 pts · vs 90% (last 7 days)
                  </p>
                </div>

                {/* Bento Card 2: Black Hero (Active brand rules 142) */}
                <div className="flex min-h-40 flex-col justify-between rounded-panel bg-ink p-6 text-paper shadow-soft">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-ui font-bold text-paper">Active brand rules</p>
                    <span className="flex size-11 items-center justify-center rounded-full bg-brand-orange text-ink shadow-sm">
                      <ArrowUpRight className="size-6 shrink-0" />
                    </span>
                  </div>
                  <div className="my-1">
                    <span className="font-display text-display font-semibold tracking-tight text-brand-orange">
                      142
                    </span>
                  </div>
                  <p className="text-caption text-silver">
                    +12 · vs 130 (last 7 days)
                  </p>
                </div>

                {/* Bento Card 3: White Card (Verified brand assets 384) */}
                <div className="flex min-h-40 flex-col justify-between rounded-panel border border-silver bg-paper p-6 shadow-soft">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-ui font-bold text-graphite">Verified brand assets</p>
                    <span className="flex size-11 items-center justify-center rounded-full bg-brand-orange text-paper shadow-sm">
                      <ArrowUpRight className="size-6 shrink-0" />
                    </span>
                  </div>
                  <div className="my-1 flex items-center justify-between">
                    <span className="font-display text-display font-semibold tracking-tight text-ink">
                      384
                    </span>
                    <span className="rounded-full bg-silver/40 px-2.5 py-0.5 text-caption font-bold text-ink">
                      +24
                    </span>
                  </div>
                  <p className="text-caption text-graphite">
                    vs 360 (last 7 days)
                  </p>
                </div>

                {/* Bento Card 4: White Card (Turnaround velocity 18) */}
                <div className="flex min-h-40 flex-col justify-between rounded-panel border border-silver bg-paper p-6 shadow-soft">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-ui font-bold text-graphite">Turnaround velocity</p>
                    <span className="flex size-11 items-center justify-center rounded-full bg-brand-orange text-paper shadow-sm">
                      <ArrowUpRight className="size-6 shrink-0" />
                    </span>
                  </div>
                  <div className="my-1 flex items-center justify-between">
                    <span className="font-display text-display font-semibold tracking-tight text-ink">
                      18
                    </span>
                    <span className="rounded-full bg-silver/40 px-2.5 py-0.5 text-caption font-bold text-ink">
                      -4
                    </span>
                  </div>
                  <p className="text-caption text-graphite">
                    vs 22 (last 7 days)
                  </p>
                </div>
              </div>

              {/* Audit Volume Skeleton Card */}
              <div className="flex flex-col gap-6 rounded-2xl border border-silver/80 bg-paper p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-silver/40 pb-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-ink">Audit volume</h3>
                    <p className="text-caption text-graphite">Continuous compliance audit telemetry</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-full border border-silver/80 bg-paper px-3 py-1 text-caption font-semibold text-ink shadow-2xs">
                      <span>Last Year</span>
                      <ChevronDown className="size-3 text-mid" />
                    </div>
                  </div>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-caption font-semibold uppercase text-graphite">Total audits</span>
                  <span className="font-display text-2xl font-bold text-ink">12,349</span>
                </div>

                {/* Bar Chart Visualization Shimmer */}
                <div className="flex h-36 items-end gap-2 sm:gap-3 pt-4">
                  {[45, 65, 30, 80, 55, 95, 70, 85, 60, 90, 75, 100].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        style={{ height: `${h}%` }}
                        className="w-full rounded-t-md bg-silver/50 animate-pulse transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right Column: Advisor, Review Queue, Recent Activity ── */}
            <div className="flex min-w-0 flex-col gap-6">
              {/* Brand Advisor Card */}
              <div className="flex flex-col gap-4 rounded-2xl border border-silver/80 bg-paper p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-bold text-ink">Brand Advisor</h3>
                  <span className="text-caption font-semibold text-graphite">See All →</span>
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-silver/80 bg-silver/10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-paper border border-silver/80 shadow-2xs">
                      <Bell className="size-4 text-brand-orange" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-ui font-bold text-ink">NovaFit guideline staging</span>
                      <p className="text-caption text-graphite mt-1 leading-snug">
                        6 staged rules verified at 98% confidence. Ready to activate.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="mt-1 self-start rounded-full border border-silver/90 bg-paper px-3 py-1 text-caption font-semibold text-ink shadow-2xs"
                  >
                    Review rules
                  </button>
                </div>
              </div>

              {/* Review Queue Card */}
              <div className="flex flex-col gap-4 rounded-2xl border border-silver/80 bg-paper p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-bold text-ink">Review queue</h3>
                  <span className="text-caption font-semibold text-graphite">See All →</span>
                </div>

                <div className="flex flex-col divide-y divide-silver/40">
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-ui text-graphite">Rule approvals pending</span>
                    <span className="font-display text-lg font-bold text-ink">6</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-ui text-graphite">Policy change requests</span>
                    <span className="font-display text-lg font-bold text-ink">4</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-ui text-graphite">Certified assets sealed</span>
                    <span className="font-display text-lg font-bold text-ink">18</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity Card */}
              <div className="flex flex-col gap-4 rounded-2xl border border-silver/80 bg-paper p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-bold text-ink">Recent activity</h3>
                  <span className="text-caption font-semibold text-graphite">See All →</span>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    style={{ color: '#ffffff' }}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-caption font-bold !text-white text-white"
                  >
                    SC
                  </span>
                  <div className="flex flex-col min-w-0">
                    <p className="text-caption text-graphite leading-snug">
                      <strong className="text-ink">Sarah Chen</strong> approved Membership Landing Hero
                    </p>
                    <span className="text-[11px] text-mid mt-0.5">14m ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Ask Brad Pill (Bottom Right - Exactly as in user screenshot) */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-silver/90 bg-paper px-4 py-2 text-ink shadow-float">
        <span className="text-ui font-bold">Ask Brad</span>
        <span className="flex size-5 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-paper">
          ☻
        </span>
        <span className="size-2 rounded-full bg-brand-orange" />
      </div>

      {/* Subtle Floating Bottom Synchronizing Pill */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full border border-silver/90 bg-ink px-4 py-2 text-paper shadow-float">
        <Sparkles className="size-4 text-brand-orange animate-spin" />
        <span className="text-caption font-semibold text-paper">
          {message}
        </span>
      </div>
    </motion.div>
  );
}
