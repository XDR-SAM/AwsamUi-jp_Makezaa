-- Invoker RPCs re-check that the owner still exists and has the trusted admin role.
-- Supabase service_role can administer users through Auth, but has no SQL SELECT
-- on auth.users by default. Grant only the two columns those checks reference.
-- Functions keep SECURITY INVOKER; browser roles receive no additional access.
grant select (id, raw_app_meta_data) on auth.users to service_role;
