"use client";

import type {
  BookingRecord,
  MemberProfile,
  MemberProgress,
  MembershipTier,
  NotificationPreferences
} from "@/types/app";
import { addDaysToIso, createId, isoNow } from "@/lib/utils";

const DEMO_MEMBER_KEY = "xfitness-demo-member";
const DEMO_BOOKINGS_KEY = "xfitness-demo-bookings";
const DEMO_PROGRESS_KEY = "xfitness-demo-progress";

function canUseStorage() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalizeDemoMember(member: MemberProfile | null) {
  if (!member) {
    return null;
  }

  const goal = member.quiz?.goal ?? member.fitnessGoal ?? "Build strength and stay consistent";
  const preferredWorkoutType =
    member.quiz?.preferredWorkoutType ?? member.preferredWorkoutType ?? "Strength training";
  const joinedOn = member.joinedOn ?? isoNow();

  const notificationPreferences: NotificationPreferences = {
    enabled: member.notificationPreferences?.enabled ?? false,
    classReminders: member.notificationPreferences?.classReminders ?? true,
    goalNudges: member.notificationPreferences?.goalNudges ?? true,
    membershipAlerts: member.notificationPreferences?.membershipAlerts ?? true,
    specialEvents: member.notificationPreferences?.specialEvents ?? true,
    pushSubscribed: member.notificationPreferences?.pushSubscribed ?? false
  };

  return {
    ...member,
    fitnessGoal: goal,
    preferredWorkoutType,
    joinedOn,
    membershipStatus: member.membershipStatus ?? "active",
    renewalDate: member.renewalDate ?? addDaysToIso(joinedOn, 30),
    notificationPreferences,
    quiz: member.quiz ?? {
      goal,
      preferredWorkoutType,
      completedAt: joinedOn
    }
  } satisfies MemberProfile;
}

function createDefaultDemoProgress(memberId: string): MemberProgress {
  return {
    memberId,
    weeklyWorkoutsCompleted: 3,
    weeklyWorkoutGoal: 5,
    weeklyCaloriesBurned: 1860,
    weeklyCalorieGoal: 2400,
    weekStart: isoNow(),
    updatedAt: isoNow()
  };
}

function normalizeDemoProgress(progress: MemberProgress | null, memberId: string) {
  if (!progress) {
    return createDefaultDemoProgress(memberId);
  }

  return {
    memberId: progress.memberId ?? memberId,
    weeklyWorkoutsCompleted: progress.weeklyWorkoutsCompleted ?? 0,
    weeklyWorkoutGoal: progress.weeklyWorkoutGoal ?? 4,
    weeklyCaloriesBurned: progress.weeklyCaloriesBurned ?? 0,
    weeklyCalorieGoal: progress.weeklyCalorieGoal ?? 2400,
    weekStart: progress.weekStart ?? isoNow(),
    updatedAt: progress.updatedAt ?? isoNow()
  } satisfies MemberProgress;
}

export function getDemoMember() {
  return normalizeDemoMember(readJson<MemberProfile | null>(DEMO_MEMBER_KEY, null));
}

export function saveDemoMember(member: MemberProfile) {
  writeJson(DEMO_MEMBER_KEY, member);
}

export function clearDemoMember() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(DEMO_MEMBER_KEY);
}

export function createDemoMember(input: {
  fullName: string;
  email: string;
  goal: string;
  preferredWorkoutType: string;
  plan: MembershipTier;
}) {
  const joinedOn = isoNow();
  const member: MemberProfile = {
    uid: createId("member"),
    fullName: input.fullName,
    email: input.email,
    plan: input.plan,
    fitnessGoal: input.goal,
    preferredWorkoutType: input.preferredWorkoutType,
    quiz: {
      goal: input.goal,
      preferredWorkoutType: input.preferredWorkoutType,
      completedAt: joinedOn
    },
    homeClub: "Xfitness Enugu",
    experienceLevel: "Growing stronger",
    joinedOn,
    membershipStatus: "active",
    renewalDate: addDaysToIso(joinedOn, 30),
    notificationPreferences: {
      enabled: false,
      classReminders: true,
      goalNudges: true,
      membershipAlerts: true,
      specialEvents: true,
      pushSubscribed: false
    },
    streakDays: 12,
    sessionsCompleted: 7,
    upcomingSession: undefined,
    avatarSeed: input.fullName.toLowerCase().replace(/\s+/g, "-")
  };

  saveDemoMember(member);
  saveDemoProgress(
    normalizeDemoProgress(
      {
        memberId: member.uid,
        weeklyWorkoutsCompleted: 4,
        weeklyWorkoutGoal: 5,
        weeklyCaloriesBurned: 2120,
        weeklyCalorieGoal: 2400,
        weekStart: joinedOn,
        updatedAt: joinedOn
      },
      member.uid
    )
  );
  return member;
}

export function updateDemoMember(nextMember: MemberProfile) {
  saveDemoMember(nextMember);
  return nextMember;
}

export function getDemoBookings(memberId?: string) {
  const allBookings = readJson<BookingRecord[]>(DEMO_BOOKINGS_KEY, []);
  if (!memberId) {
    return allBookings;
  }

  return allBookings.filter((booking) => booking.memberId === memberId);
}

export function saveDemoBooking(booking: BookingRecord) {
  const current = readJson<BookingRecord[]>(DEMO_BOOKINGS_KEY, []);
  writeJson(DEMO_BOOKINGS_KEY, [booking, ...current]);
  return booking;
}

export function updateDemoBooking(nextBooking: BookingRecord) {
  const current = readJson<BookingRecord[]>(DEMO_BOOKINGS_KEY, []);
  const nextBookings = current.some((booking) => booking.id === nextBooking.id)
    ? current.map((booking) => (booking.id === nextBooking.id ? nextBooking : booking))
    : [nextBooking, ...current];

  writeJson(DEMO_BOOKINGS_KEY, nextBookings);
  return nextBooking;
}

export function getDemoProgress(memberId: string) {
  return normalizeDemoProgress(readJson<MemberProgress | null>(`${DEMO_PROGRESS_KEY}:${memberId}`, null), memberId);
}

export function saveDemoProgress(progress: MemberProgress) {
  writeJson(`${DEMO_PROGRESS_KEY}:${progress.memberId}`, progress);
  return progress;
}
