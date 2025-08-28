-- Create the user_subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  is_subscribed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to the table
COMMENT ON TABLE public.user_subscriptions IS 'Stores subscription status for users';

-- Create the upsert function
CREATE OR REPLACE FUNCTION public.upsert_user_subscription(
  p_user_id UUID,
  p_is_subscribed BOOLEAN,
  p_updated_at TIMESTAMP WITH TIME ZONE
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, is_subscribed, updated_at)
  VALUES (p_user_id, p_is_subscribed, p_updated_at)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    is_subscribed = p_is_subscribed,
    updated_at = p_updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to the function
COMMENT ON FUNCTION public.upsert_user_subscription IS 'Safely upserts a user subscription record';

-- Grant permissions to the function
GRANT EXECUTE ON FUNCTION public.upsert_user_subscription TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_user_subscription TO authenticated;

-- Set up Row Level Security
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON public.user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role can do everything"
  ON public.user_subscriptions
  TO service_role
  USING (true)
  WITH CHECK (true);