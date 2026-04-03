import { Card, Chip, cn, ProgressBar } from '@heroui/react';
import {
  formatMegabytes,
  MEMORY_PROGRESS_MAX_MB,
  summarizeMemoryUsage,
  sortSnapshotsByTimestamp,
  type SystemHealthSnapshot,
} from '@/lib/system-health';

const glassCard =
  'h-full min-h-0 border-0 shadow-none ring-0 backdrop-blur-md bg-white/45 dark:bg-black/35';

type Props = {
  data: SystemHealthSnapshot[];
};

function chipColorForStatus(status: string): 'success' | 'warning' | 'danger' | 'default' {
  const v = status.trim().toLowerCase();
  if (v === 'ok' || v === 'healthy' || v === 'up') return 'success';
  if (v === 'warn' || v === 'warning' || v === 'degraded') return 'warning';
  if (v === 'error' || v === 'down' || v === 'critical' || v === 'failed') return 'danger';
  return 'default';
}

export function SystemHealthDashboard({ data }: Props) {
  const sorted = sortSnapshotsByTimestamp(data);
  const memorySummary = summarizeMemoryUsage(data);
  const latest = sorted.length === 0 ? null : sorted[sorted.length - 1];
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
    <div
      className={cn(
        'relative min-h-0 flex-1 overflow-hidden rounded-2xl',
        'bg-slate-100 text-foreground dark:bg-slate-950'
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_15%_-5%,rgba(99,102,241,0.28),transparent_55%)] dark:bg-[radial-gradient(ellipse_85%_55%_at_15%_-5%,rgba(99,102,241,0.38),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_95%_10%,rgba(100,116,139,0.35),transparent_50%)] dark:bg-[radial-gradient(ellipse_70%_50%_at_95%_10%,rgba(148,163,184,0.22),transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_100%,rgba(79,70,229,0.12),transparent_45%)] dark:bg-[radial-gradient(ellipse_60%_45%_at_50%_100%,rgba(129,140,248,0.15),transparent_45%)]"
      />

      <div className="relative flex min-h-[min(520px,calc(100dvh-5rem))] items-center justify-center p-6">
        <Card className={cn(glassCard, 'flex w-full max-w-xl flex-col')} variant="transparent">
          <Card.Header className="pb-1">
            <Card.Title className="text-sm font-semibold text-foreground">Memory</Card.Title>
          </Card.Header>
          <Card.Content className="flex flex-col gap-3 pt-0">
            {latest ? (
              <div className="rounded-lg bg-black/5 p-3 dark:bg-white/10">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold tracking-wide text-foreground/80 uppercase">
                    Status summary
                  </p>
                  <Chip color={chipColorForStatus(latest.status)} size="sm" variant="primary">
                    <Chip.Label className="font-semibold uppercase">{latest.status}</Chip.Label>
                  </Chip>
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
                <p className="text-xs leading-snug text-foreground/70">
                  {memorySummary.totalCount} reading{memorySummary.totalCount === 1 ? '' : 's'}
                  {memorySummary.parsedCount !== memorySummary.totalCount
                    ? ` · ${memorySummary.parsedCount} with MB values`
                    : ''}
                </p>
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
                <ProgressBar
                  aria-label={memoryAriaParts.join('. ')}
                  className="w-full"
                  color="success"
                  maxValue={MEMORY_PROGRESS_MAX_MB}
                  minValue={0}
                  value={memoryValue}
                  formatOptions={{ style: 'percent', maximumFractionDigits: 0 }}
                >
                  <ProgressBar.Output className="text-xs text-foreground/75" />
                  <ProgressBar.Track>
                    <ProgressBar.Fill className="relative overflow-hidden after:absolute after:inset-0 after:bg-[repeating-linear-gradient(135deg,transparent,transparent_5px,rgba(255,255,255,0.14)_5px,rgba(255,255,255,0.14)_10px)] dark:after:bg-[repeating-linear-gradient(135deg,transparent,transparent_5px,rgba(255,255,255,0.1)_5px,rgba(255,255,255,0.1)_10px)]" />
                  </ProgressBar.Track>
                </ProgressBar>
              </>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
