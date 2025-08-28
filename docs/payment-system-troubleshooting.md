# Payment System Troubleshooting Guide

This guide helps troubleshoot common issues with the payment system, particularly the "Failed to send a request to the Edge Function" error.

## Common Issues and Solutions

### 1. "Failed to send a request to the Edge Function"

This error occurs when the client-side application cannot communicate with the Supabase Edge Functions.

#### Possible Causes and Solutions:

1. **Edge Functions Not Deployed**
   - **Symptom**: Functions exist locally but aren't accessible in production
   - **Solution**: Deploy the functions using the provided script
     ```bash
     cd supabase/functions
     chmod +x deploy.sh
     ./deploy.sh your-project-ref
     ```

2. **Missing Environment Variables**
   - **Symptom**: Functions return 500 errors or authentication failures
   - **Solution**: Set the required environment variables in the Supabase dashboard
     - Go to Project Settings → API → Environment variables
     - Add:
       - `STRIPE_SECRET_KEY`
       - `SUPABASE_URL`
       - `SUPABASE_SERVICE_ROLE_KEY`

3. **CORS Issues**
   - **Symptom**: Browser console shows CORS errors
   - **Solution**: Configure CORS in the Supabase dashboard
     - Go to Project Settings → API → CORS
     - Add your frontend domain to the allowed origins (e.g., `https://yourdomain.com`)
     - For local development, add `http://localhost:3000`

4. **Network Connectivity**
   - **Symptom**: All requests to Supabase fail
   - **Solution**: Check your internet connection and Supabase status
     - Visit https://status.supabase.com/ to check service status
     - Try accessing other websites to verify your connection

5. **Function Errors**
   - **Symptom**: Functions deploy but return errors
   - **Solution**: Check the function logs in the Supabase dashboard
     - Go to Edge Functions → Select the function → Logs
     - Look for error messages and fix the code accordingly

### 2. Payment Processing Issues

1. **Stripe Configuration**
   - **Symptom**: Checkout session creation fails
   - **Solution**: Verify your Stripe configuration
     - Check that your Stripe API keys are correct
     - Ensure the price ID (`price_premium_monthly`) exists in your Stripe account
     - Verify that your Stripe account is properly set up for payments

2. **Subscription Status Not Updating**
   - **Symptom**: Payment succeeds but user isn't marked as subscribed
   - **Solution**: Check the database and verify the webhook
     - Manually check the `user_subscriptions` table in Supabase
     - Ensure the `verify-payment-session` function is working correctly
     - Check Stripe dashboard for successful payments

## Debugging Steps

1. **Enable Verbose Logging**
   - Add more console.log statements in the payment-service.ts file
   - Check browser console for detailed error messages

2. **Test Functions Locally**
   - Run Supabase locally: `supabase start`
   - Test functions with curl:
     ```bash
     curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-checkout-session' \
       --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
       --header 'Content-Type: application/json' \
       --data '{"price":"price_premium_monthly","success_url":"http://localhost:3000/personal","cancel_url":"http://localhost:3000/payment-cancel"}'
     ```

3. **Check Function Logs**
   - Supabase Dashboard → Edge Functions → Select function → Logs
   - Look for error messages or unexpected behavior

4. **Verify Database Schema**
   - Ensure the `user_subscriptions` table exists with the correct schema
   - Check that Row Level Security policies are correctly configured

## Preventive Measures

1. **Implement Fallback Mechanism**
   - Add a fallback payment method when Edge Functions are unavailable
   - Store payment intent locally and retry later

2. **Add Monitoring**
   - Set up alerts for Edge Function failures
   - Monitor Stripe webhook events for payment processing

3. **Regular Testing**
   - Periodically test the payment flow in a staging environment
   - Create test subscriptions to verify the entire process

## Contact Support

If you've tried all the troubleshooting steps and still encounter issues:

1. Gather the following information:
   - Error messages from the browser console
   - Function logs from the Supabase dashboard
   - Stripe payment logs (if applicable)
   - Steps to reproduce the issue

2. Contact support with the detailed information
   - Email: support@yourdomain.com
   - Include "Payment System Error" in the subject line 