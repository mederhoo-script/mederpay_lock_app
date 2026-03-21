-- ============================================================================
-- MederBuy — Complete Supabase Schema
-- Run this entire file in the Supabase SQL Editor to set up a fresh database.
-- All monetary values are stored in kobo (1 NGN = 100 kobo).
--
-- IDEMPOTENT: safe to re-run on a blank project.  All tables and custom types
-- are dropped first (CASCADE) so no stale objects can block re-creation.
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONS
-- ============================================================================
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;


-- ============================================================================
-- 1. TEAR-DOWN (drop in reverse-dependency order so FK constraints don't block)
-- ============================================================================

-- triggers that reference auth.users are dropped implicitly when we drop the
-- function, but we drop them explicitly first to be safe
drop trigger if exists on_auth_user_created on auth.users;

-- application tables
drop table if exists public.weekly_fees        cascade;
drop table if exists public.fee_tiers          cascade;
drop table if exists public.phone_logs         cascade;
drop table if exists public.agent_settings     cascade;
drop table if exists public.virtual_accounts   cascade;
drop table if exists public.payments           cascade;
drop table if exists public.phone_sales        cascade;
drop table if exists public.buyers             cascade;
drop table if exists public.phones             cascade;
drop table if exists public.profiles           cascade;

-- custom enum types — no longer used (replaced with text + CHECK)
-- kept as no-ops so re-running this file after the old schema is safe
drop type if exists device_event_type  cascade;
drop type if exists weekly_fee_status  cascade;
drop type if exists gateway_name       cascade;
drop type if exists payment_status     cascade;
drop type if exists sale_status        cascade;
drop type if exists phone_status       cascade;
drop type if exists user_status        cascade;
drop type if exists user_role          cascade;

-- helper functions
drop function if exists public.recalculate_weekly_fees(date)  cascade;
drop function if exists public.get_fee_for_price(bigint)      cascade;
drop function if exists public.current_user_parent_agent_id() cascade;
drop function if exists public.current_user_role()            cascade;
drop function if exists public.handle_new_user()              cascade;
drop function if exists public.set_updated_at()               cascade;


-- ============================================================================
-- 2. (Custom ENUM types removed — text + CHECK constraints are used instead.
--    This avoids Supabase trigger cast failures and is fully equivalent.)
-- ============================================================================


-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- ── 3.1  profiles ────────────────────────────────────────────────────────────
-- One row per Supabase auth user.  Created by the handle_new_user trigger and
-- then upserted by the registration API with the full data.
create table public.profiles (
  id               uuid          primary key references auth.users(id) on delete cascade,
  full_name        text          not null default '',
  email            text          not null unique,
  username         text          unique,
  phone            text,
  role             text          not null default 'agent' check (role in ('agent', 'subagent', 'superadmin')),
  status           text          not null default 'pending' check (status in ('active', 'pending', 'suspended')),
  parent_agent_id  uuid          references public.profiles(id) on delete set null,
  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now()
);

comment on table public.profiles is
  'User accounts for agents, sub-agents, and superadmins.  Mirrors auth.users.';


-- ── 3.2  phones ──────────────────────────────────────────────────────────────
create table public.phones (
  id              uuid          primary key default uuid_generate_v4(),
  imei            varchar(20)   not null unique,
  brand           text          not null,
  model           text          not null,
  storage         text,
  color           text,
  cost_price      bigint        not null check (cost_price >= 0),
  selling_price   bigint        not null check (selling_price >= 0),
  down_payment    bigint        not null default 0 check (down_payment >= 0),
  weekly_payment  bigint        not null check (weekly_payment >= 0),
  payment_weeks   int           not null check (payment_weeks > 0),
  status          text          not null default 'available' check (status in ('available', 'sold', 'locked', 'unlocked', 'returned')),
  agent_id        uuid          not null references public.profiles(id) on delete restrict,
  registered_by   uuid          not null references public.profiles(id) on delete restrict,
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);

comment on table public.phones is
  'Phone inventory.  All prices in kobo.  weekly_payment = ceil((selling_price - down_payment) / payment_weeks).';


-- ── 3.3  buyers ──────────────────────────────────────────────────────────────
create table public.buyers (
  id               uuid        primary key default uuid_generate_v4(),
  full_name        text        not null,
  phone            text        not null,
  email            text,
  address          text        not null default '',
  bvn_encrypted    text,
  nin_encrypted    text,
  agent_id         uuid        not null references public.profiles(id) on delete restrict,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (phone, agent_id)
);

comment on table public.buyers is
  'Customer records.  BVN/NIN stored as-is; encrypt at the application layer before inserting.';


-- ── 3.4  phone_sales ─────────────────────────────────────────────────────────
create table public.phone_sales (
  id                         uuid        primary key default uuid_generate_v4(),
  phone_id                   uuid        not null references public.phones(id) on delete restrict,
  buyer_id                   uuid        not null references public.buyers(id) on delete restrict,
  agent_id                   uuid        not null references public.profiles(id) on delete restrict,
  sold_by                    uuid        not null references public.profiles(id) on delete restrict,
  selling_price              bigint      not null check (selling_price >= 0),
  down_payment               bigint      not null default 0 check (down_payment >= 0),
  weekly_payment             bigint      not null check (weekly_payment >= 0),
  total_weeks                int         not null check (total_weeks > 0),
  total_paid                 bigint      not null default 0 check (total_paid >= 0),
  outstanding_balance        bigint      not null check (outstanding_balance >= 0),
  weeks_paid                 int         not null default 0 check (weeks_paid >= 0),
  next_due_date              date,
  virtual_account_reference  text        unique,
  virtual_account_number     text,
  virtual_account_bank       text,
  payment_url                text,
  status                     text        not null default 'active' check (status in ('active', 'grace', 'lock', 'completed', 'defaulted')),
  sale_date                  timestamptz not null default now(),
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

comment on table public.phone_sales is
  'Phone financing contracts.  outstanding_balance starts at (selling_price - down_payment) and decreases with each payment.';


-- ── 3.5  payments ────────────────────────────────────────────────────────────
create table public.payments (
  id                uuid           primary key default uuid_generate_v4(),
  sale_id           uuid           not null references public.phone_sales(id) on delete restrict,
  buyer_id          uuid           not null references public.buyers(id) on delete restrict,
  agent_id          uuid           not null references public.profiles(id) on delete restrict,
  amount            bigint         not null check (amount > 0),
  gateway           text           not null,
  gateway_reference text           not null unique,
  status            text           not null default 'pending' check (status in ('pending', 'success', 'failed')),
  paid_at           timestamptz,
  created_at        timestamptz    not null default now()
);

comment on table public.payments is
  'Payment records from all gateways.  gateway_reference is unique to prevent double-posting.';


-- ── 3.6  virtual_accounts ────────────────────────────────────────────────────
create table public.virtual_accounts (
  id             uuid        primary key default uuid_generate_v4(),
  owner_type     text        not null default 'buyer',
  owner_id       uuid        not null,
  sale_id        uuid        references public.phone_sales(id) on delete set null,
  account_number text,
  account_name   text        not null,
  bank_name      text        not null default '',
  bank_code      text,
  gateway        text        not null,
  reference      text        not null unique,
  is_active      boolean     not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.virtual_accounts is
  'Virtual bank accounts created per sale through the agent''s active payment gateway.';


-- ── 3.7  agent_settings ──────────────────────────────────────────────────────
create table public.agent_settings (
  agent_id                         uuid        primary key references public.profiles(id) on delete cascade,
  active_gateway                   text        not null default 'monnify',
  monnify_api_key_encrypted        text,
  monnify_secret_key_encrypted     text,
  monnify_contract_code            text,
  paystack_secret_key_encrypted    text,
  flutterwave_secret_key_encrypted text,
  interswitch_client_id_encrypted  text,
  interswitch_client_secret_encrypted text,
  payment_url                      text,
  created_at                       timestamptz not null default now(),
  updated_at                       timestamptz not null default now()
);

comment on table public.agent_settings is
  'Per-agent payment gateway credentials and custom payment URL.';


-- ── 3.8  phone_logs ──────────────────────────────────────────────────────────
create table public.phone_logs (
  id          uuid               primary key default uuid_generate_v4(),
  phone_id    uuid               references public.phones(id) on delete set null,
  imei        varchar(20)        not null,
  event_type  text               not null check (event_type in (
    'DEVICE_REGISTERED', 'STATUS_CHECK', 'STATUS_CHANGE',
    'LOCK_ENFORCED', 'UNLOCK', 'ROOT_DETECTED',
    'BOOT', 'SYNC_FAIL', 'PAYMENT_RECEIVED'
  )),
  details     text,
  old_status  text,
  new_status  text,
  timestamp   timestamptz        not null default now(),
  created_at  timestamptz        not null default now()
);

comment on table public.phone_logs is
  'Append-only audit log for device events from the Android lock app and server-side actions.';


-- ── 3.9  fee_tiers ───────────────────────────────────────────────────────────
create table public.fee_tiers (
  id          uuid        primary key default uuid_generate_v4(),
  label       text        not null,
  min_price   bigint      not null check (min_price >= 0),
  max_price   bigint,                                        -- NULL means unlimited ceiling
  fee_amount  bigint      not null check (fee_amount >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.fee_tiers is
  'Platform fee tiers applied weekly per phone sold.  min/max/fee_amount are in kobo.  NULL max_price = unlimited.';


-- ── 3.10  weekly_fees ────────────────────────────────────────────────────────
create table public.weekly_fees (
  id          uuid               primary key default uuid_generate_v4(),
  agent_id    uuid               not null references public.profiles(id) on delete cascade,
  week_start  date               not null,
  week_end    date               not null,
  phones_sold int                not null default 0 check (phones_sold >= 0),
  total_fee   bigint             not null default 0 check (total_fee >= 0),
  status      text               not null default 'pending' check (status in ('pending', 'paid', 'overdue')),
  created_at  timestamptz        not null default now(),
  updated_at  timestamptz        not null default now(),
  unique (agent_id, week_start)
);

comment on table public.weekly_fees is
  'Platform fees charged to agents each week, calculated from phone_sales × fee_tiers.';


-- ============================================================================
-- 4. INDEXES
-- ============================================================================

-- profiles
create index if not exists idx_profiles_role            on public.profiles(role);
create index if not exists idx_profiles_status          on public.profiles(status);
create index if not exists idx_profiles_parent_agent_id on public.profiles(parent_agent_id);
create index if not exists idx_profiles_email           on public.profiles(email);

-- phones
create index if not exists idx_phones_agent_id  on public.phones(agent_id);
create index if not exists idx_phones_status    on public.phones(status);
create index if not exists idx_phones_imei      on public.phones(imei);

-- buyers
create index if not exists idx_buyers_agent_id on public.buyers(agent_id);
create index if not exists idx_buyers_phone    on public.buyers(phone);

-- phone_sales
create index if not exists idx_phone_sales_agent_id              on public.phone_sales(agent_id);
create index if not exists idx_phone_sales_phone_id              on public.phone_sales(phone_id);
create index if not exists idx_phone_sales_buyer_id              on public.phone_sales(buyer_id);
create index if not exists idx_phone_sales_sold_by               on public.phone_sales(sold_by);
create index if not exists idx_phone_sales_status                on public.phone_sales(status);
create index if not exists idx_phone_sales_next_due_date         on public.phone_sales(next_due_date);
create index if not exists idx_phone_sales_virtual_account_ref   on public.phone_sales(virtual_account_reference);

-- payments
create index if not exists idx_payments_sale_id           on public.payments(sale_id);
create index if not exists idx_payments_agent_id          on public.payments(agent_id);
create index if not exists idx_payments_gateway_reference on public.payments(gateway_reference);
create index if not exists idx_payments_status            on public.payments(status);

-- virtual_accounts
create index if not exists idx_virtual_accounts_sale_id   on public.virtual_accounts(sale_id);
create index if not exists idx_virtual_accounts_reference on public.virtual_accounts(reference);

-- phone_logs
create index if not exists idx_phone_logs_imei       on public.phone_logs(imei);
create index if not exists idx_phone_logs_phone_id   on public.phone_logs(phone_id);
create index if not exists idx_phone_logs_event_type on public.phone_logs(event_type);
create index if not exists idx_phone_logs_timestamp  on public.phone_logs(timestamp desc);

-- weekly_fees
create index if not exists idx_weekly_fees_agent_id   on public.weekly_fees(agent_id);
create index if not exists idx_weekly_fees_status     on public.weekly_fees(status);
create index if not exists idx_weekly_fees_week_start on public.weekly_fees(week_start);


-- ============================================================================
-- 5. HELPER FUNCTION — updated_at auto-stamp
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Attach to every table that has updated_at (triggers were already dropped in section 1)
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.phones
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.buyers
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.phone_sales
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.virtual_accounts
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.agent_settings
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.fee_tiers
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.weekly_fees
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 6. TRIGGER — handle_new_user
--    Automatically creates a stub profiles row when a new auth user signs up.
--    The registration API then upserts the full data on top.
-- ============================================================================

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

-- on_auth_user_created was already dropped in section 1
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================================
-- 7. ROW-LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on every table
alter table public.profiles        enable row level security;
alter table public.phones          enable row level security;
alter table public.buyers          enable row level security;
alter table public.phone_sales     enable row level security;
alter table public.payments        enable row level security;
alter table public.virtual_accounts enable row level security;
alter table public.agent_settings  enable row level security;
alter table public.phone_logs      enable row level security;
alter table public.fee_tiers       enable row level security;
alter table public.weekly_fees     enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: get the role of the currently authenticated user
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.current_user_role()
returns text language sql stable security definer as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_parent_agent_id()
returns uuid language sql stable security definer as $$
  select parent_agent_id from public.profiles where id = auth.uid();
$$;


-- ── 7.1  profiles ────────────────────────────────────────────────────────────
-- Superadmin: full access
drop policy if exists "superadmin_profiles_all"  on public.profiles;
create policy "superadmin_profiles_all" on public.profiles
  for all using (public.current_user_role() = 'superadmin');

-- Agent: see own row + their subagents
drop policy if exists "agent_profiles_select" on public.profiles;
create policy "agent_profiles_select" on public.profiles
  for select using (
    auth.uid() = id
    or (public.current_user_role() = 'agent' and parent_agent_id = auth.uid())
  );

-- Agent: update only their own row
drop policy if exists "agent_profiles_update" on public.profiles;
create policy "agent_profiles_update" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Subagent: see own row only
drop policy if exists "subagent_profiles_select" on public.profiles;
create policy "subagent_profiles_select" on public.profiles
  for select using (auth.uid() = id);

-- Subagent: update own row only
drop policy if exists "subagent_profiles_update" on public.profiles;
create policy "subagent_profiles_update" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);


-- ── 7.2  phones ──────────────────────────────────────────────────────────────
drop policy if exists "superadmin_phones_all" on public.phones;
create policy "superadmin_phones_all" on public.phones
  for all using (public.current_user_role() = 'superadmin');

-- Agent: full CRUD on their own phones
drop policy if exists "agent_phones_all" on public.phones;
create policy "agent_phones_all" on public.phones
  for all using (agent_id = auth.uid())
  with check (agent_id = auth.uid());

-- Subagent: read-only on their parent agent's phones
drop policy if exists "subagent_phones_select" on public.phones;
create policy "subagent_phones_select" on public.phones
  for select using (
    agent_id = public.current_user_parent_agent_id()
  );


-- ── 7.3  buyers ──────────────────────────────────────────────────────────────
drop policy if exists "superadmin_buyers_all" on public.buyers;
create policy "superadmin_buyers_all" on public.buyers
  for all using (public.current_user_role() = 'superadmin');

drop policy if exists "agent_buyers_all" on public.buyers;
create policy "agent_buyers_all" on public.buyers
  for all using (
    -- agent's own buyers
    agent_id = auth.uid()
    -- buyers registered by the agent's sub-agents
    or (
      public.current_user_role() = 'agent'
      and agent_id in (
        select id from public.profiles
        where parent_agent_id = auth.uid() and role = 'subagent'
      )
    )
  )
  with check (agent_id = auth.uid());

-- Subagent: read buyers belonging to their parent agent
drop policy if exists "subagent_buyers_select" on public.buyers;
create policy "subagent_buyers_select" on public.buyers
  for select using (
    agent_id = public.current_user_parent_agent_id()
  );


-- ── 7.4  phone_sales ─────────────────────────────────────────────────────────
drop policy if exists "superadmin_sales_all" on public.phone_sales;
create policy "superadmin_sales_all" on public.phone_sales
  for all using (public.current_user_role() = 'superadmin');

-- Agent: full CRUD on sales they own
drop policy if exists "agent_sales_all" on public.phone_sales;
create policy "agent_sales_all" on public.phone_sales
  for all using (agent_id = auth.uid())
  with check (agent_id = auth.uid());

-- Subagent: see only the sales they personally created
drop policy if exists "subagent_sales_select" on public.phone_sales;
create policy "subagent_sales_select" on public.phone_sales
  for select using (sold_by = auth.uid());

drop policy if exists "subagent_sales_insert" on public.phone_sales;
create policy "subagent_sales_insert" on public.phone_sales
  for insert with check (
    sold_by = auth.uid()
    and agent_id = public.current_user_parent_agent_id()
  );


-- ── 7.5  payments ────────────────────────────────────────────────────────────
drop policy if exists "superadmin_payments_all" on public.payments;
create policy "superadmin_payments_all" on public.payments
  for all using (public.current_user_role() = 'superadmin');

drop policy if exists "agent_payments_select" on public.payments;
create policy "agent_payments_select" on public.payments
  for select using (agent_id = auth.uid());

-- Subagent: see payments on their own sales
drop policy if exists "subagent_payments_select" on public.payments;
create policy "subagent_payments_select" on public.payments
  for select using (
    sale_id in (
      select id from public.phone_sales where sold_by = auth.uid()
    )
  );

-- Service-role writes bypass RLS; no insert policy needed for webhooks / verify API.


-- ── 7.6  virtual_accounts ────────────────────────────────────────────────────
drop policy if exists "superadmin_va_all" on public.virtual_accounts;
create policy "superadmin_va_all" on public.virtual_accounts
  for all using (public.current_user_role() = 'superadmin');

drop policy if exists "agent_va_all" on public.virtual_accounts;
create policy "agent_va_all" on public.virtual_accounts
  for all using (
    sale_id in (select id from public.phone_sales where agent_id = auth.uid())
  )
  with check (
    sale_id in (select id from public.phone_sales where agent_id = auth.uid())
  );

drop policy if exists "subagent_va_select" on public.virtual_accounts;
create policy "subagent_va_select" on public.virtual_accounts
  for select using (
    sale_id in (select id from public.phone_sales where sold_by = auth.uid())
  );


-- ── 7.7  agent_settings ──────────────────────────────────────────────────────
drop policy if exists "superadmin_settings_all" on public.agent_settings;
create policy "superadmin_settings_all" on public.agent_settings
  for all using (public.current_user_role() = 'superadmin');

drop policy if exists "agent_settings_own" on public.agent_settings;
create policy "agent_settings_own" on public.agent_settings
  for all using (agent_id = auth.uid())
  with check (agent_id = auth.uid());


-- ── 7.8  phone_logs ──────────────────────────────────────────────────────────
-- Only superadmin and the owning agent can read logs for their phones.
-- Inserts are done via service-role (webhooks, cron) and the device API.
drop policy if exists "superadmin_logs_all" on public.phone_logs;
create policy "superadmin_logs_all" on public.phone_logs
  for all using (public.current_user_role() = 'superadmin');

drop policy if exists "agent_logs_select" on public.phone_logs;
create policy "agent_logs_select" on public.phone_logs
  for select using (
    phone_id in (select id from public.phones where agent_id = auth.uid())
  );


-- ── 7.9  fee_tiers ───────────────────────────────────────────────────────────
-- Superadmin manages; everyone else reads (needed for fee calculation display).
drop policy if exists "superadmin_fee_tiers_all" on public.fee_tiers;
create policy "superadmin_fee_tiers_all" on public.fee_tiers
  for all using (public.current_user_role() = 'superadmin');

drop policy if exists "authenticated_fee_tiers_select" on public.fee_tiers;
create policy "authenticated_fee_tiers_select" on public.fee_tiers
  for select using (auth.role() = 'authenticated');


-- ── 7.10  weekly_fees ────────────────────────────────────────────────────────
drop policy if exists "superadmin_weekly_fees_all" on public.weekly_fees;
create policy "superadmin_weekly_fees_all" on public.weekly_fees
  for all using (public.current_user_role() = 'superadmin');

drop policy if exists "agent_weekly_fees_select" on public.weekly_fees;
create policy "agent_weekly_fees_select" on public.weekly_fees
  for select using (agent_id = auth.uid());


-- ============================================================================
-- 8. SEED DATA — default fee tiers
--    (kobo values: ₦50,000 = 5,000,000 kobo)
-- ============================================================================

insert into public.fee_tiers (label, min_price, max_price, fee_amount)
values
  ('Budget (< ₦50k)',       0,          4999999,  50000),   -- ₦500
  ('Mid-Range (₦50k–₦150k)', 5000000,   14999999, 100000),  -- ₦1,000
  ('Premium (₦150k–₦300k)', 15000000,  29999999, 200000),  -- ₦2,000
  ('Flagship (> ₦300k)',    30000000,  null,      300000)   -- ₦3,000
on conflict do nothing;


-- ============================================================================
-- 9. UTILITY FUNCTIONS
-- ============================================================================

-- 9.1  Calculate the weekly fee tier for a given selling_price (in kobo)
create or replace function public.get_fee_for_price(p_price bigint)
returns bigint language sql stable security definer as $$
  select coalesce(
    (
      select fee_amount
      from public.fee_tiers
      where p_price >= min_price
        and (max_price is null or p_price <= max_price)
      order by min_price desc
      limit 1
    ),
    0
  );
$$;


-- 9.2  Recalculate & upsert weekly_fees for all agents for a given week.
--      Call with the Monday of the target week, e.g.:
--        select public.recalculate_weekly_fees('2025-01-06');
create or replace function public.recalculate_weekly_fees(p_week_start date)
returns void language plpgsql security definer as $$
declare
  r record;
  v_week_end date;
  v_fee      bigint;
  v_count    int;
begin
  v_week_end := p_week_start + interval '6 days';

  -- For each agent who sold at least one phone in this window
  for r in
    select
      ps.agent_id,
      count(*)::int as phones_sold,
      array_agg(ph.selling_price) as prices
    from public.phone_sales ps
    join public.phones ph on ph.id = ps.phone_id
    where ps.sale_date::date between p_week_start and v_week_end
    group by ps.agent_id
  loop
    -- Sum up the fee for each phone sold
    v_fee := 0;
    for i in 1..array_length(r.prices, 1) loop
      v_fee := v_fee + public.get_fee_for_price(r.prices[i]);
    end loop;

    insert into public.weekly_fees
      (agent_id, week_start, week_end, phones_sold, total_fee, status)
    values
      (r.agent_id, p_week_start, v_week_end, r.phones_sold, v_fee, 'pending')
    on conflict (agent_id, week_start)
    do update set
      phones_sold = excluded.phones_sold,
      total_fee   = excluded.total_fee,
      updated_at  = now();
  end loop;
end;
$$;


-- ============================================================================
-- 10. GRANT PUBLIC SCHEMA USAGE TO SERVICE ROLES
--    Supabase anon & authenticated roles need usage on public schema.
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete
  on all tables in schema public
  to authenticated;

grant select, insert, update, delete
  on all tables in schema public
  to service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
