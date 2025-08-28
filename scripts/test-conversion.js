#!/usr/bin/env node

/**
 * Test script to convert experiment data from JSON to CSV
 * This script only tests the conversion part without requiring Supabase setup
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Experiment Data Conversion Process...\n');

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

/**
 * Convert PNG image to base64
 * @param {string} imagePath - Path to the PNG image
 * @returns {string} Base64 encoded image data
 */
function convertImageToBase64(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Data = imageBuffer.toString('base64');
    return base64Data;
  } catch (error) {
    console.error(`❌ Error converting image ${imagePath}:`, error.message);
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
 * @param {Array} pngFiles - List of PNG files
 * @returns {string} CSV formatted string
 */
function convertToCSV(jsonData, pngFiles) {
  // CSV headers matching experiment_data table schema
  const headers = [
    'question',
    'answer_a', 
    'answer_b',
    'model_name',
    'original_id',
    'image_filename',
    'image_data',
    'image_mime_type'
  ];
  
  // Create CSV content
  let csvContent = headers.join(',') + '\n';
  
  jsonData.forEach((item, index) => {
    const imageFilename = extractImageFilename(item.question);
    let imageData = '';
    let imageMimeType = '';
    
    // If image exists, convert to base64
    if (imageFilename && pngFiles.includes(imageFilename)) {
      const imagePath = path.join(publicDir, imageFilename);
      imageData = convertImageToBase64(imagePath);
      imageMimeType = 'image/png';
      
      if (!imageData) {
        console.warn(`⚠️  Warning: Could not convert image ${imageFilename}`);
      }
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
      escapeCSV(imageData),
      escapeCSV(imageMimeType)
    ];
    
    csvContent += row.join(',') + '\n';
  });
  
  return csvContent;
}

// Main execution
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
  
  // Convert to CSV
  console.log('\n🔄 Converting data to CSV format...');
  const csvContent = convertToCSV(jsonData, pngFiles);
  
  // Save CSV file
  const csvPath = path.join(currentDir, 'experiment_data_test.csv');
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  console.log(`💾 CSV file saved to: ${csvPath}`);
  
  // Display sample data
  if (jsonData.length > 0) {
    console.log('\n📋 Sample record:');
    console.log(JSON.stringify(jsonData[0], null, 2));
  }
  
  // Show CSV preview
  console.log('\n📄 CSV Preview (first 3 lines):');
  const csvLines = csvContent.split('\n').slice(0, 4);
  csvLines.forEach((line, index) => {
    if (line.trim()) {
      console.log(`${index === 0 ? 'Headers:' : `Row ${index}:`} ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
    }
  });
  
  console.log('\n✅ Conversion test completed successfully!');
  console.log(`📁 CSV file: ${csvPath}`);
  console.log('\n📝 Note: This is a test conversion only.');
  console.log('   To upload to Supabase, use the main script: run-load-experiment-data.js');
  
} catch (error) {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
}
