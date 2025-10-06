-- Add unique constraint to prevent duplicate keys per user
ALTER TABLE public.api_keys 
ADD CONSTRAINT api_keys_user_id_encrypted_key_unique 
UNIQUE (user_id, encrypted_key);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id_valid 
ON public.api_keys(user_id, is_valid) 
WHERE is_valid = true;