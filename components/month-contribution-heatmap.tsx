'use client';

import { cn } from '@heroui/react';
import { useEffect, useMemo, useState } from 'react';

/** GitHub-style intensity: 0 = none, 4 = strongest */
export type HeatmapLevel = 0 | 1 | 2 | 3 | 4;

export type MonthContributionHeatmapProps = {
  className?: string;
  /** Calendar year (e.g. 2026). If omitted with `month`, both are ignored and the current month is used on the client. */
  year?: number;
  /** 0–11. Must be passed together with `year` for a fixed month. */
  month?: number;
  /** Maps each in-month day to a level. Defaults to `0` for all days. */
  getLevel?: (dayOfMonth: number, date: Date) => HeatmapLevel;
};

/**
 * Calendar layout: columns Sun–Sat (header row), each body row is one week.
 * Top-left cell is the Sunday of the week that contains the 1st (may be empty padding).
 */
function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startWeekday = first.getDay();
  const daysInMonth = last.getDate();
  const numWeekRows = Math.ceil((startWeekday + daysInMonth) / 7);

  const weeks: Array<Array<{ date: Date | null; dayOfMonth: number | null }>> = [];
  for (let w = 0; w < numWeekRows; w++) {
    const week: Array<{ date: Date | null; dayOfMonth: number | null }> = [];
    for (let d = 0; d < 7; d++) {
      const offset = w * 7 + d;
      if (offset < startWeekday || offset >= startWeekday + daysInMonth) {
        week.push({ date: null, dayOfMonth: null });
      } else {
        const day = offset - startWeekday + 1;
        week.push({ date: new Date(year, month, day), dayOfMonth: day });
      }
    }
    weeks.push(week);
  }

  return { weeks, year, month };
}

const WEEKDAY_LABELS = Array.from({ length: 7 }, (_, i) =>
  new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(2024, 0, 7 + i))
);

function monthTitle(year: number, month: number) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(year, month, 1)
  );
}

function localIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function cellBackground(level: HeatmapLevel): string {
  if (level === 0) {
    return 'color-mix(in oklch, var(--foreground) 9%, var(--background))';
  }
  const accentPct = level === 1 ? '22%' : level === 2 ? '42%' : level === 3 ? '62%' : '82%';
  return `color-mix(in oklch, var(--accent) ${accentPct}, var(--background))`;
}

const defaultGetLevel: NonNullable<MonthContributionHeatmapProps['getLevel']> = () => 0;

export function MonthContributionHeatmap({
  className,
  year: yearProp,
  month: monthProp,
  getLevel = defaultGetLevel,
}: MonthContributionHeatmapProps) {
  const isControlled = yearProp !== undefined && monthProp !== undefined;
  const [clientAnchor, setClientAnchor] = useState<{ year: number; month: number } | null>(null);

  useEffect(() => {
    if (isControlled) return;
    const id = requestAnimationFrame(() => {
      const n = new Date();
      setClientAnchor({ year: n.getFullYear(), month: n.getMonth() });
    });
    return () => cancelAnimationFrame(id);
  }, [isControlled]);

  const grid = useMemo(() => {
    if (isControlled && yearProp !== undefined && monthProp !== undefined) {
      return buildMonthGrid(yearProp, monthProp);
    }
    if (!clientAnchor) return null;
    return buildMonthGrid(clientAnchor.year, clientAnchor.month);
  }, [isControlled, yearProp, monthProp, clientAnchor]);

  if (!grid) {
    return (
      <div
        className={cn(
          'min-h-22 min-w-40 rounded-md bg-[color-mix(in_oklch,var(--foreground)_6%,var(--background))]',
          className
        )}
        aria-busy="true"
        aria-label="Loading activity calendar"
      />
    );
  }

  const title = monthTitle(grid.year, grid.month);
  const levelFn = getLevel;

  return (
    <div className={cn(className)}>
      <p className="mb-2 text-xs font-medium text-muted">{title}</p>
      <table
        aria-label={`Activity heatmap for ${title}. Columns are Sunday through Saturday; each row is one week of the month.`}
        className="border-separate border-spacing-1 lg:border-spacing-2"
      >
        <thead>
          <tr>
            {WEEKDAY_LABELS.map((label) => (
              <th
                key={label}
                scope="col"
                className="pb-1 text-center text-[10px] font-normal text-muted tabular-nums"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.weeks.map((week, w) => (
            <tr key={w}>
              {week.map((cell, d) => {
                if (cell.date === null || cell.dayOfMonth === null) {
                  return (
                    <td key={d} className="p-0 text-center" aria-hidden="true">
                      <span className="inline-block size-3 rounded-sm lg:size-4" />
                    </td>
                  );
                }
                const level = levelFn(cell.dayOfMonth, cell.date);
                const iso = localIsoDate(cell.date);
                const label = `${iso}, intensity ${level} of 4`;
                return (
                  <td key={d} className="p-0 text-center" aria-label={label} title={label}>
                    <span
                      className="inline-block size-3 rounded-sm lg:size-4"
                      style={{ backgroundColor: cellBackground(level) }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
