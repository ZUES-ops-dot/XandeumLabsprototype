import { cn } from '@/lib/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-lg bg-zinc-800/50',
        className
      )}
      style={style}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="mb-2 h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="flex h-56 items-end gap-2 p-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton
          key={i}
          className="flex-1"
          style={{ height: `${Math.random() * 60 + 20}%` }}
        />
      ))}
    </div>
  );
}
