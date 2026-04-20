'use client';

import { ServerOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { MonthContributionHeatmap } from '@/components/month-contribution-heatmap';
import { Card, Chip, cn } from '@heroui/react';
import {
  formatMegabytes,
  getMonthDayOkErrorGetter,
  getNextRefreshAfterMs,
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

function formatCountdownMmSs(remainingMs: number): string {
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function SystemHealthDashboard({ data }: Props) {
  const router = useRouter();
  const [emptyCalendarAnchor] = useState(() => new Date());
  const [clock, setClock] = useState(() => new Date());
  /** Avoid SSR/client `new Date()` drift for the countdown chip (hydration mismatch). */
  const [hasMounted, setHasMounted] = useState(false);
  const [refreshFiredForSnapshotTs, setRefreshFiredForSnapshotTs] = useState<string | null>(null);
  const refreshFiredForSnapshotTsRef = useRef<string | null>(null);

  useEffect(() => {
    setHasMounted(true);
    const id = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const sorted = sortSnapshotsByTimestamp(data);
  const memorySummary = summarizeMemoryUsage(data);
  const latest = sorted.length === 0 ? null : sorted[sorted.length - 1];

  const nextRefreshAtMs = latest !== null ? getNextRefreshAfterMs(latest.timestamp) : null;

  useEffect(() => {
    if (latest === null || nextRefreshAtMs === null) return;
    const overdue = clock.getTime() >= nextRefreshAtMs;
    if (!overdue) return;
    if (refreshFiredForSnapshotTsRef.current === latest.timestamp) return;
    refreshFiredForSnapshotTsRef.current = latest.timestamp;
    queueMicrotask(() => {
      setRefreshFiredForSnapshotTs(latest.timestamp);
    });
    router.refresh();
  }, [latest, nextRefreshAtMs, router, clock]);

  const calendarDate =
    latest !== null
      ? (() => {
          const d = new Date(latest.timestamp);
          return !Number.isNaN(d.getTime()) ? d : emptyCalendarAnchor;
        })()
      : clock;
  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();
  const monthDayOkError = getMonthDayOkErrorGetter(sorted, calendarYear, calendarMonth);
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

  let nextRefreshBody: string;
  if (nextRefreshAtMs === null) {
    nextRefreshBody = '—';
  } else if (!hasMounted) {
    nextRefreshBody = '--:--';
  } else {
    const remaining = nextRefreshAtMs - clock.getTime();
    if (remaining <= 0) {
      const refreshing = latest !== null && refreshFiredForSnapshotTs === latest.timestamp;
      nextRefreshBody = refreshing ? 'Refreshing…' : '0:00';
    } else {
      nextRefreshBody = formatCountdownMmSs(remaining);
    }
  }

  const latestSnapshotAt = latest !== null ? new Date(latest.timestamp) : null;
  const latestSnapshotValid =
    latestSnapshotAt !== null && !Number.isNaN(latestSnapshotAt.getTime());

  return (
    <div className={cn('relative min-h-0 flex-1 overflow-hidden rounded-2xl')}>
      <div className="relative flex min-h-[min(520px,calc(100dvh-5rem))] items-center justify-center p-6">
        <div className="grid w-full max-w-3xl grid-cols-1 gap-6 lg:grid-cols-6 lg:items-start">
          <Card
            className={cn(glassCard, 'flex min-w-0 w-full flex-col lg:col-span-4')}
            variant="transparent"
          >
            <Card.Header className="flex w-full min-w-0 flex-row items-center justify-between gap-2 pb-1">
              <Card.Title className="min-w-0 text-sm font-semibold text-foreground">
                Server Status
              </Card.Title>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                {statusBadge !== null ? (
                  <Chip color={statusBadge.color} size="sm" variant="soft">
                    {statusBadge.label}
                  </Chip>
                ) : (
                  <Chip color="default" size="sm" variant="soft">
                    No data
                  </Chip>
                )}
                {latest !== null && statusBadge !== null ? (
                  <Chip
                    aria-label={
                      hasMounted ? `Next refresh, ${nextRefreshBody}` : 'Next refresh countdown'
                    }
                    className="tabular-nums"
                    color="accent"
                    size="sm"
                    variant="soft"
                  >
                    {nextRefreshAtMs !== null ? (
                      <time dateTime={new Date(nextRefreshAtMs).toISOString()}>
                        {nextRefreshBody}
                      </time>
                    ) : (
                      nextRefreshBody
                    )}
                  </Chip>
                ) : null}
              </div>
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
                      <p className="text-xs text-muted">Last reading</p>
                      {latestSnapshotValid && latestSnapshotAt !== null ? (
                        <time
                          className="mt-0.5 block text-xs font-medium tabular-nums text-foreground"
                          dateTime={latestSnapshotAt.toISOString()}
                        >
                          {latestSnapshotAt.toLocaleString(undefined, {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </time>
                      ) : (
                        <p className="mt-0.5 text-xs font-medium tabular-nums text-foreground">—</p>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted">Uptime</p>
                      <p className="mt-0.5 text-xs font-medium tabular-nums text-foreground">
                        {latest.uptime != null && latest.uptime.trim().length > 0
                          ? latest.uptime.trim()
                          : '—'}
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
              ) : latest === null ? (
                <div
                  className="flex flex-col items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-8 text-center dark:bg-white/10"
                  role="status"
                  aria-label="No server health data"
                >
                  <ServerOff
                    className="size-10 text-foreground/45"
                    strokeWidth={1.25}
                    aria-hidden
                  />
                  <p className="max-w-[20rem] text-xs leading-relaxed text-muted">
                    No health snapshots yet. Status and memory will show here once the server
                    reports data.
                  </p>
                </div>
              ) : null}
              {latest !== null &&
                (memorySummary.totalCount === 0 ? (
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
                ))}
            </Card.Content>
          </Card>

          <Card
            className={cn(glassCard, 'flex min-w-0 w-full flex-col lg:col-span-2')}
            variant="transparent"
          >
            <Card.Header className="pb-1">
              <Card.Title className="text-sm font-semibold text-foreground">
                {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Card.Title>
            </Card.Header>
            <Card.Content className="pt-0">
              <MonthContributionHeatmap
                year={calendarYear}
                month={calendarMonth}
                getDayOkError={monthDayOkError}
              />
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}
