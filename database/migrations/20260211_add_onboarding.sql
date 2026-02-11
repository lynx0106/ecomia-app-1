-- Migration: Add onboarding tracking
-- Description: Create table to track which users completed the interactive onboarding tour

-- Create table
CREATE TABLE IF NOT EXISTS public.onboarding_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_tour BOOLEAN DEFAULT FALSE,
  tour_completed_at TIMESTAMP WITH TIME ZONE,
  tour_skipped BOOLEAN DEFAULT FALSE,
  tour_steps_completed INTEGER DEFAULT 0,
  total_tour_steps INTEGER DEFAULT 5,
  last_tour_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  device_type VARCHAR(50), -- 'mobile', 'tablet', 'desktop'
  browser VARCHAR(100), -- 'Chrome', 'Firefox', 'Safari', etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_onboarding_user_id ON public.onboarding_status(user_id);
CREATE INDEX idx_onboarding_completed ON public.onboarding_status(completed_tour);
CREATE INDEX idx_onboarding_created_at ON public.onboarding_status(created_at);

-- Enable RLS
ALTER TABLE public.onboarding_status ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own onboarding status
CREATE POLICY "Users can view their own onboarding status"
  ON public.onboarding_status
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own onboarding status
CREATE POLICY "Users can update their own onboarding status"
  ON public.onboarding_status
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own onboarding status (on signup)
CREATE POLICY "Users can insert their own onboarding status"
  ON public.onboarding_status
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_onboarding_updated_at_trigger ON public.onboarding_status;
CREATE TRIGGER update_onboarding_updated_at_trigger
  BEFORE UPDATE ON public.onboarding_status
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

-- Function to auto-create onboarding record on user signup
-- This will be called from a POST-signup trigger in Supabase auth
CREATE OR REPLACE FUNCTION public.handle_new_user_onboarding()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.onboarding_status (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user onboarding (run on auth.users)
-- WARNING: This requires Supabase Custom SQL trigger setup

-- Analytic view: Onboarding completion stats
CREATE OR REPLACE VIEW onboarding_stats AS
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN completed_tour THEN 1 END) as completed_tour,
  COUNT(CASE WHEN tour_skipped THEN 1 END) as skipped_tour,
  ROUND(
    100.0 * COUNT(CASE WHEN completed_tour THEN 1 END) / COUNT(*),
    2
  ) as completion_rate,
  AVG(tour_steps_completed) as avg_steps_completed,
  MAX(tour_steps_completed) as max_steps_completed,
  MIN(tour_steps_completed) as min_steps_completed
FROM public.onboarding_status;

-- Time-based completion stats
CREATE OR REPLACE VIEW onboarding_daily_stats AS
SELECT
  DATE(created_at) as signup_date,
  COUNT(*) as new_users,
  COUNT(CASE WHEN completed_tour THEN 1 END) as completed_tour,
  ROUND(
    100.0 * COUNT(CASE WHEN completed_tour THEN 1 END) / COUNT(*),
    2
  ) as daily_completion_rate
FROM public.onboarding_status
GROUP BY DATE(created_at)
ORDER BY signup_date DESC;
