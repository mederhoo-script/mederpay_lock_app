-- ============================================================
-- Migration 002: Schema improvements for production readiness
-- ============================================================

-- ---------------------------------------------------------------
-- 1. ADD username TO profiles
--    The register page collects a username and RegisterAgentSchema
--    validates it, but 001 never created the column.
-- ---------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text;
-- Unique index (partial: only enforce uniqueness when set)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
  ON profiles (username) WHERE username IS NOT NULL;

-- ---------------------------------------------------------------
-- 2. ADD updated_at COLUMNS
--    profiles, phones, and phone_sales are frequently mutated but
--    have no updated_at timestamp, making auditing and caching hard.
--    agent_settings already has the column but no trigger.
-- ---------------------------------------------------------------
ALTER TABLE profiles    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE phones      ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE phone_sales ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ---------------------------------------------------------------
-- 3. updated_at TRIGGER FUNCTION + TRIGGERS
--    One shared function; each table gets its own trigger.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE OR REPLACE TRIGGER agent_settings_updated_at
  BEFORE UPDATE ON agent_settings
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE OR REPLACE TRIGGER phones_updated_at
  BEFORE UPDATE ON phones
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE OR REPLACE TRIGGER phone_sales_updated_at
  BEFORE UPDATE ON phone_sales
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ---------------------------------------------------------------
-- 4. handle_new_user TRIGGER
--    Auto-creates a profiles row whenever a Supabase Auth user is
--    created — critical for Google OAuth sign-ups where the Next.js
--    API route is bypassed and no manual insert happens.
--
--    ON CONFLICT (id) DO NOTHING ensures the manually-inserted
--    profiles row from /api/auth/register always wins (the API
--    insert runs after this trigger and now uses UPSERT).
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (
    id,
    full_name,
    email,
    phone,
    username,
    role,
    status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'username',
    COALESCE(NEW.raw_user_meta_data->>'role', 'agent'),
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate so re-running this migration is idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---------------------------------------------------------------
-- 5. PERFORMANCE INDEXES
--    Cover all hot query paths visible in the API layer.
-- ---------------------------------------------------------------

-- profiles — email uniqueness check in register/sub-agent APIs
CREATE INDEX IF NOT EXISTS idx_profiles_email        ON profiles (email);
-- profiles — role filter in admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_role         ON profiles (role);
-- profiles — sub-agent listing (.eq('parent_agent_id', user.id))
CREATE INDEX IF NOT EXISTS idx_profiles_parent_agent ON profiles (parent_agent_id);

-- phones — device lookup by IMEI (most frequent device-layer query)
CREATE INDEX IF NOT EXISTS idx_phones_imei      ON phones (imei);
-- phones — status filter (available/sold/locked)
CREATE INDEX IF NOT EXISTS idx_phones_status    ON phones (status);
-- phones — agent ownership
CREATE INDEX IF NOT EXISTS idx_phones_agent_id  ON phones (agent_id);

-- phone_sales — overdue cron (.in('status',…).lt('next_due_date', today))
CREATE INDEX IF NOT EXISTS idx_phone_sales_status       ON phone_sales (status);
CREATE INDEX IF NOT EXISTS idx_phone_sales_next_due     ON phone_sales (next_due_date);
-- phone_sales — Monnify/webhook lookup by virtual account reference
CREATE INDEX IF NOT EXISTS idx_phone_sales_va_ref       ON phone_sales (virtual_account_reference);
-- phone_sales — buyer and agent ownership filters
CREATE INDEX IF NOT EXISTS idx_phone_sales_buyer_id     ON phone_sales (buyer_id);
CREATE INDEX IF NOT EXISTS idx_phone_sales_agent_id     ON phone_sales (agent_id);

-- payments — duplicate-payment guard in webhook handlers
CREATE INDEX IF NOT EXISTS idx_payments_gateway_ref ON payments (gateway_reference);
-- payments — sale join and agent ownership
CREATE INDEX IF NOT EXISTS idx_payments_sale_id     ON payments (sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_agent_id    ON payments (agent_id);

-- buyers — agent ownership filter
CREATE INDEX IF NOT EXISTS idx_buyers_agent_id ON buyers (agent_id);

-- phone_logs — IMEI device-event lookup
CREATE INDEX IF NOT EXISTS idx_phone_logs_imei     ON phone_logs (imei);
CREATE INDEX IF NOT EXISTS idx_phone_logs_phone_id ON phone_logs (phone_id);

-- virtual_accounts — owner and sale joins
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_owner_id ON virtual_accounts (owner_id);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_sale_id  ON virtual_accounts (sale_id);

-- ---------------------------------------------------------------
-- 6. FIX DEPRECATED auth.role() IN RLS POLICY
--    auth.role() was deprecated in Supabase in favour of checking
--    auth.uid() IS NOT NULL for "is this user authenticated?".
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "authenticated_read_fee_tiers" ON fee_tiers;
CREATE POLICY "authenticated_read_fee_tiers" ON fee_tiers
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ---------------------------------------------------------------
-- 7. payments.payment_method VALUE CONSTRAINT
--    The column currently has no CHECK, so any string is accepted.
--    Constrain it to the values actually used by the gateways.
-- ---------------------------------------------------------------
ALTER TABLE payments
  ADD CONSTRAINT IF NOT EXISTS payments_method_check
  CHECK (
    payment_method IS NULL OR
    payment_method IN ('bank_transfer', 'card', 'ussd', 'cash', 'wallet')
  );
