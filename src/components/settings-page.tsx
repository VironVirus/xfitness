"use client";

import Link from "next/link";
import { Bell, CalendarDays, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { LazySection } from "@/components/lazy-section";
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
  const [pushState, setPushState] = useState({
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
    return <main className="page page-width centered-state">Loading settings...</main>;
  }

  if (!member) {
    return (
      <main className="page page-width centered-state">
        <span className="eyebrow">Settings</span>
        <h1 className="page-title">Create an account to manage notifications.</h1>
        <div className="action-row">
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
      setMessage("Settings saved.");
    } catch (settingsError) {
      setError(settingsError instanceof Error ? settingsError.message : "Unable to save settings.");
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
      setMessage("Push enabled.");
    } catch (settingsError) {
      setError(settingsError instanceof Error ? settingsError.message : "Unable to enable push.");
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
      setMessage("Push disabled.");
    } catch (settingsError) {
      setError(settingsError instanceof Error ? settingsError.message : "Unable to disable push.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page page-width page-stack">
      <LazySection className="surface hero-surface page-stack" delay={80}>
        <div className="hero-grid compact-hero-grid">
          <div className="card-stack">
            <span className="eyebrow">Settings</span>
            <h1 className="page-title">Notifications</h1>
            <p className="page-copy">Choose which reminders and nudges you want to receive.</p>
            <div className="chip-row">
              <span className={`chip ${preferences.enabled ? "chip-positive" : "chip-soft"}`}>
                {preferences.enabled ? "Notifications on" : "Notifications off"}
              </span>
              <span className={`chip ${pushState.pushSubscribed ? "chip-positive" : "chip-soft"}`}>
                {pushState.pushSubscribed ? "Push enabled" : "Push off"}
              </span>
            </div>
          </div>

          <div className="action-row">
            <Link href="/dashboard" className="button button-secondary">
              Dashboard
            </Link>
            <button type="button" className="button button-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {message ? <p className="message message-success">{message}</p> : null}
        {error ? <p className="message message-error">{error}</p> : null}
      </LazySection>

      <LazySection className="surface-grid surface-grid-2" delay={120}>
        <section className="surface card-stack">
          <div className="section-heading">
            <span className="eyebrow">Preferences</span>
            <h2 className="section-title">What should the app send?</h2>
          </div>

          <div className="list-stack">
            <label className="toggle-card">
              <div>
                <strong>Enable notifications</strong>
                <p className="muted-text">Master switch for all reminder messages.</p>
              </div>
              <input type="checkbox" checked={preferences.enabled} onChange={(event) => updatePreference("enabled", event.target.checked)} />
            </label>

            <label className="toggle-card">
              <div>
                <strong>Class reminders</strong>
                <p className="muted-text">Reminders for booked sessions.</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.classReminders}
                onChange={(event) => updatePreference("classReminders", event.target.checked)}
                disabled={!preferences.enabled}
              />
            </label>

            <label className="toggle-card">
              <div>
                <strong>Goal nudges</strong>
                <p className="muted-text">Encouragement around progress and streaks.</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.goalNudges}
                onChange={(event) => updatePreference("goalNudges", event.target.checked)}
                disabled={!preferences.enabled}
              />
            </label>

            <label className="toggle-card">
              <div>
                <strong>Membership alerts</strong>
                <p className="muted-text">Renewal and expiring plan notices.</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.membershipAlerts}
                onChange={(event) => updatePreference("membershipAlerts", event.target.checked)}
                disabled={!preferences.enabled}
              />
            </label>

            <label className="toggle-card">
              <div>
                <strong>Special events</strong>
                <p className="muted-text">Gym events and announcements.</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.specialEvents}
                onChange={(event) => updatePreference("specialEvents", event.target.checked)}
                disabled={!preferences.enabled}
              />
            </label>
          </div>
        </section>

        <section className="surface card-stack">
          <div className="section-heading">
            <span className="eyebrow">Push delivery</span>
            <h2 className="section-title">Browser permission</h2>
          </div>

          <div className="surface-grid surface-grid-3">
            <article className="metric-card">
              <Bell size={18} />
              <strong className="metric-value">{oneSignalEnabled ? "Ready" : "Not ready"}</strong>
              <span className="metric-label">Push service</span>
            </article>
            <article className="metric-card">
              <ShieldCheck size={18} />
              <strong className="metric-value">{pushState.permission}</strong>
              <span className="metric-label">Permission</span>
            </article>
            <article className="metric-card">
              <CalendarDays size={18} />
              <strong className="metric-value">{preferences.pushSubscribed ? "On" : "Off"}</strong>
              <span className="metric-label">Push state</span>
            </article>
          </div>

          <div className="action-row">
            <button type="button" className="button button-primary compact-button" onClick={handlePushOptIn} disabled={saving || !oneSignalEnabled}>
              Enable push
            </button>
            <button type="button" className="button button-secondary compact-button" onClick={handlePushOptOut} disabled={saving || !oneSignalEnabled}>
              Disable push
            </button>
          </div>

          <p className="muted-text">
            {oneSignalEnabled
              ? "Push connects to this signed-in browser."
              : "Push is not ready on this browser yet."}
          </p>
        </section>
      </LazySection>
    </main>
  );
}
