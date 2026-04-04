export type SystemHealthSnapshot = {
  _id: string;
  status: string;
  memory_usage: string;
  uptime: string;
  timestamp: string;
};

/** Demo ceiling for the memory progress bar (MB). */
export const MEMORY_PROGRESS_MAX_MB = 512;

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
    status: 'warn',
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

export function parseMemoryMegabytes(usage: string): number | null {
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
