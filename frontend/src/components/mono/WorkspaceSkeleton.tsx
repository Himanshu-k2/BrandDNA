import { motion } from 'motion/react';
import { Logo } from '@/components/mono/Logo';

interface WorkspaceSkeletonProps {
  message?: string;
}

export function WorkspaceSkeleton({
  message = 'Authenticating workspace and verifying brand credentials...'
}: WorkspaceSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="mono mono-wash fixed inset-0 z-50 flex flex-col overflow-y-auto bg-paper p-4 md:p-8"
      role="status"
      aria-label="Loading workspace"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        {/* Top Header Skeleton */}
        <div className="flex items-center justify-between border-b border-silver/60 pb-5">
          <div className="flex items-center gap-4">
            <Logo variant="horizontal" size="md" />
            <div className="hidden sm:flex h-7 w-36 items-center rounded-full bg-silver/50 px-3 animate-pulse">
              <div className="size-2 rounded-full bg-brand-orange/60 mr-2" />
              <div className="h-2.5 w-20 rounded bg-silver/90" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-9 w-36 sm:w-52 rounded-full bg-silver/40 animate-pulse" />
            <div className="flex -space-x-2">
              <div className="size-8 rounded-full border-2 border-paper bg-silver/70 animate-pulse" />
              <div className="size-8 rounded-full border-2 border-paper bg-silver/60 animate-pulse" />
              <div className="size-8 rounded-full border-2 border-paper bg-silver/50 animate-pulse" />
            </div>
            <div className="size-9 rounded-full bg-silver/50 animate-pulse" />
          </div>
        </div>

        {/* Page Title & Breadcrumb Skeleton */}
        <div className="flex flex-col gap-2.5">
          <div className="h-4 w-32 rounded bg-silver/40 animate-pulse" />
          <div className="h-8 w-64 sm:w-96 rounded-xl bg-silver/70 animate-pulse" />
          <div className="h-4 w-80 sm:w-1/2 rounded bg-silver/40 animate-pulse" />
        </div>

        {/* Bento Grid 4 Category Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(idx => (
            <div
              key={idx}
              className="flex min-h-36 flex-col justify-between rounded-2xl border border-silver/80 bg-paper p-6 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 rounded bg-silver/60 animate-pulse" />
                <div className="size-10 rounded-full bg-silver/40 animate-pulse" />
              </div>
              <div className="my-2 flex items-baseline gap-2">
                <div className="h-8 w-14 rounded-lg bg-silver/80 animate-pulse" />
                <div className="h-3.5 w-20 rounded bg-silver/40 animate-pulse" />
              </div>
              <div className="h-3 w-48 rounded bg-silver/40 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Active Rules List Skeleton */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-40 rounded bg-silver/60 animate-pulse" />
            <div className="h-8 w-60 rounded-full bg-silver/40 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(idx => (
              <div
                key={idx}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-silver/80 bg-paper p-6 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-32 rounded bg-silver/50 animate-pulse" />
                  <div className="h-5 w-24 rounded-full bg-silver/40 animate-pulse" />
                </div>
                <div className="h-6 w-3/4 rounded-lg bg-silver/70 animate-pulse" />
                <div className="h-10 w-full rounded-xl bg-silver/30 animate-pulse" />
                <div className="flex items-center justify-between border-t border-silver/40 pt-2">
                  <div className="h-3 w-40 rounded bg-silver/40 animate-pulse" />
                  <div className="size-7 rounded-full bg-silver/40 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Bottom Loading Pill */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full border border-silver/90 bg-ink px-5 py-2.5 text-paper shadow-float">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-orange opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-brand-orange" />
          </span>
          <span className="text-caption font-semibold tracking-wide text-paper">
            {message}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
