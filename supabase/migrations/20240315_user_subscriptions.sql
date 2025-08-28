-- Create the user_subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  is_subscribed BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for the user_subscriptions table
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own subscription data
DROP POLICY IF EXISTS "Users can read their own subscription data" ON user_subscriptions;
CREATE POLICY "Users can read their own subscription data"
  ON user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to insert their own subscription data
DROP POLICY IF EXISTS "Users can insert their own subscription data" ON user_subscriptions;
CREATE POLICY "Users can insert their own subscription data"
  ON user_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own subscription data
DROP POLICY IF EXISTS "Users can update their own subscription data" ON user_subscriptions;
CREATE POLICY "Users can update their own subscription data"
  ON user_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for the service role to manage all subscription data
DROP POLICY IF EXISTS "Service role can manage all subscription data" ON user_subscriptions;
CREATE POLICY "Service role can manage all subscription data"
  ON user_subscriptions
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON user_subscriptions TO authenticated;

-- Grant all permissions to the service role
GRANT ALL ON user_subscriptions TO service_role; 