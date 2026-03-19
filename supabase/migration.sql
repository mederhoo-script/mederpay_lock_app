-- ============================================================================
-- MederBuy — Fix Migration for Existing Databases
--
-- Run this in the Supabase SQL Editor if your database was set up with the
-- old ENUM-type schema and registration is failing.
--
-- This migration converts all ENUM-typed columns to text + CHECK constraints,
-- updates helper functions, and recreates the handle_new_user trigger.
-- NO DATA IS DROPPED. All existing rows are preserved.
-- ============================================================================

-- ── Step 1: Drop the old on_auth_user_created trigger and helper functions ──
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.current_user_role() cascade;
drop function if exists public.current_user_parent_agent_id() cascade;

-- ── Step 2: Convert profiles.role from ENUM to text ────────────────────────
do $$
begin
  -- Only alter if the column is still an enum type
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'profiles'
      and column_name  = 'role'
      and udt_name     = 'user_role'
  ) then
    alter table public.profiles
      alter column role type text using role::text;

    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('agent', 'subagent', 'superadmin'));
  end if;
end $$;

-- ── Step 3: Convert profiles.status from ENUM to text ──────────────────────
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'profiles'
      and column_name  = 'status'
      and udt_name     = 'user_status'
  ) then
    alter table public.profiles
      alter column status type text using status::text;

    alter table public.profiles
      add constraint profiles_status_check
      check (status in ('active', 'pending', 'suspended'));
  end if;
end $$;

-- ── Step 4: Convert phones.status from ENUM to text ────────────────────────
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'phones'
      and column_name  = 'status'
      and udt_name     = 'phone_status'
  ) then
    alter table public.phones
      alter column status type text using status::text;

    alter table public.phones
      add constraint phones_status_check
      check (status in ('available', 'sold', 'locked', 'unlocked', 'returned'));
  end if;
end $$;

-- ── Step 5: Convert phone_sales.status from ENUM to text ───────────────────
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'phone_sales'
      and column_name  = 'status'
      and udt_name     = 'sale_status'
  ) then
    alter table public.phone_sales
      alter column status type text using status::text;

    alter table public.phone_sales
      add constraint phone_sales_status_check
      check (status in ('active', 'grace', 'lock', 'completed', 'defaulted'));
  end if;
end $$;

-- ── Step 6: Convert payments.gateway and payments.status from ENUM to text ──
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'payments'
      and column_name  = 'gateway'
      and udt_name     = 'gateway_name'
  ) then
    alter table public.payments
      alter column gateway type text using gateway::text;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'payments'
      and column_name  = 'status'
      and udt_name     = 'payment_status'
  ) then
    alter table public.payments
      alter column status type text using status::text;

    alter table public.payments
      add constraint payments_status_check
      check (status in ('pending', 'success', 'failed'));
  end if;
end $$;

-- ── Step 7: Convert phone_logs.event_type from ENUM to text ────────────────
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'phone_logs'
      and column_name  = 'event_type'
      and udt_name     = 'device_event_type'
  ) then
    alter table public.phone_logs
      alter column event_type type text using event_type::text;

    alter table public.phone_logs
      add constraint phone_logs_event_type_check
      check (event_type in (
        'DEVICE_REGISTERED', 'STATUS_CHECK', 'STATUS_CHANGE',
        'LOCK_ENFORCED', 'UNLOCK', 'ROOT_DETECTED',
        'BOOT', 'SYNC_FAIL', 'PAYMENT_RECEIVED'
      ));
  end if;
end $$;

-- ── Step 8: Convert weekly_fees.status from ENUM to text ───────────────────
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'weekly_fees'
      and column_name  = 'status'
      and udt_name     = 'weekly_fee_status'
  ) then
    alter table public.weekly_fees
      alter column status type text using status::text;

    alter table public.weekly_fees
      add constraint weekly_fees_status_check
      check (status in ('pending', 'paid', 'overdue'));
  end if;
end $$;

-- ── Step 9: Drop now-unused ENUM types ─────────────────────────────────────
drop type if exists device_event_type cascade;
drop type if exists weekly_fee_status cascade;
drop type if exists gateway_name      cascade;
drop type if exists payment_status    cascade;
drop type if exists sale_status       cascade;
drop type if exists phone_status      cascade;
drop type if exists user_status       cascade;
drop type if exists user_role         cascade;

-- ── Step 10: Recreate helper functions (return text, no ENUM casts) ─────────
create or replace function public.current_user_role()
returns text language sql stable security definer as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_parent_agent_id()
returns uuid language sql stable security definer as $$
  select parent_agent_id from public.profiles where id = auth.uid();
$$;

-- ── Step 11: Recreate handle_new_user trigger (no ENUM casts) ───────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email, username, phone, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'agent'),
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

