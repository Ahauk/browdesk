-- ============================================================================
-- BrowDesk — esquema multi-tenant seguro (Tanda B2)
-- Pegar completo en: Supabase Dashboard → SQL Editor → New query → Run
-- Es idempotente: se puede volver a correr sin problema.
--
-- Qué hace:
--   1. Elimina la función insegura run_migration (SQL arbitrario vía anon key).
--   2. Recrea todas las tablas con user_id (dueño = cuenta autenticada).
--   3. Activa RLS: cada usuario solo ve/edita SUS filas.
--   4. Crea el bucket de fotos PRIVADO con políticas por usuario.
--
-- OJO: borra los datos de prueba actuales (eran de Carolina). Es intencional.
-- ============================================================================

-- ── 1. Quitar el agujero de seguridad ──────────────────────────────────────
drop function if exists public.run_migration(text);

-- ── 2. Tablas (se recrean desde cero) ──────────────────────────────────────
drop table if exists public.follow_ups        cascade;
drop table if exists public.appointments      cascade;
drop table if exists public.photos            cascade;
drop table if exists public.procedures        cascade;
drop table if exists public.inspirations      cascade;
drop table if exists public.services          cascade;
drop table if exists public.service_categories cascade;
drop table if exists public.clients           cascade;
drop table if exists public.user_profile      cascade;

create table public.clients (
  id                  text primary key,
  user_id             uuid not null default auth.uid() references auth.users(id) on delete cascade,
  first_name          text not null,
  last_name           text not null,
  phone               text not null,
  email               text,
  age                 integer,
  address             text,
  emergency_contact   text,
  emergency_phone     text,
  emergency_relation  text,
  referral_source     text,
  fitzpatrick_type    integer,
  medical_conditions  text,
  clinical_answers    text,
  allergies_detail    text,
  medications_detail  text,
  notes               text,
  avatar_uri          text,
  allergies           text,
  conditions          text,
  diabetes            integer default 0,
  pregnancy           integer default 0,
  hypertension        integer default 0,
  created_at          text not null,
  updated_at          text not null
);

create table public.procedures (
  id               text primary key,
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id        text not null,
  type             text not null,
  technique        text not null,
  zone_details     text,
  cost             numeric not null default 0,
  guarantee        integer,
  guarantee_days   integer,
  tones            text,
  needles          text,
  notes            text,
  date             text not null,
  follow_up_date   text,
  before_photo_id  text,
  after_photo_id   text,
  created_at       text not null,
  updated_at       text not null
);

create table public.photos (
  id            text primary key,
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  procedure_id  text,
  client_id     text not null,
  type          text not null,
  local_uri     text not null,
  remote_url    text,
  created_at    text not null
);

create table public.appointments (
  id                text primary key,
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id         text not null,
  procedure_type    text,
  procedure_types   text,
  date              text not null,
  "time"            text not null,
  end_time          text,
  duration          integer,
  notes             text,
  calendar_event_id text,
  status            text not null default 'scheduled',
  created_at        text not null,
  updated_at        text not null
);

create table public.follow_ups (
  id              text primary key,
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  procedure_id    text,
  appointment_id  text,
  client_id       text not null,
  due_date        text not null,
  status          text not null default 'pending',
  notes           text,
  created_at      text not null,
  updated_at      text not null
);

create table public.inspirations (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category    text not null,
  local_uri   text not null,
  caption     text,
  created_at  text not null
);

create table public.services (
  id             text primary key,
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name           text not null,
  category_key   text not null,
  pricing_type   text not null,
  price          numeric,
  package_price  numeric,
  created_at     text not null,
  updated_at     text not null
);

create table public.service_categories (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label       text not null,
  icon        text not null,
  created_at  text not null,
  updated_at  text not null
);

create table public.user_profile (
  id                     text primary key,
  user_id                uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name                   text not null,
  studio_name            text,
  logo_uri               text,
  treatment              text,
  email                  text,
  avatar_uri             text,
  biometric_enabled      integer default 1,
  calendar_sync_enabled  integer default 0,
  pin_hash               text,
  created_at             text not null,
  updated_at             text not null
);

-- ── 3. Row Level Security: cada quien ve solo lo suyo ───────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'clients','procedures','photos','appointments',
    'follow_ups','inspirations','services','service_categories','user_profile'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists own_rows on public.%I;', t);
    execute format(
      'create policy own_rows on public.%I for all to authenticated
         using (user_id = auth.uid()) with check (user_id = auth.uid());', t);
  end loop;
end $$;

-- ── 4. Bucket de fotos PRIVADO + políticas por usuario ──────────────────────
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do update set public = false;

-- Remove legacy public policies from the old public bucket (security hole).
drop policy if exists "Allow photo reads" on storage.objects;
drop policy if exists "Allow photo uploads" on storage.objects;
drop policy if exists "Allow photo deletes" on storage.objects;

drop policy if exists photos_own_select on storage.objects;
drop policy if exists photos_own_insert on storage.objects;
drop policy if exists photos_own_update on storage.objects;
drop policy if exists photos_own_delete on storage.objects;

-- El path de cada foto es "<user_id>/<client_id>/<procedure_id>/<id>.jpg",
-- así que la primera carpeta debe ser el id del usuario autenticado.
create policy photos_own_select on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy photos_own_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy photos_own_update on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy photos_own_delete on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
