import { createClient } from "npm:@supabase/supabase-js@2";
import { sendOneSignalPush } from "../_shared/onesignal.ts";

type ProfileRow = {
  id: string;
  full_name: string;
  membership_status: string;
  renewal_date: string;
  notification_preferences: {
    enabled?: boolean;
    classReminders?: boolean;
    goalNudges?: boolean;
    membershipAlerts?: boolean;
    specialEvents?: boolean;
    pushSubscribed?: boolean;
  } | null;
};

type BookingRow = {
  id: string;
  member_id: string;
  program_name: string;
  scheduled_for: string;
  location: string;
  status: string;
};

type ProgressRow = {
  member_id: string;
  weekly_workouts_completed: number;
  weekly_workout_goal: number;
  weekly_calories_burned: number;
  weekly_calorie_goal: number;
  week_start: string;
};

type SpecialEventRow = {
  id: string;
  title: string;
  body: string;
  location: string;
  starts_at: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-notification-secret"
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const cronSecret = Deno.env.get("NOTIFICATION_CRON_SECRET");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase service role configuration is missing for the notification function.");
}

const admin = createClient(supabaseUrl, serviceRoleKey);

function isPushEnabled(profile: ProfileRow) {
  const prefs = profile.notification_preferences ?? {};
  return Boolean(prefs.enabled && prefs.pushSubscribed);
}

function canSend(profile: ProfileRow, key: keyof NonNullable<ProfileRow["notification_preferences"]>) {
  if (!isPushEnabled(profile)) {
    return false;
  }

  const prefs = profile.notification_preferences ?? {};
  return Boolean(prefs[key]);
}

async function hasNotificationLog(memberId: string, category: string, entityKey: string) {
  const { data, error } = await admin
    .from("notification_logs")
    .select("id")
    .eq("member_id", memberId)
    .eq("category", category)
    .eq("entity_key", entityKey)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

async function recordNotificationLog(memberId: string, category: string, entityKey: string, payload: Record<string, unknown>) {
  const { error } = await admin.from("notification_logs").insert({
    member_id: memberId,
    category,
    entity_key: entityKey,
    payload
  });

  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }
}

async function sendClassReminders(profilesById: Map<string, ProfileRow>) {
  const now = new Date();
  const upcomingWindow = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  const { data, error } = await admin
    .from("bookings")
    .select("id, member_id, program_name, scheduled_for, location, status")
    .eq("status", "confirmed")
    .gte("scheduled_for", now.toISOString())
    .lte("scheduled_for", upcomingWindow.toISOString());

  if (error) {
    throw new Error(error.message);
  }

  let sent = 0;

  for (const booking of (data ?? []) as BookingRow[]) {
    const profile = profilesById.get(booking.member_id);
    if (!profile || !canSend(profile, "classReminders")) {
      continue;
    }

    const entityKey = booking.id;
    if (await hasNotificationLog(profile.id, "class_reminder", entityKey)) {
      continue;
    }

    await sendOneSignalPush({
      memberId: profile.id,
      heading: "Upcoming class reminder",
      content: `${booking.program_name} starts soon at ${booking.location}. Open Xfitness to stay locked in.`,
      data: {
        type: "class_reminder",
        bookingId: booking.id
      }
    });

    await recordNotificationLog(profile.id, "class_reminder", entityKey, {
      bookingId: booking.id
    });
    sent += 1;
  }

  return sent;
}

async function sendGoalNudges(profilesById: Map<string, ProfileRow>) {
  const { data, error } = await admin
    .from("member_progress")
    .select("member_id, weekly_workouts_completed, weekly_workout_goal, weekly_calories_burned, weekly_calorie_goal, week_start");

  if (error) {
    throw new Error(error.message);
  }

  let sent = 0;

  for (const progress of (data ?? []) as ProgressRow[]) {
    const profile = profilesById.get(progress.member_id);
    if (!profile || !canSend(profile, "goalNudges")) {
      continue;
    }

    const workoutsClose =
      progress.weekly_workouts_completed < progress.weekly_workout_goal &&
      progress.weekly_workout_goal - progress.weekly_workouts_completed <= 1;

    const caloriesClose =
      progress.weekly_calories_burned < progress.weekly_calorie_goal &&
      progress.weekly_calorie_goal - progress.weekly_calories_burned <= 250;

    if (!workoutsClose && !caloriesClose) {
      continue;
    }

    const entityKey = progress.week_start;
    if (await hasNotificationLog(profile.id, "goal_nudge", entityKey)) {
      continue;
    }

    const nudgeCopy = workoutsClose
      ? `One more workout gets you to this week's target. You're almost there.`
      : `You're within ${progress.weekly_calorie_goal - progress.weekly_calories_burned} calories of your weekly burn goal.`;

    await sendOneSignalPush({
      memberId: profile.id,
      heading: "Goal nudge",
      content: nudgeCopy,
      data: {
        type: "goal_nudge",
        weekStart: progress.week_start
      }
    });

    await recordNotificationLog(profile.id, "goal_nudge", entityKey, {
      weekStart: progress.week_start
    });
    sent += 1;
  }

  return sent;
}

async function sendMembershipAlerts(profiles: ProfileRow[]) {
  let sent = 0;
  const now = Date.now();
  const expiryWindow = now + 3 * 24 * 60 * 60 * 1000;

  for (const profile of profiles) {
    if (!canSend(profile, "membershipAlerts")) {
      continue;
    }

    const renewalTime = new Date(profile.renewal_date).getTime();
    if (Number.isNaN(renewalTime) || renewalTime > expiryWindow) {
      continue;
    }

    const entityKey = profile.renewal_date;
    if (await hasNotificationLog(profile.id, "membership_alert", entityKey)) {
      continue;
    }

    const overdue = renewalTime < now || profile.membership_status === "past-due";
    const daysLeft = Math.max(0, Math.ceil((renewalTime - now) / (1000 * 60 * 60 * 24)));

    await sendOneSignalPush({
      memberId: profile.id,
      heading: overdue ? "Membership overdue" : "Membership expiring soon",
      content: overdue
        ? "Your membership has expired. Renew now to keep classes and progress moving."
        : `Your membership renews in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Stay ahead of it.`,
      data: {
        type: "membership_alert",
        renewalDate: profile.renewal_date
      }
    });

    await recordNotificationLog(profile.id, "membership_alert", entityKey, {
      renewalDate: profile.renewal_date
    });
    sent += 1;
  }

  return sent;
}

async function sendSpecialEventAlerts(profiles: ProfileRow[]) {
  const now = new Date();
  const eventWindow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const { data, error } = await admin
    .from("special_events")
    .select("id, title, body, location, starts_at")
    .eq("is_active", true)
    .gte("starts_at", now.toISOString())
    .lte("starts_at", eventWindow.toISOString());

  if (error) {
    throw new Error(error.message);
  }

  let sent = 0;

  for (const event of (data ?? []) as SpecialEventRow[]) {
    for (const profile of profiles) {
      if (!canSend(profile, "specialEvents")) {
        continue;
      }

      if (await hasNotificationLog(profile.id, "special_event", event.id)) {
        continue;
      }

      await sendOneSignalPush({
        memberId: profile.id,
        heading: event.title,
        content: `${event.body} Location: ${event.location}.`,
        data: {
          type: "special_event",
          eventId: event.id
        }
      });

      await recordNotificationLog(profile.id, "special_event", event.id, {
        eventId: event.id
      });
      sent += 1;
    }
  }

  return sent;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = request.headers.get("authorization");
  const secretHeader = request.headers.get("x-notification-secret");
  const bearerSecret = authHeader?.replace(/^Bearer\s+/i, "");

  if (cronSecret && secretHeader !== cronSecret && bearerSecret !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }

  try {
    const { data, error } = await admin
      .from("profiles")
      .select("id, full_name, membership_status, renewal_date, notification_preferences");

    if (error) {
      throw new Error(error.message);
    }

    const profiles = (data ?? []) as ProfileRow[];
    const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

    const classReminders = await sendClassReminders(profilesById);
    const goalNudges = await sendGoalNudges(profilesById);
    const membershipAlerts = await sendMembershipAlerts(profiles);
    const specialEvents = await sendSpecialEventAlerts(profiles);

    return new Response(
      JSON.stringify({
        ok: true,
        sent: {
          classReminders,
          goalNudges,
          membershipAlerts,
          specialEvents
        }
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown notification failure."
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});
