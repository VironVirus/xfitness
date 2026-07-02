"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, CalendarDays, Dumbbell, Flame, MapPin, Sparkles, UserRound } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import {
  cancelBookingRecord,
  createClassBooking,
  getBookingStudioSnapshot,
  markBookingAttended,
  subscribeToBookingStudio,
  supabaseEnabled,
  type BookingStudioSnapshot
} from "@/lib/supabase";
import { formatLongDate } from "@/lib/utils";
import type { BookingRecord, ClassSchedule } from "@/types/app";

function sortBySoonest(bookings: BookingRecord[]) {
  return [...bookings].sort((left, right) => {
    return new Date(left.scheduledFor).getTime() - new Date(right.scheduledFor).getTime();
  });
}

function canMarkAttended(booking: BookingRecord) {
  if (booking.status !== "confirmed") {
    return false;
  }

  const bookingTime = new Date(booking.scheduledFor).getTime();
  return !Number.isNaN(bookingTime) && bookingTime <= Date.now();
}

export function BookingPage() {
  const { member, loading } = useAuth();
  const [snapshot, setSnapshot] = useState<BookingStudioSnapshot>({ schedules: [], bookings: [] });
  const [trainerFilter, setTrainerFilter] = useState("all");
  const [intensityFilter, setIntensityFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [workingKey, setWorkingKey] = useState("");

  async function loadBookingStudio(memberId: string) {
    setLoadingData(true);

    try {
      const nextSnapshot = await getBookingStudioSnapshot(memberId);
      setSnapshot(nextSnapshot);
      setError("");
    } catch (studioError) {
      setError(studioError instanceof Error ? studioError.message : "Unable to load class schedules.");
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    if (!member) {
      setSnapshot({ schedules: [], bookings: [] });
      return;
    }

    let active = true;

    const refresh = async () => {
      if (!active) {
        return;
      }

      await loadBookingStudio(member.uid);
    };

    void refresh();

    const unsubscribe = subscribeToBookingStudio(member.uid, () => {
      void refresh();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [member]);

  if (loading) {
    return <main className="route-shell centered-copy">Loading your booking studio...</main>;
  }

  if (!member) {
    return (
      <main className="route-shell centered-copy">
        <span className="eyebrow">Booking</span>
        <h1>Members need a profile before they can book.</h1>
        <p>Create an account first, then come back here to reserve classes with live schedule updates.</p>
        <div className="stack-row">
          <Link href="/signup" className="button button-primary">
            Create profile
          </Link>
          <Link href="/" className="button button-secondary">
            Back home
          </Link>
        </div>
      </main>
    );
  }

  const activeMember = member;

  const trainerOptions = ["all", ...new Set(snapshot.schedules.map((schedule) => schedule.trainer))];
  const intensityOptions = ["all", ...new Set(snapshot.schedules.map((schedule) => schedule.intensity))];
  const locationOptions = ["all", ...new Set(snapshot.schedules.map((schedule) => schedule.location))];

  const filteredSchedules = snapshot.schedules.filter((schedule) => {
    const trainerMatch = trainerFilter === "all" || schedule.trainer === trainerFilter;
    const intensityMatch = intensityFilter === "all" || schedule.intensity === intensityFilter;
    const locationMatch = locationFilter === "all" || schedule.location === locationFilter;

    return trainerMatch && intensityMatch && locationMatch;
  });

  const bookingsByScheduleId = snapshot.bookings.reduce((map, booking) => {
    if (!booking.scheduleId || map.has(booking.scheduleId)) {
      return map;
    }

    map.set(booking.scheduleId, booking);
    return map;
  }, new Map<string, BookingRecord>());

  const liveBookings = sortBySoonest(snapshot.bookings).filter((booking) => booking.status !== "cancelled");
  const recentChanges = sortBySoonest(snapshot.bookings).slice(0, 6);

  async function handleBook(schedule: ClassSchedule) {
    setWorkingKey(`book:${schedule.id}`);
    setMessage("");
    setError("");

    try {
      await createClassBooking(activeMember, schedule);
      setMessage(`${schedule.title} has been booked. Your dashboard will update automatically after attendance is marked.`);
      await loadBookingStudio(activeMember.uid);
    } catch (bookingError) {
      setError(bookingError instanceof Error ? bookingError.message : "Unable to complete this booking.");
    } finally {
      setWorkingKey("");
    }
  }

  async function handleCancel(booking: BookingRecord) {
    setWorkingKey(`cancel:${booking.id}`);
    setMessage("");
    setError("");

    try {
      await cancelBookingRecord(booking);
      setMessage(`${booking.programName} has been cancelled. Realtime updates are now synced across your app.`);
      await loadBookingStudio(activeMember.uid);
    } catch (bookingError) {
      setError(bookingError instanceof Error ? bookingError.message : "Unable to cancel this booking.");
    } finally {
      setWorkingKey("");
    }
  }

  async function handleAttend(booking: BookingRecord) {
    setWorkingKey(`attend:${booking.id}`);
    setMessage("");
    setError("");

    try {
      await markBookingAttended(booking);
      setMessage(`${booking.programName} marked as attended. Your dashboard progress rings should refresh live.`);
      await loadBookingStudio(activeMember.uid);
    } catch (bookingError) {
      setError(bookingError instanceof Error ? bookingError.message : "Unable to mark this class as attended.");
    } finally {
      setWorkingKey("");
    }
  }

  return (
    <main className="route-shell booking-layout booking-studio-layout">
      <section className="booking-left">
        <div className="booking-hero-block">
          <div className="section-label">Class Booking</div>
          <h1>Book classes instantly and stay in sync live.</h1>
          <p className="section-copy">
            Class schedules now come from Supabase Postgres. Filter by trainer, intensity, and location, then book or
            cancel in one tap. Once a class is attended, your dashboard progress updates automatically.
          </p>
          <div className="dashboard-status-row">
            <span className={`status-pill ${supabaseEnabled ? "live" : "disabled"}`}>
              {supabaseEnabled ? (loadingData ? "syncing realtime schedule" : "realtime from supabase") : "demo fallback"}
            </span>
            <span className="status-pill">{filteredSchedules.length} classes visible</span>
          </div>
          <div className="dashboard-actions">
            <Link href="/dashboard" className="button button-secondary">
              Back to dashboard
            </Link>
            <Link href="/settings" className="button button-secondary">
              Notification settings
            </Link>
            <Link href="/workouts" className="button button-primary">
              Open workout library
            </Link>
          </div>
        </div>

        <section className="booking-filter-bar">
          <label className="filter-field">
            <span>Trainer</span>
            <select value={trainerFilter} onChange={(event) => setTrainerFilter(event.target.value)}>
              {trainerOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All trainers" : option}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Intensity</span>
            <select value={intensityFilter} onChange={(event) => setIntensityFilter(event.target.value)}>
              {intensityOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All intensities" : option}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Location</span>
            <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
              {locationOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All clubs" : option}
                </option>
              ))}
            </select>
          </label>
        </section>

        {message ? <p className="form-message">{message}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        <section className="class-schedule-grid">
          {filteredSchedules.length ? (
            filteredSchedules.map((schedule) => {
              const currentBooking = bookingsByScheduleId.get(schedule.id);
              const isPast = new Date(schedule.startsAt).getTime() <= Date.now();
              const bookingFull = schedule.isFull && !currentBooking;
              const bookKey = `book:${schedule.id}`;
              const cancelKey = currentBooking ? `cancel:${currentBooking.id}` : "";
              const attendKey = currentBooking ? `attend:${currentBooking.id}` : "";
              const availabilityLabel = currentBooking?.status === "confirmed"
                ? "Your spot is held"
                : bookingFull
                  ? "Class full"
                  : `${schedule.openSpots} spot${schedule.openSpots === 1 ? "" : "s"} left`;

              return (
                <article key={schedule.id} className="class-schedule-card">
                  <div className="class-schedule-media">
                    <Image src={schedule.image} alt={schedule.title} fill sizes="(max-width: 1024px) 100vw, 420px" />
                  </div>

                  <div className="class-schedule-copy">
                    <div className="class-schedule-heading">
                      <div>
                        <span className="eyebrow">{schedule.intensity}</span>
                        <h2>{schedule.title}</h2>
                      </div>
                      <span className={`status-pill ${bookingFull ? "disabled" : "live"}`}>
                        {currentBooking ? currentBooking.status.replace("-", " ") : availabilityLabel}
                      </span>
                    </div>

                    <p>{schedule.description}</p>

                    <div className="class-schedule-meta">
                      <span>
                        <UserRound size={16} />
                        {schedule.trainer}
                      </span>
                      <span>
                        <CalendarDays size={16} />
                        {formatLongDate(schedule.startsAt)}
                      </span>
                      <span>
                        <MapPin size={16} />
                        {schedule.location}
                      </span>
                      <span>
                        <Dumbbell size={16} />
                        {schedule.durationMinutes} min
                      </span>
                      <span>
                        <Flame size={16} />
                        {schedule.caloriesTarget} cal target
                      </span>
                      <span>
                        <Sparkles size={16} />
                        {schedule.spotsTaken}/{schedule.capacity} reserved
                      </span>
                      <span>
                        <Bell size={16} />
                        {availabilityLabel}
                      </span>
                    </div>

                    <div className="class-schedule-actions">
                      {currentBooking?.status === "completed" ? (
                        <button type="button" className="button button-secondary" disabled>
                          Attended
                        </button>
                      ) : currentBooking?.status === "confirmed" ? (
                        <>
                          {canMarkAttended(currentBooking) ? (
                            <button
                              type="button"
                              className="button button-primary"
                              onClick={() => handleAttend(currentBooking)}
                              disabled={workingKey === attendKey}
                            >
                              {workingKey === attendKey ? "Saving..." : "Mark attended"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="button button-secondary"
                              onClick={() => handleCancel(currentBooking)}
                              disabled={workingKey === cancelKey || isPast}
                            >
                              {workingKey === cancelKey ? "Cancelling..." : "Cancel booking"}
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          className="button button-primary"
                          onClick={() => handleBook(schedule)}
                          disabled={workingKey === bookKey || bookingFull}
                        >
                          {workingKey === bookKey
                            ? "Booking..."
                            : bookingFull
                              ? "Class full"
                              : currentBooking?.status === "cancelled"
                                ? "Book again"
                                : "Book instantly"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <article className="dashboard-panel empty-booking-state">
              <h2>No classes match those filters.</h2>
              <p className="muted">Try another trainer, intensity, or location to widen the booking list.</p>
            </article>
          )}
        </section>
      </section>

      <aside className="booking-right booking-sidebar">
        <article className="dashboard-panel booking-sidebar-card">
          <div className="panel-heading">
            <h2>Your live bookings</h2>
            <span className="status-pill">{liveBookings.length} active</span>
          </div>

          <div className="booking-history">
            {liveBookings.length ? (
              liveBookings.map((booking) => (
                <div key={booking.id} className="history-row">
                  <div>
                    <strong>{booking.programName}</strong>
                    <span>
                      {formatLongDate(booking.scheduledFor)} · {booking.location}
                    </span>
                  </div>
                  <div className="history-price">
                    <span className={`status-pill ${booking.status}`}>{booking.status.replace("-", " ")}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">No active classes yet. Book one from the schedule and it will appear here instantly.</p>
            )}
          </div>
        </article>

        <article className="dashboard-panel booking-sidebar-card">
          <div className="panel-heading">
            <h2>Recent changes</h2>
            <span className="status-pill live">live feed</span>
          </div>

          <div className="booking-history">
            {recentChanges.length ? (
              recentChanges.map((booking) => (
                <div key={booking.id} className="history-row">
                  <div>
                    <strong>{booking.programName}</strong>
                    <span>{formatLongDate(booking.scheduledFor)}</span>
                  </div>
                  <div className="history-price">
                    <span className={`status-pill ${booking.status}`}>{booking.status.replace("-", " ")}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">Bookings, cancellations, and attended classes will stream here as they happen.</p>
            )}
          </div>
        </article>

        <article className="dashboard-panel booking-sidebar-card">
          <div className="panel-heading">
            <h2>Progress sync</h2>
            <span className="status-pill">dashboard linked</span>
          </div>
          <p className="muted">
            When you mark a class as attended, the app updates your `member_progress`, booking history, and profile totals
            so the dashboard rings and badges refresh automatically.
          </p>
        </article>

        <article className="dashboard-panel booking-sidebar-card">
          <div className="panel-heading">
            <h2>Next steps</h2>
            <span className="status-pill live">journey</span>
          </div>
          <div className="stack-row">
            <Link href="/settings" className="button button-secondary">
              Enable reminders
            </Link>
            <Link href="/workouts" className="button button-secondary">
              Train on demand
            </Link>
            <Link href="/community" className="button button-secondary">
              Join community
            </Link>
          </div>
        </article>
      </aside>
    </main>
  );
}
