export type MembershipTier = "Starter" | "Performance" | "Elite";
export type MembershipStatus = "active" | "renewing-soon" | "past-due";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "awaiting-payment" | "pending-setup";

export type NotificationPreferences = {
  enabled: boolean;
  classReminders: boolean;
  goalNudges: boolean;
  membershipAlerts: boolean;
  specialEvents: boolean;
  pushSubscribed: boolean;
};

export type FitnessQuiz = {
  goal: string;
  preferredWorkoutType: string;
  completedAt: string;
};

export type MemberProgress = {
  memberId: string;
  weeklyWorkoutsCompleted: number;
  weeklyWorkoutGoal: number;
  weeklyCaloriesBurned: number;
  weeklyCalorieGoal: number;
  weekStart: string;
  updatedAt: string;
};

export type SessionProgram = {
  id: string;
  name: string;
  category: string;
  duration: string;
  intensity: string;
  coach: string;
  price: number;
  image: string;
  description: string;
};

export type ClassSchedule = {
  id: string;
  programId: string;
  title: string;
  trainer: string;
  intensity: string;
  location: string;
  startsAt: string;
  durationMinutes: number;
  description: string;
  image: string;
  caloriesTarget: number;
};

export type MemberProfile = {
  uid: string;
  fullName: string;
  email: string;
  plan: MembershipTier;
  fitnessGoal: string;
  preferredWorkoutType: string;
  quiz: FitnessQuiz;
  homeClub: string;
  experienceLevel: string;
  joinedOn: string;
  membershipStatus: MembershipStatus;
  renewalDate: string;
  notificationPreferences: NotificationPreferences;
  streakDays: number;
  sessionsCompleted: number;
  upcomingSession?: string;
  avatarSeed: string;
};

export type BookingRecord = {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  programId: string;
  programName: string;
  scheduledFor: string;
  coach: string;
  focus: string;
  amount: number;
  status: BookingStatus;
  paymentState: "unpaid" | "paid" | "pending-verification" | "disabled";
  location: string;
  scheduleId?: string;
  intensity?: string;
  classImage?: string;
  caloriesTarget?: number;
  attendedAt?: string;
  txRef?: string;
  transactionId?: string;
  createdAt: string;
};

export type PaymentVerification = {
  status: "success" | "pending";
  paymentState: BookingRecord["paymentState"];
  txRef?: string;
  transactionId?: string;
};
