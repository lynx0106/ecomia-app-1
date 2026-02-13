-- Table for tracking allocated research searches per user
-- Used when users don't have their own LLM API key
CREATE TABLE IF NOT EXISTS public.user_allocated_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  allocated_count INT NOT NULL DEFAULT 0,
  used_count INT NOT NULL DEFAULT 0,
  reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_allocated_searches ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their allocated searches"
  ON public.user_allocated_searches FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Only admins can update allocated searches"
  ON public.user_allocated_searches FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Index
CREATE INDEX ON public.user_allocated_searches(user_id);
CREATE INDEX ON public.user_allocated_searches(reset_date);
