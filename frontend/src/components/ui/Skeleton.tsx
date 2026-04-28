// @ts-nocheck
import { cn } from '../../utils/cn';

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} />;
}

export function IssueCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex gap-2 mb-3">
        <SkeletonBlock className="h-5 w-16" />
        <SkeletonBlock className="h-5 w-20" />
        <SkeletonBlock className="h-5 w-14" />
      </div>
      <SkeletonBlock className="h-6 w-3/4 mb-2" />
      <SkeletonBlock className="h-4 w-1/2 mb-4" />
      <div className="flex justify-between items-center">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-8 w-20" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="h-8 w-12" />
        </div>
        <SkeletonBlock className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  );
}

export function VolunteerCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-3 w-16" />
        </div>
      </div>
      <SkeletonBlock className="h-2 w-full rounded-full" />
      <div className="flex gap-4">
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="h-3 w-20" />
      </div>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-56" />
          <SkeletonBlock className="h-4 w-40" />
        </div>
        <SkeletonBlock className="h-10 w-28 rounded-xl" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <StatCardSkeleton key={i} />)}
      </div>

      {/* Content cards */}
      <div className="space-y-4">
        <SkeletonBlock className="h-6 w-40" />
        {[1, 2].map(i => <IssueCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
