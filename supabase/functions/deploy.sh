#!/bin/bash

# Check if project reference is provided
if [ -z "$1" ]; then
  echo "Error: Project reference is required"
  echo "Usage: ./deploy.sh your-project-ref"
  exit 1
fi

PROJECT_REF=$1

echo "Deploying Edge Functions to project: $PROJECT_REF"

# Deploy all functions
echo "Deploying create-checkout-session..."
supabase functions deploy create-checkout-session --project-ref $PROJECT_REF

echo "Deploying verify-payment-session..."
supabase functions deploy verify-payment-session --project-ref $PROJECT_REF

echo "Deploying check-payment-status..."
supabase functions deploy check-payment-status --project-ref $PROJECT_REF

echo "Deploying get-payment-recovery-time..."
supabase functions deploy get-payment-recovery-time --project-ref $PROJECT_REF

echo "All functions deployed successfully!"
echo "Don't forget to set the required environment variables in your Supabase project:"
echo "- STRIPE_SECRET_KEY"
echo "- SUPABASE_URL"
echo "- SUPABASE_SERVICE_ROLE_KEY" 