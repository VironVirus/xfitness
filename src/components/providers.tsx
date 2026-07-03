"use client";

import { AppShell } from "@/components/app-shell";
import { NotificationBootstrap } from "@/components/notification-bootstrap";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationBootstrap />
        <AppShell>{children}</AppShell>
      </AuthProvider>
    </ThemeProvider>
  );
}
