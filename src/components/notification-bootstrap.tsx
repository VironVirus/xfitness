"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { syncNotificationIdentity } from "@/lib/notifications";

export function NotificationBootstrap() {
  const { member } = useAuth();

  useEffect(() => {
    void syncNotificationIdentity(member);
  }, [member]);

  return null;
}
