-- Add RLS policies to allow users to insert and update their own subscription data

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

-- Update permissions for authenticated users
GRANT INSERT, UPDATE ON user_subscriptions TO authenticated; 