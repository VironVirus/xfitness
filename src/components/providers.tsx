"use client";

import { NotificationBootstrap } from "@/components/notification-bootstrap";
import { AuthProvider } from "@/context/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificationBootstrap />
      {children}
    </AuthProvider>
  );
}
