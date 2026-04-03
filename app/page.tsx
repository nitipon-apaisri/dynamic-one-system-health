import {SystemHealthDashboard} from "@/components/system-health-dashboard";
import {ThemeSwitch} from "@/components/theme-switch";
import {SAMPLE_SYSTEM_HEALTH_SERIES} from "@/lib/system-health";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-sm font-semibold text-foreground/80">Dynamic One · System health</span>
        <ThemeSwitch />
      </header>

      <main className="flex flex-1 flex-col px-6 pb-6">
        <SystemHealthDashboard data={SAMPLE_SYSTEM_HEALTH_SERIES} />
      </main>
    </div>
  );
}
