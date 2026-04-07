import { SystemHealthDashboard } from '@/components/system-health-dashboard';
import { ThemeSwitch } from '@/components/theme-switch';
import { getSystemHealthSeriesForHome } from '@/lib/system-health-db';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = await getSystemHealthSeriesForHome();

  return (
    <div className="flex min-h-dvh flex-col text-foreground">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-sm font-semibold text-foreground/80">
          Dynamic One · System health
        </span>
        <ThemeSwitch />
      </header>

      <main className="flex flex-1 flex-col px-6 pb-6">
        <SystemHealthDashboard data={data} />
      </main>
    </div>
  );
}
