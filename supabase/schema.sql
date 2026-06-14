-- ============================================================
-- MUNDIAL 2026 - PRODE SOCIAL
-- Schema completo para Supabase PostgreSQL
-- Pegar en: SQL Editor > New Query > Run
-- ============================================================

-- Extensión para UUIDs
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLA: leagues
-- Almacena las ligas privadas
-- ============================================================
create table if not exists public.leagues (
  id text primary key,                          -- ej: "liga-a3b9x2k"
  slug text not null,                           -- mismo valor que id
  name text not null,                           -- nombre de la liga (mismo que id por ahora)
  host_name text not null,                      -- slug del creador (admin)
  pin text not null default '',                 -- PIN de 4 dígitos para unirse
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABLA: users
-- Usuarios participantes de cada liga
-- ============================================================
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  league_id text not null references public.leagues(id) on delete cascade,
  name text not null,                           -- nombre visible
  slug text not null,                           -- slug para URLs (único por liga)
  joined_at timestamptz not null default now(),
  unique (league_id, slug)
);

-- ============================================================
-- TABLA: predictions
-- Pronósticos de cada usuario para cada partido
-- ============================================================
create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  league_id text not null references public.leagues(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  match_id text not null,                       -- ID del partido (football-data.org)
  outcome text not null check (outcome in ('HOME', 'DRAW', 'AWAY')),
  created_at timestamptz not null default now(),
  unique (user_id, match_id)
);

-- ============================================================
-- TABLA: matches (nueva)
-- Caché local de partidos para evitar depender 100% de la API
-- Se actualiza periódicamente desde football-data.org
-- ============================================================
create table if not exists public.matches (
  id text primary key,                          -- ID del partido (football-data.org)
  round text not null default '',
  stage text not null default '',
  group_name text,                              -- ej: "Grupo A" o null si es eliminatoria
  home_team text not null,
  away_team text not null,
  home_score integer,                           -- null si no se jugó
  away_score integer,                           -- null si no se jugó
  utc_date timestamptz not null,
  status text not null default 'SCHEDULED',     -- SCHEDULED | LIVE | FINISHED
  venue text not null default '',
  broadcast text default '',
  updated_at timestamptz not null default now()
);

-- Índice para búsquedas por estado
create index if not exists idx_matches_status on public.matches(status);
create index if not exists idx_matches_stage on public.matches(stage);

-- ============================================================
-- TABLA: final_predictions
-- Predicciones especiales: campeón, subcampeón, 3°, 4°
-- ============================================================
create table if not exists public.final_predictions (
  id uuid primary key default gen_random_uuid(),
  league_id text not null references public.leagues(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  category text not null check (category in ('champion', 'runner_up', 'third_place', 'fourth_place')),
  team text not null,
  created_at timestamptz not null default now(),
  unique (user_id, category)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.leagues enable row level security;
alter table public.users enable row level security;
alter table public.predictions enable row level security;
alter table public.matches enable row level security;
alter table public.final_predictions enable row level security;

-- Políticas públicas (sin autenticación, solo por anon key)
-- En producción, se recomienda restringir más estas políticas

-- leagues: cualquiera puede leer/insertar/actualizar
create policy "public leagues read" on public.leagues for select using (true);
create policy "public leagues insert" on public.leagues for insert with check (true);
create policy "public leagues update" on public.leagues for update using (true) with check (true);

-- users: cualquiera puede leer/insertar/actualizar
create policy "public users read" on public.users for select using (true);
create policy "public users insert" on public.users for insert with check (true);
create policy "public users update" on public.users for update using (true) with check (true);

-- predictions: cualquiera puede leer/insertar/actualizar
create policy "public predictions read" on public.predictions for select using (true);
create policy "public predictions insert" on public.predictions for insert with check (true);
create policy "public predictions update" on public.predictions for update using (true) with check (true);

-- matches: cualquiera puede leer/insertar/actualizar
create policy "public matches read" on public.matches for select using (true);
create policy "public matches insert" on public.matches for insert with check (true);
create policy "public matches update" on public.matches for update using (true) with check (true);

-- final_predictions: cualquiera puede leer/insertar/actualizar
create policy "public final_predictions read" on public.final_predictions for select using (true);
create policy "public final_predictions insert" on public.final_predictions for insert with check (true);
create policy "public final_predictions update" on public.final_predictions for update using (true) with check (true);
