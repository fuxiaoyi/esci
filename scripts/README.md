# Experiment Data Loading Script

This script converts experiment data from JSON format to CSV and uploads it to Supabase, with images stored in Cloudflare CDN.

## Features

1. **JSON to CSV Conversion**: Converts `data.json` to CSV format matching the `experiment_data` table schema
2. **Cloudflare CDN Integration**: Uploads PNG images to Cloudflare CDN and stores URLs in the database
3. **Supabase Upload**: Automatically uploads the converted data to your Supabase database

## Prerequisites

1. **Environment Variables**: You need to set up your Supabase and Cloudflare credentials
2. **Dependencies**: The script requires `dotenv`, `form-data`, and `node-fetch` packages (already installed)
3. **Cloudflare Account**: A Cloudflare account with Images API access

## Setup

1. **Create a `.env` file** in your project root with your credentials:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co

# Choose ONE of these keys:
VITE_SUPABASE_ANON_KEY=your-anon-key-here
# OR (recommended for data insertion)
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your-account-id-here
CLOUDFLARE_API_TOKEN=your-api-token-here
CLOUDFLARE_DOMAIN=your-domain.com

# Alternative (non-Vite) format:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
# OR
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

CLOUDFLARE_ACCOUNT_ID=your-account-id-here
CLOUDFLARE_API_TOKEN=your-api-token-here
CLOUDFLARE_DOMAIN=your-domain.com
```

2. **Get your Supabase credentials**:
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the Project URL and anon/public key

3. **Get your Cloudflare credentials**:
   - Go to your Cloudflare dashboard
   - Navigate to My Profile > API Tokens
   - Create a new token with "Cloudflare Images" permissions
   - Copy your Account ID from the dashboard sidebar

## Usage

Run the script from your project root:

```bash
node scripts/run-load-experiment-data.js
```

## What the Script Does

1. **Data Validation**: Checks for required files (`data.json` and PNG images)
2. **Cloudflare Image Upload**: Uploads PNG images to Cloudflare CDN
3. **CSV Conversion**: Converts JSON data to CSV format with proper escaping
4. **Database Upload**: Uploads data with image URLs to Supabase in batches
5. **Output**: Creates `experiment_data.csv` file and uploads to database

## Output Files

- `experiment_data.csv`: CSV file with all experiment data
- Database records in your Supabase `experiment_data` table

## Database Schema

The script uploads data matching this structure:
- `question`: The experiment question text
- `answer_a`: First answer option
- `answer_b`: Second answer option  
- `model_name`: Model identifier
- `original_id`: Original ID from JSON
- `image_filename`: PNG filename if image exists
- `image_url`: Cloudflare CDN URL for the image
- `image_mime_type`: Image MIME type (image/png)

## Troubleshooting

- **Missing environment variables**: Check your `.env` file
- **Database connection issues**: Verify your Supabase credentials
- **Image conversion errors**: Ensure PNG files are readable
- **Upload failures**: Check your Supabase RLS policies and permissions

### **RLS Policy Issues (Common Problem)**

If you get "new row violates row-level security policy" errors:

1. **Use Service Role Key** (Recommended):
   - Get your service role key from Supabase Dashboard → Settings → API
   - Add `VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key` to your `.env` file

2. **Update RLS Policies**:
   - Run the SQL in `supabase/fix-rls-policy.sql` in your Supabase SQL editor
   - Or temporarily disable RLS: `ALTER TABLE experiment_data DISABLE ROW LEVEL SECURITY;`

3. **Check User Permissions**:
   - Ensure your user has the correct role and permissions
   - Verify the table policies allow your user to insert data

## Notes

- The script clears existing data before uploading (configurable)
- Images are uploaded to Cloudflare CDN for fast, global delivery
- Image URLs are stored in the database instead of base64 data
- Data is uploaded in batches of 50 records to avoid payload limits
- CSV escaping handles commas, quotes, and newlines properly
