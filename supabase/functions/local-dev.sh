#!/bin/bash

# Check if Supabase is already running
if ! supabase status | grep -q "Database: online"; then
  # Start Supabase locally
  echo "Starting Supabase locally..."
  supabase start
else
  echo "Supabase is already running."
fi

# Serve all functions locally
echo "Serving Edge Functions locally..."
echo "Note: This will override any running functions."
supabase functions serve --no-verify-jwt

echo "Edge Functions are now running locally."
echo "Access your functions at: http://localhost:54321/functions/v1/<function-name>"
echo ""
echo "Test with curl:"
echo "curl -i --location --request POST 'http://localhost:54321/functions/v1/create-checkout-session' \\"
echo "  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \\"
echo "  --header 'Content-Type: application/json' \\"
echo "  --data '{\"price\":\"price_premium_monthly\",\"success_url\":\"http://localhost:3000/personal\",\"cancel_url\":\"http://localhost:3000/payment-cancel\"}'" 