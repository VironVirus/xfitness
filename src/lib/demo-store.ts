"use client";

import type {
  AuthRole,
  BookingRecord,
  CommunityForumComment,
  CommunityForumThread,
  MemberChallengeProgress,
  MemberLoginActivity,
  MemberWorkoutActivity,
  MemberProfile,
  MemberProgress,
  MembershipTier,
  NotificationPreferences
} from "@/types/app";
import {
  demoAdminBookings,
  demoAdminLoginActivity,
  demoAdminMembers,
  demoCommunityChallengeProgress,
  demoCommunityForumComments,
  demoCommunityForumThreads
} from "@/data/site";
import { addDaysToIso, createId, isoNow } from "@/lib/utils";

const DEMO_MEMBER_KEY = "xfitness-demo-member";
const DEMO_BOOKINGS_KEY = "xfitness-demo-bookings";
const DEMO_PROGRESS_KEY = "xfitness-demo-progress";
const DEMO_WORKOUT_ACTIVITY_KEY = "xfitness-demo-workout-activity";
const DEMO_CHALLENGE_PROGRESS_KEY = "xfitness-demo-challenge-progress";
const DEMO_FORUM_THREADS_KEY = "xfitness-demo-forum-threads";
const DEMO_FORUM_COMMENTS_KEY = "xfitness-demo-forum-comments";
const DEMO_LOGIN_ACTIVITY_KEY = "xfitness-demo-login-activity";

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
    authRole: member.authRole ?? "member",
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
  authRole?: AuthRole;
}) {
  const joinedOn = isoNow();
  const member: MemberProfile = {
    uid: createId("member"),
    fullName: input.fullName,
    email: input.email,
    authRole: input.authRole ?? "member",
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

export function getDemoAllBookings() {
  const stored = readJson<BookingRecord[]>(DEMO_BOOKINGS_KEY, []);
  return [...stored, ...demoAdminBookings].reduce<BookingRecord[]>((acc, booking) => {
    if (acc.some((item) => item.id === booking.id)) {
      return acc;
    }

    acc.push(booking);
    return acc;
  }, []);
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

export function getDemoWorkoutActivity(memberId?: string) {
  const allActivity = readJson<MemberWorkoutActivity[]>(DEMO_WORKOUT_ACTIVITY_KEY, []);
  if (!memberId) {
    return allActivity;
  }

  return allActivity.filter((activity) => activity.memberId === memberId);
}

export function getDemoAllMembers() {
  const storedMember = getDemoMember();
  return [...demoAdminMembers, ...(storedMember ? [storedMember] : [])].reduce<MemberProfile[]>((acc, member) => {
    if (acc.some((item) => item.uid === member.uid)) {
      return acc;
    }

    acc.push(member);
    return acc;
  }, []);
}

export function upsertDemoWorkoutActivity(nextActivity: MemberWorkoutActivity) {
  const current = readJson<MemberWorkoutActivity[]>(DEMO_WORKOUT_ACTIVITY_KEY, []);
  const nextCollection = current.some(
    (activity) => activity.memberId === nextActivity.memberId && activity.workoutId === nextActivity.workoutId
  )
    ? current.map((activity) => {
        if (activity.memberId === nextActivity.memberId && activity.workoutId === nextActivity.workoutId) {
          return nextActivity;
        }

        return activity;
      })
    : [nextActivity, ...current];

  writeJson(DEMO_WORKOUT_ACTIVITY_KEY, nextCollection);
  return nextActivity;
}

export function getDemoChallengeProgress(challengeId?: string) {
  const stored = readJson<MemberChallengeProgress[]>(DEMO_CHALLENGE_PROGRESS_KEY, []);
  const combined = [...demoCommunityChallengeProgress, ...stored].reduce<MemberChallengeProgress[]>((acc, entry) => {
    if (acc.some((item) => item.memberId === entry.memberId && item.challengeId === entry.challengeId)) {
      return acc;
    }

    acc.push(entry);
    return acc;
  }, []);

  if (!challengeId) {
    return combined;
  }

  return combined.filter((entry) => entry.challengeId === challengeId);
}

export function upsertDemoChallengeProgress(nextEntry: MemberChallengeProgress) {
  const current = readJson<MemberChallengeProgress[]>(DEMO_CHALLENGE_PROGRESS_KEY, []);
  const nextCollection = current.some(
    (entry) => entry.memberId === nextEntry.memberId && entry.challengeId === nextEntry.challengeId
  )
    ? current.map((entry) => {
        if (entry.memberId === nextEntry.memberId && entry.challengeId === nextEntry.challengeId) {
          return nextEntry;
        }

        return entry;
      })
    : [nextEntry, ...current];

  writeJson(DEMO_CHALLENGE_PROGRESS_KEY, nextCollection);
  return nextEntry;
}

export function getDemoForumThreads() {
  const stored = readJson<CommunityForumThread[]>(DEMO_FORUM_THREADS_KEY, []);
  return [...stored, ...demoCommunityForumThreads].reduce<CommunityForumThread[]>((acc, thread) => {
    if (acc.some((item) => item.id === thread.id)) {
      return acc;
    }

    acc.push(thread);
    return acc;
  }, []);
}

export function upsertDemoForumThread(nextThread: CommunityForumThread) {
  const current = readJson<CommunityForumThread[]>(DEMO_FORUM_THREADS_KEY, []);
  const nextCollection = current.some((thread) => thread.id === nextThread.id)
    ? current.map((thread) => (thread.id === nextThread.id ? nextThread : thread))
    : [nextThread, ...current];

  writeJson(DEMO_FORUM_THREADS_KEY, nextCollection);
  return nextThread;
}

export function getDemoForumComments(threadId?: string) {
  const stored = readJson<CommunityForumComment[]>(DEMO_FORUM_COMMENTS_KEY, []);
  const combined = [...stored, ...demoCommunityForumComments].reduce<CommunityForumComment[]>((acc, comment) => {
    if (acc.some((item) => item.id === comment.id)) {
      return acc;
    }

    acc.push(comment);
    return acc;
  }, []);

  if (!threadId) {
    return combined;
  }

  return combined.filter((comment) => comment.threadId === threadId);
}

export function saveDemoForumComment(nextComment: CommunityForumComment) {
  const current = readJson<CommunityForumComment[]>(DEMO_FORUM_COMMENTS_KEY, []);
  writeJson(DEMO_FORUM_COMMENTS_KEY, [nextComment, ...current]);
  return nextComment;
}

export function getDemoLoginActivity() {
  const stored = readJson<MemberLoginActivity[]>(DEMO_LOGIN_ACTIVITY_KEY, []);
  return [...stored, ...demoAdminLoginActivity].reduce<MemberLoginActivity[]>((acc, event) => {
    if (acc.some((item) => item.memberId === event.memberId && item.loginDay === event.loginDay)) {
      return acc;
    }

    acc.push(event);
    return acc;
  }, []);
}

export function recordDemoLoginActivity(nextEvent: MemberLoginActivity) {
  const current = readJson<MemberLoginActivity[]>(DEMO_LOGIN_ACTIVITY_KEY, []);
  const nextCollection = current.some((event) => {
    return event.memberId === nextEvent.memberId && event.loginDay === nextEvent.loginDay;
  })
    ? current.map((event) => {
        if (event.memberId === nextEvent.memberId && event.loginDay === nextEvent.loginDay) {
          return nextEvent;
        }

        return event;
      })
    : [nextEvent, ...current];

  writeJson(DEMO_LOGIN_ACTIVITY_KEY, nextCollection);
  return nextEvent;
}
