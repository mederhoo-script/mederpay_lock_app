-- ============================================================================
-- MederBuy — Fix Migration for Existing Databases
--
-- Run this in the Supabase SQL Editor if your database was set up BEFORE the
-- schema.sql idempotency fix and registration is failing with:
--   ERROR 22P02: invalid input value for enum user_role: "agent"
--
-- This migration adds any missing enum labels in-place WITHOUT dropping tables
-- or losing any existing data.
-- ============================================================================

-- ── user_role ──────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_enum
    where enumlabel = 'agent'
    and enumtypid = (select oid from pg_type where typname = 'user_role')
  ) then
    alter type user_role add value 'agent';
  end if;

  if not exists (
    select 1 from pg_enum
    where enumlabel = 'subagent'
    and enumtypid = (select oid from pg_type where typname = 'user_role')
  ) then
    alter type user_role add value 'subagent';
  end if;

  if not exists (
    select 1 from pg_enum
    where enumlabel = 'superadmin'
    and enumtypid = (select oid from pg_type where typname = 'user_role')
  ) then
    alter type user_role add value 'superadmin';
  end if;
end $$;

-- ── user_status ────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_enum
    where enumlabel = 'active'
    and enumtypid = (select oid from pg_type where typname = 'user_status')
  ) then
    alter type user_status add value 'active';
  end if;

  if not exists (
    select 1 from pg_enum
    where enumlabel = 'pending'
    and enumtypid = (select oid from pg_type where typname = 'user_status')
  ) then
    alter type user_status add value 'pending';
  end if;

  if not exists (
    select 1 from pg_enum
    where enumlabel = 'suspended'
    and enumtypid = (select oid from pg_type where typname = 'user_status')
  ) then
    alter type user_status add value 'suspended';
  end if;
end $$;

-- ── phone_status ───────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_enum where enumlabel = 'available'  and enumtypid = (select oid from pg_type where typname = 'phone_status')) then alter type phone_status add value 'available';  end if;
  if not exists (select 1 from pg_enum where enumlabel = 'sold'       and enumtypid = (select oid from pg_type where typname = 'phone_status')) then alter type phone_status add value 'sold';       end if;
  if not exists (select 1 from pg_enum where enumlabel = 'locked'     and enumtypid = (select oid from pg_type where typname = 'phone_status')) then alter type phone_status add value 'locked';     end if;
  if not exists (select 1 from pg_enum where enumlabel = 'unlocked'   and enumtypid = (select oid from pg_type where typname = 'phone_status')) then alter type phone_status add value 'unlocked';   end if;
  if not exists (select 1 from pg_enum where enumlabel = 'returned'   and enumtypid = (select oid from pg_type where typname = 'phone_status')) then alter type phone_status add value 'returned';   end if;
end $$;

-- ── sale_status ────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_enum where enumlabel = 'active'    and enumtypid = (select oid from pg_type where typname = 'sale_status')) then alter type sale_status add value 'active';    end if;
  if not exists (select 1 from pg_enum where enumlabel = 'grace'     and enumtypid = (select oid from pg_type where typname = 'sale_status')) then alter type sale_status add value 'grace';     end if;
  if not exists (select 1 from pg_enum where enumlabel = 'lock'      and enumtypid = (select oid from pg_type where typname = 'sale_status')) then alter type sale_status add value 'lock';      end if;
  if not exists (select 1 from pg_enum where enumlabel = 'completed' and enumtypid = (select oid from pg_type where typname = 'sale_status')) then alter type sale_status add value 'completed'; end if;
  if not exists (select 1 from pg_enum where enumlabel = 'defaulted' and enumtypid = (select oid from pg_type where typname = 'sale_status')) then alter type sale_status add value 'defaulted'; end if;
end $$;

-- ── payment_status ─────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_enum where enumlabel = 'success' and enumtypid = (select oid from pg_type where typname = 'payment_status')) then alter type payment_status add value 'success'; end if;
  if not exists (select 1 from pg_enum where enumlabel = 'failed'  and enumtypid = (select oid from pg_type where typname = 'payment_status')) then alter type payment_status add value 'failed';  end if;
  if not exists (select 1 from pg_enum where enumlabel = 'pending' and enumtypid = (select oid from pg_type where typname = 'payment_status')) then alter type payment_status add value 'pending'; end if;
end $$;

-- ── weekly_fee_status ──────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_enum where enumlabel = 'pending' and enumtypid = (select oid from pg_type where typname = 'weekly_fee_status')) then alter type weekly_fee_status add value 'pending'; end if;
  if not exists (select 1 from pg_enum where enumlabel = 'paid'    and enumtypid = (select oid from pg_type where typname = 'weekly_fee_status')) then alter type weekly_fee_status add value 'paid';    end if;
  if not exists (select 1 from pg_enum where enumlabel = 'overdue' and enumtypid = (select oid from pg_type where typname = 'weekly_fee_status')) then alter type weekly_fee_status add value 'overdue'; end if;
end $$;
