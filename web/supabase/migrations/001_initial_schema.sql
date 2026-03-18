-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- PROFILES
CREATE TABLE profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  role text NOT NULL CHECK (role IN ('superadmin', 'agent', 'subagent')),
  parent_agent_id uuid REFERENCES profiles(id),
  status text NOT NULL CHECK (status IN ('active', 'pending', 'suspended')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- AGENT SETTINGS
CREATE TABLE agent_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES profiles(id) UNIQUE NOT NULL,
  bvn_encrypted text,
  nin_encrypted text,
  monnify_api_key_encrypted text,
  monnify_secret_key_encrypted text,
  monnify_contract_code text,
  paystack_secret_key_encrypted text,
  flutterwave_secret_key_encrypted text,
  interswitch_client_id_encrypted text,
  interswitch_client_secret_encrypted text,
  active_gateway text CHECK (active_gateway IN ('monnify','paystack','flutterwave','interswitch')),
  payment_url text,
  fee_blocked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- PHONES
CREATE TABLE phones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES profiles(id) NOT NULL,
  imei text UNIQUE NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  storage text,
  color text,
  cost_price bigint NOT NULL,
  selling_price bigint NOT NULL,
  down_payment bigint NOT NULL DEFAULT 0,
  weekly_payment bigint NOT NULL,
  payment_weeks integer NOT NULL,
  status text NOT NULL CHECK (status IN ('available', 'sold', 'locked', 'unlocked', 'returned')) DEFAULT 'available',
  registered_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- BUYERS
CREATE TABLE buyers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES profiles(id) NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  bvn_encrypted text,
  nin_encrypted text,
  address text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- PHONE SALES
CREATE TABLE phone_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_id uuid REFERENCES phones(id) NOT NULL,
  buyer_id uuid REFERENCES buyers(id) NOT NULL,
  agent_id uuid REFERENCES profiles(id) NOT NULL,
  sold_by uuid REFERENCES profiles(id) NOT NULL,
  selling_price bigint NOT NULL,
  down_payment bigint NOT NULL DEFAULT 0,
  weekly_payment bigint NOT NULL,
  total_weeks integer NOT NULL,
  weeks_paid integer NOT NULL DEFAULT 0,
  total_paid bigint NOT NULL DEFAULT 0,
  outstanding_balance bigint NOT NULL,
  next_due_date date NOT NULL,
  sale_date timestamptz DEFAULT now(),
  status text NOT NULL CHECK (status IN ('active', 'grace', 'lock', 'completed', 'defaulted')) DEFAULT 'active',
  payment_url text,
  virtual_account_number text,
  virtual_account_bank text,
  virtual_account_reference text
);

-- PAYMENTS
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES phone_sales(id) NOT NULL,
  buyer_id uuid REFERENCES buyers(id) NOT NULL,
  agent_id uuid REFERENCES profiles(id) NOT NULL,
  amount bigint NOT NULL,
  payment_method text,
  gateway text,
  gateway_reference text,
  status text NOT NULL CHECK (status IN ('pending', 'success', 'failed')) DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- PHONE LOGS
CREATE TABLE phone_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_id uuid REFERENCES phones(id),
  imei text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'DEVICE_REGISTERED','STATUS_CHECK','STATUS_CHANGE',
    'LOCK_ENFORCED','UNLOCK','ROOT_DETECTED',
    'BOOT','SYNC_FAIL','PAYMENT_RECEIVED'
  )),
  old_status text,
  new_status text,
  details text,
  timestamp timestamptz DEFAULT now()
);

-- FEE TIERS
CREATE TABLE fee_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_price bigint NOT NULL,
  max_price bigint,
  fee_amount bigint NOT NULL,
  label text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- WEEKLY FEES
CREATE TABLE weekly_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES profiles(id) NOT NULL,
  week_start date NOT NULL,
  week_end date NOT NULL,
  phones_sold integer NOT NULL DEFAULT 0,
  total_fee bigint NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'overdue')) DEFAULT 'pending',
  virtual_account_number text,
  virtual_account_bank text,
  monnify_reference text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- VIRTUAL ACCOUNTS
CREATE TABLE virtual_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type text NOT NULL CHECK (owner_type IN ('buyer', 'agent_fee')),
  owner_id uuid NOT NULL,
  sale_id uuid REFERENCES phone_sales(id),
  account_number text NOT NULL,
  account_name text NOT NULL,
  bank_name text NOT NULL,
  bank_code text,
  gateway text NOT NULL,
  reference text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_accounts ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to get parent agent id
CREATE OR REPLACE FUNCTION get_parent_agent_id(user_id uuid)
RETURNS uuid AS $$
  SELECT parent_agent_id FROM profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- PROFILES RLS
CREATE POLICY "superadmin_all_profiles" ON profiles
  FOR ALL USING (get_user_role(auth.uid()) = 'superadmin');

CREATE POLICY "agent_own_profile" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR
    (get_user_role(auth.uid()) = 'agent' AND parent_agent_id = auth.uid())
  );

CREATE POLICY "agent_update_own_profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "subagent_own_profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- AGENT SETTINGS RLS
CREATE POLICY "superadmin_all_settings" ON agent_settings
  FOR ALL USING (get_user_role(auth.uid()) = 'superadmin');

CREATE POLICY "agent_own_settings" ON agent_settings
  FOR ALL USING (agent_id = auth.uid());

-- PHONES RLS
CREATE POLICY "superadmin_all_phones" ON phones
  FOR ALL USING (get_user_role(auth.uid()) = 'superadmin');

CREATE POLICY "agent_own_phones" ON phones
  FOR ALL USING (agent_id = auth.uid());

CREATE POLICY "subagent_read_phones" ON phones
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'subagent' AND
    agent_id = get_parent_agent_id(auth.uid())
  );

-- BUYERS RLS
CREATE POLICY "superadmin_all_buyers" ON buyers
  FOR ALL USING (get_user_role(auth.uid()) = 'superadmin');

CREATE POLICY "agent_own_buyers" ON buyers
  FOR ALL USING (agent_id = auth.uid());

CREATE POLICY "subagent_read_buyers" ON buyers
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'subagent' AND
    agent_id = get_parent_agent_id(auth.uid())
  );

-- PHONE SALES RLS
CREATE POLICY "superadmin_all_sales" ON phone_sales
  FOR ALL USING (get_user_role(auth.uid()) = 'superadmin');

CREATE POLICY "agent_own_sales" ON phone_sales
  FOR ALL USING (agent_id = auth.uid());

CREATE POLICY "subagent_read_sales" ON phone_sales
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'subagent' AND
    agent_id = get_parent_agent_id(auth.uid())
  );

-- PAYMENTS RLS
CREATE POLICY "superadmin_all_payments" ON payments
  FOR ALL USING (get_user_role(auth.uid()) = 'superadmin');

CREATE POLICY "agent_own_payments" ON payments
  FOR ALL USING (agent_id = auth.uid());

-- PHONE LOGS RLS
CREATE POLICY "superadmin_all_logs" ON phone_logs
  FOR ALL USING (get_user_role(auth.uid()) = 'superadmin');

CREATE POLICY "agent_own_logs" ON phone_logs
  FOR ALL USING (
    phone_id IN (SELECT id FROM phones WHERE agent_id = auth.uid())
  );

CREATE POLICY "subagent_read_logs" ON phone_logs
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'subagent' AND
    phone_id IN (SELECT id FROM phones WHERE agent_id = get_parent_agent_id(auth.uid()))
  );

-- FEE TIERS RLS
CREATE POLICY "superadmin_all_fee_tiers" ON fee_tiers
  FOR ALL USING (get_user_role(auth.uid()) = 'superadmin');

CREATE POLICY "authenticated_read_fee_tiers" ON fee_tiers
  FOR SELECT USING (auth.role() = 'authenticated');

-- WEEKLY FEES RLS
CREATE POLICY "superadmin_all_weekly_fees" ON weekly_fees
  FOR ALL USING (get_user_role(auth.uid()) = 'superadmin');

CREATE POLICY "agent_own_weekly_fees" ON weekly_fees
  FOR SELECT USING (agent_id = auth.uid());

-- VIRTUAL ACCOUNTS RLS
CREATE POLICY "superadmin_all_vas" ON virtual_accounts
  FOR ALL USING (get_user_role(auth.uid()) = 'superadmin');

CREATE POLICY "agent_own_vas" ON virtual_accounts
  FOR ALL USING (
    owner_id = auth.uid() OR
    sale_id IN (SELECT id FROM phone_sales WHERE agent_id = auth.uid())
  );

-- SEED DATA: Fee tiers (values in kobo - multiply naira by 100)
INSERT INTO fee_tiers (min_price, max_price, fee_amount, label) VALUES
  (0, 9999999, 0, '₦0 – ₦99,999'),
  (10000000, 16000000, 500000, '₦100,000 – ₦160,000'),
  (16000100, 25000000, 800000, '₦160,001 – ₦250,000'),
  (25000100, 40000000, 1200000, '₦250,001 – ₦400,000'),
  (40000100, NULL, 1500000, '₦400,001+');
