-- Create table for storing experiment data and images
CREATE TABLE IF NOT EXISTS experiment_data (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer_a TEXT NOT NULL,
    answer_b TEXT NOT NULL,
    model_name VARCHAR(255) NOT NULL,
    original_id INTEGER NOT NULL,
    image_filename VARCHAR(255),
    image_data BYTEA,
    image_mime_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_experiment_data_model_name ON experiment_data(model_name);
CREATE INDEX IF NOT EXISTS idx_experiment_data_original_id ON experiment_data(original_id);

-- Enable Row Level Security
ALTER TABLE experiment_data ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to experiment data" ON experiment_data
    FOR SELECT USING (true);

-- Create policy for authenticated users to insert/update
CREATE POLICY "Allow authenticated users to insert experiment data" ON experiment_data
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update experiment data" ON experiment_data
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_experiment_data_updated_at 
    BEFORE UPDATE ON experiment_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
