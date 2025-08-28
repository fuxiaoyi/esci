// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "@supabase/supabase-js"
import Stripe from "https://esm.sh/stripe@13.2.0"
import { corsHeaders, handleCors } from "../_shared/cors.ts"

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Stripe with the secret key from environment variables
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16', // Use the latest API version
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get the request body
    const { session_id } = await req.json();

    // Validate required parameters
    if (!session_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameter: session_id' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the authenticated user from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
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
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Retrieve the Stripe checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Check if the session is valid and payment was successful
    const isSuccessful = session.payment_status === 'paid' && 
                         session.status === 'complete';
    
    // If payment was successful, update the user's subscription status
    if (isSuccessful && session.metadata?.user_id === user.id) {
      // Update the user's subscription status in the database
      const { error: dbError } = await supabaseClient
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          is_subscribed: true,
          updated_at: new Date().toISOString(),
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
        });

      if (dbError) {
        console.error('Error updating subscription status:', dbError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to update subscription status', 
            details: dbError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Return the verification result
    return new Response(
      JSON.stringify({ 
        success: isSuccessful,
        session_status: session.status,
        payment_status: session.payment_status
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        } 
      }
    );
  } catch (error) {
    console.error('Error verifying payment session:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to verify payment session', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        } 
      }
    );
  }
}); 