"use client";

import { createClient, type RealtimeChannel, type User } from "@supabase/supabase-js";
import {
  communityChallenges,
  sessionPrograms,
  workoutLibraryCatalog
} from "@/data/site";
import {
  clearDemoMember,
  createDemoMember,
  getDemoAllBookings,
  getDemoAllMembers,
  getDemoChallengeProgress,
  getDemoBookings,
  getDemoForumComments,
  getDemoForumThreads,
  getDemoLoginActivity,
  getDemoMember,
  getDemoProgress,
  getDemoWorkoutActivity,
  recordDemoLoginActivity,
  saveDemoBooking,
  saveDemoForumComment,
  saveDemoProgress,
  upsertDemoChallengeProgress,
  upsertDemoForumThread,
  upsertDemoWorkoutActivity,
  updateDemoBooking,
  updateDemoMember
} from "@/lib/demo-store";
import { addDaysToIso, createId, isoNow } from "@/lib/utils";
import type {
  AuthRole,
  BookingRecord,
  ClassSchedule,
  CommunityChallenge,
  CommunityForumComment,
  CommunityForumThread,
  MemberChallengeProgress,
  MemberLoginActivity,
  MemberWorkoutActivity,
  MemberProfile,
  MemberProgress,
  MembershipStatus,
  MembershipTier,
  NotificationPreferences,
  WorkoutVideo
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

export type WorkoutLibrarySnapshot = {
  workouts: WorkoutVideo[];
  activity: MemberWorkoutActivity[];
  progress: MemberProgress;
};

export type CommunitySnapshot = {
  challenges: CommunityChallenge[];
  challengeProgress: MemberChallengeProgress[];
  threads: CommunityForumThread[];
  comments: CommunityForumComment[];
};

export type AdminDashboardSnapshot = {
  summary: {
    totalMembers: number;
    activeMembers: number;
    uniqueLogins7d: number;
    bookings30d: number;
    collectedRevenue30d: number;
    renewalsDue7d: number;
  };
  classPopularity: Array<{
    programId: string;
    programName: string;
    bookingsCount: number;
    attendedCount: number;
    attendanceRate: number;
    revenue: number;
    lastBookedAt?: string;
  }>;
  attendanceTrends: Array<{
    date: string;
    label: string;
    bookedCount: number;
    attendedCount: number;
  }>;
  engagement: {
    totalLoginEvents7d: number;
    bookingMembers30d: number;
    challengeParticipants: number;
    challengeCompletions: number;
    trend: Array<{
      date: string;
      label: string;
      loginCount: number;
      bookingCount: number;
      challengeCheckIns: number;
    }>;
    topChallenges: Array<{
      challengeId: string;
      title: string;
      participants: number;
      completions: number;
      completionRate: number;
    }>;
  };
  revenue: {
    collected30d: number;
    pending30d: number;
    paidBookings30d: number;
    averagePaidBookingValue: number;
    topPrograms: Array<{
      programId: string;
      programName: string;
      revenue: number;
      paidBookings: number;
    }>;
  };
  renewals: {
    active: number;
    renewingSoon: number;
    pastDue: number;
    dueThisWeek: MemberProfile[];
    overdueMembers: MemberProfile[];
  };
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
  capacity: number | null;
  spots_taken: number | null;
  is_active: boolean | null;
};

type WorkoutLibraryRow = {
  id: string;
  workout_key: string | null;
  title: string;
  trainer: string;
  category: string;
  intensity: string;
  duration_minutes: number;
  description: string | null;
  video_url: string | null;
  poster_image: string | null;
  target_goal: string | null;
  calories_burn: number | null;
  equipment: string[] | null;
  tags: string[] | null;
  is_featured: boolean | null;
  is_active: boolean | null;
};

type MemberWorkoutActivityRow = {
  member_id: string;
  workout_id: string;
  favorited: boolean | null;
  completed_count: number | null;
  total_minutes_completed: number | null;
  last_completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type CommunityChallengeRow = {
  id: string;
  challenge_key: string | null;
  title: string;
  description: string | null;
  metric_label: string | null;
  metric_unit: string | null;
  target_value: number | null;
  duration_days: number | null;
  cover_image: string | null;
  share_hashtag: string | null;
  share_prompt: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_featured: boolean | null;
  is_active: boolean | null;
};

type MemberChallengeProgressRow = {
  member_id: string;
  member_name: string;
  challenge_id: string;
  progress_value: number | null;
  streak_days: number | null;
  joined_at: string | null;
  last_check_in_at: string | null;
  completed_at: string | null;
  updated_at: string | null;
};

type CommunityForumThreadRow = {
  id: string;
  thread_key: string | null;
  member_id: string;
  member_name: string;
  title: string;
  body: string;
  category: string;
  created_at: string | null;
  updated_at: string | null;
};

type CommunityForumCommentRow = {
  id: string;
  thread_id: string;
  member_id: string;
  member_name: string;
  body: string;
  created_at: string | null;
};

type MemberLoginActivityRow = {
  id: string;
  member_id: string;
  member_name: string;
  email: string;
  login_day: string;
  logged_in_at: string | null;
  source: string | null;
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
    caloriesTarget: 520,
    capacity: 18
  },
  {
    id: "demo-ignite-hiit-tuesday-morning",
    program: sessionPrograms[1],
    trainer: "Coach Tobe",
    intensity: "Explosive",
    location: "Xfitness Independence Layout",
    daysAhead: 2,
    hour: 7,
    caloriesTarget: 610,
    capacity: 16
  },
  {
    id: "demo-mobility-reset-wednesday-evening",
    program: sessionPrograms[2],
    trainer: "Coach Nneka",
    intensity: "Low",
    location: "Xfitness Enugu",
    daysAhead: 3,
    hour: 17,
    caloriesTarget: 260,
    capacity: 20
  },
  {
    id: "demo-women-sculpt-thursday-evening",
    program: sessionPrograms[3],
    trainer: "Coach Adaeze",
    intensity: "Moderate",
    location: "Xfitness Trans-Ekulu",
    daysAhead: 4,
    hour: 18,
    caloriesTarget: 430,
    capacity: 14
  },
  {
    id: "demo-strength-lab-saturday-morning",
    program: sessionPrograms[0],
    trainer: "Coach Amara",
    intensity: "High",
    location: "Xfitness Independence Layout",
    daysAhead: 6,
    hour: 8,
    caloriesTarget: 540,
    capacity: 18
  },
  {
    id: "demo-mobility-reset-sunday-morning",
    program: sessionPrograms[2],
    trainer: "Coach Nneka",
    intensity: "Low",
    location: "Xfitness Enugu",
    daysAhead: 7,
    hour: 9,
    caloriesTarget: 240,
    capacity: 20
  }
];

function getMetadataString(metadata: User["user_metadata"] | undefined, key: string, fallback: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function normalizeAuthRole(value: unknown): AuthRole {
  return value === "gym_owner" ? "gym_owner" : "member";
}

function getAppMetadataRole(metadata: Record<string, unknown> | undefined) {
  const directRole = metadata?.user_role ?? metadata?.role;
  if (typeof directRole === "string" && directRole.trim()) {
    return normalizeAuthRole(directRole);
  }

  const roles = metadata?.roles;
  if (Array.isArray(roles) && roles.some((role) => role === "gym_owner")) {
    return "gym_owner";
  }

  return "member";
}

function getAuthRoleFromUser(user: Pick<User, "app_metadata" | "user_metadata">) {
  const appRole = getAppMetadataRole((user.app_metadata ?? {}) as Record<string, unknown>);
  if (appRole === "gym_owner") {
    return appRole;
  }

  return getAppMetadataRole((user.user_metadata ?? {}) as Record<string, unknown>);
}

function getDemoAuthRoleFromEmail(email: string) {
  const normalizedEmail = email.toLowerCase();
  return normalizedEmail.includes("owner") || normalizedEmail.includes("admin") ? "gym_owner" : "member";
}

function normalizeDateTime(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function getUtcDateKey(iso: string) {
  return iso.slice(0, 10);
}

function getDayRangeKeys(totalDays: number) {
  const dates: string[] = [];

  for (let offset = totalDays - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - offset);
    dates.push(date.toISOString().slice(0, 10));
  }

  return dates;
}

function formatTrendDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric"
  }).format(new Date(`${dateKey}T00:00:00.000Z`));
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
    authRole: normalizeAuthRole(profile.authRole),
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
    authRole: overrides?.authRole ?? getAuthRoleFromUser(user),
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

function withScheduleAvailability(schedule: Omit<ClassSchedule, "openSpots" | "isFull">): ClassSchedule {
  const capacity = Math.max(1, schedule.capacity);
  const spotsTaken = Math.max(0, Math.min(schedule.spotsTaken, capacity));
  const openSpots = Math.max(0, capacity - spotsTaken);

  return {
    ...schedule,
    capacity,
    spotsTaken,
    openSpots,
    isFull: openSpots <= 0
  };
}

function classScheduleRowToSchedule(row: ClassScheduleRow): ClassSchedule {
  return withScheduleAvailability({
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
    caloriesTarget: row.calories_target ?? 400,
    capacity: row.capacity ?? 16,
    spotsTaken: row.spots_taken ?? 0
  });
}

function workoutLibraryRowToWorkout(row: WorkoutLibraryRow): WorkoutVideo {
  return {
    id: row.id,
    workoutKey: row.workout_key ?? row.id,
    title: row.title,
    trainer: row.trainer,
    category: row.category,
    intensity: row.intensity,
    durationMinutes: row.duration_minutes,
    description: row.description ?? "",
    videoUrl: row.video_url ?? "/media/codec-test.mp4",
    posterImage: row.poster_image ?? "/media/hero-still.png",
    targetGoal: row.target_goal ?? "Build strength and stay consistent",
    caloriesBurn: row.calories_burn ?? 300,
    equipment: row.equipment ?? [],
    tags: row.tags ?? [],
    featured: row.is_featured ?? false
  };
}

function memberWorkoutActivityRowToActivity(row: MemberWorkoutActivityRow): MemberWorkoutActivity {
  return {
    memberId: row.member_id,
    workoutId: row.workout_id,
    favorited: row.favorited ?? false,
    completedCount: row.completed_count ?? 0,
    totalMinutesCompleted: row.total_minutes_completed ?? 0,
    lastCompletedAt: row.last_completed_at ?? undefined,
    createdAt: row.created_at ?? isoNow(),
    updatedAt: row.updated_at ?? isoNow()
  };
}

function memberWorkoutActivityToRow(activity: MemberWorkoutActivity) {
  return {
    member_id: activity.memberId,
    workout_id: activity.workoutId,
    favorited: activity.favorited,
    completed_count: activity.completedCount,
    total_minutes_completed: activity.totalMinutesCompleted,
    last_completed_at: activity.lastCompletedAt ?? null,
    created_at: activity.createdAt,
    updated_at: activity.updatedAt
  };
}

function communityChallengeRowToChallenge(row: CommunityChallengeRow): CommunityChallenge {
  return {
    id: row.id,
    challengeKey: row.challenge_key ?? row.id,
    title: row.title,
    description: row.description ?? "",
    metricLabel: row.metric_label ?? "Progress",
    metricUnit: row.metric_unit ?? "pts",
    targetValue: row.target_value ?? 0,
    durationDays: row.duration_days ?? 30,
    coverImage: row.cover_image ?? "/media/group-energy.png",
    shareHashtag: row.share_hashtag ?? "#XfitnessChallenge",
    sharePrompt: row.share_prompt ?? "Share your progress and tag the community.",
    startsAt: row.starts_at ?? isoNow(),
    endsAt: row.ends_at ?? isoNow(),
    featured: row.is_featured ?? false
  };
}

function memberChallengeProgressRowToProgress(row: MemberChallengeProgressRow): MemberChallengeProgress {
  return {
    memberId: row.member_id,
    memberName: row.member_name,
    challengeId: row.challenge_id,
    progressValue: row.progress_value ?? 0,
    streakDays: row.streak_days ?? 0,
    joinedAt: row.joined_at ?? isoNow(),
    lastCheckInAt: row.last_check_in_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    updatedAt: row.updated_at ?? isoNow()
  };
}

function memberChallengeProgressToRow(progress: MemberChallengeProgress) {
  return {
    member_id: progress.memberId,
    member_name: progress.memberName,
    challenge_id: progress.challengeId,
    progress_value: progress.progressValue,
    streak_days: progress.streakDays,
    joined_at: progress.joinedAt,
    last_check_in_at: progress.lastCheckInAt ?? null,
    completed_at: progress.completedAt ?? null,
    updated_at: progress.updatedAt
  };
}

function communityForumThreadRowToThread(row: CommunityForumThreadRow): CommunityForumThread {
  return {
    id: row.id,
    threadKey: row.thread_key ?? row.id,
    memberId: row.member_id,
    memberName: row.member_name,
    title: row.title,
    body: row.body,
    category: row.category,
    createdAt: row.created_at ?? isoNow(),
    updatedAt: row.updated_at ?? isoNow()
  };
}

function communityForumThreadToRow(thread: CommunityForumThread) {
  return {
    id: thread.id,
    thread_key: thread.threadKey,
    member_id: thread.memberId,
    member_name: thread.memberName,
    title: thread.title,
    body: thread.body,
    category: thread.category,
    created_at: thread.createdAt,
    updated_at: thread.updatedAt
  };
}

function communityForumCommentRowToComment(row: CommunityForumCommentRow): CommunityForumComment {
  return {
    id: row.id,
    threadId: row.thread_id,
    memberId: row.member_id,
    memberName: row.member_name,
    body: row.body,
    createdAt: row.created_at ?? isoNow()
  };
}

function communityForumCommentToRow(comment: CommunityForumComment) {
  return {
    id: comment.id,
    thread_id: comment.threadId,
    member_id: comment.memberId,
    member_name: comment.memberName,
    body: comment.body,
    created_at: comment.createdAt
  };
}

function memberLoginActivityRowToEvent(row: MemberLoginActivityRow): MemberLoginActivity {
  return {
    id: row.id,
    memberId: row.member_id,
    memberName: row.member_name,
    email: row.email,
    loginDay: row.login_day,
    loggedInAt: row.logged_in_at ?? isoNow(),
    source: row.source ?? "web"
  };
}

function memberLoginActivityToRow(event: MemberLoginActivity) {
  return {
    id: event.id,
    member_id: event.memberId,
    member_name: event.memberName,
    email: event.email,
    login_day: event.loginDay,
    logged_in_at: event.loggedInAt,
    source: event.source
  };
}

function createDemoClassSchedules() {
  const bookingsByScheduleId = getDemoAllBookings().reduce((map, booking) => {
    const bookingTime = new Date(booking.scheduledFor).getTime();

    if (!booking.scheduleId || booking.status === "cancelled" || Number.isNaN(bookingTime) || bookingTime < Date.now()) {
      return map;
    }

    map.set(booking.scheduleId, (map.get(booking.scheduleId) ?? 0) + 1);
    return map;
  }, new Map<string, number>());

  return demoScheduleBlueprints.map((blueprint) =>
    withScheduleAvailability({
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
      caloriesTarget: blueprint.caloriesTarget,
      capacity: blueprint.capacity,
      spotsTaken: bookingsByScheduleId.get(blueprint.id) ?? 0
    })
  ) satisfies ClassSchedule[];
}

function createDemoWorkoutLibrary() {
  return workoutLibraryCatalog.map((workout) => ({
    ...workout
  }));
}

function createDemoCommunityChallenges() {
  return communityChallenges.map((challenge) => ({
    ...challenge
  }));
}

function isSameUtcDay(leftIso: string, rightIso: string) {
  return leftIso.slice(0, 10) === rightIso.slice(0, 10);
}

function isPreviousUtcDay(previousIso: string, nextIso: string) {
  const previous = new Date(previousIso);
  const next = new Date(nextIso);
  previous.setUTCHours(0, 0, 0, 0);
  next.setUTCHours(0, 0, 0, 0);
  return next.getTime() - previous.getTime() === 24 * 60 * 60 * 1000;
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
    return {
      ...existingProfile,
      authRole: getAuthRoleFromUser(user)
    };
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

async function getOrCreateMemberWorkoutActivity(memberId: string, workoutId: string) {
  const existingActivity = await getMemberWorkoutActivity(memberId);
  const match = existingActivity.find((activity) => activity.workoutId === workoutId);

  if (match) {
    return match;
  }

  return {
    memberId,
    workoutId,
    favorited: false,
    completedCount: 0,
    totalMinutesCompleted: 0,
    createdAt: isoNow(),
    updatedAt: isoNow()
  } satisfies MemberWorkoutActivity;
}

async function incrementWorkoutCompletionProgress(memberId: string, workout: WorkoutVideo) {
  const currentProgress = normalizeProgressForCurrentWeek(
    (await getMemberProgress(memberId)) ?? createDefaultMemberProgress(memberId),
    memberId
  );

  const nextProgress = {
    ...currentProgress,
    weeklyWorkoutsCompleted: currentProgress.weeklyWorkoutsCompleted + 1,
    weeklyCaloriesBurned: currentProgress.weeklyCaloriesBurned + workout.caloriesBurn,
    updatedAt: isoNow()
  } satisfies MemberProgress;

  await saveMemberProgress(nextProgress);
  return nextProgress;
}

export function isGymOwner(member: Pick<MemberProfile, "authRole"> | null | undefined) {
  return normalizeAuthRole(member?.authRole) === "gym_owner";
}

function isBookingAttended(booking: BookingRecord) {
  return booking.status === "completed" || Boolean(booking.attendedAt);
}

function isActiveBooking(booking: BookingRecord) {
  return booking.status !== "cancelled";
}

function isWithinTrailingDays(iso: string | undefined, days: number) {
  if (!iso) {
    return false;
  }

  const value = new Date(iso).getTime();
  if (Number.isNaN(value)) {
    return false;
  }

  const cutoff = Date.now() - (days - 1) * 24 * 60 * 60 * 1000;
  return value >= cutoff;
}

function getLoginEventForToday(member: MemberProfile): MemberLoginActivity {
  const loggedInAt = isoNow();

  return {
    id: createId("login"),
    memberId: member.uid,
    memberName: member.fullName,
    email: member.email,
    loginDay: getUtcDateKey(loggedInAt),
    loggedInAt,
    source: "web"
  };
}

async function recordMemberLoginActivity(member: MemberProfile) {
  const nextEvent = getLoginEventForToday(member);

  if (!supabaseEnabled || !supabase) {
    return recordDemoLoginActivity(nextEvent);
  }

  const { data, error } = await supabase
    .from("member_login_activity")
    .upsert(memberLoginActivityToRow(nextEvent), { onConflict: "member_id,login_day" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return memberLoginActivityRowToEvent(data as MemberLoginActivityRow);
}

async function safeRecordMemberLoginActivity(member: MemberProfile) {
  try {
    await recordMemberLoginActivity(member);
  } catch (loginActivityError) {
    console.error("Unable to record member login activity.", loginActivityError);
  }
}

function createAdminDashboardSnapshot(
  requester: MemberProfile,
  members: MemberProfile[],
  bookings: BookingRecord[],
  challenges: CommunityChallenge[],
  challengeProgress: MemberChallengeProgress[],
  loginEvents: MemberLoginActivity[]
): AdminDashboardSnapshot {
  const hydratedMembers = members.map((member) => {
    if (member.uid !== requester.uid) {
      return member;
    }

    return {
      ...member,
      authRole: requester.authRole
    };
  });
  const trackedMembers = hydratedMembers.filter((member) => {
    return !(isGymOwner(requester) && member.uid === requester.uid);
  });
  const trackedMemberIds = new Set(trackedMembers.map((member) => member.uid));
  const trackedBookings = bookings.filter((booking) => trackedMemberIds.has(booking.memberId));
  const trackedChallengeProgress = challengeProgress.filter((entry) => trackedMemberIds.has(entry.memberId));
  const trackedLogins = loginEvents.filter((event) => trackedMemberIds.has(event.memberId));
  const last30DayBookings = trackedBookings.filter((booking) => isWithinTrailingDays(booking.createdAt, 30));
  const last30DayPaidBookings = last30DayBookings.filter((booking) => booking.paymentState === "paid" && booking.amount > 0);
  const last30DayPendingBookings = last30DayBookings.filter((booking) => {
    return booking.amount > 0 && booking.status !== "cancelled" && booking.paymentState !== "paid";
  });
  const uniqueLogins7d = new Set(
    trackedLogins.filter((event) => isWithinTrailingDays(event.loggedInAt, 7)).map((event) => event.memberId)
  ).size;
  const collectedRevenue30d = last30DayPaidBookings.reduce((sum, booking) => sum + booking.amount, 0);
  const dueThisWeek = trackedMembers
    .filter((member) => {
      const renewalTime = new Date(member.renewalDate).getTime();
      const timeUntilRenewal = renewalTime - Date.now();

      return !Number.isNaN(renewalTime) && timeUntilRenewal >= 0 && timeUntilRenewal <= 7 * 24 * 60 * 60 * 1000;
    })
    .sort((left, right) => new Date(left.renewalDate).getTime() - new Date(right.renewalDate).getTime());
  const overdueMembers = trackedMembers
    .filter((member) => {
      const renewalTime = new Date(member.renewalDate).getTime();
      return member.membershipStatus === "past-due" || (!Number.isNaN(renewalTime) && renewalTime < Date.now());
    })
    .sort((left, right) => new Date(left.renewalDate).getTime() - new Date(right.renewalDate).getTime());
  const classPopularityMap = [...trackedBookings]
    .filter((booking) => isActiveBooking(booking) && isWithinTrailingDays(booking.scheduledFor, 30))
    .reduce<Map<string, AdminDashboardSnapshot["classPopularity"][number]>>((map, booking) => {
      const current = map.get(booking.programId) ?? {
        programId: booking.programId,
        programName: booking.programName,
        bookingsCount: 0,
        attendedCount: 0,
        attendanceRate: 0,
        revenue: 0,
        lastBookedAt: booking.scheduledFor
      };

      current.bookingsCount += 1;
      current.attendedCount += isBookingAttended(booking) ? 1 : 0;
      current.revenue += booking.paymentState === "paid" ? booking.amount : 0;
      current.lastBookedAt =
        !current.lastBookedAt || new Date(booking.scheduledFor).getTime() > new Date(current.lastBookedAt).getTime()
          ? booking.scheduledFor
          : current.lastBookedAt;

      map.set(booking.programId, current);
      return map;
    }, new Map());
  const classPopularity = Array.from(classPopularityMap.values())
    .map((entry) => ({
      ...entry,
      attendanceRate: entry.bookingsCount ? Math.round((entry.attendedCount / entry.bookingsCount) * 100) : 0
    }))
    .sort((left, right) => {
      if (right.bookingsCount !== left.bookingsCount) {
        return right.bookingsCount - left.bookingsCount;
      }

      return right.revenue - left.revenue;
    });
  const attendanceTrends = getDayRangeKeys(10).map((dateKey) => {
    const dayBookings = trackedBookings.filter((booking) => {
      return isActiveBooking(booking) && getUtcDateKey(booking.scheduledFor) === dateKey;
    });

    return {
      date: dateKey,
      label: formatTrendDate(dateKey),
      bookedCount: dayBookings.length,
      attendedCount: dayBookings.filter(isBookingAttended).length
    };
  });
  const topChallenges = challenges
    .map((challenge) => {
      const participants = trackedChallengeProgress.filter((entry) => entry.challengeId === challenge.id);
      const completions = participants.filter((entry) => entry.progressValue >= challenge.targetValue).length;

      return {
        challengeId: challenge.id,
        title: challenge.title,
        participants: participants.length,
        completions,
        completionRate: participants.length ? Math.round((completions / participants.length) * 100) : 0
      };
    })
    .filter((challenge) => challenge.participants > 0)
    .sort((left, right) => {
      if (right.participants !== left.participants) {
        return right.participants - left.participants;
      }

      return right.completions - left.completions;
    });
  const engagementTrend = getDayRangeKeys(10).map((dateKey) => {
    const loginCount = trackedLogins.filter((event) => event.loginDay === dateKey).length;
    const bookingCount = trackedBookings.filter((booking) => getUtcDateKey(booking.createdAt) === dateKey).length;
    const challengeCheckIns = trackedChallengeProgress.filter((entry) => {
      const activityDate = entry.lastCheckInAt ?? entry.updatedAt;
      return activityDate ? getUtcDateKey(activityDate) === dateKey : false;
    }).length;

    return {
      date: dateKey,
      label: formatTrendDate(dateKey),
      loginCount,
      bookingCount,
      challengeCheckIns
    };
  });
  const topProgramsMap = [...last30DayPaidBookings]
    .reduce<Map<string, AdminDashboardSnapshot["revenue"]["topPrograms"][number]>>((map, booking) => {
      const current = map.get(booking.programId) ?? {
        programId: booking.programId,
        programName: booking.programName,
        revenue: 0,
        paidBookings: 0
      };

      current.revenue += booking.amount;
      current.paidBookings += 1;
      map.set(booking.programId, current);
      return map;
    }, new Map());
  const topPrograms = Array.from(topProgramsMap.values()).sort((left, right) => right.revenue - left.revenue);

  return {
    summary: {
      totalMembers: trackedMembers.length,
      activeMembers: trackedMembers.filter((member) => member.membershipStatus !== "past-due").length,
      uniqueLogins7d,
      bookings30d: last30DayBookings.filter(isActiveBooking).length,
      collectedRevenue30d,
      renewalsDue7d: dueThisWeek.length
    },
    classPopularity,
    attendanceTrends,
    engagement: {
      totalLoginEvents7d: trackedLogins.filter((event) => isWithinTrailingDays(event.loggedInAt, 7)).length,
      bookingMembers30d: new Set(last30DayBookings.filter(isActiveBooking).map((booking) => booking.memberId)).size,
      challengeParticipants: new Set(trackedChallengeProgress.map((entry) => entry.memberId)).size,
      challengeCompletions: trackedChallengeProgress.filter((entry) => {
        const challenge = challenges.find((item) => item.id === entry.challengeId);
        return challenge ? entry.progressValue >= challenge.targetValue : false;
      }).length,
      trend: engagementTrend,
      topChallenges: topChallenges.slice(0, 4)
    },
    revenue: {
      collected30d: collectedRevenue30d,
      pending30d: last30DayPendingBookings.reduce((sum, booking) => sum + booking.amount, 0),
      paidBookings30d: last30DayPaidBookings.length,
      averagePaidBookingValue: last30DayPaidBookings.length
        ? Math.round(collectedRevenue30d / last30DayPaidBookings.length)
        : 0,
      topPrograms: topPrograms.slice(0, 4)
    },
    renewals: {
      active: trackedMembers.filter((member) => member.membershipStatus === "active").length,
      renewingSoon: trackedMembers.filter((member) => member.membershipStatus === "renewing-soon").length,
      pastDue: trackedMembers.filter((member) => member.membershipStatus === "past-due").length,
      dueThisWeek,
      overdueMembers
    }
  };
}

export function watchMemberSession(
  onResolved: (member: MemberProfile | null) => Promise<void> | void,
  onSettled: () => void
) {
  if (!supabaseEnabled || !supabase) {
    const demoMember = getDemoMember();
    if (demoMember) {
      void safeRecordMemberLoginActivity(demoMember);
    }

    Promise.resolve(onResolved(demoMember)).finally(onSettled);
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

    void safeRecordMemberLoginActivity(member);
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

export function subscribeToWorkoutLibrary(memberId: string, onChange: () => void) {
  if (!supabaseEnabled || !supabase) {
    return () => {};
  }

  const channel = supabase
    .channel(`workout-library:${memberId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "workout_library" }, onChange)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "member_workout_activity", filter: `member_id=eq.${memberId}` },
      onChange
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "member_progress", filter: `member_id=eq.${memberId}` },
      onChange
    )
    .subscribe((status, error) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error("Supabase realtime workout subscription issue.", status, error);
      }
    });

  return () => {
    void supabase.removeChannel(channel as RealtimeChannel);
  };
}

export function subscribeToCommunity(onChange: () => void) {
  if (!supabaseEnabled || !supabase) {
    return () => {};
  }

  const channel = supabase
    .channel("community-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "community_challenges" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "member_challenge_progress" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "community_forum_threads" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "community_forum_comments" }, onChange)
    .subscribe((status, error) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error("Supabase realtime community subscription issue.", status, error);
      }
    });

  return () => {
    void supabase.removeChannel(channel as RealtimeChannel);
  };
}

export function subscribeToAdminDashboard(onChange: () => void) {
  if (!supabaseEnabled || !supabase) {
    return () => {};
  }

  const channel = supabase
    .channel("admin-dashboard-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "community_challenges" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "member_challenge_progress" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "member_login_activity" }, onChange)
    .subscribe((status, error) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error("Supabase realtime admin dashboard subscription issue.", status, error);
      }
    });

  return () => {
    void supabase.removeChannel(channel as RealtimeChannel);
  };
}

export async function getMemberLoginActivity() {
  if (!supabaseEnabled || !supabase) {
    return getDemoLoginActivity().sort((left, right) => {
      return new Date(right.loggedInAt).getTime() - new Date(left.loggedInAt).getTime();
    });
  }

  const { data, error } = await supabase
    .from("member_login_activity")
    .select("*")
    .order("logged_in_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((event) => memberLoginActivityRowToEvent(event as MemberLoginActivityRow));
}

export async function getAdminDashboardSnapshot(member: MemberProfile) {
  if (!isGymOwner(member)) {
    throw new Error("Only gym owner accounts can access the admin dashboard.");
  }

  if (!supabaseEnabled || !supabase) {
    return createAdminDashboardSnapshot(
      member,
      getDemoAllMembers(),
      getDemoAllBookings(),
      communityChallenges,
      getDemoChallengeProgress(),
      getDemoLoginActivity()
    );
  }

  const [profilesResult, bookingsResult, challenges, challengeProgress, loginActivity] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("bookings").select("*"),
    getCommunityChallenges(),
    getChallengeProgress(),
    getMemberLoginActivity()
  ]);

  if (profilesResult.error) {
    throw new Error(profilesResult.error.message);
  }

  if (bookingsResult.error) {
    throw new Error(bookingsResult.error.message);
  }

  return createAdminDashboardSnapshot(
    member,
    (profilesResult.data ?? []).map((profile) => profileRowToMember(profile as ProfileRow)),
    (bookingsResult.data ?? []).map((booking) => bookingRowToRecord(booking as BookingRow)),
    challenges,
    challengeProgress,
    loginActivity
  );
}

export async function getCommunityChallenges() {
  if (!supabaseEnabled || !supabase) {
    return createDemoCommunityChallenges();
  }

  const { data, error } = await supabase
    .from("community_challenges")
    .select("*")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("starts_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((challenge) => communityChallengeRowToChallenge(challenge as CommunityChallengeRow));
}

export async function getChallengeProgress(challengeId?: string) {
  if (!supabaseEnabled || !supabase) {
    return getDemoChallengeProgress(challengeId);
  }

  let query = supabase
    .from("member_challenge_progress")
    .select("*")
    .order("progress_value", { ascending: false })
    .order("updated_at", { ascending: true });

  if (challengeId) {
    query = query.eq("challenge_id", challengeId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((entry) => memberChallengeProgressRowToProgress(entry as MemberChallengeProgressRow));
}

export async function getCommunityThreads() {
  if (!supabaseEnabled || !supabase) {
    return getDemoForumThreads().sort((left, right) => {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }

  const { data, error } = await supabase
    .from("community_forum_threads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((thread) => communityForumThreadRowToThread(thread as CommunityForumThreadRow));
}

export async function getCommunityComments(threadId?: string) {
  if (!supabaseEnabled || !supabase) {
    const comments = getDemoForumComments(threadId);
    return comments.sort((left, right) => {
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    });
  }

  let query = supabase
    .from("community_forum_comments")
    .select("*")
    .order("created_at", { ascending: true });

  if (threadId) {
    query = query.eq("thread_id", threadId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((comment) => communityForumCommentRowToComment(comment as CommunityForumCommentRow));
}

export async function getCommunitySnapshot() {
  const [challenges, challengeProgress, threads, comments] = await Promise.all([
    getCommunityChallenges(),
    getChallengeProgress(),
    getCommunityThreads(),
    getCommunityComments()
  ]);

  return {
    challenges,
    challengeProgress,
    threads,
    comments
  } satisfies CommunitySnapshot;
}

async function getOrCreateChallengeProgress(member: MemberProfile, challenge: CommunityChallenge) {
  const existing = (await getChallengeProgress(challenge.id)).find((entry) => entry.memberId === member.uid);
  if (existing) {
    return existing;
  }

  return {
    memberId: member.uid,
    memberName: member.fullName,
    challengeId: challenge.id,
    progressValue: 0,
    streakDays: 0,
    joinedAt: isoNow(),
    updatedAt: isoNow()
  } satisfies MemberChallengeProgress;
}

export async function joinCommunityChallenge(member: MemberProfile, challenge: CommunityChallenge) {
  const current = await getOrCreateChallengeProgress(member, challenge);
  const joinedProgress = {
    ...current,
    memberName: member.fullName,
    joinedAt: current.joinedAt ?? isoNow(),
    updatedAt: isoNow()
  } satisfies MemberChallengeProgress;

  if (!supabaseEnabled || !supabase) {
    return upsertDemoChallengeProgress(joinedProgress);
  }

  const { data, error } = await supabase
    .from("member_challenge_progress")
    .upsert(memberChallengeProgressToRow(joinedProgress), { onConflict: "member_id,challenge_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return memberChallengeProgressRowToProgress(data as MemberChallengeProgressRow);
}

export async function saveChallengeProgress(
  member: MemberProfile,
  challenge: CommunityChallenge,
  progressValue: number
) {
  const current = await getOrCreateChallengeProgress(member, challenge);
  const checkedInAt = isoNow();
  const nextProgressValue = Math.max(current.progressValue, progressValue);

  let nextStreak = current.streakDays;
  if (!current.lastCheckInAt) {
    nextStreak = 1;
  } else if (isSameUtcDay(current.lastCheckInAt, checkedInAt)) {
    nextStreak = current.streakDays || 1;
  } else if (isPreviousUtcDay(current.lastCheckInAt, checkedInAt)) {
    nextStreak = current.streakDays + 1;
  } else {
    nextStreak = 1;
  }

  const nextProgress = {
    ...current,
    memberName: member.fullName,
    progressValue: nextProgressValue,
    streakDays: nextStreak,
    lastCheckInAt: checkedInAt,
    completedAt: nextProgressValue >= challenge.targetValue ? current.completedAt ?? checkedInAt : current.completedAt,
    updatedAt: checkedInAt
  } satisfies MemberChallengeProgress;

  if (!supabaseEnabled || !supabase) {
    return upsertDemoChallengeProgress(nextProgress);
  }

  const { data, error } = await supabase
    .from("member_challenge_progress")
    .upsert(memberChallengeProgressToRow(nextProgress), { onConflict: "member_id,challenge_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return memberChallengeProgressRowToProgress(data as MemberChallengeProgressRow);
}

export async function createCommunityThread(
  member: MemberProfile,
  input: { title: string; body: string; category: string }
) {
  const nextThread = {
    id: createId("thread"),
    threadKey: createId("thread-key"),
    memberId: member.uid,
    memberName: member.fullName,
    title: input.title,
    body: input.body,
    category: input.category,
    createdAt: isoNow(),
    updatedAt: isoNow()
  } satisfies CommunityForumThread;

  if (!supabaseEnabled || !supabase) {
    return upsertDemoForumThread(nextThread);
  }

  const { data, error } = await supabase
    .from("community_forum_threads")
    .insert(communityForumThreadToRow(nextThread))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return communityForumThreadRowToThread(data as CommunityForumThreadRow);
}

export async function createCommunityComment(member: MemberProfile, threadId: string, body: string) {
  const nextComment = {
    id: createId("comment"),
    threadId,
    memberId: member.uid,
    memberName: member.fullName,
    body,
    createdAt: isoNow()
  } satisfies CommunityForumComment;

  if (!supabaseEnabled || !supabase) {
    return saveDemoForumComment(nextComment);
  }

  const { data, error } = await supabase
    .from("community_forum_comments")
    .insert(communityForumCommentToRow(nextComment))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return communityForumCommentRowToComment(data as CommunityForumCommentRow);
}

export async function getWorkoutLibrary() {
  if (!supabaseEnabled || !supabase) {
    return createDemoWorkoutLibrary();
  }

  const { data, error } = await supabase
    .from("workout_library")
    .select("*")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("title", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((workout) => workoutLibraryRowToWorkout(workout as WorkoutLibraryRow));
}

export async function getMemberWorkoutActivity(memberId: string) {
  if (!supabaseEnabled || !supabase) {
    return getDemoWorkoutActivity(memberId);
  }

  const { data, error } = await supabase
    .from("member_workout_activity")
    .select("*")
    .eq("member_id", memberId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((activity) => memberWorkoutActivityRowToActivity(activity as MemberWorkoutActivityRow));
}

export async function getWorkoutLibrarySnapshot(memberId: string) {
  const [workouts, activity, progress] = await Promise.all([
    getWorkoutLibrary(),
    getMemberWorkoutActivity(memberId),
    getMemberProgress(memberId)
  ]);

  return {
    workouts,
    activity,
    progress: progress ?? (await ensureMemberProgress(memberId))
  } satisfies WorkoutLibrarySnapshot;
}

export async function toggleFavoriteWorkout(memberId: string, workoutId: string, favorited: boolean) {
  const currentActivity = await getOrCreateMemberWorkoutActivity(memberId, workoutId);
  const nextActivity = {
    ...currentActivity,
    favorited,
    updatedAt: isoNow()
  } satisfies MemberWorkoutActivity;

  if (!supabaseEnabled || !supabase) {
    return upsertDemoWorkoutActivity(nextActivity);
  }

  const { data, error } = await supabase
    .from("member_workout_activity")
    .upsert(memberWorkoutActivityToRow(nextActivity), { onConflict: "member_id,workout_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return memberWorkoutActivityRowToActivity(data as MemberWorkoutActivityRow);
}

export async function completeWorkout(memberId: string, workout: WorkoutVideo) {
  const currentActivity = await getOrCreateMemberWorkoutActivity(memberId, workout.id);
  const completedAt = isoNow();
  const nextActivity = {
    ...currentActivity,
    completedCount: currentActivity.completedCount + 1,
    totalMinutesCompleted: currentActivity.totalMinutesCompleted + workout.durationMinutes,
    lastCompletedAt: completedAt,
    updatedAt: completedAt
  } satisfies MemberWorkoutActivity;

  if (!supabaseEnabled || !supabase) {
    upsertDemoWorkoutActivity(nextActivity);
    await incrementWorkoutCompletionProgress(memberId, workout);
    return nextActivity;
  }

  const activityResult = await supabase
    .from("member_workout_activity")
    .upsert(memberWorkoutActivityToRow(nextActivity), { onConflict: "member_id,workout_id" })
    .select("*")
    .single();

  if (activityResult.error) {
    throw new Error(activityResult.error.message);
  }

  await incrementWorkoutCompletionProgress(memberId, workout);
  return memberWorkoutActivityRowToActivity(activityResult.data as MemberWorkoutActivityRow);
}

export async function signUpMember(input: {
  fullName: string;
  email: string;
  password: string;
  goal: string;
  preferredWorkoutType: string;
}): Promise<SignUpMemberResult> {
  if (!supabaseEnabled || !supabase) {
    const demoMember = createDemoMember({
      ...input,
      plan: "Performance",
      authRole: "member"
    });
    void safeRecordMemberLoginActivity(demoMember);

    return {
      member: demoMember,
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

    void safeRecordMemberLoginActivity(member);
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
      void safeRecordMemberLoginActivity(demoMember);
      return demoMember;
    }

    const nextDemoMember = createDemoMember({
      fullName: email.split("@")[0].replace(/[._-]/g, " "),
      email,
      goal: "Stay active and look athletic",
      preferredWorkoutType: "Strength training",
      plan: "Performance",
      authRole: getDemoAuthRoleFromEmail(email)
    });
    void safeRecordMemberLoginActivity(nextDemoMember);
    return nextDemoMember;
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

  const member = await ensureMemberProfile(data.user);
  void safeRecordMemberLoginActivity(member);
  return member;
}

export async function signOutMember() {
  if (!supabaseEnabled || !supabase) {
    clearDemoMember();
    return;
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function getMemberProfile(uid: string) {
  if (!supabaseEnabled || !supabase) {
    const demoMember = getDemoMember();
    return demoMember?.uid === uid ? demoMember : null;
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
    const demoMember = await getMemberProfile(memberId);
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
  if (schedule.isFull) {
    throw new Error("This class is already full. Try another live slot.");
  }

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
