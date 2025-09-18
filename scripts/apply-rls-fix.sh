#!/bin/bash

# Script to apply the RLS policy fix for organization_users table
# This fixes the infinite recursion issue that was causing 404 errors on /api/auth/session

echo "Applying RLS policy fix for organization_users table..."

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed or not in PATH"
    echo "Please install it from: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "Error: supabase/config.toml not found. Please run this script from the project root."
    exit 1
fi

# Apply the migration
echo "Applying migration: 20250118_fix_organization_users_rls.sql"
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    echo "The /api/auth/session endpoint should now work correctly."
    echo ""
    echo "What was fixed:"
    echo "- Removed circular dependencies in RLS policies"
    echo "- Simplified organization_users policies to prevent infinite recursion"
    echo "- Added proper error handling in the session callback"
    echo "- Used admin client to bypass RLS for organization queries"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
