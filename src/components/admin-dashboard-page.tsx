"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BarChart3,
  CalendarClock,
  Crown,
  DollarSign,
  LineChart,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Users,
  Zap
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import {
  getAdminDashboardSnapshot,
  isGymOwner,
  subscribeToAdminDashboard,
  supabaseEnabled,
  type AdminDashboardSnapshot
} from "@/lib/supabase";
import { formatLongDate, formatNaira, formatShortDate } from "@/lib/utils";

function getBarWidth(value: number, max: number) {
  if (max <= 0) {
    return "0%";
  }

  return `${Math.max(12, Math.round((value / max) * 100))}%`;
}

export function AdminDashboardPage() {
  const { member, loading } = useAuth();
  const [snapshot, setSnapshot] = useState<AdminDashboardSnapshot | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!member || !isGymOwner(member)) {
      setSnapshot(null);
      return;
    }

    let active = true;

    const loadAdminDashboard = async () => {
      setLoadingData(true);

      try {
        const nextSnapshot = await getAdminDashboardSnapshot(member);
        if (!active) {
          return;
        }

        setSnapshot(nextSnapshot);
        setError("");
      } catch (dashboardError) {
        if (!active) {
          return;
        }

        setError(dashboardError instanceof Error ? dashboardError.message : "Unable to load owner analytics right now.");
      } finally {
        if (active) {
          setLoadingData(false);
        }
      }
    };

    void loadAdminDashboard();

    const unsubscribe = subscribeToAdminDashboard(() => {
      void loadAdminDashboard();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [member]);

  if (loading) {
    return <main className="route-shell centered-copy">Loading owner access...</main>;
  }

  if (!member) {
    return (
      <main className="route-shell centered-copy">
        <span className="eyebrow">Admin Dashboard</span>
        <h1>Sign in with your gym owner account to open the admin console.</h1>
        <p>Owner analytics are protected behind Supabase Auth, so the route only opens after login.</p>
        <div className="stack-row">
          <Link href="/login" className="button button-primary">
            Sign in
          </Link>
          <Link href="/" className="button button-secondary">
            Back home
          </Link>
        </div>
      </main>
    );
  }

  if (!isGymOwner(member)) {
    return (
      <main className="route-shell centered-copy">
        <span className="eyebrow">Admin Dashboard</span>
        <h1>This account is not allowed into the owner console.</h1>
        <p>Give the account a Supabase Auth app metadata role of `gym_owner`, then sign in again to unlock admin analytics.</p>
        <div className="stack-row">
          <Link href="/dashboard" className="button button-primary">
            Back to member dashboard
          </Link>
          <Link href="/" className="button button-secondary">
            Back home
          </Link>
        </div>
      </main>
    );
  }

  if (!snapshot) {
    return <main className="route-shell centered-copy">Loading owner insights...</main>;
  }

  const classMax = Math.max(...snapshot.classPopularity.map((item) => item.bookingsCount), 1);
  const attendanceMax = Math.max(
    ...snapshot.attendanceTrends.map((item) => Math.max(item.bookedCount, item.attendedCount)),
    1
  );
  const engagementMax = Math.max(
    ...snapshot.engagement.trend.map((item) => Math.max(item.loginCount, item.bookingCount, item.challengeCheckIns)),
    1
  );

  return (
    <main className="route-shell admin-layout">
      <section className="admin-hero">
        <div>
          <span className="eyebrow">Owner Console</span>
          <h1>The operating view for class demand, member momentum, renewals, and revenue.</h1>
          <p className="section-copy">
            Welcome back, {member.fullName.split(" ")[0]}. This dashboard pulls booking, login, challenge, and member
            renewal data from Supabase Postgres and stays fresh through realtime subscriptions.
          </p>
          <div className="dashboard-status-row">
            <span className={`status-pill ${supabaseEnabled ? "live" : "disabled"}`}>
              {supabaseEnabled ? (loadingData ? "syncing owner analytics" : "realtime from supabase") : "demo fallback"}
            </span>
            <span className="status-pill live">
              <Crown size={14} />
              gym owner
            </span>
          </div>
        </div>

        <div className="dashboard-actions">
          <Link href="/dashboard" className="button button-secondary">
            Member dashboard
          </Link>
          <Link href="/book" className="button button-secondary">
            Booking studio
          </Link>
          <Link href="/community" className="button button-primary">
            Community hub
          </Link>
        </div>
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      <section className="admin-summary-grid">
        <article className="dashboard-panel admin-summary-card">
          <Users size={20} />
          <strong>{snapshot.summary.totalMembers}</strong>
          <span>Total tracked members</span>
        </article>
        <article className="dashboard-panel admin-summary-card">
          <Sparkles size={20} />
          <strong>{snapshot.summary.activeMembers}</strong>
          <span>Members in good standing</span>
        </article>
        <article className="dashboard-panel admin-summary-card">
          <UserRound size={20} />
          <strong>{snapshot.summary.uniqueLogins7d}</strong>
          <span>Unique member logins in 7 days</span>
        </article>
        <article className="dashboard-panel admin-summary-card">
          <BarChart3 size={20} />
          <strong>{snapshot.summary.bookings30d}</strong>
          <span>Bookings created in 30 days</span>
        </article>
        <article className="dashboard-panel admin-summary-card">
          <DollarSign size={20} />
          <strong>{formatNaira(snapshot.summary.collectedRevenue30d)}</strong>
          <span>Collected revenue in 30 days</span>
        </article>
        <article className="dashboard-panel admin-summary-card">
          <CalendarClock size={20} />
          <strong>{snapshot.summary.renewalsDue7d}</strong>
          <span>Renewals due in 7 days</span>
        </article>
      </section>

      <section className="admin-analytics-grid">
        <article className="dashboard-panel admin-panel">
          <div className="panel-heading">
            <div>
              <h2>Class popularity</h2>
              <p className="muted">Rolling 30-day demand by program, attendance rate, and paid revenue.</p>
            </div>
            <span className="status-pill live">top classes</span>
          </div>

          <div className="admin-list">
            {snapshot.classPopularity.length ? (
              snapshot.classPopularity.map((item) => (
                <div key={item.programId} className="admin-row">
                  <div className="admin-row-copy">
                    <strong>{item.programName}</strong>
                    <span>
                      {item.bookingsCount} bookings · {item.attendanceRate}% attendance · {formatNaira(item.revenue)}
                    </span>
                  </div>
                  <div className="admin-row-visual">
                    <div className="admin-mini-bar">
                      <span style={{ width: getBarWidth(item.bookingsCount, classMax) }} />
                    </div>
                    <small>{item.lastBookedAt ? `Last booking ${formatShortDate(item.lastBookedAt)}` : "No recent bookings"}</small>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">Class demand will appear here once bookings start landing in Supabase.</p>
            )}
          </div>
        </article>

        <article className="dashboard-panel admin-panel">
          <div className="panel-heading">
            <div>
              <h2>Attendance trend</h2>
              <p className="muted">Booked versus attended sessions across the last 10 days.</p>
            </div>
            <span className="status-pill">
              <LineChart size={14} />
              daily view
            </span>
          </div>

          <div className="admin-trend-list">
            {snapshot.attendanceTrends.map((point) => (
              <div key={point.date} className="admin-trend-row">
                <div className="admin-trend-label">
                  <strong>{point.label}</strong>
                  <span>
                    {point.attendedCount}/{point.bookedCount} attended
                  </span>
                </div>
                <div className="admin-trend-bars">
                  <span className="admin-trend-booked" style={{ width: getBarWidth(point.bookedCount, attendanceMax) }} />
                  <span className="admin-trend-attended" style={{ width: getBarWidth(point.attendedCount, attendanceMax) }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="admin-analytics-grid">
        <article className="dashboard-panel admin-panel">
          <div className="panel-heading">
            <div>
              <h2>Member engagement</h2>
              <p className="muted">Logins, booking activity, and challenge participation flowing into one owner view.</p>
            </div>
            <span className="status-pill live">
              <Zap size={14} />
              engagement
            </span>
          </div>

          <div className="admin-kpi-grid">
            <div className="insight-card">
              <UserRound size={18} />
              <strong>{snapshot.engagement.totalLoginEvents7d}</strong>
              <p>Login events in the last 7 days.</p>
            </div>
            <div className="insight-card">
              <Target size={18} />
              <strong>{snapshot.engagement.bookingMembers30d}</strong>
              <p>Members who booked in the last 30 days.</p>
            </div>
            <div className="insight-card">
              <TrendingUp size={18} />
              <strong>{snapshot.engagement.challengeParticipants}</strong>
              <p>Members active in challenge boards.</p>
            </div>
          </div>

          <div className="admin-trend-list">
            {snapshot.engagement.trend.map((point) => (
              <div key={point.date} className="admin-trend-row">
                <div className="admin-trend-label">
                  <strong>{point.label}</strong>
                  <span>
                    {point.loginCount} logins · {point.bookingCount} bookings · {point.challengeCheckIns} challenge updates
                  </span>
                </div>
                <div className="admin-trend-bars admin-trend-bars-triple">
                  <span className="admin-trend-login" style={{ width: getBarWidth(point.loginCount, engagementMax) }} />
                  <span className="admin-trend-booking" style={{ width: getBarWidth(point.bookingCount, engagementMax) }} />
                  <span
                    className="admin-trend-challenge"
                    style={{ width: getBarWidth(point.challengeCheckIns, engagementMax) }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="admin-list compact">
            {snapshot.engagement.topChallenges.map((challenge) => (
              <div key={challenge.challengeId} className="admin-row">
                <div className="admin-row-copy">
                  <strong>{challenge.title}</strong>
                  <span>
                    {challenge.participants} members · {challenge.completions} completions
                  </span>
                </div>
                <div className="admin-row-visual">
                  <div className="admin-mini-bar">
                    <span style={{ width: getBarWidth(challenge.completionRate, 100) }} />
                  </div>
                  <small>{challenge.completionRate}% completion rate</small>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-panel admin-panel">
          <div className="panel-heading">
            <div>
              <h2>Revenue pulse</h2>
              <p className="muted">Collected versus pending value from recent bookings.</p>
            </div>
            <span className="status-pill live">
              <DollarSign size={14} />
              30-day window
            </span>
          </div>

          <div className="admin-kpi-grid">
            <div className="insight-card">
              <DollarSign size={18} />
              <strong>{formatNaira(snapshot.revenue.collected30d)}</strong>
              <p>Paid revenue collected.</p>
            </div>
            <div className="insight-card">
              <ShieldAlert size={18} />
              <strong>{formatNaira(snapshot.revenue.pending30d)}</strong>
              <p>Pending or unpaid revenue.</p>
            </div>
            <div className="insight-card">
              <BarChart3 size={18} />
              <strong>{formatNaira(snapshot.revenue.averagePaidBookingValue)}</strong>
              <p>Average paid booking value.</p>
            </div>
          </div>

          <div className="admin-list">
            {snapshot.revenue.topPrograms.length ? (
              snapshot.revenue.topPrograms.map((program) => (
                <div key={program.programId} className="admin-row">
                  <div className="admin-row-copy">
                    <strong>{program.programName}</strong>
                    <span>
                      {program.paidBookings} paid bookings · {formatNaira(program.revenue)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">Revenue insights will populate once paid bookings start coming through.</p>
            )}
          </div>
        </article>
      </section>

      <section className="dashboard-panel admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Membership renewal watch</h2>
            <p className="muted">Spot upcoming renewals before they slip and keep overdue members visible.</p>
          </div>
          <span className="status-pill">{snapshot.renewals.pastDue} overdue</span>
        </div>

        <div className="admin-kpi-grid">
          <div className="insight-card">
            <Sparkles size={18} />
            <strong>{snapshot.renewals.active}</strong>
            <p>Members currently marked active.</p>
          </div>
          <div className="insight-card">
            <CalendarClock size={18} />
            <strong>{snapshot.renewals.renewingSoon}</strong>
            <p>Members flagged as renewing soon.</p>
          </div>
          <div className="insight-card">
            <ShieldAlert size={18} />
            <strong>{snapshot.renewals.pastDue}</strong>
            <p>Members already past due.</p>
          </div>
        </div>

        <div className="admin-renewal-grid">
          <div className="admin-member-list">
            <div className="panel-heading">
              <h2>Due this week</h2>
              <span className="status-pill live">{snapshot.renewals.dueThisWeek.length}</span>
            </div>

            {snapshot.renewals.dueThisWeek.length ? (
              snapshot.renewals.dueThisWeek.map((memberProfile) => (
                <div key={memberProfile.uid} className="admin-member-card">
                  <strong>{memberProfile.fullName}</strong>
                  <span>
                    {memberProfile.plan} · renews {formatShortDate(memberProfile.renewalDate)}
                  </span>
                </div>
              ))
            ) : (
              <p className="muted">No renewals due in the next 7 days.</p>
            )}
          </div>

          <div className="admin-member-list">
            <div className="panel-heading">
              <h2>Past due</h2>
              <span className="status-pill cancelled">{snapshot.renewals.overdueMembers.length}</span>
            </div>

            {snapshot.renewals.overdueMembers.length ? (
              snapshot.renewals.overdueMembers.map((memberProfile) => (
                <div key={memberProfile.uid} className="admin-member-card">
                  <strong>{memberProfile.fullName}</strong>
                  <span>
                    {memberProfile.plan} · overdue since {formatShortDate(memberProfile.renewalDate)}
                  </span>
                </div>
              ))
            ) : (
              <p className="muted">No overdue renewals right now.</p>
            )}
          </div>
        </div>

        <p className="muted">
          Latest review completed {formatLongDate(new Date().toISOString())}. As bookings, logins, and challenge rows
          change in Supabase, this page refreshes automatically.
        </p>
      </section>
    </main>
  );
}
