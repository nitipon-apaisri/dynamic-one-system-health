'use client';

import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute={['class', 'data-theme']}
      defaultTheme="light"
      themes={['light', 'dark']}
    >
      {children}
    </ThemeProvider>
  );
}
