export type SystemHealthSnapshot = {
  _id: string;
  status: string;
  memory_usage: string | null;
  uptime: string | null;
  timestamp: string;
};

/** Demo ceiling for the memory progress bar (MB). */
export const MEMORY_PROGRESS_MAX_MB = 512;

/** Expected interval between health log samples; UI derives next refresh from latest timestamp. */
export const HEALTH_LOG_REFRESH_INTERVAL_MS = 5 * 60 * 1000 + 30 * 1000;

/** Epoch ms when the UI should expect the next log after `isoTimestamp`, or null if invalid. */
export function getNextRefreshAfterMs(isoTimestamp: string): number | null {
  const t = new Date(isoTimestamp).getTime();
  if (Number.isNaN(t)) return null;
  return t + HEALTH_LOG_REFRESH_INTERVAL_MS;
}

export const SAMPLE_SYSTEM_HEALTH: SystemHealthSnapshot = {
  _id: '69cf834334b1f533a178b929',
  status: 'ok',
  memory_usage: '158.20 MB',
  uptime: '0h 7m 22s',
  timestamp: '2026-04-03T16:07:15.097+07:00',
};

export const SAMPLE_SYSTEM_HEALTH_SERIES: SystemHealthSnapshot[] = [
  {
    _id: '69cf834334b1f533a178b929',
    status: 'ok',
    memory_usage: '98.10 MB',
    uptime: '0h 2m 05s',
    timestamp: '2026-04-03T15:55:00.000+07:00',
  },
  {
    _id: '69cf834334b1f533a178b929',
    status: 'ok',
    memory_usage: '124.40 MB',
    uptime: '0h 4m 18s',
    timestamp: '2026-04-03T16:01:22.000+07:00',
  },
  {
    _id: '69cf834334b1f533a178b929',
    status: 'ok',
    memory_usage: '288.00 MB',
    uptime: '0h 5m 40s',
    timestamp: '2026-04-03T16:04:10.000+07:00',
  },
  {
    _id: '69cf834334b1f533a178b929',
    status: 'ok',
    memory_usage: '158.20 MB',
    uptime: '0h 7m 22s',
    timestamp: '2026-04-03T16:07:15.097+07:00',
  },
  {
    _id: '69cf834334b1f533a178b929',
    status: 'error',
    memory_usage: '401.50 MB',
    uptime: '0h 9m 01s',
    timestamp: '2026-04-03T16:09:45.000+07:00',
  },
];

export type MemoryUsageSummary = {
  totalCount: number;
  parsedCount: number;
  latestMb: number | null;
  latestRaw: string | null;
  minMb: number | null;
  maxMb: number | null;
  avgMb: number | null;
};

export function parseMemoryMegabytes(usage: string | null): number | null {
  if (usage == null || usage.trim() === '') return null;
  const match = /^([\d.]+)\s*MB\b/i.exec(usage.trim());
  if (!match) return null;
  const n = Number.parseFloat(match[1]);
  return Number.isFinite(n) ? n : null;
}

export function formatMegabytes(mb: number): string {
  return `${mb.toFixed(2)} MB`;
}

/** Aggregate memory stats from all snapshots; latest follows newest timestamp. */
export function summarizeMemoryUsage(snapshots: SystemHealthSnapshot[]): MemoryUsageSummary {
  const totalCount = snapshots.length;
  if (totalCount === 0) {
    return {
      totalCount: 0,
      parsedCount: 0,
      latestMb: null,
      latestRaw: null,
      minMb: null,
      maxMb: null,
      avgMb: null,
    };
  }

  const ordered = sortSnapshotsByTimestamp(snapshots);
  const newest = ordered[ordered.length - 1];
  const latestRaw = newest.memory_usage;
  const latestMb = parseMemoryMegabytes(latestRaw);

  const mbs: number[] = [];
  for (const s of snapshots) {
    const mb = parseMemoryMegabytes(s.memory_usage);
    if (mb !== null) mbs.push(mb);
  }
  const parsedCount = mbs.length;
  if (parsedCount === 0) {
    return {
      totalCount,
      parsedCount: 0,
      latestMb,
      latestRaw,
      minMb: null,
      maxMb: null,
      avgMb: null,
    };
  }

  const minMb = Math.min(...mbs);
  const maxMb = Math.max(...mbs);
  const avgMb = mbs.reduce((a, b) => a + b, 0) / mbs.length;

  return {
    totalCount,
    parsedCount,
    latestMb,
    latestRaw,
    minMb,
    maxMb,
    avgMb,
  };
}

export function sortSnapshotsByTimestamp(
  snapshots: SystemHealthSnapshot[]
): SystemHealthSnapshot[] {
  return [...snapshots].sort((a, b) => {
    const ta = new Date(a.timestamp).getTime();
    const tb = new Date(b.timestamp).getTime();
    const na = Number.isNaN(ta) ? 0 : ta;
    const nb = Number.isNaN(tb) ? 0 : tb;
    return na - nb;
  });
}

/** Aligns with dashboard status chips: success-like vs error-like strings only. */
export function isHealthStatusOk(status: string): boolean {
  const key = status.trim().toLowerCase();
  return key === 'ok' || key === 'healthy' || key === 'up' || key === 'online';
}

/** Aligns with dashboard status chips: danger-like statuses only. */
export function isHealthStatusError(status: string): boolean {
  const key = status.trim().toLowerCase();
  return (
    key === 'error' ||
    key === 'down' ||
    key === 'critical' ||
    key === 'offline' ||
    key === 'fail' ||
    key === 'failed'
  );
}

export type DayOkErrorCounts = { ok: number; error: number };

/**
 * Per local calendar day in `year`/`month`, counts snapshots whose status is OK-like vs error-like.
 * Days with no snapshots are omitted from the map.
 */
export function buildMonthDayOkErrorMap(
  snapshots: SystemHealthSnapshot[],
  year: number,
  month: number
): Map<number, DayOkErrorCounts> {
  const result = new Map<number, DayOkErrorCounts>();
  for (const s of snapshots) {
    const d = new Date(s.timestamp);
    if (Number.isNaN(d.getTime())) continue;
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;
    const day = d.getDate();
    const cur = result.get(day) ?? { ok: 0, error: 0 };
    if (isHealthStatusOk(s.status)) {
      cur.ok += 1;
    } else if (isHealthStatusError(s.status)) {
      cur.error += 1;
    }
    result.set(day, cur);
  }
  return result;
}

/** `getDayOkError` callback for `MonthContributionHeatmap` from snapshot series. */
export function getMonthDayOkErrorGetter(
  snapshots: SystemHealthSnapshot[],
  year: number,
  month: number
): (dayOfMonth: number, date: Date) => DayOkErrorCounts | null {
  const map = buildMonthDayOkErrorMap(snapshots, year, month);
  return (dayOfMonth) => map.get(dayOfMonth) ?? null;
}
