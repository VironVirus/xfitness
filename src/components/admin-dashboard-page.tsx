"use client";

import Link from "next/link";
import { BarChart3, CalendarClock, Crown, DollarSign, ShieldAlert, TrendingUp, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { LazySection } from "@/components/lazy-section";
import { useAuth } from "@/context/auth-context";
import {
  getAdminDashboardSnapshot,
  isGymOwner,
  subscribeToAdminDashboard,
  type AdminDashboardSnapshot
} from "@/lib/supabase";
import { formatNaira, formatShortDate } from "@/lib/utils";

function getBarWidth(value: number, max: number) {
  if (max <= 0) {
    return "0%";
  }

  return `${Math.max(12, Math.round((value / max) * 100))}%`;
}

export function AdminDashboardPage() {
  const { member, loading } = useAuth();
  const [snapshot, setSnapshot] = useState<AdminDashboardSnapshot | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!member || !isGymOwner(member)) {
      setSnapshot(null);
      return;
    }

    let active = true;

    const loadAdminDashboard = async () => {
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

        setError(dashboardError instanceof Error ? dashboardError.message : "Unable to load owner analytics.");
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
    return <main className="page page-width centered-state">Loading admin...</main>;
  }

  if (!member) {
    return (
      <main className="page page-width centered-state">
        <span className="eyebrow">Admin</span>
        <h1 className="page-title">Sign in with a gym owner account.</h1>
        <div className="action-row">
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
      <main className="page page-width centered-state">
        <span className="eyebrow">Admin</span>
        <h1 className="page-title">This account cannot open this page.</h1>
        <p className="muted-text">Use an owner account.</p>
      </main>
    );
  }

  if (!snapshot) {
    return <main className="page page-width centered-state">Loading analytics...</main>;
  }

  const classMax = Math.max(...snapshot.classPopularity.map((item) => item.bookingsCount), 1);
  const attendanceMax = Math.max(
    ...snapshot.attendanceTrends.map((item) => Math.max(item.bookedCount, item.attendedCount)),
    1
  );

  return (
    <main className="page page-width page-stack">
      <LazySection className="surface hero-surface page-stack" delay={80}>
        <div className="hero-grid compact-hero-grid">
          <div className="card-stack">
            <span className="eyebrow">Owner dashboard</span>
            <h1 className="page-title">Operations view</h1>
            <p className="page-copy">A quick view of members, classes, and revenue.</p>
            <div className="chip-row">
              <span className="chip chip-accent">
                <Crown size={14} />
                Gym owner
              </span>
            </div>
          </div>

          <div className="action-row">
            <Link href="/dashboard" className="button button-secondary">
              Member view
            </Link>
            <Link href="/book" className="button button-primary">
              Booking
            </Link>
          </div>
        </div>

        {error ? <p className="message message-error">{error}</p> : null}

        <div className="surface-grid surface-grid-3">
          <article className="metric-card">
            <Users size={18} />
            <strong className="metric-value">{snapshot.summary.totalMembers}</strong>
            <span className="metric-label">Members</span>
          </article>
          <article className="metric-card">
            <DollarSign size={18} />
            <strong className="metric-value">{formatNaira(snapshot.summary.collectedRevenue30d)}</strong>
            <span className="metric-label">30-day revenue</span>
          </article>
          <article className="metric-card">
            <CalendarClock size={18} />
            <strong className="metric-value">{snapshot.summary.renewalsDue7d}</strong>
            <span className="metric-label">Renewals due</span>
          </article>
        </div>
      </LazySection>

      <LazySection className="surface-grid surface-grid-2" delay={120}>
        <section className="surface card-stack">
          <div className="section-heading split-heading">
            <div>
              <span className="eyebrow">Classes</span>
              <h2 className="section-title">Popularity</h2>
            </div>
            <BarChart3 size={18} />
          </div>

          <div className="list-stack">
            {snapshot.classPopularity.length ? (
              snapshot.classPopularity.map((item) => (
                <div key={item.programId} className="analytics-row">
                  <div className="analytics-copy">
                    <strong>{item.programName}</strong>
                    <p className="muted-text">
                      {item.bookingsCount} bookings • {item.attendanceRate}% attendance • {formatNaira(item.revenue)}
                    </p>
                  </div>
                  <div className="analytics-bar">
                    <span style={{ width: getBarWidth(item.bookingsCount, classMax) }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="muted-text">No class data yet.</p>
            )}
          </div>
        </section>

        <section className="surface card-stack">
          <div className="section-heading split-heading">
            <div>
              <span className="eyebrow">Attendance</span>
              <h2 className="section-title">Recent trend</h2>
            </div>
            <TrendingUp size={18} />
          </div>

          <div className="list-stack">
            {snapshot.attendanceTrends.map((point) => (
              <div key={point.date} className="analytics-row">
                <div className="analytics-copy">
                  <strong>{point.label}</strong>
                  <p className="muted-text">
                    {point.attendedCount}/{point.bookedCount} attended
                  </p>
                </div>
                <div className="analytics-bar-group">
                  <span className="analytics-bar-track">
                    <span className="analytics-bar-booked" style={{ width: getBarWidth(point.bookedCount, attendanceMax) }} />
                  </span>
                  <span className="analytics-bar-track">
                    <span className="analytics-bar-attended" style={{ width: getBarWidth(point.attendedCount, attendanceMax) }} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </LazySection>

      <LazySection className="surface-grid surface-grid-3" delay={160}>
        <article className="surface card-stack subtle-surface">
          <div className="section-heading split-heading">
            <h2 className="section-title">Engagement</h2>
            <Zap size={18} />
          </div>
          <div className="list-stack">
            <div className="list-row">
              <strong>Logins</strong>
              <span>{snapshot.engagement.totalLoginEvents7d}</span>
            </div>
            <div className="list-row">
              <strong>Members who booked</strong>
              <span>{snapshot.engagement.bookingMembers30d}</span>
            </div>
            <div className="list-row">
              <strong>Challenge participants</strong>
              <span>{snapshot.engagement.challengeParticipants}</span>
            </div>
          </div>
        </article>

        <article className="surface card-stack subtle-surface">
          <div className="section-heading split-heading">
            <h2 className="section-title">Revenue</h2>
            <DollarSign size={18} />
          </div>
          <div className="list-stack">
            <div className="list-row">
              <strong>Collected</strong>
              <span>{formatNaira(snapshot.revenue.collected30d)}</span>
            </div>
            <div className="list-row">
              <strong>Pending</strong>
              <span>{formatNaira(snapshot.revenue.pending30d)}</span>
            </div>
            <div className="list-row">
              <strong>Paid bookings</strong>
              <span>{snapshot.revenue.paidBookings30d}</span>
            </div>
          </div>
        </article>

        <article className="surface card-stack subtle-surface">
          <div className="section-heading split-heading">
            <h2 className="section-title">Renewals</h2>
            <ShieldAlert size={18} />
          </div>
          <div className="list-stack">
            <div className="list-row">
              <strong>Active</strong>
              <span>{snapshot.renewals.active}</span>
            </div>
            <div className="list-row">
              <strong>Renewing soon</strong>
              <span>{snapshot.renewals.renewingSoon}</span>
            </div>
            <div className="list-row">
              <strong>Past due</strong>
              <span>{snapshot.renewals.pastDue}</span>
            </div>
          </div>
        </article>
      </LazySection>

      <LazySection className="surface-grid surface-grid-2" delay={200}>
        <section className="surface card-stack">
          <div className="section-heading">
            <span className="eyebrow">Due this week</span>
            <h2 className="section-title">Renewal watchlist</h2>
          </div>
          <div className="list-stack">
            {snapshot.renewals.dueThisWeek.length ? (
              snapshot.renewals.dueThisWeek.map((profile) => (
                <div key={profile.uid} className="list-row">
                  <div>
                    <strong>{profile.fullName}</strong>
                    <p className="muted-text">{profile.plan}</p>
                  </div>
                  <span className="chip chip-soft">{formatShortDate(profile.renewalDate)}</span>
                </div>
              ))
            ) : (
              <p className="muted-text">No renewals due this week.</p>
            )}
          </div>
        </section>

        <section className="surface card-stack">
          <div className="section-heading">
            <span className="eyebrow">Most valuable</span>
            <h2 className="section-title">Top programs</h2>
          </div>
          <div className="list-stack">
            {snapshot.revenue.topPrograms.length ? (
              snapshot.revenue.topPrograms.map((program) => (
                <div key={program.programId} className="list-row">
                  <div>
                    <strong>{program.programName}</strong>
                    <p className="muted-text">{program.paidBookings} paid bookings</p>
                  </div>
                  <span>{formatNaira(program.revenue)}</span>
                </div>
              ))
            ) : (
              <p className="muted-text">No program revenue yet.</p>
            )}
          </div>
        </section>
      </LazySection>
    </main>
  );
}
