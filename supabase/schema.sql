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
alter table public.class_schedules add column if not exists is_active boolean not null default true;
alter table public.class_schedules add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.class_schedules add column if not exists updated_at timestamptz not null default timezone('utc', now());

create unique index if not exists class_schedules_schedule_key_idx
  on public.class_schedules (schedule_key);

create index if not exists class_schedules_starts_at_idx
  on public.class_schedules (starts_at);

create index if not exists class_schedules_filters_idx
  on public.class_schedules (trainer, intensity, location);

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

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select on table public.class_schedules to authenticated;
grant select on table public.special_events to authenticated;
grant select, insert, update, delete on table public.member_progress to authenticated;
grant select, insert, update, delete on table public.bookings to authenticated;

alter table public.profiles enable row level security;
alter table public.class_schedules enable row level security;
alter table public.special_events enable row level security;
alter table public.member_progress enable row level security;
alter table public.bookings enable row level security;
alter table public.notification_logs enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

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
  using (is_active = true);

drop policy if exists "special_events_select_active" on public.special_events;
create policy "special_events_select_active"
  on public.special_events
  for select
  to authenticated
  using (is_active = true);

drop policy if exists "member_progress_select_own" on public.member_progress;
create policy "member_progress_select_own"
  on public.member_progress
  for select
  to authenticated
  using (auth.uid() = member_id);

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

drop policy if exists "bookings_select_own" on public.bookings;
create policy "bookings_select_own"
  on public.bookings
  for select
  to authenticated
  using (auth.uid() = member_id);

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
  calories_target
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
    520
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
    610
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
    260
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
    430
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
    540
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
    240
  )
on conflict do nothing;

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
  execute 'alter publication supabase_realtime add table public.member_progress';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.bookings';
exception
  when duplicate_object then null;
end $$;
