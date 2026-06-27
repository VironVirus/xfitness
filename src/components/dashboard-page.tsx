"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { Activity, CalendarDays, Flame, ShieldCheck, Target, Trophy, UserRound } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getDashboardSnapshot, subscribeToMemberDashboard, supabaseEnabled, type DashboardSnapshot } from "@/lib/supabase";
import { formatLongDate, formatNaira, formatShortDate } from "@/lib/utils";
import type { BookingRecord, MemberProfile, MemberProgress } from "@/types/app";

const achievementMilestones = [
  {
    id: "first-class",
    label: "First Burn",
    description: "Complete your first coached class.",
    threshold: 1
  },
  {
    id: "momentum-builder",
    label: "Momentum Builder",
    description: "Finish 3 classes and lock in your habit.",
    threshold: 3
  },
  {
    id: "consistency-club",
    label: "Consistency Club",
    description: "Reach 6 completed classes in your training cycle.",
    threshold: 6
  },
  {
    id: "xfitness-elite",
    label: "Xfitness Elite",
    description: "Hit 10 completed classes to unlock legend status.",
    threshold: 10
  }
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

function getProgressPercent(value: number, goal: number) {
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

function getRenewalReminder(member: MemberProfile) {
  const renewalTime = new Date(member.renewalDate).getTime();
  const daysUntilRenewal = Number.isNaN(renewalTime)
    ? null
    : Math.ceil((renewalTime - Date.now()) / (1000 * 60 * 60 * 24));

  if (member.membershipStatus === "past-due" || (daysUntilRenewal !== null && daysUntilRenewal < 0)) {
    const overdueDays = Math.abs(daysUntilRenewal ?? 0);

    return {
      tone: "late",
      headline: "Membership overdue",
      body: overdueDays ? `Renew now. You're ${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue.` : "Renew now to restore active access."
    };
  }

  if (member.membershipStatus === "renewing-soon" || (daysUntilRenewal !== null && daysUntilRenewal <= 7)) {
    return {
      tone: "soon",
      headline: "Renewal coming up",
      body:
        daysUntilRenewal === null
          ? "Your plan renewal is approaching."
          : `Your ${member.plan} plan renews in ${daysUntilRenewal} day${daysUntilRenewal === 1 ? "" : "s"}.`
    };
  }

  return {
    tone: "active",
    headline: "Membership active",
    body: `Your ${member.plan} plan is active through ${formatShortDate(member.renewalDate)}.`
  };
}

function ProgressRing({
  label,
  value,
  goal,
  suffix,
  accent
}: {
  label: string;
  value: number;
  goal: number;
  suffix: string;
  accent: string;
}) {
  const percentage = getProgressPercent(value, goal);
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  return (
    <article className="progress-card" style={{ "--ring-accent": accent } as CSSProperties}>
      <div className="progress-ring-shell">
        <svg viewBox="0 0 180 180" className="progress-ring" aria-hidden="true">
          <circle className="progress-ring-track" cx="90" cy="90" r={radius} />
          <circle
            className="progress-ring-fill"
            cx="90"
            cy="90"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="progress-ring-content">
          <strong>{percentage}%</strong>
          <span>{label}</span>
        </div>
      </div>
      <div className="progress-card-copy">
        <strong>
          {value}
          {suffix}
        </strong>
        <span>
          Goal: {goal}
          {suffix}
        </span>
      </div>
    </article>
  );
}

export function DashboardPage() {
  const { member, loading, signOut } = useAuth();
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!member) {
      setSnapshot(null);
      return;
    }

    let active = true;

    const loadDashboardSnapshot = async () => {
      setSyncing(true);

      try {
        const nextSnapshot = await getDashboardSnapshot(member.uid);
        if (!active) {
          return;
        }

        if (nextSnapshot) {
          setSnapshot(nextSnapshot);
        }
        setError("");
      } catch (dashboardError) {
        if (!active) {
          return;
        }

        setError(dashboardError instanceof Error ? dashboardError.message : "Unable to refresh your dashboard.");
      } finally {
        if (active) {
          setSyncing(false);
        }
      }
    };

    void loadDashboardSnapshot();

    const unsubscribe = subscribeToMemberDashboard(member.uid, () => {
      void loadDashboardSnapshot();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [member]);

  if (loading) {
    return <main className="route-shell centered-copy">Loading your dashboard...</main>;
  }

  if (!member) {
    return (
      <main className="route-shell centered-copy">
        <span className="eyebrow">Dashboard</span>
        <h1>Create your member account to unlock the dashboard.</h1>
        <p>The profile, booking history, and payment state live here once a user is authenticated.</p>
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

  const dashboardMember = snapshot?.member ?? member;
  const progress = snapshot?.progress ?? createFallbackProgress(member.uid);
  const bookings = snapshot?.bookings ?? [];
  const renewalReminder = getRenewalReminder(dashboardMember);
  const completedClasses = getCompletedClasses(bookings, dashboardMember);
  const latestBookings = bookings.slice(0, 5);

  return (
    <main className="route-shell dashboard-shell">
      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">Member Dashboard</span>
          <h1>Your live fitness command center.</h1>
          <p>
            Welcome back, {dashboardMember.fullName.split(" ")[0]}. This page listens to your Supabase profile,
            progress, and bookings in real time, so your member view stays current without a refresh.
          </p>
          <div className="dashboard-status-row">
            <span className={`status-pill ${supabaseEnabled ? "live" : "disabled"}`}>
              {supabaseEnabled ? (syncing ? "syncing realtime data" : "realtime from supabase") : "demo fallback"}
            </span>
            <span className={`renewal-pill ${renewalReminder.tone}`}>{renewalReminder.headline}</span>
          </div>
        </div>

        <div className="dashboard-actions">
          <Link href="/book" className="button button-primary">
            Book new session
          </Link>
          <Link href="/settings" className="button button-secondary">
            Notification settings
          </Link>
          <button type="button" className="button button-secondary" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </section>

      {error ? <p className="form-error dashboard-alert">{error}</p> : null}

      <section className="metrics-grid">
        <article className="metric-card">
          <UserRound size={20} />
          <strong>{dashboardMember.plan}</strong>
          <span>Membership plan</span>
        </article>
        <article className="metric-card">
          <ShieldCheck size={20} />
          <strong>{dashboardMember.membershipStatus.replace("-", " ")}</strong>
          <span>Current membership status</span>
        </article>
        <article className="metric-card">
          <CalendarDays size={20} />
          <strong>{formatShortDate(dashboardMember.renewalDate)}</strong>
          <span>Renewal date</span>
        </article>
        <article className="metric-card">
          <Trophy size={20} />
          <strong>{completedClasses}</strong>
          <span>Completed classes</span>
        </article>
      </section>

      <section className="dashboard-focus-grid">
        <article className="dashboard-panel progress-panel">
          <div className="panel-heading">
            <div>
              <h2>Weekly progress</h2>
              <p className="muted">Week of {formatShortDate(progress.weekStart)}</p>
            </div>
            <span className="status-pill live">auto-updating</span>
          </div>

          <div className="progress-ring-grid">
            <ProgressRing
              label="Workouts"
              value={progress.weeklyWorkoutsCompleted}
              goal={progress.weeklyWorkoutGoal}
              suffix=""
              accent="#ff7a3d"
            />
            <ProgressRing
              label="Calories"
              value={progress.weeklyCaloriesBurned}
              goal={progress.weeklyCalorieGoal}
              suffix=" cal"
              accent="#c0ff4f"
            />
          </div>

          <div className={`renewal-card ${renewalReminder.tone}`}>
            <div>
              <span className="eyebrow">Renewal Reminder</span>
              <strong>{renewalReminder.headline}</strong>
            </div>
            <p>{renewalReminder.body}</p>
          </div>
        </article>

        <article className="dashboard-panel achievements-panel">
          <div className="panel-heading">
            <div>
              <h2>Achievements</h2>
              <p className="muted">Badges unlock as completed classes stack up.</p>
            </div>
            <span className="status-pill">{completedClasses} classes</span>
          </div>

          <div className="achievement-grid">
            {achievementMilestones.map((badge) => {
              const earned = completedClasses >= badge.threshold;

              return (
                <article key={badge.id} className={earned ? "achievement-card earned" : "achievement-card"}>
                  <div className="achievement-icon">
                    <Trophy size={18} />
                  </div>
                  <div className="achievement-copy">
                    <strong>{badge.label}</strong>
                    <p>{badge.description}</p>
                  </div>
                  <span className={earned ? "status-pill paid" : "status-pill disabled"}>
                    {earned ? "unlocked" : `${completedClasses}/${badge.threshold}`}
                  </span>
                </article>
              );
            })}
          </div>
        </article>
      </section>

      <section className="dashboard-content-grid">
        <article className="dashboard-panel profile-panel">
          <div className="panel-heading">
            <h2>Member profile</h2>
            <span className="status-pill">{supabaseEnabled ? "profile live" : "demo fallback"}</span>
          </div>
          <div className="profile-card">
            <div className="avatar-orb">{dashboardMember.fullName.slice(0, 2).toUpperCase()}</div>
            <div>
              <strong>{dashboardMember.fullName}</strong>
              <span>{dashboardMember.email}</span>
            </div>
          </div>
          <dl className="profile-details">
            <div>
              <dt>Goal</dt>
              <dd>{dashboardMember.quiz.goal}</dd>
            </div>
            <div>
              <dt>Preferred workout</dt>
              <dd>{dashboardMember.quiz.preferredWorkoutType}</dd>
            </div>
            <div>
              <dt>Home club</dt>
              <dd>{dashboardMember.homeClub}</dd>
            </div>
            <div>
              <dt>Experience</dt>
              <dd>{dashboardMember.experienceLevel}</dd>
            </div>
            <div>
              <dt>Membership</dt>
              <dd>
                {dashboardMember.plan} · {dashboardMember.membershipStatus.replace("-", " ")}
              </dd>
            </div>
            <div>
              <dt>Renews</dt>
              <dd>{formatShortDate(dashboardMember.renewalDate)}</dd>
            </div>
          </dl>
        </article>

        <article className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent bookings</h2>
              <p className="muted">
                {dashboardMember.upcomingSession
                  ? `Next coached session: ${formatLongDate(dashboardMember.upcomingSession)}`
                  : "Book a session to see your training calendar here."}
              </p>
            </div>
            <Link href="/book">Reserve another</Link>
          </div>
          <div className="booking-history">
            {latestBookings.length ? (
              latestBookings.map((booking) => {
                const bookingBadge =
                  booking.status === "confirmed" || booking.status === "completed" || booking.status === "cancelled"
                    ? booking.status
                    : booking.paymentState;

                return (
                  <div key={booking.id} className="history-row">
                    <div>
                      <strong>{booking.programName}</strong>
                      <span>
                        {formatLongDate(booking.scheduledFor)} · {booking.coach}
                      </span>
                    </div>
                    <div className="history-price">
                      <span>{booking.amount > 0 ? formatNaira(booking.amount) : "Included in membership"}</span>
                      <span className={`status-pill ${bookingBadge}`}>{bookingBadge.replace("-", " ")}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="muted">No bookings yet. Use the booking page to schedule your first session.</p>
            )}
          </div>
        </article>
      </section>

      <section className="dashboard-summary-grid">
        <article className="dashboard-panel compact-panel">
          <div className="panel-heading">
            <h2>Workout target</h2>
            <Target size={18} />
          </div>
          <p className="muted">
            {progress.weeklyWorkoutGoal - progress.weeklyWorkoutsCompleted > 0
              ? `${progress.weeklyWorkoutGoal - progress.weeklyWorkoutsCompleted} workout${progress.weeklyWorkoutGoal - progress.weeklyWorkoutsCompleted === 1 ? "" : "s"} left to hit your weekly target.`
              : "Weekly workout target reached. Keep pushing."}
          </p>
        </article>
        <article className="dashboard-panel compact-panel">
          <div className="panel-heading">
            <h2>Calorie burn</h2>
            <Flame size={18} />
          </div>
          <p className="muted">
            {progress.weeklyCalorieGoal - progress.weeklyCaloriesBurned > 0
              ? `${progress.weeklyCalorieGoal - progress.weeklyCaloriesBurned} calories left to close your weekly burn goal.`
              : "You've cleared your weekly calorie target. Great work."}
          </p>
        </article>
        <article className="dashboard-panel compact-panel">
          <div className="panel-heading">
            <h2>Consistency streak</h2>
            <Activity size={18} />
          </div>
          <p className="muted">{dashboardMember.streakDays} active days and counting. Stay on schedule to keep the streak alive.</p>
        </article>
      </section>
    </main>
  );
}
