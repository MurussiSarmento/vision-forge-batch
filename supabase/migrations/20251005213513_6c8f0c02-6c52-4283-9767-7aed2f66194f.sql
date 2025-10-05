-- Add unique constraint to api_keys table to prevent duplicate keys per user
ALTER TABLE public.api_keys
ADD CONSTRAINT api_keys_user_encrypted_unique 
UNIQUE (user_id, encrypted_key);