/** Reusable shimmer skeleton box element */
export function SkeletonBox({
  className = ''
}: {
  className?: string;
}) {
  return <div className={`skeleton-shimmer rounded-md ${className}`} />;
}

/** Reusable shimmer skeleton circle element */
export function SkeletonCircle({
  className = ''
}: {
  className?: string;
}) {
  return <div className={`skeleton-shimmer rounded-full shrink-0 ${className}`} />;
}

/** Reusable shimmer skeleton pill element */
export function SkeletonPill({
  className = ''
}: {
  className?: string;
}) {
  return <div className={`skeleton-shimmer rounded-full ${className}`} />;
}

/**
 * Pixel-perfect grayscale Shimmer Skeleton Loader matching the exact BrandDNA Dashboard layout:
 * - Palette: #F5F5F5 (main bg), #F1F1F1 (sidebar), #FFFFFF (content), #E8E8E8 (skeleton base), #F4F4F4 (highlight), #E5E5E5 (borders)
 * - 0% brand colors, 0% literal text, 100% pure wireframe shimmer
 * - Same layout, dimensions, spacing, alignment, and component positioning as the real dashboard
 */
export function WorkspaceSkeleton() {
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#F5F5F5] p-0 md:p-6"
      role="status"
      aria-label="Loading workspace"
    >
      {/* Shell Container: Identical to AppFrame (min-h-[calc(100dvh-48px)] rounded-[32px]) */}
      <div className="flex min-h-dvh md:min-h-[calc(100dvh-48px)] overflow-hidden bg-[#FFFFFF] shadow-float md:rounded-[32px] border border-[#E5E5E5]">
        
        {/* ── A. Left Sidebar (w-[280px], bg-[#F1F1F1], exact same padding and rows) ── */}
        <aside className="hidden md:flex w-[280px] shrink-0 flex-col justify-between border-r border-[#E5E5E5] bg-[#F1F1F1] px-3 py-4 select-none">
          <div className="flex flex-col gap-2">
            {/* 1. BrandDNA Logo placeholder + collapse icon */}
            <div className="mb-2 flex h-10 shrink-0 items-center justify-between pl-3">
              <div className="flex items-center gap-2.5">
                <SkeletonBox className="size-8 rounded-lg" />
                <SkeletonBox className="h-5 w-24 rounded-md" />
              </div>
              <SkeletonBox className="size-6 rounded-md mr-1" />
            </div>

            {/* 2. Search bar placeholder (h-11 rounded-[20px]) */}
            <div className="flex h-11 shrink-0 items-center justify-between rounded-[20px] border border-[#E5E5E5] bg-[#FFFFFF] px-3.5 shadow-xs">
              <div className="flex items-center gap-2.5">
                <SkeletonCircle className="size-4" />
                <SkeletonBox className="h-3 w-16" />
              </div>
              <SkeletonBox className="h-4 w-7 rounded" />
            </div>

            {/* 3. Brand Manager badge placeholder (self-start rounded-full) */}
            <div className="my-1 pl-1">
              <SkeletonPill className="h-7 w-28" />
            </div>

            {/* 4. Menu heading placeholder */}
            <div className="pt-2 pl-3 pb-1">
              <SkeletonBox className="h-2.5 w-12 rounded" />
            </div>

            {/* 5. Six Navigation Menu Items (exact rows from Sidebar) */}
            <div className="flex flex-col gap-1.5">
              {/* Active Item: Brand Dashboard (white card background) */}
              <div className="flex h-11 items-center gap-3 rounded-[20px] bg-[#FFFFFF] px-3.5 shadow-xs border border-[#E5E5E5]/60">
                <SkeletonBox className="size-5 rounded-md" />
                <SkeletonBox className="h-3.5 w-28 rounded" />
              </div>

              {/* Item 2: Approval Queue with indicator dot */}
              <div className="flex h-11 items-center justify-between px-3.5">
                <div className="flex items-center gap-3">
                  <SkeletonBox className="size-5 rounded-md" />
                  <SkeletonBox className="h-3.5 w-24 rounded" />
                </div>
                <SkeletonCircle className="size-2" />
              </div>

              {/* Item 3: Brand Asset Library */}
              <div className="flex h-11 items-center gap-3 px-3.5">
                <SkeletonBox className="size-5 rounded-md" />
                <SkeletonBox className="h-3.5 w-32 rounded" />
              </div>

              {/* Item 4: Guideline Ingestion */}
              <div className="flex h-11 items-center gap-3 px-3.5">
                <SkeletonBox className="size-5 rounded-md" />
                <SkeletonBox className="h-3.5 w-28 rounded" />
              </div>

              {/* Item 5: All Submissions */}
              <div className="flex h-11 items-center gap-3 px-3.5">
                <SkeletonBox className="size-5 rounded-md" />
                <SkeletonBox className="h-3.5 w-24 rounded" />
              </div>

              {/* Item 6: Audit Log Ledger */}
              <div className="flex h-11 items-center gap-3 px-3.5">
                <SkeletonBox className="size-5 rounded-md" />
                <SkeletonBox className="h-3.5 w-28 rounded" />
              </div>
            </div>
          </div>

          {/* 6. Bottom Profile Section & Actions */}
          <div className="flex flex-col gap-2 border-t border-[#E5E5E5] pt-3">
            {/* User profile card (rounded-[20px] bg-[#FFFFFF] border border-[#E5E5E5] p-3) */}
            <div className="flex items-center gap-3 rounded-[20px] border border-[#E5E5E5] bg-[#FFFFFF] p-3 shadow-xs">
              <SkeletonCircle className="size-10" />
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <SkeletonBox className="h-3.5 w-24" />
                <SkeletonBox className="h-2.5 w-32" />
              </div>
              <SkeletonBox className="size-4 rounded" />
            </div>

            {/* Settings row */}
            <div className="flex h-10 items-center gap-3 px-3.5">
              <SkeletonBox className="size-4 rounded" />
              <SkeletonBox className="h-3 w-16" />
            </div>

            {/* Logout row */}
            <div className="flex h-10 items-center gap-3 px-3.5">
              <SkeletonBox className="size-4 rounded" />
              <SkeletonBox className="h-3 w-14" />
            </div>
          </div>
        </aside>

        {/* ── Main Content Area (px-4 pt-4 md:px-8 md:pt-8 bg-[#FFFFFF]) ── */}
        <main className="min-w-0 flex-1 px-4 pt-4 pb-20 md:px-8 md:pt-8 bg-[#FFFFFF] overflow-y-auto">
          {/* ── B. Main Dashboard Header ── */}
          <header className="flex items-center justify-between gap-4">
            {/* Greeting text placeholder ("Hello, Priya!") */}
            <SkeletonBox className="h-9 w-52 sm:w-64 rounded-xl" />

            <div className="ml-auto flex items-center gap-3 shrink-0">
              {/* Online team presence placeholder pill with overlapping circles */}
              <div className="flex items-center gap-2 rounded-full border border-[#E5E5E5] bg-[#FFFFFF] px-3 py-1.5 shadow-2xs">
                <div className="flex -space-x-2">
                  <SkeletonCircle className="size-7 border-2 border-[#FFFFFF]" />
                  <SkeletonCircle className="size-7 border-2 border-[#FFFFFF]" />
                  <SkeletonCircle className="size-7 border-2 border-[#FFFFFF]" />
                </div>
                <SkeletonBox className="h-3 w-14 rounded ml-1" />
              </div>

              {/* Notification bell placeholder */}
              <SkeletonCircle className="size-10 border border-[#E5E5E5] bg-[#FFFFFF] shadow-2xs" />
            </div>
          </header>

          {/* ── Canonical Two-Column Grid: mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px] ── */}
          <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            
            {/* ── Left Column: Performance Bento Cards + Audit Volume ── */}
            <div className="flex min-w-0 flex-col gap-8">
              
              {/* C. Performance Section Header */}
              <div className="flex items-center justify-between">
                <SkeletonBox className="h-6 w-32 rounded-lg" />

                {/* Day / Week / Month / Year segmented control placeholder */}
                <div className="flex h-10 w-56 items-center justify-between rounded-xl bg-[#E8E8E8] p-1 gap-1">
                  <SkeletonPill className="h-7 w-12 bg-transparent" />
                  <SkeletonPill className="h-8 w-14 bg-[#FFFFFF] shadow-xs" />
                  <SkeletonPill className="h-7 w-12 bg-transparent" />
                  <SkeletonPill className="h-7 w-12 bg-transparent" />
                </div>
              </div>

              {/* Four Performance Bento Cards (2-column x 2-row grid) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* 1. Brand Health Score Card */}
                <div className="flex min-h-[168px] flex-col justify-between rounded-[24px] border border-[#E5E5E5] bg-[#FFFFFF] p-6 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <SkeletonBox className="h-4 w-36 rounded" />
                    <SkeletonCircle className="size-11" />
                  </div>
                  <div className="my-2">
                    <SkeletonBox className="h-10 w-24 rounded-lg" />
                  </div>
                  <SkeletonBox className="h-3.5 w-44 rounded" />
                </div>

                {/* 2. Active Brand Rules Card */}
                <div className="flex min-h-[168px] flex-col justify-between rounded-[24px] border border-[#E5E5E5] bg-[#FFFFFF] p-6 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <SkeletonBox className="h-4 w-36 rounded" />
                    <SkeletonCircle className="size-11" />
                  </div>
                  <div className="my-2">
                    <SkeletonBox className="h-10 w-20 rounded-lg" />
                  </div>
                  <SkeletonBox className="h-3.5 w-40 rounded" />
                </div>

                {/* 3. Verified Brand Assets Card */}
                <div className="flex min-h-[168px] flex-col justify-between rounded-[24px] border border-[#E5E5E5] bg-[#FFFFFF] p-6 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <SkeletonBox className="h-4 w-36 rounded" />
                    <SkeletonCircle className="size-11" />
                  </div>
                  <div className="my-2 flex items-center justify-between">
                    <SkeletonBox className="h-10 w-20 rounded-lg" />
                    <SkeletonPill className="h-6 w-12" />
                  </div>
                  <SkeletonBox className="h-3.5 w-32 rounded" />
                </div>

                {/* 4. Turnaround Velocity Card */}
                <div className="flex min-h-[168px] flex-col justify-between rounded-[24px] border border-[#E5E5E5] bg-[#FFFFFF] p-6 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <SkeletonBox className="h-4 w-36 rounded" />
                    <SkeletonCircle className="size-11" />
                  </div>
                  <div className="my-2 flex items-center justify-between">
                    <SkeletonBox className="h-10 w-16 rounded-lg" />
                    <SkeletonPill className="h-6 w-12" />
                  </div>
                  <SkeletonBox className="h-3.5 w-32 rounded" />
                </div>
              </div>

              {/* ── E. Audit Volume Section ── */}
              <div className="flex flex-col gap-6 rounded-[24px] border border-[#E5E5E5] bg-[#FFFFFF] p-6 shadow-xs">
                {/* Header: Audit volume heading, dropdown, three-dot menu */}
                <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
                  <div className="flex flex-col gap-1.5">
                    <SkeletonBox className="h-5 w-32 rounded" />
                    <SkeletonBox className="h-3.5 w-48 rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <SkeletonPill className="h-8 w-24" />
                    <SkeletonBox className="size-8 rounded-lg" />
                  </div>
                </div>

                {/* Metrics: Total audits label and large number */}
                <div className="flex items-baseline gap-3">
                  <SkeletonBox className="h-3.5 w-20 rounded" />
                  <SkeletonBox className="h-8 w-28 rounded-lg" />
                </div>

                {/* Large chart container placeholder with animated bars */}
                <div className="flex h-36 items-end gap-3 pt-2">
                  {[40, 65, 30, 80, 55, 95, 70, 85, 60, 90, 75, 100].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        style={{ height: `${h}%` }}
                        className="skeleton-shimmer w-full rounded-t-md transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── D. Right Column: Brand Advisor, Review Queue, Recent Activity ── */}
            <div className="flex min-w-0 flex-col gap-8">
              
              {/* 1. Brand Advisor Widget */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <SkeletonBox className="h-5 w-28 rounded" />
                  <SkeletonBox className="h-4 w-16 rounded" />
                </div>

                <div className="flex flex-col gap-3 rounded-[24px] border border-[#E5E5E5] bg-[#FFFFFF] p-5 shadow-xs">
                  <div className="flex items-start gap-3 rounded-xl border border-[#E5E5E5] bg-[#F5F5F5] p-4">
                    <SkeletonCircle className="size-9" />
                    <div className="flex flex-col gap-2 flex-1">
                      <SkeletonBox className="h-4 w-40 rounded" />
                      <SkeletonBox className="h-3 w-full rounded" />
                      <SkeletonBox className="h-3 w-4/5 rounded" />
                      <div className="mt-1">
                        <SkeletonPill className="h-8 w-28" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Review Queue Widget */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <SkeletonBox className="h-5 w-28 rounded" />
                  <SkeletonBox className="h-4 w-16 rounded" />
                </div>

                <div className="flex flex-col divide-y divide-[#E5E5E5] rounded-[24px] border border-[#E5E5E5] bg-[#FFFFFF] p-5 shadow-xs">
                  <div className="flex items-center justify-between py-3">
                    <SkeletonBox className="h-4 w-40 rounded" />
                    <SkeletonBox className="h-6 w-6 rounded" />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <SkeletonBox className="h-4 w-44 rounded" />
                    <SkeletonBox className="h-6 w-6 rounded" />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <SkeletonBox className="h-4 w-38 rounded" />
                    <SkeletonBox className="h-6 w-6 rounded" />
                  </div>
                </div>
              </div>

              {/* 3. Recent Activity Widget */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <SkeletonBox className="h-5 w-28 rounded" />
                  <SkeletonBox className="h-4 w-16 rounded" />
                </div>

                <div className="flex items-center gap-3 rounded-[24px] border border-[#E5E5E5] bg-[#FFFFFF] p-5 shadow-xs">
                  <SkeletonCircle className="size-9" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <SkeletonBox className="h-3.5 w-48 rounded" />
                    <SkeletonBox className="h-2.5 w-16 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Ask Brad Pill Placeholder (Exact position bottom-right) */}
      <div className="fixed bottom-6 right-6 z-50 flex h-11 w-32 items-center justify-between rounded-full border border-[#E5E5E5] bg-[#FFFFFF] px-3.5 shadow-float">
        <SkeletonBox className="h-3.5 w-16 rounded" />
        <SkeletonCircle className="size-5" />
      </div>
    </div>
  );
}
