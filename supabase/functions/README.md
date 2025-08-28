# Supabase Edge Functions for Payment Processing

This directory contains Supabase Edge Functions for handling payment processing with Stripe.

## Functions

### `create-checkout-session`

Creates a Stripe checkout session for premium subscription.

**Request:**
```json
{
  "price": "price_premium_monthly",
  "success_url": "https://example.com/personal",
  "cancel_url": "https://example.com/payment-cancel"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### `verify-payment-session`

Verifies a Stripe payment session and updates the user's subscription status.

**Request:**
```json
{
  "session_id": "cs_test_..."
}
```

**Response:**
```json
{
  "success": true,
  "session_status": "complete",
  "payment_status": "paid"
}
```

### `check-payment-status`

Checks a user's subscription status.

**Request:**
No request body needed. User is identified by the Authorization header.

**Response:**
```json
{
  "is_subscribed": true,
  "updated_at": "2023-01-01T00:00:00.000Z",
  "subscription_id": "sub_..."
}
```

### `get-payment-recovery-time`

Gets the estimated time until the payment system is back online when it's unavailable.

**Request:**
No request body needed. User is identified by the Authorization header.

**Response:**
```json
{
  "estimated_recovery_minutes": 30,
  "message": "Payment system is currently unavailable. Estimated recovery time: 30 minutes."
}
```

When the system is operational:
```json
{
  "estimated_recovery_minutes": 0,
  "message": "Payment system is operational."
}
```

## Environment Variables

The following environment variables need to be set in the Supabase project:

- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

## Local Development

To run these functions locally:

1. Install the Supabase CLI
2. Run the local development script:
   ```bash
   cd supabase/functions
   chmod +x local-dev.sh
   ./local-dev.sh
   ```
3. Test the functions with curl:
   ```bash
   curl -i --location --request POST 'http://localhost:54321/functions/v1/create-checkout-session' \
     --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
     --header 'Content-Type: application/json' \
     --data '{"price":"price_premium_monthly","success_url":"http://localhost:3000/personal","cancel_url":"http://localhost:3000/payment-cancel"}'
   ```

### CORS Configuration

CORS is handled in two ways:

1. **Shared CORS Middleware**: All functions use the shared CORS utilities from `_shared/cors.ts`
2. **Local Development**: CORS is configured in the `config.toml` file

## Database Schema

These functions expect a `user_subscriptions` table with the following schema:

```sql
CREATE TABLE user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  is_subscribed BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

## Troubleshooting

### CORS Errors

If you encounter CORS errors when calling Edge Functions:

1. **Local Development**:
   - Use the provided `local-dev.sh` script which sets up proper CORS headers:
     ```bash
     cd supabase/functions
     chmod +x local-dev.sh
     ./local-dev.sh
     ```
   - Or manually start functions with CORS headers:
     ```bash
     supabase functions serve --no-verify-jwt --cors=http://localhost:3000
     ```

2. **Production**:
   - Configure CORS in the Supabase dashboard:
     - Go to Project Settings → API → CORS
     - Add your frontend domain to the allowed origins
   - Ensure all Edge Functions use the `corsHeaders` helper

### Other Common Issues

If you encounter the error "Failed to send a request to the Edge Function", check the following:

1. **Environment Variables**: Ensure all required environment variables are set in the Supabase project.
   - Go to your Supabase dashboard → Project Settings → API → Environment variables
   - Add or verify `STRIPE_SECRET_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`

2. **Function Deployment**: Make sure the functions are properly deployed.
   - Run `supabase functions deploy create-checkout-session --project-ref your-project-ref`
   - Run `supabase functions deploy verify-payment-session --project-ref your-project-ref`
   - Run `supabase functions deploy check-payment-status --project-ref your-project-ref`

3. **Network Issues**: Check for network connectivity issues.
   - Verify your internet connection
   - Check if Supabase services are operational at https://status.supabase.com/

4. **Function Logs**: Check the function logs for errors.
   - Go to your Supabase dashboard → Edge Functions → Select the function → Logs
   - Look for any error messages that might indicate the issue 