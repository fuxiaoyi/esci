-- Create the system_status table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_status (
  id SERIAL PRIMARY KEY,
  system TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  estimated_recovery_time TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(system)
);

-- Create an index on system for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_status_system ON system_status(system);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_status_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_system_status_updated_at ON system_status;
CREATE TRIGGER update_system_status_updated_at
BEFORE UPDATE ON system_status
FOR EACH ROW
EXECUTE FUNCTION update_system_status_updated_at_column();

-- Create RLS policies for the system_status table
ALTER TABLE system_status ENABLE ROW LEVEL SECURITY;

-- Policy for users to read system status
DROP POLICY IF EXISTS "Users can read system status" ON system_status;
CREATE POLICY "Users can read system status"
  ON system_status
  FOR SELECT
  USING (true);

-- Policy for the service role to manage system status
DROP POLICY IF EXISTS "Service role can manage system status" ON system_status;
CREATE POLICY "Service role can manage system status"
  ON system_status
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions to authenticated users
GRANT SELECT ON system_status TO authenticated;

-- Grant all permissions to the service role
GRANT ALL ON system_status TO service_role;

-- Insert initial data for payment system status (if not exists)
INSERT INTO system_status (system, status, message)
VALUES ('payment', 'operational', 'Payment system is operational.')
ON CONFLICT (system) DO NOTHING; 