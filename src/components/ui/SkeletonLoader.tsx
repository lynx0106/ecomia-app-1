'use client';

export function SkeletonLoader({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-3 p-4 bg-gray-100 dark:bg-slate-800 rounded-lg">
          <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 dark:bg-slate-700 rounded"></div>
          <div className="h-3 bg-gray-300 dark:bg-slate-700 rounded w-5/6"></div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse p-6 bg-gray-100 dark:bg-slate-800 rounded-lg space-y-4">
      <div className="h-6 bg-gray-300 dark:bg-slate-700 rounded w-2/3"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded"></div>
        <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-5/6"></div>
      </div>
      <div className="h-10 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded"></div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
