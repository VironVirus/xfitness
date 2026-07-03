"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, CreditCard, Dumbbell, Flame, MapPin, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { LazySection } from "@/components/lazy-section";
import { PaymentButton } from "@/components/payment-button";
import { useAuth } from "@/context/auth-context";
import {
  cancelBookingRecord,
  confirmBookingPayment,
  createClassBooking,
  getBookingStudioSnapshot,
  markBookingAttended,
  subscribeToBookingStudio,
  type BookingStudioSnapshot
} from "@/lib/supabase";
import { formatLongDate, formatNaira } from "@/lib/utils";
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

function getBookingStateLabel(booking?: BookingRecord) {
  if (!booking) {
    return "";
  }

  if (booking.paymentState === "unpaid" || booking.status === "awaiting-payment") {
    return "Payment needed";
  }

  if (booking.paymentState === "paid") {
    return "Paid";
  }

  return booking.status.replace("-", " ");
}

export function BookingPage() {
  const { member, loading } = useAuth();
  const [snapshot, setSnapshot] = useState<BookingStudioSnapshot>({ schedules: [], bookings: [] });
  const [trainerFilter, setTrainerFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [workingKey, setWorkingKey] = useState("");

  async function loadBookingStudio(memberId: string) {
    try {
      const nextSnapshot = await getBookingStudioSnapshot(memberId);
      setSnapshot(nextSnapshot);
      setError("");
    } catch (studioError) {
      setError(studioError instanceof Error ? studioError.message : "Unable to load schedules.");
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
    return <main className="page page-width centered-state">Loading booking...</main>;
  }

  if (!member) {
    return (
      <main className="page page-width centered-state">
        <span className="eyebrow">Booking</span>
        <h1 className="page-title">Create an account before booking a class.</h1>
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

  const trainerOptions = ["all", ...new Set(snapshot.schedules.map((schedule) => schedule.trainer))];
  const locationOptions = ["all", ...new Set(snapshot.schedules.map((schedule) => schedule.location))];
  const filteredSchedules = snapshot.schedules.filter((schedule) => {
    const trainerMatch = trainerFilter === "all" || schedule.trainer === trainerFilter;
    const locationMatch = locationFilter === "all" || schedule.location === locationFilter;

    return trainerMatch && locationMatch;
  });

  const bookingsByScheduleId = snapshot.bookings.reduce((map, booking) => {
    if (!booking.scheduleId) {
      return map;
    }

    map.set(booking.scheduleId, booking);
    return map;
  }, new Map<string, BookingRecord>());
  const liveBookings = sortBySoonest(snapshot.bookings).filter((booking) => booking.status !== "cancelled");
  const paidBookings = liveBookings.filter((booking) => booking.paymentState === "paid");

  async function handleReserve(schedule: ClassSchedule) {
    setWorkingKey(`reserve:${schedule.id}`);
    setMessage("");
    setError("");

    try {
      const booking = await createClassBooking(activeMember, schedule);
      setMessage(
        booking.paymentState === "unpaid"
          ? `${schedule.title} reserved. Complete payment to confirm.`
          : `${schedule.title} booked.`
      );
      await loadBookingStudio(activeMember.uid);
    } catch (bookingError) {
      setError(bookingError instanceof Error ? bookingError.message : "Unable to reserve this class.");
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
      setMessage(`${booking.programName} cancelled.`);
      await loadBookingStudio(activeMember.uid);
    } catch (bookingError) {
      setError(bookingError instanceof Error ? bookingError.message : "Unable to cancel booking.");
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
      setMessage(`${booking.programName} marked attended.`);
      await loadBookingStudio(activeMember.uid);
    } catch (bookingError) {
      setError(bookingError instanceof Error ? bookingError.message : "Unable to update attendance.");
    } finally {
      setWorkingKey("");
    }
  }

  return (
    <main className="page page-width page-stack">
      <LazySection className="surface hero-surface page-stack" delay={80}>
        <div className="hero-grid compact-hero-grid">
          <div className="card-stack">
            <span className="eyebrow">Class booking</span>
            <h1 className="page-title">Reserve, pay, and train</h1>
            <p className="page-copy">Choose a class and confirm your spot.</p>
            <div className="chip-row">
              <span className="chip">{filteredSchedules.length} classes</span>
              <span className="chip">{paidBookings.length} paid bookings</span>
            </div>
          </div>

          <div className="action-row">
            <Link href="/dashboard" className="button button-secondary">
              Dashboard
            </Link>
            <Link href="/workouts" className="button button-primary">
              Workouts
            </Link>
          </div>
        </div>

        {message ? <p className="message message-success">{message}</p> : null}
        {error ? <p className="message message-error">{error}</p> : null}

        <div className="field-grid field-grid-wide">
          <label className="field">
            <span>Trainer</span>
            <select value={trainerFilter} onChange={(event) => setTrainerFilter(event.target.value)}>
              {trainerOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All trainers" : option}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Location</span>
            <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
              {locationOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All locations" : option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </LazySection>

      <LazySection className="surface-grid surface-grid-2 booking-layout-grid" delay={120}>
        <section className="card-stack">
          {filteredSchedules.length ? (
            filteredSchedules.map((schedule) => {
              const currentBooking = bookingsByScheduleId.get(schedule.id);
              const isPast = new Date(schedule.startsAt).getTime() <= Date.now();
              const bookingFull = schedule.isFull && !currentBooking;
              const reserveKey = `reserve:${schedule.id}`;
              const cancelKey = currentBooking ? `cancel:${currentBooking.id}` : "";
              const attendKey = currentBooking ? `attend:${currentBooking.id}` : "";
              const needsPayment = currentBooking?.paymentState === "unpaid" || currentBooking?.status === "awaiting-payment";

              return (
                <article key={schedule.id} className="surface booking-card">
                  <div className="booking-card-media">
                    <Image src={schedule.image} alt={schedule.title} fill sizes="(max-width: 1024px) 100vw, 46vw" />
                  </div>

                  <div className="card-stack">
                    <div className="split-line">
                      <div>
                        <span className="eyebrow">{schedule.intensity}</span>
                        <h2 className="section-title">{schedule.title}</h2>
                      </div>
                      <span className={`chip ${bookingFull ? "chip-soft" : "chip-accent"}`}>
                        {currentBooking ? getBookingStateLabel(currentBooking) : `${schedule.openSpots} left`}
                      </span>
                    </div>

                    <p className="muted-text">{schedule.description}</p>

                    <div className="meta-row">
                      <span>
                        <UserRound size={15} />
                        {schedule.trainer}
                      </span>
                      <span>
                        <CalendarDays size={15} />
                        {formatLongDate(schedule.startsAt)}
                      </span>
                      <span>
                        <MapPin size={15} />
                        {schedule.location}
                      </span>
                      <span>
                        <Dumbbell size={15} />
                        {schedule.durationMinutes} min
                      </span>
                      <span>
                        <Flame size={15} />
                        {schedule.caloriesTarget} cal
                      </span>
                      <span>
                        <CreditCard size={15} />
                        {formatNaira(schedule.price)}
                      </span>
                    </div>

                    <div className="action-row booking-action-row">
                      {!currentBooking || currentBooking.status === "cancelled" ? (
                        <button
                          type="button"
                          className="button button-primary"
                          onClick={() => handleReserve(schedule)}
                          disabled={workingKey === reserveKey || bookingFull || isPast}
                        >
                          {workingKey === reserveKey ? "Reserving..." : bookingFull ? "Class full" : "Reserve slot"}
                        </button>
                      ) : currentBooking.status === "completed" ? (
                        <button type="button" className="button button-secondary" disabled>
                          Completed
                        </button>
                      ) : canMarkAttended(currentBooking) ? (
                        <button
                          type="button"
                          className="button button-primary"
                          onClick={() => handleAttend(currentBooking)}
                          disabled={workingKey === attendKey}
                        >
                          {workingKey === attendKey ? "Saving..." : "Mark attended"}
                        </button>
                      ) : needsPayment ? (
                        <PaymentButton
                          amount={currentBooking.amount}
                          member={activeMember}
                          description={`Payment for ${currentBooking.programName}`}
                          disabled={workingKey === cancelKey}
                          onSuccess={async (verification) => {
                            await confirmBookingPayment(currentBooking, verification);
                            setMessage(`${currentBooking.programName} paid and confirmed.`);
                            await loadBookingStudio(activeMember.uid);
                          }}
                        />
                      ) : (
                        <button type="button" className="button button-secondary" disabled>
                          Confirmed
                        </button>
                      )}

                      {currentBooking && currentBooking.status !== "completed" ? (
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => handleCancel(currentBooking)}
                          disabled={workingKey === cancelKey}
                        >
                          {workingKey === cancelKey ? "Cancelling..." : "Cancel"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <article className="surface centered-state">
              <h2 className="section-title">No classes match those filters.</h2>
              <p className="muted-text">Try another trainer or location.</p>
            </article>
          )}
        </section>

        <aside className="card-stack">
          <article className="surface card-stack">
            <div className="section-heading split-heading">
              <div>
                <span className="eyebrow">My bookings</span>
                <h2 className="section-title">Upcoming</h2>
              </div>
              <span className="chip chip-soft">{liveBookings.length}</span>
            </div>

            {liveBookings.length ? (
              <div className="list-stack">
                {liveBookings.map((booking) => (
                  <div key={booking.id} className="list-row">
                    <div>
                      <strong>{booking.programName}</strong>
                      <p className="muted-text">{formatLongDate(booking.scheduledFor)}</p>
                    </div>
                    <span className={`chip ${booking.paymentState === "paid" ? "chip-positive" : "chip-soft"}`}>
                      {getBookingStateLabel(booking)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted-text">No active bookings yet.</p>
            )}
          </article>

          <article className="surface card-stack">
            <div className="section-heading">
              <span className="eyebrow">Payments</span>
              <h2 className="section-title">Current summary</h2>
            </div>

            <div className="surface-grid surface-grid-2">
              <article className="metric-card">
                <CreditCard size={18} />
                <strong className="metric-value">{paidBookings.length}</strong>
                <span className="metric-label">Paid bookings</span>
              </article>
              <article className="metric-card">
                <Dumbbell size={18} />
                <strong className="metric-value">
                  {formatNaira(paidBookings.reduce((sum, booking) => sum + booking.amount, 0))}
                </strong>
                <span className="metric-label">Paid value</span>
              </article>
            </div>

            <p className="muted-text">Payments reflect here as soon as they are confirmed.</p>
          </article>
        </aside>
      </LazySection>
    </main>
  );
}
