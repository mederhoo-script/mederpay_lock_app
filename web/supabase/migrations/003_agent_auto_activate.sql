-- ============================================================
-- Migration 003: Auto-activate agents on registration
-- ============================================================
-- Previously the handle_new_user trigger (migration 002) created
-- new profiles with status = 'pending', requiring superadmin
-- approval before agents could use the platform.
-- Since no superadmin account exists yet, agents must be able to
-- start using the platform immediately after registering.
-- This migration patches the trigger to set status = 'active'.
-- ============================================================

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
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
