-- Create user_quotas table
CREATE TABLE IF NOT EXISTS public.user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_quotas_user_id ON public.user_quotas(user_id);

-- Set up Row Level Security (RLS)
ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only read their own quota
CREATE POLICY "Users can read their own quota" 
  ON public.user_quotas 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Only authenticated users can insert their own quota
CREATE POLICY "Users can insert their own quota" 
  ON public.user_quotas 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Only authenticated users can update their own quota
CREATE POLICY "Users can update their own quota" 
  ON public.user_quotas 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create function to initialize user quota on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_quotas (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 