import { prisma } from '@/lib/prisma';
import { SAMPLE_SYSTEM_HEALTH_SERIES, type SystemHealthSnapshot } from '@/lib/system-health';

/** ISO logs are expected to start with `YYYY-MM-DD` (e.g. `2026-04-08T…`). */
function currentMonthTimestampPrefix(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${String(m).padStart(2, '0')}-`;
}

function filterByCurrentMonth<T extends { timestamp: string }>(rows: T[]): T[] {
  const prefix = currentMonthTimestampPrefix();
  return rows.filter((r) => r.timestamp.startsWith(prefix));
}

function mapRow(row: {
  id: string;
  memory_usage: string;
  status: string;
  timestamp: string;
  uptime: string;
}): SystemHealthSnapshot {
  return {
    _id: row.id,
    status: row.status,
    memory_usage: row.memory_usage,
    uptime: row.uptime,
    timestamp: row.timestamp,
  };
}

export async function getSystemHealthSeriesForHome(): Promise<SystemHealthSnapshot[]> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    return filterByCurrentMonth(SAMPLE_SYSTEM_HEALTH_SERIES);
  }

  const monthPrefix = currentMonthTimestampPrefix();

  try {
    const rows = await prisma.health_logs.findMany({
      where: { timestamp: { startsWith: monthPrefix } },
      orderBy: { timestamp: 'asc' },
    });
    return rows.map(mapRow);
  } catch (err) {
    console.error('[system-health-db] Failed to load snapshots:', err);
    if (process.env.NODE_ENV === 'development') {
      return filterByCurrentMonth(SAMPLE_SYSTEM_HEALTH_SERIES);
    }
    return [];
  }
}
