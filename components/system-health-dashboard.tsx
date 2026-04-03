import {Card, Chip, cn, ProgressBar} from "@heroui/react";
import {Clock} from "lucide-react";
import {
  formatMegabytes,
  MEMORY_PROGRESS_MAX_MB,
  summarizeMemoryUsage,
  sortSnapshotsByTimestamp,
  type SystemHealthSnapshot,
} from "@/lib/system-health";

const glassCard =
  "h-full min-h-0 border-0 shadow-none ring-0 backdrop-blur-md bg-white/45 dark:bg-black/35";

const bentoCard =
  "max-md:col-span-full max-md:row-span-1 max-md:col-start-auto max-md:min-h-[140px]";

type Props = {
  data: SystemHealthSnapshot[];
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(d);
}

function chipColorForStatus(status: string): "success" | "warning" | "danger" | "default" {
  const v = status.trim().toLowerCase();
  if (v === "ok" || v === "healthy" || v === "up") return "success";
  if (v === "warn" || v === "warning" || v === "degraded") return "warning";
  if (v === "error" || v === "down" || v === "critical" || v === "failed") return "danger";
  return "default";
}

export function SystemHealthDashboard({data}: Props) {
  const sorted = sortSnapshotsByTimestamp(data);
  const memorySummary = summarizeMemoryUsage(data);

  const latest =
    sorted.length === 0 ? null : sorted[sorted.length - 1];

  const memoryValue =
    memorySummary.latestMb === null
      ? 0
      : Math.min(memorySummary.latestMb, MEMORY_PROGRESS_MAX_MB);

  const memoryAriaParts: string[] = [
    `Latest ${memorySummary.latestRaw ?? "unknown"} (${MEMORY_PROGRESS_MAX_MB} MB reference cap)`,
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
        "relative min-h-0 flex-1 overflow-hidden rounded-2xl",
        "bg-slate-100 text-foreground dark:bg-slate-950",
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

      <div className="relative grid min-h-[min(520px,calc(100dvh-5rem))] grid-cols-4 grid-rows-2 gap-4 p-6 max-md:grid-cols-1 max-md:grid-rows-none max-md:auto-rows-fr">
        <Card
          className={cn(
            glassCard,
            bentoCard,
            "col-span-2 row-span-2 flex flex-col max-md:min-h-[220px]",
          )}
          variant="transparent"
        >
          <Card.Content className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
            {latest ? (
              <>
                <Chip
                  className="scale-125"
                  color={chipColorForStatus(latest.status)}
                  size="lg"
                  variant="primary"
                >
                  <Chip.Label className="text-base font-semibold tracking-wide uppercase">
                    {latest.status}
                  </Chip.Label>
                </Chip>
                <p className="mt-auto w-full truncate text-center font-mono text-xs text-foreground/65">
                  {latest._id}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">No snapshots</p>
            )}
          </Card.Content>
        </Card>

        <Card className={cn(glassCard, bentoCard, "col-span-1 row-span-1")} variant="transparent">
          <Card.Header className="pb-1">
            <Card.Title className="text-sm font-semibold text-foreground">Memory</Card.Title>
          </Card.Header>
          <Card.Content className="flex flex-col gap-3 pt-0">
            {memorySummary.totalCount === 0 ? (
              <p className="text-xs text-muted">—</p>
            ) : (
              <>
                <p className="text-xs leading-snug text-foreground/70">
                  {memorySummary.totalCount} reading{memorySummary.totalCount === 1 ? "" : "s"}
                  {memorySummary.parsedCount !== memorySummary.totalCount
                    ? ` · ${memorySummary.parsedCount} with MB values`
                    : ""}
                </p>
                <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs tabular-nums">
                  <dt className="text-foreground/70">Latest</dt>
                  <dd className="text-right font-medium text-foreground">
                    {memorySummary.latestMb !== null
                      ? formatMegabytes(memorySummary.latestMb)
                      : (memorySummary.latestRaw ?? "—")}
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
                  aria-label={memoryAriaParts.join(". ")}
                  className="w-full"
                  color="success"
                  maxValue={MEMORY_PROGRESS_MAX_MB}
                  minValue={0}
                  value={memoryValue}
                  formatOptions={{style: "percent", maximumFractionDigits: 0}}
                >
                  <ProgressBar.Output className="text-xs text-foreground/75" />
                  <ProgressBar.Track>
                    <ProgressBar.Fill
                      className="relative overflow-hidden after:absolute after:inset-0 after:bg-[repeating-linear-gradient(135deg,transparent,transparent_5px,rgba(255,255,255,0.14)_5px,rgba(255,255,255,0.14)_10px)] dark:after:bg-[repeating-linear-gradient(135deg,transparent,transparent_5px,rgba(255,255,255,0.1)_5px,rgba(255,255,255,0.1)_10px)]"
                    />
                  </ProgressBar.Track>
                </ProgressBar>
              </>
            )}
          </Card.Content>
        </Card>

        <Card className={cn(glassCard, bentoCard, "col-span-1 row-span-1")} variant="transparent">
          <Card.Header className="pb-1">
            <Card.Title className="text-sm font-semibold text-foreground">Uptime</Card.Title>
          </Card.Header>
          <Card.Content className="flex flex-1 flex-col justify-center gap-2 pt-0">
            {latest ? (
              <div className="flex items-center gap-2">
                <Clock aria-hidden className="size-5 shrink-0 text-foreground/80" strokeWidth={1.75} />
                <span className="text-lg font-medium tabular-nums tracking-tight">{latest.uptime}</span>
              </div>
            ) : (
              <p className="text-xs text-muted">—</p>
            )}
          </Card.Content>
        </Card>

        <Card
          className={cn(
            glassCard,
            bentoCard,
            "col-span-2 col-start-3 row-span-1 row-start-2 max-md:col-start-auto max-md:row-start-auto",
          )}
          variant="transparent"
        >
          <Card.Header className="pb-1">
            <Card.Title className="text-sm font-semibold text-foreground">Last update</Card.Title>
          </Card.Header>
          <Card.Content className="pt-0">
            {latest ? (
              <p className="text-lg font-medium tracking-tight">{formatTimestamp(latest.timestamp)}</p>
            ) : (
              <p className="text-xs text-muted">—</p>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
