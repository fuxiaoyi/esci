-- Update experiment_data table schema for Cloudflare CDN integration
-- This migration changes the table to store image URLs instead of base64 data

-- First, let's see the current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'experiment_data' 
ORDER BY ordinal_position;

-- Add the new image_url column
ALTER TABLE experiment_data 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update existing records to have empty image_url if image_data exists
UPDATE experiment_data 
SET image_url = '' 
WHERE image_url IS NULL AND image_data IS NOT NULL;

-- Make image_url NOT NULL with default empty string
ALTER TABLE experiment_data 
ALTER COLUMN image_url SET NOT NULL,
ALTER COLUMN image_url SET DEFAULT '';

-- Create index on image_url for better performance
CREATE INDEX IF NOT EXISTS idx_experiment_data_image_url ON experiment_data(image_url);

-- Optional: Drop the old image_data column (uncomment if you want to remove it)
-- ALTER TABLE experiment_data DROP COLUMN image_data;

-- Verify the updated structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'experiment_data' 
ORDER BY ordinal_position;

-- Show sample data
SELECT id, question, image_filename, image_url, image_mime_type 
FROM experiment_data 
LIMIT 5;
