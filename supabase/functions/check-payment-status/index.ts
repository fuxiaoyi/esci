// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "@supabase/supabase-js"
import { corsHeaders, handleCors } from "../_shared/cors.ts"

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ 
      error: 'Method not allowed',
      available: false,
      message: 'There was an error processing your payment. Please try again.'
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get the authenticated user from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing Authorization header',
          available: false,
          message: 'Authentication error. Please sign in again and try.'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Get user information from the JWT claims
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    
    if (!user) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          available: false,
          message: 'Authentication error. Please sign in again and try.'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Query the user's subscription status
    const { data: subscriptionData, error: subscriptionError } = await supabaseClient
      .from('user_subscriptions')
      .select('is_subscribed, updated_at, stripe_subscription_id')
      .eq('user_id', user.id)
      .single();

    if (subscriptionError) {
      console.error('Error fetching subscription status:', subscriptionError);
      
      // If the error is "not found", it means the user doesn't have a subscription
      if (subscriptionError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ 
            is_subscribed: false,
            available: true,
            message: 'User has no subscription record'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch subscription status', 
          details: subscriptionError.message,
          available: false,
          message: 'There was an error processing your payment. Please try again.'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Return the subscription status
    return new Response(
      JSON.stringify({ 
        is_subscribed: subscriptionData?.is_subscribed || false,
        updated_at: subscriptionData?.updated_at,
        subscription_id: subscriptionData?.stripe_subscription_id,
        available: true,
        message: subscriptionData?.is_subscribed 
          ? "You already have an active subscription." 
          : "Payment system is available for purchase."
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error checking payment status:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to check payment status', 
        details: error.message,
        available: false,
        is_subscribed: false,
        message: "There was an error processing your payment. Please try again."
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/check-payment-status' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
