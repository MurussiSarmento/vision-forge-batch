-- 1. Add user role for lucas
INSERT INTO public.user_roles (user_id, role)
VALUES ('7d640d86-c2c1-4e7b-998f-e2114d6fac54', 'user')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Create function to automatically assign user role when profile is created
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only insert if role doesn't exist yet
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3. Create trigger to automatically assign role when profile is created
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- 4. Add foreign key constraint to admin_activity_logs
ALTER TABLE public.admin_activity_logs
  DROP CONSTRAINT IF EXISTS admin_activity_logs_admin_user_id_fkey;

ALTER TABLE public.admin_activity_logs
  ADD CONSTRAINT admin_activity_logs_admin_user_id_fkey
  FOREIGN KEY (admin_user_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;