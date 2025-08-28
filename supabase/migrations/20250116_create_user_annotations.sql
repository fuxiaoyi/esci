-- Create user_annotations table to store intermediate results for each user
CREATE TABLE IF NOT EXISTS public.user_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  answer TEXT NOT NULL,
  comments TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure each user can only have one annotation per question
  UNIQUE(user_id, question_id)
);

-- Create index on user_id and question_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_annotations_user_id ON public.user_annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_annotations_question_id ON public.user_annotations(question_id);
CREATE INDEX IF NOT EXISTS idx_user_annotations_user_question ON public.user_annotations(user_id, question_id);

-- Set up Row Level Security (RLS)
ALTER TABLE public.user_annotations ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only read their own annotations
CREATE POLICY "Users can read their own annotations" 
  ON public.user_annotations 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Only authenticated users can insert their own annotations
CREATE POLICY "Users can insert their own annotations" 
  ON public.user_annotations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Only authenticated users can update their own annotations
CREATE POLICY "Users can update their own annotations" 
  ON public.user_annotations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Only authenticated users can delete their own annotations
CREATE POLICY "Users can delete their own annotations" 
  ON public.user_annotations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_annotations_updated_at ON public.user_annotations;
CREATE TRIGGER update_user_annotations_updated_at
  BEFORE UPDATE ON public.user_annotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); 