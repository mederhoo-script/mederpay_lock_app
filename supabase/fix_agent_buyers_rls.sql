-- ============================================================
-- SAFE ONE-TIME FIX  —  paste this into the Supabase SQL Editor
-- ============================================================
-- What it does:
--   Updates the RLS policy on the `buyers` table so that a
--   parent agent can see buyers that were registered by any
--   of their sub-agents.
--
-- What it does NOT do:
--   - Drops or alters any table
--   - Deletes or changes any data row
--   - Touches any other policy or function
--
-- It is safe to run on a live database with existing data.
-- ============================================================

-- Step 1: Remove the old, restrictive policy (safe — no data lost)
drop policy if exists "agent_buyers_all" on public.buyers;

-- Step 2: Recreate the policy with sub-agent visibility
create policy "agent_buyers_all" on public.buyers
  for all using (
    -- agents can always see their own buyers
    agent_id = auth.uid()
    -- agents can also see buyers created by any of their sub-agents
    or (
      public.current_user_role() = 'agent'
      and agent_id in (
        select id
        from public.profiles
        where parent_agent_id = auth.uid()
          and role = 'subagent'
      )
    )
  )
  -- INSERT is still restricted: agents can only register buyers under their own account
  with check (agent_id = auth.uid());
