create extension if not exists pgcrypto;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.is_gym_owner()
returns boolean
language sql
stable
as $$
  select
    coalesce(auth.jwt() -> 'app_metadata' ->> 'user_role', '') = 'gym_owner'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'gym_owner'
    or exists (
      select 1
      from jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb)) as role_name(role)
      where role = 'gym_owner'
    );
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  plan text not null default 'Performance',
  fitness_goal text not null default 'Build strength and stay consistent',
  preferred_workout_type text not null default 'Strength training',
  quiz jsonb not null default '{}'::jsonb,
  home_club text not null default 'Xfitness Enugu',
  experience_level text not null default 'Performance track',
  joined_on timestamptz not null default timezone('utc', now()),
  membership_status text not null default 'active',
  renewal_date timestamptz not null default timezone('utc', now()) + interval '30 days',
  notification_preferences jsonb not null default '{
    "enabled": false,
    "classReminders": true,
    "goalNudges": true,
    "membershipAlerts": true,
    "specialEvents": true,
    "pushSubscribed": false
  }'::jsonb,
  streak_days integer not null default 0,
  sessions_completed integer not null default 0,
  upcoming_session timestamptz,
  avatar_seed text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles add column if not exists membership_status text not null default 'active';
alter table public.profiles add column if not exists renewal_date timestamptz not null default timezone('utc', now()) + interval '30 days';
alter table public.profiles add column if not exists notification_preferences jsonb not null default '{
  "enabled": false,
  "classReminders": true,
  "goalNudges": true,
  "membershipAlerts": true,
  "specialEvents": true,
  "pushSubscribed": false
}'::jsonb;
alter table public.profiles add column if not exists updated_at timestamptz not null default timezone('utc', now());

update public.profiles
set membership_status = coalesce(membership_status, 'active'),
    renewal_date = coalesce(renewal_date, joined_on + interval '30 days'),
    notification_preferences = coalesce(
      notification_preferences,
      '{
        "enabled": false,
        "classReminders": true,
        "goalNudges": true,
        "membershipAlerts": true,
        "specialEvents": true,
        "pushSubscribed": false
      }'::jsonb
    ),
    updated_at = coalesce(updated_at, created_at, timezone('utc', now()));

create table if not exists public.class_schedules (
  id uuid primary key default gen_random_uuid(),
  schedule_key text unique,
  program_id text not null,
  title text not null,
  trainer text not null,
  intensity text not null,
  location text not null,
  starts_at timestamptz not null,
  duration_minutes integer not null default 60,
  description text not null default '',
  image text not null default '',
  calories_target integer not null default 450,
  capacity integer not null default 16,
  spots_taken integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.class_schedules add column if not exists schedule_key text;
alter table public.class_schedules add column if not exists program_id text not null default 'general-session';
alter table public.class_schedules add column if not exists title text not null default 'Xfitness Session';
alter table public.class_schedules add column if not exists trainer text not null default 'Xfitness Coach';
alter table public.class_schedules add column if not exists intensity text not null default 'Moderate';
alter table public.class_schedules add column if not exists location text not null default 'Xfitness Enugu';
alter table public.class_schedules add column if not exists starts_at timestamptz not null default timezone('utc', now()) + interval '1 day';
alter table public.class_schedules add column if not exists duration_minutes integer not null default 60;
alter table public.class_schedules add column if not exists description text not null default '';
alter table public.class_schedules add column if not exists image text not null default '';
alter table public.class_schedules add column if not exists calories_target integer not null default 450;
alter table public.class_schedules add column if not exists capacity integer not null default 16;
alter table public.class_schedules add column if not exists spots_taken integer not null default 0;
alter table public.class_schedules add column if not exists is_active boolean not null default true;
alter table public.class_schedules add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.class_schedules add column if not exists updated_at timestamptz not null default timezone('utc', now());

create unique index if not exists class_schedules_schedule_key_idx
  on public.class_schedules (schedule_key);

create index if not exists class_schedules_starts_at_idx
  on public.class_schedules (starts_at);

create index if not exists class_schedules_filters_idx
  on public.class_schedules (trainer, intensity, location);

create table if not exists public.workout_library (
  id uuid primary key default gen_random_uuid(),
  workout_key text unique,
  title text not null,
  trainer text not null,
  category text not null,
  intensity text not null,
  duration_minutes integer not null default 20,
  description text not null default '',
  video_url text not null default '',
  poster_image text not null default '',
  target_goal text not null default 'Build strength and stay consistent',
  calories_burn integer not null default 300,
  equipment text[] not null default '{}'::text[],
  tags text[] not null default '{}'::text[],
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.workout_library add column if not exists workout_key text;
alter table public.workout_library add column if not exists title text not null default 'Xfitness Workout';
alter table public.workout_library add column if not exists trainer text not null default 'Xfitness Coach';
alter table public.workout_library add column if not exists category text not null default 'Strength';
alter table public.workout_library add column if not exists intensity text not null default 'Moderate';
alter table public.workout_library add column if not exists duration_minutes integer not null default 20;
alter table public.workout_library add column if not exists description text not null default '';
alter table public.workout_library add column if not exists video_url text not null default '';
alter table public.workout_library add column if not exists poster_image text not null default '';
alter table public.workout_library add column if not exists target_goal text not null default 'Build strength and stay consistent';
alter table public.workout_library add column if not exists calories_burn integer not null default 300;
alter table public.workout_library add column if not exists equipment text[] not null default '{}'::text[];
alter table public.workout_library add column if not exists tags text[] not null default '{}'::text[];
alter table public.workout_library add column if not exists is_featured boolean not null default false;
alter table public.workout_library add column if not exists is_active boolean not null default true;
alter table public.workout_library add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.workout_library add column if not exists updated_at timestamptz not null default timezone('utc', now());

create unique index if not exists workout_library_workout_key_idx
  on public.workout_library (workout_key);

create index if not exists workout_library_featured_idx
  on public.workout_library (is_featured, category, intensity);

create table if not exists public.community_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge_key text unique,
  title text not null,
  description text not null default '',
  metric_label text not null default 'Progress',
  metric_unit text not null default 'pts',
  target_value integer not null default 100,
  duration_days integer not null default 30,
  cover_image text not null default '',
  share_hashtag text not null default '#XfitnessChallenge',
  share_prompt text not null default 'Share your progress and tag the community.',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.community_challenges add column if not exists challenge_key text;
alter table public.community_challenges add column if not exists title text not null default 'Xfitness Challenge';
alter table public.community_challenges add column if not exists description text not null default '';
alter table public.community_challenges add column if not exists metric_label text not null default 'Progress';
alter table public.community_challenges add column if not exists metric_unit text not null default 'pts';
alter table public.community_challenges add column if not exists target_value integer not null default 100;
alter table public.community_challenges add column if not exists duration_days integer not null default 30;
alter table public.community_challenges add column if not exists cover_image text not null default '';
alter table public.community_challenges add column if not exists share_hashtag text not null default '#XfitnessChallenge';
alter table public.community_challenges add column if not exists share_prompt text not null default 'Share your progress and tag the community.';
alter table public.community_challenges add column if not exists starts_at timestamptz not null default timezone('utc', now());
alter table public.community_challenges add column if not exists ends_at timestamptz not null default timezone('utc', now()) + interval '30 days';
alter table public.community_challenges add column if not exists is_featured boolean not null default false;
alter table public.community_challenges add column if not exists is_active boolean not null default true;
alter table public.community_challenges add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.community_challenges add column if not exists updated_at timestamptz not null default timezone('utc', now());

create unique index if not exists community_challenges_key_idx
  on public.community_challenges (challenge_key);

create index if not exists community_challenges_featured_idx
  on public.community_challenges (is_featured, starts_at);

create table if not exists public.special_events (
  id uuid primary key default gen_random_uuid(),
  event_key text unique,
  title text not null,
  body text not null,
  location text not null default 'Xfitness Enugu',
  starts_at timestamptz not null,
  ends_at timestamptz,
  image text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.special_events add column if not exists event_key text;

create index if not exists special_events_starts_at_idx
  on public.special_events (starts_at);

create unique index if not exists special_events_event_key_idx
  on public.special_events (event_key);

create table if not exists public.member_progress (
  member_id uuid primary key references auth.users (id) on delete cascade,
  weekly_workouts_completed integer not null default 0,
  weekly_workout_goal integer not null default 5,
  weekly_calories_burned integer not null default 0,
  weekly_calorie_goal integer not null default 2400,
  week_start timestamptz not null default date_trunc('week', timezone('utc', now())),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.member_login_activity (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references auth.users (id) on delete cascade,
  member_name text not null,
  email text not null,
  login_day date not null default timezone('utc', now())::date,
  logged_in_at timestamptz not null default timezone('utc', now()),
  source text not null default 'web',
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.member_login_activity add column if not exists member_name text not null default 'Xfitness Member';
alter table public.member_login_activity add column if not exists email text not null default '';
alter table public.member_login_activity add column if not exists login_day date not null default timezone('utc', now())::date;
alter table public.member_login_activity add column if not exists logged_in_at timestamptz not null default timezone('utc', now());
alter table public.member_login_activity add column if not exists source text not null default 'web';
alter table public.member_login_activity add column if not exists created_at timestamptz not null default timezone('utc', now());

create unique index if not exists member_login_activity_member_day_idx
  on public.member_login_activity (member_id, login_day);

create index if not exists member_login_activity_logged_in_idx
  on public.member_login_activity (logged_in_at desc);

create table if not exists public.member_workout_activity (
  member_id uuid not null references auth.users (id) on delete cascade,
  workout_id uuid not null references public.workout_library(id) on delete cascade,
  favorited boolean not null default false,
  completed_count integer not null default 0,
  total_minutes_completed integer not null default 0,
  last_completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (member_id, workout_id)
);

alter table public.member_workout_activity add column if not exists favorited boolean not null default false;
alter table public.member_workout_activity add column if not exists completed_count integer not null default 0;
alter table public.member_workout_activity add column if not exists total_minutes_completed integer not null default 0;
alter table public.member_workout_activity add column if not exists last_completed_at timestamptz;
alter table public.member_workout_activity add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.member_workout_activity add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists member_workout_activity_member_updated_idx
  on public.member_workout_activity (member_id, updated_at desc);

create table if not exists public.member_challenge_progress (
  member_id uuid not null references auth.users (id) on delete cascade,
  member_name text not null,
  challenge_id uuid not null references public.community_challenges(id) on delete cascade,
  progress_value integer not null default 0,
  streak_days integer not null default 0,
  joined_at timestamptz not null default timezone('utc', now()),
  last_check_in_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (member_id, challenge_id)
);

alter table public.member_challenge_progress add column if not exists member_name text not null default 'Xfitness Member';
alter table public.member_challenge_progress add column if not exists progress_value integer not null default 0;
alter table public.member_challenge_progress add column if not exists streak_days integer not null default 0;
alter table public.member_challenge_progress add column if not exists joined_at timestamptz not null default timezone('utc', now());
alter table public.member_challenge_progress add column if not exists last_check_in_at timestamptz;
alter table public.member_challenge_progress add column if not exists completed_at timestamptz;
alter table public.member_challenge_progress add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists member_challenge_progress_leaderboard_idx
  on public.member_challenge_progress (challenge_id, progress_value desc, updated_at asc);

create table if not exists public.community_forum_threads (
  id uuid primary key default gen_random_uuid(),
  thread_key text unique,
  member_id uuid not null references auth.users (id) on delete cascade,
  member_name text not null,
  title text not null,
  body text not null,
  category text not null default 'General',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.community_forum_threads add column if not exists thread_key text;
alter table public.community_forum_threads add column if not exists member_name text not null default 'Xfitness Member';
alter table public.community_forum_threads add column if not exists title text not null default 'Community Thread';
alter table public.community_forum_threads add column if not exists body text not null default '';
alter table public.community_forum_threads add column if not exists category text not null default 'General';
alter table public.community_forum_threads add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.community_forum_threads add column if not exists updated_at timestamptz not null default timezone('utc', now());

create unique index if not exists community_forum_threads_key_idx
  on public.community_forum_threads (thread_key);

create index if not exists community_forum_threads_created_idx
  on public.community_forum_threads (created_at desc);

create table if not exists public.community_forum_comments (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.community_forum_threads(id) on delete cascade,
  member_id uuid not null references auth.users (id) on delete cascade,
  member_name text not null,
  body text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.community_forum_comments add column if not exists member_name text not null default 'Xfitness Member';
alter table public.community_forum_comments add column if not exists body text not null default '';
alter table public.community_forum_comments add column if not exists created_at timestamptz not null default timezone('utc', now());

create index if not exists community_forum_comments_thread_created_idx
  on public.community_forum_comments (thread_id, created_at asc);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references auth.users (id) on delete cascade,
  member_name text not null,
  member_email text not null,
  program_id text not null,
  program_name text not null,
  scheduled_for timestamptz not null,
  coach text not null,
  focus text not null,
  amount numeric(10, 2) not null,
  status text not null,
  payment_state text not null,
  location text not null,
  schedule_id uuid references public.class_schedules(id) on delete set null,
  intensity text,
  class_image text,
  calories_target integer,
  attended_at timestamptz,
  tx_ref text,
  transaction_id text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.bookings add column if not exists schedule_id uuid references public.class_schedules(id) on delete set null;
alter table public.bookings add column if not exists intensity text;
alter table public.bookings add column if not exists class_image text;
alter table public.bookings add column if not exists calories_target integer;
alter table public.bookings add column if not exists attended_at timestamptz;

create index if not exists bookings_member_id_created_at_idx
  on public.bookings (member_id, created_at desc);

create index if not exists bookings_schedule_id_idx
  on public.bookings (schedule_id);

create unique index if not exists bookings_member_schedule_unique_idx
  on public.bookings (member_id, schedule_id);

create or replace function public.refresh_class_schedule_spots(target_schedule_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_schedule_id is null then
    return;
  end if;

  update public.class_schedules
  set spots_taken = (
    select count(*)
    from public.bookings
    where schedule_id = target_schedule_id
      and status <> 'cancelled'
  )
  where id = target_schedule_id;
end;
$$;

create or replace function public.enforce_class_schedule_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  schedule_capacity integer;
  reserved_count integer;
begin
  if new.schedule_id is null or new.status = 'cancelled' then
    return new;
  end if;

  select capacity
  into schedule_capacity
  from public.class_schedules
  where id = new.schedule_id;

  if schedule_capacity is null then
    return new;
  end if;

  select count(*)
  into reserved_count
  from public.bookings
  where schedule_id = new.schedule_id
    and status <> 'cancelled'
    and (tg_op <> 'UPDATE' or id <> new.id);

  if reserved_count >= schedule_capacity then
    raise exception 'This class is already full.';
  end if;

  return new;
end;
$$;

create or replace function public.sync_class_schedule_spots()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_class_schedule_spots(old.schedule_id);
    return old;
  end if;

  if tg_op = 'UPDATE' and old.schedule_id is distinct from new.schedule_id then
    perform public.refresh_class_schedule_spots(old.schedule_id);
  end if;

  perform public.refresh_class_schedule_spots(new.schedule_id);
  return new;
end;
$$;

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  entity_key text not null,
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists notification_logs_member_category_entity_idx
  on public.notification_logs (member_id, category, entity_key);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.handle_updated_at();

drop trigger if exists set_class_schedules_updated_at on public.class_schedules;
create trigger set_class_schedules_updated_at
before update on public.class_schedules
for each row
execute function public.handle_updated_at();

drop trigger if exists set_workout_library_updated_at on public.workout_library;
create trigger set_workout_library_updated_at
before update on public.workout_library
for each row
execute function public.handle_updated_at();

drop trigger if exists set_community_challenges_updated_at on public.community_challenges;
create trigger set_community_challenges_updated_at
before update on public.community_challenges
for each row
execute function public.handle_updated_at();

drop trigger if exists set_special_events_updated_at on public.special_events;
create trigger set_special_events_updated_at
before update on public.special_events
for each row
execute function public.handle_updated_at();

drop trigger if exists set_member_progress_updated_at on public.member_progress;
create trigger set_member_progress_updated_at
before update on public.member_progress
for each row
execute function public.handle_updated_at();

drop trigger if exists set_member_workout_activity_updated_at on public.member_workout_activity;
create trigger set_member_workout_activity_updated_at
before update on public.member_workout_activity
for each row
execute function public.handle_updated_at();

drop trigger if exists set_member_challenge_progress_updated_at on public.member_challenge_progress;
create trigger set_member_challenge_progress_updated_at
before update on public.member_challenge_progress
for each row
execute function public.handle_updated_at();

drop trigger if exists set_community_forum_threads_updated_at on public.community_forum_threads;
create trigger set_community_forum_threads_updated_at
before update on public.community_forum_threads
for each row
execute function public.handle_updated_at();

drop trigger if exists enforce_class_schedule_capacity on public.bookings;
create trigger enforce_class_schedule_capacity
before insert or update of schedule_id, status on public.bookings
for each row
execute function public.enforce_class_schedule_capacity();

drop trigger if exists sync_class_schedule_spots on public.bookings;
create trigger sync_class_schedule_spots
after insert or update of schedule_id, status or delete on public.bookings
for each row
execute function public.sync_class_schedule_spots();

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select on table public.class_schedules to authenticated;
grant select on table public.workout_library to authenticated;
grant select on table public.community_challenges to authenticated;
grant select on table public.special_events to authenticated;
grant select, insert, update, delete on table public.member_progress to authenticated;
grant select, insert, update on table public.member_login_activity to authenticated;
grant select, insert, update, delete on table public.member_workout_activity to authenticated;
grant select, insert, update on table public.member_challenge_progress to authenticated;
grant select, insert on table public.community_forum_threads to authenticated;
grant select, insert on table public.community_forum_comments to authenticated;
grant select, insert, update, delete on table public.bookings to authenticated;

alter table public.profiles enable row level security;
alter table public.class_schedules enable row level security;
alter table public.workout_library enable row level security;
alter table public.community_challenges enable row level security;
alter table public.special_events enable row level security;
alter table public.member_progress enable row level security;
alter table public.member_login_activity enable row level security;
alter table public.member_workout_activity enable row level security;
alter table public.member_challenge_progress enable row level security;
alter table public.community_forum_threads enable row level security;
alter table public.community_forum_comments enable row level security;
alter table public.bookings enable row level security;
alter table public.notification_logs enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id or public.is_gym_owner());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "class_schedules_select_active" on public.class_schedules;
create policy "class_schedules_select_active"
  on public.class_schedules
  for select
  to authenticated
  using (is_active = true or public.is_gym_owner());

drop policy if exists "special_events_select_active" on public.special_events;
create policy "special_events_select_active"
  on public.special_events
  for select
  to authenticated
  using (is_active = true or public.is_gym_owner());

drop policy if exists "workout_library_select_active" on public.workout_library;
create policy "workout_library_select_active"
  on public.workout_library
  for select
  to authenticated
  using (is_active = true or public.is_gym_owner());

drop policy if exists "community_challenges_select_active" on public.community_challenges;
create policy "community_challenges_select_active"
  on public.community_challenges
  for select
  to authenticated
  using (is_active = true or public.is_gym_owner());

drop policy if exists "member_progress_select_own" on public.member_progress;
create policy "member_progress_select_own"
  on public.member_progress
  for select
  to authenticated
  using (auth.uid() = member_id or public.is_gym_owner());

drop policy if exists "member_login_activity_select_visible" on public.member_login_activity;
create policy "member_login_activity_select_visible"
  on public.member_login_activity
  for select
  to authenticated
  using (auth.uid() = member_id or public.is_gym_owner());

drop policy if exists "member_login_activity_insert_own" on public.member_login_activity;
create policy "member_login_activity_insert_own"
  on public.member_login_activity
  for insert
  to authenticated
  with check (auth.uid() = member_id);

drop policy if exists "member_login_activity_update_own" on public.member_login_activity;
create policy "member_login_activity_update_own"
  on public.member_login_activity
  for update
  to authenticated
  using (auth.uid() = member_id)
  with check (auth.uid() = member_id);

drop policy if exists "member_progress_insert_own" on public.member_progress;
create policy "member_progress_insert_own"
  on public.member_progress
  for insert
  to authenticated
  with check (auth.uid() = member_id);

drop policy if exists "member_progress_update_own" on public.member_progress;
create policy "member_progress_update_own"
  on public.member_progress
  for update
  to authenticated
  using (auth.uid() = member_id)
  with check (auth.uid() = member_id);

drop policy if exists "member_workout_activity_select_own" on public.member_workout_activity;
create policy "member_workout_activity_select_own"
  on public.member_workout_activity
  for select
  to authenticated
  using (auth.uid() = member_id or public.is_gym_owner());

drop policy if exists "member_workout_activity_insert_own" on public.member_workout_activity;
create policy "member_workout_activity_insert_own"
  on public.member_workout_activity
  for insert
  to authenticated
  with check (auth.uid() = member_id);

drop policy if exists "member_workout_activity_update_own" on public.member_workout_activity;
create policy "member_workout_activity_update_own"
  on public.member_workout_activity
  for update
  to authenticated
  using (auth.uid() = member_id)
  with check (auth.uid() = member_id);

drop policy if exists "member_challenge_progress_select_all" on public.member_challenge_progress;
create policy "member_challenge_progress_select_all"
  on public.member_challenge_progress
  for select
  to authenticated
  using (true);

drop policy if exists "member_challenge_progress_insert_own" on public.member_challenge_progress;
create policy "member_challenge_progress_insert_own"
  on public.member_challenge_progress
  for insert
  to authenticated
  with check (auth.uid() = member_id);

drop policy if exists "member_challenge_progress_update_own" on public.member_challenge_progress;
create policy "member_challenge_progress_update_own"
  on public.member_challenge_progress
  for update
  to authenticated
  using (auth.uid() = member_id)
  with check (auth.uid() = member_id);

drop policy if exists "community_forum_threads_select_all" on public.community_forum_threads;
create policy "community_forum_threads_select_all"
  on public.community_forum_threads
  for select
  to authenticated
  using (true);

drop policy if exists "community_forum_threads_insert_own" on public.community_forum_threads;
create policy "community_forum_threads_insert_own"
  on public.community_forum_threads
  for insert
  to authenticated
  with check (auth.uid() = member_id);

drop policy if exists "community_forum_comments_select_all" on public.community_forum_comments;
create policy "community_forum_comments_select_all"
  on public.community_forum_comments
  for select
  to authenticated
  using (true);

drop policy if exists "community_forum_comments_insert_own" on public.community_forum_comments;
create policy "community_forum_comments_insert_own"
  on public.community_forum_comments
  for insert
  to authenticated
  with check (auth.uid() = member_id);

drop policy if exists "bookings_select_own" on public.bookings;
create policy "bookings_select_own"
  on public.bookings
  for select
  to authenticated
  using (auth.uid() = member_id or public.is_gym_owner());

drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own"
  on public.bookings
  for insert
  to authenticated
  with check (auth.uid() = member_id);

drop policy if exists "bookings_update_own" on public.bookings;
create policy "bookings_update_own"
  on public.bookings
  for update
  to authenticated
  using (auth.uid() = member_id)
  with check (auth.uid() = member_id);

drop policy if exists "bookings_delete_own" on public.bookings;
create policy "bookings_delete_own"
  on public.bookings
  for delete
  to authenticated
  using (auth.uid() = member_id);

insert into public.class_schedules (
  schedule_key,
  program_id,
  title,
  trainer,
  intensity,
  location,
  starts_at,
  duration_minutes,
  description,
  image,
  calories_target,
  capacity
)
values
  (
    'strength-lab-monday-evening',
    'strength-lab',
    'Strength Lab',
    'Coach Amara',
    'High',
    'Xfitness Enugu',
    timezone('utc', now()) + interval '1 day 18 hours',
    60,
    'Barbell strength, glute development, and form-focused lifting blocks.',
    '/media/strength-zone.png',
    520,
    18
  ),
  (
    'ignite-hiit-tuesday-morning',
    'ignite-hiit',
    'Ignite HIIT',
    'Coach Tobe',
    'Explosive',
    'Xfitness Independence Layout',
    timezone('utc', now()) + interval '2 days 7 hours',
    45,
    'Fast-paced cardio and metabolic circuits for fat loss and engine-building.',
    '/media/ignite-hiit.png',
    610,
    16
  ),
  (
    'mobility-reset-wednesday-evening',
    'mobility-reset',
    'Mobility Reset',
    'Coach Nneka',
    'Low',
    'Xfitness Enugu',
    timezone('utc', now()) + interval '3 days 17 hours',
    50,
    'Deep stretch, mobility flows, and recovery work for active bodies.',
    '/media/mobility-reset.png',
    260,
    20
  ),
  (
    'women-sculpt-thursday-evening',
    'women-sculpt',
    'Women Sculpt',
    'Coach Adaeze',
    'Moderate',
    'Xfitness Trans-Ekulu',
    timezone('utc', now()) + interval '4 days 18 hours',
    55,
    'Lower-body strength, core definition, and technique-led sculpt programming.',
    '/media/women-sculpt.png',
    430,
    14
  ),
  (
    'strength-lab-saturday-morning',
    'strength-lab',
    'Strength Lab',
    'Coach Amara',
    'High',
    'Xfitness Independence Layout',
    timezone('utc', now()) + interval '6 days 8 hours',
    60,
    'High-performance strength blocks with progressive overload and technique coaching.',
    '/media/strength-zone.png',
    540,
    18
  ),
  (
    'mobility-reset-sunday-morning',
    'mobility-reset',
    'Mobility Reset',
    'Coach Nneka',
    'Low',
    'Xfitness Enugu',
    timezone('utc', now()) + interval '7 days 9 hours',
    50,
    'Recovery-led mobility work to prep the next training week.',
    '/media/mobility-reset.png',
    240,
    20
  )
on conflict do nothing;

update public.class_schedules schedule
set spots_taken = (
  select count(*)
  from public.bookings booking
  where booking.schedule_id = schedule.id
    and booking.status <> 'cancelled'
);

insert into public.special_events (
  event_key,
  title,
  body,
  location,
  starts_at,
  ends_at,
  image
)
values
  (
    'sunrise-member-bootcamp',
    'Sunrise Member Bootcamp',
    'A high-energy outdoor conditioning morning with recovery smoothies and guest coaches.',
    'Ngwo Pine Forest Track',
    timezone('utc', now()) + interval '10 days 6 hours',
    timezone('utc', now()) + interval '10 days 9 hours',
    '/media/group-energy.png'
)
on conflict do nothing;

insert into public.workout_library (
  workout_key,
  title,
  trainer,
  category,
  intensity,
  duration_minutes,
  description,
  video_url,
  poster_image,
  target_goal,
  calories_burn,
  equipment,
  tags,
  is_featured
)
values
  (
    'pulse-burn-28',
    'Pulse Burn 28',
    'Coach Tobe',
    'Cardio Conditioning',
    'Explosive',
    28,
    'A fast-moving metabolic session for members who want an efficient calorie burn without leaving home.',
    '/media/codec-test.mp4',
    '/media/group-energy.png',
    'Fat loss and cardio endurance',
    360,
    array['Mat', 'Bodyweight'],
    array['hiit', 'cardio', 'fat loss', 'conditioning', 'quick'],
    true
  ),
  (
    'strength-foundations-42',
    'Strength Foundations 42',
    'Coach Amara',
    'Strength',
    'High',
    42,
    'Form-first dumbbell strength work focused on lower body power, posture, and progression.',
    '/media/codec-test.mp4',
    '/media/strength-zone.png',
    'Build strength and muscle tone',
    410,
    array['Dumbbells', 'Bench'],
    array['strength', 'glutes', 'lower body', 'muscle', 'progressive overload'],
    true
  ),
  (
    'core-sculpt-flow-24',
    'Core Sculpt Flow',
    'Coach Adaeze',
    'Core Training',
    'Moderate',
    24,
    'Low-impact core sculpting designed to sharpen control, posture, and deep abdominal engagement.',
    '/media/codec-test.mp4',
    '/media/women-sculpt.png',
    'Core definition and body recomposition',
    220,
    array['Mat'],
    array['core', 'definition', 'waist', 'low impact', 'body recomp'],
    false
  ),
  (
    'mobility-reset-18',
    'Mobility Reset 18',
    'Coach Nneka',
    'Recovery',
    'Low',
    18,
    'A guided reset for stiff hips, tired shoulders, and recovery days between harder sessions.',
    '/media/codec-test.mp4',
    '/media/mobility-reset.png',
    'Recovery and movement quality',
    120,
    array['Mat', 'Mini band'],
    array['mobility', 'recovery', 'stretch', 'flexibility', 'rest day'],
    false
  ),
  (
    'athlete-engine-35',
    'Athlete Engine 35',
    'Coach Tobe',
    'Performance',
    'High',
    35,
    'Explosive intervals, athletic footwork, and engine-building rounds for performance-minded members.',
    '/media/codec-test.mp4',
    '/media/hero-still.png',
    'Athletic performance and endurance',
    440,
    array['Bodyweight', 'Agility markers'],
    array['athletic', 'performance', 'speed', 'power', 'endurance'],
    true
  ),
  (
    'glute-lift-lab-30',
    'Glute Lift Lab 30',
    'Coach Adaeze',
    'Lower Body',
    'Moderate',
    30,
    'A glute-focused routine combining tempo work, unilateral strength, and controlled finishers.',
    '/media/codec-test.mp4',
    '/media/women-sculpt.png',
    'Lower-body shaping and strength',
    330,
    array['Dumbbells', 'Mini band'],
    array['glutes', 'lower body', 'toning', 'strength', 'women'],
    false
  )
on conflict do nothing;

insert into public.community_challenges (
  challenge_key,
  title,
  description,
  metric_label,
  metric_unit,
  target_value,
  duration_days,
  cover_image,
  share_hashtag,
  share_prompt,
  starts_at,
  ends_at,
  is_featured
)
values
  (
    'plank-30-day-challenge',
    '30-Day Plank Challenge',
    'Build serious core endurance by adding to your plank hold across thirty focused days.',
    'Best plank hold',
    'sec',
    300,
    30,
    '/media/group-energy.png',
    '#XfitnessPlank30',
    'Show your plank timer, tag your training partner, and challenge them to beat your hold.',
    timezone('utc', now()) - interval '27 days',
    timezone('utc', now()) + interval '3 days',
    true
  ),
  (
    'mobility-reset-streak',
    '14-Day Mobility Reset',
    'Turn recovery into a habit with daily mobility check-ins designed for sore hips and shoulders.',
    'Days completed',
    'days',
    14,
    14,
    '/media/mobility-reset.png',
    '#XfitnessMobilityReset',
    'Share your recovery ritual and invite a friend to protect their training longevity.',
    timezone('utc', now()) - interval '12 days',
    timezone('utc', now()) + interval '2 days',
    false
  ),
  (
    'burpee-power-sprint',
    '100 Burpee Power Sprint',
    'Track your fastest route to 100 burpees and climb the conditioning leaderboard.',
    'Burpees completed',
    'reps',
    100,
    7,
    '/media/hero-still.png',
    '#XfitnessPowerSprint',
    'Post your final rep count and invite your crew to take on the sprint.',
    timezone('utc', now()) - interval '6 days',
    timezone('utc', now()) + interval '1 day',
    false
  )
on conflict do nothing;

do $$
begin
  execute 'alter publication supabase_realtime add table public.profiles';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.class_schedules';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.community_challenges';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.workout_library';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.member_progress';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.member_login_activity';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.member_challenge_progress';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.member_workout_activity';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.community_forum_threads';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.community_forum_comments';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.bookings';
exception
  when duplicate_object then null;
end $$;
