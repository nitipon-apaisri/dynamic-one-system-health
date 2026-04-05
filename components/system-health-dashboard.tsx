'use client';

import { useEffect, useState } from 'react';

import { MonthContributionHeatmap } from '@/components/month-contribution-heatmap';
import { Card, Chip, cn } from '@heroui/react';
import {
  formatMegabytes,
  getMonthActivityLevelGetter,
  summarizeMemoryUsage,
  sortSnapshotsByTimestamp,
  type SystemHealthSnapshot,
} from '@/lib/system-health';

const glassCard =
  'h-full min-h-0 border-0 shadow-none ring-0 backdrop-blur-md bg-white/45 dark:bg-black/35';

function getStatusBadgeDisplay(status: string): {
  label: string;
  color: 'default' | 'accent' | 'success' | 'warning' | 'danger';
} {
  const trimmed = status.trim();
  const label = trimmed.length > 0 ? trimmed.toUpperCase() : 'UNKNOWN';
  const key = trimmed.toLowerCase();
  if (key === 'ok' || key === 'healthy' || key === 'up' || key === 'online') {
    return { color: 'success', label };
  }
  if (key === 'warn' || key === 'warning' || key === 'degraded') {
    return { color: 'warning', label };
  }
  if (
    key === 'error' ||
    key === 'down' ||
    key === 'critical' ||
    key === 'offline' ||
    key === 'fail' ||
    key === 'failed'
  ) {
    return { color: 'danger', label };
  }
  return { color: 'default', label };
}

type StatusChipColor = 'default' | 'accent' | 'success' | 'warning' | 'danger';

/** Map to HeroUI theme tokens (see @heroui/styles variables). */
function statusLeftBorderClass(color: StatusChipColor): string {
  switch (color) {
    case 'success':
      return 'border-l-[color:var(--success)]';
    case 'warning':
      return 'border-l-[color:var(--warning)]';
    case 'danger':
      return 'border-l-[color:var(--danger)]';
    case 'accent':
      return 'border-l-[color:var(--accent)]';
    default:
      return 'border-l-[color:color-mix(in_oklch,var(--foreground)_22%,transparent)]';
  }
}

function statusDotClass(color: StatusChipColor): string {
  switch (color) {
    case 'success':
      return 'bg-[color:var(--success)]';
    case 'warning':
      return 'bg-[color:var(--warning)]';
    case 'danger':
      return 'bg-[color:var(--danger)]';
    case 'accent':
      return 'bg-[color:var(--accent)]';
    default:
      return 'bg-[color:color-mix(in_oklch,var(--foreground)_40%,transparent)]';
  }
}

function breakdownDotClass(color: StatusChipColor): string {
  switch (color) {
    case 'success':
      return 'bg-[color:var(--success)]';
    case 'warning':
      return 'bg-[color:var(--warning)]';
    case 'danger':
      return 'bg-[color:var(--danger)]';
    case 'accent':
      return 'bg-[color:var(--accent)]';
    default:
      return 'bg-[color:color-mix(in_oklch,var(--foreground)_35%,transparent)]';
  }
}

type Props = {
  data: SystemHealthSnapshot[];
};

export function SystemHealthDashboard({ data }: Props) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);

  const sorted = sortSnapshotsByTimestamp(data);
  const memorySummary = summarizeMemoryUsage(data);
  const latest = sorted.length === 0 ? null : sorted[sorted.length - 1];

  const heatmapAnchor = latest !== null ? new Date(latest.timestamp) : null;
  const heatmapYear =
    heatmapAnchor !== null && !Number.isNaN(heatmapAnchor.getTime())
      ? heatmapAnchor.getFullYear()
      : undefined;
  const heatmapMonth =
    heatmapAnchor !== null && !Number.isNaN(heatmapAnchor.getTime())
      ? heatmapAnchor.getMonth()
      : undefined;

  const monthActivityGetLevel =
    heatmapYear === undefined || heatmapMonth === undefined
      ? undefined
      : getMonthActivityLevelGetter(sorted, heatmapYear, heatmapMonth);
  const statusBadge: { label: string; color: StatusChipColor } | null =
    latest !== null ? getStatusBadgeDisplay(latest.status) : null;
  const statusCounts = new Map<string, number>();
  for (const snapshot of sorted) {
    const key: string = snapshot.status.trim();
    statusCounts.set(key, (statusCounts.get(key) ?? 0) + 1);
  }
  const statusBreakdownRows = [...statusCounts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  );

  return (
    <div className={cn('relative min-h-0 flex-1 overflow-hidden rounded-2xl')}>
      <div className="relative flex min-h-[min(520px,calc(100dvh-5rem))] items-center justify-center p-6">
        <div className="grid w-full max-w-3xl grid-cols-1 gap-6 lg:grid-cols-6 lg:items-start">
          <Card
            className={cn(glassCard, 'flex min-w-0 w-full flex-col lg:col-span-4')}
            variant="transparent"
          >
            <Card.Header className="flex w-full min-w-0 flex-row items-center justify-between gap-2 pb-1">
              <Card.Title className="text-sm font-semibold text-foreground">
                Server Status
              </Card.Title>
              {statusBadge !== null ? (
                <Chip color={statusBadge.color} size="sm" variant="soft">
                  {statusBadge.label}
                </Chip>
              ) : (
                <Chip color="default" size="sm" variant="soft">
                  No data
                </Chip>
              )}
            </Card.Header>
            <Card.Content className="flex flex-col gap-4 pt-0">
              {latest !== null && statusBadge !== null ? (
                <div
                  className={cn(
                    'rounded-lg  bg-gray-100 px-3 py-3 dark:bg-white/10'
                    // statusLeftBorderClass(statusBadge.color),
                  )}
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-6">
                    <div className="min-w-0">
                      <p className="text-xs text-muted">Current date</p>
                      <time
                        className="mt-0.5 block text-xs font-medium tabular-nums text-foreground"
                        {...(now !== null ? { dateTime: now.toISOString() } : {})}
                      >
                        {now !== null
                          ? now.toLocaleString(undefined, {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </time>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted">Uptime</p>
                      <p className="mt-0.5 text-xs font-medium tabular-nums text-foreground">
                        {latest.uptime.trim().length > 0 ? latest.uptime.trim() : '—'}
                      </p>
                    </div>
                  </div>
                  <div
                    className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-separator pt-3"
                    role="list"
                    aria-label="Status distribution across snapshots"
                  >
                    {statusBreakdownRows.length === 0 ? (
                      <span className="text-xs text-muted">No readings</span>
                    ) : (
                      statusBreakdownRows.map(([status, count]) => {
                        const meta = getStatusBadgeDisplay(status);
                        return (
                          <span
                            key={status || 'empty'}
                            className="flex items-center gap-2 text-xs tabular-nums"
                            role="listitem"
                          >
                            <span
                              className={cn(
                                'size-1 shrink-0 rounded-full',
                                breakdownDotClass(meta.color)
                              )}
                              aria-hidden
                            />
                            <span className="text-foreground/70">{meta.label}</span>
                            <span className="font-medium text-foreground">{count}</span>
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : null}
              {memorySummary.totalCount === 0 ? (
                <p className="text-xs text-muted">—</p>
              ) : (
                <>
                  <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs tabular-nums">
                    <dt className="text-foreground/70">Latest</dt>
                    <dd className="text-right font-medium text-foreground">
                      {memorySummary.latestMb !== null
                        ? formatMegabytes(memorySummary.latestMb)
                        : (memorySummary.latestRaw ?? '—')}
                    </dd>
                    {memorySummary.parsedCount > 0 &&
                    memorySummary.minMb !== null &&
                    memorySummary.maxMb !== null &&
                    memorySummary.avgMb !== null ? (
                      <>
                        <dt className="text-foreground/70">Min</dt>
                        <dd className="text-right font-medium text-foreground">
                          {formatMegabytes(memorySummary.minMb)}
                        </dd>
                        <dt className="text-foreground/70">Max</dt>
                        <dd className="text-right font-medium text-foreground">
                          {formatMegabytes(memorySummary.maxMb)}
                        </dd>
                        <dt className="text-foreground/70">Avg</dt>
                        <dd className="text-right font-medium text-foreground">
                          {formatMegabytes(memorySummary.avgMb)}
                        </dd>
                      </>
                    ) : null}
                  </dl>
                </>
              )}
            </Card.Content>
          </Card>

          <Card
            className={cn(glassCard, 'flex min-w-0 w-full flex-col lg:col-span-2')}
            variant="transparent"
          >
            <Card.Header className="pb-1">
              <Card.Title className="text-sm font-semibold text-foreground">
                {heatmapAnchor?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Card.Title>
            </Card.Header>
            <Card.Content className="pt-0">
              <MonthContributionHeatmap
                {...(heatmapYear !== undefined &&
                heatmapMonth !== undefined &&
                monthActivityGetLevel !== undefined
                  ? {
                      year: heatmapYear,
                      month: heatmapMonth,
                      getLevel: monthActivityGetLevel,
                    }
                  : {})}
              />
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}
