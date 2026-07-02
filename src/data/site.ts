import type {
  AuthRole,
  BookingRecord,
  CommunityChallenge,
  CommunityForumComment,
  CommunityForumThread,
  MemberChallengeProgress,
  MemberLoginActivity,
  MemberProfile,
  MembershipTier,
  SessionProgram,
  WorkoutVideo
} from "@/types/app";

export const membershipPlans: Array<{
  name: MembershipTier;
  price: string;
  accent: string;
  description: string;
  perks: string[];
}> = [
  {
    name: "Starter",
    price: "₦18,000",
    accent: "Gym floor access",
    description: "A clean, focused plan for members building consistency and confidence.",
    perks: ["Open gym access", "Welcome assessment", "2 class credits monthly", "Locker support"]
  },
  {
    name: "Performance",
    price: "₦32,000",
    accent: "Best for momentum",
    description: "Our most-loved plan for members who want structure, coaching, and visible progress.",
    perks: ["Everything in Starter", "4 coached sessions", "Nutrition check-ins", "Priority class slots"]
  },
  {
    name: "Elite",
    price: "₦58,000",
    accent: "White-glove training",
    description: "High-touch support for busy members who want faster progress and premium access.",
    perks: ["Unlimited access", "Weekly personal coaching", "Recovery consults", "VIP booking priority"]
  }
];

export const sessionPrograms: SessionProgram[] = [
  {
    id: "strength-lab",
    name: "Strength Lab",
    category: "Power",
    duration: "60 min",
    intensity: "High",
    coach: "Coach Amara",
    price: 15000,
    image: "/media/strength-zone.png",
    description: "Barbell strength, glute development, and form-focused lifting blocks."
  },
  {
    id: "ignite-hiit",
    name: "Ignite HIIT",
    category: "Conditioning",
    duration: "45 min",
    intensity: "Explosive",
    coach: "Coach Tobe",
    price: 12000,
    image: "/media/ignite-hiit.png",
    description: "Fast-paced cardio and metabolic circuits for fat loss and engine-building."
  },
  {
    id: "mobility-reset",
    name: "Mobility Reset",
    category: "Recovery",
    duration: "50 min",
    intensity: "Low",
    coach: "Coach Nneka",
    price: 10000,
    image: "/media/mobility-reset.png",
    description: "Deep stretch, mobility flows, and recovery work for active bodies."
  },
  {
    id: "women-sculpt",
    name: "Women Sculpt",
    category: "Body Recomp",
    duration: "55 min",
    intensity: "Moderate",
    coach: "Coach Adaeze",
    price: 14000,
    image: "/media/women-sculpt.png",
    description: "Lower-body strength, core definition, and technique-led sculpt programming."
  }
];

export const workoutLibraryCatalog: WorkoutVideo[] = [
  {
    id: "demo-pulse-burn-28",
    workoutKey: "pulse-burn-28",
    title: "Pulse Burn 28",
    trainer: "Coach Tobe",
    category: "Cardio Conditioning",
    intensity: "Explosive",
    durationMinutes: 28,
    description: "A fast-moving metabolic session for members who want an efficient calorie burn without leaving home.",
    videoUrl: "/media/codec-test.mp4",
    posterImage: "/media/group-energy.png",
    targetGoal: "Fat loss and cardio endurance",
    caloriesBurn: 360,
    equipment: ["Mat", "Bodyweight"],
    tags: ["hiit", "cardio", "fat loss", "conditioning", "quick"],
    featured: true
  },
  {
    id: "demo-strength-foundations-42",
    workoutKey: "strength-foundations-42",
    title: "Strength Foundations 42",
    trainer: "Coach Amara",
    category: "Strength",
    intensity: "High",
    durationMinutes: 42,
    description: "Form-first dumbbell strength work focused on lower body power, posture, and progression.",
    videoUrl: "/media/codec-test.mp4",
    posterImage: "/media/strength-zone.png",
    targetGoal: "Build strength and muscle tone",
    caloriesBurn: 410,
    equipment: ["Dumbbells", "Bench"],
    tags: ["strength", "glutes", "lower body", "muscle", "progressive overload"],
    featured: true
  },
  {
    id: "demo-core-sculpt-flow-24",
    workoutKey: "core-sculpt-flow-24",
    title: "Core Sculpt Flow",
    trainer: "Coach Adaeze",
    category: "Core Training",
    intensity: "Moderate",
    durationMinutes: 24,
    description: "Low-impact core sculpting designed to sharpen control, posture, and deep abdominal engagement.",
    videoUrl: "/media/codec-test.mp4",
    posterImage: "/media/women-sculpt.png",
    targetGoal: "Core definition and body recomposition",
    caloriesBurn: 220,
    equipment: ["Mat"],
    tags: ["core", "definition", "waist", "low impact", "body recomp"],
    featured: false
  },
  {
    id: "demo-mobility-reset-18",
    workoutKey: "mobility-reset-18",
    title: "Mobility Reset 18",
    trainer: "Coach Nneka",
    category: "Recovery",
    intensity: "Low",
    durationMinutes: 18,
    description: "A guided reset for stiff hips, tired shoulders, and recovery days between harder sessions.",
    videoUrl: "/media/codec-test.mp4",
    posterImage: "/media/mobility-reset.png",
    targetGoal: "Recovery and movement quality",
    caloriesBurn: 120,
    equipment: ["Mat", "Mini band"],
    tags: ["mobility", "recovery", "stretch", "flexibility", "rest day"],
    featured: false
  },
  {
    id: "demo-athlete-engine-35",
    workoutKey: "athlete-engine-35",
    title: "Athlete Engine 35",
    trainer: "Coach Tobe",
    category: "Performance",
    intensity: "High",
    durationMinutes: 35,
    description: "Explosive intervals, athletic footwork, and engine-building rounds for performance-minded members.",
    videoUrl: "/media/codec-test.mp4",
    posterImage: "/media/hero-still.png",
    targetGoal: "Athletic performance and endurance",
    caloriesBurn: 440,
    equipment: ["Bodyweight", "Agility markers"],
    tags: ["athletic", "performance", "speed", "power", "endurance"],
    featured: true
  },
  {
    id: "demo-glute-lift-lab-30",
    workoutKey: "glute-lift-lab-30",
    title: "Glute Lift Lab 30",
    trainer: "Coach Adaeze",
    category: "Lower Body",
    intensity: "Moderate",
    durationMinutes: 30,
    description: "A glute-focused routine combining tempo work, unilateral strength, and controlled finishers.",
    videoUrl: "/media/codec-test.mp4",
    posterImage: "/media/women-sculpt.png",
    targetGoal: "Lower-body shaping and strength",
    caloriesBurn: 330,
    equipment: ["Dumbbells", "Mini band"],
    tags: ["glutes", "lower body", "toning", "strength", "women"],
    featured: false
  }
];

export const communityChallenges: CommunityChallenge[] = [
  {
    id: "demo-plank-challenge",
    challengeKey: "plank-30-day-challenge",
    title: "30-Day Plank Challenge",
    description: "Build serious core endurance by adding to your plank hold across thirty focused days.",
    metricLabel: "Best plank hold",
    metricUnit: "sec",
    targetValue: 300,
    durationDays: 30,
    coverImage: "/media/group-energy.png",
    shareHashtag: "#XfitnessPlank30",
    sharePrompt: "Show your plank timer, tag your training partner, and challenge them to beat your hold.",
    startsAt: "2026-06-01T00:00:00.000Z",
    endsAt: "2026-06-30T23:59:59.000Z",
    featured: true
  },
  {
    id: "demo-mobility-streak",
    challengeKey: "mobility-reset-streak",
    title: "14-Day Mobility Reset",
    description: "Turn recovery into a habit with daily mobility check-ins designed for sore hips and shoulders.",
    metricLabel: "Days completed",
    metricUnit: "days",
    targetValue: 14,
    durationDays: 14,
    coverImage: "/media/mobility-reset.png",
    shareHashtag: "#XfitnessMobilityReset",
    sharePrompt: "Share your recovery ritual and invite a friend to protect their training longevity.",
    startsAt: "2026-06-10T00:00:00.000Z",
    endsAt: "2026-06-24T23:59:59.000Z",
    featured: false
  },
  {
    id: "demo-burpee-sprint",
    challengeKey: "burpee-power-sprint",
    title: "100 Burpee Power Sprint",
    description: "Track your fastest route to 100 burpees and climb the conditioning leaderboard.",
    metricLabel: "Burpees completed",
    metricUnit: "reps",
    targetValue: 100,
    durationDays: 7,
    coverImage: "/media/hero-still.png",
    shareHashtag: "#XfitnessPowerSprint",
    sharePrompt: "Post your final rep count and invite your crew to take on the sprint.",
    startsAt: "2026-06-21T00:00:00.000Z",
    endsAt: "2026-06-28T23:59:59.000Z",
    featured: false
  }
];

export const demoCommunityChallengeProgress: MemberChallengeProgress[] = [
  {
    memberId: "demo-member-amaka",
    memberName: "Amaka O.",
    challengeId: "demo-plank-challenge",
    progressValue: 245,
    streakDays: 9,
    joinedAt: "2026-06-02T07:15:00.000Z",
    lastCheckInAt: "2026-06-26T18:20:00.000Z",
    updatedAt: "2026-06-26T18:20:00.000Z"
  },
  {
    memberId: "demo-member-kingsley",
    memberName: "Kingsley E.",
    challengeId: "demo-plank-challenge",
    progressValue: 210,
    streakDays: 7,
    joinedAt: "2026-06-04T06:10:00.000Z",
    lastCheckInAt: "2026-06-25T19:10:00.000Z",
    updatedAt: "2026-06-25T19:10:00.000Z"
  },
  {
    memberId: "demo-member-zara",
    memberName: "Zara I.",
    challengeId: "demo-mobility-streak",
    progressValue: 12,
    streakDays: 12,
    joinedAt: "2026-06-10T08:00:00.000Z",
    lastCheckInAt: "2026-06-22T08:00:00.000Z",
    updatedAt: "2026-06-22T08:00:00.000Z"
  },
  {
    memberId: "demo-member-david",
    memberName: "David T.",
    challengeId: "demo-burpee-sprint",
    progressValue: 88,
    streakDays: 4,
    joinedAt: "2026-06-22T05:00:00.000Z",
    lastCheckInAt: "2026-06-27T05:00:00.000Z",
    updatedAt: "2026-06-27T05:00:00.000Z"
  }
];

export const demoCommunityForumThreads: CommunityForumThread[] = [
  {
    id: "demo-thread-core-burn",
    threadKey: "core-burn-roll-call",
    memberId: "demo-member-amaka",
    memberName: "Amaka O.",
    title: "What is helping you survive the plank challenge?",
    body: "Breathing rhythm has been the difference for me. Curious what cues everyone else is using when the shake starts.",
    category: "Challenges",
    createdAt: "2026-06-24T09:30:00.000Z",
    updatedAt: "2026-06-24T09:30:00.000Z"
  },
  {
    id: "demo-thread-creator-roll-call",
    threadKey: "creator-roll-call",
    memberId: "demo-member-zara",
    memberName: "Zara I.",
    title: "Who is posting their progress on Instagram or TikTok this week?",
    body: "I want to repost members doing the mobility reset. Drop your angle ideas and what format is getting the best responses.",
    category: "Social",
    createdAt: "2026-06-25T14:00:00.000Z",
    updatedAt: "2026-06-25T14:00:00.000Z"
  }
];

export const demoCommunityForumComments: CommunityForumComment[] = [
  {
    id: "demo-comment-core-1",
    threadId: "demo-thread-core-burn",
    memberId: "demo-member-kingsley",
    memberName: "Kingsley E.",
    body: "I exhale hard at the halfway point and stare at one spot. It stops me from counting down too early.",
    createdAt: "2026-06-24T10:05:00.000Z"
  },
  {
    id: "demo-comment-core-2",
    threadId: "demo-thread-core-burn",
    memberId: "demo-member-david",
    memberName: "David T.",
    body: "Timer on the floor where I cannot see it. My coach says that removes panic.",
    createdAt: "2026-06-24T10:18:00.000Z"
  },
  {
    id: "demo-comment-social-1",
    threadId: "demo-thread-creator-roll-call",
    memberId: "demo-member-amaka",
    memberName: "Amaka O.",
    body: "Short before-and-after clips plus a caption about how many seconds you added works surprisingly well.",
    createdAt: "2026-06-25T15:12:00.000Z"
  }
];

const demoMemberRole: AuthRole = "member";
const demoOwnerRole: AuthRole = "gym_owner";

export const demoAdminMembers: MemberProfile[] = [
  {
    uid: "demo-owner-maya",
    fullName: "Maya Okafor",
    email: "owner@xfitness.club",
    authRole: demoOwnerRole,
    plan: "Elite",
    fitnessGoal: "Lead the club with strong systems and stronger habits",
    preferredWorkoutType: "Strength training",
    quiz: {
      goal: "Lead the club with strong systems and stronger habits",
      preferredWorkoutType: "Strength training",
      completedAt: "2026-05-01T09:00:00.000Z"
    },
    homeClub: "Xfitness Enugu",
    experienceLevel: "Founder track",
    joinedOn: "2026-05-01T09:00:00.000Z",
    membershipStatus: "active",
    renewalDate: "2026-07-09T09:00:00.000Z",
    notificationPreferences: {
      enabled: true,
      classReminders: true,
      goalNudges: true,
      membershipAlerts: true,
      specialEvents: true,
      pushSubscribed: true
    },
    streakDays: 20,
    sessionsCompleted: 11,
    upcomingSession: "2026-06-30T18:00:00.000Z",
    avatarSeed: "maya-okafor"
  },
  {
    uid: "demo-member-amaka",
    fullName: "Amaka O.",
    email: "amaka@xfitness.club",
    authRole: demoMemberRole,
    plan: "Performance",
    fitnessGoal: "Build strength and sharpen my core",
    preferredWorkoutType: "Strength training",
    quiz: {
      goal: "Build strength and sharpen my core",
      preferredWorkoutType: "Strength training",
      completedAt: "2026-04-12T08:10:00.000Z"
    },
    homeClub: "Xfitness Enugu",
    experienceLevel: "Performance track",
    joinedOn: "2026-04-12T08:10:00.000Z",
    membershipStatus: "renewing-soon",
    renewalDate: "2026-07-02T08:10:00.000Z",
    notificationPreferences: {
      enabled: true,
      classReminders: true,
      goalNudges: true,
      membershipAlerts: true,
      specialEvents: false,
      pushSubscribed: true
    },
    streakDays: 14,
    sessionsCompleted: 9,
    upcomingSession: "2026-06-29T18:00:00.000Z",
    avatarSeed: "amaka-o"
  },
  {
    uid: "demo-member-kingsley",
    fullName: "Kingsley E.",
    email: "kingsley@xfitness.club",
    authRole: demoMemberRole,
    plan: "Elite",
    fitnessGoal: "Train for power and stamina",
    preferredWorkoutType: "HIIT and cardio",
    quiz: {
      goal: "Train for power and stamina",
      preferredWorkoutType: "HIIT and cardio",
      completedAt: "2026-03-08T07:45:00.000Z"
    },
    homeClub: "Xfitness Independence Layout",
    experienceLevel: "Advanced engine",
    joinedOn: "2026-03-08T07:45:00.000Z",
    membershipStatus: "active",
    renewalDate: "2026-07-06T07:45:00.000Z",
    notificationPreferences: {
      enabled: true,
      classReminders: true,
      goalNudges: true,
      membershipAlerts: true,
      specialEvents: true,
      pushSubscribed: false
    },
    streakDays: 10,
    sessionsCompleted: 13,
    upcomingSession: undefined,
    avatarSeed: "kingsley-e"
  },
  {
    uid: "demo-member-zara",
    fullName: "Zara I.",
    email: "zara@xfitness.club",
    authRole: demoMemberRole,
    plan: "Starter",
    fitnessGoal: "Recover well and stay consistent",
    preferredWorkoutType: "Yoga and mobility",
    quiz: {
      goal: "Recover well and stay consistent",
      preferredWorkoutType: "Yoga and mobility",
      completedAt: "2026-05-15T11:20:00.000Z"
    },
    homeClub: "Xfitness Trans-Ekulu",
    experienceLevel: "Reset mode",
    joinedOn: "2026-05-15T11:20:00.000Z",
    membershipStatus: "active",
    renewalDate: "2026-07-15T11:20:00.000Z",
    notificationPreferences: {
      enabled: false,
      classReminders: true,
      goalNudges: true,
      membershipAlerts: true,
      specialEvents: false,
      pushSubscribed: false
    },
    streakDays: 12,
    sessionsCompleted: 6,
    upcomingSession: "2026-07-01T17:00:00.000Z",
    avatarSeed: "zara-i"
  },
  {
    uid: "demo-member-david",
    fullName: "David T.",
    email: "david@xfitness.club",
    authRole: demoMemberRole,
    plan: "Performance",
    fitnessGoal: "Drop fat and improve conditioning",
    preferredWorkoutType: "Weight loss circuits",
    quiz: {
      goal: "Drop fat and improve conditioning",
      preferredWorkoutType: "Weight loss circuits",
      completedAt: "2026-02-01T06:30:00.000Z"
    },
    homeClub: "Xfitness Enugu",
    experienceLevel: "Momentum rebuild",
    joinedOn: "2026-02-01T06:30:00.000Z",
    membershipStatus: "past-due",
    renewalDate: "2026-06-26T06:30:00.000Z",
    notificationPreferences: {
      enabled: true,
      classReminders: true,
      goalNudges: false,
      membershipAlerts: true,
      specialEvents: false,
      pushSubscribed: false
    },
    streakDays: 4,
    sessionsCompleted: 5,
    upcomingSession: undefined,
    avatarSeed: "david-t"
  }
];

export const demoAdminBookings: BookingRecord[] = [
  {
    id: "demo-admin-booking-1",
    memberId: "demo-member-amaka",
    memberName: "Amaka O.",
    memberEmail: "amaka@xfitness.club",
    programId: "strength-lab",
    programName: "Strength Lab",
    scheduledFor: "2026-06-16T18:00:00.000Z",
    coach: "Coach Amara",
    focus: "Barbell strength, glute development, and form-focused lifting blocks.",
    amount: 15000,
    status: "completed",
    paymentState: "paid",
    location: "Xfitness Enugu",
    scheduleId: "demo-strength-lab-monday-evening",
    intensity: "High",
    classImage: "/media/strength-zone.png",
    caloriesTarget: 520,
    attendedAt: "2026-06-16T19:05:00.000Z",
    createdAt: "2026-06-15T11:00:00.000Z"
  },
  {
    id: "demo-admin-booking-2",
    memberId: "demo-member-kingsley",
    memberName: "Kingsley E.",
    memberEmail: "kingsley@xfitness.club",
    programId: "ignite-hiit",
    programName: "Ignite HIIT",
    scheduledFor: "2026-06-17T07:00:00.000Z",
    coach: "Coach Tobe",
    focus: "Fast-paced cardio and metabolic circuits for fat loss and engine-building.",
    amount: 12000,
    status: "completed",
    paymentState: "paid",
    location: "Xfitness Independence Layout",
    scheduleId: "demo-ignite-hiit-tuesday-morning",
    intensity: "Explosive",
    classImage: "/media/ignite-hiit.png",
    caloriesTarget: 610,
    attendedAt: "2026-06-17T07:50:00.000Z",
    createdAt: "2026-06-16T10:20:00.000Z"
  },
  {
    id: "demo-admin-booking-3",
    memberId: "demo-member-zara",
    memberName: "Zara I.",
    memberEmail: "zara@xfitness.club",
    programId: "mobility-reset",
    programName: "Mobility Reset",
    scheduledFor: "2026-06-18T17:00:00.000Z",
    coach: "Coach Nneka",
    focus: "Deep stretch, mobility flows, and recovery work for active bodies.",
    amount: 10000,
    status: "completed",
    paymentState: "paid",
    location: "Xfitness Enugu",
    scheduleId: "demo-mobility-reset-wednesday-evening",
    intensity: "Low",
    classImage: "/media/mobility-reset.png",
    caloriesTarget: 260,
    attendedAt: "2026-06-18T17:55:00.000Z",
    createdAt: "2026-06-17T13:00:00.000Z"
  },
  {
    id: "demo-admin-booking-4",
    memberId: "demo-member-amaka",
    memberName: "Amaka O.",
    memberEmail: "amaka@xfitness.club",
    programId: "women-sculpt",
    programName: "Women Sculpt",
    scheduledFor: "2026-06-19T18:00:00.000Z",
    coach: "Coach Adaeze",
    focus: "Lower-body strength, core definition, and technique-led sculpt programming.",
    amount: 14000,
    status: "completed",
    paymentState: "paid",
    location: "Xfitness Trans-Ekulu",
    scheduleId: "demo-women-sculpt-thursday-evening",
    intensity: "Moderate",
    classImage: "/media/women-sculpt.png",
    caloriesTarget: 430,
    attendedAt: "2026-06-19T18:58:00.000Z",
    createdAt: "2026-06-18T08:20:00.000Z"
  },
  {
    id: "demo-admin-booking-5",
    memberId: "demo-member-david",
    memberName: "David T.",
    memberEmail: "david@xfitness.club",
    programId: "ignite-hiit",
    programName: "Ignite HIIT",
    scheduledFor: "2026-06-20T08:00:00.000Z",
    coach: "Coach Tobe",
    focus: "Fast-paced cardio and metabolic circuits for fat loss and engine-building.",
    amount: 12000,
    status: "cancelled",
    paymentState: "unpaid",
    location: "Xfitness Independence Layout",
    scheduleId: "demo-strength-lab-saturday-morning",
    intensity: "Explosive",
    classImage: "/media/ignite-hiit.png",
    caloriesTarget: 610,
    createdAt: "2026-06-18T16:10:00.000Z"
  },
  {
    id: "demo-admin-booking-6",
    memberId: "demo-member-kingsley",
    memberName: "Kingsley E.",
    memberEmail: "kingsley@xfitness.club",
    programId: "strength-lab",
    programName: "Strength Lab",
    scheduledFor: "2026-06-21T08:00:00.000Z",
    coach: "Coach Amara",
    focus: "High-performance strength blocks with progressive overload and technique coaching.",
    amount: 15000,
    status: "completed",
    paymentState: "paid",
    location: "Xfitness Independence Layout",
    scheduleId: "demo-strength-lab-saturday-morning",
    intensity: "High",
    classImage: "/media/strength-zone.png",
    caloriesTarget: 540,
    attendedAt: "2026-06-21T09:06:00.000Z",
    createdAt: "2026-06-19T10:15:00.000Z"
  },
  {
    id: "demo-admin-booking-7",
    memberId: "demo-member-zara",
    memberName: "Zara I.",
    memberEmail: "zara@xfitness.club",
    programId: "mobility-reset",
    programName: "Mobility Reset",
    scheduledFor: "2026-06-22T09:00:00.000Z",
    coach: "Coach Nneka",
    focus: "Recovery-led mobility work to prep the next training week.",
    amount: 10000,
    status: "completed",
    paymentState: "paid",
    location: "Xfitness Enugu",
    scheduleId: "demo-mobility-reset-sunday-morning",
    intensity: "Low",
    classImage: "/media/mobility-reset.png",
    caloriesTarget: 240,
    attendedAt: "2026-06-22T09:42:00.000Z",
    createdAt: "2026-06-21T12:30:00.000Z"
  },
  {
    id: "demo-admin-booking-8",
    memberId: "demo-member-amaka",
    memberName: "Amaka O.",
    memberEmail: "amaka@xfitness.club",
    programId: "strength-lab",
    programName: "Strength Lab",
    scheduledFor: "2026-06-23T18:00:00.000Z",
    coach: "Coach Amara",
    focus: "Barbell strength, glute development, and form-focused lifting blocks.",
    amount: 15000,
    status: "completed",
    paymentState: "paid",
    location: "Xfitness Enugu",
    scheduleId: "demo-strength-lab-monday-evening",
    intensity: "High",
    classImage: "/media/strength-zone.png",
    caloriesTarget: 520,
    attendedAt: "2026-06-23T19:04:00.000Z",
    createdAt: "2026-06-22T09:12:00.000Z"
  },
  {
    id: "demo-admin-booking-9",
    memberId: "demo-owner-maya",
    memberName: "Maya Okafor",
    memberEmail: "owner@xfitness.club",
    programId: "women-sculpt",
    programName: "Women Sculpt",
    scheduledFor: "2026-06-24T18:00:00.000Z",
    coach: "Coach Adaeze",
    focus: "Lower-body strength, core definition, and technique-led sculpt programming.",
    amount: 14000,
    status: "completed",
    paymentState: "paid",
    location: "Xfitness Trans-Ekulu",
    scheduleId: "demo-women-sculpt-thursday-evening",
    intensity: "Moderate",
    classImage: "/media/women-sculpt.png",
    caloriesTarget: 430,
    attendedAt: "2026-06-24T18:57:00.000Z",
    createdAt: "2026-06-23T08:00:00.000Z"
  },
  {
    id: "demo-admin-booking-10",
    memberId: "demo-member-david",
    memberName: "David T.",
    memberEmail: "david@xfitness.club",
    programId: "ignite-hiit",
    programName: "Ignite HIIT",
    scheduledFor: "2026-06-25T07:00:00.000Z",
    coach: "Coach Tobe",
    focus: "Fast-paced cardio and metabolic circuits for fat loss and engine-building.",
    amount: 12000,
    status: "confirmed",
    paymentState: "pending-verification",
    location: "Xfitness Independence Layout",
    scheduleId: "demo-ignite-hiit-tuesday-morning",
    intensity: "Explosive",
    classImage: "/media/ignite-hiit.png",
    caloriesTarget: 610,
    createdAt: "2026-06-24T14:05:00.000Z"
  },
  {
    id: "demo-admin-booking-11",
    memberId: "demo-member-kingsley",
    memberName: "Kingsley E.",
    memberEmail: "kingsley@xfitness.club",
    programId: "strength-lab",
    programName: "Strength Lab",
    scheduledFor: "2026-06-27T08:00:00.000Z",
    coach: "Coach Amara",
    focus: "High-performance strength blocks with progressive overload and technique coaching.",
    amount: 15000,
    status: "completed",
    paymentState: "paid",
    location: "Xfitness Independence Layout",
    scheduleId: "demo-strength-lab-saturday-morning",
    intensity: "High",
    classImage: "/media/strength-zone.png",
    caloriesTarget: 540,
    attendedAt: "2026-06-27T09:02:00.000Z",
    createdAt: "2026-06-26T07:30:00.000Z"
  },
  {
    id: "demo-admin-booking-12",
    memberId: "demo-member-amaka",
    memberName: "Amaka O.",
    memberEmail: "amaka@xfitness.club",
    programId: "strength-lab",
    programName: "Strength Lab",
    scheduledFor: "2026-06-29T18:00:00.000Z",
    coach: "Coach Amara",
    focus: "Barbell strength, glute development, and form-focused lifting blocks.",
    amount: 15000,
    status: "confirmed",
    paymentState: "paid",
    location: "Xfitness Enugu",
    scheduleId: "demo-strength-lab-monday-evening",
    intensity: "High",
    classImage: "/media/strength-zone.png",
    caloriesTarget: 520,
    createdAt: "2026-06-27T09:45:00.000Z"
  }
];

export const demoAdminLoginActivity: MemberLoginActivity[] = [
  {
    id: "demo-login-1",
    memberId: "demo-owner-maya",
    memberName: "Maya Okafor",
    email: "owner@xfitness.club",
    loginDay: "2026-06-22",
    loggedInAt: "2026-06-22T06:45:00.000Z",
    source: "web"
  },
  {
    id: "demo-login-2",
    memberId: "demo-member-amaka",
    memberName: "Amaka O.",
    email: "amaka@xfitness.club",
    loginDay: "2026-06-23",
    loggedInAt: "2026-06-23T07:10:00.000Z",
    source: "web"
  },
  {
    id: "demo-login-3",
    memberId: "demo-member-kingsley",
    memberName: "Kingsley E.",
    email: "kingsley@xfitness.club",
    loginDay: "2026-06-23",
    loggedInAt: "2026-06-23T08:35:00.000Z",
    source: "web"
  },
  {
    id: "demo-login-4",
    memberId: "demo-member-zara",
    memberName: "Zara I.",
    email: "zara@xfitness.club",
    loginDay: "2026-06-24",
    loggedInAt: "2026-06-24T12:15:00.000Z",
    source: "web"
  },
  {
    id: "demo-login-5",
    memberId: "demo-member-amaka",
    memberName: "Amaka O.",
    email: "amaka@xfitness.club",
    loginDay: "2026-06-25",
    loggedInAt: "2026-06-25T06:55:00.000Z",
    source: "web"
  },
  {
    id: "demo-login-6",
    memberId: "demo-member-david",
    memberName: "David T.",
    email: "david@xfitness.club",
    loginDay: "2026-06-25",
    loggedInAt: "2026-06-25T17:12:00.000Z",
    source: "web"
  },
  {
    id: "demo-login-7",
    memberId: "demo-owner-maya",
    memberName: "Maya Okafor",
    email: "owner@xfitness.club",
    loginDay: "2026-06-26",
    loggedInAt: "2026-06-26T05:50:00.000Z",
    source: "web"
  },
  {
    id: "demo-login-8",
    memberId: "demo-member-kingsley",
    memberName: "Kingsley E.",
    email: "kingsley@xfitness.club",
    loginDay: "2026-06-27",
    loggedInAt: "2026-06-27T07:05:00.000Z",
    source: "web"
  },
  {
    id: "demo-login-9",
    memberId: "demo-member-zara",
    memberName: "Zara I.",
    email: "zara@xfitness.club",
    loginDay: "2026-06-27",
    loggedInAt: "2026-06-27T18:22:00.000Z",
    source: "web"
  },
  {
    id: "demo-login-10",
    memberId: "demo-member-amaka",
    memberName: "Amaka O.",
    email: "amaka@xfitness.club",
    loginDay: "2026-06-28",
    loggedInAt: "2026-06-28T06:40:00.000Z",
    source: "web"
  }
];

export const dashboardHighlights = [
  {
    label: "Live plan sync",
    value: "Supabase-ready",
    text: "Profiles, bookings, and member status can persist in Supabase as soon as your keys are added."
  },
  {
    label: "Booking flow",
    value: "1-tap reserve",
    text: "Members can pick a session, see the coach, confirm a time, and pay before arrival."
  },
  {
    label: "Payment rail",
    value: "Flutterwave",
    text: "Supports card, transfer, and local payment options with server-side verification hooks."
  }
];

export const testimonials = [
  {
    name: "Chinelo M.",
    role: "Member, 8 months",
    quote: "The new experience feels premium from the first screen. It looks like a top-tier studio, not just a local gym website."
  },
  {
    name: "Victor E.",
    role: "Performance plan",
    quote: "Booking sessions and seeing my dashboard in one place makes it much easier to stay consistent."
  },
  {
    name: "Favour O.",
    role: "Transformation client",
    quote: "The design feels fresh, bold, and motivating. It makes the brand feel serious about results."
  }
];
