'use client';

import { MonthContributionHeatmap } from '@/components/month-contribution-heatmap';
import { Card, Chip, cn } from '@heroui/react';
import {
  formatMegabytes,
  getMonthActivityLevelGetter,
  MEMORY_PROGRESS_MAX_MB,
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

type Props = {
  data: SystemHealthSnapshot[];
};

export function SystemHealthDashboard({ data }: Props) {
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
  const statusBadge = latest !== null ? getStatusBadgeDisplay(latest.status) : null;
  const statusCounts = new Map<string, number>();
  for (const snapshot of sorted) {
    const key = snapshot.status.trim();
    statusCounts.set(key, (statusCounts.get(key) ?? 0) + 1);
  }
  const statusBreakdown = [...statusCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([status, count]) => `${status.toUpperCase()} ${count}`)
    .join(' · ');

  const memoryValue =
    memorySummary.latestMb === null ? 0 : Math.min(memorySummary.latestMb, MEMORY_PROGRESS_MAX_MB);

  const memoryAriaParts: string[] = [
    `Latest ${memorySummary.latestRaw ?? 'unknown'} (${MEMORY_PROGRESS_MAX_MB} MB reference cap)`,
  ];
  if (memorySummary.avgMb !== null) {
    memoryAriaParts.push(`series average ${formatMegabytes(memorySummary.avgMb)}`);
  }
  if (memorySummary.maxMb !== null) {
    memoryAriaParts.push(`series peak ${formatMegabytes(memorySummary.maxMb)}`);
  }

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
            <Card.Content className="flex flex-col gap-3 pt-0">
              {latest ? (
                <div className="rounded-lg bg-black/5 p-3 dark:bg-white/10">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold tracking-wide text-foreground/80 uppercase">
                      Status summary
                    </p>
                  </div>
                  <p className="text-xs leading-snug text-foreground/75">
                    {statusBreakdown || 'No status readings'}
                  </p>
                  <p className="mt-1 text-xs leading-snug text-foreground/75">
                    Latest memory:{' '}
                    <span className="font-medium text-foreground">
                      {memorySummary.latestMb !== null
                        ? formatMegabytes(memorySummary.latestMb)
                        : (memorySummary.latestRaw ?? '—')}
                    </span>
                    {memorySummary.avgMb !== null && memorySummary.maxMb !== null
                      ? ` · Avg ${formatMegabytes(memorySummary.avgMb)} · Peak ${formatMegabytes(memorySummary.maxMb)}`
                      : ''}
                  </p>
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
                Month activity -{' '}
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
