#!/usr/bin/env node

/**
 * Database migration script for Vercel deployment
 * This script ensures the database is properly migrated before the application starts
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Starting database migration...');

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Run database migrations
  console.log('🗄️ Running database migrations...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  console.log('✅ Database migration completed successfully!');
} catch (error) {
  console.error('❌ Database migration failed:', error.message);
  process.exit(1);
}
