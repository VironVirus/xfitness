"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, CalendarDays, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import {
  getNotificationClientState,
  oneSignalEnabled,
  requestPushOptIn,
  requestPushOptOut
} from "@/lib/notifications";
import type { NotificationPreferences } from "@/types/app";

function createDefaultPreferences(): NotificationPreferences {
  return {
    enabled: false,
    classReminders: true,
    goalNudges: true,
    membershipAlerts: true,
    specialEvents: true,
    pushSubscribed: false
  };
}

export function SettingsPage() {
  const { member, loading, refreshMember } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(createDefaultPreferences());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pushState, setPushState] = useState<{
    configured: boolean;
    initialized: boolean;
    permission: string;
    pushSubscribed: boolean;
  }>({
    configured: oneSignalEnabled,
    initialized: false,
    permission: "default",
    pushSubscribed: false
  });

  useEffect(() => {
    if (!member) {
      setPreferences(createDefaultPreferences());
      return;
    }

    setPreferences(member.notificationPreferences);
  }, [member]);

  useEffect(() => {
    void getNotificationClientState().then(setPushState);
  }, []);

  if (loading) {
    return <main className="route-shell centered-copy">Loading your notification settings...</main>;
  }

  if (!member) {
    return (
      <main className="route-shell centered-copy">
        <span className="eyebrow">Settings</span>
        <h1>Create your member account to manage notifications.</h1>
        <p>Notification controls are available once a user is signed in.</p>
        <div className="stack-row">
          <Link href="/signup" className="button button-primary">
            Create account
          </Link>
          <Link href="/" className="button button-secondary">
            Back home
          </Link>
        </div>
      </main>
    );
  }

  const activeMember = member;

  function updatePreference<K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) {
    setPreferences((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await refreshMember({
        ...activeMember,
        notificationPreferences: preferences
      });
      setMessage("Notification settings saved to your profile.");
    } catch (settingsError) {
      setError(settingsError instanceof Error ? settingsError.message : "Unable to save notification settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePushOptIn() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const nextState = await requestPushOptIn(activeMember);
      const nextPreferences = {
        ...preferences,
        enabled: nextState.pushSubscribed ? true : preferences.enabled,
        pushSubscribed: nextState.pushSubscribed
      };

      setPushState(nextState);
      setPreferences(nextPreferences);
      await refreshMember({
        ...activeMember,
        notificationPreferences: nextPreferences
      });
      setMessage("Push notifications are now enabled for this browser.");
    } catch (settingsError) {
      setError(settingsError instanceof Error ? settingsError.message : "Unable to enable push notifications.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePushOptOut() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const nextState = await requestPushOptOut();
      const nextPreferences = {
        ...preferences,
        pushSubscribed: false
      };

      setPushState(nextState);
      setPreferences(nextPreferences);
      await refreshMember({
        ...activeMember,
        notificationPreferences: nextPreferences
      });
      setMessage("Push notifications have been turned off for this browser.");
    } catch (settingsError) {
      setError(settingsError instanceof Error ? settingsError.message : "Unable to disable push notifications.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="route-shell settings-shell">
      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">Settings</span>
          <h1>Control reminders, nudges, and member alerts.</h1>
          <p>
            Notification preferences live in Supabase and are used by your Edge Function pipeline to send class reminders,
            goal nudges, membership alerts, and special event broadcasts.
          </p>
        </div>

        <div className="dashboard-actions">
          <Link href="/dashboard" className="button button-secondary">
            Back to dashboard
          </Link>
          <button type="button" className="button button-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </section>

      {message ? <p className="form-message">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <section className="dashboard-content-grid settings-grid">
        <article className="dashboard-panel settings-panel">
          <div className="panel-heading">
            <h2>Notification preferences</h2>
            <span className={`status-pill ${preferences.enabled ? "live" : "disabled"}`}>
              {preferences.enabled ? "notifications active" : "notifications paused"}
            </span>
          </div>

          <div className="settings-toggle-list">
            <label className="settings-toggle">
              <div>
                <strong>Enable notifications</strong>
                <span>Master switch for all reminder and motivation messages.</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.enabled}
                onChange={(event) => updatePreference("enabled", event.target.checked)}
              />
            </label>

            <label className="settings-toggle">
              <div>
                <strong>Upcoming class reminders</strong>
                <span>Send reminders before booked classes begin.</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.classReminders}
                onChange={(event) => updatePreference("classReminders", event.target.checked)}
                disabled={!preferences.enabled}
              />
            </label>

            <label className="settings-toggle">
              <div>
                <strong>Goal nudges</strong>
                <span>Send motivational nudges when weekly workout or calorie goals are close.</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.goalNudges}
                onChange={(event) => updatePreference("goalNudges", event.target.checked)}
                disabled={!preferences.enabled}
              />
            </label>

            <label className="settings-toggle">
              <div>
                <strong>Membership alerts</strong>
                <span>Get renewal reminders and expiring membership alerts.</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.membershipAlerts}
                onChange={(event) => updatePreference("membershipAlerts", event.target.checked)}
                disabled={!preferences.enabled}
              />
            </label>

            <label className="settings-toggle">
              <div>
                <strong>Special events</strong>
                <span>Hear about gym events, studio launches, and seasonal member activations.</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.specialEvents}
                onChange={(event) => updatePreference("specialEvents", event.target.checked)}
                disabled={!preferences.enabled}
              />
            </label>
          </div>
        </article>

        <article className="dashboard-panel settings-panel">
          <div className="panel-heading">
            <h2>Push delivery</h2>
            <span className={`status-pill ${pushState.pushSubscribed ? "live" : "disabled"}`}>
              {pushState.pushSubscribed ? "push enabled" : "push off"}
            </span>
          </div>

          <div className="settings-note-grid">
            <article className="insight-card">
              <Bell size={18} />
              <strong>{oneSignalEnabled ? "OneSignal connected" : "OneSignal not configured"}</strong>
              <p>
                {oneSignalEnabled
                  ? "The browser SDK is ready to register this signed-in member for push delivery."
                  : "Add NEXT_PUBLIC_ONESIGNAL_APP_ID before using browser push notifications."}
              </p>
            </article>
            <article className="insight-card">
              <ShieldCheck size={18} />
              <strong>{pushState.permission}</strong>
              <p>Current browser permission status for notifications.</p>
            </article>
            <article className="insight-card">
              <CalendarDays size={18} />
              <strong>{preferences.pushSubscribed ? "Subscribed" : "Not subscribed"}</strong>
              <p>Stored subscription state used by the notification pipeline.</p>
            </article>
          </div>

          <div className="stack-row">
            <button type="button" className="button button-primary" onClick={handlePushOptIn} disabled={saving || !oneSignalEnabled}>
              Enable Push
            </button>
            <button type="button" className="button button-secondary" onClick={handlePushOptOut} disabled={saving || !oneSignalEnabled}>
              Disable Push
            </button>
          </div>
        </article>
      </section>

      <section className="dashboard-summary-grid">
        <article className="dashboard-panel compact-panel">
          <div className="panel-heading">
            <h2>Edge Function flow</h2>
            <Sparkles size={18} />
          </div>
          <p className="muted">
            Supabase Edge Functions read your stored preferences, scan bookings, progress, and renewals, then send only
            the notifications you opted into.
          </p>
        </article>
        <article className="dashboard-panel compact-panel">
          <div className="panel-heading">
            <h2>Membership safe</h2>
            <ShieldCheck size={18} />
          </div>
          <p className="muted">
            Renewal alerts can be turned off, but they stay separated from class nudges and special event messaging.
          </p>
        </article>
        <article className="dashboard-panel compact-panel">
          <div className="panel-heading">
            <h2>Realtime ready</h2>
            <Bell size={18} />
          </div>
          <p className="muted">Once a browser is subscribed, notifications can be targeted to this member without changing your UI flow.</p>
        </article>
      </section>
    </main>
  );
}
