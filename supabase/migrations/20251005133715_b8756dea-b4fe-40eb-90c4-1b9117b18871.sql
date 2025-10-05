-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- API Keys table (encrypted storage)
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT false,
  last_validated_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Generation sessions table
CREATE TABLE public.generation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_prompts INTEGER NOT NULL DEFAULT 0,
  completed_prompts INTEGER DEFAULT 0,
  failed_prompts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prompt batches table
CREATE TABLE public.prompt_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.generation_sessions(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  reference_image_url TEXT,
  variations_count INTEGER DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Generation results table
CREATE TABLE public.generation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES public.prompt_batches(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  variation_number INTEGER NOT NULL,
  is_selected BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_results ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- API Keys policies
CREATE POLICY "Users can view their own API keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Generation sessions policies
CREATE POLICY "Users can view their own sessions"
  ON public.generation_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.generation_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.generation_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Prompt batches policies
CREATE POLICY "Users can view their own prompt batches"
  ON public.prompt_batches FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.generation_sessions WHERE id = session_id));

CREATE POLICY "Users can insert their own prompt batches"
  ON public.prompt_batches FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.generation_sessions WHERE id = session_id));

CREATE POLICY "Users can update their own prompt batches"
  ON public.prompt_batches FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM public.generation_sessions WHERE id = session_id));

-- Generation results policies
CREATE POLICY "Users can view their own results"
  ON public.generation_results FOR SELECT
  USING (auth.uid() = (
    SELECT gs.user_id 
    FROM public.generation_sessions gs
    JOIN public.prompt_batches pb ON pb.session_id = gs.id
    WHERE pb.id = batch_id
  ));

CREATE POLICY "Users can insert their own results"
  ON public.generation_results FOR INSERT
  WITH CHECK (auth.uid() = (
    SELECT gs.user_id 
    FROM public.generation_sessions gs
    JOIN public.prompt_batches pb ON pb.session_id = gs.id
    WHERE pb.id = batch_id
  ));

CREATE POLICY "Users can update their own results"
  ON public.generation_results FOR UPDATE
  USING (auth.uid() = (
    SELECT gs.user_id 
    FROM public.generation_sessions gs
    JOIN public.prompt_batches pb ON pb.session_id = gs.id
    WHERE pb.id = batch_id
  ));

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_api_keys
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_sessions
  BEFORE UPDATE ON public.generation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_batches
  BEFORE UPDATE ON public.prompt_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_generation_sessions_user_id ON public.generation_sessions(user_id);
CREATE INDEX idx_prompt_batches_session_id ON public.prompt_batches(session_id);
CREATE INDEX idx_generation_results_batch_id ON public.generation_results(batch_id);
CREATE INDEX idx_generation_sessions_status ON public.generation_sessions(status);
CREATE INDEX idx_prompt_batches_status ON public.prompt_batches(status);