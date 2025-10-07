-- Add policies to deny anonymous access to sensitive tables

-- Deny anonymous SELECT access to profiles table
CREATE POLICY "deny_anon_select_profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Deny anonymous SELECT access to api_keys table
CREATE POLICY "deny_anon_select_api_keys"
ON public.api_keys
FOR SELECT
TO anon
USING (false);