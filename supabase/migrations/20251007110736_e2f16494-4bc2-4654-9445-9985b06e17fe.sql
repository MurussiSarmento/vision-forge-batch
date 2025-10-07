-- Drop existing foreign keys if they exist (to recreate them properly)
ALTER TABLE public.admin_activity_logs
DROP CONSTRAINT IF EXISTS admin_activity_logs_admin_user_id_fkey;

ALTER TABLE public.admin_activity_logs
DROP CONSTRAINT IF EXISTS admin_activity_logs_target_user_id_fkey;

ALTER TABLE public.api_keys
DROP CONSTRAINT IF EXISTS api_keys_user_id_fkey;

-- Add foreign key constraints for admin_activity_logs table
ALTER TABLE public.admin_activity_logs
ADD CONSTRAINT admin_activity_logs_admin_user_id_fkey 
FOREIGN KEY (admin_user_id) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

ALTER TABLE public.admin_activity_logs
ADD CONSTRAINT admin_activity_logs_target_user_id_fkey 
FOREIGN KEY (target_user_id) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- Add foreign key constraint for api_keys table
ALTER TABLE public.api_keys
ADD CONSTRAINT api_keys_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;