import { prisma } from '@/lib/prisma';
import { SAMPLE_SYSTEM_HEALTH_SERIES, type SystemHealthSnapshot } from '@/lib/system-health';

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
    return SAMPLE_SYSTEM_HEALTH_SERIES;
  }

  try {
    const rows = await prisma.health_logs.findMany({
      orderBy: { timestamp: 'asc' },
    });
    return rows.map(mapRow);
  } catch (err) {
    console.error('[system-health-db] Failed to load snapshots:', err);
    if (process.env.NODE_ENV === 'development') {
      return SAMPLE_SYSTEM_HEALTH_SERIES;
    }
    return [];
  }
}
