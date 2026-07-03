"use client";

import Link from "next/link";
import { Bell, CalendarDays, CreditCard, Dumbbell, ShieldCheck, Trophy, UserRound } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { LazySection } from "@/components/lazy-section";
import { useAuth } from "@/context/auth-context";
import {
  getDashboardSnapshot,
  isGymOwner,
  subscribeToMemberDashboard,
  type DashboardSnapshot
} from "@/lib/supabase";
import { formatLongDate, formatShortDate } from "@/lib/utils";
import type { BookingRecord, MemberProfile, MemberProgress } from "@/types/app";

const milestones = [
  { label: "First class", threshold: 1 },
  { label: "Momentum", threshold: 3 },
  { label: "Consistency", threshold: 6 },
  { label: "Elite", threshold: 10 }
];

function createFallbackProgress(memberId: string): MemberProgress {
  return {
    memberId,
    weeklyWorkoutsCompleted: 0,
    weeklyWorkoutGoal: 5,
    weeklyCaloriesBurned: 0,
    weeklyCalorieGoal: 2400,
    weekStart: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function getPercent(value: number, goal: number) {
  if (goal <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((value / goal) * 100));
}

function isCompletedClass(booking: BookingRecord) {
  if (booking.status === "completed") {
    return true;
  }

  const scheduledTime = new Date(booking.scheduledFor).getTime();
  if (Number.isNaN(scheduledTime) || scheduledTime > Date.now()) {
    return false;
  }

  return booking.status === "confirmed" || booking.paymentState === "paid";
}

function getCompletedClasses(bookings: BookingRecord[], member: MemberProfile) {
  const derivedCount = bookings.filter(isCompletedClass).length;
  return Math.max(derivedCount, member.sessionsCompleted);
}

function getRenewalText(member: MemberProfile) {
  const renewalTime = new Date(member.renewalDate).getTime();
  const daysUntilRenewal = Number.isNaN(renewalTime)
    ? null
    : Math.ceil((renewalTime - Date.now()) / (1000 * 60 * 60 * 24));

  if (member.membershipStatus === "past-due" || (daysUntilRenewal !== null && daysUntilRenewal < 0)) {
    return "Renew now";
  }

  if (member.membershipStatus === "renewing-soon" || (daysUntilRenewal !== null && daysUntilRenewal <= 7)) {
    return `Renews in ${daysUntilRenewal ?? 0} day${daysUntilRenewal === 1 ? "" : "s"}`;
  }

  return `Active until ${formatShortDate(member.renewalDate)}`;
}

function ProgressRing({
  label,
  value,
  goal,
  accent
}: {
  label: string;
  value: number;
  goal: number;
  accent: string;
}) {
  const percent = getPercent(value, goal);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percent / 100) * circumference;

  return (
    <article className="surface rail-card ring-card" style={{ "--ring-accent": accent } as CSSProperties}>
      <div className="ring-visual">
        <svg viewBox="0 0 150 150" className="ring-svg" aria-hidden="true">
          <circle cx="75" cy="75" r={radius} className="ring-track" />
          <circle
            cx="75"
            cy="75"
            r={radius}
            className="ring-fill"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="ring-center">
          <strong>{percent}%</strong>
          <span>{label}</span>
        </div>
      </div>

      <div className="split-line">
        <strong className="card-title">
          {value}/{goal}
        </strong>
        <span className="chip chip-soft">This week</span>
      </div>
    </article>
  );
}

export function DashboardPage() {
  const { member, loading } = useAuth();
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!member) {
      setSnapshot(null);
      return;
    }

    let active = true;

    const loadSnapshot = async () => {
      try {
        const nextSnapshot = await getDashboardSnapshot(member.uid);
        if (!active) {
          return;
        }

        setSnapshot(nextSnapshot);
        setError("");
      } catch (dashboardError) {
        if (!active) {
          return;
        }

        setError(dashboardError instanceof Error ? dashboardError.message : "Unable to refresh your dashboard.");
      }
    };

    void loadSnapshot();

    const unsubscribe = subscribeToMemberDashboard(member.uid, () => {
      void loadSnapshot();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [member]);

  if (loading) {
    return <main className="page page-width centered-state">Loading your dashboard...</main>;
  }

  if (!member) {
    return (
      <main className="page page-width centered-state">
        <span className="eyebrow">Dashboard</span>
        <h1 className="page-title">Create an account to open your dashboard.</h1>
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

  const activeMember = snapshot?.member ?? member;
  const progress = snapshot?.progress ?? createFallbackProgress(member.uid);
  const bookings = snapshot?.bookings ?? [];
  const completedClasses = getCompletedClasses(bookings, activeMember);
  const pendingPayments = bookings.filter(
    (booking) => booking.status === "awaiting-payment" || booking.paymentState === "unpaid"
  );
  const upcomingBooking = [...bookings]
    .filter((booking) => booking.status !== "cancelled")
    .sort((left, right) => new Date(left.scheduledFor).getTime() - new Date(right.scheduledFor).getTime())[0];
  const latestBookings = [...bookings].slice(0, 5);
  const unlockedBadges = milestones.filter((badge) => completedClasses >= badge.threshold);
  const quickLinks = [
    {
      href: "/book",
      label: "Book class",
      icon: CalendarDays
    },
    {
      href: "/workouts",
      label: "Workouts",
      icon: Dumbbell
    },
    {
      href: "/community",
      label: "Community",
      icon: Trophy
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Bell
    }
  ];

  if (isGymOwner(activeMember)) {
    quickLinks.push({
      href: "/admin",
      label: "Admin",
      icon: ShieldCheck
    });
  }

  return (
    <main className="page page-width page-stack">
      <LazySection className="surface hero-surface page-stack" delay={120}>
        <div className="hero-grid compact-hero-grid">
          <div className="card-stack">
            <span className="eyebrow">Dashboard</span>
            <h1 className="page-title">Hi, {activeMember.fullName.split(" ")[0]}</h1>
            <p className="page-copy">
              {activeMember.plan} plan
              <span className="page-copy-separator">•</span>
              {getRenewalText(activeMember)}
            </p>
          </div>

          <div className="action-row">
            <Link href="/book" className="button button-primary">
              Book
            </Link>
            <Link href="/workouts" className="button button-secondary">
              Workouts
            </Link>
          </div>
        </div>

        {error ? <p className="message message-error">{error}</p> : null}

        {upcomingBooking ? (
          <div className="surface subtle-surface compact-summary">
            <strong>Next class</strong>
            <span>{upcomingBooking.programName}</span>
            <small>{formatLongDate(upcomingBooking.scheduledFor)}</small>
          </div>
        ) : null}
      </LazySection>

      <LazySection className="section-stack" delay={240}>
        <div className="section-heading">
          <span className="eyebrow">Today</span>
          <h2 className="section-title">Your snapshot</h2>
        </div>

        <div className="section-rail">
          <article className="surface rail-card metric-card">
            <UserRound size={18} />
            <strong className="metric-value">{activeMember.streakDays}</strong>
            <span className="metric-label">Day streak</span>
          </article>
          <article className="surface rail-card metric-card">
            <CalendarDays size={18} />
            <strong className="metric-value">{bookings.filter((booking) => booking.status !== "cancelled").length}</strong>
            <span className="metric-label">Bookings</span>
          </article>
          <article className="surface rail-card metric-card">
            <Dumbbell size={18} />
            <strong className="metric-value">{completedClasses}</strong>
            <span className="metric-label">Completed</span>
          </article>
          <article className="surface rail-card metric-card">
            <CreditCard size={18} />
            <strong className="metric-value">{pendingPayments.length}</strong>
            <span className="metric-label">To pay</span>
          </article>
        </div>
      </LazySection>

      <LazySection className="section-stack" delay={320}>
        <div className="section-heading">
          <span className="eyebrow">Progress</span>
          <h2 className="section-title">Keep it moving</h2>
        </div>

        <div className="section-rail">
          <ProgressRing
            label="Workouts"
            value={progress.weeklyWorkoutsCompleted}
            goal={progress.weeklyWorkoutGoal}
            accent="#12b886"
          />
          <ProgressRing
            label="Calories"
            value={progress.weeklyCaloriesBurned}
            goal={progress.weeklyCalorieGoal}
            accent="#f59f00"
          />
          <article className="surface rail-card card-stack">
            <span className="eyebrow">Badges</span>
            <strong className="card-title">{unlockedBadges.length} unlocked</strong>
            <div className="chip-row">
              {milestones.map((badge) => (
                <span
                  key={badge.label}
                  className={`chip ${unlockedBadges.some((item) => item.label === badge.label) ? "chip-positive" : "chip-soft"}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          </article>
        </div>
      </LazySection>

      <LazySection className="section-stack" delay={420}>
        <div className="section-heading">
          <span className="eyebrow">Shortcuts</span>
          <h2 className="section-title">Open a page</h2>
        </div>

        <div className="section-rail">
          {quickLinks.map((link) => {
            const Icon = link.icon;

            return (
              <Link key={link.href} href={link.href} className="surface rail-card action-card">
                <Icon size={18} />
                <strong>{link.label}</strong>
              </Link>
            );
          })}
        </div>
      </LazySection>

      <LazySection className="section-stack" delay={520}>
        <div className="section-heading split-heading">
          <div>
            <span className="eyebrow">Recent</span>
            <h2 className="section-title">Bookings</h2>
          </div>
          <Link href="/book" className="inline-link">
            View all
          </Link>
        </div>

        <div className="section-rail">
          {latestBookings.length ? (
            latestBookings.map((booking) => (
              <article key={booking.id} className="surface rail-card card-stack">
                <strong className="card-title">{booking.programName}</strong>
                <span className="muted-text">{formatLongDate(booking.scheduledFor)}</span>
                <span className="chip chip-soft">{booking.status.replace("-", " ")}</span>
              </article>
            ))
          ) : (
            <article className="surface rail-card card-stack">
              <strong className="card-title">No bookings yet</strong>
              <Link href="/book" className="inline-link">
                Book a class
              </Link>
            </article>
          )}
        </div>
      </LazySection>
    </main>
  );
}
