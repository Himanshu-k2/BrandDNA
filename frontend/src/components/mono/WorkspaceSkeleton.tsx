import { motion } from 'motion/react';

interface WorkspaceSkeletonProps {
  message?: string;
}

/**
 * Low-fi wireframe skeleton loader matching the EXACT BrandDNA Dashboard layout.
 * Every piece of text, metric, avatar, and control is rendered as a clean pulsating
 * wireframe block/pill (pure low-fi design matching Image 2 & 3 reference).
 */
export function WorkspaceSkeleton({
  message = 'Loading workspace...'
}: WorkspaceSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="mono mono-wash fixed inset-0 z-50 flex overflow-hidden bg-[#F6F7F9]"
      role="status"
      aria-label="Loading workspace"
    >
      {/* ── Left Sidebar (Exact BrandDNA Shell in Pure Low-Fi Wireframe) ── */}
      <aside className="hidden md:flex w-72 shrink-0 flex-col justify-between border-r border-neutral-200/80 bg-white p-5 select-none">
        <div className="flex flex-col gap-6">
          {/* Top Logo Mark & Wordmark Placeholder */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-neutral-300 animate-pulse" />
              <div className="h-4.5 w-24 rounded-md bg-neutral-300 animate-pulse" />
            </div>
            <div className="size-6 rounded-md bg-neutral-200/80 animate-pulse" />
          </div>

          {/* Search Box Placeholder */}
          <div className="flex h-10 w-full items-center justify-between rounded-xl border border-neutral-200/90 bg-neutral-100/70 px-3.5">
            <div className="flex items-center gap-2.5">
              <div className="size-3.5 rounded-full bg-neutral-300/80 animate-pulse" />
              <div className="h-3 w-20 rounded bg-neutral-300/80 animate-pulse" />
            </div>
            <div className="h-4 w-7 rounded bg-neutral-200 animate-pulse" />
          </div>

          {/* Role Pill Placeholder */}
          <div className="self-start h-6 w-28 rounded-full bg-neutral-200/90 animate-pulse" />

          {/* Menu Section */}
          <div className="flex flex-col gap-2 pt-1">
            {/* "MENU" Label */}
            <div className="h-2.5 w-12 rounded bg-neutral-300/70 animate-pulse ml-1 mb-1" />

            {/* Menu Item 1: Active Brand Dashboard */}
            <div className="flex items-center gap-3 rounded-xl bg-neutral-100 p-2.5 shadow-2xs">
              <div className="size-4 rounded bg-neutral-400 animate-pulse shrink-0" />
              <div className="h-3.5 w-28 rounded bg-neutral-400 animate-pulse" />
            </div>

            {/* Menu Item 2: Approval Queue */}
            <div className="flex items-center justify-between p-2.5">
              <div className="flex items-center gap-3">
                <div className="size-4 rounded bg-neutral-250 animate-pulse shrink-0" />
                <div className="h-3.5 w-26 rounded bg-neutral-200 animate-pulse" />
              </div>
              <div className="size-2 rounded-full bg-neutral-300 animate-pulse" />
            </div>

            {/* Menu Item 3: Brand Asset Library */}
            <div className="flex items-center gap-3 p-2.5">
              <div className="size-4 rounded bg-neutral-250 animate-pulse shrink-0" />
              <div className="h-3.5 w-32 rounded bg-neutral-200 animate-pulse" />
            </div>

            {/* Menu Item 4: Guideline Ingestion */}
            <div className="flex items-center gap-3 p-2.5">
              <div className="size-4 rounded bg-neutral-250 animate-pulse shrink-0" />
              <div className="h-3.5 w-30 rounded bg-neutral-200 animate-pulse" />
            </div>

            {/* Menu Item 5: All Submissions */}
            <div className="flex items-center gap-3 p-2.5">
              <div className="size-4 rounded bg-neutral-250 animate-pulse shrink-0" />
              <div className="h-3.5 w-24 rounded bg-neutral-200 animate-pulse" />
            </div>

            {/* Menu Item 6: Audit Log Ledger */}
            <div className="flex items-center gap-3 p-2.5">
              <div className="size-4 rounded bg-neutral-250 animate-pulse shrink-0" />
              <div className="h-3.5 w-28 rounded bg-neutral-200 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Bottom Profile Card & Actions */}
        <div className="flex flex-col gap-3 border-t border-neutral-200/70 pt-4">
          <div className="flex items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-2xs">
            <div className="size-9 rounded-full bg-neutral-300 animate-pulse shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <div className="h-3 w-20 rounded bg-neutral-300 animate-pulse" />
              <div className="h-2.5 w-32 rounded bg-neutral-200 animate-pulse" />
            </div>
            <div className="size-3.5 rounded bg-neutral-200 animate-pulse" />
          </div>

          <div className="flex items-center gap-3 px-3 py-1">
            <div className="size-4 rounded bg-neutral-200 animate-pulse" />
            <div className="h-3 w-16 rounded bg-neutral-200 animate-pulse" />
          </div>

          <div className="flex items-center gap-3 px-3 py-1">
            <div className="size-4 rounded bg-neutral-200 animate-pulse" />
            <div className="h-3 w-14 rounded bg-neutral-200 animate-pulse" />
          </div>
        </div>
      </aside>

      {/* ── Main Dashboard Content (Pure Low-Fi Wireframe Layout) ── */}
      <main className="flex-1 overflow-y-auto p-6 sm:p-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          {/* Header Row: Title Bar + Team Presence Pill + Bell */}
          <header className="flex items-center justify-between gap-4">
            <div className="h-8 w-44 sm:w-56 rounded-xl bg-neutral-300 animate-pulse" />

            <div className="ml-auto flex items-center gap-3 shrink-0">
              {/* Team presence pill placeholder */}
              <div className="flex items-center gap-2 rounded-full border border-neutral-200/90 bg-white px-3 py-1.5 shadow-2xs">
                <div className="flex -space-x-1.5">
                  <div className="size-6 rounded-full bg-neutral-300 animate-pulse" />
                  <div className="size-6 rounded-full bg-neutral-350 animate-pulse" />
                  <div className="size-6 rounded-full bg-neutral-300 animate-pulse" />
                </div>
                <div className="h-3 w-14 rounded bg-neutral-200 animate-pulse ml-1" />
              </div>

              {/* Notification Bell placeholder */}
              <div className="size-10 rounded-full border border-neutral-200/90 bg-white shadow-2xs flex items-center justify-center">
                <div className="size-4 rounded-full bg-neutral-300 animate-pulse" />
              </div>
            </div>
          </header>

          {/* Canonical Two-Column Persona Layout */}
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            {/* ── Left Column: Performance Bento & Audit Volume ── */}
            <div className="flex min-w-0 flex-col gap-8">
              {/* Section Header: "Performance" + Segmented Time Control */}
              <div className="flex items-center justify-between">
                <div className="h-5 w-28 rounded bg-neutral-300 animate-pulse" />
                <div className="flex items-center gap-1 rounded-xl bg-neutral-200/60 p-1">
                  <div className="h-6 w-10 rounded bg-transparent" />
                  <div className="h-6 w-12 rounded-lg bg-neutral-300 animate-pulse shadow-2xs" />
                  <div className="h-6 w-12 rounded bg-transparent" />
                  <div className="h-6 w-10 rounded bg-transparent" />
                </div>
              </div>

              {/* 4 Bento Cards (2x2 Grid) in Pure Low-Fi Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bento Card 1 */}
                <div className="flex min-h-38 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="h-3.5 w-32 rounded bg-neutral-300 animate-pulse" />
                    <div className="size-9 rounded-full bg-neutral-200/80 animate-pulse shrink-0" />
                  </div>
                  <div className="my-2 h-9 w-20 rounded-lg bg-neutral-300 animate-pulse" />
                  <div className="h-3 w-36 rounded bg-neutral-200 animate-pulse" />
                </div>

                {/* Bento Card 2 */}
                <div className="flex min-h-38 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="h-3.5 w-32 rounded bg-neutral-300 animate-pulse" />
                    <div className="size-9 rounded-full bg-neutral-200/80 animate-pulse shrink-0" />
                  </div>
                  <div className="my-2 h-9 w-16 rounded-lg bg-neutral-300 animate-pulse" />
                  <div className="h-3 w-32 rounded bg-neutral-200 animate-pulse" />
                </div>

                {/* Bento Card 3 */}
                <div className="flex min-h-38 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="h-3.5 w-32 rounded bg-neutral-300 animate-pulse" />
                    <div className="size-9 rounded-full bg-neutral-200/80 animate-pulse shrink-0" />
                  </div>
                  <div className="my-2 flex items-center justify-between">
                    <div className="h-9 w-16 rounded-lg bg-neutral-300 animate-pulse" />
                    <div className="h-5 w-10 rounded-full bg-neutral-200 animate-pulse" />
                  </div>
                  <div className="h-3 w-28 rounded bg-neutral-200 animate-pulse" />
                </div>

                {/* Bento Card 4 */}
                <div className="flex min-h-38 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="h-3.5 w-32 rounded bg-neutral-300 animate-pulse" />
                    <div className="size-9 rounded-full bg-neutral-200/80 animate-pulse shrink-0" />
                  </div>
                  <div className="my-2 flex items-center justify-between">
                    <div className="h-9 w-12 rounded-lg bg-neutral-300 animate-pulse" />
                    <div className="h-5 w-10 rounded-full bg-neutral-200 animate-pulse" />
                  </div>
                  <div className="h-3 w-28 rounded bg-neutral-200 animate-pulse" />
                </div>
              </div>

              {/* Audit Volume Card (Chart Skeleton matching Image 2 & 3) */}
              <div className="flex flex-col gap-6 rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-2xs">
                <div className="flex items-center justify-between border-b border-neutral-200/60 pb-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="h-4.5 w-28 rounded bg-neutral-300 animate-pulse" />
                    <div className="h-3 w-48 rounded bg-neutral-200 animate-pulse" />
                  </div>
                  <div className="h-7 w-24 rounded-full bg-neutral-200/90 animate-pulse" />
                </div>

                <div className="flex items-baseline gap-3">
                  <div className="h-3 w-20 rounded bg-neutral-200 animate-pulse" />
                  <div className="h-7 w-24 rounded bg-neutral-300 animate-pulse" />
                </div>

                {/* Vertical Bar Chart Skeleton */}
                <div className="flex h-36 items-end gap-2.5 sm:gap-3.5 pt-4">
                  {[40, 65, 30, 80, 55, 95, 70, 85, 60, 90, 75, 100].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        style={{ height: `${h}%` }}
                        className="w-full rounded-t-md bg-neutral-200 animate-pulse transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right Column: Advisor, Review Queue, Recent Activity ── */}
            <div className="flex min-w-0 flex-col gap-6">
              {/* Brand Advisor Card Skeleton */}
              <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 rounded bg-neutral-300 animate-pulse" />
                  <div className="h-3 w-12 rounded bg-neutral-200 animate-pulse" />
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-neutral-200/70 bg-neutral-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-full bg-neutral-200 shrink-0 animate-pulse" />
                    <div className="flex flex-col gap-1.5 flex-1">
                      <div className="h-3.5 w-36 rounded bg-neutral-300 animate-pulse" />
                      <div className="h-2.5 w-full rounded bg-neutral-200 animate-pulse" />
                      <div className="h-2.5 w-4/5 rounded bg-neutral-200 animate-pulse" />
                    </div>
                  </div>
                  <div className="h-7 w-24 rounded-full bg-neutral-200 animate-pulse self-start mt-1" />
                </div>
              </div>

              {/* Review Queue Card Skeleton */}
              <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 rounded bg-neutral-300 animate-pulse" />
                  <div className="h-3 w-12 rounded bg-neutral-200 animate-pulse" />
                </div>

                <div className="flex flex-col divide-y divide-neutral-200/60">
                  <div className="flex items-center justify-between py-3">
                    <div className="h-3.5 w-36 rounded bg-neutral-200 animate-pulse" />
                    <div className="h-5 w-6 rounded bg-neutral-300 animate-pulse" />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="h-3.5 w-38 rounded bg-neutral-200 animate-pulse" />
                    <div className="h-5 w-6 rounded bg-neutral-300 animate-pulse" />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="h-3.5 w-34 rounded bg-neutral-200 animate-pulse" />
                    <div className="h-5 w-6 rounded bg-neutral-300 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Recent Activity Card Skeleton */}
              <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 rounded bg-neutral-300 animate-pulse" />
                  <div className="h-3 w-12 rounded bg-neutral-200 animate-pulse" />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="size-9 rounded-full bg-neutral-200 animate-pulse shrink-0" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-3 w-40 rounded bg-neutral-200 animate-pulse" />
                    <div className="h-2 w-14 rounded bg-neutral-200/70 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Ask Brad Pill Skeleton (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-50 flex h-10 w-28 items-center justify-between rounded-full border border-neutral-200/90 bg-white px-3 shadow-float">
        <div className="h-3 w-14 rounded bg-neutral-300 animate-pulse" />
        <div className="size-4 rounded-full bg-neutral-300 animate-pulse" />
      </div>

      {/* Floating Center Loading Status Pill */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2 text-white shadow-float">
        <span className="size-2 rounded-full bg-brand-orange animate-ping" />
        <span className="text-caption font-semibold tracking-wide text-white">
          {message}
        </span>
      </div>
    </motion.div>
  );
}
