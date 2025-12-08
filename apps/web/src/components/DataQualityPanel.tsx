'use client';

import { cn } from '@/lib/cn';
import { Activity, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface DataQuality {
  avgQualityScore: number;
  totalIngestCycles: number;
  lastIngestAt: string | null;
  issuesLastHour: Record<string, number>;
}

interface DataQualityPanelProps {
  quality: DataQuality;
  className?: string;
}

function formatIssueCode(code: string): string {
  return code
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getQualityColor(score: number): string {
  if (score >= 0.9) return 'text-xandeum-teal';
  if (score >= 0.7) return 'text-xandeum-gold';
  return 'text-xandeum-orange';
}

function getQualityLabel(score: number): string {
  if (score >= 0.9) return 'Excellent';
  if (score >= 0.7) return 'Good';
  if (score >= 0.5) return 'Fair';
  return 'Poor';
}

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return 'Never';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export function DataQualityPanel({ quality, className }: DataQualityPanelProps) {
  const issueEntries = Object.entries(quality.issuesLastHour);
  const totalIssues = issueEntries.reduce((sum, [, count]) => sum + count, 0);
  const qualityPercent = Math.round(quality.avgQualityScore * 100);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
            <TrendingUp className="h-3.5 w-3.5" />
            Quality Score
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={cn('text-2xl font-bold', getQualityColor(quality.avgQualityScore))}>
              {qualityPercent}%
            </span>
            <span className="text-xs text-zinc-400">{getQualityLabel(quality.avgQualityScore)}</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
            <Activity className="h-3.5 w-3.5" />
            Ingest Cycles
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-zinc-100">
              {quality.totalIngestCycles.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
            <Clock className="h-3.5 w-3.5" />
            Last Ingest
          </div>
          <div className="mt-2">
            <span className="text-lg font-semibold text-zinc-100">
              {formatRelativeTime(quality.lastIngestAt)}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
            {totalIssues > 0 ? (
              <AlertTriangle className="h-3.5 w-3.5 text-xandeum-orange" />
            ) : (
              <CheckCircle className="h-3.5 w-3.5 text-xandeum-teal" />
            )}
            Issues (1h)
          </div>
          <div className="mt-2">
            <span className={cn('text-2xl font-bold', totalIssues > 0 ? 'text-xandeum-orange' : 'text-xandeum-teal')}>
              {totalIssues}
            </span>
          </div>
        </div>
      </div>

      {issueEntries.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">
            Issue Breakdown (Last Hour)
          </h4>
          <div className="flex flex-wrap gap-2">
            {issueEntries.map(([code, count]) => (
              <div
                key={code}
                className="flex items-center gap-2 rounded-lg border border-xandeum-orange/20 bg-xandeum-orange/5 px-3 py-1.5"
              >
                <span className="text-xs text-zinc-300">{formatIssueCode(code)}</span>
                <span className="rounded-full bg-xandeum-orange/20 px-2 py-0.5 text-xs font-semibold text-xandeum-orange">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
