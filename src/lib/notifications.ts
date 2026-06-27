"use client";

import type { MemberProfile } from "@/types/app";

const oneSignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

export const oneSignalEnabled = Boolean(oneSignalAppId);

type BrowserPermissionState = "default" | "granted" | "denied" | "unsupported";

type OneSignalApi = {
  init: (config: Record<string, unknown>) => Promise<void>;
  login?: (externalId: string) => Promise<void> | void;
  logout?: () => Promise<void> | void;
  Notifications?: {
    permission?: boolean | string;
    requestPermission?: () => Promise<void> | void;
  };
  User?: {
    addEmail?: (email: string) => Promise<void> | void;
    addTags?: (tags: Record<string, string>) => Promise<void> | void;
    PushSubscription?: {
      optedIn?: boolean;
      optIn?: () => Promise<void> | void;
      optOut?: () => Promise<void> | void;
    };
  };
};

declare global {
  interface Window {
    OneSignal?: OneSignalApi;
    OneSignalDeferred?: Array<(oneSignal: OneSignalApi) => void | Promise<void>>;
  }
}

export type NotificationClientState = {
  configured: boolean;
  initialized: boolean;
  permission: BrowserPermissionState;
  pushSubscribed: boolean;
};

let oneSignalInitialized = false;
let initPromise: Promise<boolean> | null = null;

function parsePermission(permission: OneSignalApi["Notifications"] extends { permission?: infer T } ? T : unknown) {
  if (permission === true || permission === "granted") {
    return "granted" satisfies BrowserPermissionState;
  }

  if (permission === false || permission === "denied") {
    return "denied" satisfies BrowserPermissionState;
  }

  if (permission === "default") {
    return "default" satisfies BrowserPermissionState;
  }

  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}

function getOneSignalFromWindow() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.OneSignal ?? null;
}

async function runOneSignalInit(oneSignal: OneSignalApi) {
  await oneSignal.init({
    appId: oneSignalAppId,
    allowLocalhostAsSecureOrigin: true,
    serviceWorkerPath: "/OneSignalSDKWorker.js",
    serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
    serviceWorkerParam: {
      scope: "/"
    }
  });

  oneSignalInitialized = true;
  return true;
}

export async function initNotificationClient() {
  if (!oneSignalEnabled || !oneSignalAppId) {
    return false;
  }

  if (oneSignalInitialized) {
    return true;
  }

  if (initPromise) {
    return initPromise;
  }

  if (typeof window === "undefined") {
    return false;
  }

  const existingOneSignal = getOneSignalFromWindow();
  if (existingOneSignal) {
    initPromise = runOneSignalInit(existingOneSignal).catch(() => false).then((result) => {
      if (!result) {
        initPromise = null;
      }

      return result;
    });
    return initPromise;
  }

  window.OneSignalDeferred = window.OneSignalDeferred ?? [];
  initPromise = new Promise<boolean>((resolve) => {
    window.OneSignalDeferred?.push(async (oneSignal) => {
      try {
        resolve(await runOneSignalInit(oneSignal));
      } catch {
        initPromise = null;
        resolve(false);
      }
    });

    window.setTimeout(() => {
      if (!oneSignalInitialized) {
        initPromise = null;
        resolve(false);
      }
    }, 12000);
  });

  return initPromise;
}

export async function getNotificationClientState(): Promise<NotificationClientState> {
  if (!oneSignalEnabled) {
    return {
      configured: false,
      initialized: false,
      permission: "unsupported",
      pushSubscribed: false
    };
  }

  await initNotificationClient();
  const oneSignal = getOneSignalFromWindow();

  return {
    configured: true,
    initialized: oneSignalInitialized,
    permission: parsePermission(oneSignal?.Notifications?.permission),
    pushSubscribed: Boolean(oneSignal?.User?.PushSubscription?.optedIn)
  };
}

export async function syncNotificationIdentity(member: MemberProfile | null) {
  if (!oneSignalEnabled) {
    return getNotificationClientState();
  }

  const initialized = await initNotificationClient();
  if (!initialized) {
    return getNotificationClientState();
  }

  const oneSignal = getOneSignalFromWindow();
  if (!oneSignal) {
    return getNotificationClientState();
  }

  if (!member) {
    await oneSignal.logout?.();
    return getNotificationClientState();
  }

  await oneSignal.login?.(member.uid);

  try {
    await oneSignal.User?.addEmail?.(member.email);
  } catch {
    // Email sync is optional for push notifications.
  }

  try {
    await oneSignal.User?.addTags?.({
      plan: member.plan,
      club: member.homeClub,
      notifications_enabled: member.notificationPreferences.enabled ? "true" : "false"
    });
  } catch {
    // Tags are optional metadata for segmentation.
  }

  if (member.notificationPreferences.enabled && member.notificationPreferences.pushSubscribed) {
    await oneSignal.User?.PushSubscription?.optIn?.();
  } else {
    await oneSignal.User?.PushSubscription?.optOut?.();
  }

  return getNotificationClientState();
}

export async function requestPushOptIn(member: MemberProfile) {
  const initialized = await initNotificationClient();
  if (!initialized) {
    return getNotificationClientState();
  }

  const oneSignal = getOneSignalFromWindow();
  if (!oneSignal) {
    return getNotificationClientState();
  }

  await oneSignal.login?.(member.uid);
  await oneSignal.Notifications?.requestPermission?.();
  await oneSignal.User?.PushSubscription?.optIn?.();

  return getNotificationClientState();
}

export async function requestPushOptOut() {
  const initialized = await initNotificationClient();
  if (!initialized) {
    return getNotificationClientState();
  }

  const oneSignal = getOneSignalFromWindow();
  await oneSignal?.User?.PushSubscription?.optOut?.();
  return getNotificationClientState();
}
