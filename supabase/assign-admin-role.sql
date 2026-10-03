-- Replace BOTH occurrences of the example email, then run in Supabase SQL Editor.
-- Do not expose app_metadata as user-editable data.
UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
WHERE lower(email) = lower('replace-with-your-admin-email@example.com');

-- Confirm the intended account received the admin role.
SELECT id, email, raw_app_meta_data ->> 'role' AS role
FROM auth.users
WHERE lower(email) = lower('replace-with-your-admin-email@example.com');
