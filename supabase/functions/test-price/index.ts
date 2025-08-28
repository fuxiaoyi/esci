// Simple test script to verify the Stripe price ID

// @ts-ignore
import Stripe from "stripe";

// Define CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get the price ID from the query string
    const url = new URL(req.url);
    const priceId = url.searchParams.get('price_id') || 'price_1R2nNHFJ2yMtcs7vIzFrl28k';

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

    // Try to retrieve the price to validate it
    try {
      const priceObj = await stripe.prices.retrieve(priceId);
      console.log('Price retrieved successfully:', priceObj.id);
      
      return new Response(
        JSON.stringify({ 
          status: 'success',
          message: 'Price ID is valid',
          price: {
            id: priceObj.id,
            active: priceObj.active,
            currency: priceObj.currency,
            product: priceObj.product,
            type: priceObj.type,
            unit_amount: priceObj.unit_amount,
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } catch (priceError) {
      console.error('Error retrieving price:', priceError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid price ID',
          details: `The price ID '${priceId}' does not exist or is not accessible with your Stripe API key.`,
          message: priceError.message
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Error testing price ID:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to test price ID', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 