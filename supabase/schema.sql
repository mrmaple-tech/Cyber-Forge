-- CyberForge — future Supabase schema (NOT used by the static v1 site).
-- Apply in the Supabase SQL editor. Only the anon key is ever used in the browser.
-- Never put the service-role key or DB password in frontend code.

create extension if not exists "pgcrypto";

-- ---------- Profiles & roles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Student' check (char_length(display_name) between 2 and 24),
  role text not null default 'learner' check (role in ('learner', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

-- Prevent users promoting themselves: role changes only via service role / admins.
create or replace function public.protect_role() returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'role can only be changed by an admin';
  end if;
  return new;
end $$;
create trigger profiles_protect_role before update on public.profiles for each row execute function public.protect_role();

-- ---------- Content ----------
create table public.courses (
  id text primary key,
  title text not null check (char_length(title) between 4 and 80),
  description text not null check (char_length(description) <= 300),
  skill text not null,
  difficulty text not null check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  level int check (level between 1 and 10),
  published boolean not null default false
);
create table public.lessons (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  position int not null,
  title text not null check (char_length(title) between 4 and 100),
  body jsonb not null,               -- structured: learn[], body[], example, mistakes[], check
  published boolean not null default false
);
create table public.labs (
  id text primary key,
  category text not null,
  title text not null,
  difficulty text not null check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  xp int not null default 250 check (xp between 0 and 1000),
  est_minutes int not null check (est_minutes between 1 and 180),
  scenario jsonb not null,
  published boolean not null default false
);
create table public.challenges (
  id text primary key,
  type text not null,
  title text not null,
  difficulty text not null,
  xp int not null default 250 check (xp between 0 and 1000),
  scenario jsonb not null,
  published boolean not null default false
);
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  course_id text references public.courses(id) on delete cascade,
  question text not null,
  options jsonb not null check (jsonb_array_length(options) = 4),
  answer_index int not null check (answer_index between 0 and 3),
  explanation text
);
create table public.tool_library (
  id text primary key,
  name text not null,
  category text not null,
  difficulty text not null,
  description text not null,
  purpose text not null,
  concepts text[] not null default '{}',
  safe_environment text not null,
  related_lessons text[] not null default '{}'
);
create table public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  active_on date unique,
  title text not null,
  scenario jsonb not null,
  xp int not null default 150
);
create table public.badges (
  id text primary key,
  name text not null,
  description text not null,
  rule jsonb not null                 -- e.g. {"t":"count","kind":"lesson","skill":"linux","n":5}
);

-- ---------- Per-user data ----------
create table public.user_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('lesson', 'quiz', 'lab', 'challenge', 'mission', 'daily')),
  item_id text not null,
  skill text,
  completed_at timestamptz not null default now(),
  primary key (user_id, kind, item_id)
);
create table public.user_xp (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp bigint not null default 0 check (xp >= 0),
  streak int not null default 0,
  last_active date
);
create table public.user_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null references public.badges(id),
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- ---------- Row Level Security: deny by default ----------
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.labs enable row level security;
alter table public.challenges enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.tool_library enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.badges enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_xp enable row level security;
alter table public.user_badges enable row level security;

-- Profiles: read/update your own row (role is protected by trigger); admins read all.
create policy "profiles_select_own" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Public, read-only catalogue (published rows only); admin-only writes.
create policy "courses_read" on public.courses for select using (published or public.is_admin());
create policy "courses_admin_write" on public.courses for all using (public.is_admin()) with check (public.is_admin());
create policy "lessons_read" on public.lessons for select using (published or public.is_admin());
create policy "lessons_admin_write" on public.lessons for all using (public.is_admin()) with check (public.is_admin());
create policy "labs_read" on public.labs for select using (published or public.is_admin());
create policy "labs_admin_write" on public.labs for all using (public.is_admin()) with check (public.is_admin());
create policy "challenges_read" on public.challenges for select using (published or public.is_admin());
create policy "challenges_admin_write" on public.challenges for all using (public.is_admin()) with check (public.is_admin());
create policy "quiz_read" on public.quiz_questions for select using (true);
create policy "quiz_admin_write" on public.quiz_questions for all using (public.is_admin()) with check (public.is_admin());
create policy "tools_read" on public.tool_library for select using (true);
create policy "tools_admin_write" on public.tool_library for all using (public.is_admin()) with check (public.is_admin());
create policy "daily_read" on public.daily_challenges for select using (true);
create policy "daily_admin_write" on public.daily_challenges for all using (public.is_admin()) with check (public.is_admin());
create policy "badges_read" on public.badges for select using (true);
create policy "badges_admin_write" on public.badges for all using (public.is_admin()) with check (public.is_admin());

-- Per-user rows: users may READ their own data. They get NO insert/update policy on XP or badges:
-- those are written only by the SECURITY DEFINER function below (or an Edge Function).
create policy "progress_read_own" on public.user_progress for select using (user_id = auth.uid());
create policy "xp_read_own" on public.user_xp for select using (user_id = auth.uid());
create policy "user_badges_read_own" on public.user_badges for select using (user_id = auth.uid());

-- Idempotent, server-side award. In production, validate that the item exists and was genuinely completed
-- (e.g. re-check quiz answers server-side) before granting XP.
create or replace function public.complete_item(p_kind text, p_item text, p_skill text, p_xp int)
returns int language plpgsql security definer set search_path = public as $$
declare awarded int := 0;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_xp < 0 or p_xp > 1000 then raise exception 'invalid xp'; end if;
  insert into public.user_progress (user_id, kind, item_id, skill) values (auth.uid(), p_kind, p_item, p_skill)
    on conflict do nothing;
  if found then
    awarded := p_xp;
    insert into public.user_xp (user_id, xp, streak, last_active) values (auth.uid(), p_xp, 1, current_date)
      on conflict (user_id) do update set
        xp = public.user_xp.xp + excluded.xp,
        streak = case when public.user_xp.last_active = current_date then public.user_xp.streak
                      when public.user_xp.last_active = current_date - 1 then public.user_xp.streak + 1 else 1 end,
        last_active = current_date;
  end if;
  return awarded;
end $$;
revoke all on function public.complete_item(text, text, text, int) from public;
grant execute on function public.complete_item(text, text, text, int) to authenticated;
