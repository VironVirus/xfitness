"use client";

import { createClient, type RealtimeChannel, type User } from "@supabase/supabase-js";
import { sessionPrograms } from "@/data/site";
import {
  createDemoMember,
  getDemoBookings,
  getDemoMember,
  getDemoProgress,
  saveDemoBooking,
  saveDemoProgress,
  updateDemoBooking,
  updateDemoMember
} from "@/lib/demo-store";
import { addDaysToIso, createId, isoNow } from "@/lib/utils";
import type {
  BookingRecord,
  ClassSchedule,
  MemberProfile,
  MemberProgress,
  MembershipStatus,
  MembershipTier,
  NotificationPreferences
} from "@/types/app";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const DEFAULT_WORKOUT_GOAL = 5;
const DEFAULT_CALORIE_GOAL = 2400;
const DEFAULT_RENEWAL_WINDOW_DAYS = 30;

export const supabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

const supabase = supabaseEnabled ? createClient(supabaseUrl!, supabaseAnonKey!) : null;

export type SignUpMemberResult = {
  member: MemberProfile;
  requiresEmailConfirmation: boolean;
};

export type DashboardSnapshot = {
  member: MemberProfile;
  progress: MemberProgress;
  bookings: BookingRecord[];
};

export type BookingStudioSnapshot = {
  schedules: ClassSchedule[];
  bookings: BookingRecord[];
};

type QuizPayload = {
  goal?: string;
  preferredWorkoutType?: string;
  preferred_workout_type?: string;
  completedAt?: string;
  completed_at?: string;
} | null;

type NotificationPreferencesPayload = Partial<NotificationPreferences> | null;

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  plan: MembershipTier | null;
  fitness_goal: string | null;
  preferred_workout_type: string | null;
  quiz: QuizPayload;
  home_club: string | null;
  experience_level: string | null;
  joined_on: string | null;
  membership_status: MembershipStatus | null;
  renewal_date: string | null;
  notification_preferences: NotificationPreferencesPayload;
  streak_days: number | null;
  sessions_completed: number | null;
  upcoming_session: string | null;
  avatar_seed: string | null;
};

type MemberProgressRow = {
  member_id: string;
  weekly_workouts_completed: number | null;
  weekly_workout_goal: number | null;
  weekly_calories_burned: number | null;
  weekly_calorie_goal: number | null;
  week_start: string | null;
  updated_at: string | null;
};

type BookingRow = {
  id: string;
  member_id: string;
  member_name: string;
  member_email: string;
  program_id: string;
  program_name: string;
  scheduled_for: string;
  coach: string;
  focus: string;
  amount: number;
  status: BookingRecord["status"];
  payment_state: BookingRecord["paymentState"];
  location: string;
  schedule_id: string | null;
  intensity: string | null;
  class_image: string | null;
  calories_target: number | null;
  attended_at: string | null;
  tx_ref: string | null;
  transaction_id: string | null;
  created_at: string;
};

type ClassScheduleRow = {
  id: string;
  program_id: string;
  title: string;
  trainer: string;
  intensity: string;
  location: string;
  starts_at: string;
  duration_minutes: number;
  description: string | null;
  image: string | null;
  calories_target: number | null;
  is_active: boolean | null;
};

const demoScheduleBlueprints = [
  {
    id: "demo-strength-lab-monday-evening",
    program: sessionPrograms[0],
    trainer: "Coach Amara",
    intensity: "High",
    location: "Xfitness Enugu",
    daysAhead: 1,
    hour: 18,
    caloriesTarget: 520
  },
  {
    id: "demo-ignite-hiit-tuesday-morning",
    program: sessionPrograms[1],
    trainer: "Coach Tobe",
    intensity: "Explosive",
    location: "Xfitness Independence Layout",
    daysAhead: 2,
    hour: 7,
    caloriesTarget: 610
  },
  {
    id: "demo-mobility-reset-wednesday-evening",
    program: sessionPrograms[2],
    trainer: "Coach Nneka",
    intensity: "Low",
    location: "Xfitness Enugu",
    daysAhead: 3,
    hour: 17,
    caloriesTarget: 260
  },
  {
    id: "demo-women-sculpt-thursday-evening",
    program: sessionPrograms[3],
    trainer: "Coach Adaeze",
    intensity: "Moderate",
    location: "Xfitness Trans-Ekulu",
    daysAhead: 4,
    hour: 18,
    caloriesTarget: 430
  },
  {
    id: "demo-strength-lab-saturday-morning",
    program: sessionPrograms[0],
    trainer: "Coach Amara",
    intensity: "High",
    location: "Xfitness Independence Layout",
    daysAhead: 6,
    hour: 8,
    caloriesTarget: 540
  },
  {
    id: "demo-mobility-reset-sunday-morning",
    program: sessionPrograms[2],
    trainer: "Coach Nneka",
    intensity: "Low",
    location: "Xfitness Enugu",
    daysAhead: 7,
    hour: 9,
    caloriesTarget: 240
  }
];

function getMetadataString(metadata: User["user_metadata"] | undefined, key: string, fallback: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function normalizeDateTime(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function getCurrentWeekStartIso(reference = new Date()) {
  const weekStart = new Date(reference);
  const day = weekStart.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;

  weekStart.setUTCDate(weekStart.getUTCDate() + diff);
  weekStart.setUTCHours(0, 0, 0, 0);

  return weekStart.toISOString();
}

function isInCurrentWeek(iso: string) {
  const weekStart = new Date(getCurrentWeekStartIso()).getTime();
  const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;
  const value = new Date(iso).getTime();

  return !Number.isNaN(value) && value >= weekStart && value < weekEnd;
}

function getDefaultRenewalDate(joinedOn = isoNow()) {
  return addDaysToIso(joinedOn, DEFAULT_RENEWAL_WINDOW_DAYS);
}

function getDefaultNotificationPreferences(
  overrides?: Partial<NotificationPreferences>
): NotificationPreferences {
  return {
    enabled: false,
    classReminders: true,
    goalNudges: true,
    membershipAlerts: true,
    specialEvents: true,
    pushSubscribed: false,
    ...overrides
  };
}

function parseDurationMinutes(duration: string) {
  const match = duration.match(/\d+/);
  return match ? Number(match[0]) : 60;
}

function getDemoScheduleStartsAt(daysAhead: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function normalizeMemberProfile(profile: Partial<MemberProfile>): MemberProfile {
  const joinedOn = profile.joinedOn ?? isoNow();
  const goal = profile.quiz?.goal ?? profile.fitnessGoal ?? "Build strength and stay consistent";
  const preferredWorkoutType =
    profile.quiz?.preferredWorkoutType ?? profile.preferredWorkoutType ?? "Strength training";

  return {
    uid: profile.uid ?? createId("member"),
    fullName: profile.fullName ?? "Xfitness Member",
    email: profile.email ?? "",
    plan: profile.plan ?? "Performance",
    fitnessGoal: goal,
    preferredWorkoutType,
    quiz: profile.quiz ?? {
      goal,
      preferredWorkoutType,
      completedAt: joinedOn
    },
    homeClub: profile.homeClub ?? "Xfitness Enugu",
    experienceLevel: profile.experienceLevel ?? "Performance track",
    joinedOn,
    membershipStatus: profile.membershipStatus ?? "active",
    renewalDate: profile.renewalDate ?? getDefaultRenewalDate(joinedOn),
    notificationPreferences: getDefaultNotificationPreferences(profile.notificationPreferences),
    streakDays: profile.streakDays ?? 0,
    sessionsCompleted: profile.sessionsCompleted ?? 0,
    upcomingSession: profile.upcomingSession,
    avatarSeed: profile.avatarSeed ?? profile.fullName ?? profile.email ?? profile.uid ?? createId("avatar")
  };
}

function normalizeMemberProgress(progress: Partial<MemberProgress>): MemberProgress {
  return {
    memberId: progress.memberId ?? createId("progress"),
    weeklyWorkoutsCompleted: progress.weeklyWorkoutsCompleted ?? 0,
    weeklyWorkoutGoal: progress.weeklyWorkoutGoal ?? DEFAULT_WORKOUT_GOAL,
    weeklyCaloriesBurned: progress.weeklyCaloriesBurned ?? 0,
    weeklyCalorieGoal: progress.weeklyCalorieGoal ?? DEFAULT_CALORIE_GOAL,
    weekStart: progress.weekStart ?? getCurrentWeekStartIso(),
    updatedAt: progress.updatedAt ?? isoNow()
  };
}

function createDefaultMemberProgress(memberId: string, overrides?: Partial<MemberProgress>) {
  return normalizeMemberProgress({
    memberId,
    weeklyWorkoutGoal: DEFAULT_WORKOUT_GOAL,
    weeklyCalorieGoal: DEFAULT_CALORIE_GOAL,
    weekStart: getCurrentWeekStartIso(),
    updatedAt: isoNow(),
    ...overrides
  });
}

function createProfileFromUser(user: User, overrides?: Partial<MemberProfile>): MemberProfile {
  const metadataName = getMetadataString(user.user_metadata, "full_name", "Xfitness Member");
  const metadataGoal = getMetadataString(
    user.user_metadata,
    "fitness_goal",
    "Build strength and stay consistent"
  );
  const metadataWorkout = getMetadataString(
    user.user_metadata,
    "preferred_workout_type",
    "Strength training"
  );
  const joinedOn = overrides?.joinedOn ?? isoNow();
  const goal = overrides?.quiz?.goal ?? overrides?.fitnessGoal ?? metadataGoal;
  const preferredWorkoutType =
    overrides?.quiz?.preferredWorkoutType ?? overrides?.preferredWorkoutType ?? metadataWorkout;

  return normalizeMemberProfile({
    uid: user.id,
    fullName: overrides?.fullName ?? metadataName,
    email: overrides?.email ?? user.email ?? "",
    plan: overrides?.plan ?? "Performance",
    fitnessGoal: goal,
    preferredWorkoutType,
    quiz: overrides?.quiz ?? {
      goal,
      preferredWorkoutType,
      completedAt: joinedOn
    },
    homeClub: overrides?.homeClub ?? "Xfitness Enugu",
    experienceLevel: overrides?.experienceLevel ?? "Performance track",
    joinedOn,
    membershipStatus: overrides?.membershipStatus ?? "active",
    renewalDate: overrides?.renewalDate ?? getDefaultRenewalDate(joinedOn),
    notificationPreferences: overrides?.notificationPreferences ?? getDefaultNotificationPreferences(),
    streakDays: overrides?.streakDays ?? 0,
    sessionsCompleted: overrides?.sessionsCompleted ?? 0,
    upcomingSession: overrides?.upcomingSession,
    avatarSeed: overrides?.avatarSeed ?? getMetadataString(user.user_metadata, "avatar_seed", user.email ?? user.id)
  });
}

function profileRowToMember(row: Partial<ProfileRow>): MemberProfile {
  const quiz = row.quiz ?? null;
  const joinedOn = row.joined_on ?? isoNow();
  const goal = quiz?.goal ?? row.fitness_goal ?? "Build strength and stay consistent";
  const notificationPreferences = getDefaultNotificationPreferences(row.notification_preferences ?? undefined);
  const preferredWorkoutType =
    quiz?.preferredWorkoutType ??
    quiz?.preferred_workout_type ??
    row.preferred_workout_type ??
    "Strength training";

  return normalizeMemberProfile({
    uid: row.id ?? createId("member"),
    fullName: row.full_name ?? "Xfitness Member",
    email: row.email ?? "",
    plan: row.plan ?? "Performance",
    fitnessGoal: row.fitness_goal ?? goal,
    preferredWorkoutType,
    quiz: {
      goal,
      preferredWorkoutType,
      completedAt: quiz?.completedAt ?? quiz?.completed_at ?? joinedOn
    },
    homeClub: row.home_club ?? "Xfitness Enugu",
    experienceLevel: row.experience_level ?? "Performance track",
    joinedOn,
    membershipStatus: row.membership_status ?? "active",
    renewalDate: row.renewal_date ?? getDefaultRenewalDate(joinedOn),
    notificationPreferences,
    streakDays: row.streak_days ?? 0,
    sessionsCompleted: row.sessions_completed ?? 0,
    upcomingSession: row.upcoming_session ?? undefined,
    avatarSeed: row.avatar_seed ?? row.full_name ?? row.email ?? row.id ?? createId("avatar")
  });
}

function memberToProfileRow(member: MemberProfile) {
  return {
    id: member.uid,
    full_name: member.fullName,
    email: member.email,
    plan: member.plan,
    fitness_goal: member.fitnessGoal,
    preferred_workout_type: member.preferredWorkoutType,
    quiz: {
      goal: member.quiz.goal,
      preferredWorkoutType: member.quiz.preferredWorkoutType,
      completedAt: member.quiz.completedAt
    },
    home_club: member.homeClub,
    experience_level: member.experienceLevel,
    joined_on: member.joinedOn,
    membership_status: member.membershipStatus,
    renewal_date: member.renewalDate,
    notification_preferences: member.notificationPreferences,
    streak_days: member.streakDays,
    sessions_completed: member.sessionsCompleted,
    upcoming_session: member.upcomingSession ?? null,
    avatar_seed: member.avatarSeed
  };
}

function progressRowToProgress(row: Partial<MemberProgressRow>): MemberProgress {
  return normalizeMemberProgress({
    memberId: row.member_id ?? createId("progress"),
    weeklyWorkoutsCompleted: row.weekly_workouts_completed ?? 0,
    weeklyWorkoutGoal: row.weekly_workout_goal ?? DEFAULT_WORKOUT_GOAL,
    weeklyCaloriesBurned: row.weekly_calories_burned ?? 0,
    weeklyCalorieGoal: row.weekly_calorie_goal ?? DEFAULT_CALORIE_GOAL,
    weekStart: row.week_start ?? getCurrentWeekStartIso(),
    updatedAt: row.updated_at ?? isoNow()
  });
}

function progressToRow(progress: MemberProgress) {
  return {
    member_id: progress.memberId,
    weekly_workouts_completed: progress.weeklyWorkoutsCompleted,
    weekly_workout_goal: progress.weeklyWorkoutGoal,
    weekly_calories_burned: progress.weeklyCaloriesBurned,
    weekly_calorie_goal: progress.weeklyCalorieGoal,
    week_start: normalizeDateTime(progress.weekStart),
    updated_at: progress.updatedAt
  };
}

function bookingRowToRecord(row: BookingRow): BookingRecord {
  return {
    id: row.id,
    memberId: row.member_id,
    memberName: row.member_name,
    memberEmail: row.member_email,
    programId: row.program_id,
    programName: row.program_name,
    scheduledFor: row.scheduled_for,
    coach: row.coach,
    focus: row.focus,
    amount: row.amount,
    status: row.status,
    paymentState: row.payment_state,
    location: row.location,
    scheduleId: row.schedule_id ?? undefined,
    intensity: row.intensity ?? undefined,
    classImage: row.class_image ?? undefined,
    caloriesTarget: row.calories_target ?? undefined,
    attendedAt: row.attended_at ?? undefined,
    txRef: row.tx_ref ?? undefined,
    transactionId: row.transaction_id ?? undefined,
    createdAt: row.created_at
  };
}

function bookingToInsert(booking: Omit<BookingRecord, "id" | "createdAt">) {
  return {
    member_id: booking.memberId,
    member_name: booking.memberName,
    member_email: booking.memberEmail,
    program_id: booking.programId,
    program_name: booking.programName,
    scheduled_for: normalizeDateTime(booking.scheduledFor),
    coach: booking.coach,
    focus: booking.focus,
    amount: booking.amount,
    status: booking.status,
    payment_state: booking.paymentState,
    location: booking.location,
    schedule_id: booking.scheduleId ?? null,
    intensity: booking.intensity ?? null,
    class_image: booking.classImage ?? null,
    calories_target: booking.caloriesTarget ?? null,
    attended_at: booking.attendedAt ?? null,
    tx_ref: booking.txRef ?? null,
    transaction_id: booking.transactionId ?? null
  };
}

function classScheduleRowToSchedule(row: ClassScheduleRow): ClassSchedule {
  return {
    id: row.id,
    programId: row.program_id,
    title: row.title,
    trainer: row.trainer,
    intensity: row.intensity,
    location: row.location,
    startsAt: row.starts_at,
    durationMinutes: row.duration_minutes,
    description: row.description ?? "",
    image: row.image ?? "/media/strength-zone.png",
    caloriesTarget: row.calories_target ?? 400
  };
}

function createDemoClassSchedules() {
  return demoScheduleBlueprints.map((blueprint) => ({
    id: blueprint.id,
    programId: blueprint.program.id,
    title: blueprint.program.name,
    trainer: blueprint.trainer,
    intensity: blueprint.intensity,
    location: blueprint.location,
    startsAt: getDemoScheduleStartsAt(blueprint.daysAhead, blueprint.hour),
    durationMinutes: parseDurationMinutes(blueprint.program.duration),
    description: blueprint.program.description,
    image: blueprint.program.image,
    caloriesTarget: blueprint.caloriesTarget
  })) satisfies ClassSchedule[];
}

function getNextUpcomingSessionFromBookings(bookings: BookingRecord[]) {
  const now = Date.now();

  const nextBooking = bookings
    .filter((booking) => booking.status === "confirmed")
    .map((booking) => ({ booking, time: new Date(booking.scheduledFor).getTime() }))
    .filter((entry) => !Number.isNaN(entry.time) && entry.time >= now)
    .sort((left, right) => left.time - right.time)[0];

  return nextBooking?.booking.scheduledFor;
}

function normalizeProgressForCurrentWeek(progress: MemberProgress, memberId: string) {
  const currentWeekStart = getCurrentWeekStartIso();

  if (progress.weekStart === currentWeekStart) {
    return progress;
  }

  return createDefaultMemberProgress(memberId, {
    weeklyWorkoutsCompleted: 0,
    weeklyCaloriesBurned: 0
  });
}

async function ensureMemberProgress(memberId: string, seed?: Partial<MemberProgress>) {
  const existingProgress = await getMemberProgress(memberId);
  if (existingProgress) {
    return existingProgress;
  }

  const progress = createDefaultMemberProgress(memberId, seed);
  if (!supabase) {
    return progress;
  }

  const { error } = await supabase.from("member_progress").upsert(progressToRow(progress), { onConflict: "member_id" });
  if (error) {
    throw new Error(error.message);
  }

  return progress;
}

async function ensureMemberProfile(user: User) {
  const existingProfile = await getMemberProfile(user.id);
  if (existingProfile) {
    await ensureMemberProgress(user.id);
    return existingProfile;
  }

  const member = createProfileFromUser(user);
  if (!supabase) {
    return member;
  }

  const progress = createDefaultMemberProgress(user.id, {
    weeklyWorkoutsCompleted: 2,
    weeklyCaloriesBurned: 1200
  });

  const [profileResult, progressResult] = await Promise.all([
    supabase.from("profiles").upsert(memberToProfileRow(member), { onConflict: "id" }),
    supabase.from("member_progress").upsert(progressToRow(progress), { onConflict: "member_id" })
  ]);

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }

  if (progressResult.error) {
    throw new Error(progressResult.error.message);
  }

  return member;
}

async function syncUpcomingSession(memberId: string) {
  if (!supabaseEnabled || !supabase) {
    const currentMember = getDemoMember();
    if (!currentMember || currentMember.uid !== memberId) {
      return;
    }

    const upcomingSession = getNextUpcomingSessionFromBookings(getDemoBookings(memberId));
    updateDemoMember({
      ...currentMember,
      upcomingSession
    });
    return;
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("scheduled_for")
    .eq("member_id", memberId)
    .eq("status", "confirmed")
    .gt("scheduled_for", isoNow())
    .order("scheduled_for", { ascending: true })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const upcomingSession = data?.[0]?.scheduled_for ?? null;
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ upcoming_session: upcomingSession })
    .eq("id", memberId);

  if (profileError) {
    throw new Error(profileError.message);
  }
}

async function incrementAttendanceProgress(booking: BookingRecord) {
  const caloriesTarget = booking.caloriesTarget ?? 400;

  if (!supabaseEnabled || !supabase) {
    const currentMember = getDemoMember();
    if (!currentMember || currentMember.uid !== booking.memberId) {
      return;
    }

    const currentProgress = normalizeProgressForCurrentWeek(getDemoProgress(booking.memberId), booking.memberId);
    const nextProgress = isInCurrentWeek(booking.scheduledFor)
      ? {
          ...currentProgress,
          weeklyWorkoutsCompleted: currentProgress.weeklyWorkoutsCompleted + 1,
          weeklyCaloriesBurned: currentProgress.weeklyCaloriesBurned + caloriesTarget,
          updatedAt: isoNow()
        }
      : currentProgress;

    saveDemoProgress(nextProgress);
    updateDemoMember({
      ...currentMember,
      sessionsCompleted: currentMember.sessionsCompleted + 1,
      streakDays: currentMember.streakDays + 1
    });
    return;
  }

  const [member, currentProgress] = await Promise.all([
    getMemberProfile(booking.memberId),
    getMemberProgress(booking.memberId)
  ]);

  if (!member) {
    return;
  }

  const normalizedProgress = normalizeProgressForCurrentWeek(
    currentProgress ?? createDefaultMemberProgress(booking.memberId),
    booking.memberId
  );

  const nextProgress = isInCurrentWeek(booking.scheduledFor)
    ? {
        ...normalizedProgress,
        weeklyWorkoutsCompleted: normalizedProgress.weeklyWorkoutsCompleted + 1,
        weeklyCaloriesBurned: normalizedProgress.weeklyCaloriesBurned + caloriesTarget,
        updatedAt: isoNow()
      }
    : normalizedProgress;

  const nextMember = {
    ...member,
    sessionsCompleted: member.sessionsCompleted + 1,
    streakDays: member.streakDays + 1
  };

  const [progressResult, profileResult] = await Promise.all([
    supabase.from("member_progress").upsert(progressToRow(nextProgress), { onConflict: "member_id" }),
    supabase.from("profiles").upsert(memberToProfileRow(nextMember), { onConflict: "id" })
  ]);

  if (progressResult.error) {
    throw new Error(progressResult.error.message);
  }

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }
}

export function watchMemberSession(
  onResolved: (member: MemberProfile | null) => Promise<void> | void,
  onSettled: () => void
) {
  if (!supabaseEnabled || !supabase) {
    Promise.resolve(onResolved(getDemoMember())).finally(onSettled);
    return () => {};
  }

  let active = true;

  const resolveMember = async (user: User | null) => {
    if (!active) {
      return;
    }

    if (!user) {
      await onResolved(null);
      onSettled();
      return;
    }

    const member = await ensureMemberProfile(user);
    if (!active) {
      return;
    }

    await onResolved(member);
    onSettled();
  };

  void supabase.auth
    .getSession()
    .then(async ({ data, error }) => {
      if (error) {
        throw error;
      }

      await resolveMember(data.session?.user ?? null);
    })
    .catch(async () => {
      await onResolved(null);
      onSettled();
    });

  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((_event, session) => {
    void resolveMember(session?.user ?? null);
  });

  return () => {
    active = false;
    subscription.unsubscribe();
  };
}

export function subscribeToMemberDashboard(memberId: string, onChange: () => void) {
  if (!supabaseEnabled || !supabase) {
    return () => {};
  }

  const channel = supabase
    .channel(`dashboard:${memberId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `id=eq.${memberId}` }, onChange)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "member_progress", filter: `member_id=eq.${memberId}` },
      onChange
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "bookings", filter: `member_id=eq.${memberId}` },
      onChange
    )
    .subscribe((status, error) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error("Supabase realtime dashboard subscription issue.", status, error);
      }
    });

  return () => {
    void supabase.removeChannel(channel as RealtimeChannel);
  };
}

export function subscribeToBookingStudio(memberId: string, onChange: () => void) {
  if (!supabaseEnabled || !supabase) {
    return () => {};
  }

  const channel = supabase
    .channel(`booking-studio:${memberId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "class_schedules" }, onChange)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "bookings", filter: `member_id=eq.${memberId}` },
      onChange
    )
    .subscribe((status, error) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error("Supabase realtime booking subscription issue.", status, error);
      }
    });

  return () => {
    void supabase.removeChannel(channel as RealtimeChannel);
  };
}

export async function signUpMember(input: {
  fullName: string;
  email: string;
  password: string;
  goal: string;
  preferredWorkoutType: string;
}): Promise<SignUpMemberResult> {
  if (!supabaseEnabled || !supabase) {
    return {
      member: createDemoMember({
        ...input,
        plan: "Performance"
      }),
      requiresEmailConfirmation: false
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        fitness_goal: input.goal,
        preferred_workout_type: input.preferredWorkoutType,
        avatar_seed: input.fullName || input.email
      }
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("Supabase could not create the account.");
  }

  const member = createProfileFromUser(data.user, {
    fullName: input.fullName,
    fitnessGoal: input.goal,
    preferredWorkoutType: input.preferredWorkoutType,
    quiz: {
      goal: input.goal,
      preferredWorkoutType: input.preferredWorkoutType,
      completedAt: isoNow()
    },
    plan: "Performance",
    membershipStatus: "active",
    renewalDate: getDefaultRenewalDate(),
    streakDays: 4,
    sessionsCompleted: 0
  });

  if (data.session) {
    const progress = createDefaultMemberProgress(data.user.id, {
      weeklyWorkoutsCompleted: 1,
      weeklyCaloriesBurned: 420
    });

    const [profileResult, progressResult] = await Promise.all([
      supabase.from("profiles").upsert(memberToProfileRow(member), { onConflict: "id" }),
      supabase.from("member_progress").upsert(progressToRow(progress), { onConflict: "member_id" })
    ]);

    if (profileResult.error) {
      throw new Error(profileResult.error.message);
    }

    if (progressResult.error) {
      throw new Error(progressResult.error.message);
    }
  }

  return {
    member,
    requiresEmailConfirmation: !data.session
  };
}

export async function signInMember(email: string, password: string) {
  if (!supabaseEnabled || !supabase) {
    const demoMember = getDemoMember();
    if (demoMember && demoMember.email === email) {
      return demoMember;
    }

    return createDemoMember({
      fullName: email.split("@")[0].replace(/[._-]/g, " "),
      email,
      goal: "Stay active and look athletic",
      preferredWorkoutType: "Strength training",
      plan: "Performance"
    });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("Supabase could not verify this account.");
  }

  return ensureMemberProfile(data.user);
}

export async function signOutMember() {
  if (!supabaseEnabled || !supabase) {
    return;
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function getMemberProfile(uid: string) {
  if (!supabaseEnabled || !supabase) {
    return getDemoMember();
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return profileRowToMember(data as ProfileRow);
}

export async function saveMemberProfile(member: MemberProfile) {
  if (!supabaseEnabled || !supabase) {
    return updateDemoMember(member);
  }

  const { error } = await supabase.from("profiles").upsert(memberToProfileRow(member), { onConflict: "id" });
  if (error) {
    throw new Error(error.message);
  }

  return member;
}

export async function getMemberProgress(memberId: string) {
  if (!supabaseEnabled || !supabase) {
    return getDemoProgress(memberId);
  }

  const { data, error } = await supabase.from("member_progress").select("*").eq("member_id", memberId).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return progressRowToProgress(data as MemberProgressRow);
}

export async function saveMemberProgress(progress: MemberProgress) {
  if (!supabaseEnabled || !supabase) {
    return saveDemoProgress(progress);
  }

  const { error } = await supabase.from("member_progress").upsert(progressToRow(progress), { onConflict: "member_id" });
  if (error) {
    throw new Error(error.message);
  }

  return progress;
}

export async function getClassSchedules() {
  if (!supabaseEnabled || !supabase) {
    return createDemoClassSchedules();
  }

  const { data, error } = await supabase
    .from("class_schedules")
    .select("*")
    .eq("is_active", true)
    .gte("starts_at", isoNow())
    .order("starts_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((schedule) => classScheduleRowToSchedule(schedule as ClassScheduleRow));
}

export async function getMemberBookings(memberId: string) {
  if (!supabaseEnabled || !supabase) {
    return getDemoBookings(memberId);
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((booking) => bookingRowToRecord(booking as BookingRow));
}

export async function getDashboardSnapshot(memberId: string) {
  if (!supabaseEnabled || !supabase) {
    const demoMember = getDemoMember();
    if (!demoMember) {
      return null;
    }

    return {
      member: demoMember,
      progress: getDemoProgress(demoMember.uid),
      bookings: getDemoBookings(demoMember.uid)
    } satisfies DashboardSnapshot;
  }

  const [member, bookings, progress] = await Promise.all([
    getMemberProfile(memberId),
    getMemberBookings(memberId),
    getMemberProgress(memberId)
  ]);

  if (!member) {
    return null;
  }

  const nextProgress = progress ?? (await ensureMemberProgress(memberId));

  return {
    member,
    progress: nextProgress,
    bookings
  } satisfies DashboardSnapshot;
}

export async function getBookingStudioSnapshot(memberId: string) {
  const [schedules, bookings] = await Promise.all([getClassSchedules(), getMemberBookings(memberId)]);

  return {
    schedules,
    bookings
  } satisfies BookingStudioSnapshot;
}

export async function createBookingRecord(booking: Omit<BookingRecord, "id" | "createdAt">) {
  if (!supabaseEnabled || !supabase) {
    const completeBooking: BookingRecord = {
      ...booking,
      scheduledFor: normalizeDateTime(booking.scheduledFor),
      id: createId("booking"),
      createdAt: isoNow()
    };

    if (completeBooking.scheduleId) {
      const existingBooking = getDemoBookings(completeBooking.memberId).find(
        (currentBooking) => currentBooking.scheduleId === completeBooking.scheduleId
      );

      if (existingBooking) {
        const updatedBooking = {
          ...existingBooking,
          ...completeBooking,
          id: existingBooking.id,
          createdAt: existingBooking.createdAt
        };

        updateDemoBooking(updatedBooking);
        await syncUpcomingSession(updatedBooking.memberId);
        return updatedBooking;
      }
    }

    saveDemoBooking(completeBooking);
    await syncUpcomingSession(completeBooking.memberId);
    return completeBooking;
  }

  const bookingsTable = supabase.from("bookings");
  const mutation = booking.scheduleId
    ? bookingsTable.upsert(bookingToInsert(booking), { onConflict: "member_id,schedule_id" })
    : bookingsTable.insert(bookingToInsert(booking));

  const { data, error } = await mutation.select("*").single();
  if (error) {
    throw new Error(error.message);
  }

  const bookingRecord = bookingRowToRecord(data as BookingRow);
  await syncUpcomingSession(bookingRecord.memberId);
  return bookingRecord;
}

export async function createClassBooking(member: MemberProfile, schedule: ClassSchedule) {
  return createBookingRecord({
    memberId: member.uid,
    memberName: member.fullName,
    memberEmail: member.email,
    programId: schedule.programId,
    programName: schedule.title,
    scheduledFor: schedule.startsAt,
    coach: schedule.trainer,
    focus: schedule.description,
    amount: 0,
    status: "confirmed",
    paymentState: "disabled",
    location: schedule.location,
    scheduleId: schedule.id,
    intensity: schedule.intensity,
    classImage: schedule.image,
    caloriesTarget: schedule.caloriesTarget
  });
}

export async function cancelBookingRecord(booking: BookingRecord) {
  if (booking.status === "cancelled" || booking.status === "completed") {
    return booking;
  }

  const nextBooking: BookingRecord = {
    ...booking,
    status: "cancelled"
  };

  if (!supabaseEnabled || !supabase) {
    updateDemoBooking(nextBooking);
    await syncUpcomingSession(booking.memberId);
    return nextBooking;
  }

  const { data, error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled"
    })
    .eq("id", booking.id)
    .eq("member_id", booking.memberId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const updatedBooking = bookingRowToRecord(data as BookingRow);
  await syncUpcomingSession(booking.memberId);
  return updatedBooking;
}

export async function markBookingAttended(booking: BookingRecord) {
  if (booking.status === "completed") {
    return booking;
  }

  const attendedAt = isoNow();

  if (!supabaseEnabled || !supabase) {
    const updatedBooking: BookingRecord = {
      ...booking,
      status: "completed",
      attendedAt
    };

    updateDemoBooking(updatedBooking);
    await incrementAttendanceProgress(updatedBooking);
    await syncUpcomingSession(updatedBooking.memberId);
    return updatedBooking;
  }

  const { data, error } = await supabase
    .from("bookings")
    .update({
      status: "completed",
      attended_at: attendedAt
    })
    .eq("id", booking.id)
    .eq("member_id", booking.memberId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const updatedBooking = bookingRowToRecord(data as BookingRow);
  await incrementAttendanceProgress(updatedBooking);
  await syncUpcomingSession(updatedBooking.memberId);
  return updatedBooking;
}
