-- ============================================================================
-- BrowDesk — Fase A: catálogo de servicios (tablas services + service_categories)
-- Incremental: NO borra datos existentes. Pegar en SQL Editor → Run.
-- Idempotente (create if not exists / drop policy if exists).
-- ============================================================================

create table if not exists public.services (
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

create table if not exists public.service_categories (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label       text not null,
  icon        text not null,
  created_at  text not null,
  updated_at  text not null
);

do $$
declare t text;
begin
  foreach t in array array['services','service_categories']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists own_rows on public.%I;', t);
    execute format(
      'create policy own_rows on public.%I for all to authenticated
         using (user_id = auth.uid()) with check (user_id = auth.uid());', t);
  end loop;
end $$;
