import {ThemeSwitch} from "@/components/theme-switch";
import {Card, Link, buttonVariants, cn} from "@heroui/react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="text-sm font-medium text-muted">Dynamic One · System health</span>
        <ThemeSwitch />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
        <Card className="w-full max-w-lg" variant="default">
          <Card.Header>
            <Card.Title className="text-2xl">System health dashboard</Card.Title>
            <Card.Description>
              This app uses HeroUI v3 on Next.js with Tailwind CSS v4. Toggle dark mode in the
              header to see theme tokens update across surfaces and text.
            </Card.Description>
          </Card.Header>
          <Card.Content className="flex flex-col gap-4">
            <div className="flex justify-center rounded-lg bg-surface-secondary p-6">
              <Image
                className="dark:invert"
                src="/next.svg"
                alt="Next.js logo"
                width={120}
                height={24}
                priority
              />
            </div>
            <p className="text-sm text-muted">
              Use the links below for Next.js docs and deployment, or continue building your health
              views with HeroUI components.
            </p>
          </Card.Content>
          <Card.Footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              className={cn(
                buttonVariants({size: "md", variant: "primary"}),
                "no-underline decoration-transparent",
              )}
              href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              rel="noopener noreferrer"
              target="_blank"
            >
              Deploy Now
              <Link.Icon aria-hidden />
            </Link>
            <Link
              className={cn(
                buttonVariants({size: "md", variant: "secondary"}),
                "no-underline decoration-transparent",
              )}
              href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              rel="noopener noreferrer"
              target="_blank"
            >
              Documentation
              <Link.Icon aria-hidden />
            </Link>
          </Card.Footer>
        </Card>
      </main>
    </div>
  );
}
