#!/usr/bin/env node

/**
 * Script to convert experiment data from JSON to CSV and upload to Supabase
 * This script will:
 * 1. Convert data.json to CSV format matching experiment_data table schema
 * 2. Upload PNG images to Cloudflare CDN and get URLs
 * 3. Upload the data with image URLs to Supabase database
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import FormData from 'form-data';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('🚀 Starting Experiment Data Conversion and Upload Process...\n');

// Check if we're in the right directory
const currentDir = process.cwd();
console.log(`Current directory: ${currentDir}`);

// Check if data.json exists
const dataJsonPath = path.join(currentDir, 'public', 'data.json');
if (!fs.existsSync(dataJsonPath)) {
  console.error('❌ data.json not found in public directory');
  process.exit(1);
}

// Check if PNG files exist
const publicDir = path.join(currentDir, 'public');
const pngFiles = fs.readdirSync(publicDir)
  .filter(file => file.endsWith('.png'))
  .filter(file => file.startsWith('实验'));

console.log(`📸 Found ${pngFiles.length} experiment PNG files`);

// Check for required environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cloudflare configuration
const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN;
const cloudflareZoneId = process.env.CLOUDFLARE_ZONE_ID;
const cloudflareDomain = process.env.CLOUDFLARE_DOMAIN || 'your-domain.com';

if (!supabaseUrl) {
  console.error('❌ Missing Supabase URL environment variable:');
  console.error('   VITE_SUPABASE_URL or SUPABASE_URL');
  process.exit(1);
}

if (!supabaseAnonKey && !supabaseServiceKey) {
  console.error('❌ Missing Supabase key environment variable:');
  console.error('   VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY');
  console.error('   OR');
  console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nNote: Service role key is recommended for data insertion operations.');
  process.exit(1);
}

if (!cloudflareAccountId || !cloudflareApiToken) {
  console.error('❌ Missing Cloudflare environment variables:');
  console.error('   CLOUDFLARE_ACCOUNT_ID');
  console.error('   CLOUDFLARE_API_TOKEN');
  console.error('\nPlease check your .env file or set these environment variables.');
  process.exit(1);
}

// Initialize Supabase client (prefer service role key for admin operations)
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

if (supabaseServiceKey) {
  console.log('🔑 Using Supabase Service Role Key (full access)');
} else {
  console.log('🔑 Using Supabase Anon Key (limited access - may need RLS policy updates)');
}

console.log('☁️  Using Cloudflare CDN for image storage');

/**
 * Upload image to Cloudflare CDN
 * @param {string} imagePath - Path to the PNG image
 * @param {string} filename - Filename for the image
 * @returns {Promise<string|null>} Cloudflare URL or null if failed
 */
async function uploadImageToCloudflare(imagePath, filename) {
  try {
    console.log(`📤 Uploading ${filename} to Cloudflare...`);
    
    // Create form data
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath), {
      filename: filename,
      contentType: 'image/png'
    });

    // Upload to Cloudflare Images API
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/images/v1`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cloudflareApiToken}`,
        ...form.getHeaders()
      },
      body: form
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Cloudflare upload failed for ${filename}:`, errorText);
      return null;
    }

    const result = await response.json();
    
    if (result.success) {
      const imageUrl = result.result.variants[0] || result.result.url;
      console.log(`✅ ${filename} uploaded successfully: ${imageUrl}`);
      return imageUrl;
    } else {
      console.error(`❌ Cloudflare upload failed for ${filename}:`, result.errors);
      return null;
    }
    
  } catch (error) {
    console.error(`❌ Error uploading ${filename} to Cloudflare:`, error.message);
    return null;
  }
}

/**
 * Extract image filename from question text
 * @param {string} question - Question text that may contain image reference
 * @returns {string|null} Image filename or null if no image
 */
function extractImageFilename(question) {
  const imageMatch = question.match(/!\[image\]\((实验\d+\.png)\)/);
  return imageMatch ? imageMatch[1] : null;
}

/**
 * Convert data to CSV format matching experiment_data table schema
 * @param {Array} jsonData - JSON data from data.json
 * @param {Object} imageUrls - Mapping of filenames to Cloudflare URLs
 * @returns {string} CSV formatted string
 */
function convertToCSV(jsonData, imageUrls) {
  // CSV headers matching experiment_data table schema
  const headers = [
    'question',
    'answer_a', 
    'answer_b',
    'model_name',
    'original_id',
    'image_filename',
    'image_url',
    'image_mime_type'
  ];
  
  // Create CSV content
  let csvContent = headers.join(',') + '\n';
  
  jsonData.forEach((item, index) => {
    const imageFilename = extractImageFilename(item.question);
    let imageUrl = '';
    let imageMimeType = '';
    
    // If image exists, get the Cloudflare URL
    if (imageFilename && imageUrls[imageFilename]) {
      imageUrl = imageUrls[imageFilename];
      imageMimeType = 'image/png';
    }
    
    // Escape CSV values (handle commas and quotes)
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };
    
    // Build CSV row
    const row = [
      escapeCSV(item.question),
      escapeCSV(item.answer_a),
      escapeCSV(item.answer_b),
      escapeCSV(item.model_name),
      escapeCSV(item.id),
      escapeCSV(imageFilename),
      escapeCSV(imageUrl),
      escapeCSV(imageMimeType)
    ];
    
    csvContent += row.join(',') + '\n';
  });
  
  return csvContent;
}

/**
 * Upload data to Supabase
 * @param {Array} jsonData - JSON data to upload
 * @param {Object} imageUrls - Mapping of filenames to Cloudflare URLs
 */
async function uploadToSupabase(jsonData, imageUrls) {
  console.log('📤 Starting upload to Supabase...');
  
  try {
    // First, clear existing data (optional - remove if you want to append)
    console.log('🗑️  Clearing existing experiment data...');
    
    // Try to clear existing data
    const { error: deleteError } = await supabase
      .from('experiment_data')
      .delete()
      .neq('id', 0); // Delete all records
    
    if (deleteError) {
      console.warn('⚠️  Warning: Could not clear existing data:', deleteError.message);
      console.log('   This might be due to RLS policies. Continuing with insertion...');
    } else {
      console.log('✅ Existing data cleared');
    }
    
    // Prepare data for insertion
    const insertData = jsonData.map((item) => {
      const imageFilename = extractImageFilename(item.question);
      let imageUrl = null;
      let imageMimeType = null;
      
      // If image exists, get the Cloudflare URL
      if (imageFilename && imageUrls[imageFilename]) {
        imageUrl = imageUrls[imageFilename];
        imageMimeType = 'image/png';
      }
      
      return {
        question: item.question,
        answer_a: item.answer_a,
        answer_b: item.answer_b,
        model_name: item.model_name,
        original_id: item.id,
        image_filename: imageFilename,
        image_url: imageUrl,
        image_mime_type: imageMimeType
      };
    });
    
    console.log(`📊 Inserting ${insertData.length} records...`);
    
    // Insert data in batches to avoid payload size limits
    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < insertData.length; i += batchSize) {
      const batch = insertData.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('experiment_data')
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
        console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} inserted successfully`);
      }
    }
    
    console.log(`\n📈 Upload Summary:`);
    console.log(`   ✅ Successfully uploaded: ${successCount} records`);
    if (errorCount > 0) {
      console.log(`   ❌ Failed to upload: ${errorCount} records`);
    }
    
  } catch (error) {
    console.error('❌ Error during Supabase upload:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Load and parse the JSON data
    console.log('📊 Loading and parsing data.json...');
    const jsonData = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8'));
    console.log(`✅ Loaded ${jsonData.length} records from data.json`);
    
    // Count records with image references
    const imageReferences = jsonData.filter(item => 
      item.question && item.question.includes('![image]')
    );
    console.log(`🖼️  Found ${imageReferences.length} records with image references`);
    
    // Upload images to Cloudflare CDN
    console.log('\n☁️  Starting Cloudflare image uploads...');
    const imageUrls = {};
    let uploadSuccessCount = 0;
    let uploadFailureCount = 0;
    
    for (const pngFile of pngFiles) {
      const imagePath = path.join(publicDir, pngFile);
      const imageUrl = await uploadImageToCloudflare(imagePath, pngFile);
      
      if (imageUrl) {
        imageUrls[pngFile] = imageUrl;
        uploadSuccessCount++;
      } else {
        uploadFailureCount++;
      }
    }
    
    console.log(`\n📸 Cloudflare Upload Summary:`);
    console.log(`   ✅ Successfully uploaded: ${uploadSuccessCount} images`);
    if (uploadFailureCount > 0) {
      console.log(`   ❌ Failed to upload: ${uploadFailureCount} images`);
    }
    
    // Convert to CSV
    console.log('\n🔄 Converting data to CSV format...');
    const csvContent = convertToCSV(jsonData, imageUrls);
    
    // Save CSV file
    const csvPath = path.join(currentDir, 'experiment_data.csv');
    fs.writeFileSync(csvPath, csvContent, 'utf8');
    console.log(`💾 CSV file saved to: ${csvPath}`);
    
    // Display sample data
    if (jsonData.length > 0) {
      console.log('\n📋 Sample record:');
      console.log(JSON.stringify(jsonData[0], null, 2));
    }
    
    // Upload to Supabase
    console.log('\n🚀 Starting Supabase upload...');
    await uploadToSupabase(jsonData, imageUrls);
    
    console.log('\n🎉 Process completed successfully!');
    console.log(`📁 CSV file: ${csvPath}`);
    console.log(`📊 Database: ${supabaseUrl}`);
    console.log(`☁️  Images stored in Cloudflare CDN`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
