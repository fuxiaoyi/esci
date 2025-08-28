// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// @ts-ignore
import { createClient } from "@supabase/supabase-js";
// @ts-ignore
import Stripe from "stripe";

// Define CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle CORS preflight requests
function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  return null;
}

// Main function handler
// @ts-ignore
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
    // Get the request body first to validate it
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body:', JSON.stringify(requestBody));
    } catch (jsonError) {
      console.error('Error parsing request JSON:', jsonError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { price, success_url, cancel_url } = requestBody;

    // Validate required parameters
    if (!price || !success_url || !cancel_url) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: price, success_url, or cancel_url',
          received: { price, success_url, cancel_url }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Stripe
    // @ts-ignore
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
    console.log('Stripe Key available:', !!stripeSecretKey);
    
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing Stripe environment variables',
          details: 'STRIPE_SECRET_KEY is not set in the environment'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Create Stripe instance with error handling
    let stripe;
    try {
      stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
        // @ts-ignore
        httpClient: Stripe.createFetchHttpClient(),
      });
    } catch (stripeError) {
      console.error('Error initializing Stripe:', stripeError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to initialize Stripe',
          details: stripeError.message
        }),
        { 
          status: 500, 
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
    console.log('Token available:', !!token);
    
    // Initialize Supabase client
    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    // @ts-ignore
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    // Log environment variables (without revealing full secrets)
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service Key available:', !!supabaseServiceKey);
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing Supabase environment variables',
          details: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set in the environment'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user information from the JWT claims
    let userResponse;
    try {
      userResponse = await supabaseClient.auth.getUser(token);
    } catch (authError) {
      console.error('Error getting user from token:', authError);
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate user', details: authError.message }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { data: { user }, error: userError } = userResponse;
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log('User authenticated:', user.id);

    // Create a Stripe checkout session with simplified parameters
    let session;
    try {
      // First, try to retrieve the price to validate it
      try {
        const priceObj = await stripe.prices.retrieve(price);
        console.log('Price retrieved successfully:', priceObj.id);
      } catch (priceError) {
        console.error('Error retrieving price:', priceError);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid price ID',
            details: `The price ID '${price}' does not exist or is not accessible with your Stripe API key.`
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Create the checkout session with minimal required parameters
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: price,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: success_url,
        cancel_url: cancel_url,
        customer_email: user.email,
      });
      
      console.log('Checkout session created:', session.id);
    } catch (stripeError) {
      console.error('Error creating Stripe checkout session:', stripeError);
      
      // Check for specific Stripe errors
      if (stripeError.type === 'StripeInvalidRequestError') {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid Stripe request',
            details: stripeError.message
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create Stripe checkout session',
          details: stripeError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Return the checkout session URL
    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create checkout session', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
