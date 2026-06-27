import type { MembershipTier, SessionProgram } from "@/types/app";

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
